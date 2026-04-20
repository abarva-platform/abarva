-- Migration 038 · VIP profile layer — spec called it 034 but that slot's
-- taken by Pack H enterprise depth; renumbered.
-- Adds Layer 4 (USER CONTEXT) per the integrated-intelligence spec.

BEGIN;

-- ── vip_profiles -----------------------------------------------------
-- person_id is nullable so profiles can be pre-seeded BEFORE the VIP
-- logs in (Clerk creates persons lazily). When they do, link via
-- UPDATE vip_profiles SET person_id = $new WHERE display_name = $name.
CREATE TABLE IF NOT EXISTS vip_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id UUID REFERENCES persons(id) ON DELETE SET NULL,
  display_name TEXT NOT NULL,

  -- Identity
  current_title TEXT,
  current_company TEXT,
  current_industry TEXT,
  current_company_scale JSONB,

  -- History
  career_history JSONB DEFAULT '[]'::jsonb,
  education JSONB DEFAULT '[]'::jsonb,
  board_seats JSONB DEFAULT '[]'::jsonb,

  -- Active focus
  current_initiatives JSONB DEFAULT '[]'::jsonb,
  areas_of_expertise TEXT[] DEFAULT '{}',
  recent_public_signals JSONB DEFAULT '[]'::jsonb,

  -- Organizational context
  company_principles JSONB DEFAULT '[]'::jsonb,
  labor_model TEXT,
  cloud_posture TEXT,

  -- Inferred style
  communication_style JSONB DEFAULT '{}'::jsonb,
  builder_vs_buyer TEXT CHECK (builder_vs_buyer IN ('builder','buyer','mixed')),
  known_concerns JSONB DEFAULT '[]'::jsonb,

  -- Demo posture
  demo_tier TEXT CHECK (demo_tier IN ('vip','design_partner','prospect','standard')) DEFAULT 'standard',
  relationship_to_abarva TEXT,
  avoid_topics TEXT[] DEFAULT '{}',
  emphasize_topics TEXT[] DEFAULT '{}',

  -- Metadata
  curated_by TEXT DEFAULT 'anand',
  last_updated TIMESTAMPTZ DEFAULT now(),
  confidence TEXT DEFAULT 'high',
  source_urls TEXT[] DEFAULT '{}'
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_vip_profiles_person ON vip_profiles(person_id) WHERE person_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_vip_profiles_demo_tier ON vip_profiles(demo_tier) WHERE demo_tier != 'standard';
CREATE INDEX IF NOT EXISTS idx_vip_profiles_display_name_lower ON vip_profiles(lower(display_name));

-- RLS (service role only — VIP profiles contain sensitive public-person
-- research; never expose to clients).
ALTER TABLE vip_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "service_role_all_vip_profiles" ON vip_profiles;
CREATE POLICY "service_role_all_vip_profiles" ON vip_profiles
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ── Prat Vemana seed (idempotent — skips if display_name already exists)
INSERT INTO vip_profiles (
  display_name, current_title, current_company, current_industry,
  current_company_scale, career_history, education, board_seats,
  current_initiatives, areas_of_expertise, recent_public_signals,
  company_principles, labor_model, cloud_posture,
  communication_style, builder_vs_buyer, known_concerns,
  demo_tier, relationship_to_abarva, avoid_topics, emphasize_topics,
  curated_by, confidence, source_urls
)
SELECT
  'Prat Vemana',
  'Executive Vice President, Chief Information and Product Officer',
  'Target Corporation',
  'Retail',
  '{"revenue_usd": 107400000000, "employees": 440000, "fortune_rank": 37, "market_cap_usd": 65000000000}'::jsonb,
  '[
    {"role": "EVP, Chief Information and Product Officer", "company": "Target Corporation", "start": "2025-01", "end": null, "scope": "tech, cybersecurity, data platforms, data science, infrastructure, product engineering, UX"},
    {"role": "EVP, Chief Digital and Product Officer", "company": "Target Corporation", "start": "2022-10", "end": "2025-01", "scope": "digital business, Target+, product ops"},
    {"role": "SVP, Chief Digital Officer", "company": "Kaiser Permanente", "start": "2018", "end": "2022-10", "scope": "enterprise product mgmt, consumer experience, CTO office, cloud modernization, telehealth"},
    {"role": "Chief Product and Experience Officer", "company": "The Home Depot", "start": null, "end": "2018", "scope": "digital product, experience strategy"},
    {"role": "VP, Online", "company": "The Home Depot", "start": null, "end": null},
    {"role": "VP, Global E-commerce, Product and Analytics", "company": "Staples", "start": null, "end": null, "scope": "Velocity Lab, mobile strategy"}
  ]'::jsonb,
  '[{"degree": "MBA", "institution": "MIT Sloan School of Management"}, {"degree": "Engineering", "institution": "Sathyabama University"}]'::jsonb,
  '[{"company": "Frontier Communications", "role": "Board Member", "since": "2024", "industry": "Telecommunications"}, {"company": "Graphite Health", "role": "Board Member (former)", "industry": "Healthcare AI"}]'::jsonb,
  '["Target Trend Brain (GenAI trend intelligence, launched NRF 2026)", "Target+ marketplace expansion", "enterprise product operating model", "retail AI governance"]'::jsonb,
  ARRAY['digital commerce', 'healthcare digital transformation', 'GenAI platforms', 'enterprise product management', 'cloud modernization', 'consumer experience', 'telehealth'],
  '[
    {"type": "speaking", "venue": "NRF 2026 Big Show", "date": "2026-01", "topic": "Target Trend Brain — GenAI trend intelligence platform"},
    {"type": "announcement", "venue": "Target", "date": "2025-01", "topic": "Elevated to CIPO role"},
    {"type": "interview", "venue": "AIM Media House", "date": "2025-02", "topic": "CIPO appointment, digital strategy continuity"}
  ]'::jsonb,
  '["Does not use external consulting firms (company principle)", "Build-internal preference for core capabilities", "Product-led engineering culture"]'::jsonb,
  'Heavy internal engineering + large on/offshore staff augmentation for scaling analyst/delivery work',
  'AWS primary; extensive cloud modernization investment during Kaiser tenure carried forward',
  '{"pace": "direct", "detail_level": "technical, product-led", "attention_span": "focused but short — expects substance in first 2 minutes", "preference": "let me read, do not narrate"}'::jsonb,
  'builder',
  '["privacy boundary architecture — enforced how?", "outcome attribution rigor — measurement methodology", "cloud deployment flexibility — single-tenant?", "how is this different from internal tools I would build with my team?", "how does the platform improve with scale"]'::jsonb,
  'vip',
  'Potential design partner; warm introduction via Anand Sundaram',
  ARRAY['Apex retail demo — lived at Home Depot CPO + Staples e-commerce + now runs Target; will see retail composite gaps instantly', 'any generic consulting-replacement pitch — Target does not use consultants'],
  ARRAY['Meridian healthcare engagement — his Kaiser Permanente comfort zone, will evaluate with deep specificity', 'Helix pharma + Meridian augmentation — novel to him, showcases cross-client moat', 'privacy boundary architecture — his cybersecurity remit at Target demands it', 'cloud deployment story — single-tenant in customer VPC', 'outcome attribution methodology — CFO-grade rigor required', 'agent atlas — he built Target Trend Brain, will evaluate our orchestration depth'],
  'anand',
  'high',
  ARRAY['https://corporate.target.com/about/purpose-history/leadership/prat-vemana', 'https://nrfbigshow.nrf.com/speaker/prat-vemana', 'https://newsroom.frontier.com/board-of-directors/prat-vemana/', 'https://councils.aimmediahouse.com/prat-vemana-named-chief-information-and-product-officer-at-target/']
WHERE NOT EXISTS (SELECT 1 FROM vip_profiles WHERE lower(display_name) = lower('Prat Vemana'));

NOTIFY pgrst, 'reload schema';

COMMIT;
