# 2026-07-07-intelligence-cxo-storytelling — Intelligence Advisory Surface CXO Storytelling Upgrade

## Release ID

`2026-07-07-intelligence-cxo-storytelling`

## Status

`merged`

## Plain-English Summary

Upgrades the Intelligence advisory surface so that each of the six right-panel tabs tells an executive story, not just displays data. Adds tenant-specific narrative conclusions, illustrative-estimate labels, a "Begin a Move →" CTA, and personalized starter prompts. The surface now functions as the compelling precursor to the Moves workflow: a CXO can move from Industry Outlook → Peer Benchmarks → Value Signals → Begin a Move in a single uninterrupted session.

Changes are UI-only (no schema, no data, no API route changes). The left-panel ask engine and all data sources are unchanged.

## Layer Impact

- `global-control-lane`: Intelligence right-panel tabs get narrative punch blocks, illustrative labels, and a Move CTA. Left panel starter prompts are now tenant-specific (Lakeshore vs. SkyHarbor tuned). All tenants receive the upgrade.
- `client-data-lane`: None.

## Client Applicability

- All clients: Yes. All tenants see the upgraded tabs.
- Feature flag: None required — UI-only addition.

## Changes Included

- `src/components/intelligence-advisory/AdvisoryIntelligencePage.tsx`: Added `starterPrompts`, `tenantHighlightArea`, `tenantHighlightScore`, `outlookPunch`, `peerPunch` to `CorpusBriefing`; narrative punch blocks on Outlook and Peer tabs; "For {tenant}" implication on each Future Trend; illustrative labels on all hardcoded $ figures; "Begin a Move →" CTA in Value tab; action card in Risk tab; personalized adoption-curve note; tenant-specific starter prompts
- `src/components/intelligence-advisory/AdvisoryIntelligencePage.module.css`: Added `.narrativePunch`, `.implication`, `.moveCta`, `.moveCtaBtn`, `.riskActionCard`, `.riskCta` CSS classes

## QA / Validation

- **25Q live audit**: 25/25 passed against live Lakeshore session at app.abarva.ai
  - Strategic: 5/5 | Grounding: 5/5 | Gap: 5/5 | Cross-domain: 5/5 | Adversarial: 5/5
  - Proof: `proof/intelligence-surface-25q-audit-2026-07-07T05-33-14-057Z/audit-report.md`
- **TypeScript**: `npx tsc --noEmit` clean (0 errors) on feature branch
- **Release check**: all gates passed

## Rollout

Single-deploy. The Intelligence surface is served from `ca-abarva-web-lab-eastus` on the shared ACA web runtime. No traffic shifting required — this PR updates the main branch and deploys via the aca-main-deploy workflow.

## Rollback

Revert this PR. No data migrations were run; no schema changes to undo.

## Deployment Authority

This release deploys through the repo-owned ACA main deploy workflow (`aca-main-deploy.yml`). No ad-hoc `az acr build` or `az containerapp update` commands are issued outside the workflow.

## Audit Evidence

- PR: https://github.com/abarva-platform/abarva/pull/4518
- 25Q audit proof: `proof/intelligence-surface-25q-audit-2026-07-07T05-33-14-057Z/`
- Local release check: all 4 gates passed (Azure deployment lane, Release Control, Deploy Authority, Pilot Data Loader)
