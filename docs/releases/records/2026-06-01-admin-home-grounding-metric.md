# 2026-06-01-admin-home-grounding-metric — Admin Home: real assistant-grounding metric

## Release ID

`2026-06-01-admin-home-grounding-metric`

## Status

`candidate`

## Plain-English Summary

The prior PR (`2026-06-01-admin-home-real-data-calm-reskin`) removed two hardcoded mock tiles from `/admin` Home — "Access posture 74%" and "Assistant grounding 86%" — because they were identical for every client and no live source backed them. This follow-up re-introduces **assistant grounding** as a *real, per-tenant* number, computed from the existing capability-grounding broker (`getCapabilityGrounding`), and adds it to the Home readiness strip. It reuses the substrate snapshot the page already fetched (via `snapshotOverride`) so no second database read is issued. When the grounding evidence is not yet "live" (no evaluator scores exist today), the number is honestly labeled "(estimated)". **Access posture was deliberately NOT re-introduced**: its only source (`buildUsersAccessReadinessView`) is a platform-wide deterministic seed that is identical across tenants and reads no live Clerk runtime — surfacing it as a per-tenant percent would re-introduce exactly the cross-tenant fake-data problem the previous PR fixed. It stays out until a tenant-scoped access source exists.

## Layer Impact

- `global-control-lane`: shared `/admin` Home chrome, all clients, no feature gate.
- `client-data-lane` (read-only): adds one more per-tenant read (capability grounding), deduplicated against the existing inventory snapshot — no new round trip.

## Client Applicability

- All clients: yes — every tenant now sees its own assistant-grounding percentage.
- Specific clients: none singled out.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/app/(maestro)/admin/page.tsx` — compute `groundingPct` from `getCapabilityGrounding(brokerTenantKey, { snapshotOverride: snapshot })` (per-agent average level mapped L0→0 … L3→100); render it in the readiness strip with an honest "(estimated)" suffix when `evidence !== 'live'`; only renders when a real value is available.

## QA / Validation

- `npx jest --testPathPatterns "capability-grounding|admin7-visual-lock|admin-route-shell|data-trust-composer"` → 195 passing; the only 2 failures are the same pre-existing `admin7-visual-lock` hex/font-drift failures (verified count unchanged at 2 — this change adds none, and `admin/page.tsx` is not among the cited violations).
- `npx eslint "src/app/(maestro)/admin/page.tsx"` → clean.
- `npx tsc --noEmit` → no errors on the changed file.
- Broker-boundary precedent: a page importing `getCapabilityGrounding` is already established — `src/app/(maestro)/admin/agent-readiness/page.tsx` does the same.
- No-duplicate-read: grounding reuses the page's existing snapshot via `snapshotOverride` (the dedup path added in PR-2617).

## Rollout Plan

Merge to `main` → Vercel production deploy. No migration, env var, or flag.

## Rollback Plan

`gh pr revert <pr>` and redeploy. Single-file, read-only addition — immediate, side-effect-free.

## Audit Evidence

- PR: (filled on open)
- Reuses the proven `getCapabilityGrounding` broker (same one `agent-readiness` and the prior `/admin` dedup path use).
- Companion records: `2026-06-01-admin-home-real-data-calm-reskin.md`, `2026-06-01-data-load-studio-calm-reskin.md`.

## Known Gaps

- **Access posture remains out.** It needs a tenant-scoped source (live Clerk role/SSO coverage per client). `buildUsersAccessReadinessView` is a platform-wide deterministic seed and must not be surfaced as a per-tenant percent. Re-introducing access posture is gated on building that broker.
- Grounding `evidence` is "estimated" for all tenants today because no evaluator-score table exists yet; the number reflects substrate-coverage levels only. It becomes "live" automatically once an evaluator table lands (the broker already branches on it).
- The two pre-existing `admin7-visual-lock` hex/font failures are still open (out of scope; dedicated token-cleanup follow-up).
