# 2026-07-01-industrial-cio-backoffice-readiness — Industrial CIO Back-Office Readiness

## Release ID

`2026-07-01-industrial-cio-backoffice-readiness`

## Status

`candidate`

## Plain-English Summary

This release wires a focused Industrial Demo / Morgan Street CIO readiness layer into Intelligence. aVa can now answer Shared Services, Treasury, Finance, HR, Legal, process transformation, AI enablement, and Value Office questions with a senior-advisor point of view grounded in the existing Industrial V6 substrate.

The change does not generate a new synthetic tenant. It curates the existing Industrial Demo evidence into a CIO-ready back-office decision packet, uses Treasury and Finance as the first proof domains, and keeps HR/Legal behind explicit evidence and client-signoff boundaries.

## Layer Impact

- `global-control-lane`: Adds Intelligence runtime wiring and tests for a tenant-scoped advisory source. The hook is gated by Industrial/Lakeshore/Morgan tenant aliases and relevant back-office question terms.
- `client-data-lane`: Reads existing `datasets/lakeshore-industries-synthetic-v6` files locally for deterministic packet/proof generation. No schema, migration, loader, or live database mutation is included.
- `public-demo`: Improves the Industrial Demo story for a CIO/VP Innovation audience by aligning aVa answers to the Morgan Street Value Office deck.

## Client Applicability

- All clients: No.
- Specific clients: Industrial Demo / Lakeshore aliases only when the question matches back-office, Shared Services, Treasury, Finance, HR, Legal, AI enablement, automation, or Value Office terms.
- Internal only: No.
- Public/demo only: Yes, this is a demo-readiness runtime proof layer.
- Feature flag: Existing Intelligence Claude synthesis controls still apply.

## Changes Included

- `src/lib/intelligence/industrial-cio-backoffice-readiness.ts`
- `src/lib/intelligence/ask/industrial-cio-backoffice-source.ts`
- `src/lib/intelligence/ask/index.ts`
- `src/lib/intelligence/__tests__/industrial-cio-backoffice-readiness.test.ts`
- `src/lib/intelligence/ask/__tests__/industrial-cio-backoffice-source.test.ts`
- `scripts/intelligence/prove-industrial-cio-backoffice-readiness.ts`
- `docs/intelligence-v6/INDUSTRIAL_CIO_BACKOFFICE_DEMO_PACKAGE_2026-07-01.md`

This branch also carries forward the SkyHarbor CTO readiness commit so an Industrial deploy does not regress the airline CTO demo that is currently live.

## QA / Validation

Planned before release:

- Focused Jest coverage for the Industrial packet and ask-source hook.
- Deterministic proof run for 15 Morgan Street CIO questions, capturing final prompt, raw response, rendered response, branch buttons, and score.
- Existing SkyHarbor CTO focused tests to confirm no regression after carrying forward the airline demo commit.
- Production ACA deploy and signed-in browser proof only after local tests pass.

## Rollout Plan

Merge to `main`, build an image from the exact git SHA with ACR, deploy through Azure Container Apps, wait for the new revision to become healthy, assign 100% ingress traffic, then verify `https://app.abarva.ai/intelligence` signed in as Industrial Demo/Lakeshore and SkyHarbor.

## Deployment Authority

- Repo-owned deploy workflow: ACA main/lab deploy lane.
- Shared runtime mutators: Azure Container Apps image/revision/traffic only.
- Approved image digest: To be captured after ACR build.
- ACA runtime invariant: `ca-abarva-web-lab-eastus` must point 100% traffic at the tested revision before claiming production-live.
- Worker image invariant: Not applicable.
- Feature/env flag update path: No env flag change expected.
- Live signed-in proof required: Yes.

## Rollback Plan

Reassign ACA ingress traffic to the previous healthy revision or redeploy the previous known-good image digest. Because this change has no schema or data-plane migration, rollback is runtime-only.

## Audit Evidence

To be added after validation:

- Focused Jest output.
- Industrial proof bundle under `proof/industrial-cio-backoffice-readiness`.
- ACA revision, image digest, traffic state.
- Signed-in browser proof for Industrial Demo and SkyHarbor no-regression.

## Known Gaps

- HR and Legal remain discovery branches until stronger source evidence is loaded or client-provided values are entered.
- The local deterministic proof validates packet and branch contract; it is not a live Claude/browser proof until deployed and crawled.
