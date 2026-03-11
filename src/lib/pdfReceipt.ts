// ============================================
// A5 PDF Receipt Generator
// ============================================
import { jsPDF } from 'jspdf';
import type { Rental } from '../types';
import { formatCurrency } from './calculations';

/**
 * Generate an A5-sized PDF receipt for a rental.
 * A5 dimensions: 148mm × 210mm
 */
export function generateReceipt(rental: Rental, categoryName: string): jsPDF {
    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a5',
    });

    const pageWidth = 148;
    const margin = 12;
    const contentWidth = pageWidth - margin * 2;
    let y = margin;

    // --- Header ---
    doc.setFillColor(17, 24, 39); // dark background
    doc.rect(0, 0, pageWidth, 40, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('RENTAL RECEIPT', pageWidth / 2, 18, { align: 'center' });

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    const dateStr = rental.created_at
        ? new Date(rental.created_at).toLocaleString()
        : new Date().toLocaleString();
    doc.text(dateStr, pageWidth / 2, 28, { align: 'center' });

    if (rental.id) {
        doc.setFontSize(7);
        doc.text(`#${rental.id.substring(0, 8).toUpperCase()}`, pageWidth / 2, 35, {
            align: 'center',
        });
    }

    y = 48;
    doc.setTextColor(30, 30, 30);

    // --- Vehicle Information ---
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Vehicle Information', margin, y);
    y += 6;

    doc.setDrawColor(200, 200, 200);
    doc.line(margin, y, pageWidth - margin, y);
    y += 5;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');

    const addRow = (label: string, value: string) => {
        doc.setFont('helvetica', 'bold');
        doc.text(label, margin, y);
        doc.setFont('helvetica', 'normal');
        doc.text(value, margin + 42, y);
        y += 5;
    };

    addRow('License Plate:', rental.license_plate);
    addRow('Category:', categoryName);
    y += 3;

    // --- Customer Information ---
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Customer Information', margin, y);
    y += 6;

    doc.line(margin, y, pageWidth - margin, y);
    y += 5;

    doc.setFontSize(9);
    addRow('Customer:', rental.customer_name || 'N/A');
    addRow('Hotel:', rental.hotel_name || 'N/A');
    addRow('Room:', rental.room_number || 'N/A');
    y += 3;

    // --- Financial Breakdown ---
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Financial Breakdown', margin, y);
    y += 6;

    doc.line(margin, y, pageWidth - margin, y);
    y += 5;

    doc.setFontSize(9);
    addRow('Price / Day:', formatCurrency(rental.price_per_day));
    addRow('Number of Days:', String(rental.num_days));

    y += 2;
    doc.line(margin, y, pageWidth - margin, y);
    y += 5;

    addRow('Subtotal:', formatCurrency(rental.subtotal));
    addRow(`VAT (${rental.vat_rate}%):`, formatCurrency(rental.vat_amount));

    y += 2;
    doc.setDrawColor(17, 24, 39);
    doc.setLineWidth(0.5);
    doc.line(margin, y, pageWidth - margin, y);
    y += 6;

    // Total in a highlighted box
    doc.setFillColor(17, 24, 39);
    doc.roundedRect(margin, y - 3, contentWidth, 12, 2, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('TOTAL', margin + 4, y + 5);
    doc.text(formatCurrency(rental.total), pageWidth - margin - 4, y + 5, {
        align: 'right',
    });

    // --- Footer ---
    doc.setTextColor(150, 150, 150);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text('Thank you for your rental!', pageWidth / 2, 200, { align: 'center' });

    return doc;
}

/**
 * Generate and trigger download of a receipt PDF
 */
export function downloadReceipt(rental: Rental, categoryName: string): void {
    const doc = generateReceipt(rental, categoryName);
    const filename = `receipt-${rental.license_plate.replace(/\s/g, '')}-${rental.created_at ? new Date(rental.created_at).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10)
        }.pdf`;
    doc.save(filename);
}
