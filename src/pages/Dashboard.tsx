import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabaseClient';
import { formatCurrency } from '../lib/calculations';
import type { Rental } from '../types';
import { Link } from 'react-router-dom';
import { 
    PlusCircle, 
    Car, 
    AlertCircle, 
    TrendingUp, 
    CheckCircle,
    Calendar
} from 'lucide-react';

export default function Dashboard() {
    const [rentals, setRentals] = useState<Rental[]>([]);
    const [todayRevenue, setTodayRevenue] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchDashboardData() {
            const { data: allRentals } = await supabase
                .from('rentals')
                .select('*')
                .order('created_at', { ascending: false });
                
            if (allRentals) {
                setRentals(allRentals);
            }

            const today = new Date().toISOString().split('T')[0];
            const { data: revData } = await supabase
                .from('daily_revenue')
                .select('net_revenue')
                .eq('rental_date', today)
                .single();
                
            if (revData) {
                setTodayRevenue(revData.net_revenue || 0);
            }

            setLoading(false);
        }

        fetchDashboardData();
    }, []);

    const stats = useMemo(() => {
        const uniqueFleet = new Set(rentals.map(r => r.license_plate));
        const totalFleetSize = uniqueFleet.size;

        const now = new Date();
        const activeRentals = rentals.filter(r => !r.status || r.status === 'active');
        
        let overdueCount = 0;
        const activeCount = activeRentals.length;

        activeRentals.forEach(r => {
            if (r.created_at) {
                const expectedReturn = new Date(r.created_at);
                expectedReturn.setDate(expectedReturn.getDate() + r.num_days);
                if (now > expectedReturn) {
                    overdueCount++;
                }
            }
        });

        const availableCount = Math.max(0, totalFleetSize - activeCount);

        return {
            totalFleetSize,
            activeCount,
            availableCount,
            overdueCount
        };
    }, [rentals]);

    const recentRentals = useMemo(() => {
        return rentals.slice(0, 5);
    }, [rentals]);

    if (loading) {
        return (
            <div className="text-center mt-xl">
                <div className="spinner spinner--lg" />
            </div>
        );
    }

    return (
        <div className="animate-fade-in pb-xl" style={{ paddingBottom: '90px' }}>
            {/* Greeting Header */}
            <div className="mb-md" style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', border: '1px solid var(--border-primary)' }}>
                <div>
                    <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0, color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        Good morning, Staff! 🚀
                    </h1>
                    <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>
                        Here's what's happening today — {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    <Link 
                        to="/new" 
                        style={{
                            display: 'flex', alignItems: 'center', gap: '8px', 
                            padding: '10px 24px', borderRadius: '50px',
                            background: 'linear-gradient(90deg, #10b981, #06b6d4)', 
                            color: 'white', fontWeight: 600, fontSize: '0.9rem',
                            textDecoration: 'none', border: 'none',
                            boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)'
                        }}
                    >
                        <PlusCircle size={18} /> New Rental
                    </Link>
                    <Link 
                        to="/schedule" 
                        style={{
                            display: 'flex', alignItems: 'center', gap: '8px', 
                            padding: '10px 24px', borderRadius: '50px',
                            background: 'transparent',
                            color: '#fef08a', fontWeight: 600, fontSize: '0.9rem',
                            textDecoration: 'none', border: '1px solid #fef08a'
                        }}
                    >
                        <Calendar size={18} /> View Schedule
                    </Link>
                </div>
            </div>

            {/* Stat Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                <div className="card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px', border: '1px solid var(--border-primary)', borderRadius: 'var(--radius-lg)' }}>
                    <div style={{ background: '#3b82f6', width: '56px', height: '56px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                        <TrendingUp size={28} />
                    </div>
                    <div>
                        <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'white', lineHeight: 1.2 }}>{formatCurrency(todayRevenue)}</div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Today's Revenue</div>
                    </div>
                </div>

                <div className="card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px', border: '1px solid var(--border-primary)', borderRadius: 'var(--radius-lg)' }}>
                    <div style={{ background: '#22c55e', width: '56px', height: '56px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                        <Car size={28} />
                    </div>
                    <div>
                        <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'white', lineHeight: 1.2 }}>{stats.activeCount}</div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Active Rentals</div>
                    </div>
                </div>

                <div className="card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px', border: '1px solid var(--border-primary)', borderRadius: 'var(--radius-lg)' }}>
                    <div style={{ background: '#eab308', width: '56px', height: '56px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                        <CheckCircle size={28} />
                    </div>
                    <div>
                        <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'white', lineHeight: 1.2 }}>{stats.availableCount}</div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Cars Available</div>
                    </div>
                </div>

                <div className="card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px', border: '1px solid var(--border-primary)', borderRadius: 'var(--radius-lg)' }}>
                    <div style={{ background: '#ec4899', width: '56px', height: '56px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                        <AlertCircle size={28} />
                    </div>
                    <div>
                        <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'white', lineHeight: 1.2 }}>{stats.overdueCount}</div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Overdue</div>
                    </div>
                </div>
            </div>

            {/* Recent Rentals Table Area */}
            <div className="card" style={{ padding: '24px', border: '1px solid var(--border-primary)', borderRadius: 'var(--radius-lg)', marginBottom: '24px', overflowX: 'auto', background: 'var(--bg-card)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: 'white' }}>Recent Rentals</h2>
                    <Link to="/rentals" style={{ color: '#fef08a', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 600 }}>View History ➝</Link>
                </div>
                
                {recentRentals.length === 0 ? (
                    <p className="text-muted text-sm pb-lg">No rentals explicitly recorded yet.</p>
                ) : (
                    <table style={{ width: '100%', minWidth: '700px', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid var(--border-primary)', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                <th style={{ paddingBottom: '16px', fontWeight: 600 }}>Receipt</th>
                                <th style={{ paddingBottom: '16px', fontWeight: 600 }}>Customer</th>
                                <th style={{ paddingBottom: '16px', fontWeight: 600 }}>Plate</th>
                                <th style={{ paddingBottom: '16px', fontWeight: 600 }}>Category</th>
                                <th style={{ paddingBottom: '16px', fontWeight: 600 }}>Days</th>
                                <th style={{ paddingBottom: '16px', fontWeight: 600 }}>Total</th>
                                <th style={{ paddingBottom: '16px', fontWeight: 600 }}>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {recentRentals.map(rental => {
                                const isCompleted = rental.status === 'completed';
                                let isOverdue = false;
                                if (!isCompleted && rental.created_at) {
                                    const expectedReturn = new Date(rental.created_at);
                                    expectedReturn.setDate(expectedReturn.getDate() + rental.num_days);
                                    if (new Date() > expectedReturn) isOverdue = true;
                                }

                                const statusText = isCompleted ? 'Completed' : isOverdue ? 'Overdue' : 'Active';
                                const badgeColor = isCompleted ? 'rgba(16, 185, 129, 0.15)' : isOverdue ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)';
                                const badgeText = isCompleted ? '#34d399' : isOverdue ? '#f87171' : '#fbbf24';

                                return (
                                    <tr key={rental.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                        <td style={{ padding: '20px 0', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                                            {rental.receipt_url ? 'A5-DOC' : `A5-${new Date(rental.created_at || '').getFullYear()}-${rental.id?.substring(0,4)}`}
                                        </td>
                                        <td style={{ padding: '20px 0', fontSize: '0.9rem', color: 'white', fontWeight: 500 }}>{rental.customer_name || 'N/A'}</td>
                                        <td style={{ padding: '20px 0', fontSize: '0.9rem', color: 'white' }}>{rental.license_plate}</td>
                                        <td style={{ padding: '20px 0', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{rental.category_name}</td>
                                        <td style={{ padding: '20px 0', fontSize: '0.9rem', color: 'white' }}>{rental.num_days}</td>
                                        <td style={{ padding: '20px 0', fontSize: '0.9rem', color: 'white', fontWeight: 600 }}>{formatCurrency(rental.total)}</td>
                                        <td style={{ padding: '20px 0' }}>
                                            <span style={{ 
                                                background: badgeColor, color: badgeText, 
                                                padding: '6px 12px', borderRadius: '999px', 
                                                fontSize: '0.75rem', fontWeight: 600 
                                            }}>
                                                {statusText}
                                            </span>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Bottom Banner */}
            <div style={{
                background: 'linear-gradient(135deg, #09090b 0%, #161e2e 100%)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border-primary)',
                padding: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                overflow: 'hidden',
                position: 'relative'
            }}>
                <div style={{ position: 'relative', zIndex: 10, maxWidth: '600px' }}>
                    <h3 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0, color: 'white', marginBottom: '12px' }}>
                        Fast rentals. Clean receipts. Happy customers.
                    </h3>
                    <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '1rem' }}>
                        Capture plates with QR • Auto-calculate VAT • Print A5 receipts • Track every dollar
                    </p>
                </div>
                <div style={{
                    position: 'absolute',
                    right: 0,
                    top: 0,
                    bottom: 0,
                    width: '50%',
                    background: 'url("https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&q=80&w=1200") center/cover no-repeat',
                    WebkitMaskImage: 'linear-gradient(to right, transparent, black 60%)',
                    maskImage: 'linear-gradient(to right, transparent, black 60%)',
                    opacity: 0.7
                }}></div>
            </div>

        </div>
    );
}
