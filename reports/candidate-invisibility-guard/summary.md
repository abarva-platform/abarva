# Candidate Invisibility Guard

Status: FAIL

Generated: 2026-09-18T17:54:50.197Z

## Result

- Default Home/Knowledge/module runtime reads must use `intelligence_v7.active_tenant_contract_versions`.
- Candidate rows are visible only through explicit candidate preview.
- Candidate preview labels required: Candidate preview; Not active tenant truth; Not used by default module runtime.
- Azure/Postgres mutation: none.
- Tenant promotion: none.

## Failures

- default-home-route-no-preview-unless-flagged: src/app/(maestro)/home/page.tsx

## Checks with no live subject

A vacuous check reads as protection and tests nothing. Counted as a failure.

- default-active-pointer-home-browser: src/lib/home/v7-context-browser.ts — the file this check guards no longer exists, so the check has no subject
- candidate-preview-labels-visible: src/components/home/HomeSurface.tsx — no route mounts this component, so a pass says nothing about what a user can see
- home-know-active-pointer: src/lib/home/know/v7-home-ask.ts — the file this check guards no longer exists, so the check has no subject
- intelligence-dossier-active-pointer: src/lib/intelligence/ask/retrievers/v7-dossier.ts — the file this check guards no longer exists, so the check has no subject
- tower-projection-active-pointer: src/lib/tower/v7-tower-projection.ts — the file this check guards no longer exists, so the check has no subject
