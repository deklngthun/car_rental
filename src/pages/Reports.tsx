import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { formatCurrency } from '../lib/calculations';
import { exportToExcel, exportToCSV } from '../lib/excelExport';
import { sendDailyReportToMake } from '../lib/webhooks';
import { jsPDF } from 'jspdf';
import type { DailyRevenue, MonthlyRevenue, CategoryRevenue } from '../types';
import {
    Download,
    FileSpreadsheet,
    FileText,
    Send,
    TrendingUp,
    Calendar,
    Layers,
} from 'lucide-react';

type ReportTab = 'daily' | 'monthly' | 'category';

export default function Reports() {
    const [activeTab, setActiveTab] = useState<ReportTab>('daily');
    const [dailyData, setDailyData] = useState<DailyRevenue[]>([]);
    const [monthlyData, setMonthlyData] = useState<MonthlyRevenue[]>([]);
    const [categoryData, setCategoryData] = useState<CategoryRevenue[]>([]);
    const [loading, setLoading] = useState(true);
    const [sendingWebhook, setSendingWebhook] = useState(false);
    const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    useEffect(() => {
        async function fetchReports() {
            const [daily, monthly, category] = await Promise.all([
                supabase.from('daily_revenue').select('*'),
                supabase.from('monthly_revenue').select('*'),
                supabase.from('category_revenue').select('*'),
            ]);

            if (daily.data) setDailyData(daily.data as DailyRevenue[]);
            if (monthly.data) setMonthlyData(monthly.data as MonthlyRevenue[]);
            if (category.data) setCategoryData(category.data as CategoryRevenue[]);
            setLoading(false);
        }
        fetchReports();
    }, []);

    const showToast = (type: 'success' | 'error', message: string) => {
        setToast({ type, message });
        setTimeout(() => setToast(null), 3000);
    };

    // Stats
    const todayRevenue = dailyData[0]?.net_revenue || 0;
    const todayRentals = dailyData[0]?.total_rentals || 0;
    const monthRevenue = monthlyData[0]?.net_revenue || 0;
    const totalCategories = categoryData.length;

    // Export handlers
    const handleExportExcel = () => {
        const dataMap = { daily: dailyData, monthly: monthlyData, category: categoryData };
        exportToExcel(dataMap[activeTab] as unknown as Record<string, unknown>[], `${activeTab}-report`, activeTab);
    };

    const handleExportCSV = () => {
        const dataMap = { daily: dailyData, monthly: monthlyData, category: categoryData };
        exportToCSV(dataMap[activeTab] as unknown as Record<string, unknown>[], `${activeTab}-report`);
    };

    const handleExportPDF = () => {
        const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
        let y = 20;

        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.text(`${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Revenue Report`, 20, y);
        y += 10;

        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.text(`Generated: ${new Date().toLocaleString()}`, 20, y);
        y += 15;

        const dataMap = { daily: dailyData, monthly: monthlyData, category: categoryData };
        const data = dataMap[activeTab] as unknown as Record<string, unknown>[];

        if (data.length > 0) {
            const headers = Object.keys(data[0]);
            const colWidth = (170 / headers.length);

            // Headers
            doc.setFontSize(8);
            doc.setFont('helvetica', 'bold');
            headers.forEach((h, i) => {
                doc.text(h.replace(/_/g, ' ').toUpperCase(), 20 + i * colWidth, y);
            });
            y += 5;
            doc.setLineWidth(0.3);
            doc.line(20, y, 190, y);
            y += 5;

            // Rows
            doc.setFont('helvetica', 'normal');
            data.forEach((row) => {
                if (y > 270) {
                    doc.addPage();
                    y = 20;
                }
                headers.forEach((h, i) => {
                    const val = row[h];
                    const text = typeof val === 'number' ? formatCurrency(val) : String(val ?? '');
                    doc.text(text, 20 + i * colWidth, y);
                });
                y += 5;
            });
        }

        doc.save(`${activeTab}-report.pdf`);
    };

    const handleSendWebhook = async () => {
        setSendingWebhook(true);
        const ok = await sendDailyReportToMake();
        showToast(ok ? 'success' : 'error', ok ? 'Report sent to Make.com!' : 'Webhook failed');
        setSendingWebhook(false);
    };

    return (
        <>
            {toast && <div className={`toast toast--${toast.type}`}>{toast.message}</div>}

            <div className="page-header">
                <h1 className="page-header__title">Reports</h1>
                <p className="page-header__description">Revenue analytics and exports</p>
            </div>

            {/* Stat Cards */}
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-card__value">{formatCurrency(todayRevenue)}</div>
                    <div className="stat-card__label">Today's Revenue</div>
                </div>
                <div className="stat-card">
                    <div className="stat-card__value">{todayRentals}</div>
                    <div className="stat-card__label">Today's Rentals</div>
                </div>
                <div className="stat-card">
                    <div className="stat-card__value">{formatCurrency(monthRevenue)}</div>
                    <div className="stat-card__label">This Month</div>
                </div>
                <div className="stat-card">
                    <div className="stat-card__value">{totalCategories}</div>
                    <div className="stat-card__label">Categories</div>
                </div>
            </div>

            {/* Tabs */}
            <div className="tabs">
                <button
                    className={`tab ${activeTab === 'daily' ? 'tab--active' : ''}`}
                    onClick={() => setActiveTab('daily')}
                >
                    <Calendar size={14} style={{ display: 'inline', verticalAlign: 'middle' }} /> Daily
                </button>
                <button
                    className={`tab ${activeTab === 'monthly' ? 'tab--active' : ''}`}
                    onClick={() => setActiveTab('monthly')}
                >
                    <TrendingUp size={14} style={{ display: 'inline', verticalAlign: 'middle' }} /> Monthly
                </button>
                <button
                    className={`tab ${activeTab === 'category' ? 'tab--active' : ''}`}
                    onClick={() => setActiveTab('category')}
                >
                    <Layers size={14} style={{ display: 'inline', verticalAlign: 'middle' }} /> Category
                </button>
            </div>

            {/* Export Actions */}
            <div className="flex gap-sm mb-md" style={{ flexWrap: 'wrap' }}>
                <button className="btn btn--secondary btn--sm" onClick={handleExportPDF}>
                    <FileText size={14} /> PDF
                </button>
                <button className="btn btn--secondary btn--sm" onClick={handleExportExcel}>
                    <FileSpreadsheet size={14} /> Excel
                </button>
                <button className="btn btn--secondary btn--sm" onClick={handleExportCSV}>
                    <Download size={14} /> CSV
                </button>
                <button
                    className="btn btn--secondary btn--sm"
                    onClick={handleSendWebhook}
                    disabled={sendingWebhook}
                >
                    {sendingWebhook ? <div className="spinner" /> : <Send size={14} />}
                    {sendingWebhook ? 'Sending...' : 'Send to Make.com'}
                </button>
            </div>

            {/* Data Table */}
            <div className="card card--elevated" style={{ overflowX: 'auto' }}>
                {loading ? (
                    <div className="text-center" style={{ padding: '32px' }}>
                        <div className="spinner spinner--lg" style={{ margin: '0 auto' }} />
                    </div>
                ) : (
                    <>
                        {activeTab === 'daily' && (
                            dailyData.length === 0 ? (
                                <div className="empty-state">
                                    <div className="empty-state__text">No daily revenue data yet</div>
                                </div>
                            ) : (
                                <table className="report-table">
                                    <thead>
                                        <tr>
                                            <th>Date</th>
                                            <th>Rentals</th>
                                            <th>Revenue</th>
                                            <th>VAT</th>
                                            <th>Total</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {dailyData.map((row) => (
                                            <tr key={row.rental_date}>
                                                <td>{row.rental_date}</td>
                                                <td>{row.total_rentals}</td>
                                                <td>{formatCurrency(row.gross_revenue)}</td>
                                                <td>{formatCurrency(row.total_vat)}</td>
                                                <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                                                    {formatCurrency(row.net_revenue)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )
                        )}

                        {activeTab === 'monthly' && (
                            monthlyData.length === 0 ? (
                                <div className="empty-state">
                                    <div className="empty-state__text">No monthly revenue data yet</div>
                                </div>
                            ) : (
                                <table className="report-table">
                                    <thead>
                                        <tr>
                                            <th>Month</th>
                                            <th>Rentals</th>
                                            <th>Revenue</th>
                                            <th>VAT</th>
                                            <th>Total</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {monthlyData.map((row) => (
                                            <tr key={row.rental_month}>
                                                <td>{row.rental_month}</td>
                                                <td>{row.total_rentals}</td>
                                                <td>{formatCurrency(row.gross_revenue)}</td>
                                                <td>{formatCurrency(row.total_vat)}</td>
                                                <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                                                    {formatCurrency(row.net_revenue)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )
                        )}

                        {activeTab === 'category' && (
                            categoryData.length === 0 ? (
                                <div className="empty-state">
                                    <div className="empty-state__text">No category revenue data yet</div>
                                </div>
                            ) : (
                                <table className="report-table">
                                    <thead>
                                        <tr>
                                            <th>Category</th>
                                            <th>Rentals</th>
                                            <th>Revenue</th>
                                            <th>VAT</th>
                                            <th>Total</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {categoryData.map((row) => (
                                            <tr key={row.category}>
                                                <td>
                                                    <span className="badge badge--info">{row.category}</span>
                                                </td>
                                                <td>{row.total_rentals}</td>
                                                <td>{formatCurrency(row.gross_revenue)}</td>
                                                <td>{formatCurrency(row.total_vat)}</td>
                                                <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                                                    {formatCurrency(row.net_revenue)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )
                        )}
                    </>
                )}
            </div>
        </>
    );
}
