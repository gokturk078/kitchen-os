'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogClose,
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
    DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import {
    TableCell,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Pencil, Trash2, Clock, Image as ImageIcon, Download, FileText, FileSpreadsheet, Loader2, MoreVertical } from 'lucide-react';
import { generateRecipePDF } from '@/lib/pdf-generator';
import { generateRecipeExcel } from '@/lib/excel-generator';
import type { Recipe, RecipeIngredientWithDetails } from '@/types/database';

interface RecipeRowProps {
    recipe: Recipe & {
        total_cost?: number;
        category?: { name: string } | null;
    };
    outletId: string;
    outletName?: string;
    onDeleteSuccess: () => void;
}

export function RecipeRow({ recipe, outletId, outletName, onDeleteSuccess }: RecipeRowProps) {
    const router = useRouter();
    const [isDeleting, setIsDeleting] = useState(false);
    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [exportFormat, setExportFormat] = useState<'pdf' | 'excel' | null>(null);

    const formatCurrency = (value: number | null) => {
        if (!value) return '-';
        return new Intl.NumberFormat('tr-TR', {
            style: 'currency',
            currency: 'TRY',
        }).format(value);
    };

    const difficultyColors = {
        Easy: 'bg-emerald-100 text-emerald-700',
        Medium: 'bg-amber-100 text-amber-700',
        Hard: 'bg-red-100 text-red-700',
    } as const;

    const handleDelete = async () => {
        setIsDeleting(true);
        try {
            const { error } = await supabase
                .from('recipes')
                .delete()
                .eq('id', recipe.id);

            if (error) throw error;

            setOpenDeleteDialog(false);
            onDeleteSuccess();
            router.refresh();
        } catch (error) {
            console.error('Failed to delete recipe:', error);
            alert('Tarif silinemedi');
        } finally {
            setIsDeleting(false);
        }
    };

    const handleExport = async (format: 'pdf' | 'excel') => {
        try {
            setIsExporting(true);
            setExportFormat(format);

            // Fetch full recipe with ingredients
            const { data: fullRecipe } = await supabase
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
                .eq('id', recipe.id)
                .single();

            if (!fullRecipe) {
                throw new Error('Recipe not found');
            }

            // Map recipe_ingredients to RecipeIngredientWithDetails
            const recipeWithIngredients = {
                ...fullRecipe,
                recipe_ingredients: (fullRecipe.recipe_ingredients || []).map((ri: any) => ({
                    ...ri,
                    ingredient: ri.ingredient,
                    line_cost: ri.quantity * (ri.ingredient?.cost_per_unit || 0)
                }))
            };

            if (format === 'pdf') {
                await generateRecipePDF(recipeWithIngredients, outletName, recipe.category?.name);
            } else {
                generateRecipeExcel(recipeWithIngredients, outletName, recipe.category?.name);
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
        <TableRow className="hover:bg-neutral-50 group">
            <TableCell className="font-mono text-sm text-neutral-500">
                {recipe.recipe_no}
            </TableCell>
            <TableCell>
                {recipe.image_url ? (
                    <img
                        src={recipe.image_url}
                        alt={recipe.name}
                        className="h-10 w-10 rounded-lg object-cover"
                    />
                ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-neutral-100">
                        <ImageIcon className="h-4 w-4 text-neutral-400" />
                    </div>
                )}
            </TableCell>
            <TableCell>
                <Link href={`/outlets/${outletId}/recipes/${recipe.id}/edit`} className="block">
                    <p className="font-medium text-neutral-900 hover:text-blue-600 transition-colors">
                        {recipe.name}
                    </p>
                    <p className="flex items-center gap-1 text-sm text-neutral-500">
                        {recipe.prep_time && (
                            <>
                                <Clock className="h-3 w-3" />
                                {recipe.prep_time} dk
                            </>
                        )}
                        {recipe.prep_time && recipe.difficulty && ' • '}
                        {recipe.difficulty && (
                            <span className={difficultyColors[recipe.difficulty as keyof typeof difficultyColors] || ''}>
                                {recipe.difficulty}
                            </span>
                        )}
                    </p>
                </Link>
            </TableCell>
            <TableCell>
                {recipe.category ? (
                    <Badge variant="secondary" className="font-medium">
                        {recipe.category.name}
                    </Badge>
                ) : (
                    <span className="text-neutral-400">-</span>
                )}
            </TableCell>
            <TableCell className="font-medium text-neutral-900">
                {formatCurrency(recipe.sale_price)}
            </TableCell>
            <TableCell>
                <span className="font-semibold text-red-600">
                    {formatCurrency(recipe.total_cost || 0)}
                </span>
            </TableCell>
            <TableCell className="text-right">
                <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {/* Export Dropdown */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-neutral-500 hover:text-blue-600"
                                disabled={isExporting}
                            >
                                {isExporting ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Download className="h-4 w-4" />
                                )}
                                <span className="sr-only">Dışa Aktar</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
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

                    {/* Edit Button */}
                    <Link href={`/outlets/${outletId}/recipes/${recipe.id}/edit`}>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-neutral-500 hover:text-blue-600">
                            <Pencil className="h-4 w-4" />
                            <span className="sr-only">Düzenle</span>
                        </Button>
                    </Link>

                    {/* Delete Button */}
                    <Dialog open={openDeleteDialog} onOpenChange={setOpenDeleteDialog}>
                        <DialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-neutral-500 hover:text-red-600">
                                <Trash2 className="h-4 w-4" />
                                <span className="sr-only">Sil</span>
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Tarif Silinsin mi?</DialogTitle>
                                <DialogDescription>
                                    <strong>{recipe.name}</strong> tarifini silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
                                </DialogDescription>
                            </DialogHeader>
                            <DialogFooter>
                                <DialogClose asChild>
                                    <Button variant="outline" disabled={isDeleting}>İptal</Button>
                                </DialogClose>
                                <Button
                                    variant="destructive"
                                    onClick={handleDelete}
                                    disabled={isDeleting}
                                >
                                    {isDeleting ? 'Siliniyor...' : 'Tarifi Sil'}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </TableCell>
        </TableRow>
    );
}
