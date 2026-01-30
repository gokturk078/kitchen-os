'use client';

import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Store, Image as ImageIcon } from 'lucide-react';
import type { Recipe } from '@/types/database';

interface GlobalRecipeCardProps {
    recipe: Recipe & {
        outlet?: { id: string; name: string } | null;
        category?: {
            name: string;
            outlet?: {
                id: string;
                name: string;
            } | null;
        } | null;
    };
}

export function GlobalRecipeCard({ recipe }: GlobalRecipeCardProps) {
    // Prefer direct outlet relationship, fallback to category's outlet
    const outlet = recipe.outlet || recipe.category?.outlet;
    const formatCurrency = (value: number | null) => {
        if (!value) return '-';
        return new Intl.NumberFormat('tr-TR', {
            style: 'currency',
            currency: 'TRY',
        }).format(value);
    };

    const difficultyColors = {
        Easy: 'text-emerald-700 bg-emerald-50 border-emerald-200',
        Medium: 'text-amber-700 bg-amber-50 border-amber-200',
        Hard: 'text-red-700 bg-red-50 border-red-200',
    } as const;

    const outletName = outlet?.name || 'Atanmamış';
    const outletId = outlet?.id;

    // Use a fallback link if no outlet ID (though unlikely with proper FK)
    const href = outletId ? `/outlets/${outletId}/recipes/${recipe.id}/edit` : '#';

    return (
        <Link href={href} className={!outletId ? 'pointer-events-none' : ''}>
            <Card className="group overflow-hidden hover:shadow-lg transition-all duration-300 border-neutral-200 hover:border-blue-200 cursor-pointer h-full flex flex-col">
                {/* Image Section */}
                <div className="relative h-48 w-full bg-neutral-100 overflow-hidden">
                    {recipe.image_url ? (
                        <img
                            src={recipe.image_url}
                            alt={recipe.name}
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                    ) : (
                        <div className="flex h-full w-full items-center justify-center text-neutral-400">
                            <ImageIcon className="h-10 w-10 opacity-20" />
                        </div>
                    )}

                    {/* Outlet Badge Overlay */}
                    <div className="absolute top-3 right-3">
                        <Badge variant="secondary" className="bg-white/90 backdrop-blur text-neutral-900 border-none shadow-sm font-semibold flex items-center gap-1.5 px-2.5 py-1">
                            <Store className="h-3 w-3 text-blue-600" />
                            {outletName}
                        </Badge>
                    </div>
                </div>

                {/* Content Section */}
                <div className="p-4 flex flex-col flex-1">
                    <div className="flex items-start justify-between mb-2">
                        <div>
                            <p className="text-xs font-mono text-neutral-500 mb-0.5">{recipe.recipe_no}</p>
                            <h3 className="font-bold text-neutral-900 text-lg leading-tight group-hover:text-blue-700 transition-colors line-clamp-2">
                                {recipe.name}
                            </h3>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 mb-4">
                        {recipe.category && (
                            <Badge variant="outline" className="text-xs font-normal text-neutral-600 border-neutral-200">
                                {recipe.category.name}
                            </Badge>
                        )}
                        {recipe.difficulty && (
                            <Badge variant="outline" className={`text-xs font-normal border ${difficultyColors[recipe.difficulty as keyof typeof difficultyColors] || ''}`}>
                                {recipe.difficulty}
                            </Badge>
                        )}
                        {recipe.prep_time && (
                            <span className="text-xs text-neutral-500 flex items-center gap-1 ml-auto">
                                <Clock className="h-3 w-3" />
                                {recipe.prep_time}m
                            </span>
                        )}
                    </div>

                    <div className="mt-auto pt-4 border-t border-neutral-100 flex items-end justify-between">
                        <div>
                            <p className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">Satış Fiyatı</p>
                            <p className="font-mono font-medium text-neutral-600">{formatCurrency(recipe.sale_price)}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">Maliyet</p>
                            <p className="text-lg font-bold text-neutral-900">{formatCurrency(12.50)}</p> {/* Note: Total cost calculation needs to be passed in or calculated. For this view, we might not have ingredients joined yet? Let's fix this in the page fetch logic. Placeholder for now. */}
                        </div>
                    </div>
                </div>
            </Card>
        </Link>
    );
}
