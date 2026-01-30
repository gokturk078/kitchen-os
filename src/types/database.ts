// Database Types for Kitchen Cost Control System

// Allergens type
export interface Allergens {
  gluten: boolean;
  lactose: boolean;
  yeast: boolean;
  egg: boolean;
  fish: boolean;
  milk: boolean;
  peanut: boolean;
  shellfish: boolean;
  soya: boolean;
  nuts: boolean;
  wheat: boolean;
  celery: boolean;
  mustard: boolean;
  sesame: boolean;
  sulphites: boolean;
}

// Default allergens object
export const defaultAllergens: Allergens = {
  gluten: false,
  lactose: false,
  yeast: false,
  egg: false,
  fish: false,
  milk: false,
  peanut: false,
  shellfish: false,
  soya: false,
  nuts: false,
  wheat: false,
  celery: false,
  mustard: false,
  sesame: false,
  sulphites: false,
};

// Allergen metadata for UI display
export const allergenMeta: Record<keyof Allergens, { label: string; icon: string }> = {
  gluten: { label: 'Gluten', icon: 'Wheat' },
  lactose: { label: 'Lactose', icon: 'Milk' },
  yeast: { label: 'Yeast', icon: 'Circle' },
  egg: { label: 'Egg', icon: 'Egg' },
  fish: { label: 'Fish', icon: 'Fish' },
  milk: { label: 'Milk', icon: 'Milk' },
  peanut: { label: 'Peanut', icon: 'Nut' },
  shellfish: { label: 'Shellfish', icon: 'Shell' },
  soya: { label: 'Soya', icon: 'Bean' },
  nuts: { label: 'Nuts', icon: 'TreeDeciduous' },
  wheat: { label: 'Wheat', icon: 'Wheat' },
  celery: { label: 'Celery', icon: 'Leaf' },
  mustard: { label: 'Mustard', icon: 'Droplet' },
  sesame: { label: 'Sesame', icon: 'Dot' },
  sulphites: { label: 'Sulphites', icon: 'FlaskConical' },
};

// Unit
export interface Unit {
  id: string;
  name: string;
  abbreviation: string;
  created_at: string;
}

// Outlet
export interface Outlet {
  id: string;
  name: string;
  type: string | null;
  location: string | null;
  status: 'active' | 'inactive' | 'maintenance' | 'closed';
  created_at: string;
  updated_at: string;
  // Aggregated counts
  recipe_count?: number;
  category_count?: number;
}

// Category
export interface Category {
  id: string;
  outlet_id: string;
  name: string;
  sort_order: number;
  created_at: string;
  // Joined
  outlet?: Outlet;
}

// Ingredient
export interface Ingredient {
  id: string;
  name: string;
  ingredient_no: string | null;
  category: string | null;
  base_unit: string;
  cost_per_unit: number;
  supplier: string | null;
  created_at: string;
  updated_at: string;
}

// Recipe
export interface Recipe {
  id: string;
  outlet_id: string | null;
  category_id: string | null;
  recipe_no: string;
  name: string;
  critical_details: string | null;
  instructions: string | null;
  image_url: string | null;
  prep_time: number | null;
  difficulty: 'Easy' | 'Medium' | 'Hard' | null;
  yield_amount: number;
  yield_unit: string;
  sale_price: number | null;
  waste_percentage: number;
  allergens: Allergens;
  status: 'active' | 'inactive' | 'archived';
  created_at: string;
  updated_at: string;
  // Joined data
  category?: Category;
  recipe_ingredients?: RecipeIngredientWithDetails[];
  // Calculated
  total_cost?: number;
}

// Recipe Ingredient
export interface RecipeIngredient {
  id: string;
  recipe_id: string;
  ingredient_id: string;
  quantity: number;
  unit: string | null;
  prep_detail: string | null;
  sort_order: number;
  created_at: string;
}

// Recipe Ingredient with joined ingredient data
export interface RecipeIngredientWithDetails extends RecipeIngredient {
  ingredient: Ingredient;
  line_cost: number; // Calculated: quantity * ingredient.cost_per_unit
}

// Form input types for creating/updating
export interface CreateOutletInput {
  name: string;
  type?: string;
  location?: string;
  status?: Outlet['status'];
}

export interface CreateCategoryInput {
  outlet_id: string;
  name: string;
  sort_order?: number;
}

export interface CreateIngredientInput {
  name: string;
  ingredient_no?: string;
  category?: string;
  base_unit: string;
  cost_per_unit: number;
  supplier?: string;
}

export interface CreateRecipeInput {
  category_id?: string;
  recipe_no: string;
  name: string;
  critical_details?: string;
  instructions?: string;
  image_url?: string;
  prep_time?: number;
  difficulty?: Recipe['difficulty'];
  yield_amount?: number;
  yield_unit?: string;
  sale_price?: number;
  waste_percentage?: number;
  allergens?: Allergens;
  status?: Recipe['status'];
}

export interface CreateRecipeIngredientInput {
  recipe_id: string;
  ingredient_id: string;
  quantity: number;
  unit?: string;
  prep_detail?: string;
  sort_order?: number;
}

// Recipe form with nested ingredients for react-hook-form
export interface RecipeFormData {
  recipe_no: string;
  name: string;
  category_id: string | null;
  critical_details: string;
  instructions: string;
  image_url: string;
  prep_time: number | null;
  difficulty: Recipe['difficulty'];
  yield_amount: number;
  yield_unit: string;
  sale_price: number | null;
  waste_percentage: number;
  allergens: Allergens;
  ingredients: {
    ingredient_id: string;
    ingredient_name: string;
    quantity: number;
    unit: string;
    prep_detail: string;
    cost_per_unit: number;
  }[];
}
