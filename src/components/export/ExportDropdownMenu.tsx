'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
    DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { Download, FileSpreadsheet, FileText, Loader2 } from 'lucide-react';

export type ExportFormat = 'pdf' | 'excel';

interface ExportDropdownMenuProps {
    onExport: (format: ExportFormat) => Promise<void>;
    label?: string;
    disabled?: boolean;
    variant?: 'default' | 'outline' | 'ghost';
    size?: 'default' | 'sm' | 'lg' | 'icon';
}

export function ExportDropdownMenu({
    onExport,
    label = 'Dışa Aktar',
    disabled = false,
    variant = 'outline',
    size = 'default'
}: ExportDropdownMenuProps) {
    const [isExporting, setIsExporting] = useState(false);
    const [exportingFormat, setExportingFormat] = useState<ExportFormat | null>(null);

    const handleExport = async (format: ExportFormat) => {
        try {
            setIsExporting(true);
            setExportingFormat(format);
            await onExport(format);
        } catch (error) {
            console.error(`Export error (${format}):`, error);
            alert(`Dışa aktarma sırasında bir hata oluştu. Lütfen tekrar deneyin.`);
        } finally {
            setIsExporting(false);
            setExportingFormat(null);
        }
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant={variant} size={size} disabled={disabled || isExporting}>
                    {isExporting ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                        <Download className="mr-2 h-4 w-4" />
                    )}
                    {label}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>Format Seçin</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                    onClick={() => handleExport('pdf')}
                    disabled={isExporting}
                    className="cursor-pointer"
                >
                    <FileText className="mr-2 h-4 w-4 text-red-600" />
                    <span>PDF İndir</span>
                    {exportingFormat === 'pdf' && (
                        <Loader2 className="ml-auto h-4 w-4 animate-spin" />
                    )}
                </DropdownMenuItem>
                <DropdownMenuItem
                    onClick={() => handleExport('excel')}
                    disabled={isExporting}
                    className="cursor-pointer"
                >
                    <FileSpreadsheet className="mr-2 h-4 w-4 text-green-600" />
                    <span>Excel İndir</span>
                    {exportingFormat === 'excel' && (
                        <Loader2 className="ml-auto h-4 w-4 animate-spin" />
                    )}
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
