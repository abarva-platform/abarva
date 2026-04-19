-- Migration 015 · Seed relationship notes for demo texture
-- Hand-written personal/preference/style threads for Sarah Chen + James Park.
-- Without these, the Memory Moment scene opens without material to surface.
-- Idempotent via NOT EXISTS on (person_id, note_text).

BEGIN;

-- ── Sarah Chen ──────────────────────────────────────────────────────────
WITH sarah AS (SELECT id FROM persons WHERE graph_node_id = 'person_sarah_chen')
INSERT INTO relationship_notes (person_id, category, note_text, decay_at, surfaced_count)
SELECT sarah.id, 'personal',
       'Daughter applying to colleges, narrowing to three schools',
       NOW() + INTERVAL '90 days', 0
FROM sarah
WHERE NOT EXISTS (
  SELECT 1 FROM relationship_notes rn
  WHERE rn.person_id = sarah.id
    AND rn.note_text = 'Daughter applying to colleges, narrowing to three schools'
);

WITH sarah AS (SELECT id FROM persons WHERE graph_node_id = 'person_sarah_chen')
INSERT INTO relationship_notes (person_id, category, note_text, decay_at, surfaced_count)
SELECT sarah.id, 'personal',
       'Training for October half-marathon',
       NOW() + INTERVAL '90 days', 0
FROM sarah
WHERE NOT EXISTS (
  SELECT 1 FROM relationship_notes rn
  WHERE rn.person_id = sarah.id
    AND rn.note_text = 'Training for October half-marathon'
);

WITH sarah AS (SELECT id FROM persons WHERE graph_node_id = 'person_sarah_chen')
INSERT INTO relationship_notes (person_id, category, note_text, decay_at, surfaced_count)
SELECT sarah.id, 'preference',
       'Board meeting prep the week of March 15',
       NOW() + INTERVAL '14 days', 0
FROM sarah
WHERE NOT EXISTS (
  SELECT 1 FROM relationship_notes rn
  WHERE rn.person_id = sarah.id
    AND rn.note_text = 'Board meeting prep the week of March 15'
);

WITH sarah AS (SELECT id FROM persons WHERE graph_node_id = 'person_sarah_chen')
INSERT INTO relationship_notes (person_id, category, note_text, decay_at, surfaced_count)
SELECT sarah.id, 'style',
       'Prefers data-driven conversations over narrative framing',
       NOW() + INTERVAL '365 days', 0
FROM sarah
WHERE NOT EXISTS (
  SELECT 1 FROM relationship_notes rn
  WHERE rn.person_id = sarah.id
    AND rn.note_text = 'Prefers data-driven conversations over narrative framing'
);

UPDATE persons
SET personal_threads = ARRAY[
  'Daughter applying to colleges, narrowing to three schools',
  'Training for October half-marathon',
  'Board meeting prep the week of March 15'
]
WHERE graph_node_id = 'person_sarah_chen';

-- ── James Park ──────────────────────────────────────────────────────────
WITH james AS (SELECT id FROM persons WHERE graph_node_id = 'person_james_park')
INSERT INTO relationship_notes (person_id, category, note_text, decay_at, surfaced_count)
SELECT james.id, 'personal',
       'Moved family to Chicago last quarter',
       NOW() + INTERVAL '180 days', 0
FROM james
WHERE NOT EXISTS (
  SELECT 1 FROM relationship_notes rn
  WHERE rn.person_id = james.id
    AND rn.note_text = 'Moved family to Chicago last quarter'
);

WITH james AS (SELECT id FROM persons WHERE graph_node_id = 'person_james_park')
INSERT INTO relationship_notes (person_id, category, note_text, decay_at, surfaced_count)
SELECT james.id, 'preference',
       'Prefers early-morning syncs, 7am Central',
       NOW() + INTERVAL '60 days', 0
FROM james
WHERE NOT EXISTS (
  SELECT 1 FROM relationship_notes rn
  WHERE rn.person_id = james.id
    AND rn.note_text = 'Prefers early-morning syncs, 7am Central'
);

UPDATE persons
SET personal_threads = ARRAY[
  'Moved family to Chicago last quarter',
  'Prefers early-morning syncs, 7am Central'
]
WHERE graph_node_id = 'person_james_park';

COMMIT;
