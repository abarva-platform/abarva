# Home Canvas Preview

## Release ID

`2026-10-11-home-canvas-preview`

## Status

`candidate` - local implementation; not merged or deployed.

## Release Lane

`experimental` - authenticated, opt-in route. No default Home cutover.

Includes a `global-control-lane` correction to the shared current-state flow display contract. If this candidate is later published, existing consumers of that resolver also receive the corrected zone order, landing checks and display-density enforcement.

## Plain-English Summary

Adds a separate Home canvas with individual chapter, evidence and reading views. The existing Home remains the default. The preview reads the same governed bundle and retains the existing shared advisor design, transport and record-version checks.

## Layer Impact

`experimental` lane; Layer 4, Products: presentation and navigation only. No intake, source adapter, canonical schema, ingestion, narrative generation or stored-data changes. Existing deterministic table and finding rules are reused. Architecture remains behind the shared admission resolver.

The shared flow contract now consumes the governed taxonomy's zone order instead of an obsolete parallel vocabulary. Warehouse/mart role and landing checks use the same vocabulary. Flow admission aggregates traceable members to its existing audience/format budget and refuses a slice that still exceeds it. Convergence requirements are unchanged.

## Client Applicability

- All clients: no default change.
- Specific clients: only the existing synthetic Home preview allowlist, using its existing registry validation and tenant resolution.
- Internal only: no new administrative capability.
- Public/demo only: no new unauthenticated product route.
- Feature flag: separate `/home/canvas` route; existing `/home` remains unchanged.

## Changes Included

- Authenticated `/home/canvas`, with URL-backed views and browser history.
- Eight chapter overviews, selectable deterministic exhibits, complete published reading and evidence inspection.
- Architecture, data flow, context/module overview, fact browsing and all supplied evidence-family views.
- Preview-only compact modes in the existing record/fact browsers; all rows accessible through pagination.
- Existing shared Home advisor, logo and dock reused without modifying their design.
- Exact record-source labels, visible fallback, older interpretation quarantine and version-bound existing walkthrough PDF link.
- Viewport-bounded chrome applies only to the new route.
- Generated route manual includes the optional preview route.
- Theme-led leadership presentation with exact selected excerpts, minority-theme ordering and explicit response/synthetic basis. Earlier excerpts are not substituted for unverified current interviews.
- Operating segments use only declared segment keys for function links. System-owner groupings remain distinct from segment or P&L attribution; detail not supplied in a bundle is not asserted absent from the enterprise.
- Additional subject-aligned compiled context is inspectable in each chapter without generating a new narrative.
- Admitted flow diagrams offer exact movement records; legitimately refused diagrams retain an inspectable movement view without inventing platform hops.

## QA / Validation

- Focused model/component tests cover query routing, source selection, absent versus zero, row counts, fallback labels, advisor/export version binding, stale-narrative quarantine and complete pagination.
- Canvas, existing Home v4, fact-browser, advisor record-parity, chrome and shared visual regressions: 61 suites / 785 tests passed, plus two SVG snapshots.
- Full repository TypeScript check passed using Node 24 with an 8 GB heap.
- ESLint: no errors; pre-existing record-browser memo and flow unused-type warnings remain.
- Release controls: all 11 gates passed; generated route manual is current.
- Local browser review: actual React components with a reviewed synthetic fixture and a local navigation adapter; 80 desktop/mobile page-panel cases passed. Screenshots, Back/Forward and floating-advisor clearance checks captured locally.
- Content/interaction review: 30 desktop/mobile cases passed for complete chapter-context access, exact excerpt selection, minority themes, all operating-segment choices, admitted diagrams, movement inspection and traversal of every supplied record-browser row.
- Positive and negative flow tests prove warehouse/mart landing, consumption, convergence, zone-order consistency and audience-density enforcement. The one-to-one refusal test now supplies its own explicit opaque distribution instead of relying on a reviewed fixture whose topology changed.
- Local Next.js server retains Clerk authentication. Its automated sign-in guard prevents signed-in runtime proof in this environment. The fixture UI preview is not a production or live-data proof.
- Existing PDF endpoint is reused; neither PDF redesign nor a new advisor quality claim is included.

## Rollout Plan

Review the local preview and PR first. Any later merge uses the protected-main PR path. Only the repo-owned ACA main deploy workflow may publish this route. Publishing the opt-in route does not flip the default. Default cutover and legacy retirement require a separate decision after signed-in runtime and content-parity proof.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` only.
- Shared runtime mutators: none in this change.
- Approved image digest: none created in this local candidate.
- ACA runtime invariant: required if subsequently deployed.
- Worker image invariant: unchanged; verify through the approved release workflow.
- Feature/env flag update path: none.
- Live signed-in proof required: preview allowlist, every page/panel, record-source coherence, advisor context and existing PDF binding before cutover.

## Rollback Plan

The default remains the existing `/home`, which is also linked from the preview. If the optional route is later published and must be removed, revert this presentation release through a PR and the approved workflow. No data rollback is required.

## Audit Evidence

- PR diff and model/component regression results.
- Local page-panel screenshots and UI verification report.
- Signed-in deploy/read-model/answer/export evidence remains a separate, outstanding release layer.

## Known Gaps

- No production deployment or signed-in proof in this candidate.
- Missing families and unsupported architecture remain explicit gaps, not fabricated visuals.
- Business revenue composition renders only complete source-linked structured percentages or an exact declared split in an aligned reviewed packet; no inferred segment dollars.
- Detailed organization/program/risk/metric/interview coverage in a compiled manifest does not establish that those record families are supplied to the rendered bundle. Current source/readback proof is still required.
- An existing published operating narrative may remain off-purpose; it is retained with an explicit note in Full reading. Correcting published narrative requires the governed regeneration gate and is not included.
- The existing walkthrough export is version-bound but does not adopt the new canvas layout in this release.
- No default Home flip or legacy sunset.
