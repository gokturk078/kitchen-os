'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, FileSpreadsheet, FileText, Loader2 } from 'lucide-react';

export type ExportFormat = 'pdf' | 'excel';

interface ExportButtonProps {
    format: ExportFormat;
    onExport: () => Promise<void>;
    label?: string;
    disabled?: boolean;
    variant?: 'default' | 'outline' | 'ghost';
    size?: 'default' | 'sm' | 'lg' | 'icon';
    showIcon?: boolean;
}

export function ExportButton({
    format,
    onExport,
    label,
    disabled = false,
    variant = 'outline',
    size = 'default',
    showIcon = true
}: ExportButtonProps) {
    const [isExporting, setIsExporting] = useState(false);

    const handleExport = async () => {
        try {
            setIsExporting(true);
            await onExport();
        } catch (error) {
            console.error(`Export error (${format}):`, error);
            alert(`Dışa aktarma sırasında bir hata oluştu. Lütfen tekrar deneyin.`);
        } finally {
            setIsExporting(false);
        }
    };

    const defaultLabel = format === 'pdf' ? 'PDF İndir' : 'Excel İndir';
    const Icon = format === 'pdf' ? FileText : FileSpreadsheet;
    const iconColor = format === 'pdf' ? 'text-red-600' : 'text-green-600';

    return (
        <Button
            variant={variant}
            size={size}
            disabled={disabled || isExporting}
            onClick={handleExport}
        >
            {isExporting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : showIcon ? (
                <Icon className={`mr-2 h-4 w-4 ${iconColor}`} />
            ) : (
                <Download className="mr-2 h-4 w-4" />
            )}
            {label || defaultLabel}
        </Button>
    );
}
