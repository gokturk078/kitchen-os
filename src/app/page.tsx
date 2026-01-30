'use client';

import { useEffect, useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/ui/card';
import { Store, ChefHat, Package, TrendingUp } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function DashboardPage() {
  const [stats, setStats] = useState({
    outlets: 0,
    recipes: 0,
    ingredients: 0,
    avgCost: 0
  });

  useEffect(() => {
    async function fetchStats() {
      const { count: outletsCount } = await supabase.from('outlets').select('*', { count: 'exact', head: true });
      const { count: recipesCount } = await supabase.from('recipes').select('*', { count: 'exact', head: true });
      const { count: ingredientsCount } = await supabase.from('ingredients').select('*', { count: 'exact', head: true });

      // Calculate average recipe cost (simplified fetch for demo)
      const { data: recipes } = await supabase
        .from('recipes')
        .select(`
          yield_amount,
          recipe_ingredients (
            quantity,
            ingredient:ingredients (cost_per_unit)
          )
        `)
        .limit(100);

      let totalAvgCost = 0;
      if (recipes && recipes.length > 0) {
        let totalCostSum = 0;
        recipes.forEach((r: any) => {
          const cost = r.recipe_ingredients.reduce((sum: number, ri: any) => {
            return sum + (ri.quantity * (ri.ingredient?.cost_per_unit || 0));
          }, 0);
          // Add 5% waste
          const withWaste = cost * 1.05;
          totalCostSum += withWaste / (r.yield_amount || 1);
        });
        totalAvgCost = totalCostSum / recipes.length;
      }

      setStats({
        outlets: outletsCount || 0,
        recipes: recipesCount || 0,
        ingredients: ingredientsCount || 0,
        avgCost: totalAvgCost
      });
    }

    fetchStats();
  }, []);

  return (
    <div>
      <Header
        title="Kontrol Paneli"
        description="Mutfak operasyonlarınızın genel görünümü"
        breadcrumbs={[{ label: 'Kitchen OS' }, { label: 'Kontrol Paneli' }]}
      />

      <div className="p-6">
        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100">
                <Store className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-neutral-500">Restoranlar</p>
                <p className="text-2xl font-bold text-neutral-900">{stats.outlets}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100">
                <ChefHat className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-neutral-500">Tarifler</p>
                <p className="text-2xl font-bold text-neutral-900">{stats.recipes}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100">
                <Package className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-neutral-500">Malzemeler</p>
                <p className="text-2xl font-bold text-neutral-900">{stats.ingredients}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-neutral-500">Ort. Maliyet</p>
                <p className="text-2xl font-bold text-neutral-900">
                  {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(stats.avgCost)}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Welcome Section */}
        <Card className="mt-8 p-8 bg-gradient-to-br from-blue-600 to-blue-700">
          <div className="max-w-2xl">
            <h2 className="text-2xl font-bold text-white">Kitchen OS'a Hoş Geldiniz</h2>
            <p className="mt-2 text-blue-100">
              Profesyonel mutfak maliyet kontrol sisteminiz. İlk restoranınızı ekleyerek başlayın,
              ardından malzeme kütüphanenizi oluşturun ve tariflerinizi kaydedin.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a
                href="/outlets"
                className="inline-flex items-center rounded-lg bg-white px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 transition-colors"
              >
                <Store className="mr-2 h-4 w-4" />
                İlk Restoranınızı Ekleyin
              </a>
              <a
                href="/ingredients"
                className="inline-flex items-center rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-400 transition-colors"
              >
                <Package className="mr-2 h-4 w-4" />
                Malzemelere Göz Atın
              </a>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
