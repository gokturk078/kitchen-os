export const dynamic = 'force-dynamic';

import { Header } from '@/components/layout/Header';
import { EmptyState } from '@/components/ui/empty-state';
import { Store } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { CreateOutletDialog } from '@/components/outlets/CreateOutletDialog';
import { OutletCard } from '@/components/outlets/OutletCard';

export default async function OutletsPage() {
    const { data: outlets } = await supabase
        .from('outlets')
        .select('*, recipes(count)')
        .order('created_at', { ascending: false });

    const mappedOutlets = outlets?.map((outlet: any) => ({
        ...outlet,
        recipe_count: outlet.recipes?.[0]?.count || 0
    })) || [];

    return (
        <div>
            <Header
                title="Restoran Yönetimi"
                description="Restoran konumlarınızı ve yapılandırmalarınızı yönetin"
                breadcrumbs={[{ label: 'Kitchen OS', href: '/' }, { label: 'Restoranlar' }]}
                actions={<CreateOutletDialog />}
            />

            <div className="p-6">
                {mappedOutlets.length === 0 ? (
                    <EmptyState
                        icon={Store}
                        title="Restoran Bulunamadı"
                        description="İlk restoranınızı oluşturarak menü ve tarifleri yönetmeye başlayın."
                    >
                        <CreateOutletDialog />
                    </EmptyState>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {mappedOutlets.map((outlet) => (
                            <OutletCard key={outlet.id} outlet={outlet} />
                        ))}

                        {/* Add New Card (Optional, since we have header action) */}
                        <div className="flex items-center justify-center p-8 border-2 border-dashed border-neutral-200 bg-neutral-50/50 rounded-xl h-full">
                            <CreateOutletDialog />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
