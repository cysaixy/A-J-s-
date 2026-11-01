ALTER TABLE inventory_items
  ADD COLUMN IF NOT EXISTS pack_size NUMERIC(10, 2);

ALTER TABLE inventory_items
  ALTER COLUMN unit_cost TYPE NUMERIC(10, 4)
  USING unit_cost::NUMERIC(10, 4);

ALTER TABLE stock_in
  ADD COLUMN IF NOT EXISTS inventory_id INTEGER REFERENCES inventory_items(id) ON DELETE SET NULL;

ALTER TABLE stock_in
  ALTER COLUMN menu_id DROP NOT NULL;

ALTER TABLE stock_in
  ALTER COLUMN quantity TYPE NUMERIC(10, 2)
  USING quantity::NUMERIC(10, 2);

ALTER TABLE stock_in
  ADD COLUMN IF NOT EXISTS supplier VARCHAR(150),
  ADD COLUMN IF NOT EXISTS unit_cost NUMERIC(10, 4),
  ADD COLUMN IF NOT EXISTS total_cost NUMERIC(10, 2);

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS handled_by_staff_id INTEGER REFERENCES staff(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS status_updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE INDEX IF NOT EXISTS orders_handled_by_staff_id_idx
  ON orders(handled_by_staff_id);

ALTER TABLE inventory_incidents
  DROP CONSTRAINT IF EXISTS inventory_incidents_incident_type_check;

ALTER TABLE inventory_incidents
  ALTER COLUMN incident_type TYPE VARCHAR(50);

CREATE TABLE IF NOT EXISTS email_otps (
  email VARCHAR(150) PRIMARY KEY,
  code_hash CHAR(64) NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
