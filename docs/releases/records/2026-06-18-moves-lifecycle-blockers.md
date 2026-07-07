# 2026-06-18-moves-lifecycle-blockers — Strategic Moves lifecycle blockers (retrieval, async generation, gate, capture)

## Release ID

`2026-06-18-moves-lifecycle-blockers`

## Status

`candidate`

## Plain-English Summary

A first-time-user product QA crawl of the Strategic Moves / Source lifecycle on `app.abarva.ai` (First Capital) found that the deliverable a user actually wants — the P1 Charter — could be generated but never reliably obtained, and that the gate-approval button dead-ended into Setup/Admin. This change fixes the four self-contained blockers and documents a fifth (state reconciliation) that needs private-DB validation before it can be shipped safely.

What changed, in plain terms:

1. **Artifact retrieval.** The File Cabinet's **Download** returned HTTP 503 and **Open** did nothing. The 503 was a transient tenant-lookup blip on the freshly routed download request being treated as a hard failure; the tenant lookup now retries a couple of times before giving up, so a one-off blip recovers instead of dead-ending the download. The File Cabinet's Open/Download buttons now fetch the bytes (with the same short retry) and open/save them via an object URL, so they work reliably and are never silent no-ops.
2. **Async generation.** The phase "Generate artifact" button ran the multi-pass charter build **synchronously** inside one HTTP request and hit the ~240s gateway timeout — surfacing "Generate failed (HTTP 504)" even though the durable worker had actually produced the artifact. It now uses the same **enqueue + poll** path that "Approve & Build" already uses (`POST /api/v1/deliverables/generate-phase` → durable worker → `GET /api/v1/deliverables/runs/{id}`), so the request returns immediately and the UI tracks live progress to completion. No more false-failure-with-orphaned-artifact.
3. **Gate approval.** The Move detail "Resolve decision" CTA was hardcoded to `/admin/programs/approvals` and dropped the user into Setup/Admin (no Move-gate approval surface, no path back). It now stays in-place on the Move, routing to the phase workspace where the working save → approve primitive lives.
4. **Deterministic P0 capture.** Nexus sometimes acknowledged captured scaffold sections in prose without emitting the structured `brief-progress` artifact, leaving the scaffold stalled and the "Promote to P1 Charter" button disabled while telling the user to click it. The origination cadence directive is now mandatory: emit the full `brief-progress` (all fields) every turn, and never claim a section is captured / that the user can promote without emitting it that turn.

## Layer Impact

- **`global-control-lane`** — all of the changes are shared app / control-plane behavior, not client-scoped data. Specifically:
  - Tenant-lookup resilience in `getActiveClientRow` affects every tenancy-gated `/api/v1` route (retry on a transient lookup failure before returning the retryable 503).
  - Moves File Cabinet retrieval UI, Moves phase-workspace generation client, Moves detail gate CTA, and the Nexus origination system-prompt directive are shared product behavior for all tenants.

No `client-data-lane` (no schema, RLS, seed, or per-client data), no `internal-admin`, no migration.

## Client Applicability

State exactly who receives the change.

- All clients: **Yes** — shared control-plane/app behavior, no feature flag, no tenant gating.
- Specific clients: No.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/lib/active-client.ts` — bounded retry (150ms/450ms) around `resolveTenant` in `getActiveClientRow` so a transient tenant-lookup blip doesn't 503 the artifact download (or any tenancy-gated route).
- `src/components/strategic-moves/FileCabinetPanel.tsx` — Open/Download now fetch bytes with a 503-retry and open/save via an object URL (no more silent no-op `<a>` navigations); inline error surfaced per row.
- `src/components/strategic-moves/StrategicMovePhaseClient.tsx` — phase "Generate artifact" repointed from the synchronous `…/current-state/deliverable/orchestrate` to the durable enqueue (`/api/v1/deliverables/generate-phase`) + poll (`/api/v1/deliverables/runs/{id}`); `GenState` carries live progress; Step-3 JSX shows progress and a nullable quality score.
- `src/components/strategic-moves/StrategicMoveDetailView.tsx` — "Resolve decision" routes in-place to `/strategic-moves/{id}/phase/{currentPhase}?focus=gate` instead of `/admin/programs/approvals`.
- `src/lib/programs/failure-mode-prompt.ts` — `composeBriefProgressCadenceDirective` hardened from permissive to mandatory full-state emission per turn.
- `src/lib/__tests__/active-client.test.ts` — regression tests for the tenant-lookup retry (recovers from a transient blip; still 503s on a sustained outage).

## QA / Validation

- `npx jest src/lib/__tests__/active-client.test.ts` → **7 passed** (5 existing + 2 new retry regressions).
- `npx eslint` on all changed files → **0 errors, 0 warnings**.
- `npx tsc --noEmit` → **0 errors in changed files** (6 unrelated errors are dependency-resolution artifacts of the local worktree node_modules symlink: `js-yaml`, `@azure-rest/ai-document-intelligence`, `@axe-core/playwright` type decls — not present on a clean main install and not touched here).
- **NOT YET DONE (requires deploy):** the live end-to-end acceptance walk (Home → Create Move → P0 → Promote → P1 → Save → Approve → Generate → confirm job completes → artifact exists → Open → Download → refresh → still exists → status consistent). localhost cannot reach the private Postgres/Blob data plane, so generation/persistence/retrieval can only be proven on ACA. This must be re-run after deploy before marking `released`.

## Rollout Plan

Merge the PR to `main` → ACA image build + web deploy (`aca-main-deploy` auto-deploys on push to main; rerun on ACR ConnectionReset). No database migration, no control-lane job, no feature-flag flip. The async-generation change relies on the already-deployed `deliverable_runs` durable queue + `process-deliverable-queue` worker (PR #3585) — no worker change required.

## Rollback Plan

Revert the PR and redeploy the prior `main` image (single revert, fast). There is **no schema migration**, so no DB rollback constraints. Each fix is independent — if one regresses, the offending file can be reverted in isolation.

## Audit Evidence

- PR URL: (added on open) for branch `fix/moves-lifecycle-blockers`.
- CI: GitHub Actions run on the PR (jest + eslint + release-check).
- Local jest output: 7 passed (active-client retry suite).
- Source crawl that motivated this: live First Capital Move `f14702a1-…` — 504 on generate (artifact persisted as `move_artifact` v2, quality 66/100) + 503 on `…/artifacts/{id}/download` + Resolve-decision → `/admin` redirect.
- Post-deploy: re-run the acceptance walk on ACA and attach the result before flipping to `released`.

## Known Gaps

- **State reconciliation (#3) is deferred, not shipped.** Root cause confirmed: `getMoveStatus` (`src/lib/programs/transformers.ts`) derives `awaiting_decision` from `engagements.lifecycle_state='submitted_for_approval'` | a pending `founder_approval_requests` row | the latest `phase_snapshots.approval_status='pending'`, while the phase workspace renders any phase regardless of `engagements.current_phase`, and `CharterWorkflow`'s Approve calls deliverable sign-off (not phase-gate) — so the Overview can show stale "P0 · awaiting decision" while `/phase/1` looks active. The fix is a write-path state-machine change (advance must write an `approved` `phase_snapshot` and clear the pending approval; the phase workspace should gate on `current_phase`) that must be validated against the private DB; shipping it blind from localhost risks corrupting phase state.
- **Open preview for binary office formats:** Open renders inline for HTML/PDF; DOCX/XLSX/PPTX still download (no in-browser converter). Acceptable — no more no-op.
- **Generation quality score** is not returned by the run-status poll, so the phase Step-3 success state shows "Built ✓" rather than a numeric quality score; the score is still visible in the File Cabinet. Surfacing it via the poll endpoint is a small follow-up.
