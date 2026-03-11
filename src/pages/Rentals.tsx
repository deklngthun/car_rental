import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { formatCurrency } from '../lib/calculations';
import { downloadReceipt } from '../lib/pdfReceipt';
import type { Rental } from '../types';
import { Car, Download, Search, Calendar } from 'lucide-react';

export default function Rentals() {
    const [rentals, setRentals] = useState<Rental[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [selectedRental, setSelectedRental] = useState<Rental | null>(null);

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

    if (selectedRental) {
        return (
            <div className="animate-fade-in">
                <button
                    className="btn btn--ghost mb-md"
                    onClick={() => setSelectedRental(null)}
                >
                    ← Back to list
                </button>

                <div className="card card--elevated mb-md">
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
                </div>
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
                            </div>
                            <div className="rental-item__total">{formatCurrency(rental.total)}</div>
                        </div>
                    ))}
                </div>
            )}
        </>
    );
}
