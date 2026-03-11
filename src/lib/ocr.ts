// ============================================
// OCR Integration Helpers (Tesseract.js)
// ============================================
import Tesseract from 'tesseract.js';

/**
 * Recognize text from a license plate image.
 * Cleans the result to remove excess whitespace and special characters.
 */
export async function recognizeLicensePlate(
    imageSource: File | string
): Promise<string> {
    try {
        const { data } = await Tesseract.recognize(imageSource, 'eng', {
            logger: (info) => console.log('[OCR License Plate]', info.status, info.progress),
        });

        // Clean license plate text: keep only alphanumeric, spaces, and hyphens
        const cleaned = data.text
            .replace(/[^A-Za-z0-9\s\-]/g, '')
            .replace(/\s+/g, ' ')
            .trim()
            .toUpperCase();

        return cleaned;
    } catch (error) {
        console.error('License plate OCR failed:', error);
        throw new Error('Failed to read license plate. Please enter manually.');
    }
}

/**
 * Recognize a customer name from a passport scan.
 * Attempts to extract the name from the MRZ (Machine Readable Zone) lines,
 * or falls back to full-text extraction.
 */
export async function recognizePassportName(
    imageSource: File | string
): Promise<string> {
    try {
        const { data } = await Tesseract.recognize(imageSource, 'eng', {
            logger: (info) => console.log('[OCR Passport]', info.status, info.progress),
        });

        const text = data.text;

        // Try to extract from MRZ lines (lines starting with P< for passports)
        const mrzLines = text.split('\n').filter((line) => line.startsWith('P<') || line.startsWith('P '));

        if (mrzLines.length > 0) {
            // MRZ line format: P<COUNTRY_CODE LAST_NAME<<FIRST_NAME<MIDDLE_NAMES
            const mrzLine = mrzLines[0];
            const namePart = mrzLine.substring(5); // Skip "P<XXX"
            const [lastName, ...firstNames] = namePart.split('<<');

            const cleanedLast = lastName.replace(/</g, ' ').trim();
            const cleanedFirst = firstNames.join(' ').replace(/</g, ' ').trim();

            if (cleanedFirst && cleanedLast) {
                return `${cleanedFirst} ${cleanedLast}`;
            }
        }

        // Fallback: return the first non-empty line that looks like a name
        const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
        const nameLine = lines.find(
            (line) => /^[A-Za-z\s]{3,}$/.test(line) && !line.includes('PASSPORT')
        );

        return nameLine || text.split('\n')[0]?.trim() || '';
    } catch (error) {
        console.error('Passport OCR failed:', error);
        throw new Error('Failed to read passport. Please enter name manually.');
    }
}
