'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { EmptyState } from '@/components/ui/empty-state';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Plus, Settings, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Unit } from '@/types/database';

export default function SettingsPage() {
    const [units, setUnits] = useState<Unit[]>([]);
    const [loading, setLoading] = useState(true);
    const [newUnit, setNewUnit] = useState({ name: '', abbreviation: '' });

    const fetchUnits = async () => {
        setLoading(true);
        const { data } = await supabase
            .from('units')
            .select('*')
            .order('name');
        if (data) setUnits(data);
        setLoading(false);
    };

    useEffect(() => {
        fetchUnits();
    }, []);

    const handleAddUnit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newUnit.name || !newUnit.abbreviation) return;

        const { error } = await supabase
            .from('units')
            .insert([newUnit]);

        if (!error) {
            setNewUnit({ name: '', abbreviation: '' });
            fetchUnits();
        }
    };

    const handleDeleteUnit = async (id: string) => {
        if (!confirm('Emin misiniz?')) return;
        const { error } = await supabase.from('units').delete().eq('id', id);
        if (!error) fetchUnits();
    };

    return (
        <div className="pb-20">
            <Header
                title="Ayarlar"
                description="Global yapılandırmaları ve tercihleri yönetin"
                breadcrumbs={[{ label: 'Kitchen OS', href: '/' }, { label: 'Ayarlar' }]}
            />

            <div className="max-w-4xl mx-auto p-6 space-y-8">

                {/* Units Management */}
                <Card>
                    <CardHeader>
                        <CardTitle>Ölçü Birimleri</CardTitle>
                        <CardDescription>
                            Malzemeler ve tarifler için izin verilen birimleri yönetin.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleAddUnit} className="flex gap-4 mb-6 items-end">
                            <div className="space-y-2 flex-1">
                                <Label htmlFor="unitName">Birim Adı</Label>
                                <Input
                                    id="unitName"
                                    placeholder="örn. Yemek Kaşığı"
                                    value={newUnit.name}
                                    onChange={(e) => setNewUnit({ ...newUnit, name: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2 w-32">
                                <Label htmlFor="unitAbbr">Kısaltma</Label>
                                <Input
                                    id="unitAbbr"
                                    placeholder="örn. yk"
                                    value={newUnit.abbreviation}
                                    onChange={(e) => setNewUnit({ ...newUnit, abbreviation: e.target.value })}
                                />
                            </div>
                            <Button type="submit">Birim Ekle</Button>
                        </form>

                        <div className="rounded-md border border-neutral-200">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Ad</TableHead>
                                        <TableHead>Kısaltma</TableHead>
                                        <TableHead className="w-[100px]"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {units.map((unit) => (
                                        <TableRow key={unit.id}>
                                            <TableCell className="font-medium">{unit.name}</TableCell>
                                            <TableCell>
                                                <span className="inline-flex items-center rounded-md border border-neutral-200 bg-neutral-50 px-2.5 py-0.5 text-sm font-medium text-neutral-700">
                                                    {unit.abbreviation}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleDeleteUnit(unit.id)}
                                                    className="text-neutral-400 hover:text-red-600"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>

            </div>
        </div>
    );
}
