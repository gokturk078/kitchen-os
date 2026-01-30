-- Add outlet_id to recipes table (Idempotent)
ALTER TABLE recipes 
ADD COLUMN IF NOT EXISTS outlet_id UUID REFERENCES outlets(id) ON DELETE CASCADE;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_recipes_outlet ON recipes(outlet_id);

-- Backfill outlet_id based on category if possible (For existing data)
UPDATE recipes r
SET outlet_id = c.outlet_id
FROM categories c
WHERE r.category_id = c.id AND r.outlet_id IS NULL;
