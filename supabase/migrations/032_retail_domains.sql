-- Migration 032 · Retail vertical — Pack I Phase 4
-- Idempotent. Five domains: Supply Chain / Inventory, Store Operations,
-- E-commerce / Digital, Pricing / Promotions, Customer Support / Returns.

BEGIN;

-- ── 15 · Supply Chain / Inventory ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS supply_chain (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  month DATE NOT NULL,
  inventory_turns_annual NUMERIC(5, 2),
  days_inventory_outstanding NUMERIC(5, 1),
  stockout_rate_pct NUMERIC(5, 2),
  overstock_rate_pct NUMERIC(5, 2),
  demand_forecast_accuracy_pct NUMERIC(5, 2),
  supplier_otd_pct NUMERIC(5, 2),
  is_demo_data BOOLEAN DEFAULT false,
  UNIQUE (client_id, month)
);

CREATE TABLE IF NOT EXISTS inventory_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  sku_category TEXT,
  month DATE NOT NULL,
  avg_inventory_units_thousands NUMERIC(10, 1),
  sell_through_rate_pct NUMERIC(5, 2),
  markdown_depth_pct NUMERIC(5, 2),
  is_demo_data BOOLEAN DEFAULT false
);
CREATE INDEX IF NOT EXISTS idx_inv_client_month ON inventory_metrics(client_id, month DESC);

-- ── 16 · Store Operations ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS stores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  store_number TEXT,
  format TEXT,
  sqft INT,
  annual_revenue_usd NUMERIC(12, 2),
  is_demo_data BOOLEAN DEFAULT false
);
CREATE INDEX IF NOT EXISTS idx_stores_client ON stores(client_id);

CREATE TABLE IF NOT EXISTS store_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  store_id UUID REFERENCES stores(id) ON DELETE SET NULL,
  month DATE NOT NULL,
  sales_usd NUMERIC(12, 2),
  transactions INT,
  avg_basket_size_usd NUMERIC(8, 2),
  labor_utilization_pct NUMERIC(5, 2),
  sales_per_sqft_usd NUMERIC(8, 2),
  is_demo_data BOOLEAN DEFAULT false
);
CREATE INDEX IF NOT EXISTS idx_store_metrics_store_month ON store_metrics(store_id, month DESC);

-- ── 17 · E-commerce / Digital ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ecommerce_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  month DATE NOT NULL,
  sessions_millions NUMERIC(10, 2),
  conversion_rate_pct NUMERIC(5, 2),
  avg_order_value_usd NUMERIC(8, 2),
  cart_abandonment_rate_pct NUMERIC(5, 2),
  bounce_rate_pct NUMERIC(5, 2),
  mobile_share_pct NUMERIC(5, 2),
  is_demo_data BOOLEAN DEFAULT false,
  UNIQUE (client_id, month)
);

CREATE TABLE IF NOT EXISTS sessions_daily (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  sessions INT,
  conversions INT,
  revenue_usd NUMERIC(12, 2),
  is_demo_data BOOLEAN DEFAULT false,
  UNIQUE (client_id, date)
);

-- ── 18 · Pricing / Promotions ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pricing_models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  name TEXT,
  strategy TEXT CHECK (strategy IN ('cost_plus','competitive','dynamic','promotional')),
  scope TEXT,
  gross_margin_pct NUMERIC(5, 2),
  is_demo_data BOOLEAN DEFAULT false
);
CREATE INDEX IF NOT EXISTS idx_pricing_models_client ON pricing_models(client_id);

CREATE TABLE IF NOT EXISTS promotions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  promotion_type TEXT,
  start_date DATE,
  end_date DATE,
  lift_pct NUMERIC(5, 2),
  margin_impact_usd NUMERIC(12, 2),
  is_demo_data BOOLEAN DEFAULT false
);
CREATE INDEX IF NOT EXISTS idx_promos_client_dates ON promotions(client_id, start_date DESC);

-- ── 19 · Customer Support / Returns ────────────────────────────────────
CREATE TABLE IF NOT EXISTS returns_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  month DATE NOT NULL,
  return_rate_pct NUMERIC(5, 2),
  avg_resolution_hours NUMERIC(6, 1),
  return_revenue_impact_usd NUMERIC(12, 2),
  is_demo_data BOOLEAN DEFAULT false,
  UNIQUE (client_id, month)
);

CREATE TABLE IF NOT EXISTS return_reasons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  reason TEXT,
  month DATE NOT NULL,
  count INT,
  is_demo_data BOOLEAN DEFAULT false
);
CREATE INDEX IF NOT EXISTS idx_return_reasons_client_month ON return_reasons(client_id, month DESC);

-- ── RLS ────────────────────────────────────────────────────────────────
ALTER TABLE supply_chain ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE ecommerce_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE returns_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE return_reasons ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE t TEXT;
BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'supply_chain','inventory_metrics','stores','store_metrics',
    'ecommerce_metrics','sessions_daily','pricing_models','promotions',
    'returns_metrics','return_reasons'
  ]) LOOP
    EXECUTE format('DROP POLICY IF EXISTS "service_role_all" ON %I', t);
    EXECUTE format('CREATE POLICY "service_role_all" ON %I FOR ALL TO service_role USING (true) WITH CHECK (true)', t);
  END LOOP;
END $$;

NOTIFY pgrst, 'reload schema';

COMMIT;
