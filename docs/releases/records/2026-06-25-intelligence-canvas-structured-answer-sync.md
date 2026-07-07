# 2026-06-25-intelligence-canvas-structured-answer-sync — Intelligence Canvas Structured Answer Sync

## Release ID

`2026-06-25-intelligence-canvas-structured-answer-sync`

## Status

`candidate`

## Plain-English Summary

The Intelligence page already receives a structured aVa answer packet from `/api/intelligence/ask`, but the right-side canvas could remain stuck on `aVa is forming the answer...` when the answer arrived as structured data instead of streamed text. This change makes the Intelligence canvas display the canonical packet answer text (`directAnswer` / `prose`) so the deployed page shows the completed response instead of a stale loading placeholder.

## Layer Impact

- `global-control-lane`: shared Intelligence surface behavior changes for all clients using the v2 Intelligence page.
- Frontend rendering only: no retrieval, prompt, tenant data, model, or database behavior changes.

## Client Applicability

- All clients: yes, for tenants on the shared Intelligence v2 surface.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none added; active through the shared surface once deployed.

## Changes Included

- `src/components/intelligence-v2/IntelligenceV2Surface.tsx`
- This release record.

## QA / Validation

- Pass: `npx eslint src/components/intelligence-v2/IntelligenceV2Surface.tsx`
- Pass: focused TypeScript filter showed no touched-file errors for `IntelligenceV2Surface`.
- Pass: `npm run audit:control-plane-purity:check`
- Pending until PR/deploy: signed-in browser proof on `https://app.abarva.ai/intelligence`.

## Rollout Plan

Merge to `main`; deploy through the approved Azure Container Apps main workflow.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: only the repo-owned main deploy workflow may move the shared ACA runtime.
- Approved image digest: populated by the ACA main deploy workflow after merge.
- ACA runtime invariant: template image, active revision image, and 100% traffic revision must match the approved digest.
- Worker image invariant: worker jobs updated by the ACA main deploy workflow.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, Intelligence ask must show the completed answer in the browser.

## Rollback Plan

Revert this commit and redeploy through the approved Azure Container Apps main workflow. The backend structured answer packet remains unchanged.

## Audit Evidence

- Pre-fix live browser evidence: `/Users/anand/Downloads/abarva-intelligence-composer-live-proof-20260625-after-3971/`
- PR URL: to be added by GitHub when opened.
- Deployment evidence: to be captured after merge by the ACA main deploy workflow.

## Known Gaps

This fixes the Intelligence canvas sync bug only. It does not redesign the chat dock, alter answer quality, or change the backend composer.
