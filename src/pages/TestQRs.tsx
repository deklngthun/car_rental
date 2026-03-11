import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import type { Vehicle } from '../types';
import QRCode from 'react-qr-code';

export default function TestQRs() {
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchVehicles() {
            const { data } = await supabase.from('vehicles').select('*');
            if (data) setVehicles(data);
            setLoading(false);
        }
        fetchVehicles();
    }, []);

    if (loading) {
        return (
            <div className="text-center mt-xl">
                <div className="spinner spinner--lg" />
            </div>
        );
    }

    return (
        <div className="animate-fade-in pb-xl">
            <div className="page-header mb-md">
                <h1 className="page-header__title">QR Test Bench</h1>
                <p className="page-header__description">
                    Scan these generated codes with your phone's camera on the New Rental page!
                </p>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
                {vehicles.map(v => (
                    <div key={v.id} className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', border: '1px solid var(--border-primary)' }}>
                        <div style={{ background: 'white', padding: '16px', borderRadius: '12px', marginBottom: '16px', display: 'inline-block' }}>
                            <QRCode value={v.license_plate} size={150} />
                        </div>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: 'white' }}>{v.make_model}</h2>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>Plate: <strong style={{ color: 'white' }}>{v.license_plate}</strong></div>
                        <div style={{ marginTop: '12px' }} className="badge badge--success">Ready to Scan</div>
                    </div>
                ))}

                {vehicles.length === 0 && (
                    <div className="card border" style={{ borderColor: 'var(--accent-warning)', padding: '24px', textAlign: 'center' }}>
                        <span style={{ color: 'var(--accent-warning)', fontWeight: 600 }}>Zero Vehicles in Database!</span>
                        <p className="text-muted mt-sm" style={{ fontSize: '0.9rem' }}>
                            Please run the provided SQL script in your Supabase dashboard to seed the application with test vehicles.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
