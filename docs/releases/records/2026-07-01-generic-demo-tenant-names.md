# 2026-07-01-generic-demo-tenant-names — Generic Demo Tenant Names

## Release ID

`2026-07-01-generic-demo-tenant-names`

## Status

`candidate`

## Plain-English Summary

This release changes user-visible demo tenant labels from named composite companies to generic industry demo names. The app can still recognize legacy tenant names and internal keys for routing, data lookup, and tenant isolation, but product chrome and sanitized generated text now resolve to generic labels such as Retail Demo, Airline Demo, Industrial Demo, Healthcare Demo, and Financial Services Demo.

## Layer Impact

- `global-control-lane`: Updates shared client display-name canonicalization and demo-safe text scrubbing used by navigation, agent windows, Home, Intelligence, Source, Moves, Programs, and Tower-adjacent display helpers.
- `public-demo`: Reduces legal/demo naming risk by avoiding named composite-company labels in user-visible demo surfaces.

## Client Applicability

- All clients: The shared display-name sanitizer and canonical client option registry are updated.
- Specific clients: Apex/Retail, Meridian/Healthcare, Arcturus/Financial Services, SkyHarbor/Airline, Lakeshore/Industrial, and Northstar/Clinical Technology demo tenants.
- Internal only: No.
- Public/demo only: Yes, this is a demo-display safety change. Internal tenant keys and data aliases remain intact.
- Feature flag: None.

## Changes Included

- `src/lib/client-config.ts`: Changes demo-safe display names to generic demo names while preserving old tenant names as aliases.
- `src/components/intelligence/IntelligenceIndexPage.tsx`: Uses canonical generic display names for Intelligence fallback chrome.
- `src/components/source/canvas/UniversalCanvasShell.tsx`: Normalizes SkyHarbor Source demo event display to Airline Demo.
- `src/lib/source/exports/payloads/decision-brief-payload.ts`: Updates decision brief display text and forbidden-pattern checks so the export uses Airline Demo instead of SkyHarbor.
- `src/lib/cio-tower/metric-packet.ts`: Updates Tower metric packet tenant display map to generic demo names.
- `src/lib/programs/programs-page-view.ts` and `src/lib/programs/deliverables/board-deliverable.ts`: Uses generic demo names for program and deliverable display helpers.
- Focused tests updated for the generic display-name contract.

## QA / Validation

- `npx jest src/lib/__tests__/client-config-canonical.test.ts src/lib/auth/__tests__/tenant-isolation-probes.test.ts src/lib/programs/__tests__/clientname-tenant-resolution.test.ts src/lib/source/exports/__tests__/rfp-vendor-package.test.ts src/lib/cio-tower/__tests__/metric-packet.test.ts src/lib/home/know/__tests__/v6-home-know-response.test.ts --runInBand` — passed, 86 tests.

## Rollout Plan

Merge to `main`, deploy through the repo-owned Azure Container Apps main deploy workflow, then run signed-in browser/API proof against `https://app.abarva.ai` for Airline Demo and Industrial Demo.

## Deployment Authority

- Repo-owned deploy workflow: ACA main deploy workflow on `main`.
- Shared runtime mutators: None outside the normal ACA image deploy path.
- Approved image digest: To be captured by deploy evidence.
- ACA runtime invariant: Required after deploy.
- Worker image invariant: Not materially affected, but worker image alignment is covered by the ACA deploy workflow.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes.

## Rollback Plan

Revert the PR and redeploy the previous known-good ACA image. Because this is a display-name/canonicalization change only, rollback does not require database migration rollback.

## Audit Evidence

- PR URL: To be added after PR creation.
- CI/focused tests: Listed above.
- Deploy evidence: To be captured after merge/deploy.
- Signed-in smoke evidence: To be captured after deploy.

## Known Gaps

This release does not rename the underlying datasets, tenant keys, file paths, or private source facts. It changes user-visible product display and demo-safe generated text behavior.
