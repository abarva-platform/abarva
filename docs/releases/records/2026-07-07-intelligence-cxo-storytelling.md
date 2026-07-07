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

## Rollout Plan

Single-deploy via `aca-main-deploy.yml` on push to main. No traffic shifting required. No feature flag. All tenants receive the upgraded UI immediately on the next container revision.

## Rollback Plan

Revert this PR. No data migrations were run; no schema changes to undo. The surface falls back to the previous tab rendering immediately on the next container revision.

## Known Gaps

- Dollar figures in Peer Benchmarks and Cost & Value Signals tabs are hardcoded industry-corpus estimates, not calculated from tenant financial data. They are now labeled "illustrative" but will be replaced with Tower-integrated actuals once the financial data lane is wired.
- Starter prompts are tuned for two tenant archetypes (Lakeshore / SkyHarbor). Other tenants receive the non-airline default. Full per-tenant customization deferred.

## Deployment Authority

This release deploys through the repo-owned ACA main deploy workflow (`aca-main-deploy.yml`). No ad-hoc `az acr build` or `az containerapp update` commands are issued outside the workflow.

## Audit Evidence

- PR: https://github.com/abarva-platform/abarva/pull/4518
- 25Q audit proof: `proof/intelligence-surface-25q-audit-2026-07-07T05-33-14-057Z/`
- Local release check: all 4 gates passed (Azure deployment lane, Release Control, Deploy Authority, Pilot Data Loader)
