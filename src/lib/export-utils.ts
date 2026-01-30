// Kitchen OS - Export Utilities
// Merkezi dışa aktarma yardımcı fonksiyonları

/**
 * Format date in Turkish locale
 */
export function formatDateTR(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
}

/**
 * Format date and time in Turkish locale
 */
export function formatDateTimeTR(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Format currency in Turkish Lira (clean format for PDF)
 */
export function formatCurrencyTRY(value: number | null | undefined): string {
  if (value === null || value === undefined) return '-';
  const formatted = new Intl.NumberFormat('tr-TR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
  return `${formatted} TL`;
}

/**
 * Format number with Turkish locale
 */
export function formatNumberTR(value: number, decimals: number = 2): string {
  return new Intl.NumberFormat('tr-TR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(value);
}

/**
 * Format percentage
 */
export function formatPercentage(value: number): string {
  return `%${formatNumberTR(value, 1)}`;
}

/**
 * Sanitize filename for safe download
 */
export function sanitizeFilename(name: string): string {
  return name
    .replace(/[<>:"/\\|?*]/g, '') // Remove invalid chars
    .replace(/\s+/g, '_')          // Replace spaces with underscores
    .replace(/_{2,}/g, '_')        // Remove multiple underscores
    .substring(0, 100);            // Limit length
}

/**
 * Generate report ID
 */
export function generateReportId(): string {
  const now = new Date();
  const date = now.toISOString().split('T')[0].replace(/-/g, '');
  const time = now.toTimeString().split(' ')[0].replace(/:/g, '').substring(0, 4);
  return `RPT-${date}-${time}`;
}

/**
 * Download blob as file
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Allergen labels in Turkish
 */
export const allergenLabels: Record<string, string> = {
  gluten: 'Gluten',
  lactose: 'Laktoz',
  yeast: 'Maya',
  egg: 'Yumurta',
  fish: 'Balık',
  milk: 'Süt',
  peanut: 'Yer Fıstığı',
  shellfish: 'Kabuklu Deniz Ürünleri',
  soya: 'Soya',
  nuts: 'Kuruyemiş',
  wheat: 'Buğday',
  celery: 'Kereviz',
  mustard: 'Hardal',
  sesame: 'Susam',
  sulphites: 'Sülfitler'
};

/**
 * Status labels in Turkish
 */
export const statusLabels: Record<string, string> = {
  active: 'Aktif',
  inactive: 'Pasif',
  maintenance: 'Bakımda',
  closed: 'Kapalı',
  archived: 'Arşivlenmiş'
};

/**
 * Difficulty labels in Turkish
 */
export const difficultyLabels: Record<string, string> = {
  Easy: 'Kolay',
  Medium: 'Orta',
  Hard: 'Zor'
};

/**
 * Calculate profit margin percentage
 */
export function calculateProfitMargin(salePrice: number | null, cost: number): number {
  if (!salePrice || salePrice === 0) return 0;
  return ((salePrice - cost) / salePrice) * 100;
}

/**
 * Get active allergens from allergen object
 */
export function getActiveAllergens(allergens: Record<string, boolean>): string[] {
  return Object.entries(allergens)
    .filter(([, active]) => active)
    .map(([key]) => allergenLabels[key] || key);
}
