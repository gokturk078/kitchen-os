import { z } from 'zod';

export const outletSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    type: z.string().optional(),
    location: z.string().optional(),
    status: z.enum(['active', 'inactive', 'maintenance', 'closed']).default('active'),
});

export const ingredientSchema = z.object({
    name: z.string().min(2, "Name is required"),
    ingredient_no: z.string().optional(),
    category: z.string().optional(),
    base_unit: z.string().min(1, "Unit is required"),
    cost_per_unit: z.number().min(0, "Cost must be positive"),
    supplier: z.string().optional(),
});

export const recipeIngredientSchema = z.object({
    ingredient_id: z.preprocess(
        (val) => (val === '' ? undefined : val),
        z.string().optional()
    ),
    quantity: z.preprocess(
        (val) => (val === '' || val === null || val === undefined ? 0 : parseFloat(String(val))),
        z.number().min(0.0001, "Quantity must be positive")
    ),
    unit: z.string().optional(),
    prep_detail: z.string().optional(),
    // UI only fields - robust handling for hidden inputs
    ingredient_name: z.string().optional(),
    cost_per_unit: z.preprocess(
        (val) => (val === '' || val === null || isNaN(Number(val)) ? 0 : Number(val)),
        z.number().optional()
    ),
});

export const recipeSchema = z.object({
    recipe_no: z.string().min(1, "Recipe No is required"),
    outlet_id: z.string().uuid().optional(),
    name: z.string().min(2, "Name is required"),
    category_id: z.string().nullable().optional(),
    critical_details: z.string().optional(),
    instructions: z.string().optional(),
    image_url: z.string().url().optional().nullable().or(z.literal('')),
    prep_time: z.number().nullable().optional(),
    difficulty: z.enum(['Easy', 'Medium', 'Hard']).nullable().optional(),
    yield_amount: z.number().min(1, "Yield must be at least 1"),
    yield_unit: z.string().min(1, "Yield unit is required"),
    sale_price: z.number().min(0).optional().nullable(),
    waste_percentage: z.number().min(0).max(100).default(5),
    allergens: z.record(z.string(), z.boolean()),
    ingredients: z.array(recipeIngredientSchema).default([]),
});

export type OutletFormValues = z.infer<typeof outletSchema>;
export type IngredientFormValues = z.infer<typeof ingredientSchema>;
export type RecipeFormValues = z.infer<typeof recipeSchema>;
