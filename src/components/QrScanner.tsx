import { Scanner } from '@yudiel/react-qr-scanner';
import { QrCode, X } from 'lucide-react';
import { useState } from 'react';

interface QrScannerProps {
    onScan: (text: string) => void;
}

export default function QrScanner({ onScan }: QrScannerProps) {
    const [isScanning, setIsScanning] = useState(false);

    if (isScanning) {
        return (
            <div style={{ position: 'relative', width: '100%', overflow: 'hidden', borderRadius: 'var(--radius-lg)' }}>
                <Scanner
                    onScan={(result) => {
                        if (result && result.length > 0) {
                            onScan(result[0].rawValue);
                            setIsScanning(false);
                        }
                    }}
                    styles={{
                        container: { aspectRatio: '1/1', background: 'var(--bg-input)' },
                    }}
                />
                <button
                    type="button"
                    className="btn btn--danger btn--sm"
                    style={{ position: 'absolute', bottom: '16px', left: '50%', transform: 'translateX(-50%)', zIndex: 100 }}
                    onClick={(e) => {
                        e.stopPropagation();
                        setIsScanning(false);
                    }}
                >
                    <X size={14} className="mr-sm" /> Cancel Scan
                </button>
            </div>
        );
    }

    return (
        <div
            className="image-capture"
            onClick={() => setIsScanning(true)}
            style={{ cursor: 'pointer' }}
        >
            <div className="image-capture__icon">
                <QrCode size={32} />
            </div>
            <div className="image-capture__text">Scan Vehicle QR Code</div>
            <div className="image-capture__text" style={{ marginTop: 4, fontSize: '0.7rem' }}>
                Tap to open camera
            </div>
        </div>
    );
}
