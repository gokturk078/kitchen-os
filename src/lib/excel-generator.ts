// Kitchen OS - Excel Generator v3.0
// Kategori bazli hiyerarsik yapi, detayli tarifler

import * as XLSX from 'xlsx';
import {
    formatDateTR,
    formatCurrencyTRY,
    formatNumberTR,
    formatPercentage,
    sanitizeFilename,
    allergenLabels,
    statusLabels,
    difficultyLabels,
    calculateProfitMargin,
    getActiveAllergens
} from './export-utils';
import type { Outlet, Recipe, Ingredient, Category, RecipeIngredientWithDetails } from '@/types/database';

/**
 * Apply column widths
 */
function setColumnWidths(ws: XLSX.WorkSheet, widths: number[]): void {
    ws['!cols'] = widths.map(w => ({ wch: w }));
}

/**
 * Generate Outlet Excel with category sheets
 */
export function generateOutletExcel(
    outlet: Outlet,
    categories: Category[],
    recipes: (Recipe & { recipe_ingredients?: RecipeIngredientWithDetails[] })[]
): void {
    const wb = XLSX.utils.book_new();

    // ===== SHEET 1: OZET =====
    const totalCost = recipes.reduce((sum, r) => sum + (r.total_cost || 0), 0);
    const totalSale = recipes.reduce((sum, r) => sum + (r.sale_price || 0), 0);

    const summaryData = [
        ['RESTORAN RAPORU'],
        [],
        ['Genel Bilgiler'],
        ['Restoran Adi', outlet.name],
        ['Tur', outlet.type || '-'],
        ['Konum', outlet.location || '-'],
        ['Durum', statusLabels[outlet.status] || outlet.status],
        ['Olusturulma Tarihi', formatDateTR(outlet.created_at)],
        [],
        ['Istatistikler'],
        ['Toplam Tarif', recipes.length],
        ['Kategori Sayisi', categories.length],
        ['Toplam Maliyet', formatCurrencyTRY(totalCost)],
        ['Toplam Satis', formatCurrencyTRY(totalSale)],
        ['Toplam Kar', formatCurrencyTRY(totalSale - totalCost)],
        [],
        ['Rapor Tarihi', formatDateTR(new Date())],
    ];

    const wsOzet = XLSX.utils.aoa_to_sheet(summaryData);
    setColumnWidths(wsOzet, [25, 45]);
    XLSX.utils.book_append_sheet(wb, wsOzet, 'Ozet');

    // ===== SHEET 2: TUM TARIFLER =====
    const allRecipesHeaders = [
        'Tarif No', 'Tarif Adi', 'Kategori', 'Zorluk', 'Hazirlik (dk)',
        'Porsiyon', 'Fire %', 'Satis Fiyati', 'Maliyet', 'Kar', 'Kar Marji'
    ];
    const allRecipesRows = recipes.map(recipe => {
        const category = categories.find(c => c.id === recipe.category_id);
        const profit = (recipe.sale_price || 0) - (recipe.total_cost || 0);
        const margin = calculateProfitMargin(recipe.sale_price, recipe.total_cost || 0);
        return [
            recipe.recipe_no,
            recipe.name,
            category?.name || 'Kategorisiz',
            recipe.difficulty ? difficultyLabels[recipe.difficulty] : '-',
            recipe.prep_time || '-',
            `${recipe.yield_amount} ${recipe.yield_unit}`,
            recipe.waste_percentage,
            formatCurrencyTRY(recipe.sale_price),
            formatCurrencyTRY(recipe.total_cost || 0),
            formatCurrencyTRY(profit),
            formatPercentage(margin)
        ];
    });

    const wsTumTarifler = XLSX.utils.aoa_to_sheet([allRecipesHeaders, ...allRecipesRows]);
    setColumnWidths(wsTumTarifler, [12, 35, 20, 10, 12, 18, 8, 18, 18, 18, 12]);
    XLSX.utils.book_append_sheet(wb, wsTumTarifler, 'Tum Tarifler');

    // ===== CATEGORY SHEETS =====
    for (const category of categories) {
        const categoryRecipes = recipes.filter(r => r.category_id === category.id);
        if (categoryRecipes.length === 0) continue;

        const catData: (string | number)[][] = [];

        for (const recipe of categoryRecipes) {
            // Recipe header
            catData.push(['']);
            catData.push(['TARIF: ' + recipe.name]);
            catData.push(['Tarif No', recipe.recipe_no]);
            catData.push(['Zorluk', recipe.difficulty ? difficultyLabels[recipe.difficulty] : '-']);
            catData.push(['Hazirlik Suresi', recipe.prep_time ? `${recipe.prep_time} dk` : '-']);
            catData.push(['Porsiyon', `${recipe.yield_amount} ${recipe.yield_unit}`]);
            catData.push(['Fire Orani', `%${recipe.waste_percentage}`]);
            catData.push(['Satis Fiyati', formatCurrencyTRY(recipe.sale_price)]);
            catData.push(['Maliyet', formatCurrencyTRY(recipe.total_cost || 0)]);
            catData.push(['Kar Marji', formatPercentage(calculateProfitMargin(recipe.sale_price, recipe.total_cost || 0))]);

            // Allergens
            const allergens = getActiveAllergens(recipe.allergens as unknown as Record<string, boolean>);
            catData.push(['Alerjenler', allergens.length > 0 ? allergens.join(', ') : 'Yok']);

            // Ingredients
            if (recipe.recipe_ingredients && recipe.recipe_ingredients.length > 0) {
                catData.push(['']);
                catData.push(['Malzemeler:']);
                catData.push(['Malzeme', 'Miktar', 'Birim', 'Hazirlik', 'Maliyet']);

                for (const ri of recipe.recipe_ingredients) {
                    const lineCost = ri.quantity * (ri.ingredient?.cost_per_unit || 0);
                    catData.push([
                        ri.ingredient?.name || '-',
                        formatNumberTR(ri.quantity, 2),
                        ri.unit || ri.ingredient?.base_unit || '-',
                        ri.prep_detail || '-',
                        formatCurrencyTRY(lineCost)
                    ]);
                }
            }

            // Instructions
            if (recipe.instructions) {
                catData.push(['']);
                catData.push(['Hazirlanis:']);
                catData.push([recipe.instructions]);
            }

            // Critical details
            if (recipe.critical_details) {
                catData.push(['']);
                catData.push(['Kritik Detaylar:']);
                catData.push([recipe.critical_details]);
            }

            catData.push(['']);
            catData.push(['----------------------------------------']);
        }

        // Sanitize sheet name (max 31 chars, no special chars)
        const sheetName = category.name.substring(0, 28).replace(/[\\\/\*\?\[\]]/g, '');
        const wsCat = XLSX.utils.aoa_to_sheet(catData);
        setColumnWidths(wsCat, [25, 15, 12, 25, 18]);
        XLSX.utils.book_append_sheet(wb, wsCat, sheetName);
    }

    // ===== UNCATEGORIZED SHEET =====
    const uncategorized = recipes.filter(r => !r.category_id);
    if (uncategorized.length > 0) {
        const uncatData: (string | number)[][] = [];

        for (const recipe of uncategorized) {
            uncatData.push(['']);
            uncatData.push(['TARIF: ' + recipe.name]);
            uncatData.push(['Tarif No', recipe.recipe_no]);
            uncatData.push(['Satis Fiyati', formatCurrencyTRY(recipe.sale_price)]);
            uncatData.push(['Maliyet', formatCurrencyTRY(recipe.total_cost || 0)]);

            if (recipe.recipe_ingredients && recipe.recipe_ingredients.length > 0) {
                uncatData.push(['']);
                uncatData.push(['Malzemeler:']);
                for (const ri of recipe.recipe_ingredients) {
                    uncatData.push([ri.ingredient?.name || '-', formatNumberTR(ri.quantity, 2), ri.unit || '-']);
                }
            }

            uncatData.push(['----------------------------------------']);
        }

        const wsUncat = XLSX.utils.aoa_to_sheet(uncatData);
        setColumnWidths(wsUncat, [25, 15, 12, 25, 18]);
        XLSX.utils.book_append_sheet(wb, wsUncat, 'Kategorisiz');
    }

    // ===== MALZEME OZETI SHEET =====
    const allIngredientsMap = new Map<string, { name: string; totalQty: number; unit: string }>();

    for (const recipe of recipes) {
        if (recipe.recipe_ingredients) {
            for (const ri of recipe.recipe_ingredients) {
                const key = ri.ingredient?.name || 'Bilinmeyen';
                const existing = allIngredientsMap.get(key);
                if (existing) {
                    existing.totalQty += ri.quantity;
                } else {
                    allIngredientsMap.set(key, {
                        name: ri.ingredient?.name || '-',
                        totalQty: ri.quantity,
                        unit: ri.unit || ri.ingredient?.base_unit || '-'
                    });
                }
            }
        }
    }

    const malzemeHeaders = ['Malzeme Adi', 'Toplam Miktar', 'Birim'];
    const malzemeRows = Array.from(allIngredientsMap.values()).map(ing => [
        ing.name,
        formatNumberTR(ing.totalQty, 2),
        ing.unit
    ]);

    const wsMalzeme = XLSX.utils.aoa_to_sheet([malzemeHeaders, ...malzemeRows]);
    setColumnWidths(wsMalzeme, [30, 18, 12]);
    XLSX.utils.book_append_sheet(wb, wsMalzeme, 'Malzeme Ozeti');

    const filename = `${sanitizeFilename(outlet.name)}_Rapor_${formatDateTR(new Date()).replace(/\s/g, '_')}.xlsx`;
    XLSX.writeFile(wb, filename);
}

/**
 * Generate Menu Excel with full recipe details per category
 */
export function generateMenuExcel(
    outlet: Outlet,
    categories: Category[],
    recipes: (Recipe & { recipe_ingredients?: RecipeIngredientWithDetails[] })[]
): void {
    const wb = XLSX.utils.book_new();

    // ===== SHEET 1: MENU OZET =====
    const menuHeaders = ['Kategori', 'Tarif No', 'Tarif Adi', 'Zorluk', 'Satis', 'Maliyet', 'Kar Marji'];
    const menuRows: (string | number)[][] = [];

    for (const category of categories) {
        const catRecipes = recipes.filter(r => r.category_id === category.id);
        for (const recipe of catRecipes) {
            menuRows.push([
                category.name,
                recipe.recipe_no,
                recipe.name,
                recipe.difficulty ? difficultyLabels[recipe.difficulty] : '-',
                formatCurrencyTRY(recipe.sale_price),
                formatCurrencyTRY(recipe.total_cost || 0),
                formatPercentage(calculateProfitMargin(recipe.sale_price, recipe.total_cost || 0))
            ]);
        }
    }

    // Add uncategorized
    const uncategorized = recipes.filter(r => !r.category_id);
    for (const recipe of uncategorized) {
        menuRows.push([
            'Kategorisiz',
            recipe.recipe_no,
            recipe.name,
            recipe.difficulty ? difficultyLabels[recipe.difficulty] : '-',
            formatCurrencyTRY(recipe.sale_price),
            formatCurrencyTRY(recipe.total_cost || 0),
            formatPercentage(calculateProfitMargin(recipe.sale_price, recipe.total_cost || 0))
        ]);
    }

    const wsMenu = XLSX.utils.aoa_to_sheet([menuHeaders, ...menuRows]);
    setColumnWidths(wsMenu, [18, 12, 35, 10, 18, 18, 12]);
    XLSX.utils.book_append_sheet(wb, wsMenu, 'Menu Ozet');

    // ===== CATEGORY SHEETS WITH FULL DETAILS =====
    for (const category of categories) {
        const categoryRecipes = recipes.filter(r => r.category_id === category.id);
        if (categoryRecipes.length === 0) continue;

        const catData: (string | number)[][] = [];

        for (const recipe of categoryRecipes) {
            catData.push(['']);
            catData.push(['TARIF: ' + recipe.name]);
            catData.push(['Tarif No', recipe.recipe_no]);
            catData.push(['Zorluk', recipe.difficulty ? difficultyLabels[recipe.difficulty] : '-']);
            catData.push(['Porsiyon', `${recipe.yield_amount} ${recipe.yield_unit}`]);
            catData.push(['Satis Fiyati', formatCurrencyTRY(recipe.sale_price)]);
            catData.push(['Maliyet', formatCurrencyTRY(recipe.total_cost || 0)]);

            const allergens = getActiveAllergens(recipe.allergens as unknown as Record<string, boolean>);
            catData.push(['Alerjenler', allergens.length > 0 ? allergens.join(', ') : 'Yok']);

            if (recipe.recipe_ingredients && recipe.recipe_ingredients.length > 0) {
                catData.push(['']);
                catData.push(['Malzemeler:']);
                catData.push(['Malzeme', 'Miktar', 'Birim', 'Hazirlik']);
                for (const ri of recipe.recipe_ingredients) {
                    catData.push([
                        ri.ingredient?.name || '-',
                        formatNumberTR(ri.quantity, 2),
                        ri.unit || ri.ingredient?.base_unit || '-',
                        ri.prep_detail || '-'
                    ]);
                }
            }

            if (recipe.instructions) {
                catData.push(['']);
                catData.push(['Hazirlanis:']);
                catData.push([recipe.instructions]);
            }

            catData.push(['----------------------------------------']);
        }

        const sheetName = category.name.substring(0, 28).replace(/[\\\/\*\?\[\]]/g, '');
        const wsCat = XLSX.utils.aoa_to_sheet(catData);
        setColumnWidths(wsCat, [25, 15, 12, 25]);
        XLSX.utils.book_append_sheet(wb, wsCat, sheetName);
    }

    const filename = `${sanitizeFilename(outlet.name)}_Menu_${formatDateTR(new Date()).replace(/\s/g, '_')}.xlsx`;
    XLSX.writeFile(wb, filename);
}

/**
 * Generate Recipe Excel
 */
export function generateRecipeExcel(
    recipe: Recipe & { recipe_ingredients?: RecipeIngredientWithDetails[] },
    outletName?: string,
    categoryName?: string
): void {
    const wb = XLSX.utils.book_new();

    // Calculate costs
    let totalIngredientCost = 0;
    if (recipe.recipe_ingredients) {
        totalIngredientCost = recipe.recipe_ingredients.reduce((sum, ri) => {
            return sum + (ri.quantity * (ri.ingredient?.cost_per_unit || 0));
        }, 0);
    }
    const wasteCost = totalIngredientCost * (recipe.waste_percentage / 100);
    const totalCost = totalIngredientCost + wasteCost;
    const profit = (recipe.sale_price || 0) - totalCost;
    const margin = calculateProfitMargin(recipe.sale_price, totalCost);

    // ===== SHEET 1: TARIF BILGILERI =====
    const infoData = [
        ['TARIF RAPORU'],
        [],
        ['Genel Bilgiler'],
        ['Tarif No', recipe.recipe_no],
        ['Tarif Adi', recipe.name],
        ['Restoran', outletName || '-'],
        ['Kategori', categoryName || '-'],
        ['Zorluk', recipe.difficulty ? difficultyLabels[recipe.difficulty] : '-'],
        ['Hazirlik Suresi', recipe.prep_time ? `${recipe.prep_time} dakika` : '-'],
        ['Porsiyon', `${recipe.yield_amount} ${recipe.yield_unit}`],
        ['Fire Orani', formatPercentage(recipe.waste_percentage)],
        ['Durum', statusLabels[recipe.status] || recipe.status],
        [],
        ['Maliyet Analizi'],
        ['Malzeme Maliyeti', formatCurrencyTRY(totalIngredientCost)],
        ['Fire Maliyeti', formatCurrencyTRY(wasteCost)],
        ['Toplam Maliyet', formatCurrencyTRY(totalCost)],
        ['Satis Fiyati', formatCurrencyTRY(recipe.sale_price)],
        ['Kar', formatCurrencyTRY(profit)],
        ['Kar Marji', formatPercentage(margin)],
        [],
        ['Hazirlanis'],
        [recipe.instructions || '-'],
        [],
        ['Kritik Detaylar'],
        [recipe.critical_details || '-'],
    ];

    const wsInfo = XLSX.utils.aoa_to_sheet(infoData);
    setColumnWidths(wsInfo, [25, 60]);
    XLSX.utils.book_append_sheet(wb, wsInfo, 'Tarif Bilgileri');

    // ===== SHEET 2: MALZEMELER =====
    if (recipe.recipe_ingredients && recipe.recipe_ingredients.length > 0) {
        const ingredientHeaders = ['Malzeme', 'Miktar', 'Birim', 'Hazirlik', 'Birim Fiyat', 'Toplam'];
        const ingredientRows = recipe.recipe_ingredients.map(ri => {
            const lineCost = ri.quantity * (ri.ingredient?.cost_per_unit || 0);
            return [
                ri.ingredient?.name || '-',
                formatNumberTR(ri.quantity, 2),
                ri.unit || ri.ingredient?.base_unit || '-',
                ri.prep_detail || '-',
                formatCurrencyTRY(ri.ingredient?.cost_per_unit || 0),
                formatCurrencyTRY(lineCost)
            ];
        });

        const wsIngredients = XLSX.utils.aoa_to_sheet([ingredientHeaders, ...ingredientRows]);
        setColumnWidths(wsIngredients, [28, 12, 12, 28, 18, 18]);
        XLSX.utils.book_append_sheet(wb, wsIngredients, 'Malzemeler');
    }

    // ===== SHEET 3: ALERJENLER =====
    const allergenHeaders = ['Alerjen', 'Durum'];
    const allergenRows = Object.entries(recipe.allergens as unknown as Record<string, boolean>).map(([key, value]) => [
        allergenLabels[key] || key,
        value ? 'EVET' : 'Hayir'
    ]);

    const wsAllergens = XLSX.utils.aoa_to_sheet([allergenHeaders, ...allergenRows]);
    setColumnWidths(wsAllergens, [28, 15]);
    XLSX.utils.book_append_sheet(wb, wsAllergens, 'Alerjenler');

    const filename = `${sanitizeFilename(recipe.recipe_no)}_${sanitizeFilename(recipe.name)}.xlsx`;
    XLSX.writeFile(wb, filename);
}

/**
 * Generate Ingredients Library Excel
 */
export function generateIngredientsExcel(ingredients: Ingredient[]): void {
    const wb = XLSX.utils.book_new();

    // ===== SHEET 1: TUM MALZEMELER =====
    const headers = ['Malzeme No', 'Malzeme Adi', 'Kategori', 'Birim', 'Birim Fiyat', 'Tedarikci'];
    const rows = ingredients.map(ing => [
        ing.ingredient_no || '-',
        ing.name,
        ing.category || '-',
        ing.base_unit,
        formatCurrencyTRY(ing.cost_per_unit),
        ing.supplier || '-'
    ]);

    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    setColumnWidths(ws, [15, 32, 22, 12, 18, 28]);
    XLSX.utils.book_append_sheet(wb, ws, 'Tum Malzemeler');

    // ===== CATEGORY SHEETS =====
    const categories = [...new Set(ingredients.map(i => i.category || 'Kategorisiz'))];

    for (const category of categories) {
        const catIngredients = ingredients.filter(i => (i.category || 'Kategorisiz') === category);

        const catData = catIngredients.map(ing => [
            ing.ingredient_no || '-',
            ing.name,
            ing.base_unit,
            formatCurrencyTRY(ing.cost_per_unit),
            ing.supplier || '-'
        ]);

        const sheetName = category.substring(0, 28).replace(/[\\\/\*\?\[\]]/g, '');
        const wsCat = XLSX.utils.aoa_to_sheet([['No', 'Malzeme Adi', 'Birim', 'Fiyat', 'Tedarikci'], ...catData]);
        setColumnWidths(wsCat, [15, 32, 12, 18, 28]);
        XLSX.utils.book_append_sheet(wb, wsCat, sheetName);
    }

    const filename = `Malzeme_Kutuphanesi_${formatDateTR(new Date()).replace(/\s/g, '_')}.xlsx`;
    XLSX.writeFile(wb, filename);
}
