'use client';

import { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { Plus, Save, ArrowLeft, Trash2, Check, ChevronsUpDown } from 'lucide-react';
import { AllergenGrid } from './AllergenGrid';
import { IngredientRow } from './IngredientRow';
import { supabase } from '@/lib/supabase';
import { defaultAllergens } from '@/types/database';
import type { Category, RecipeFormData } from '@/types/database';
import { recipeSchema, type RecipeFormValues } from '@/lib/schemas';

interface RecipeFormProps {
    outletId: string;
    initialData?: Partial<RecipeFormData> & { id?: string };
    categories: Category[];
}

export function RecipeForm({ outletId, initialData, categories }: RecipeFormProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [imagePreview, setImagePreview] = useState<string | null>(initialData?.image_url || null);

    // Category Combobox State
    const [openCategory, setOpenCategory] = useState(false);
    const [localCategories, setLocalCategories] = useState<Category[]>(categories);
    const [categorySearch, setCategorySearch] = useState("");

    // Sync categories prop with local state when it updates
    useEffect(() => {
        setLocalCategories(categories);
    }, [categories]);







    const { register, control, handleSubmit, watch, setValue, formState: { errors } } = useForm<RecipeFormValues>({
        resolver: zodResolver(recipeSchema) as any,
        defaultValues: {
            recipe_no: initialData?.recipe_no || '',
            outlet_id: outletId,
            name: initialData?.name || '',
            category_id: initialData?.category_id || null,
            critical_details: initialData?.critical_details || '',
            instructions: initialData?.instructions || '',
            image_url: initialData?.image_url || '',
            prep_time: initialData?.prep_time || null,
            difficulty: initialData?.difficulty || 'Medium',
            yield_amount: initialData?.yield_amount || 1,
            yield_unit: initialData?.yield_unit || 'portion',
            sale_price: initialData?.sale_price || 0,
            waste_percentage: initialData?.waste_percentage || 5,
            allergens: (initialData?.allergens || defaultAllergens) as unknown as Record<string, boolean>,
            ingredients: (initialData?.ingredients || []).map(ing => ({
                ingredient_id: ing.ingredient_id,
                quantity: ing.quantity,
                unit: ing.unit,
                prep_detail: ing.prep_detail,
                ingredient_name: ing.ingredient_name || '',
                cost_per_unit: ing.cost_per_unit || 0
            })),
        },
    });

    const { fields, append, remove, update } = useFieldArray({
        control,
        name: 'ingredients',
    });

    // Auto-generate Recipe No for new recipes
    useEffect(() => {
        const generateRecipeNo = async () => {
            // Only generate if it's a new recipe and field is empty
            if (initialData?.id) return;

            try {
                // Fetch the most recent recipe to determine the next number
                const { data: lastRecipe } = await supabase
                    .from('recipes')
                    .select('recipe_no')
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .single();

                const currentYear = new Date().getFullYear();
                let nextNumber = 1;

                if (lastRecipe?.recipe_no) {
                    // Try to parse format RCP-YYYY-NNN
                    const parts = lastRecipe.recipe_no.split('-');
                    if (parts.length === 3 && parts[0] === 'RCP') {
                        const lastYear = parseInt(parts[1]);
                        const lastSeq = parseInt(parts[2]);

                        if (lastYear === currentYear && !isNaN(lastSeq)) {
                            nextNumber = lastSeq + 1;
                        }
                    }
                }

                // Format: RCP-YYYY-NNN (e.g. RCP-2024-001)
                const formattedNumber = `RCP-${currentYear}-${String(nextNumber).padStart(3, '0')}`;

                // Only set if field is empty (avoid overwriting user input on quick re-renders)
                if (!watch('recipe_no')) {
                    setValue('recipe_no', formattedNumber);
                }

            } catch (error) {
                console.error('Failed to generate recipe number:', error);
            }
        };

        generateRecipeNo();
    }, [initialData?.id, setValue, watch]);

    // Helper to create new category
    const createCategory = async (name: string) => {
        try {
            const { data, error } = await supabase
                .from('categories')
                .insert({ name, outlet_id: outletId, sort_order: 99 })
                .select()
                .single();

            if (error) throw error;
            if (data) {
                setLocalCategories([...localCategories, data]);
                setValue('category_id', data.id);
                setOpenCategory(false);
                setCategorySearch("");
            }
        } catch (error) {
            console.error('Failed to create category:', error);
            // alert('Failed to create category');
        }
    };

    // Watch values for cost calculation
    const ingredients = watch('ingredients');
    const wastePercentage = watch('waste_percentage') || 0;

    // Calculate costs
    const ingredientsCost = ingredients?.reduce((sum, ing) => {
        return sum + (ing.quantity * ((ing as any).cost_per_unit || 0));
    }, 0) || 0;

    const wasteCost = ingredientsCost * (wastePercentage / 100);
    const totalCost = ingredientsCost + wasteCost;
    const costPerYield = totalCost / (watch('yield_amount') || 1);

    const onSubmit = async (data: RecipeFormValues) => {
        setLoading(true);
        try {
            // 1. Create/Update Recipe
            const recipeData = {
                outlet_id: outletId,
                category_id: data.category_id,
                recipe_no: data.recipe_no,
                name: data.name,
                critical_details: data.critical_details,
                instructions: data.instructions,
                image_url: data.image_url,
                prep_time: data.prep_time,
                difficulty: data.difficulty,
                yield_amount: data.yield_amount,
                yield_unit: data.yield_unit,
                sale_price: data.sale_price,
                waste_percentage: data.waste_percentage,
                allergens: data.allergens,
            };

            let recipeId = initialData?.id;

            if (recipeId) {
                const { error } = await supabase
                    .from('recipes')
                    .update(recipeData)
                    .eq('id', recipeId);
                if (error) throw error;
            } else {
                const { data: newRecipe, error } = await supabase
                    .from('recipes')
                    .insert([recipeData])
                    .select()
                    .single();
                if (error) throw error;
                recipeId = newRecipe.id;
            }

            // 2. Handle Ingredients
            if (initialData?.id && recipeId) {
                const { error: deleteError } = await supabase
                    .from('recipe_ingredients')
                    .delete()
                    .eq('recipe_id', recipeId);
                if (deleteError) throw deleteError;
            }

            if (data.ingredients.length > 0 && recipeId) {
                const processedIngredients = await Promise.all(data.ingredients.map(async (ing) => {
                    let finalIngredientId = ing.ingredient_id;

                    if (!finalIngredientId && ing.ingredient_name) {
                        try {
                            const { data: newIng, error: createError } = await supabase
                                .from('ingredients')
                                .insert({
                                    name: ing.ingredient_name,
                                    base_unit: ing.unit || 'kg',
                                    cost_per_unit: ing.cost_per_unit || 0,
                                })
                                .select()
                                .single();

                            if (createError) throw createError;
                            if (newIng) finalIngredientId = newIng.id;
                        } catch (err) {
                            console.error('Failed to auto-create ingredient:', ing.ingredient_name, err);
                            throw new Error(`Failed to create new ingredient: ${ing.ingredient_name}`);
                        }
                    }

                    if (!finalIngredientId) return null;

                    return {
                        recipe_id: recipeId,
                        ingredient_id: finalIngredientId,
                        quantity: ing.quantity,
                        unit: ing.unit,
                        prep_detail: ing.prep_detail,
                    };
                }));

                const validIngredients = processedIngredients.filter(Boolean).map((ing, index) => ({
                    ...ing,
                    sort_order: index
                }));

                if (validIngredients.length > 0) {
                    const { error: insertError } = await supabase
                        .from('recipe_ingredients')
                        .insert(validIngredients as any);
                    if (insertError) throw insertError;
                }
            }

            router.push(`/outlets/${outletId}/recipes`);
            router.refresh();
        } catch (error: any) {
            console.error('Error saving recipe:', error);
            alert(`Failed to save recipe: ${error.message || 'Unknown error'}`);
        } finally {
            setLoading(false);
        }
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const url = e.target.value;
        setValue('image_url', url);
        setImagePreview(url);
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            <div className="flex items-center justify-between">
                <Button
                    type="button"
                    variant="ghost"
                    onClick={() => router.back()}
                    className="text-neutral-500"
                >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Vazgeç
                </Button>
                <div className="flex items-center gap-4">
                    <div className="text-right">
                        <p className="text-xs text-neutral-500 uppercase font-semibold">Toplam Maliyet</p>
                        <p className="text-xl font-bold text-neutral-900">₺{totalCost.toFixed(2)}</p>
                    </div>
                    <Button type="submit" className="bg-neutral-900 text-white hover:bg-neutral-800" disabled={loading}>
                        <Save className="mr-2 h-4 w-4" />
                        {loading ? 'Kaydediliyor...' : 'Tarifi Kaydet'}
                    </Button>
                </div>
            </div>

            {/* Error Summary */}
            {Object.keys(errors).length > 0 && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                    <p className="font-semibold mb-2">Lütfen aşağıdaki hataları düzeltin:</p>
                    <ul className="list-disc list-inside space-y-1">
                        {Object.entries(errors).map(([key, error]: [string, any]) => {
                            if (Array.isArray(error)) {
                                return error.map((itemError: any, idx: number) => {
                                    if (!itemError) return null;
                                    return Object.entries(itemError).map(([subKey, subErr]: [string, any]) => (
                                        <li key={`${key}-${idx}-${subKey}`}>
                                            Satır {idx + 1} ({subKey}): {subErr.message}
                                        </li>
                                    ));
                                });


                            }
                            if (error?.message) {
                                return <li key={key}>{error.message} ({key})</li>;
                            }
                            return <li key={key}>Geçersiz giriş: {key}</li>;
                        })}
                    </ul>
                </div>
            )}

            <Card className="p-6">
                <div className="mb-4 flex items-center gap-2 text-sm font-medium text-neutral-500">
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 text-blue-600 text-xs">A</div>
                    TARİF META VERİSİ
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="recipe_no">Tarif No.</Label>
                                <Input
                                    id="recipe_no"
                                    placeholder="RCP-202X-001"
                                    {...register('recipe_no')}
                                    className={errors.recipe_no ? 'border-red-500' : ''}
                                />
                            </div>
                            <div className="space-y-2 flex flex-col">
                                <Label htmlFor="category">Kategori</Label>
                                <Popover open={openCategory} onOpenChange={setOpenCategory}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            role="combobox"
                                            aria-expanded={openCategory}
                                            className={cn(
                                                "w-full justify-between",
                                                !watch('category_id') && "text-muted-foreground"
                                            )}
                                        >
                                            {watch('category_id')
                                                ? localCategories.find((category) => category.id === watch('category_id'))?.name
                                                : "Kategori Seçin"}
                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[200px] p-0">
                                        <Command>
                                            <CommandInput
                                                placeholder="Kategori ara..."
                                                value={categorySearch}
                                                onValueChange={setCategorySearch}
                                            />
                                            <CommandList>
                                                <CommandEmpty>
                                                    <div className="p-2">
                                                        <p className="text-sm text-muted-foreground mb-2">Kategori bulunamadı.</p>
                                                        <Button
                                                            variant="secondary"
                                                            size="sm"
                                                            className="w-full text-xs"
                                                            onClick={() => createCategory(categorySearch)}
                                                        >
                                                            <Plus className="mr-1 h-3 w-3" />
                                                            "{categorySearch}" Oluştur
                                                        </Button>
                                                    </div>
                                                </CommandEmpty>
                                                <CommandGroup>
                                                    {localCategories.map((category) => (
                                                        <CommandItem
                                                            key={category.id}
                                                            value={category.name}
                                                            onSelect={() => {
                                                                setValue('category_id', category.id);
                                                                setOpenCategory(false);
                                                            }}
                                                        >
                                                            <Check
                                                                className={cn(
                                                                    "mr-2 h-4 w-4",
                                                                    watch('category_id') === category.id ? "opacity-100" : "opacity-0"
                                                                )}
                                                            />
                                                            {category.name}
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="name">Menü Adı *</Label>
                            <Input
                                id="name"
                                placeholder="örn. Tavada Deniz Tarağı"
                                {...register('name')}
                                className={errors.name ? 'border-red-500' : ''}
                            />
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="yield_amount">Verim Miktarı</Label>
                                <Input
                                    id="yield_amount"
                                    type="number"
                                    placeholder="1"
                                    {...register('yield_amount', { valueAsNumber: true })}
                                />
                            </div>
                            <div className="col-span-2 space-y-2">
                                <Label htmlFor="yield_unit">Verim Birimi</Label>
                                <Input
                                    id="yield_unit"
                                    placeholder="Porsiyon"
                                    {...register('yield_unit')}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="image_url">Görsel URL</Label>
                            <Input
                                id="image_url"
                                placeholder="https://..."
                                onChange={handleImageChange}
                                value={watch('image_url') || ''}
                            />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-2 h-full flex flex-col">
                            <Label htmlFor="critical_details">Kritik Detaylar / Şef Notları</Label>
                            <Textarea
                                id="critical_details"
                                className="flex-1 resize-none min-h-[160px]"
                                placeholder="Özel sunum talimatları, sıcaklık uyarıları veya şef notlarını buraya girin..."
                                {...register('critical_details')}
                            />
                        </div>
                    </div>
                </div>
            </Card>

            <Card className="p-6">
                <div className="mb-4 flex items-center gap-2 text-sm font-medium text-neutral-500">
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 text-blue-600 text-xs">B</div>
                    ALERJEN MATRİSİ & İNTOLERANSLAR
                </div>
                <AllergenGrid
                    value={watch('allergens') as any}
                    onChange={(newVal) => setValue('allergens', newVal as any)}
                />
            </Card>

            <Card className="p-6">
                <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm font-medium text-neutral-500">
                        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 text-blue-600 text-xs">C</div>
                        MALZEME MATRİSİ
                    </div>
                    <span className="text-sm text-neutral-500">{fields.length} öğe eklendi</span>
                </div>

                <div className="rounded-lg border border-neutral-200 bg-neutral-50/50">
                    <div className="grid grid-cols-[30px_minmax(180px,1fr)_80px_80px_minmax(150px,1fr)_100px_40px] gap-2 px-2 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider border-b border-neutral-200">
                        <div></div>
                        <div>Malzeme Adı</div>
                        <div className="text-center">Miktar</div>
                        <div className="text-center">Birim</div>
                        <div>Hazırlık Detayı</div>
                        <div className="text-right">Satır Maliyeti</div>
                        <div></div>
                    </div>

                    <div className="bg-white">
                        {fields.map((field, index) => (
                            <IngredientRow
                                key={field.id}
                                index={index}
                                register={register}
                                control={control}
                                setValue={setValue}
                                onRemove={() => remove(index)}
                            />
                        ))}
                    </div>

                    <div className="p-2 border-t border-neutral-200 bg-neutral-50/50">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => append({
                                ingredient_id: '',
                                quantity: 1,
                                unit: '',
                                prep_detail: '',
                            } as any)}
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        >
                            <Plus className="mr-2 h-4 w-4" />
                            Malzeme Ekle
                        </Button>
                    </div>
                </div>

                <div className="mt-6 flex justify-end">
                    <div className="w-64 space-y-3">
                        <div className="flex justify-between text-sm text-neutral-600">
                            <span>Öğe Maliyeti:</span>
                            <span>₺{ingredientsCost.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm text-neutral-600">
                            <span className="flex items-center gap-2">
                                Fire:
                                <Input
                                    type="number"
                                    className="w-16 h-7 text-right"
                                    value={wastePercentage}
                                    onChange={(e) => setValue('waste_percentage', parseFloat(e.target.value) || 0)}
                                />
                                %
                            </span>
                            <span>₺{wasteCost.toFixed(2)}</span>
                        </div>
                        <Separator />
                        <div className="flex justify-between text-lg font-bold text-neutral-900">
                            <span>Toplam Maliyet:</span>
                            <span>₺{totalCost.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm text-neutral-500">
                            <span>Porsiyon başı maliyet:</span>
                            <span>₺{costPerYield.toFixed(2)}</span>
                        </div>
                        <div className="pt-2">
                            <Label htmlFor="sale_price" className="text-xs text-neutral-500">Önerilen Satış Fiyatı (%30 maliyet)</Label>
                            <Input
                                id="sale_price"
                                type="number"
                                step="0.01"
                                className="mt-1"
                                placeholder="0.00"
                                {...register('sale_price', { valueAsNumber: true })}
                            />
                        </div>
                    </div>
                </div>
            </Card>

            <Card className="p-6">
                <div className="mb-4 flex items-center gap-2 text-sm font-medium text-neutral-500">
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 text-blue-600 text-xs">D</div>
                    HAZIRLIK TALİMATLARI
                </div>
                <Textarea
                    placeholder="Adım 1: ..."
                    className="min-h-[200px]"
                    {...register('instructions')}
                />
            </Card>
        </form>
    );
}
