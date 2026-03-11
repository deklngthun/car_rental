-- Vehicles Table Setup for QR Code Workflow

CREATE TABLE IF NOT EXISTS vehicles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  license_plate TEXT NOT NULL UNIQUE,
  make_model TEXT NOT NULL,
  category_id UUID REFERENCES categories(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage vehicles"
  ON vehicles FOR ALL
  USING (auth.role() = 'authenticated');

CREATE POLICY "Anon read vehicles"
  ON vehicles FOR SELECT
  USING (true);

-- Seed with 3 test vehicles for our test workflow
-- (First, fetching the IDs of the categories to insert correctly)
DO $$
DECLARE
  car_category_id UUID;
  premium_category_id UUID;
BEGIN
  -- Get Category IDs
  SELECT id INTO car_category_id FROM categories WHERE name = 'Car' LIMIT 1;
  SELECT id INTO premium_category_id FROM categories WHERE name = 'Premium' LIMIT 1;
  
  -- Insert seed data bypassing conflicts if already present
  INSERT INTO vehicles (license_plate, make_model, category_id)
  VALUES 
    ('ABC-1234', 'Toyota Corolla', car_category_id),
    ('LMN-4567', 'Renault Captur', car_category_id),
    ('XYZ-987', 'BMW 5 Series', premium_category_id)
  ON CONFLICT (license_plate) DO NOTHING;
END $$;
