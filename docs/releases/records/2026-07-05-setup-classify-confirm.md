# 2026-07-05-setup-classify-confirm — Restore classify-confirm in the new Setup shell

## Release ID

`2026-07-05-setup-classify-confirm`

## Status

`candidate`

## Plain-English Summary

After a user loads data, the rows land as "needs classification" (in review) and are NOT retrievable until an operator classifies them — this is the step that turns loaded files into answerable context. A working UI for that step (`ClassificationTriageQueue`) exists at `/admin/context-layer/triage`, but the Setup redesign added a route consolidation in `src/proxy.ts` that 301-redirects every `/admin/*` browser page to the new `/admin` Setup shell — orphaning the classify page and making the step unreachable in-product. The new shell's Data > Confirm pane showed loaded files but had no way to classify the pending records, so the capability silently regressed.

This change surfaces the existing classify-confirm queue inside the new Setup shell's Data > Confirm pane (the canon home), adds a plain-English intro explaining that records stay in review until confirmed and to prove it in Intelligence, and wires the Overview "Confirm uncertain mappings" call-to-action to land directly on that pane.

## Layer Impact

- `global-control-lane`: `src/components/admin/AdminSetupExperience.tsx` — the shared Setup shell all tenant admins use. Mounts `ClassificationTriageQueue` in the Data > Confirm pane; adds an `initialPane` so the Overview CTA deep-links to Confirm. No schema/data/API change; the queue uses the existing `GET /api/admin/context-layer/triage` and `PATCH /api/admin/context-layer/triage/{id}`.

## Client Applicability

- All clients: Yes — every tenant admin's Setup > Data > Confirm pane now has the classify step.
- Specific clients: N/A
- Internal only: No
- Public/demo only: No
- Feature flag: None.

## Changes Included

- `src/components/admin/AdminSetupExperience.tsx`:
  - Import + mount `ClassificationTriageQueue` in the Data > Confirm pane, above the loaded-files table, with a completion-clarity intro (why classify, that rows stay in review until confirmed, and the Intelligence handoff).
  - Add `initialPane` to `DataArea` and `openConfirm()` so the Overview "Confirm uncertain mappings" row lands on the Confirm pane (action label changed "Open data" → "Confirm").

## QA / Validation

- Typecheck: `npx tsc --noEmit -p tsconfig.json` → **PASS** (0 errors).
- Lint: `eslint AdminSetupExperience.tsx` → **PASS** (clean).
- Root cause reproduction: **CONFIRMED** — navigating to `/admin/context-layer/triage` on `app.abarva.ai` 301-redirects to `/admin?from=/admin/context-layer/triage` (proxy.ts:360-368).
- Post-deploy live signed-in proof: **NOT-RUN (pending deploy)** — open Setup > Data > Confirm on `app.abarva.ai`, confirm the classify queue renders with domain/business-function dropdowns and a record can be classified without error.

## Known Gaps

- Completion-clarity polish deferred: `ClassificationTriageQueue` shows a "N records need classification" count but not a progress bar or a bulk "classify all in this file as X" action (a whole uploaded file usually shares a domain). Follow-up.
- The orphaned standalone route `/admin/context-layer/triage` remains redirected by the consolidation; it is intentionally not re-exposed — the canon home is the Setup shell pane. The standalone page can be retired in a later cleanup.
- No automated test added; verified by typecheck + live signed-in render.

## Rollout Plan

Merge to `main` → ACA main deploy → `ca-abarva-web-lab-eastus` → shift traffic → verify Setup > Data > Confirm renders the classify queue on `app.abarva.ai`.

## Deployment Authority

- Repo-owned deploy workflow: ACA main deploy.
- Shared runtime mutators: none.
- Approved image digest: set at deploy time from merged SHA.
- ACA runtime invariant: `ca-abarva-web-lab-eastus` serves the new revision at 100% traffic.
- Worker image invariant: unchanged.
- Feature/env flag update path: none.
- Live signed-in proof required: Yes — classify queue renders and a record classifies cleanly.

## Rollback Plan

Revert the single-file change to `AdminSetupExperience.tsx` and redeploy, or shift ACA traffic to the prior revision. No data/migration to unwind.

## Audit Evidence

- PR URL: (to be filled on open).
- Typecheck + lint output: clean.
- Live pre/post captures of Setup > Data > Confirm on `app.abarva.ai`.
