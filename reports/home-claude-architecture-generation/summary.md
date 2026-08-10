# Home Claude Architecture Generation Review

- Status: structural SVG pass; publication blocked
- Tenant: SkyHarbor Global (`skyharbor-air`)
- Model: `claude-sonnet-4-6`
- Prompt version: `home-claude-architecture-diagram-pack-v1`
- Generation mode: per-diagram Claude streaming calls
- Post-Claude mutation: none; validators reject and generation is rerun
- Review decision: changes requested; retain as review evidence only
- Home review surface: `Home / Claude Review` tab renders the retained SVG outputs through
  `/api/home/architecture-review/[diagramId]`; the route serves bundled server assets that are
  tested byte-for-byte against the retained report SVGs

## Generated Architecture Artifacts

- Review manifest: `reports/home-claude-architecture-generation/claude-architecture-diagram-pack.review.json`
- Raw response index: `reports/home-claude-architecture-generation/raw-claude-responses/raw-claude-response.json`
- Raw per-diagram responses: `reports/home-claude-architecture-generation/raw-claude-responses/raw-claude-response-*.json`
- Review-only SVG assets: `reports/home-claude-architecture-generation/generated-svg/*.svg`
- Home review renderer: `src/app/api/home/architecture-review/[diagramId]/route.ts`
- Bundled runtime SVG assets: `src/lib/home/claude-architecture-review-svg-assets.ts`
- Review snapshots: `reports/home-claude-architecture-generation/review-snapshots/*.png`
- Contact sheet: `reports/home-claude-architecture-generation/review-snapshots/contact-sheet.png`

## Generated Advisory Content

- Story blocks: `reports/multi-tenant-cxo-story-generation/skyharbor-air/generated-story-blocks.json`
- Visual specs: `reports/multi-tenant-cxo-story-generation/skyharbor-air/generated-visual-specs.json`
- Review report: `reports/multi-tenant-cxo-story-generation/skyharbor-air/summary.md`
- Raw story response: `reports/multi-tenant-cxo-story-generation/skyharbor-air/raw-claude-response.txt`

## Validation

- Architecture validator: structural pass with `--require-claude`
- SVG XML well-formedness: pass
- Stored SVG to raw Claude output fidelity: pass
- Story blocks: review-only candidate, 20 blocks
- Visual specs: review-only candidate, 12 specs
- Story-block score: structural prompt-compliance score only, 4.65
- Semantic validation: not run
- Human publication approval: not approved

## Failed Attempts Preserved

- Attempt 1 raw response failed because a single five-diagram response hit `max_tokens` and returned invalid JSON.
- Attempt 1 evidence is preserved at `reports/home-claude-architecture-generation/attempt-1/`.
- The generator was changed to per-diagram streaming calls before the successful run.
