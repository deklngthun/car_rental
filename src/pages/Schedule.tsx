import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabaseClient';
import type { Rental } from '../types';
import { Calendar as CalendarIcon, Car, AlertCircle, CheckCircle, ChevronLeft, ChevronRight } from 'lucide-react';

export default function Schedule() {
    const [rentals, setRentals] = useState<Rental[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());

    useEffect(() => {
        async function fetchRentals() {
            // In a real app, query by a date range. For MVP, fetch all to calculate correct overlaps.
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

    const scheduleData = useMemo(() => {
        const uniqueFleet = Array.from(new Set(rentals.map((r) => r.license_plate)));
        const target = new Date(selectedDate);
        target.setHours(12, 0, 0, 0); // Normalized target time

        const booked: { plate: string; rental: Rental }[] = [];
        const overdue: { plate: string; rental: Rental }[] = [];
        const available: { plate: string }[] = [];

        uniqueFleet.forEach((plate) => {
            const plateRentals = rentals.filter((r) => r.license_plate === plate);
            
            let currentStatus: 'available' | 'booked' | 'overdue' = 'available';
            let activeRental: Rental | null = null;

            for (const r of plateRentals) {
                if (!r.created_at) continue;

                const start = new Date(r.created_at);
                start.setHours(0, 0, 0, 0);

                const expectedEnd = new Date(start);
                expectedEnd.setDate(expectedEnd.getDate() + r.num_days);

                // If completed, the end is the returned date. Otherwise it's expectedEnd (or beyond if active).
                const end = r.status === 'completed' && r.returned_at ? new Date(r.returned_at) : expectedEnd;
                end.setHours(23, 59, 59, 999);

                // The vehicle is considered associated with this rental if the target day is after start.
                // If it's active & past expectedEnd, it's overdue.
                if (target >= start) {
                    if (r.status === 'completed') {
                        // Was it booked on this day?
                        if (target <= end) {
                            currentStatus = 'booked';
                            activeRental = r;
                            break;
                        }
                    } else {
                        // Active rental covering this day, or went past it!
                        if (target > expectedEnd) {
                            currentStatus = 'overdue';
                        } else if (target <= expectedEnd) {
                            currentStatus = 'booked';
                        }
                        activeRental = r;
                        break; // Stop at first matched (most recent due to sort)
                    }
                }
            }

            if (currentStatus === 'overdue' && activeRental) {
                overdue.push({ plate, rental: activeRental });
            } else if (currentStatus === 'booked' && activeRental) {
                booked.push({ plate, rental: activeRental });
            } else {
                available.push({ plate });
            }
        });

        return { booked, overdue, available };
    }, [rentals, selectedDate]);

    const changeDate = (days: number) => {
        const newDate = new Date(selectedDate);
        newDate.setDate(newDate.getDate() + days);
        setSelectedDate(newDate);
    };

    return (
        <div className="animate-fade-in pb-xl">
            <div className="page-header mb-md">
                <h1 className="page-header__title flex items-center gap-sm">
                    <CalendarIcon size={24} /> Visual Schedule
                </h1>
                <p className="page-header__description">
                    Fleet availability across time
                </p>
            </div>

            <div className="card card--elevated mb-lg flex items-center justify-between p-md">
                <button className="btn btn--secondary btn--sm" style={{ padding: '8px' }} onClick={() => changeDate(-1)}>
                    <ChevronLeft size={20} />
                </button>
                <div className="font-semibold text-lg flex items-center gap-sm">
                    {selectedDate.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                </div>
                <button className="btn btn--secondary btn--sm" style={{ padding: '8px' }} onClick={() => changeDate(1)}>
                    <ChevronRight size={20} />
                </button>
            </div>

            {loading ? (
                <div className="text-center mt-xl">
                    <div className="spinner spinner--lg" />
                </div>
            ) : (
                <div className="flex flex-col gap-lg">
                    {/* OVERDUE */}
                    <div className="schedule-section">
                        <div className="flex items-center gap-sm mb-sm font-semibold text-danger">
                            <AlertCircle size={18} /> Overdue ({scheduleData.overdue.length})
                        </div>
                        {scheduleData.overdue.length === 0 ? (
                            <p className="text-muted text-sm">No vehicles overdue on this day.</p>
                        ) : (
                            <div className="grid gap-sm">
                                {scheduleData.overdue.map((v) => (
                                    <div key={v.plate} className="card p-md border border-danger shadow-sm flex justify-between items-center" style={{ background: 'rgba(239, 68, 68, 0.03)' }}>
                                        <div>
                                            <div className="font-bold text-lg">{v.plate}</div>
                                            <div className="text-sm text-danger mt-xs">{v.rental.customer_name || 'Unknown Customer'}</div>
                                        </div>
                                        <div className="badge badge--danger">Overdue</div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* BOOKED */}
                    <div className="schedule-section">
                        <div className="flex items-center gap-sm mb-sm font-semibold text-primary">
                            <Car size={18} /> Booked ({scheduleData.booked.length})
                        </div>
                        {scheduleData.booked.length === 0 ? (
                            <p className="text-muted text-sm">No vehicles booked on this day.</p>
                        ) : (
                            <div className="grid gap-sm">
                                {scheduleData.booked.map((v) => (
                                    <div key={v.plate} className="card p-md border border-border shadow-sm flex justify-between items-center" style={{ background: 'var(--bg-primary)' }}>
                                        <div>
                                            <div className="font-bold text-lg">{v.plate}</div>
                                            <div className="text-sm text-primary mt-xs">{v.rental.customer_name || 'Unknown Customer'}</div>
                                        </div>
                                        <div className="badge badge--info border-primary">Booked</div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* AVAILABLE */}
                    <div className="schedule-section">
                        <div className="flex items-center gap-sm mb-sm font-semibold text-success">
                            <CheckCircle size={18} /> Available ({scheduleData.available.length})
                        </div>
                        {scheduleData.available.length === 0 ? (
                            <p className="text-muted text-sm">No vehicles available.</p>
                        ) : (
                            <div className="grid gap-sm grid-cols-2">
                                {scheduleData.available.map((v) => (
                                    <div key={v.plate} className="card p-sm border border-success text-center">
                                        <div className="font-semibold">{v.plate}</div>
                                        <div className="text-xs text-success m-0 mt-xs">Available</div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
