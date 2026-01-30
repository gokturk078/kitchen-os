
'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { EmptyState } from '@/components/ui/empty-state';
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
import { Badge } from '@/components/ui/badge';
import { ChefHat, Plus, Search, Download, FileText, FileSpreadsheet, Loader2 } from 'lucide-react';
import { ManageCategoriesDialog } from '@/components/recipes/ManageCategoriesDialog';
import { supabase } from '@/lib/supabase';
import { generateMenuPDF } from '@/lib/pdf-generator';
import { generateMenuExcel } from '@/lib/excel-generator';
import type { Recipe, Category, Outlet } from '@/types/database';
import Link from 'next/link';
import { RecipeRow } from '@/components/recipes/RecipeRow';

export default function RecipesPage() {
    const params = useParams();
    const outletId = params.outletId as string;

    const [recipes, setRecipes] = useState<Recipe[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [outlet, setOutlet] = useState<Outlet | null>(null);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState<string>('all');
    const [isExporting, setIsExporting] = useState(false);
    const [exportFormat, setExportFormat] = useState<'pdf' | 'excel' | null>(null);

    const fetchOutlet = async () => {
        const { data } = await supabase
            .from('outlets')
            .select('*')
            .eq('id', outletId)
            .single();

        if (data) setOutlet(data);
    };

    const fetchCategories = async () => {
        const { data } = await supabase
            .from('categories')
            .select('*')
            .eq('outlet_id', outletId)
            .order('sort_order');

        if (data) setCategories(data);
    };

    const fetchRecipes = async () => {
        setLoading(true);
        let query = supabase
            .from('recipes')
            .select(`
        *,
        category:categories(*),
        recipe_ingredients (
          quantity,
          ingredient:ingredients(cost_per_unit)
        )
      `)
            .eq('outlet_id', outletId)
            .order('created_at', { ascending: false });

        // Filter by category if outlet has categories
        if (categoryFilter !== 'all') {
            query = query.eq('category_id', categoryFilter);
        }

        const { data, error } = await query;

        if (!error && data) {
            // Calculate total cost for key display
            const recipesWithCost = data.map((recipe: any) => {
                const ingredientsCost = recipe.recipe_ingredients?.reduce((sum: number, ri: any) => {
                    const cost = ri.ingredient?.cost_per_unit || 0;
                    return sum + (cost * ri.quantity);
                }, 0) || 0;

                const wastePercentage = recipe.waste_percentage || 5;
                const totalCost = ingredientsCost * (1 + wastePercentage / 100);

                return {
                    ...recipe,
                    total_cost: totalCost
                };
            });
            setRecipes(recipesWithCost);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchOutlet();
        fetchCategories();
        fetchRecipes();
    }, [outletId, categoryFilter]);

    const filteredRecipes = recipes.filter((recipe) =>
        recipe.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        recipe.recipe_no.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleExport = async (format: 'pdf' | 'excel') => {
        if (!outlet) return;

        try {
            setIsExporting(true);
            setExportFormat(format);

            // Fetch full recipe data with ingredients for detailed export
            const { data: fullRecipes } = await supabase
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
                .eq('outlet_id', outletId)
                .order('created_at', { ascending: false });

            const recipesWithCost = (fullRecipes || []).map((recipe: any) => {
                const ingredientsCost = recipe.recipe_ingredients?.reduce((sum: number, ri: any) => {
                    const cost = ri.ingredient?.cost_per_unit || 0;
                    return sum + (cost * ri.quantity);
                }, 0) || 0;
                const wastePercentage = recipe.waste_percentage || 5;
                const totalCost = ingredientsCost * (1 + wastePercentage / 100);
                return { ...recipe, total_cost: totalCost };
            });

            if (format === 'pdf') {
                await generateMenuPDF(outlet, categories, recipesWithCost);
            } else {
                generateMenuExcel(outlet, categories, recipesWithCost);
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
        <div>
            <Header
                title="Tarifler"
                description="Bu restoranın malzemelerini, maliyetlerini ve fiyatlandırmasını yönetin"
                breadcrumbs={[
                    { label: 'Restoranlar', href: '/outlets' },
                    { label: outlet?.name || 'Yükleniyor...', href: `/outlets/${outletId}` },
                    { label: 'Tarifler' },
                ]}
                actions={
                    <div className="flex items-center gap-2">
                        {/* Export Dropdown */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" disabled={isExporting || recipes.length === 0}>
                                    {isExporting ? (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : (
                                        <Download className="mr-2 h-4 w-4" />
                                    )}
                                    Dışa Aktar
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Menü Dışa Aktar</DropdownMenuLabel>
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

                        <Link
                            href={
                                categoryFilter !== 'all'
                                    ? `/outlets/${outletId}/recipes/new?categoryId=${categoryFilter}`
                                    : `/outlets/${outletId}/recipes/new`
                            }
                        >
                            <Button className="bg-blue-600 hover:bg-blue-700">
                                <Plus className="mr-2 h-4 w-4" />
                                Yeni Tarif Oluştur
                            </Button>
                        </Link>
                    </div>
                }
            />

            <div className="p-6">
                {/* Filters */}
                <div className="flex items-center gap-4 mb-6">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                        <Input
                            type="search"
                            placeholder="İsim, ID veya malzeme ile ara..."
                            className="pl-10"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                        <SelectTrigger className="w-40">
                            <SelectValue placeholder="Kategori: Tümü" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Tüm Kategoriler</SelectItem>
                            {categories.map((cat) => (
                                <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select defaultValue="active">
                        <SelectTrigger className="w-36">
                            <SelectValue placeholder="Durum" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="active">Aktif</SelectItem>
                            <SelectItem value="inactive">Pasif</SelectItem>
                            <SelectItem value="all">Tümü</SelectItem>
                        </SelectContent>
                    </Select>
                    <ManageCategoriesDialog outletId={outletId} onUpdate={fetchCategories} />
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                ) : recipes.length === 0 ? (
                    <EmptyState
                        icon={ChefHat}
                        title="Tarif Bulunamadı"
                        description="İlk tarifinizi oluşturarak menünüzü oluşturmaya başlayın."
                        actionLabel="Yeni Tarif Oluştur"
                        actionHref={`/outlets/${outletId}/recipes/new`}
                    />
                ) : (
                    <div className="rounded-lg border border-neutral-200 bg-white overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-neutral-50">
                                    <TableHead className="w-20 font-semibold text-neutral-700">T-NO</TableHead>
                                    <TableHead className="w-16 font-semibold text-neutral-700">Görsel</TableHead>
                                    <TableHead className="font-semibold text-neutral-700">Tarif Adı</TableHead>
                                    <TableHead className="font-semibold text-neutral-700">Kategori</TableHead>
                                    <TableHead className="font-semibold text-neutral-700">Satış Fiyatı</TableHead>
                                    <TableHead className="font-semibold text-neutral-700">Hesap. Maliyet</TableHead>
                                    <TableHead className="w-12"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredRecipes.map((recipe) => (
                                    <RecipeRow
                                        key={recipe.id}
                                        recipe={recipe}
                                        outletId={outletId}
                                        outletName={outlet?.name}
                                        onDeleteSuccess={fetchRecipes}
                                    />
                                ))}
                            </TableBody>
                        </Table>

                        {/* Pagination */}
                        <div className="flex items-center justify-between border-t border-neutral-200 bg-neutral-50 px-4 py-3">
                            <p className="text-sm text-neutral-500">
                                {filteredRecipes.length} / {recipes.length} sonuç gösteriliyor
                            </p>
                            <div className="flex items-center gap-2">
                                <Button variant="outline" size="sm" disabled>
                                    Önceki
                                </Button>
                                <Button variant="outline" size="sm" disabled>
                                    Sonraki
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
