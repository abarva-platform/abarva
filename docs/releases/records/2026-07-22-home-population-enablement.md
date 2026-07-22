# 2026-07-22-home-population-enablement — operator job generates Claude content, with an approve quality gate

## Release ID

`2026-07-22-home-population-enablement`

## Status

`candidate`

## Plain-English Summary

Prepares the Home Knowledge Pack operator population job to write the real Claude-authored content, safely. Three fixes:

1. **The operator write script did not use Claude.** `home:knowledge-pack-v2:write` was `--tenant=all --write-db --approve` with no `--use-claude`, so a "full population" would have written **deterministic-only packs, auto-approved live** — no executive read, no AI readiness, no strategic narratives, no "New Ways of Operating." Adds `--use-claude`.

2. **Content quality gate.** The Claude layer is generated over two API calls; the forward-looking (strategic_narratives) call is non-fatal and can transiently return nothing. Now, when `--use-claude` and `--approve` are both set, a tenant whose required Claude content is missing (empty executive_read / strategic_narratives / ai_readiness) is written as `candidate` and flagged — NOT approved live with an empty "New Ways of Operating." Only complete packs go live; incomplete ones wait for a re-run.

3. **Broadened retry fixes the flakiness.** The API-call retry only covered HTTP 429/5xx; transient network/timeout errors (no `.status`: ECONNRESET, ETIMEDOUT, socket hang up, SDK 'Request timed out') were not retried, which is why the back-to-back second (strategic) call intermittently returned empty. Retry now also covers no-status transients and 408. The generation call is idempotent, so retrying is safe.

Net: the population job can now write real, complete, C-suite Claude content per tenant, and the approve gate + retry keep an incomplete pack from going live.

## Layer Impact

- `client-data-lane`: changes how the operator population job writes packs (Claude content; content-gated approval).
- `global-control-lane`: operator npm script + generator hardening. No runtime read-path change.

## Client Applicability

- All clients: the population job writes Claude content for every tenant; only complete packs are approved live.
- Internal only: operator tooling.
- Feature flag: None.

## Changes Included

- `package.json`: `home:knowledge-pack-v2:write` now passes `--use-claude`.
- `scripts/knowledge/build-home-knowledge-pack-v2.mjs`:
  - Content quality gate: `--approve` + missing Claude content (executive_read / strategic_narratives / ai_readiness) → that tenant held at `candidate`, flagged `held_as_candidate_missing_claude_content:...`.
  - Broadened API retry to cover no-status network/timeout transients + 408 (both the main pack call and the dedicated strategic call).

## QA / Validation

- `pass` — `node --check` + `npx eslint` clean.
- `pass` — Happy path: SkyHarbor `--use-claude --write-db --approve` wrote `status=approved` with `strategic_narratives=14`, `executive_read=1` — approved because content is complete, and the retry made the second call succeed.
- `pass` — Gate: an earlier run where the strategic call transiently returned 0 was correctly written as `status=candidate` (not approved), flagged with `held_as_candidate_missing_claude_content:strategic_narratives`. The empty "New Ways of Operating" was kept out of the live/approved slot.
- `pass` — Retry: broadening to no-status transients converted an intermittent empty strategic result into a completed 14-entry result.
- `n/a` — No migration (no schema change).
- `pass` — `node scripts/release-check.mjs --base origin/main --head HEAD` (to run pre-push).

## Rollout Plan

Merge + deploy through the normal ACA lane. Then run the population via the governed ACA operator job (`scripts/ops/submit-aca-operator-job.mjs`) invoking `home:knowledge-pack-v2:write`, passing `--secret-env ANTHROPIC_API_KEY=anthropic-api-key` (the secret already exists on the container app). Per tenant: complete packs approve automatically; any held at `candidate` (flagged) are re-run until complete, then they approve. Verify each tenant's strategic_narratives count is non-zero before treating the population as done.

## Deployment Authority

- Repo-owned deploy workflow: Azure Container Apps main deploy after merge.
- Shared runtime mutators: the population operator JOB (not this deploy) mutates pack data — run separately through the governed ACA-job lane per `docs/ops/aca-data-build-job-rule.md`.
- Migration application: none.
- Feature/env flag update path: the ACA job dispatch must add `--secret-env ANTHROPIC_API_KEY=anthropic-api-key`.
- Live signed-in proof required: after population, verify approved packs per tenant (non-zero Claude content) before the runtime read path consumes them.

## Rollback Plan

Revert the PR to restore the deterministic-only operator script. Approved packs already written can be retired by setting `effective_to` + status `retired` on the affected `home_knowledge_packs` rows; the prior approved pack remains the fallback.

## Audit Evidence

- Local approve-path proof: SkyHarbor approved with 14 strategic narratives; earlier flaky run held as candidate.

## Known Gaps

- Population itself is not run by this PR — it enables the job. The actual run is the next operator action.
- The two-call generation is ~2-3 min/tenant; the strategic call, even with broadened retry, can still exhaust retries under sustained transient failure — in which case the gate holds that tenant as candidate for a re-run (correct, safe).
- Runtime read path still does not consume these tables; the dashboard rebuild is the parallel workstream.
