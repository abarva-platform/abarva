-- DATA11 · add slug to clients for adapter tenant resolution

BEGIN;

ALTER TABLE clients ADD COLUMN IF NOT EXISTS slug TEXT;

-- Populate existing rows: lower + hyphenate name
UPDATE clients SET slug = lower(regexp_replace(name, '[^a-zA-Z0-9]+', '-', 'g'))
  WHERE slug IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_clients_slug ON clients(slug) WHERE slug IS NOT NULL;

NOTIFY pgrst, 'reload schema';

COMMIT;
