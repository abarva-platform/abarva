# 2026-07-04-moves-promotion-guardrail — Enterprise-promotion guardrail (increment 11)

## Release ID

`2026-07-04-moves-promotion-guardrail`

## Status

`candidate`

## Plain-English Summary

Makes the "Move-scoped, never auto-promoted to enterprise context" rule a **first-class, tested guardrail** rather than just a label. A single policy module is the authority on promotion: it can only ever report "not added" or "review requested" — there is no code path that promotes. A code-scan test proves the deterministic layer never writes to enterprise/tenant context and that the approved-pack store is Move-scoped on both read and write. The approved-pack card now states clearly that adding to enterprise context is a **separate, human-reviewed action that never happens automatically**. Behind `moves_phase_workspace_v2` (Lakeshore on).

## Layer Impact

- `global-control-lane` (flag-gated): a pure promotion-policy module + a governance source-scan test + a clearer client-facing status line. No route/data/model change.
- `client-data-lane`: unchanged from increment 10 — the store already writes Move-scoped rows with tenant_key + program_id + RLS; this increment adds a test that asserts it.
- `experimental`: gated by `moves_phase_workspace_v2` (off by default).

## Client Applicability

- All clients: no — off by default. Specific clients: **Lakeshore** (flag opt-in). Feature flag: `moves_phase_workspace_v2`.

## Changes Included

- `src/lib/programs/phase-templates/enterprise-promotion.ts` — `enterprisePromotionStatus` (only `not_added` / `review_requested`), `isAutoPromotableToEnterprise` (always `false`), `buildPromotionReviewRequest` (records intent only, `pending_review`).
- `ApprovedInputsPackCard.tsx` — surfaces the promotion status + human-review detail.
- Tests: `enterprise-promotion.test.ts` — policy invariants + a source-scan (store is Move-scoped on read+write; no phase-templates code writes to enterprise/tenant context).
- No migrations, routes, scripts, or env changes.

## QA / Validation

- Jest 84/84 — **pass** (promotion status always human-review-required and never "promoted"; nothing auto-promotable even if spoofed; review request is `pending_review` only; store Move-scoped on both write and read; no enterprise/tenant-context write in the deterministic layer).
- Scoped strict `tsc` (pure lib + components) — **pass** (exit 0). ESLint — **pass** (one non-blocking unused-arg warning).
- Live signed-in Lakeshore proof — **run post-deploy** (the approved-pack card shows the human-review promotion status).
- Full-project `tsc --noEmit` — **not run** (red from an unrelated merge; doesn't block build/deploy given `ignoreBuildErrors: true`).

## Rollout Plan

Squash-merge → ACA main-deploy auto-deploys → live for Lakeshore. Same flag as increments 3–10.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` (auto on merge). No ad-hoc Azure commands, no migrate job.
- ACA runtime invariant / worker invariant: confirmed by the feature rendering live on `app.abarva.ai`.
- Data plane: no change (adds a test over the existing store).
- Live signed-in proof required: yes — the promotion status on the Lakeshore approved-pack card, post-deploy.

## Rollback Plan

Set the flag `includeTenants: []` (instant off) or revert the PR. No data impact.

## Audit Evidence

- PR URL: (added on open). Tests: jest 84/84 + scoped tsc 0 + eslint 0.

## Known Gaps

- **Promotion review is a policy + status, not a full pipeline.** A dedicated admin promotion-review screen (that actually approves + audits a promotion) is a deliberate future backlog item — by design, nothing in this workflow promotes. The `buildPromotionReviewRequest` records intent only.
- RLS is asserted via source-scan (tenant_key/program_id scoping) rather than a cross-tenant live test (which would need a second tenant).
- Full-project `tsc --noEmit` red from an unrelated merge; does not block build/deploy.
