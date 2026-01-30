'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { RecipeForm } from '@/components/recipes/RecipeForm';
import { supabase } from '@/lib/supabase';
import type { Category, Outlet, RecipeFormData } from '@/types/database';

export default function EditRecipePage() {
    const params = useParams();
    const outletId = params.outletId as string;
    const recipeId = params.recipeId as string;

    const [loading, setLoading] = useState(true);
    const [categories, setCategories] = useState<Category[]>([]);
    const [outlet, setOutlet] = useState<Outlet | null>(null);
    const [recipeData, setRecipeData] = useState<Partial<RecipeFormData> & { id: string } | undefined>(undefined);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
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

                // Fetch Recipe with Ingredients
                const { data: recipe, error: recipeError } = await supabase
                    .from('recipes')
                    .select(`
                        *,
                        recipe_ingredients (
                            quantity,
                            unit,
                            prep_detail,
                            ingredient:ingredients (
                                id,
                                name,
                                cost_per_unit
                            )
                        )
                    `)
                    .eq('id', recipeId)
                    .single();

                if (recipeError) throw recipeError;

                if (recipe) {
                    // Transform for form
                    const formData: any = {
                        ...recipe,
                        ingredients: recipe.recipe_ingredients.map((ri: any) => ({
                            ingredient_id: ri.ingredient.id,
                            ingredient_name: ri.ingredient.name,
                            quantity: ri.quantity,
                            unit: ri.unit,
                            prep_detail: ri.prep_detail,
                            cost_per_unit: ri.ingredient.cost_per_unit
                        }))
                    };
                    setRecipeData(formData);
                }
            } catch (error) {
                console.error('Error fetching recipe:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [outletId, recipeId]);

    if (loading) {
        return (
            <div className="min-h-screen bg-neutral-50/50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!recipeData) {
        return <div className="p-8 text-center">Recipe not found</div>;
    }

    return (
        <div className="min-h-screen bg-neutral-50/50 pb-20">
            <Header
                title={`Edit Recipe: ${recipeData.name}`}
                description="Update recipe details, ingredients, and costs"
                breadcrumbs={[
                    { label: 'Outlets', href: '/outlets' },
                    { label: outlet?.name || '...', href: `/outlets/${outletId}` },
                    { label: 'Recipes', href: `/outlets/${outletId}/recipes` },
                    { label: 'Edit Recipe' },
                ]}
            />

            <div className="max-w-5xl mx-auto p-6">
                <RecipeForm
                    outletId={outletId}
                    categories={categories}
                    initialData={recipeData}
                />
            </div>
        </div>
    );
}
