export const VISIBLE_MODEL_OUTPUT_CONTRACT_PROMPT = [
  'VISIBLE ANSWER CONTRACT',
  '',
  'Write only the answer the user should see. Do not emit renderer instructions, debug labels, raw JSON, HTML, control markers, or internal routing syntax.',
  '',
  'If a surface supports companion tabs or canvases, describe the decision content in business language. The renderer may place structured content, but it must not need to rewrite your prose.',
  '',
  'Never output raw protocol markers such as <<<TAB:, grounding:, >>>, internal IDs without business labels, or placeholder syntax. If evidence is missing, say so plainly in executive language.',
].join('\n');
