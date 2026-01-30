'use client';

import { useState, useEffect, startTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Plus } from 'lucide-react';
import { outletSchema, type OutletFormValues } from '@/lib/schemas';
import { supabase } from '@/lib/supabase';

export function CreateOutletDialog() {
    const [open, setOpen] = useState(false);
    const router = useRouter();

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        reset,
        formState: { errors, isSubmitting },
    } = useForm<OutletFormValues>({
        resolver: zodResolver(outletSchema) as any,
        defaultValues: {
            name: '',
            type: '',
            location: '',
            status: 'active',
        } as OutletFormValues,
    });

    const onSubmit = async (data: OutletFormValues) => {
        try {
            console.log('Submitting outlet:', data);
            const { error } = await supabase.from('outlets').insert([data]);

            if (error) {
                console.error('Supabase error:', error);
                throw error;
            }

            console.log('Outlet created successfully');
            setOpen(false);
            reset();

            // Force a router refresh to update the Server Component
            startTransition(() => {
                router.refresh();
            });

        } catch (error: any) {
            console.error('Failed to create outlet:', error);
            alert(`Failed to create outlet: ${error.message || 'Unknown error'}`);
        }
    };

    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    if (!isMounted) {
        return (
            <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="mr-2 h-4 w-4" />
                Restoran Ekle
            </Button>
        );
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="mr-2 h-4 w-4" />
                    Restoran Ekle
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Yeni Restoran Ekle</DialogTitle>
                    <DialogDescription>
                        Tariflerini ve menülerini yönetmek için yeni bir restoran oluşturun.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Restoran Adı *</Label>
                        <Input
                            id="name"
                            placeholder="örn. Fantasia Snack"
                            {...register('name')}
                            className={errors.name ? 'border-red-500' : ''}
                        />
                        {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="type">Tür</Label>
                        <Input
                            id="type"
                            placeholder="örn. Restoran, Kafe, Bar"
                            {...register('type')}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="location">Konum</Label>
                        <Input
                            id="location"
                            placeholder="örn. Fethiye, Muğla"
                            {...register('location')}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="status">Durum</Label>
                        <Select
                            onValueChange={(val) => setValue('status', val as any)}
                            defaultValue={watch('status')}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="active">Aktif</SelectItem>
                                <SelectItem value="inactive">Pasif</SelectItem>
                                <SelectItem value="maintenance">Bakımda</SelectItem>
                                <SelectItem value="closed">Kapalı</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setOpen(false)}
                        >
                            İptal
                        </Button>
                        <Button
                            type="submit"
                            className="bg-blue-600 hover:bg-blue-700"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? 'Ekleniyor...' : 'Restoran Ekle'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
