import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { formatCurrency } from '../lib/calculations';
import { downloadReceipt } from '../lib/pdfReceipt';
import type { Rental } from '../types';
import { Car, Download, Search, Calendar, CheckCircle, AlertTriangle } from 'lucide-react';

export default function Rentals() {
    const [rentals, setRentals] = useState<Rental[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [selectedRental, setSelectedRental] = useState<Rental | null>(null);
    const [isReturning, setIsReturning] = useState(false);
    const [returnKm, setReturnKm] = useState<string>('');
    const [returnDamages, setReturnDamages] = useState<string>('');
    const [updating, setUpdating] = useState(false);

    useEffect(() => {
        async function fetchRentals() {
            const { data, error } = await supabase
                .from('rentals')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(50);

            if (data && !error) {
                setRentals(data);
            }
            setLoading(false);
        }
        fetchRentals();
    }, []);

    const filtered = rentals.filter(
        (r) =>
            r.license_plate.toLowerCase().includes(search.toLowerCase()) ||
            (r.customer_name && r.customer_name.toLowerCase().includes(search.toLowerCase())) ||
            (r.category_name && r.category_name.toLowerCase().includes(search.toLowerCase()))
    );

    const handleReturnSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedRental || !selectedRental.id) return;
        
        setUpdating(true);
        const { data, error } = await supabase
            .from('rentals')
            .update({
                status: 'completed',
                return_km: parseInt(returnKm) || 0,
                return_damages: returnDamages,
                returned_at: new Date().toISOString(),
            })
            .eq('id', selectedRental.id)
            .select()
            .single();

        setUpdating(false);

        if (data && !error) {
            const updated = data as Rental;
            // Update local list
            setRentals((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
            setSelectedRental(updated);
            setIsReturning(false);
        } else {
            alert('Failed to process vehicle return.');
        }
    };

    if (selectedRental) {
        return (
            <div className="animate-fade-in">
                <button
                    className="btn btn--ghost mb-md"
                    onClick={() => {
                        if (isReturning) {
                            setIsReturning(false);
                        } else {
                            setSelectedRental(null);
                        }
                    }}
                >
                    {isReturning ? '← Cancel Return' : '← Back to list'}
                </button>

                {isReturning ? (
                    <div className="card card--elevated mb-md animate-fade-in">
                        <div className="card__title">
                            <CheckCircle size={18} className="text-success" />
                            Return Vehicle — {selectedRental.license_plate}
                        </div>
                        <form onSubmit={handleReturnSubmit}>
                            <div className="form-group">
                                <label className="form-label" htmlFor="returnKm">Kilometers Driven</label>
                                <input
                                    id="returnKm"
                                    type="number"
                                    min="0"
                                    required
                                    className="form-input"
                                    placeholder="e.g. 150"
                                    value={returnKm}
                                    onChange={(e) => setReturnKm(e.target.value)}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label" htmlFor="returnDamages">Damages & Notes (Optional)</label>
                                <textarea
                                    id="returnDamages"
                                    className="form-input"
                                    rows={3}
                                    placeholder="Any scratches, dents, or notes..."
                                    value={returnDamages}
                                    onChange={(e) => setReturnDamages(e.target.value)}
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={updating || !returnKm}
                                className="btn btn--primary btn--full mt-md"
                            >
                                {updating ? 'Saving...' : 'Confirm Return'}
                            </button>
                        </form>
                    </div>
                ) : (
                    <div className="card card--elevated mb-md animate-fade-in">
                    <div className="card__title">
                        <Car size={18} className="card__title-icon" />
                        {selectedRental.license_plate}
                    </div>

                    <div className="financial-summary__row">
                        <span>Category</span>
                        <span className="badge badge--info">{selectedRental.category_name || 'N/A'}</span>
                    </div>
                    <div className="financial-summary__row">
                        <span>Customer</span>
                        <span className="financial-summary__value">{selectedRental.customer_name || 'N/A'}</span>
                    </div>
                    <div className="financial-summary__row">
                        <span>Hotel / Room</span>
                        <span className="financial-summary__value">
                            {selectedRental.hotel_name || 'N/A'} / {selectedRental.room_number || 'N/A'}
                        </span>
                    </div>
                    <div className="section-divider">Financial</div>

                    <div className="financial-summary__row">
                        <span>Price / Day</span>
                        <span className="financial-summary__value">{formatCurrency(selectedRental.price_per_day)}</span>
                    </div>
                    <div className="financial-summary__row">
                        <span>Days</span>
                        <span className="financial-summary__value">{selectedRental.num_days}</span>
                    </div>
                    <div className="financial-summary__row financial-summary__row--divider">
                        <span>Subtotal</span>
                        <span className="financial-summary__value">{formatCurrency(selectedRental.subtotal)}</span>
                    </div>
                    <div className="financial-summary__row">
                        <span>VAT ({selectedRental.vat_rate}%)</span>
                        <span className="financial-summary__value">{formatCurrency(selectedRental.vat_amount)}</span>
                    </div>
                    <div className="financial-summary__row financial-summary__row--total">
                        <span>Total</span>
                        <span className="financial-summary__value">{formatCurrency(selectedRental.total)}</span>
                    </div>

                    <button
                        className="btn btn--primary btn--full mt-lg"
                        onClick={() => downloadReceipt(selectedRental, selectedRental.category_name || 'Unknown')}
                    >
                        <Download size={18} />
                        Download Receipt
                    </button>

                    {(!selectedRental.status || selectedRental.status === 'active') && (
                        <button
                            className="btn btn--secondary btn--full mt-md"
                            onClick={() => {
                                setReturnKm('');
                                setReturnDamages('');
                                setIsReturning(true);
                            }}
                        >
                            <AlertTriangle size={18} />
                            Process Vehicle Return
                        </button>
                    )}
                </div>
                )}
            </div>
        );
    }

    return (
        <>
            <div className="page-header">
                <h1 className="page-header__title">Rental History</h1>
                <p className="page-header__description">
                    Browse and manage past rentals
                </p>
            </div>

            {/* Search */}
            <div className="form-group">
                <div style={{ position: 'relative' }}>
                    <Search
                        size={16}
                        style={{
                            position: 'absolute',
                            left: '14px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            color: 'var(--text-muted)',
                        }}
                    />
                    <input
                        className="form-input"
                        type="text"
                        placeholder="Search by plate, name, or category..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        style={{ paddingLeft: '38px' }}
                    />
                </div>
            </div>

            {/* Results */}
            {loading ? (
                <div className="text-center mt-lg">
                    <div className="spinner spinner--lg" style={{ margin: '0 auto' }} />
                </div>
            ) : filtered.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state__icon">📋</div>
                    <div className="empty-state__text">
                        {search ? 'No matching rentals found' : 'No rentals yet. Create your first one!'}
                    </div>
                </div>
            ) : (
                <div className="stagger">
                    {filtered.map((rental) => (
                        <div
                            key={rental.id}
                            className="rental-item animate-fade-in"
                            onClick={() => setSelectedRental(rental)}
                        >
                            <div className="rental-item__icon">
                                <Car size={20} />
                            </div>
                            <div className="rental-item__info">
                                <div className="rental-item__plate">{rental.license_plate}</div>
                                <div className="rental-item__details">
                                    <Calendar size={10} style={{ display: 'inline', verticalAlign: 'middle' }} />{' '}
                                    {rental.created_at
                                        ? new Date(rental.created_at).toLocaleDateString()
                                        : 'N/A'}
                                    {' · '}
                                    {rental.category_name || 'N/A'}
                                    {rental.customer_name ? ` · ${rental.customer_name}` : ''}
                                </div>
                                {rental.status === 'completed' && (
                                    <div className="badge badge--success mt-xs" style={{ marginTop: '4px' }}>Completed</div>
                                )}
                            </div>
                            <div className="rental-item__total">{formatCurrency(rental.total)}</div>
                        </div>
                    ))}
                </div>
            )}
        </>
    );
}
