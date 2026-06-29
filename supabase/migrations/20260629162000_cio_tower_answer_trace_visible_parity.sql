-- CIO Tower answer traces now store Claude's raw JSON contract separately from
-- the visible text assembled from that contract. The old equality check only
-- worked when Claude returned prose directly.

ALTER TABLE cio_tower.answer_traces
  DROP CONSTRAINT IF EXISTS answer_traces_check;

ALTER TABLE cio_tower.answer_traces
  DROP CONSTRAINT IF EXISTS answer_traces_visible_section_parity_check;

ALTER TABLE cio_tower.answer_traces
  ADD CONSTRAINT answer_traces_visible_section_parity_check
  CHECK (
    raw_model_response IS NULL
    OR rendered_response IS NULL
    OR (
      artifacts ? 'visible_section_parity'
      AND jsonb_typeof(artifacts -> 'visible_section_parity') = 'array'
    )
  );

COMMENT ON TABLE cio_tower.answer_traces IS
  'Question-to-render trace. raw_model_response stores Claude raw output; rendered_response stores exact visible text extracted from Claude-owned visible-answer contract. artifacts.visible_section_parity proves model text and rendered placement match except whitespace.';
