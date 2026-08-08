# 2026-08-08-source-decision-owner-preview-fallback — Fix leaked owner-preview sentence on Door 1 intake

## Release ID

`2026-08-08-source-decision-owner-preview-fallback`

## Status

`candidate`

## Plain-English Summary

The "Optimize a contract" intake screen (`/source/new?intent=contract-optimization`) auto-fills a "negotiation decision owner" field from contract data. When that auto-filled text is a full instructional sentence rather than an actual name (e.g. "Vendor Management / Sourcing Lead. Confirm the named accountable owner before any external action."), the approval-footer preview rendered the entire sentence as a bolded person name, followed by a generic role tag like `(sourcing)` picked up from a keyword match inside that sentence. This read as a fabricated person's name on a client-facing approval screen. The fix makes the name-preview logic recognize when the source text is sentence-length or contains a mid-string sentence break, and fall back to a generic "`<client> decision owner`" label instead of rendering the raw sentence as a name.

## Layer Impact

- **Lane: `global-control-lane`.** Layer 4 (Products) — Source. Presentation-only change inside `SourceOriginatePage.tsx`'s `buildDecisionOwnerPreview` helper, shared app behavior for all clients, not feature-gated. No canonical-model, adapter, or intake-data changes.

## Client Applicability

- All clients: Yes — this is a shared Source Workspace component, not tenant-scoped.
- Specific clients: N/A
- Internal only: No
- Public/demo only: No
- Feature flag: None

## Changes Included

- `src/components/source/SourceOriginatePage.tsx` — `buildDecisionOwnerPreview` now validates that the extracted candidate name is short and doesn't contain an embedded sentence break before using it; otherwise falls back to the existing generic label path.

## QA / Validation

- `tsc --noEmit` (worktree needed `--max-old-space-size=8192`; default heap OOMs on this project regardless of this change — pre-existing environment characteristic, not introduced here): pass.
- `eslint src/components/source/SourceOriginatePage.tsx`: pass.
- Jest: `SourceOriginatePage.contractOptimization.test.ts`, `source-originate-page.test.ts`, `source-language-canon.test.ts` — 33/34 pass. The 1 failure (`toHaveBeenCalledTimes(2)` timing in `source-originate-page.test.ts`) is confirmed pre-existing on a clean `origin/main` checkout with this patch stashed out — unrelated to this change, not introduced by it.
- Live verification plan: after deploy, load `/source/new?intent=contract-optimization`, select a contract whose auto-filled owner text is sentence-length (e.g. Microsoft Cloud Platform Agreement 2 / CTR-061), confirm the "Routes to:" line shows `<client> decision owner` instead of the raw instructional sentence.

## Rollout Plan

Standard PR → squash merge to `main` → `aca-main-deploy.yml` builds and deploys to `ca-abarva-web-lab-eastus`, 100% traffic on the new digest-pinned image.

## Deployment Authority

- Repo-owned deploy workflow: `aca-main-deploy.yml` (only mutator used).
- Shared runtime mutators: None ad-hoc.
- Approved image digest: recorded post-deploy once the workflow completes.
- ACA runtime invariant: verified post-deploy via `az containerapp revision list` against the merge commit.
- Worker image invariant: unaffected (no worker changes).
- Feature/env flag update path: N/A.
- Live signed-in proof required: Yes — see QA/Validation live verification plan.

## Rollback Plan

Revert the single commit and squash-merge; no data or migration involved, so rollback is a plain code revert with no state cleanup.

## Audit Evidence

PR URL and CI run link to be added on merge. Live proof screenshot to be captured post-deploy per the QA plan above.

## Known Gaps

This fix only addresses the *display* fallback. The upstream cause — the contract-optimization intake auto-fills the "negotiation decision owner" field with instructional placeholder text instead of a real named owner — is a separate, larger gap tracked in `docs/codex-handoff/SOURCE_OPTIMIZE_CONTRACT_WORKFLOW_AUDIT_2026-08-08.md`, along with the stale CTR-090 event that currently blocks the new contract-optimization intake path for that one contract.
