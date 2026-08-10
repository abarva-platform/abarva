# Home Claude Architecture Generation Review

- Status: pass
- Tenant: SkyHarbor Global (`skyharbor-air`)
- Model: `claude-sonnet-4-6`
- Prompt version: `home-claude-architecture-diagram-pack-v1`
- Generation mode: per-diagram Claude streaming calls
- Post-Claude mutation: none; validators reject and generation is rerun

## Generated Architecture Artifacts

- Manifest: `datasets/tenant-inputs/skyharbor-air/approved-content/home/claude-architecture-diagram-pack.json`
- Raw response index: `datasets/tenant-inputs/skyharbor-air/approved-content/home/architecture-diagram-pack-v1/raw-claude-response.json`
- Raw per-diagram responses: `datasets/tenant-inputs/skyharbor-air/approved-content/home/architecture-diagram-pack-v1/raw-claude-response-*.json`
- SVG assets: `public/generated/home/skyharbor-air/architecture-diagram-pack-v1/*.svg`
- Review snapshots: `reports/home-claude-architecture-generation/review-snapshots/*.png`
- Contact sheet: `reports/home-claude-architecture-generation/review-snapshots/contact-sheet.png`

## Generated Advisory Content

- Story blocks: `datasets/context-artifacts/approved/skyharbor-air/home-knowledge/approved-cxo-story-blocks.json`
- Visual specs: `datasets/context-artifacts/approved/skyharbor-air/home-knowledge/approved-cxo-visual-specs.json`
- Review report: `reports/multi-tenant-cxo-story-generation/skyharbor-air/summary.md`
- Raw story response: `reports/multi-tenant-cxo-story-generation/skyharbor-air/raw-claude-response.txt`

## Validation

- Architecture validator: pass with `--require-claude`
- SVG XML well-formedness: pass
- Story blocks: pass, 20 blocks
- Visual specs: pass, 12 specs
- Story-block score: 4.65

## Failed Attempts Preserved

- Attempt 1 raw response failed because a single five-diagram response hit `max_tokens` and returned invalid JSON.
- Attempt 1 evidence is preserved at `reports/home-claude-architecture-generation/attempt-1/`.
- The generator was changed to per-diagram streaming calls before the successful run.
