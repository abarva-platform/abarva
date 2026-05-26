# 2026-05-26-stress-p0-008-northstar-tenant-resolver — STRESS-P0-008 Northstar Tenant Resolver + Scorer Hardening

## Release ID

`2026-05-26-stress-p0-008-northstar-tenant-resolver`

## Status

`candidate`

## Plain-English Summary

First Northstar full-module stress run (2026-05-26T06-54 UTC) revealed that every Sentinel agent turn returned the canned error "Sentinel synthesis is not configured in this environment. Set ANTHROPIC_API_KEY to enable advisor-quality answers." despite ANTHROPIC_API_KEY being set in production. Root cause: when Codex's Packet 21 added `northstar` to `ClientKey`, it forgot to add an entry to `CLIENT_KEY_TO_DB_SLUGS` in `src/lib/active-client.ts`, so the tenant resolver couldn't find the Northstar row in the `clients` table → returned `tenantId = null` → synthesizer fell through to the no-tenant canned message. STRESS-P0-008. Three fixes: the missing slug entry; a Sentinel-misconfiguration detector in the stress scorer; and two scorer-honesty bugs that let the canned message score 10/10 on the first run.

## Layer Impact

- `agent-reasoning-lane`: `src/lib/active-client.ts` adds `northstar: ['northstar', 'northstar-medtech', 'northstar-clinical-tech']` to `CLIENT_KEY_TO_DB_SLUGS`. The Northstar row in the prod `clients` table (`name='Northstar MedTech'`, `tenant_key='northstar-medtech'`) now resolves correctly via the slug map.
- `ops-release-lane`: `scripts/audit/run-full-module-stress.mjs` adds a `sentinel_synthesis_misconfigured` P0 flag detector to `scoreResponse`, adds `\b` word boundaries to the Northstar grounding regex (the unboundaried `HIS` token false-matched "this"), and lowers the canned-template-repeat min-length from 200 → 80 chars so short canned errors don't slip through.
- No schema change. No tenant data write.

## Client Applicability

- All clients: partial — the scorer hardening applies to every tenant.
- Specific clients: Northstar Clinical Technologies (`tenant_key='northstar-medtech'`, `clientKey='northstar'`) is the only tenant currently affected by the resolver bug. Apex / Meridian / First Capital were never broken because their slug entries were already wired.
- Internal only: no
- Public/demo only: no
- Feature flag: none

## Changes Included

- `src/lib/active-client.ts` — add `northstar` entry to `CLIENT_KEY_TO_DB_SLUGS`
- `scripts/audit/run-full-module-stress.mjs` — three scorer hardening fixes (Sentinel-misconfig detector, word-boundaried grounding regex, lower canned-template min-length)
- `scripts/provision-cxo-personas.ts` — earlier this session, added `if (/Northstar/i.test(row.name)) byKey.set('northstar', row);` so the provisioning script can find the Northstar `clients` row by name
- First-run audit report: `audit-artifacts/full-module-stress-northstar-2026-05-26T06-54/FULL_MODULE_STRESS_TEST_REPORT.html`

## QA / Validation

- `node --check scripts/audit/run-full-module-stress.mjs`: **passed**.
- ESLint on changed files: **passed** (clean).
- Local `release:check`: will be confirmed before push.
- Verification re-run after merge will confirm Sentinel synthesis fires substantive answers for Northstar instead of the canned misconfig message, and the runner correctly scores the canned message as P0 if it ever re-appears for any tenant.
- Already used the provisioning fix to mint 5 Northstar Clerk users + 5 Supabase persons + memberships earlier in the session.

## Rollout Plan

Merge to `main`. Vercel production deploy auto-fires. Re-run `STRESS_TENANT=northstar node scripts/audit/run-full-module-stress.mjs` and confirm:
- Q1–Q10 produce substantive answers (>500 chars each, citing Northstar / medtech / FDA / MedSurg / etc terms)
- `sentinel_synthesis_misconfigured` flag does NOT appear on any turn
- Cross-tenant leakage flag count remains 0

No regression risk for Apex / Meridian / First Capital — the slug map change is additive.

## Rollback Plan

Revert the merge commit. The `active-client.ts` change is additive (adds one Record entry); the runner changes are dev-tooling only. No schema, no policy, no tenant-data write.

## Audit Evidence

- Pre-fix stress report: `audit-artifacts/full-module-stress-northstar-2026-05-26T06-54/FULL_MODULE_STRESS_TEST_REPORT.html`
- Pre-fix transcripts: `audit-artifacts/full-module-stress-northstar-2026-05-26T06-54/transcripts/`
- All 10 transcripts confirmed identical canned message in first-run output.
- Post-merge re-run report will be attached.

## Known Gaps

- Northstar substrate is loaded (Codex Packet 21 shipped 240 apps / 820 edges / 80 initiatives / 3,400 roles / 720 corpus chunks under `datasets/northstar-clinical-tech-synthetic-v1/`) but until the tenant resolver fix lands, Sentinel can't ground against it. Post-merge re-run will be the first time the Northstar substrate is actually queried in production.
- TypeScript's `Record<ClientKey, string[]>` type SHOULD have rejected the missing `northstar` key. It didn't, which suggests there's either lax tsconfig or the build is bypassing strict checks for this file. Worth a follow-up audit but out of scope here.
- Task #17 (third-generation tenant-bleed source via `ai_egress_audit`) remains open.
