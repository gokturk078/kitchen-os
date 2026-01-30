'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';
import { Settings, Plus, Trash2, GripVertical } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Category } from '@/types/database';

interface ManageCategoriesDialogProps {
    outletId: string;
    onUpdate: () => void;
}

export function ManageCategoriesDialog({ outletId, onUpdate }: ManageCategoriesDialogProps) {
    const [categories, setCategories] = useState<Category[]>([]);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [loading, setLoading] = useState(false);

    const fetchCategories = async () => {
        const { data } = await supabase
            .from('categories')
            .select('*')
            .eq('outlet_id', outletId)
            .order('sort_order');
        if (data) setCategories(data);
    };

    useEffect(() => {
        fetchCategories();
    }, [outletId]);

    const handleAddCategory = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCategoryName.trim()) return;

        setLoading(true);
        try {
            const { error } = await supabase
                .from('categories')
                .insert([{
                    outlet_id: outletId,
                    name: newCategoryName.trim(),
                    sort_order: categories.length
                }]);

            if (error) {
                console.error('Error adding category:', error);
                alert(`Kategori eklenemedi: ${error.message}`);
                return;
            }

            // Success
            setNewCategoryName('');
            await fetchCategories(); // Refresh local list
            onUpdate(); // Refresh parent list
        } catch (err) {
            console.error('Unexpected error adding category:', err);
            alert('Kategori eklenirken beklenmeyen bir hata oluştu.');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Bu kategoriyi silmek istediğinizden emin misiniz? Bu kategori silinirse, ilişkili tarifler "Kategorisiz" olarak görünecektir.')) return;

        try {
            // 1. Delete the category
            const { error } = await supabase
                .from('categories')
                .delete()
                .eq('id', id);

            if (error) {
                console.error('Error deleting category:', error);
                alert(`Kategori silinemedi: ${error.message}`);
                return;
            }

            // 2. Optimistic update (remove from UI immediately)
            setCategories(prev => prev.filter(c => c.id !== id));

            // 3. Trigger parent update
            onUpdate();
        } catch (err) {
            console.error('Unexpected error deleting category:', err);
            alert('Kategori silinirken beklenmeyen bir hata oluştu.');
        }
    };

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="outline" size="icon" title="Kategorileri Yönet">
                    <Settings className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Menü Kategorilerini Yönet</DialogTitle>
                    <DialogDescription>
                        Bu restoranın menüsü için kategoriler oluşturun ve düzenleyin.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 mt-2">
                    {/* Add New */}
                    <form onSubmit={handleAddCategory} className="flex gap-2">
                        <div className="flex-1">
                            <Label htmlFor="catName" className="sr-only">Kategori Adı</Label>
                            <Input
                                id="catName"
                                placeholder="Yeni Kategori (örn. Başlangıçlar)"
                                value={newCategoryName}
                                onChange={(e) => setNewCategoryName(e.target.value)}
                            />
                        </div>
                        <Button type="submit" disabled={loading}>
                            <Plus className="h-4 w-4" />
                        </Button>
                    </form>

                    {/* List */}
                    <div className="border rounded-md">
                        <Table>
                            <TableBody>
                                {categories.length === 0 ? (
                                    <TableRow>
                                        <TableCell className="text-center text-muted-foreground">
                                            Henüz kategori yok.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    categories.map((cat) => (
                                        <TableRow key={cat.id}>
                                            <TableCell className="w-8">
                                                <GripVertical className="h-4 w-4 text-neutral-300" />
                                            </TableCell>
                                            <TableCell className="font-medium">
                                                {cat.name}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleDelete(cat.id)}
                                                    className="h-8 w-8 text-neutral-400 hover:text-red-600"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
