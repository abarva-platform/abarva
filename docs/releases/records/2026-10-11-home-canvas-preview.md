# Home Canvas Cutover

## Release ID

`2026-10-11-home-canvas-preview`

## Status

`candidate` - default presentation cutover authorized; merge, deployment and signed-in proof pending.

## Release Lane

`global-control-lane` - authenticated Home presentation and navigation.

Includes corrections to the shared current-state flow display contract and Home field preservation. Existing consumers receive the corrected flow zone order, landing checks and display-density enforcement; Home readers retain recorded segment notes and string-list capabilities.

## Plain-English Summary

Makes the reviewed Home canvas the default at `/home`, with individual chapter, evidence and reading views. The scrolling presentation is no longer mounted by a product or review route. The canvas reads the same governed bundle and retains the existing shared advisor design, transport and record-version checks. `/home/canvas` redirects to the canonical route, retaining query parameters; valid old chapter/map/family bookmarks migrate to canonical view URLs.

## Layer Impact

`global-control-lane`; Layer 4, Products: presentation and navigation, with existing reader field preservation. No intake, source adapter, canonical schema, ingestion, narrative generation or stored-data changes. Existing deterministic table and finding rules are reused. Architecture remains behind the shared admission resolver. Local-only candidate intake remains outside the product runtime.

The shared flow contract now consumes the governed taxonomy's zone order instead of an obsolete parallel vocabulary. Warehouse/mart role and landing checks use the same vocabulary. Flow admission aggregates traceable members to its existing audience/format budget and refuses a slice that still exceeds it. Convergence requirements are unchanged.

## Client Applicability

- All clients: shared Home presentation changes for the existing enrolled synthetic allowlist; other module layouts are unchanged.
- Specific clients: only the existing synthetic Home preview allowlist, using its existing registry validation and tenant resolution.
- Internal only: no new administrative capability.
- Public/demo only: no new unauthenticated product route.
- Feature flag: none. Canonical `/home` uses the canvas; the gated operator review retains its existing authorization and explicit diagnostics controls.

## Changes Included

- Authenticated `/home`, with URL-backed views and browser history. Preview-only labels and the old-Home link are removed.
- Eight chapter overviews, selectable deterministic exhibits, complete published reading and evidence inspection.
- Architecture, data flow, context/module overview, fact browsing and all supplied evidence-family views.
- Opt-in compact modes in the existing record/fact browsers; all rows accessible through pagination.
- Existing shared Home advisor, logo and dock reused without modifying their design.
- Exact record-source labels, visible fallback, older interpretation quarantine and version-bound existing walkthrough PDF link.
- Viewport-bounded chrome applies to canonical Home and its gated review route, not other modules.
- Route surface controls require the canvas and refuse a return to the scrolling root. Retired rendering components, dead exports, their presentation-only tests and obsolete proof scripts are removed; shared deterministic evidence and export helpers remain.
- Generated route manual remains current.
- Theme-led leadership presentation with exact selected excerpts, minority-theme ordering and explicit response/synthetic basis. Earlier excerpts are not substituted for unverified current interviews.
- Operating segments use only declared segment keys for function links. System-owner groupings remain distinct from segment or P&L attribution; detail not supplied in a bundle is not asserted absent from the enterprise.
- Operating detail renders recorded descriptions, accountable roles, governance, regulation and function capabilities. An absent detail set produces one coverage notice, not a repeated empty form. Functions are paged in compact groups, with exact source inspection.
- The existing Home reader preserves segment notes and canonical string-list capabilities. Empty family registration alone is not counted as a supplied segment mapping.
- Additional subject-aligned compiled context is inspectable in each chapter without generating a new narrative.
- Admitted flow diagrams offer exact movement records; legitimately refused diagrams retain an inspectable movement view without inventing platform hops.

## QA / Validation

- Focused model/component tests cover query routing, source selection, absent versus zero, row counts, fallback labels, advisor/export version binding, stale-narrative quarantine and complete pagination.
- Canvas, shared Home evidence, fact-browser, advisor record-parity, shared visual, ECL projection-reader, enterprise-context and export regressions: 43 suites / 569 tests passed, plus two SVG snapshots. Retired presentation-only suites are removed with their renderers; tenant identity and raw evidence-key disclosure checks now exercise the canvas. Five local route/cutover/boundary suites add 22 passing tests, including query-preserving redirects and no mounted retired root. The copy hygiene sweep renders the canonical canvas for every available view/panel and governed snapshot. The three behavioral route suites run in the existing PR unit workflow; the two declared source-text scanner suites retain their operator-only classification. The coverage census is refreshed without scanner exemptions.
- Route reachability passes with no new baseline exemptions. The baseline shrinks by two retired components and six retired exports. Dependency, library-orphan, AI surface-control and QA inventory audits pass.
- Full repository TypeScript check passed using Node 24 with an 8 GB heap.
- ESLint: no errors; pre-existing record-browser memo and flow unused-type warnings remain.
- Release controls: all 11 gates passed; generated route manual is current.
- Local browser review: actual React components with a reviewed synthetic fixture and a local navigation adapter; 80 desktop/mobile page-panel cases passed. Screenshots, Back/Forward and floating-advisor clearance checks captured locally.
- Content/interaction review: 30 desktop/mobile cases passed for complete chapter-context access, exact excerpt selection, minority themes, all operating-segment choices, admitted diagrams, movement inspection and traversal of every supplied record-browser row.
- Positive and negative flow tests prove warehouse/mart landing, consumption, convergence, zone-order consistency and audience-density enforcement. The one-to-one refusal test now supplies its own explicit opaque distribution instead of relying on a reviewed fixture whose topology changed.
- Local Next.js server retains Clerk authentication. Its automated sign-in guard prevents signed-in runtime proof in this environment. The fixture UI preview is not a production or live-data proof.
- Existing PDF endpoint is reused; neither PDF redesign nor a new advisor quality claim is included.
- Follow-up operating-context review: 15 local browser cases across three viewport widths check all segment fields, complete declared function traversal, candidate source/version visibility and the reviewed-record gap. Candidate source details are a separate local-only adapter dry run, not substituted into the reviewed bundle or runtime route.

## Rollout Plan

The reviewed design has explicit operator authorization for default cutover and retirement. Validate the current PR head, squash merge through the protected-main PR path, then publish only through the repo-owned ACA main deploy workflow. Prove the runtime digest invariant and signed-in canonical navigation, source label, source binding, map behavior and second-tenant identity. This UI authorization does not approve candidate intake acceptance or publication.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` only.
- Shared runtime mutators: none in this change.
- Approved image digest: none created in this local candidate.
- ACA runtime invariant: required if subsequently deployed.
- Worker image invariant: unchanged; verify through the approved release workflow.
- Feature/env flag update path: none.
- Live signed-in proof required: enrolled allowlist, canonical page/panel navigation, record-source coherence, advisor presence and existing PDF binding after deployment.

## Rollback Plan

Revert the cutover/presentation release through a PR and the approved main ACA workflow. No runtime legacy switch or alternate scrolling Home remains reachable. Git history preserves the former presentation; shared reader data is unchanged and no data rollback is required.

## Audit Evidence

- PR diff and model/component regression results.
- Local page-panel screenshots and UI verification report.
- Signed-in deploy/read-model/answer/export evidence remains a separate, outstanding release layer.

## Known Gaps

- No production deployment or signed-in proof in this candidate.
- Missing families and unsupported architecture remain explicit gaps, not fabricated visuals.
- Business revenue composition renders only complete source-linked structured percentages or an exact declared split in an aligned reviewed packet; no inferred segment dollars.
- Detailed organization/program/risk/metric/interview coverage in a compiled manifest does not establish that those record families are supplied to the rendered bundle. Current source/readback proof is still required.
- Richer operating intake may exist locally without accepted serving rows. The product route does not import that raw intake. Source acceptance, financial-basis reconciliation, declared-link validation and coherent publication remain a separately governed data-plane gate.
- An existing published operating narrative may remain off-purpose; it is retained with an explicit note in Full reading. Correcting published narrative requires the governed regeneration gate and is not included.
- The existing walkthrough export is version-bound but does not adopt the new canvas layout in this release.
- Retirement deletes the old rendering implementation, not shared deterministic evidence or export helpers. Existing stored-record fallback remains visibly labelled.
