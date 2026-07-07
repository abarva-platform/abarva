# 2026-06-01-admin-home-real-data-calm-reskin — Admin Home: real per-tenant data + calm reskin

## Release ID

`2026-06-01-admin-home-real-data-calm-reskin`

## Status

`candidate`

## Plain-English Summary

The `/admin` Home page was rendering **hardcoded mock data** — the four stat tiles (81% / 3 / 74% / 86%), the dimension table ("Enterprise profile 92%", "Data estate 81%", …), and the review queue were module-level constants. Every client — Apex, Meridian, SkyHarbor — saw the **identical fake numbers** regardless of their real loaded substrate, which directly contradicts the product's "we already know *you*" positioning and the "build for pilot, not demo" principle. It was also visually cluttered (four multi-colored stat tiles) in the same way the founder rejected on the Setup surface.

This change binds Home to the **same real per-tenant broker the Data Trust page already uses** (`getSetupInventorySnapshot` → `composeDataTrustBlocks`), so the numbers are now true per client and fall back to a calm empty state (never invented values) when the broker is down or the tenant has no committed substrate. It also reskins Home to the locked design system: a one-line readiness strip replaces the four stat tiles, a serif headline, hairline status pills instead of filled multi-color chips, black primary button, and a real "Loaded data by dimension" table sorted by record weight. It additionally **fixes a pre-existing failing regression guard** (`admin7-visual-lock` expected the canonical string "Loaded data by dimension", which the prior mock page did not contain).

## Layer Impact

- `global-control-lane`: shared `/admin` Home chrome for all clients, no feature gate. Presentation + a read-only data binding to an existing broker. No schema, migration, or write path.
- `client-data-lane` (read-only): Home now reads each client's committed substrate snapshot via the existing `getSetupInventorySnapshot` broker — the same call Data Trust makes — so displayed numbers are client-scoped and isolated.

## Client Applicability

- All clients: yes — every tenant now sees its own real substrate on Home instead of shared mock numbers.
- Specific clients: none singled out.
- Internal only: no.
- Public/demo only: no — this removes demo-style placeholder data from a pilot surface.
- Feature flag: none.

## Changes Included

- `src/app/(maestro)/admin/page.tsx` — replaced the hardcoded `dataRows` / `actionRows` / stat-tile constants with a real per-tenant fetch (`getSetupInventorySnapshot(brokerTenantKey)` + `composeDataTrustBlocks`); reskinned to the locked system (one-line readiness strip, serif headings, hairline pills, black button); added a calm empty/first-load state; restored the canonical "Loaded data by dimension" heading.

## QA / Validation

- `npx jest --testPathPatterns "admin7-visual-lock"` → **2 failed, 149 passed** vs. **3 failed, 148 passed on main** — this change *removes* one pre-existing failure (the home-canonical-string guard) and **adds none**. The 2 remaining failures are pre-existing hex/font drift elsewhere in the admin tree, unrelated to this file (verified by stashing the change and re-running on clean `origin/main`).
- `npx jest --testPathPatterns "admin-route-shell|admin-routes-resolve|data-trust-composer|admin/setup"` → 9 suites / 107 tests pass.
- `npx eslint "src/app/(maestro)/admin/page.tsx"` → clean.
- `npx tsc --noEmit` → no errors on the changed file.
- Design-system fidelity: the rewritten page uses only `COLORS.*` tokens + opacity suffixes — zero raw hex literals.
- Tenant isolation: data is fetched per active client via `resolveAdminTenant()` + `clientKeyToInventorySubstrateKey`, identical to the Data Trust isolation path; no cross-client data is rendered.

## Rollout Plan

Merge to `main` → Vercel production deploy. No migration, env var, or feature flag. On deploy, `/admin` Home shows real per-tenant substrate for all clients.

## Rollback Plan

`gh pr revert <pr>` (or `git revert <merge-commit>`) and redeploy. Single-file, read-only data binding + presentation change — no schema or write dependency; rollback is immediate and side-effect-free. (Reverting restores the prior mock-data page, which also re-introduces the pre-existing visual-lock string failure.)

## Audit Evidence

- PR: (filled on open)
- Reuses the proven broker path from `src/app/(maestro)/admin/data-trust/page.tsx`.
- Test deltas captured above (3→2 visual-lock failures; 107 supporting tests green).
- Companion calm reskin of the Setup surface: PR #2781 (`2026-06-01-data-load-studio-calm-reskin.md`).

## Known Gaps

- The readiness summary strip's `decisionGrade` / `blocking` counts come from `composeDataTrustBlocks`, which is the same source Data Trust renders — if that composer's heuristics change, both surfaces move together (intended).
- Two pre-existing `admin7-visual-lock` failures (hex/font drift elsewhere in the admin tree) remain and are out of scope for this Home change; they should be addressed in a dedicated design-token cleanup.
- The four-tile "81/74/86" access-posture and assistant-grounding metrics were removed rather than re-bound, because no live broker for SSO-coverage / grounding-rate is wired yet; the calmer readiness strip surfaces the metrics that *are* real (loaded dimensions, records, decision-grade, blocking). Re-introducing access/grounding metrics is a follow-up once those brokers exist.
