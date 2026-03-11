// ============================================
// Financial Calculation Engine
// ============================================
import type { FinancialBreakdown } from '../types';

/**
 * Calculate subtotal: price per day × number of days
 */
export function calculateSubtotal(pricePerDay: number, numDays: number): number {
    return Math.round(pricePerDay * numDays * 100) / 100;
}

/**
 * Calculate VAT amount from subtotal and rate
 * @param subtotal - The base amount
 * @param vatRate - VAT rate as a percentage (e.g., 7 for 7%)
 */
export function calculateVAT(subtotal: number, vatRate: number): number {
    return Math.round(subtotal * (vatRate / 100) * 100) / 100;
}

/**
 * Calculate final total: subtotal + VAT
 */
export function calculateTotal(subtotal: number, vatAmount: number): number {
    return Math.round((subtotal + vatAmount) * 100) / 100;
}

/**
 * Get a complete financial breakdown for a rental
 */
export function getFinancialBreakdown(
    pricePerDay: number,
    numDays: number,
    vatRate: number
): FinancialBreakdown {
    const subtotal = calculateSubtotal(pricePerDay, numDays);
    const vatAmount = calculateVAT(subtotal, vatRate);
    const total = calculateTotal(subtotal, vatAmount);

    return {
        pricePerDay,
        numDays,
        subtotal,
        vatRate,
        vatAmount,
        total,
    };
}

/**
 * Format a number to a currency-style string (no specific currency symbol)
 */
export function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(amount);
}
