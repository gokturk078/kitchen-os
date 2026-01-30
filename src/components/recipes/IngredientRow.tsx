'use client';

import { useState, useEffect, useRef } from 'react';
import { UseFormRegister, UseFormSetValue, Control, useWatch } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { GripVertical, Search, Trash2, Check } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Ingredient } from '@/types/database';
import { cn } from '@/lib/utils';
import type { RecipeFormValues } from '@/lib/schemas';

interface IngredientRowProps {
    index: number;
    register: UseFormRegister<RecipeFormValues>;
    control: Control<RecipeFormValues>;
    setValue: UseFormSetValue<RecipeFormValues>;
    onRemove: () => void;
}

export function IngredientRow({ index, register, control, setValue, onRemove }: IngredientRowProps) {
    const [suggestions, setSuggestions] = useState<Ingredient[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    // Watch values for calculation and controlled input logic
    const quantity = useWatch({
        control,
        name: `ingredients.${index}.quantity`,
        defaultValue: 0
    });

    // We need to watch cost_per_unit to calculate line cost
    // Note: cost_per_unit might not be in the form schema submitted to DB, but we use it for UI
    const costPerUnit = useWatch({
        control,
        name: `ingredients.${index}.cost_per_unit`,
        defaultValue: 0
    });

    const ingredientName = useWatch({
        control,
        name: `ingredients.${index}.ingredient_name`,
        defaultValue: ''
    });

    // Close suggestions when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setShowSuggestions(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Search ingredients
    const handleSearch = async (query: string) => {
        if (!query) {
            setSuggestions([]);
            return;
        }

        const { data } = await supabase
            .from('ingredients')
            .select('*')
            .ilike('name', `%${query}%`)
            .order('name')
            .limit(10);

        if (data) setSuggestions(data);
    };

    const handleSelectIngredient = (ing: Ingredient) => {
        setValue(`ingredients.${index}.ingredient_id`, ing.id);
        setValue(`ingredients.${index}.ingredient_name`, ing.name);
        setValue(`ingredients.${index}.unit`, ing.base_unit);
        setValue(`ingredients.${index}.cost_per_unit`, ing.cost_per_unit);
        setShowSuggestions(false);
    };

    const lineCost = (parseFloat(quantity?.toString() || '0') * parseFloat(costPerUnit?.toString() || '0')) || 0;

    return (
        <div className="flex items-center gap-2 py-2 px-1 border-b border-neutral-100 hover:bg-neutral-50/50 group">
            {/* Drag Handle */}
            <div className="flex items-center justify-center w-6 cursor-move text-neutral-300 hover:text-neutral-400">
                <GripVertical className="h-4 w-4" />
            </div>

            {/* Smart Ingredient Input */}
            <div className="flex-1 min-w-[200px] relative" ref={wrapperRef}>
                <div className="relative">
                    <Input
                        placeholder="Search or type ingredient..."
                        {...register(`ingredients.${index}.ingredient_name`)}
                        onChange={(e) => {
                            register(`ingredients.${index}.ingredient_name`).onChange(e);
                            handleSearch(e.target.value);
                            setShowSuggestions(true);
                        }}
                        onFocus={() => {
                            handleSearch(ingredientName || '');
                            setShowSuggestions(true);
                        }}
                        className="pl-8"
                        autoComplete="off"
                    />
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-neutral-400" />
                </div>

                {/* Suggestions List */}
                {showSuggestions && suggestions.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-neutral-200 rounded-md shadow-lg max-h-[200px] overflow-auto">
                        {suggestions.map((ing) => (
                            <div
                                key={ing.id}
                                className="px-3 py-2 text-sm hover:bg-neutral-100 cursor-pointer flex justify-between items-center"
                                onClick={() => handleSelectIngredient(ing)}
                            >
                                <span>{ing.name}</span>
                                <span className="text-xs text-neutral-400">{ing.base_unit}</span>
                            </div>
                        ))}
                    </div>
                )}

                {/* Hidden ID field to store the selected ingredient ID if any */}
                <input type="hidden" {...register(`ingredients.${index}.ingredient_id`)} />
            </div>

            {/* Quantity */}
            <div className="w-24">
                <Input
                    type="number"
                    step="0.0001"
                    placeholder="0"
                    {...register(`ingredients.${index}.quantity`, { valueAsNumber: true })}
                    className="text-center"
                />
            </div>

            {/* Unit (Correctly Editable) */}
            <div className="w-24">
                <Input
                    placeholder="Unit"
                    {...register(`ingredients.${index}.unit`)}
                    className="text-center bg-white"
                />
            </div>

            {/* Prep Detail */}
            <div className="flex-1 min-w-[150px]">
                <Input
                    placeholder="Prep detail..."
                    {...register(`ingredients.${index}.prep_detail`)}
                />
            </div>

            {/* Line Cost (Calculated UI only) */}
            <div className="w-24 text-right">
                <Input
                    type="hidden"
                    {...register(`ingredients.${index}.cost_per_unit`, { valueAsNumber: true })}
                />
                <span className="font-mono text-sm font-medium text-neutral-700">
                    ${lineCost.toFixed(2)}
                </span>
            </div>

            {/* Remove Button */}
            <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 opacity-0 group-hover:opacity-100 text-neutral-400 hover:text-red-600"
                onClick={onRemove}
            >
                <Trash2 className="h-4 w-4" />
            </Button>
        </div>
    );
}
