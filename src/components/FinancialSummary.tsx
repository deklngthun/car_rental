import { formatCurrency } from '../lib/calculations';
import type { FinancialBreakdown } from '../types';
import { Calculator } from 'lucide-react';

interface FinancialSummaryProps {
    breakdown: FinancialBreakdown | null;
}

export default function FinancialSummary({ breakdown }: FinancialSummaryProps) {
    if (!breakdown) {
        return (
            <div className="financial-summary">
                <div className="card__title">
                    <Calculator size={18} className="card__title-icon" />
                    Financial Summary
                </div>
                <div className="text-center text-muted text-sm" style={{ padding: '16px 0' }}>
                    Enter price and days to see calculations
                </div>
            </div>
        );
    }

    return (
        <div className="financial-summary animate-fade-in">
            <div className="card__title">
                <Calculator size={18} className="card__title-icon" />
                Financial Summary
            </div>

            <div className="financial-summary__row">
                <span>Price per day</span>
                <span className="financial-summary__value">
                    {formatCurrency(breakdown.pricePerDay)}
                </span>
            </div>

            <div className="financial-summary__row">
                <span>Number of days</span>
                <span className="financial-summary__value">
                    {breakdown.numDays}
                </span>
            </div>

            <div className="financial-summary__row financial-summary__row--divider">
                <span>Subtotal</span>
                <span className="financial-summary__value">
                    {formatCurrency(breakdown.subtotal)}
                </span>
            </div>

            <div className="financial-summary__row">
                <span>VAT ({breakdown.vatRate}%)</span>
                <span className="financial-summary__value">
                    {formatCurrency(breakdown.vatAmount)}
                </span>
            </div>

            <div className="financial-summary__row financial-summary__row--total">
                <span>Total</span>
                <span className="financial-summary__value">
                    {formatCurrency(breakdown.total)}
                </span>
            </div>
        </div>
    );
}
