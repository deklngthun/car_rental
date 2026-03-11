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
    Clock
} from 'lucide-react';

export default function Dashboard() {
    const [rentals, setRentals] = useState<Rental[]>([]);
    const [todayRevenue, setTodayRevenue] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchDashboardData() {
            // Fetch all rentals for fleet calculation (in a real app, use a dedicated RPC or paginate)
            const { data: allRentals } = await supabase
                .from('rentals')
                .select('*')
                .order('created_at', { ascending: false });
                
            if (allRentals) {
                setRentals(allRentals);
            }

            // Fetch today's revenue
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
        
        // Active rentals include anything without 'completed' status
        const activeRentals = rentals.filter(r => !r.status || r.status === 'active');
        
        let overdueCount = 0;
        const activeCount = activeRentals.length;

        activeRentals.forEach(r => {
            if (r.created_at) {
                const expectedReturn = new Date(r.created_at);
                expectedReturn.setDate(expectedReturn.getDate() + r.num_days);
                
                // If the end of the expected return day has passed
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

    return (
        <div className="animate-fade-in">
            {/* Greeting Header */}
            <div className="page-header flex justify-between items-center bg-card p-md rounded-lg mb-lg border border-border shadow-sm">
                <div>
                    <h1 className="page-header__title" style={{ marginBottom: '4px' }}>Good Morning, Staff</h1>
                    <p className="page-header__description m-0">Here's what's happening today.</p>
                </div>
                <div style={{ background: 'var(--bg-primary)', padding: '12px', borderRadius: '50%' }}>
                    ☀️
                </div>
            </div>

            {/* Quick Actions */}
            <div className="mb-lg">
                <Link to="/new" className="btn btn--primary btn--full" style={{ padding: '16px', fontSize: '1.1rem' }}>
                    <PlusCircle size={24} className="mr-sm" />
                    Create New Rental
                </Link>
            </div>

            {loading ? (
                <div className="text-center mt-xl">
                    <div className="spinner spinner--lg" />
                </div>
            ) : (
                <>
                    {/* Stat Cards */}
                    <div className="grid grid-cols-2 gap-sm mb-lg">
                        <div className="stat-card">
                            <div className="stat-card__title">
                                <TrendingUp size={16} /> Today's Revenue
                            </div>
                            <div className="stat-card__value text-success">{formatCurrency(todayRevenue)}</div>
                        </div>

                        <div className="stat-card">
                            <div className="stat-card__title">
                                <Car size={16} /> Active Rentals
                            </div>
                            <div className="stat-card__value">{stats.activeCount}</div>
                        </div>

                        <div className="stat-card">
                            <div className="stat-card__title">
                                <CheckCircle size={16} /> Available Vehicles
                            </div>
                            <div className="stat-card__value">{stats.availableCount}</div>
                        </div>

                        <div className="stat-card" style={{ borderColor: stats.overdueCount > 0 ? 'var(--danger)' : '' }}>
                            <div className="stat-card__title" style={{ color: stats.overdueCount > 0 ? 'var(--danger)' : '' }}>
                                <AlertCircle size={16} /> Overdue
                            </div>
                            <div className="stat-card__value" style={{ color: stats.overdueCount > 0 ? 'var(--danger)' : '' }}>{stats.overdueCount}</div>
                        </div>
                    </div>

                    {/* Recent Rentals */}
                    <h2 className="text-lg font-semibold mb-md">Recent Rentals</h2>
                    {recentRentals.length === 0 ? (
                        <p className="text-muted text-sm pb-lg">No rentals explicitly recorded yet.</p>
                    ) : (
                        <div className="stagger">
                            {recentRentals.map(rental => {
                                const isCompleted = rental.status === 'completed';
                                
                                let isOverdue = false;
                                if (!isCompleted && rental.created_at) {
                                    const expectedReturn = new Date(rental.created_at);
                                    expectedReturn.setDate(expectedReturn.getDate() + rental.num_days);
                                    if (new Date() > expectedReturn) isOverdue = true;
                                }

                                return (
                                    <Link to="/rentals" key={rental.id} className="rental-item" style={{ textDecoration: 'none' }}>
                                        <div className="rental-item__icon" style={{ background: isCompleted ? 'rgba(34, 197, 94, 0.1)' : isOverdue ? 'rgba(239, 68, 68, 0.1)' : '' }}>
                                            {isCompleted ? <CheckCircle size={20} className="text-success" /> : isOverdue ? <AlertCircle size={20} className="text-danger" /> : <Clock size={20} className="text-primary" />}
                                        </div>
                                        <div className="rental-item__info">
                                            <div className="rental-item__plate">{rental.license_plate}</div>
                                            <div className="rental-item__details">
                                                {rental.category_name} {rental.customer_name ? ` · ${rental.customer_name}` : ''}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="rental-item__total" style={{ margin: 0 }}>{formatCurrency(rental.total)}</div>
                                            <span className={`text-xs font-semibold ${isCompleted ? 'text-success' : isOverdue ? 'text-danger' : 'text-primary'}`}>
                                                {isCompleted ? 'Completed' : isOverdue ? 'Overdue' : 'Active'}
                                            </span>
                                        </div>
                                    </Link>
                                )
                            })}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
