// ============================================
// Make.com Webhook Integration
// ============================================
import type { Rental, DailyRevenue, CategoryRevenue, WebhookPayload } from '../types';
import { supabase } from './supabaseClient';

const MAKE_WEBHOOK_URL = import.meta.env.VITE_MAKE_WEBHOOK_URL as string;

/**
 * Send a rental creation event to Make.com webhook
 */
export async function sendRentalToMake(rental: Rental): Promise<boolean> {
    try {
        // Fetch daily summary for context
        const today = new Date().toISOString().slice(0, 10);
        const { data: dailyData } = await supabase
            .from('daily_revenue')
            .select('*')
            .eq('rental_date', today)
            .single();

        // Fetch category breakdown
        const { data: categoryData } = await supabase
            .from('category_revenue')
            .select('*');

        const payload: WebhookPayload = {
            event: 'rental_created',
            timestamp: new Date().toISOString(),
            rental,
            daily_summary: dailyData as DailyRevenue | undefined,
            category_breakdown: (categoryData as CategoryRevenue[]) || [],
        };

        const response = await fetch(MAKE_WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            console.error('Webhook failed:', response.status, await response.text());
            return false;
        }

        console.log('Webhook sent successfully');
        return true;
    } catch (error) {
        console.error('Failed to send webhook to Make.com:', error);
        return false;
    }
}

/**
 * Manually trigger a daily report webhook
 */
export async function sendDailyReportToMake(): Promise<boolean> {
    try {
        const today = new Date().toISOString().slice(0, 10);

        const { data: dailyData } = await supabase
            .from('daily_revenue')
            .select('*')
            .eq('rental_date', today)
            .single();

        const { data: categoryData } = await supabase
            .from('category_revenue')
            .select('*');

        const payload = {
            event: 'daily_report',
            timestamp: new Date().toISOString(),
            daily_summary: dailyData,
            category_breakdown: categoryData || [],
        };

        const response = await fetch(MAKE_WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        return response.ok;
    } catch (error) {
        console.error('Daily report webhook failed:', error);
        return false;
    }
}
