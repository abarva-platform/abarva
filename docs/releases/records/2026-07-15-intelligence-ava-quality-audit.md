# 2026-07-15-intelligence-ava-quality-audit — Intelligence aVa Data-Layer Quality Audit

## Release ID

`2026-07-15-intelligence-ava-quality-audit`

## Status

`candidate`

## Plain-English Summary

Adds a reproducible audit for Intelligence/aVa answer readiness against the Nexus data-layer/context-pack architecture. The audit proves deterministic IntelligenceContextPack assembly for Meridian Health questions and explicitly marks live Claude answer quality and signed-in browser rendering proof as blocked unless those runtime paths are executed.

## Layer Impact

- `global-control-lane`: adds an audit script and report artifacts only.
- `public-demo`: creates a Meridian/Healthcare Demo proof pack for context-path and semantic guardrail review.
- `client-data-lane`: no tenant data is rebuilt, promoted, or mutated.

## Client Applicability

- All clients: no runtime behavior change.
- Specific clients: Meridian Health / Healthcare Demo proof artifacts.
- Internal only: audit script and generated reports.
- Public/demo only: report can support demo-readiness review.
- Feature flag: none.

## Changes Included

- Adds `npm run audit:intelligence-ava-quality`.
- Adds `scripts/audit/build-intelligence-ava-quality-audit.ts`.
- Adds reports under `reports/intelligence-ava-quality/`.
- Records context-path proof, answer-claim grounding, executive quality scores, rendering status, Meridian semantic compliance, context packs, Claude prompt payloads, blocked Claude responses, and browser-proof blockers.
- Records the existing structured visual rendering contract: Claude/aVa may emit source-backed table/chart/graph intent through `AvaAnswerPacket`; approved app renderers own the actual visual rendering.

## QA / Validation

- Pass: `npm run audit:intelligence-ava-quality`
- Pass: artifact-level Playwright layout QA for `reports/intelligence-ava-quality/intelligence-ava-quality-proof.html` at desktop and narrow viewports.
- Pass: no artifact body overflow, no text/container overflow, no visible raw debug JSON in the proof report.
- Pending/blocked by design: live Claude/aVa answer quality proof.
- Pending/blocked by design: signed-in Meridian Intelligence browser proof.

## Rollout Plan

No runtime rollout. Merge to make the audit command and proof artifacts available in the repository.

## Deployment Authority

- Repo-owned deploy workflow: not applicable.
- Shared runtime mutators: none.
- Approved image digest: not applicable.
- ACA runtime invariant: not applicable.
- Worker image invariant: not applicable.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: yes before claiming live Intelligence answer quality; not included in this audit PR.

## Rollback Plan

Revert the PR to remove the audit script, npm command, release record, and generated proof artifacts.

## Audit Evidence

- `reports/intelligence-ava-quality/summary.md`
- `reports/intelligence-ava-quality/summary.json`
- `reports/intelligence-ava-quality/context-path-proof.csv`
- `reports/intelligence-ava-quality/answer-claim-grounding.csv`
- `reports/intelligence-ava-quality/executive-quality-scores.csv`
- `reports/intelligence-ava-quality/rendering-quality.csv`
- `reports/intelligence-ava-quality/meridian-semantic-compliance.csv`
- `reports/intelligence-ava-quality/visual-rendering-contract.csv`
- `reports/intelligence-ava-quality/intelligence-ava-quality-proof.html`
- `reports/intelligence-ava-quality/browser-proof/BLOCKED.md`

## Known Gaps

- Live Claude/aVa responses were not generated.
- Signed-in Meridian Intelligence browser proof was not run.
- This audit proves deterministic context-pack assembly and semantic guardrails; it does not prove live answer rendering quality.
