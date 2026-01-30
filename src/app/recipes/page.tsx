
'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { EmptyState } from '@/components/ui/empty-state';
import { Button } from '@/components/ui/button';
import { ChefHat, Search, Store } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/supabase';
import { GlobalRecipeCard } from '@/components/recipes/GlobalRecipeCard';
import Link from 'next/link';

export default function GlobalRecipesPage() {
    const [recipes, setRecipes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const fetchGlobalRecipes = async () => {
            setLoading(true);
            const { data, error } = await supabase
                .from('recipes')
                .select(`
          *,
          outlet:outlets (
            id,
            name
          ),
          category:categories (
            name,
            outlet:outlets (
              id,
              name
            )
          )
        `)
                .order('created_at', { ascending: false });

            if (!error && data) {
                setRecipes(data);
            }
            setLoading(false);
        };

        fetchGlobalRecipes();
    }, []);

    const filteredRecipes = recipes.filter((recipe) =>
        recipe.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        recipe.recipe_no.toLowerCase().includes(searchQuery.toLowerCase()) ||
        recipe.category?.outlet?.name?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-neutral-50/50 pb-20">
            <Header
                title="Global Tarif Dizini"
                description="Tüm restoranlardaki tariflerin ana dizini"
                breadcrumbs={[{ label: 'Kitchen OS', href: '/' }, { label: 'Tüm Tarifler' }]}
            />

            <div className="p-6 max-w-7xl mx-auto">
                {/* Search Header */}
                <div className="flex flex-col md:flex-row md:items-center gap-4 mb-8">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                        <Input
                            type="search"
                            placeholder="Tarif, restoran veya ID ara..."
                            className="pl-10 bg-white"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                ) : recipes.length === 0 ? (
                    <EmptyState
                        icon={ChefHat}
                        title="Tarif Bulunamadı"
                        description="Henüz hiçbir restoranınızda tarif oluşturmamış görünüyorsunuz."
                        actionLabel="Restoranlara Git"
                        actionHref="/outlets"
                    />
                ) : filteredRecipes.length === 0 ? (
                    <div className="text-center py-20 text-neutral-500">
                        "{searchQuery}" ile eşleşen tarif bulunamadı
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filteredRecipes.map((recipe) => (
                            <GlobalRecipeCard key={recipe.id} recipe={recipe} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
