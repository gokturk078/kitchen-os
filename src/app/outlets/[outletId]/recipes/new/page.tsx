'use client';

import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { RecipeForm } from '@/components/recipes/RecipeForm';
import { supabase } from '@/lib/supabase';
import type { Category, Outlet } from '@/types/database';

export default function NewRecipePage() {
    const params = useParams();
    const searchParams = useSearchParams();
    const outletId = params.outletId as string;
    const [categories, setCategories] = useState<Category[]>([]);
    const [outlet, setOutlet] = useState<Outlet | null>(null);

    // Get categoryId from query params if available
    const initialCategoryId = searchParams.get('categoryId') || undefined;

    useEffect(() => {
        const fetchData = async () => {
            // Fetch Outlet
            const { data: outletData } = await supabase
                .from('outlets')
                .select('*')
                .eq('id', outletId)
                .single();
            if (outletData) setOutlet(outletData);

            // Fetch Categories
            const { data: categoriesData } = await supabase
                .from('categories')
                .select('*')
                .eq('outlet_id', outletId)
                .order('sort_order');
            if (categoriesData) setCategories(categoriesData);
        };

        fetchData();
    }, [outletId]);

    return (
        <div className="min-h-screen bg-neutral-50/50 pb-20">
            <Header
                title="New Recipe"
                description="Create a standard operating procedure and cost card"
                breadcrumbs={[
                    { label: 'Outlets', href: '/outlets' },
                    { label: outlet?.name || '...', href: `/outlets/${outletId}` },
                    { label: 'Recipes', href: `/outlets/${outletId}/recipes` },
                    { label: 'New Recipe' },
                ]}
            />

            <div className="max-w-5xl mx-auto p-6">
                <RecipeForm
                    outletId={outletId}
                    categories={categories}
                    initialData={initialCategoryId ? { category_id: initialCategoryId } : undefined}
                />
            </div>
        </div>
    );
}
