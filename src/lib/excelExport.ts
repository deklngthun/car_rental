// ============================================
// Excel / CSV Export Utilities
// ============================================
import * as XLSX from 'xlsx';

/**
 * Export data as an Excel (.xlsx) file and trigger download
 */
export function exportToExcel<T extends Record<string, unknown>>(
    data: T[],
    filename: string,
    sheetName: string = 'Sheet1'
): void {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

    // Auto-size columns
    const colWidths = Object.keys(data[0] || {}).map((key) => ({
        wch: Math.max(
            key.length,
            ...data.map((row) => String(row[key] ?? '').length)
        ) + 2,
    }));
    worksheet['!cols'] = colWidths;

    XLSX.writeFile(workbook, `${filename}.xlsx`);
}

/**
 * Export data as a CSV file and trigger download
 */
export function exportToCSV<T extends Record<string, unknown>>(
    data: T[],
    filename: string
): void {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const csv = XLSX.utils.sheet_to_csv(worksheet);

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
}
