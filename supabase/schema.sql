-- Kitchen Cost Control System - SQL Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Units lookup table for dropdown options
CREATE TABLE units (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  abbreviation TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed default units
INSERT INTO units (name, abbreviation) VALUES
  ('Kilogram', 'kg'),
  ('Gram', 'g'),
  ('Liter', 'lt'),
  ('Milliliter', 'ml'),
  ('Unit', 'unit'),
  ('Piece', 'pc'),
  ('Portion', 'portion'),
  ('Sprig', 'sprig'),
  ('Bottle', 'bottle'),
  ('Box', 'box'),
  ('Tray', 'tray'),
  ('Bag', 'bag');

-- Outlets (Restaurants)
CREATE TABLE outlets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  type TEXT,
  location TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'maintenance', 'closed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Categories (per outlet)
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  outlet_id UUID NOT NULL REFERENCES outlets(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Global Ingredients Library
CREATE TABLE ingredients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  ingredient_no TEXT UNIQUE,
  category TEXT,
  base_unit TEXT NOT NULL DEFAULT 'kg',
  cost_per_unit DECIMAL(10, 4) NOT NULL DEFAULT 0,
  supplier TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Recipes (Master Records)
CREATE TABLE recipes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  outlet_id UUID REFERENCES outlets(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  recipe_no TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  critical_details TEXT,
  instructions TEXT,
  image_url TEXT,
  prep_time INTEGER,
  difficulty TEXT CHECK (difficulty IN ('Easy', 'Medium', 'Hard')),
  yield_amount DECIMAL(10, 2) DEFAULT 1,
  yield_unit TEXT DEFAULT 'portion',
  sale_price DECIMAL(10, 2),
  waste_percentage DECIMAL(5, 2) DEFAULT 5.00,
  allergens JSONB DEFAULT '{
    "gluten": false,
    "lactose": false,
    "yeast": false,
    "egg": false,
    "fish": false,
    "milk": false,
    "peanut": false,
    "shellfish": false,
    "soya": false,
    "nuts": false,
    "wheat": false,
    "celery": false,
    "mustard": false,
    "sesame": false,
    "sulphites": false
  }'::jsonb,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Recipe Ingredients (Join Table)
CREATE TABLE recipe_ingredients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  ingredient_id UUID NOT NULL REFERENCES ingredients(id) ON DELETE RESTRICT,
  quantity DECIMAL(10, 4) NOT NULL,
  unit TEXT,
  prep_detail TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_categories_outlet ON categories(outlet_id);
CREATE INDEX idx_recipes_outlet ON recipes(outlet_id);
CREATE INDEX idx_recipes_category ON recipes(category_id);
CREATE INDEX idx_recipe_ingredients_recipe ON recipe_ingredients(recipe_id);
CREATE INDEX idx_recipe_ingredients_ingredient ON recipe_ingredients(ingredient_id);
CREATE INDEX idx_ingredients_name ON ingredients(name);
CREATE INDEX idx_recipes_name ON recipes(name);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to tables with updated_at
CREATE TRIGGER update_outlets_updated_at
  BEFORE UPDATE ON outlets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ingredients_updated_at
  BEFORE UPDATE ON ingredients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_recipes_updated_at
  BEFORE UPDATE ON recipes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
