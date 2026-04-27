# ADMIN13 — Connectors Depth

## Metadata
- ID: ADMIN13
- Title: Connectors depth — per-connector detail drawer + config stub + requirements matrix
- Track: 06-admin-readiness-architecture
- Wave: wave-admin-completion
- Status: backlog
- Type: ui
- Dependencies: ADMIN9 audit, W32D, AGENT1
- Estimated complexity: M

## Purpose
Add depth to `/admin/connectors`: per-connector detail drawer, requirements matrix (which connectors each surface needs), Test Connection STUB, Configure STUB, and per-connector health-trend sparkline. Promotes richer detail (vendor, docsHref, error log) from legacy `/platform/admin/connectors`.

## Context
`/admin/connectors` today renders the W32D health table inside the canonical shell. Legacy `/platform/admin/connectors` has additional fields (vendor, docsHref, error detail). ADMIN13 lifts those, adds the drawer pattern, and surfaces the connector-requirements matrix that drives Source ingest / Programs / Intelligence readiness.

## Target state
- `/admin/connectors` has 4 tabs: Health (default) / Requirements / Configuration / Logs.
- Health tab: existing W32D table + per-connector health-trend sparkline (24h, deterministic seed).
- Requirements tab: matrix of (connector × surface) showing which connector is required for which canonical workflow.
- Configuration tab: read-only config-key list per connector with masked secret values.
- Logs tab: deterministic seed of last 20 log events.
- Connector row click → drawer: vendor, last-sync, error log (last 10), Test connection (HARD-GATED stub), Configure (HARD-GATED stub), docs link (SAFE).

## Allowed files
- `src/app/(maestro)/admin/connectors/page.tsx`
- `src/lib/admin/connectors-page-view.ts`
- `src/components/admin/connectors/ConnectorDetailDrawer.tsx` (new)
- `src/components/admin/connectors/RequirementsMatrix.tsx` (new)
- `src/components/admin/connectors/HealthTrendSparkline.tsx` (new)
- `src/__tests__/integration/admin/admin13-connectors-depth.test.ts` (new)
- `docs/build/slices/ADMIN13_CONNECTORS_DEPTH.md`

## Forbidden files
- Live connector SDKs (Clerk SDK / Supabase client / Vercel API / Pinecone client) — drawer stays read-only deterministic seed
- Other admin pages
- Migrations

## Implementation scope
1. Extend `connectors-page-view.ts` to include health-trend points (deterministic 24h seed).
2. Build drawer + matrix + sparkline components.
3. Wire 4 tabs in the page.
4. Render Test Connection / Configure as disabled buttons with reason text.

## Tests
- Drawer opens with all fields rendered.
- Matrix has correct cell states for known surface→connector mappings.
- Sparkline renders 24 datapoints.
- Test/Configure buttons disabled with reason.

## Validation
```bash
npx tsc --noEmit --pretty false
npm run lint -- src/components/admin/connectors src/app/\(maestro\)/admin/connectors
npx jest src/__tests__/integration/admin/admin13-connectors-depth
bash scripts/integration/check_admin_design_tokens.sh
```

## Acceptance criteria
1. 4 tabs render.
2. Drawer shows all required fields.
3. Requirements matrix grounded in a single source of truth (W32D readiness model).
4. ADMIN7 visual-lock passes.

## Risks
- Sparkline rendering must use ADMIN1 tokens only (no banned hex).

## Founder review
Visit `/admin/connectors`. Click a connector → drawer. Switch to Requirements → see matrix. Click Test Connection → button is disabled with reason.
