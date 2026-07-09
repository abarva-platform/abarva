# 2026-07-09-ava-stream-reconcile-no-dup — aVa Stream Reconciliation No-Duplicate Guard

## Release ID

`2026-07-09-ava-stream-reconcile-no-dup`

## Status

`candidate`

## Plain-English Summary

Fixes a live aVa suggested-question audit defect where the answer stream could duplicate large portions of the response. When final answer repair changed bytes that had already been streamed, the append-only client received a divergent repaired tail, producing repeated paragraphs and malformed table rows. The reconciler now logs divergence but emits no duplicate remainder into the user-visible transcript.

## Layer Impact

- `global-control-lane`: Updates shared Intelligence/aVa streaming synthesis behavior.
- Runtime answer quality: Prevents duplicate answer bodies and broken tables caused by append-only repair divergence.
- Export quality: Reduces risk that HTML/PDF export captures duplicated transcript text.

## Client Applicability

- All clients: Yes. This is shared aVa answer streaming behavior.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/lib/intelligence/ask/synthesizer.ts`
- `src/lib/intelligence/ask/__tests__/ask-guardrails.test.ts`

## QA / Validation

- Pass: `npx jest src/lib/intelligence/ask/__tests__/ask-guardrails.test.ts --runInBand -t "does not append duplicated repaired text"`
- Pass: `npx eslint src/lib/intelligence/ask/synthesizer.ts src/lib/intelligence/ask/__tests__/ask-guardrails.test.ts`
- Pass: `npx tsc --noEmit --project /tmp/tsconfig-ava-stream-reconcile.json`
- Pass: `npm run release:check`
- Pending: live signed-in six-turn suggested-question click audit after deploy.

## Rollout Plan

Merge through PR to `main`. The repo-owned Azure Container Apps main deploy workflow builds the digest-pinned image, updates `ca-abarva-web-lab-eastus`, verifies health and runtime invariant, and shifts traffic.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None from this PR.
- Approved image digest: Pending deploy.
- ACA runtime invariant: Pending deploy.
- Worker image invariant: Pending deploy.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes.

## Rollback Plan

Revert this PR and redeploy through the repo-owned ACA main deploy workflow. No migrations, data changes, feature flags, or environment changes are involved.

## Audit Evidence

- PR URL: Pending.
- Live defect evidence: `proof/ava-suggested-followup-live-2026-07-09T05-00-37-045Z/` showed six submitted follow-up turns, but duplicated answer fragments and raw separator rows remained because stream repair appended divergent content after already-streamed text.
- CI / local validation: See QA section.
- Live screenshot/export proof: Pending after deploy.

## Known Gaps

This release prevents stream-duplication artifacts. It does not by itself validate every tenant-specific metric emitted by Claude/aVa; source accuracy remains a separate evidence-citation audit dimension.
