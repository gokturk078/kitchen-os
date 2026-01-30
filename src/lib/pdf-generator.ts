// Kitchen OS - PDF Generator v3.0
// Temiz format, kategori bazli hiyerarsik yapi

import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
    formatDateTR,
    formatDateTimeTR,
    formatCurrencyTRY,
    formatNumberTR,
    formatPercentage,
    sanitizeFilename,
    generateReportId,
    allergenLabels,
    statusLabels,
    difficultyLabels,
    calculateProfitMargin,
    getActiveAllergens
} from './export-utils';
import type { Outlet, Recipe, Ingredient, Category, RecipeIngredientWithDetails } from '@/types/database';

// Extend jsPDF types for autoTable
declare module 'jspdf' {
    interface jsPDF {
        lastAutoTable: { finalY: number };
    }
}

// Color palette (RGB arrays)
const COLORS = {
    primary: [37, 99, 235] as [number, number, number],
    secondary: [100, 100, 100] as [number, number, number],
    success: [22, 163, 74] as [number, number, number],
    warning: [217, 119, 6] as [number, number, number],
    danger: [220, 38, 38] as [number, number, number],
    light: [245, 245, 245] as [number, number, number],
    dark: [30, 30, 30] as [number, number, number],
};

/**
 * Add header to PDF
 */
function addHeader(doc: jsPDF, title: string, subtitle?: string): number {
    const pageWidth = doc.internal.pageSize.getWidth();
    const reportId = generateReportId();

    // Header background
    doc.setFillColor(...COLORS.light);
    doc.rect(0, 0, pageWidth, 35, 'F');

    // Title
    doc.setFontSize(20);
    doc.setTextColor(...COLORS.primary);
    doc.text(title, 14, 18);

    // Subtitle
    if (subtitle) {
        doc.setFontSize(10);
        doc.setTextColor(...COLORS.secondary);
        doc.text(subtitle, 14, 26);
    }

    // Report info
    doc.setFontSize(8);
    doc.setTextColor(...COLORS.secondary);
    doc.text(`Rapor: ${reportId}`, pageWidth - 14, 14, { align: 'right' });
    doc.text(formatDateTimeTR(new Date()), pageWidth - 14, 22, { align: 'right' });

    // Line
    doc.setDrawColor(...COLORS.primary);
    doc.setLineWidth(0.5);
    doc.line(14, 35, pageWidth - 14, 35);

    return 45;
}

/**
 * Add section header
 */
function addSectionHeader(doc: jsPDF, title: string, yPos: number): number {
    const pageWidth = doc.internal.pageSize.getWidth();

    doc.setFillColor(...COLORS.primary);
    doc.rect(14, yPos - 4, pageWidth - 28, 10, 'F');

    doc.setFontSize(11);
    doc.setTextColor(255, 255, 255);
    doc.text(title, 18, yPos + 3);

    return yPos + 14;
}

/**
 * Add subsection header
 */
function addSubsectionHeader(doc: jsPDF, title: string, yPos: number): number {
    const pageWidth = doc.internal.pageSize.getWidth();

    doc.setFillColor(...COLORS.light);
    doc.rect(14, yPos - 3, pageWidth - 28, 8, 'F');

    doc.setFontSize(10);
    doc.setTextColor(...COLORS.dark);
    doc.text(title, 18, yPos + 2);

    return yPos + 12;
}

/**
 * Add footer to all pages
 */
function addFooter(doc: jsPDF): void {
    const pageCount = doc.getNumberOfPages();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(...COLORS.secondary);
        doc.text(`Sayfa ${i} / ${pageCount}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
        doc.text('Kitchen OS', 14, pageHeight - 10);
        doc.text(formatDateTR(new Date()), pageWidth - 14, pageHeight - 10, { align: 'right' });
    }
}

/**
 * Check if page break needed
 */
function checkPageBreak(doc: jsPDF, yPos: number, minSpace: number = 60): number {
    const pageHeight = doc.internal.pageSize.getHeight();
    if (yPos > pageHeight - minSpace) {
        doc.addPage();
        return 20;
    }
    return yPos;
}

/**
 * Add full recipe details to PDF
 */
function addRecipeDetails(
    doc: jsPDF,
    recipe: Recipe & { recipe_ingredients?: RecipeIngredientWithDetails[] },
    yPos: number,
    categoryName?: string
): number {
    const pageWidth = doc.internal.pageSize.getWidth();
    yPos = checkPageBreak(doc, yPos, 80);

    // Recipe title bar
    doc.setFillColor(...COLORS.light);
    doc.rect(14, yPos - 3, pageWidth - 28, 12, 'F');

    doc.setFontSize(11);
    doc.setTextColor(...COLORS.dark);
    doc.text(`${recipe.recipe_no} - ${recipe.name}`, 18, yPos + 4);

    // Recipe meta
    doc.setFontSize(8);
    doc.setTextColor(...COLORS.secondary);
    const meta = [
        categoryName || 'Kategorisiz',
        recipe.difficulty ? difficultyLabels[recipe.difficulty] : '-',
        recipe.prep_time ? `${recipe.prep_time} dk` : '-',
        `${recipe.yield_amount} ${recipe.yield_unit}`
    ].join('  |  ');
    doc.text(meta, pageWidth - 18, yPos + 4, { align: 'right' });

    yPos += 16;

    // Ingredients table
    if (recipe.recipe_ingredients && recipe.recipe_ingredients.length > 0) {
        doc.setFontSize(9);
        doc.setTextColor(...COLORS.dark);
        doc.text('Malzemeler:', 14, yPos);
        yPos += 5;

        let totalCost = 0;
        const ingredientData = recipe.recipe_ingredients.map(ri => {
            const lineCost = ri.quantity * (ri.ingredient?.cost_per_unit || 0);
            totalCost += lineCost;
            return [
                ri.ingredient?.name || '-',
                formatNumberTR(ri.quantity, 2),
                ri.unit || ri.ingredient?.base_unit || '-',
                ri.prep_detail || '-',
                formatCurrencyTRY(lineCost)
            ];
        });

        autoTable(doc, {
            startY: yPos,
            head: [['Malzeme', 'Miktar', 'Birim', 'Hazirlik', 'Maliyet']],
            body: ingredientData,
            theme: 'striped',
            headStyles: { fillColor: COLORS.secondary, fontSize: 8 },
            styles: { fontSize: 8, cellPadding: 2 },
            columnStyles: {
                0: { cellWidth: 'auto' },
                1: { cellWidth: 18, halign: 'center' },
                2: { cellWidth: 15, halign: 'center' },
                3: { cellWidth: 30 },
                4: { cellWidth: 25, halign: 'right' }
            },
            margin: { left: 14, right: 14 }
        });

        yPos = doc.lastAutoTable.finalY + 5;

        // Cost summary
        const wasteCost = totalCost * (recipe.waste_percentage / 100);
        const grandTotal = totalCost + wasteCost;
        const margin = calculateProfitMargin(recipe.sale_price, grandTotal);

        doc.setFontSize(8);
        doc.setTextColor(...COLORS.dark);
        const costLine = `Malzeme: ${formatCurrencyTRY(totalCost)} | Fire (%${recipe.waste_percentage}): ${formatCurrencyTRY(wasteCost)} | Toplam: ${formatCurrencyTRY(grandTotal)} | Satis: ${formatCurrencyTRY(recipe.sale_price)} | Kar Marji: ${formatPercentage(margin)}`;
        doc.text(costLine, 14, yPos);
        yPos += 6;
    }

    // Allergens
    const allergens = getActiveAllergens(recipe.allergens as unknown as Record<string, boolean>);
    if (allergens.length > 0) {
        doc.setFontSize(8);
        doc.setTextColor(...COLORS.danger);
        doc.text(`Alerjenler: ${allergens.join(', ')}`, 14, yPos);
        yPos += 6;
    }

    // Instructions
    if (recipe.instructions) {
        yPos = checkPageBreak(doc, yPos, 30);
        doc.setFontSize(8);
        doc.setTextColor(...COLORS.dark);
        doc.text('Hazirlanis:', 14, yPos);
        yPos += 4;

        doc.setFontSize(8);
        const lines = doc.splitTextToSize(recipe.instructions, pageWidth - 32);
        doc.text(lines, 14, yPos);
        yPos += lines.length * 3.5 + 3;
    }

    // Critical details
    if (recipe.critical_details) {
        yPos = checkPageBreak(doc, yPos, 20);
        doc.setFontSize(8);
        doc.setTextColor(...COLORS.warning);
        doc.text('Kritik Detaylar:', 14, yPos);
        yPos += 4;

        doc.setFontSize(8);
        doc.setTextColor(...COLORS.dark);
        const lines = doc.splitTextToSize(recipe.critical_details, pageWidth - 32);
        doc.text(lines, 14, yPos);
        yPos += lines.length * 3.5 + 3;
    }

    return yPos + 8;
}

/**
 * Generate Outlet PDF with category hierarchy
 */
export async function generateOutletPDF(
    outlet: Outlet,
    categories: Category[],
    recipes: (Recipe & { recipe_ingredients?: RecipeIngredientWithDetails[] })[]
): Promise<void> {
    const doc = new jsPDF();
    let yPos = addHeader(doc, outlet.name, 'Restoran Raporu');

    // General info
    yPos = addSectionHeader(doc, 'Genel Bilgiler', yPos);

    autoTable(doc, {
        startY: yPos,
        head: [],
        body: [
            ['Restoran Adi', outlet.name],
            ['Tur', outlet.type || '-'],
            ['Konum', outlet.location || '-'],
            ['Durum', statusLabels[outlet.status] || outlet.status],
            ['Olusturulma', formatDateTR(outlet.created_at)],
        ],
        theme: 'plain',
        styles: { fontSize: 9, cellPadding: 2 },
        columnStyles: { 0: { fontStyle: 'bold', cellWidth: 40 } },
        margin: { left: 14, right: 14 }
    });

    yPos = doc.lastAutoTable.finalY + 10;

    // Statistics
    const totalCost = recipes.reduce((sum, r) => sum + (r.total_cost || 0), 0);
    const totalSale = recipes.reduce((sum, r) => sum + (r.sale_price || 0), 0);

    yPos = addSectionHeader(doc, 'Istatistikler', yPos);

    autoTable(doc, {
        startY: yPos,
        head: [],
        body: [
            ['Toplam Tarif', recipes.length.toString()],
            ['Kategori Sayisi', categories.length.toString()],
            ['Toplam Maliyet', formatCurrencyTRY(totalCost)],
            ['Toplam Satis', formatCurrencyTRY(totalSale)],
            ['Toplam Kar', formatCurrencyTRY(totalSale - totalCost)],
        ],
        theme: 'plain',
        styles: { fontSize: 9, cellPadding: 2 },
        columnStyles: { 0: { fontStyle: 'bold', cellWidth: 40 } },
        margin: { left: 14, right: 14 }
    });

    yPos = doc.lastAutoTable.finalY + 15;

    // Categories with recipes
    for (const category of categories) {
        const categoryRecipes = recipes.filter(r => r.category_id === category.id);
        if (categoryRecipes.length === 0) continue;

        yPos = checkPageBreak(doc, yPos, 50);
        yPos = addSectionHeader(doc, `${category.name} (${categoryRecipes.length} tarif)`, yPos);

        for (const recipe of categoryRecipes) {
            yPos = addRecipeDetails(doc, recipe, yPos, category.name);
        }

        yPos += 5;
    }

    // Uncategorized
    const uncategorized = recipes.filter(r => !r.category_id);
    if (uncategorized.length > 0) {
        yPos = checkPageBreak(doc, yPos, 50);
        yPos = addSectionHeader(doc, `Kategorisiz (${uncategorized.length} tarif)`, yPos);

        for (const recipe of uncategorized) {
            yPos = addRecipeDetails(doc, recipe, yPos);
        }
    }

    addFooter(doc);

    const filename = `${sanitizeFilename(outlet.name)}_Rapor_${formatDateTR(new Date()).replace(/\s/g, '_')}.pdf`;
    doc.save(filename);
}

/**
 * Generate Menu PDF with category hierarchy
 */
export async function generateMenuPDF(
    outlet: Outlet,
    categories: Category[],
    recipes: (Recipe & { recipe_ingredients?: RecipeIngredientWithDetails[] })[]
): Promise<void> {
    const doc = new jsPDF();
    let yPos = addHeader(doc, `${outlet.name} - Menu`, 'Detayli Tarif Listesi');

    // Categories with recipes
    for (const category of categories) {
        const categoryRecipes = recipes.filter(r => r.category_id === category.id);
        if (categoryRecipes.length === 0) continue;

        yPos = checkPageBreak(doc, yPos, 50);
        yPos = addSectionHeader(doc, `${category.name} (${categoryRecipes.length} tarif)`, yPos);

        for (const recipe of categoryRecipes) {
            yPos = addRecipeDetails(doc, recipe, yPos, category.name);
        }

        yPos += 5;
    }

    // Uncategorized
    const uncategorized = recipes.filter(r => !r.category_id);
    if (uncategorized.length > 0) {
        yPos = checkPageBreak(doc, yPos, 50);
        yPos = addSectionHeader(doc, `Kategorisiz (${uncategorized.length} tarif)`, yPos);

        for (const recipe of uncategorized) {
            yPos = addRecipeDetails(doc, recipe, yPos);
        }
    }

    addFooter(doc);

    const filename = `${sanitizeFilename(outlet.name)}_Menu_${formatDateTR(new Date()).replace(/\s/g, '_')}.pdf`;
    doc.save(filename);
}

/**
 * Generate single Recipe PDF
 */
export async function generateRecipePDF(
    recipe: Recipe & { recipe_ingredients?: RecipeIngredientWithDetails[] },
    outletName?: string,
    categoryName?: string
): Promise<void> {
    const doc = new jsPDF();
    let yPos = addHeader(doc, recipe.name, `Tarif No: ${recipe.recipe_no}`);

    // General info
    yPos = addSectionHeader(doc, 'Tarif Bilgileri', yPos);

    autoTable(doc, {
        startY: yPos,
        head: [],
        body: [
            ['Tarif No', recipe.recipe_no],
            ['Tarif Adi', recipe.name],
            ['Restoran', outletName || '-'],
            ['Kategori', categoryName || '-'],
            ['Zorluk', recipe.difficulty ? difficultyLabels[recipe.difficulty] : '-'],
            ['Hazirlik Suresi', recipe.prep_time ? `${recipe.prep_time} dakika` : '-'],
            ['Porsiyon', `${recipe.yield_amount} ${recipe.yield_unit}`],
            ['Fire Orani', formatPercentage(recipe.waste_percentage)],
            ['Durum', statusLabels[recipe.status] || recipe.status],
        ],
        theme: 'plain',
        styles: { fontSize: 9, cellPadding: 2 },
        columnStyles: { 0: { fontStyle: 'bold', cellWidth: 40 } },
        margin: { left: 14, right: 14 }
    });

    yPos = doc.lastAutoTable.finalY + 10;

    // Ingredients
    if (recipe.recipe_ingredients && recipe.recipe_ingredients.length > 0) {
        yPos = addSectionHeader(doc, 'Malzemeler', yPos);

        let totalCost = 0;
        const ingredientData = recipe.recipe_ingredients.map(ri => {
            const lineCost = ri.quantity * (ri.ingredient?.cost_per_unit || 0);
            totalCost += lineCost;
            return [
                ri.ingredient?.name || '-',
                formatNumberTR(ri.quantity, 2),
                ri.unit || ri.ingredient?.base_unit || '-',
                ri.prep_detail || '-',
                formatCurrencyTRY(ri.ingredient?.cost_per_unit || 0),
                formatCurrencyTRY(lineCost)
            ];
        });

        autoTable(doc, {
            startY: yPos,
            head: [['Malzeme', 'Miktar', 'Birim', 'Hazirlik', 'Birim Fiyat', 'Toplam']],
            body: ingredientData,
            theme: 'striped',
            headStyles: { fillColor: COLORS.primary, fontSize: 9 },
            styles: { fontSize: 9, cellPadding: 3 },
            columnStyles: {
                4: { halign: 'right' },
                5: { halign: 'right' }
            },
            margin: { left: 14, right: 14 }
        });

        yPos = doc.lastAutoTable.finalY + 10;

        // Cost analysis
        yPos = addSubsectionHeader(doc, 'Maliyet Analizi', yPos);

        const wasteCost = totalCost * (recipe.waste_percentage / 100);
        const grandTotal = totalCost + wasteCost;
        const profit = (recipe.sale_price || 0) - grandTotal;
        const margin = calculateProfitMargin(recipe.sale_price, grandTotal);

        autoTable(doc, {
            startY: yPos,
            head: [],
            body: [
                ['Malzeme Maliyeti', formatCurrencyTRY(totalCost)],
                [`Fire Maliyeti (%${recipe.waste_percentage})`, formatCurrencyTRY(wasteCost)],
                ['Toplam Maliyet', formatCurrencyTRY(grandTotal)],
                ['Satis Fiyati', formatCurrencyTRY(recipe.sale_price)],
                ['Kar', formatCurrencyTRY(profit)],
                ['Kar Marji', formatPercentage(margin)],
            ],
            theme: 'plain',
            styles: { fontSize: 9, cellPadding: 2 },
            columnStyles: { 0: { fontStyle: 'bold', cellWidth: 50 }, 1: { halign: 'right' } },
            margin: { left: 14, right: 14 }
        });

        yPos = doc.lastAutoTable.finalY + 10;
    }

    // Allergens
    const allergens = getActiveAllergens(recipe.allergens as unknown as Record<string, boolean>);
    if (allergens.length > 0) {
        yPos = checkPageBreak(doc, yPos, 30);
        yPos = addSubsectionHeader(doc, 'Alerjenler', yPos);
        doc.setFontSize(10);
        doc.setTextColor(...COLORS.danger);
        doc.text(allergens.join(', '), 14, yPos);
        doc.setTextColor(...COLORS.dark);
        yPos += 10;
    }

    // Instructions
    if (recipe.instructions) {
        yPos = checkPageBreak(doc, yPos, 40);
        yPos = addSectionHeader(doc, 'Hazirlanis', yPos);
        doc.setFontSize(9);
        doc.setTextColor(...COLORS.dark);
        const lines = doc.splitTextToSize(recipe.instructions, 180);
        doc.text(lines, 14, yPos);
        yPos += lines.length * 4 + 10;
    }

    // Critical details
    if (recipe.critical_details) {
        yPos = checkPageBreak(doc, yPos, 30);
        yPos = addSubsectionHeader(doc, 'Kritik Detaylar', yPos);
        doc.setFontSize(9);
        doc.setTextColor(...COLORS.dark);
        const lines = doc.splitTextToSize(recipe.critical_details, 180);
        doc.text(lines, 14, yPos);
    }

    addFooter(doc);

    const filename = `${sanitizeFilename(recipe.recipe_no)}_${sanitizeFilename(recipe.name)}.pdf`;
    doc.save(filename);
}

/**
 * Generate Ingredients Library PDF
 */
export async function generateIngredientsPDF(ingredients: Ingredient[]): Promise<void> {
    const doc = new jsPDF();
    let yPos = addHeader(doc, 'Malzeme Kutuphanesi', `${ingredients.length} malzeme`);

    // Group by category
    const categories = [...new Set(ingredients.map(i => i.category || 'Kategorisiz'))];

    for (const category of categories) {
        const catIngredients = ingredients.filter(i => (i.category || 'Kategorisiz') === category);

        yPos = checkPageBreak(doc, yPos, 40);
        yPos = addSectionHeader(doc, `${category} (${catIngredients.length} malzeme)`, yPos);

        const data = catIngredients.map(ing => [
            ing.ingredient_no || '-',
            ing.name,
            ing.base_unit,
            formatCurrencyTRY(ing.cost_per_unit),
            ing.supplier || '-'
        ]);

        autoTable(doc, {
            startY: yPos,
            head: [['No', 'Malzeme Adi', 'Birim', 'Birim Fiyat', 'Tedarikci']],
            body: data,
            theme: 'striped',
            headStyles: { fillColor: COLORS.secondary, fontSize: 9 },
            styles: { fontSize: 9, cellPadding: 2 },
            columnStyles: {
                0: { cellWidth: 20 },
                1: { cellWidth: 'auto' },
                2: { cellWidth: 18 },
                3: { cellWidth: 28, halign: 'right' },
                4: { cellWidth: 35 }
            },
            margin: { left: 14, right: 14 }
        });

        yPos = doc.lastAutoTable.finalY + 10;
    }

    addFooter(doc);

    const filename = `Malzeme_Kutuphanesi_${formatDateTR(new Date()).replace(/\s/g, '_')}.pdf`;
    doc.save(filename);
}
