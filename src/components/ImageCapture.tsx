import React, { useRef, useState, useCallback } from 'react';
import { Camera, Upload, X } from 'lucide-react';

interface ImageCaptureProps {
    label: string;
    onImageCaptured: (file: File) => void;
    onClear: () => void;
    processing?: boolean;
    processingText?: string;
    previewUrl?: string;
}

export default function ImageCapture({
    label,
    onImageCaptured,
    onClear,
    processing = false,
    processingText = 'Processing...',
    previewUrl,
}: ImageCaptureProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [dragOver, setDragOver] = useState(false);

    const handleFileSelect = useCallback(
        (file: File) => {
            if (file && file.type.startsWith('image/')) {
                onImageCaptured(file);
            }
        },
        [onImageCaptured]
    );

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) handleFileSelect(file);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer.files?.[0];
        if (file) handleFileSelect(file);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(true);
    };

    const handleDragLeave = () => setDragOver(false);

    if (previewUrl) {
        return (
            <div className={`image-capture image-capture--has-image ${processing ? 'image-capture--processing' : ''}`} style={{ position: 'relative' }}>
                <img src={previewUrl} alt={label} className="image-capture__preview" style={processing ? { opacity: 0.5 } : {}} />

                {processing && (
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
                        <div className="spinner" style={{ borderColor: 'var(--border-primary)', borderTopColor: 'var(--text-primary)' }} />
                        <span className="text-sm text-primary mt-sm font-semibold">{processingText}</span>
                    </div>
                )}

                {!processing && (
                    <button className="image-capture__remove" onClick={onClear} title="Remove image">
                        <X size={14} />
                    </button>
                )}
            </div>
        );
    }

    if (processing) {
        // Fallback if processing without previewUrl
        return (
            <div className="image-capture" style={{ cursor: 'default' }}>
                <div className="flex flex-col items-center gap-sm">
                    <div className="spinner spinner--lg" />
                    <span className="text-sm text-muted">{processingText}</span>
                </div>
            </div>
        );
    }

    return (
        <div
            className={`image-capture ${dragOver ? 'image-capture--drag-over' : ''}`}
            onClick={() => fileInputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
        >
            <div className="image-capture__icon">
                <Camera size={32} />
            </div>
            <div className="image-capture__text">{label}</div>
            <div className="image-capture__text" style={{ marginTop: 4, fontSize: '0.7rem' }}>
                <Upload size={12} style={{ display: 'inline', verticalAlign: 'middle' }} />{' '}
                Tap to capture or upload
            </div>
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleInputChange}
                style={{ display: 'none' }}
            />
        </div>
    );
}
