'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
    DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { Store, MapPin, Trash2, Download, FileText, FileSpreadsheet, Loader2, MoreVertical } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { generateOutletPDF } from '@/lib/pdf-generator';
import { generateOutletExcel } from '@/lib/excel-generator';
import type { Outlet, Recipe, Category } from '@/types/database';

interface OutletCardProps {
    outlet: Outlet & { recipe_count?: number };
}

const statusColors = {
    active: 'bg-emerald-100 text-emerald-700',
    inactive: 'bg-neutral-100 text-neutral-600',
    maintenance: 'bg-amber-100 text-amber-700',
    closed: 'bg-red-100 text-red-700',
};

export function OutletCard({ outlet }: OutletCardProps) {
    const router = useRouter();
    const [isDeleting, setIsDeleting] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [exportFormat, setExportFormat] = useState<'pdf' | 'excel' | null>(null);

    const handleDelete = async (e: React.MouseEvent) => {
        e.preventDefault();
        setIsDeleting(true);
        try {
            const { error } = await supabase
                .from('outlets')
                .delete()
                .eq('id', outlet.id);

            if (error) throw error;
            router.refresh();
        } catch (error) {
            console.error('Error deleting outlet:', error);
            alert('Restoran silinemedi');
        } finally {
            setIsDeleting(false);
        }
    };

    const handleExport = async (format: 'pdf' | 'excel') => {
        try {
            setIsExporting(true);
            setExportFormat(format);

            // Fetch categories for this outlet
            const { data: categories } = await supabase
                .from('categories')
                .select('*')
                .eq('outlet_id', outlet.id)
                .order('sort_order');

            // Fetch recipes with full ingredient details for export
            const { data: recipes } = await supabase
                .from('recipes')
                .select(`
                    *,
                    recipe_ingredients (
                        id,
                        quantity,
                        unit,
                        prep_detail,
                        sort_order,
                        ingredient:ingredients (*)
                    )
                `)
                .eq('outlet_id', outlet.id)
                .order('created_at', { ascending: false });

            // Calculate total cost for each recipe
            const recipesWithCost = (recipes || []).map((recipe: any) => {
                const ingredientsCost = recipe.recipe_ingredients?.reduce((sum: number, ri: any) => {
                    const cost = ri.ingredient?.cost_per_unit || 0;
                    return sum + (cost * ri.quantity);
                }, 0) || 0;
                const wastePercentage = recipe.waste_percentage || 5;
                const totalCost = ingredientsCost * (1 + wastePercentage / 100);
                return { ...recipe, total_cost: totalCost };
            });

            if (format === 'pdf') {
                await generateOutletPDF(outlet, categories || [], recipesWithCost);
            } else {
                generateOutletExcel(outlet, categories || [], recipesWithCost);
            }
        } catch (error) {
            console.error('Export error:', error);
            alert('Dışa aktarma sırasında bir hata oluştu');
        } finally {
            setIsExporting(false);
            setExportFormat(null);
        }
    };

    return (
        <div className="relative group">
            <Link href={`/outlets/${outlet.id}/recipes`} className="block">
                <Card className="p-5 hover:shadow-md transition-shadow cursor-pointer h-full border-neutral-200 group-hover:border-blue-200 relative">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 group-hover:bg-blue-600 transition-colors">
                                <Store className="h-5 w-5 text-blue-600 group-hover:text-white transition-colors" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-neutral-900 group-hover:text-blue-700">{outlet.name}</h3>
                                {outlet.location && (
                                    <p className="flex items-center gap-1 text-sm text-neutral-500">
                                        <MapPin className="h-3 w-3" />
                                        {outlet.location}
                                    </p>
                                )}
                            </div>
                        </div>
                        <span className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${statusColors[outlet.status as keyof typeof statusColors]}`}>
                            {outlet.status}
                        </span>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-4 border-t border-neutral-100 pt-4">
                        <div>
                            <p className="text-xs font-medium text-neutral-400 uppercase">Tarifler</p>
                            <p className="text-xl font-bold text-neutral-900">{outlet.recipe_count || 0}</p>
                        </div>
                        <div>
                            <p className="text-xs font-medium text-neutral-400 uppercase">Tür</p>
                            <p className="text-xl font-bold text-neutral-900">{outlet.type || '-'}</p>
                        </div>
                    </div>
                </Card>
            </Link>

            {/* Actions - Positioned Absolute */}
            <div className="absolute bottom-4 right-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                {/* Export Dropdown */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-neutral-400 hover:text-blue-600 hover:bg-blue-50"
                            onClick={(e) => e.stopPropagation()}
                            disabled={isExporting}
                        >
                            {isExporting ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Download className="h-4 w-4" />
                            )}
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenuLabel>Dışa Aktar</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleExport('pdf')} disabled={isExporting}>
                            <FileText className="mr-2 h-4 w-4 text-red-600" />
                            PDF İndir
                            {exportFormat === 'pdf' && <Loader2 className="ml-auto h-4 w-4 animate-spin" />}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleExport('excel')} disabled={isExporting}>
                            <FileSpreadsheet className="mr-2 h-4 w-4 text-green-600" />
                            Excel İndir
                            {exportFormat === 'excel' && <Loader2 className="ml-auto h-4 w-4 animate-spin" />}
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>

                {/* Delete Button */}
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-neutral-400 hover:text-red-600 hover:bg-red-50"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Restoran Silinsin mi?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Dikkat! Bu işlem <strong>{outlet.name}</strong> restoranını ve tüm ilişkili tarifleri kalıcı olarak silecektir. Bu işlem geri alınamaz.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>İptal</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={handleDelete}
                                className="bg-red-600 hover:bg-red-700 text-white border-red-600"
                            >
                                {isDeleting ? 'Siliniyor...' : 'Sil'}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </div>
    );
}
