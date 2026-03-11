import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabaseClient';
import type { Rental } from '../types';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';

export default function Schedule() {
    const [rentals, setRentals] = useState<Rental[]>([]);
    const [loading, setLoading] = useState(true);
    const [startDate, setStartDate] = useState<Date>(new Date());

    useEffect(() => {
        async function fetchRentals() {
            const { data, error } = await supabase
                .from('rentals')
                .select('*')
                .order('created_at', { ascending: false });

            if (data && !error) {
                setRentals(data);
            }
            setLoading(false);
        }
        fetchRentals();
    }, []);

    // Generate the 7 days array based on startDate
    const days = useMemo(() => {
        const d = [];
        for (let i = 0; i < 7; i++) {
            const current = new Date(startDate);
            current.setDate(current.getDate() + i);
            current.setHours(12, 0, 0, 0); // Normalize time
            d.push(current);
        }
        return d;
    }, [startDate]);

    // Format MM-DD for column headers
    const formatDay = (date: Date) => {
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${m}-${d}`;
    };

    const scheduleData = useMemo(() => {
        const uniqueVehiclesMap = new Map<string, string>(); // plate -> category_name
        rentals.forEach((r) => {
            if (!uniqueVehiclesMap.has(r.license_plate)) {
                uniqueVehiclesMap.set(r.license_plate, r.category_name || 'Vehicle');
            }
        });

        const vehicles = Array.from(uniqueVehiclesMap.keys()).map((plate) => {
            const category = uniqueVehiclesMap.get(plate) || 'Vehicle';
            const plateRentals = rentals.filter((r) => r.license_plate === plate);

            const grid = days.map((target) => {
                let currentStatus: 'available' | 'booked' | 'overdue' | 'conflict' = 'available';
                let activeRental: Rental | null = null;
                let activeCount = 0;

                for (const r of plateRentals) {
                    if (!r.created_at) continue;

                    const start = new Date(r.created_at);
                    start.setHours(0, 0, 0, 0);

                    const expectedEnd = new Date(start);
                    expectedEnd.setDate(expectedEnd.getDate() + r.num_days);

                    const end = r.status === 'completed' && r.returned_at ? new Date(r.returned_at) : expectedEnd;
                    end.setHours(23, 59, 59, 999);

                    if (target >= start) {
                        if (r.status === 'completed') {
                            if (target <= end) {
                                currentStatus = 'booked';
                                activeRental = r;
                                activeCount++;
                            }
                        } else {
                            if (target > expectedEnd) {
                                currentStatus = 'overdue';
                            } else if (target <= expectedEnd) {
                                currentStatus = 'booked';
                            }
                            activeRental = r;
                            activeCount++;
                        }
                    }
                }

                if (activeCount > 1) {
                    currentStatus = 'conflict';
                }

                let text = 'Free';
                if (currentStatus === 'booked' && activeRental?.customer_name) {
                    text = activeRental.customer_name.split(' ')[0]; // Just first name
                } else if (currentStatus === 'overdue' && activeRental?.customer_name) {
                    text = activeRental.customer_name.split(' ')[0];
                } else if (currentStatus === 'conflict') {
                    text = 'Conflict';
                }

                return {
                    date: target,
                    status: currentStatus,
                    text
                };
            });

            return { plate, category, grid };
        });

        // Sort by category then plate
        vehicles.sort((a, b) => a.category.localeCompare(b.category) || a.plate.localeCompare(b.plate));

        return vehicles;
    }, [rentals, days]);

    const changeWeek = (daysOffset: number) => {
        const newDate = new Date(startDate);
        newDate.setDate(newDate.getDate() + daysOffset);
        setStartDate(newDate);
    };

    if (loading) {
        return (
            <div className="text-center mt-xl">
                <div className="spinner spinner--lg" />
            </div>
        );
    }

    return (
        <div className="animate-fade-in pb-xl" style={{ paddingBottom: '90px' }}>
            
            {/* Header matching Mockup */}
            <div style={{
                background: 'linear-gradient(135deg, #18181b 0%, #09090b 100%)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid #27272a',
                padding: '24px 32px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '16px',
                marginBottom: '24px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                position: 'relative',
                overflow: 'hidden'
            }}>
                <div style={{
                    position: 'absolute', top: 0, right: '10%', bottom: 0, width: '40%',
                    background: 'radial-gradient(ellipse at center, rgba(234, 179, 8, 0.08) 0%, transparent 70%)',
                    pointerEvents: 'none'
                }}></div>

                <div className="flex items-center gap-md" style={{ zIndex: 10 }}>
                    <CalendarIcon size={28} color="white" />
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, color: 'white' }}>Visual Schedule</h1>
                </div>
                
                <div style={{ color: 'var(--text-muted)', fontSize: '0.95rem', fontWeight: 500, zIndex: 10 }}>
                    Booked, available, or overdue — at a glance. Conflicts are blocked automatically.
                </div>
            </div>

            <div style={{
                background: 'var(--bg-card)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid #27272a',
                overflow: 'hidden',
                boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
            }}>
                {/* Legend and Navigation */}
                <div className="flex justify-between items-center" style={{ padding: '20px 24px', borderBottom: '1px solid #27272a' }}>
                    <div className="flex items-center gap-lg flex-wrap">
                        <div className="flex items-center gap-sm">
                            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#eab308' }}></div>
                            <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Booked</span>
                        </div>
                        <div className="flex items-center gap-sm">
                            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#22c55e' }}></div>
                            <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Available</span>
                        </div>
                        <div className="flex items-center gap-sm">
                            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ef4444' }}></div>
                            <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Overdue</span>
                        </div>
                        <div className="flex items-center gap-sm">
                            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#f59e0b' }}></div>
                            <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Conflict</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-sm">
                        <button className="btn btn--secondary btn--sm" style={{ padding: '6px 12px' }} onClick={() => changeWeek(-7)}>
                            <ChevronLeft size={16} /> Prev Week
                        </button>
                        <button className="btn btn--secondary btn--sm" style={{ padding: '6px 12px' }} onClick={() => changeWeek(7)}>
                            Next Week <ChevronRight size={16} />
                        </button>
                    </div>
                </div>

                {/* Grid Table */}
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', minWidth: '900px', borderCollapse: 'collapse', textAlign: 'center' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid #27272a' }}>
                                <th style={{ padding: '16px', color: 'var(--text-secondary)', fontWeight: 600, width: '220px', textAlign: 'center', borderRight: '1px solid #27272a' }}>Vehicle</th>
                                {days.map((day, idx) => (
                                    <th key={idx} style={{ padding: '16px', color: 'var(--text-secondary)', fontWeight: 600, borderRight: idx < 6 ? '1px solid #27272a' : 'none' }}>
                                        {formatDay(day)}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {scheduleData.length === 0 ? (
                                <tr>
                                    <td colSpan={8} style={{ padding: '40px', color: 'var(--text-muted)' }}>
                                        No vehicles found. Add rentals to populate your fleet schedule.
                                    </td>
                                </tr>
                            ) : (
                                scheduleData.map((v, vIdx) => (
                                    <tr key={v.plate} style={{ borderBottom: vIdx < scheduleData.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none', background: vIdx % 2 !== 0 ? 'rgba(255,255,255,0.02)' : 'transparent' }}>
                                        <td style={{ padding: '20px 16px', textAlign: 'center', borderRight: '1px solid #27272a' }}>
                                            <div style={{ color: 'white', fontWeight: 700, fontSize: '0.95rem' }}>{v.category}</div>
                                            <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '4px' }}>{v.plate}</div>
                                        </td>
                                        {v.grid.map((cell, idx) => {
                                            
                                            // Determine badge styling based on mockup
                                            let bg = 'rgba(34, 197, 94, 0.1)'; // default green/Available
                                            let textCol = '#4ade80';
                                            
                                            if (cell.status === 'booked') {
                                                bg = 'rgba(15, 118, 110, 0.4)'; // darker teal 
                                                textCol = '#fde047'; // yellow text
                                            } else if (cell.status === 'overdue') {
                                                bg = 'rgba(239, 68, 68, 0.2)'; 
                                                textCol = '#fca5a5';
                                            } else if (cell.status === 'conflict') {
                                                bg = 'rgba(245, 158, 11, 0.2)';
                                                textCol = '#fcd34d';
                                            }

                                            return (
                                                <td key={idx} style={{ padding: '12px', borderRight: idx < 6 ? '1px solid #27272a' : 'none' }}>
                                                    <div style={{
                                                        background: bg,
                                                        color: textCol,
                                                        padding: '8px 4px',
                                                        borderRadius: '6px',
                                                        fontWeight: 600,
                                                        fontSize: '0.85rem',
                                                        display: 'flex',
                                                        justifyContent: 'center',
                                                        alignItems: 'center',
                                                        width: '100%',
                                                        minHeight: '40px',
                                                        textOverflow: 'ellipsis',
                                                        overflow: 'hidden',
                                                        whiteSpace: 'nowrap'
                                                    }}>
                                                        {cell.text}
                                                    </div>
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
