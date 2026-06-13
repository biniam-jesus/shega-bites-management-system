-- 
-- PostgreSQL DDL Schema for Shega Bites POS Engine
-- Copy-paste this into your Supabase SQL Editor to set up the database tables correctly.
-- 

-- 1. Table for Ingredients
CREATE TABLE IF NOT EXISTS shega_ingredients (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  unit TEXT NOT NULL,
  stock NUMERIC NOT NULL DEFAULT 0,
  "minStock" NUMERIC NOT NULL DEFAULT 0,
  "costPerUnit" NUMERIC NOT NULL DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Table for Menu Dishes
CREATE TABLE IF NOT EXISTS shega_dishes (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  subcategory TEXT NOT NULL,
  description TEXT,
  "basePrice" NUMERIC NOT NULL,
  variants JSONB DEFAULT '[]'::jsonb, -- Array of variants [{name: "Single", price: 540}]
  recipe JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of ingredients needed [{ingredientId: "...", quantity: 2.5}]
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Table for Dining Tables Setup
CREATE TABLE IF NOT EXISTS shega_tables (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('Empty', 'Occupied', 'Unclean')),
  "currentOrderId" TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Table for Orders
CREATE TABLE IF NOT EXISTS shega_orders (
  id TEXT PRIMARY KEY,
  "orderNumber" INTEGER NOT NULL,
  "tableId" TEXT NOT NULL,
  "tableName" TEXT NOT NULL,
  items JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of OrderItem [{dishId: "...", dishName: "...", price: 540, quantity: 1, variantName: "Single"}]
  total NUMERIC NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('Pending', 'Preparing', 'Ready', 'Served', 'Cancelled')),
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  "servedAt" TIMESTAMP WITH TIME ZONE
);

-- 5. Table for Inventory Logs and Audits
CREATE TABLE IF NOT EXISTS shega_inventory_logs (
  id TEXT PRIMARY KEY,
  "ingredientId" TEXT NOT NULL REFERENCES shega_ingredients(id) ON DELETE CASCADE,
  "ingredientName" TEXT NOT NULL,
  "amountChanged" NUMERIC NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('Deduction', 'Adjustment', 'Restock')),
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  reference TEXT
);

-- Turn on Row-Level Security (Optional, disable or set rules as desired)
ALTER TABLE shega_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE shega_dishes ENABLE ROW LEVEL SECURITY;
ALTER TABLE shega_tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE shega_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE shega_inventory_logs ENABLE ROW LEVEL SECURITY;

-- Create fully permissive policies for quick-start development/testing
-- (In production, replace these with authenticated-only select/insert/update scopes depending on your roles)
CREATE POLICY "Allow anonymous read logic" ON shega_ingredients FOR SELECT USING (true);
CREATE POLICY "Allow anonymous write logic" ON shega_ingredients FOR ALL USING (true);

CREATE POLICY "Allow anonymous read logic" ON shega_dishes FOR SELECT USING (true);
CREATE POLICY "Allow anonymous write logic" ON shega_dishes FOR ALL USING (true);

CREATE POLICY "Allow anonymous read logic" ON shega_tables FOR SELECT USING (true);
CREATE POLICY "Allow anonymous write logic" ON shega_tables FOR ALL USING (true);

CREATE POLICY "Allow anonymous read logic" ON shega_orders FOR SELECT USING (true);
CREATE POLICY "Allow anonymous write logic" ON shega_orders FOR ALL USING (true);

CREATE POLICY "Allow anonymous read logic" ON shega_inventory_logs FOR SELECT USING (true);
CREATE POLICY "Allow anonymous write logic" ON shega_inventory_logs FOR ALL USING (true);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_shega_dishes_category ON shega_dishes(category);
CREATE INDEX IF NOT EXISTS idx_shega_orders_status ON shega_orders(status);
CREATE INDEX IF NOT EXISTS idx_shega_inventory_logs_ing ON shega_inventory_logs("ingredientId");
