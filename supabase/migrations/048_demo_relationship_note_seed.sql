-- Migration 048 · Demo relationship note seed data
-- Extracted from 015 so schema DDL and demo DML run independently.

BEGIN;

WITH notes AS (
  SELECT p.id AS person_id, v.category, v.note_text, v.decay_interval
  FROM persons p
  JOIN (
    VALUES
      ('person_sarah_chen', 'personal', 'Daughter applying to colleges, narrowing to three schools', INTERVAL '90 days'),
      ('person_sarah_chen', 'personal', 'Training for October half-marathon', INTERVAL '90 days'),
      ('person_sarah_chen', 'preference', 'Board meeting prep the week of March 15', INTERVAL '14 days'),
      ('person_sarah_chen', 'style', 'Prefers data-driven conversations over narrative framing', INTERVAL '365 days'),
      ('person_james_park', 'personal', 'Moved family to Chicago last quarter', INTERVAL '180 days'),
      ('person_james_park', 'preference', 'Prefers early-morning syncs, 7am Central', INTERVAL '60 days')
  ) AS v(graph_node_id, category, note_text, decay_interval)
    ON p.graph_node_id = v.graph_node_id
)
INSERT INTO relationship_notes (person_id, category, note_text, decay_at, surfaced_count)
SELECT person_id, category, note_text, NOW() + decay_interval, 0
FROM notes
ON CONFLICT (person_id, note_text) DO NOTHING;

UPDATE persons
SET personal_threads = ARRAY[
  'Daughter applying to colleges, narrowing to three schools',
  'Training for October half-marathon',
  'Board meeting prep the week of March 15'
]
WHERE graph_node_id = 'person_sarah_chen';

UPDATE persons
SET personal_threads = ARRAY[
  'Moved family to Chicago last quarter',
  'Prefers early-morning syncs, 7am Central'
]
WHERE graph_node_id = 'person_james_park';

COMMIT;
