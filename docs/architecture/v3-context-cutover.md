# V3 Context Cutover

Status: active cutover guardrail.

## Canonical Flow

`standard-2026-07-v3` tenant inputs -> validation -> evidence registry -> canonical facts -> entity profiles -> relationship graph -> context gaps/confidence -> module context packs -> approved Claude-derived advisory/story blocks and visual specs -> runtime rendering.

## Home / Knowledge Flow

`standard-2026-07-v3` tenant inputs -> deterministic Knowledge/Home context -> Claude-generated CXO story blocks and visual specs -> validation and approval -> neutral approved artifact store by `tenant_key` -> Home renders approved advisory content while Data, Relationships, Gaps, and Evidence rows remain deterministic.

## Retirement Rules

- V3 is the only canonical tenant input structure.
- Claude-derived advisory blocks are interpretation, not source-of-truth data.
- Candidate rows must never be selected by default runtime reads.
- Retired context labels listed in the language-burndown proof are internal compatibility only.
- Physical DB/schema names with retired labels may remain temporarily only behind neutral active context APIs.
- Legacy-named local datasets are frozen references only; default local runtime reads standard v3 inputs and neutral approved artifacts.

## Audit Commands

- `npm run audit:legacy-context-retirement`
- `npm run audit:legacy-dataset-sunset`
- `npm run audit:v3-only-active-architecture`
- `npm run audit:no-legacy-context-language`
- `npm run audit:candidate-invisibility`
