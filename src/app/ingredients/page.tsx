'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { EmptyState } from '@/components/ui/empty-state';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
    DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { Package, Plus, Search, Filter, MoreHorizontal, Download, Pencil, Trash2, FileText, FileSpreadsheet, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { generateIngredientsPDF } from '@/lib/pdf-generator';
import { generateIngredientsExcel } from '@/lib/excel-generator';
import type { Ingredient, Unit } from '@/types/database';

export default function IngredientsPage() {
    const [ingredients, setIngredients] = useState<Ingredient[]>([]);
    const [units, setUnits] = useState<Unit[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingIngredient, setEditingIngredient] = useState<Ingredient | null>(null);
    const [isExporting, setIsExporting] = useState(false);
    const [exportFormat, setExportFormat] = useState<'pdf' | 'excel' | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        ingredient_no: '',
        category: '',
        base_unit: 'kg',
        cost_per_unit: 0,
        supplier: '',
    });

    const fetchIngredients = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('ingredients')
            .select('*')
            .order('name', { ascending: true });

        if (!error && data) {
            setIngredients(data);
        }
        setLoading(false);
    };

    const fetchUnits = async () => {
        const { data, error } = await supabase
            .from('units')
            .select('*')
            .order('name', { ascending: true });

        if (!error && data) {
            setUnits(data);
        }
    };

    useEffect(() => {
        fetchIngredients();
        fetchUnits();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (editingIngredient) {
            const { error } = await supabase
                .from('ingredients')
                .update(formData)
                .eq('id', editingIngredient.id);

            if (!error) {
                setIsDialogOpen(false);
                setEditingIngredient(null);
                resetForm();
                fetchIngredients();
            }
        } else {
            const { error } = await supabase
                .from('ingredients')
                .insert([formData]);

            if (!error) {
                setIsDialogOpen(false);
                resetForm();
                fetchIngredients();
            }
        }
    };

    const handleEdit = (ingredient: Ingredient) => {
        setEditingIngredient(ingredient);
        setFormData({
            name: ingredient.name,
            ingredient_no: ingredient.ingredient_no || '',
            category: ingredient.category || '',
            base_unit: ingredient.base_unit,
            cost_per_unit: ingredient.cost_per_unit,
            supplier: ingredient.supplier || '',
        });
        setIsDialogOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (confirm('Bu malzemeyi silmek istediğinizden emin misiniz?')) {
            const { error } = await supabase
                .from('ingredients')
                .delete()
                .eq('id', id);

            if (!error) {
                fetchIngredients();
            }
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            ingredient_no: '',
            category: '',
            base_unit: 'kg',
            cost_per_unit: 0,
            supplier: '',
        });
    };

    const filteredIngredients = ingredients.filter((ing) =>
        ing.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ing.ingredient_no?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ing.category?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'TRY',
        }).format(value);
    };

    return (
        <div>
            <Header
                title="Global Malzeme Kütüphanesi"
                description="Hammaddeler ve fiyatlandırma için merkezi depo"
                breadcrumbs={[{ label: 'Kitchen OS', href: '/' }, { label: 'Malzemeler' }]}
                actions={
                    <div className="flex items-center gap-3">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" disabled={isExporting || ingredients.length === 0}>
                                    {isExporting ? (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : (
                                        <Download className="mr-2 h-4 w-4" />
                                    )}
                                    Dışa Aktar
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Malzemeler Dışa Aktar</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    onClick={async () => {
                                        setIsExporting(true);
                                        setExportFormat('pdf');
                                        try {
                                            await generateIngredientsPDF(ingredients);
                                        } catch (e) {
                                            alert('Dışa aktarma sırasında bir hata oluştu');
                                        } finally {
                                            setIsExporting(false);
                                            setExportFormat(null);
                                        }
                                    }}
                                    disabled={isExporting}
                                >
                                    <FileText className="mr-2 h-4 w-4 text-red-600" />
                                    PDF İndir
                                    {exportFormat === 'pdf' && <Loader2 className="ml-auto h-4 w-4 animate-spin" />}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() => {
                                        setIsExporting(true);
                                        setExportFormat('excel');
                                        try {
                                            generateIngredientsExcel(ingredients);
                                        } catch (e) {
                                            alert('Dışa aktarma sırasında bir hata oluştu');
                                        } finally {
                                            setIsExporting(false);
                                            setExportFormat(null);
                                        }
                                    }}
                                    disabled={isExporting}
                                >
                                    <FileSpreadsheet className="mr-2 h-4 w-4 text-green-600" />
                                    Excel İndir
                                    {exportFormat === 'excel' && <Loader2 className="ml-auto h-4 w-4 animate-spin" />}
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                        <Dialog open={isDialogOpen} onOpenChange={(open) => {
                            setIsDialogOpen(open);
                            if (!open) {
                                setEditingIngredient(null);
                                resetForm();
                            }
                        }}>
                            <DialogTrigger asChild>
                                <Button className="bg-blue-600 hover:bg-blue-700">
                                    <Plus className="mr-2 h-4 w-4" />
                                    Malzeme Ekle
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-md">
                                <DialogHeader>
                                    <DialogTitle>{editingIngredient ? 'Malzeme Düzenle' : 'Malzeme Ekle'}</DialogTitle>
                                    <DialogDescription>
                                        {editingIngredient ? 'Malzeme detaylarını güncelleyin.' : 'Global kütüphanenize yeni bir malzeme ekleyin.'}
                                    </DialogDescription>
                                </DialogHeader>
                                <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="ingredient_no">Malzeme No</Label>
                                            <Input
                                                id="ingredient_no"
                                                placeholder="MLZ-001"
                                                value={formData.ingredient_no}
                                                onChange={(e) => setFormData({ ...formData, ingredient_no: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="category">Kategori</Label>
                                            <Input
                                                id="category"
                                                placeholder="Sebze, Süt Ürünleri..."
                                                value={formData.category}
                                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="name">Malzeme Adı *</Label>
                                        <Input
                                            id="name"
                                            placeholder="örn. Roma Domatesi"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="base_unit">Temel Birim *</Label>
                                            <Select
                                                value={formData.base_unit}
                                                onValueChange={(value) => setFormData({ ...formData, base_unit: value })}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {units.length > 0 ? (
                                                        units.map((unit) => (
                                                            <SelectItem key={unit.id} value={unit.abbreviation}>
                                                                {unit.name} ({unit.abbreviation})
                                                            </SelectItem>
                                                        ))
                                                    ) : (
                                                        <>
                                                            <SelectItem value="kg">Kilogram (kg)</SelectItem>
                                                            <SelectItem value="g">Gram (g)</SelectItem>
                                                            <SelectItem value="lt">Liter (lt)</SelectItem>
                                                            <SelectItem value="ml">Milliliter (ml)</SelectItem>
                                                            <SelectItem value="unit">Unit</SelectItem>
                                                            <SelectItem value="pc">Piece</SelectItem>
                                                        </>
                                                    )}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="cost_per_unit">Birim Fiyatı (₺) *</Label>
                                            <Input
                                                id="cost_per_unit"
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                placeholder="0.00"
                                                value={formData.cost_per_unit}
                                                onChange={(e) => setFormData({ ...formData, cost_per_unit: parseFloat(e.target.value) || 0 })}
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="supplier">Tedarikçi</Label>
                                        <Input
                                            id="supplier"
                                            placeholder="örn. Taze Çiftlik Ltd"
                                            value={formData.supplier}
                                            onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                                        />
                                    </div>
                                    <div className="flex justify-end gap-3 pt-4">
                                        <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                                            İptal
                                        </Button>
                                        <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                                            {editingIngredient ? 'Malzemeyi Güncelle' : 'Malzeme Ekle'}
                                        </Button>
                                    </div>
                                </form>
                            </DialogContent>
                        </Dialog>
                    </div>
                }
            />

            <div className="p-6">
                {/* Search and Filter Bar */}
                <div className="flex items-center gap-4 mb-6">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                        <Input
                            type="search"
                            placeholder="İsim, ID veya kategoriye göre ara..."
                            className="pl-10"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <Button variant="outline">
                        <Filter className="mr-2 h-4 w-4" />
                        Filtre
                    </Button>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                ) : ingredients.length === 0 ? (
                    <EmptyState
                        icon={Package}
                        title="Malzeme Bulunamadı"
                        description="İlk malzemenizi ekleyerek global malzeme kütüphanenizi oluşturun."
                        actionLabel="Malzeme Ekle"
                        onAction={() => setIsDialogOpen(true)}
                    />
                ) : (
                    <div className="rounded-lg border border-neutral-200 bg-white overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-neutral-50">
                                    <TableHead className="font-semibold text-neutral-700">Malzeme Adı</TableHead>
                                    <TableHead className="font-semibold text-neutral-700">Temel Birim</TableHead>
                                    <TableHead className="font-semibold text-neutral-700">Piyasa Fiyatı</TableHead>
                                    <TableHead className="font-semibold text-neutral-700">Tedarikçi</TableHead>
                                    <TableHead className="font-semibold text-neutral-700 w-20">İşlemler</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredIngredients.map((ingredient) => (
                                    <TableRow key={ingredient.id} className="hover:bg-neutral-50">
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-100">
                                                    <Package className="h-4 w-4 text-red-600" />
                                                </div>
                                                <div>
                                                    <p className="font-medium text-neutral-900">{ingredient.name}</p>
                                                    <p className="text-sm text-neutral-500">
                                                        {ingredient.ingredient_no && `#${ingredient.ingredient_no}`}
                                                        {ingredient.ingredient_no && ingredient.category && ' • '}
                                                        {ingredient.category}
                                                    </p>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <span className="inline-flex items-center rounded-md border border-neutral-200 bg-neutral-50 px-2.5 py-0.5 text-sm text-neutral-700">
                                                {ingredient.base_unit}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <span className="font-medium text-neutral-900">
                                                {formatCurrency(ingredient.cost_per_unit)}
                                            </span>
                                            <span className="text-neutral-500">/{ingredient.base_unit}</span>
                                        </TableCell>
                                        <TableCell>
                                            {ingredient.supplier ? (
                                                <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                                                    {ingredient.supplier}
                                                </span>
                                            ) : (
                                                <span className="text-neutral-400">-</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => handleEdit(ingredient)}>
                                                        <Pencil className="mr-2 h-4 w-4" />
                                                        Düzenle
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={() => handleDelete(ingredient.id)}
                                                        className="text-red-600"
                                                    >
                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                        Sil
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>

                        {/* Pagination */}
                        <div className="flex items-center justify-between border-t border-neutral-200 bg-neutral-50 px-4 py-3">
                            <div className="flex items-center gap-2 text-sm text-neutral-500">
                                <span>Sayfa başına satır:</span>
                                <Select defaultValue="10">
                                    <SelectTrigger className="w-16 h-8">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="10">10</SelectItem>
                                        <SelectItem value="20">20</SelectItem>
                                        <SelectItem value="50">50</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <p className="text-sm text-neutral-500">
                                1-{filteredIngredients.length} of {ingredients.length}
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
