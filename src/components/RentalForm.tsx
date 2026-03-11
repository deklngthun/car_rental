import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { getFinancialBreakdown, formatCurrency } from '../lib/calculations';
import { recognizePassportName } from '../lib/ocr';
import { downloadReceipt } from '../lib/pdfReceipt';
import { sendRentalToMake } from '../lib/webhooks';
import ImageCapture from './ImageCapture';
import QrScanner from './QrScanner';
import FinancialSummary from './FinancialSummary';
import type { Category, RentalFormData, Rental, FinancialBreakdown } from '../types';
import { Car, User, Building2, Hash, FileText, Save, Download } from 'lucide-react';

export default function RentalForm() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(false);
    const [ocrProcessing, setOcrProcessing] = useState<'plate' | 'passport' | null>(null);
    const [savedRental, setSavedRental] = useState<Rental | null>(null);
    const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    const [formData, setFormData] = useState<RentalFormData>({
        licensePlate: '',
        licensePlateImage: null,
        passportImage: null,
        customerName: '',
        hotelName: '',
        roomNumber: '',
        categoryId: '',
        pricePerDay: 0,
        numDays: 1,
    });

    const [passportPreview, setPassportPreview] = useState<string | undefined>();
    const [scannedQrData, setScannedQrData] = useState<string | null>(null);

    // Fetch categories on mount
    useEffect(() => {
        async function fetchCategories() {
            const { data, error } = await supabase
                .from('categories')
                .select('*')
                .order('name');

            if (data && !error) {
                setCategories(data);
                if (data.length > 0) {
                    setFormData((prev) => ({ ...prev, categoryId: data[0].id }));
                }
            }
        }
        fetchCategories();
    }, []);

    // Get selected category VAT rate
    const selectedCategory = useMemo(
        () => categories.find((c) => c.id === formData.categoryId),
        [categories, formData.categoryId]
    );

    // Calculate financial breakdown
    const breakdown: FinancialBreakdown | null = useMemo(() => {
        if (formData.pricePerDay > 0 && formData.numDays > 0 && selectedCategory) {
            return getFinancialBreakdown(
                formData.pricePerDay,
                formData.numDays,
                selectedCategory.vat_rate
            );
        }
        return null;
    }, [formData.pricePerDay, formData.numDays, selectedCategory]);

    const updateField = (field: keyof RentalFormData, value: string | number | File | null) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    // Handle QR code parse and vehicle query
    const handleQrScan = useCallback(async (text: string) => {
        try {
            let licensePlate = text;
            try {
                // If it's legacy JSON mapping format
                const data = JSON.parse(text);
                if (data.licensePlate) licensePlate = data.licensePlate;
            } catch {
                // Fallback: it's a raw string, we'll trim it
                licensePlate = text.trim();
            }

            // Instantly query the vehicles database layer
            const { data: vehicleData, error } = await supabase
                .from('vehicles')
                .select('*')
                .eq('license_plate', licensePlate)
                .single();

            if (vehicleData && !error) {
                setFormData(prev => ({
                    ...prev,
                    licensePlate: vehicleData.license_plate,
                    categoryId: vehicleData.category_id
                }));
                setScannedQrData(text);
                showToast('success', `Vehicle Found: ${vehicleData.make_model}`);
            } else {
                // If the query failed, fallback to manual category selection with the plate string
                setFormData(prev => ({ ...prev, licensePlate }));
                setScannedQrData(text);
                showToast('error', 'Unregistered Vehicle. Please fill manually.');
            }
        } catch (err) {
            console.error('QR Scan error:', err);
            showToast('error', 'Failed to process QR code');
        }
    }, []);

    // Handle passport image capture + OCR
    const handlePassportCapture = useCallback(async (file: File) => {
        updateField('passportImage', file);
        setPassportPreview(URL.createObjectURL(file));
        setOcrProcessing('passport');

        try {
            const name = await recognizePassportName(file);
            if (name) {
                setFormData((prev) => ({ ...prev, customerName: name }));
            }
        } catch (err) {
            console.error('Passport OCR error:', err);
        } finally {
            setOcrProcessing(null);
        }
    }, []);

    const showToast = (type: 'success' | 'error', message: string) => {
        setToast({ type, message });
        setTimeout(() => setToast(null), 3000);
    };

    // Upload image to Supabase Storage
    const uploadImage = async (file: File, folder: string): Promise<string | null> => {
        const ext = file.name.split('.').pop();
        const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;

        const { error } = await supabase.storage
            .from('rental-images')
            .upload(fileName, file);

        if (error) {
            console.error('Upload error:', error);
            return null;
        }

        const { data: urlData } = supabase.storage
            .from('rental-images')
            .getPublicUrl(fileName);

        return urlData.publicUrl;
    };

    // Save rental
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!breakdown || !selectedCategory) return;

        setLoading(true);
        try {
            // Upload passport image if present
            let passportImageUrl: string | null = null;

            if (formData.passportImage) {
                passportImageUrl = await uploadImage(formData.passportImage, 'passports');
            }

            const rentalData: Omit<Rental, 'id' | 'created_at'> = {
                license_plate: formData.licensePlate,
                passport_image_url: passportImageUrl || undefined,
                customer_name: formData.customerName || undefined,
                hotel_name: formData.hotelName || undefined,
                room_number: formData.roomNumber || undefined,
                category_id: formData.categoryId,
                category_name: selectedCategory.name,
                price_per_day: breakdown.pricePerDay,
                num_days: breakdown.numDays,
                subtotal: breakdown.subtotal,
                vat_rate: breakdown.vatRate,
                vat_amount: breakdown.vatAmount,
                total: breakdown.total,
            };

            const { data, error } = await supabase
                .from('rentals')
                .insert(rentalData)
                .select()
                .single();

            if (error) throw error;

            const saved = data as Rental;
            setSavedRental(saved);
            showToast('success', 'Rental saved successfully!');

            // Fire webhook in background
            sendRentalToMake(saved).catch(console.error);
        } catch (err) {
            console.error('Save error:', err);
            showToast('error', 'Failed to save rental. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Download receipt
    const handleDownloadReceipt = () => {
        if (!savedRental || !selectedCategory) return;
        downloadReceipt(savedRental, selectedCategory.name);
    };

    // Reset form for new rental
    const handleNewRental = () => {
        setFormData({
            licensePlate: '',
            licensePlateImage: null,
            passportImage: null,
            customerName: '',
            hotelName: '',
            roomNumber: '',
            categoryId: categories[0]?.id || '',
            pricePerDay: 0,
            numDays: 1,
        });
        setScannedQrData(null);
        setPassportPreview(undefined);
        setSavedRental(null);
    };

    const isValid =
        formData.licensePlate.trim() !== '' &&
        formData.pricePerDay > 0 &&
        formData.numDays > 0 &&
        formData.categoryId !== '';

    // Show receipt view after saving
    if (savedRental) {
        return (
            <div className="stagger">
                <div className="card card--elevated animate-fade-in">
                    <div className="text-center" style={{ padding: '16px 0' }}>
                        <div style={{ fontSize: '48px', marginBottom: '8px' }}>✅</div>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '4px' }}>
                            Rental Saved!
                        </h2>
                        <p className="text-sm text-muted">
                            {savedRental.license_plate} — {selectedCategory?.name}
                        </p>
                    </div>

                    <FinancialSummary breakdown={breakdown} />

                    <div className="flex flex-col gap-sm mt-lg">
                        <button className="btn btn--primary btn--full" onClick={handleDownloadReceipt}>
                            <Download size={18} />
                            Download Receipt (PDF)
                        </button>
                        <button className="btn btn--secondary btn--full" onClick={handleNewRental}>
                            <FileText size={18} />
                            New Rental
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <>
            {toast && (
                <div className={`toast toast--${toast.type}`}>{toast.message}</div>
            )}

            <form onSubmit={handleSubmit} className="stagger">
                {/* Vehicle Section */}
                <div className="card card--elevated animate-fade-in mb-md">
                    <div className="card__title">
                        <Car size={18} className="card__title-icon" />
                        Vehicle Details
                    </div>

                    <div className="form-group">
                        <label className="form-label">Vehicle QR Code</label>
                        {scannedQrData ? (
                            <div className="flex justify-between items-center p-md bg-input rounded-md border border-success">
                                <span className="text-success font-semibold flex items-center gap-sm">
                                    <Car size={16} /> Data Extracted Succesfully
                                </span>
                                <button type="button" className="btn btn--secondary btn--sm" onClick={() => setScannedQrData(null)}>
                                    Rescan
                                </button>
                            </div>
                        ) : (
                            <QrScanner onScan={handleQrScan} />
                        )}
                    </div>

                    <div className="form-group">
                        <label className="form-label" htmlFor="licensePlate">
                            License Plate Number
                        </label>
                        <input
                            id="licensePlate"
                            className="form-input"
                            type="text"
                            placeholder="e.g. AB 1234 CD"
                            value={formData.licensePlate}
                            onChange={(e) => updateField('licensePlate', e.target.value.toUpperCase())}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label" htmlFor="category">
                            Rental Category
                        </label>
                        <select
                            id="category"
                            className="form-input form-select"
                            value={formData.categoryId}
                            onChange={(e) => updateField('categoryId', e.target.value)}
                            required
                        >
                            <option value="">Select category...</option>
                            {categories.map((cat) => (
                                <option key={cat.id} value={cat.id}>
                                    {cat.name} (VAT: {cat.vat_rate}%)
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Customer Section */}
                <div className="card card--elevated animate-fade-in mb-md">
                    <div className="card__title">
                        <User size={18} className="card__title-icon" />
                        Customer Details
                    </div>

                    <div className="form-group">
                        <label className="form-label">Passport Scan (Optional)</label>
                        <ImageCapture
                            label="Scan Passport"
                            onImageCaptured={handlePassportCapture}
                            onClear={() => {
                                setPassportPreview(undefined);
                                updateField('passportImage', null);
                            }}
                            processing={ocrProcessing === 'passport'}
                            processingText="Reading passport name..."
                            previewUrl={passportPreview}
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label" htmlFor="customerName">
                            Customer Name
                        </label>
                        <input
                            id="customerName"
                            className="form-input"
                            type="text"
                            placeholder="John Doe"
                            value={formData.customerName}
                            onChange={(e) => updateField('customerName', e.target.value)}
                        />
                    </div>

                    <div className="flex gap-md">
                        <div className="form-group" style={{ flex: 1 }}>
                            <label className="form-label" htmlFor="hotelName">
                                <Building2 size={14} style={{ display: 'inline', verticalAlign: 'middle' }} />{' '}
                                Hotel Name
                            </label>
                            <input
                                id="hotelName"
                                className="form-input"
                                type="text"
                                placeholder="Hotel name"
                                value={formData.hotelName}
                                onChange={(e) => updateField('hotelName', e.target.value)}
                            />
                        </div>
                        <div className="form-group" style={{ flex: 0.5 }}>
                            <label className="form-label" htmlFor="roomNumber">
                                <Hash size={14} style={{ display: 'inline', verticalAlign: 'middle' }} />{' '}
                                Room
                            </label>
                            <input
                                id="roomNumber"
                                className="form-input"
                                type="text"
                                placeholder="205"
                                value={formData.roomNumber}
                                onChange={(e) => updateField('roomNumber', e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                {/* Pricing Section */}
                <div className="card card--elevated animate-fade-in mb-md">
                    <div className="card__title">
                        <FileText size={18} className="card__title-icon" />
                        Pricing
                    </div>

                    <div className="flex gap-md">
                        <div className="form-group" style={{ flex: 1 }}>
                            <label className="form-label" htmlFor="pricePerDay">
                                Price per Day
                            </label>
                            <input
                                id="pricePerDay"
                                className="form-input"
                                type="number"
                                min="0"
                                step="0.01"
                                placeholder="0.00"
                                value={formData.pricePerDay || ''}
                                onChange={(e) => updateField('pricePerDay', parseFloat(e.target.value) || 0)}
                                required
                            />
                        </div>
                        <div className="form-group" style={{ flex: 0.6 }}>
                            <label className="form-label" htmlFor="numDays">
                                Number of Days
                            </label>
                            <input
                                id="numDays"
                                className="form-input"
                                type="number"
                                min="1"
                                step="1"
                                value={formData.numDays}
                                onChange={(e) => updateField('numDays', parseInt(e.target.value) || 1)}
                                required
                            />
                        </div>
                    </div>
                </div>

                {/* Financial Summary */}
                <div className="animate-fade-in mb-md">
                    <FinancialSummary breakdown={breakdown} />
                </div>

                {/* Submit */}
                <button
                    type="submit"
                    className="btn btn--primary btn--full btn--lg animate-fade-in"
                    disabled={!isValid || loading}
                >
                    {loading ? (
                        <>
                            <div className="spinner" />
                            Saving...
                        </>
                    ) : (
                        <>
                            <Save size={20} />
                            Save Rental — {breakdown ? formatCurrency(breakdown.total) : '0.00'}
                        </>
                    )}
                </button>
            </form>
        </>
    );
}
