-- ============================================
-- Vehicle Rental Management App — Supabase Schema
-- ============================================

-- 1. Categories table
CREATE TABLE IF NOT EXISTS categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  vat_rate NUMERIC(5,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Seed categories
INSERT INTO categories (name, vat_rate) VALUES
  ('Scooter', 7.00),
  ('Car', 12.00),
  ('Premium', 0.00),
  ('Motorbike', 7.00)
ON CONFLICT (name) DO NOTHING;

-- 2. Rentals table
CREATE TABLE IF NOT EXISTS rentals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  license_plate TEXT NOT NULL,
  license_plate_image_url TEXT,
  passport_image_url TEXT,
  customer_name TEXT,
  hotel_name TEXT,
  room_number TEXT,
  category_id UUID REFERENCES categories(id),
  category_name TEXT,
  price_per_day NUMERIC(10,2) NOT NULL,
  num_days INTEGER NOT NULL,
  subtotal NUMERIC(10,2) NOT NULL,
  vat_rate NUMERIC(5,2) NOT NULL DEFAULT 0,
  vat_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  total NUMERIC(10,2) NOT NULL,
  receipt_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Row Level Security
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE rentals ENABLE ROW LEVEL SECURITY;

-- Allow all operations for authenticated users
CREATE POLICY "Authenticated users can manage categories"
  ON categories FOR ALL
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage rentals"
  ON rentals FOR ALL
  USING (auth.role() = 'authenticated');

-- Also allow anonymous access during development (remove in production)
CREATE POLICY "Anon read categories"
  ON categories FOR SELECT
  USING (true);

CREATE POLICY "Anon manage rentals"
  ON rentals FOR ALL
  USING (true);

-- 4. Views for Reporting

-- Daily revenue view
CREATE OR REPLACE VIEW daily_revenue AS
SELECT
  DATE(created_at) AS rental_date,
  COUNT(*) AS total_rentals,
  SUM(subtotal) AS gross_revenue,
  SUM(vat_amount) AS total_vat,
  SUM(total) AS net_revenue
FROM rentals
GROUP BY DATE(created_at)
ORDER BY rental_date DESC;

-- Monthly revenue view
CREATE OR REPLACE VIEW monthly_revenue AS
SELECT
  TO_CHAR(created_at, 'YYYY-MM') AS rental_month,
  COUNT(*) AS total_rentals,
  SUM(subtotal) AS gross_revenue,
  SUM(vat_amount) AS total_vat,
  SUM(total) AS net_revenue
FROM rentals
GROUP BY TO_CHAR(created_at, 'YYYY-MM')
ORDER BY rental_month DESC;

-- Revenue by category
CREATE OR REPLACE VIEW category_revenue AS
SELECT
  COALESCE(c.name, r.category_name, 'Unknown') AS category,
  COUNT(*) AS total_rentals,
  SUM(r.subtotal) AS gross_revenue,
  SUM(r.vat_amount) AS total_vat,
  SUM(r.total) AS net_revenue
FROM rentals r
LEFT JOIN categories c ON r.category_id = c.id
GROUP BY COALESCE(c.name, r.category_name, 'Unknown')
ORDER BY net_revenue DESC;

-- ============================================
-- Storage Buckets (run in Supabase Dashboard → Storage)
-- Create a bucket named "rental-images" with public access
-- ============================================
