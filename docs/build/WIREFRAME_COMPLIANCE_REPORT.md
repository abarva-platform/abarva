# WIRE2 - Wireframe Compliance Report

## Scope

This audit compares the active mounted implementations for the following routes against the current wireframe and blueprint authority stack:

- `/platform/admin`
- `/platform/admin/production-readiness`
- `/platform/admin/architecture`
- `/tenant/apex-retail/programs`
- `/tenant/apex-retail/programs/[programSlug]`
- `/source/events/[eventId]`
- `/tenant/apex-retail/intelligence`
- `/tenant/apex-retail/tower`

Authority files used:

- `docs/platform-design/experience-system/wireframes/10_admin_setup_steward_control_plane_wireframe.md`
- `docs/platform-design/experience-system/wireframes/03_program_detail_by_phase_wireframes.md`
- `docs/platform-design/experience-system/wireframes/05_source_event_by_stage_wireframes.md`
- `docs/platform-design/experience-system/wireframes/08_intelligence_sentinel_canvas_wireframe.md`
- `docs/platform-design/experience-system/wireframes/09_control_tower_atlas_brief_wireframe.md`
- `docs/platform-design/page-blueprints/ADMIN_SETUP_PAGE_BLUEPRINT.md`
- `docs/platform-design/page-blueprints/PRODUCTION_READINESS_PAGE_BLUEPRINT.md`
- `docs/platform-design/page-blueprints/ARCHITECTURE_PAGE_BLUEPRINT.md`
- `docs/platform-design/page-blueprints/PROGRAMS_PAGE_BLUEPRINT.md`
- `docs/platform-design/page-blueprints/PROGRAM_DETAIL_PAGE_BLUEPRINT.md`
- `docs/platform-design/page-blueprints/SOURCE_EVENT_PAGE_BLUEPRINT.md`
- `docs/platform-design/page-blueprints/INTELLIGENCE_PAGE_BLUEPRINT.md`
- `docs/platform-design/page-blueprints/CONTROL_TOWER_PAGE_BLUEPRINT.md`
- `docs/platform-design/experience-system/AGENT_CENTRIC_ENFORCEMENT_REVIEW.md`
- `docs/platform-design/experience-system/PAGE_WORKFLOW_ENFORCEMENT_RULES.md`

Note: `docs/platform-design/wireframes/WIREFRAME_INDEX.md` was not present on `main` during this audit. Route-specific wireframes and page blueprints were used directly.

## Safe fixes applied in this slice

- `/platform/admin` route title and setup language were aligned from generic `Admin Portal` wording to `Admin Setup` / `Setup Control Center`.
- `/platform/admin/architecture` workflow metadata was corrected so the primary agent is `Atlas`, matching the blueprint.
- `/source/events/[eventId]` now passes linked-program shell metadata into `SourceRouteShell`, so the route-level orientation strip can show the linked program code when available.

No major layout, data-model, or runtime-logic changes were made.

## Score Summary

| Route | Score | Status | Safe auto-fix applied |
| --- | ---: | --- | --- |
| `/platform/admin` | 78 | Partial | Yes |
| `/platform/admin/production-readiness` | 87 | Strong partial | No |
| `/platform/admin/architecture` | 80 | Partial | Yes |
| `/tenant/apex-retail/programs` | 74 | Partial | No |
| `/tenant/apex-retail/programs/[programSlug]` | 84 | Strong partial | No |
| `/source/events/[eventId]` | 82 | Strong partial | Yes |
| `/tenant/apex-retail/intelligence` | 61 | Material deviation | No |
| `/tenant/apex-retail/tower` | 68 | Material deviation | No |

## Page-by-page Findings

### `/platform/admin`

- Compliance score: `78`
- Sections passing:
  - Canonical warm shell is mounted through `AdminCanonShell`.
  - Steward is the correct anchor agent.
  - The default active view resolves to `StewardSetupControlCenter`, which already maps to the five-zone setup model.
  - Setup/readiness caveats are explicit and avoid fake live claims.
- Sections failing:
  - The route title and internal labeling previously emphasized a generic `Admin Portal` instead of `Admin Setup`.
  - The route still contains legacy sidebar branches, emoji-heavy nav items, and thin placeholder panes that do not match the fully specified admin control-plane contract.
  - Drawer behavior and richer object inspection remain mostly placeholder-level outside the control-center default view.
- Exact deviations:
  - `SIDEBAR_GROUPS` still uses emoji-based labels and mixed legacy sections.
  - Non-control-center views are mostly placeholder blocks rather than full admin workflow surfaces.
  - The five-question test is answered well only when the user stays on the default control-center path.
- Severity: `medium`
- Fix recommendation:
  - Keep the default route centered on Setup/Admin semantics.
  - In a later implementation wave, retire or restyle the legacy placeholder branches behind canonical setup panels.
- Safe to auto-fix: `yes` for naming/orientation; `no` for the broader side-nav/content-branch rewrite.
- Tests that exist:
  - `src/__tests__/integration/admin/admin-route-shell-control.test.ts`
  - `src/__tests__/integration/admin/admin-route-shell-enforcement.test.ts`
  - `src/__tests__/integration/admin/steward-setup-control-center.test.ts`
- Tests missing:
  - Route-level verification that default `/platform/admin` lands on the setup control-center narrative rather than a generic admin portal framing.
- Recommended next implementation slice:
  - `Admin setup branch cleanup and drawer compliance`

### `/platform/admin/production-readiness`

- Compliance score: `87`
- Sections passing:
  - Correct canonical shell through `AdminCanonShell`.
  - Steward is correctly primary, with a strong blocker-oriented page question.
  - The route presents deterministic caveats and avoids fake live monitoring claims.
  - Production blockers are surfaced prominently through the mounted readiness panels.
- Sections failing:
  - The blueprint expects explicit blocker-detail drawer behavior; current code composes rich panels but drawer verification is not obvious at the route contract level.
  - The surface is still tied to an unrelated repo build issue in `src/lib/admin/production-readiness.ts`, which affects deployability but not the wireframe contract itself.
- Exact deviations:
  - Drawer affordances are not enforced by route-level tests.
  - Full five-question visibility depends on the mounted child panels rather than the route shell alone.
- Severity: `low`
- Fix recommendation:
  - Add focused compliance tests for blocker-detail drilldown behavior when the underlying admin build issue is addressed.
- Safe to auto-fix: `no`
- Tests that exist:
  - `src/__tests__/integration/admin/production-readiness-tracker.test.ts`
  - `src/__tests__/integration/admin/production-readiness-live-refresh.test.ts`
  - `src/__tests__/integration/admin/admin-route-shell-control.test.ts`
- Tests missing:
  - Route-level compliance coverage for drawer behavior and the exact five-question contract.
- Recommended next implementation slice:
  - `Production readiness drawer and route-level contract verification`

### `/platform/admin/architecture`

- Compliance score: `80`
- Sections passing:
  - Canonical admin shell is mounted.
  - Architecture sections are present through `ArchitectureCanvas` and `ArchitectureOverviewPage`.
  - The route communicates deterministic caveats instead of implying telemetry.
- Sections failing:
  - The route previously labeled `Steward` as the primary agent, which contradicted the blueprint.
  - The route title emphasized `Architecture Overview` rather than the simpler `Architecture` naming used elsewhere in the spec stack.
  - The route still relies on page content rather than an explicit Atlas-oriented context strip for the full five-question contract.
- Exact deviations:
  - Primary agent metadata mismatch was present before this slice.
  - Drawer expectations for component/detail drilldowns are not enforced at the route level.
- Severity: `medium`
- Fix recommendation:
  - Keep Atlas as the route anchor and add later route-level tests for component-detail drilldowns.
- Safe to auto-fix: `yes`
- Tests that exist:
  - `src/__tests__/integration/admin/architecture-overview.test.ts`
  - `src/__tests__/integration/admin/architecture-canvas.test.ts`
  - `src/__tests__/integration/admin/admin-route-shell-control.test.ts`
- Tests missing:
  - Route-level compliance coverage for Atlas anchoring and five-question workflow messaging.
- Recommended next implementation slice:
  - `Architecture route compliance test hardening`

### `/tenant/apex-retail/programs`

- Compliance score: `74`
- Sections passing:
  - Route uses `ProgramCanonShell`.
  - Portfolio context strip, phase distribution, and deterministic Nexus-style portfolio guidance are present.
  - Honest low-data messaging exists in the implementation patterns and the route avoids fake live approvals.
- Sections failing:
  - The blueprint expects richer portfolio controls such as a clearer filter/action bar, linked source-event visibility per program card, and more explicit phase/gate/evidence emphasis above the fold.
  - The shell orientation strip is concise, but it does not fully render the five-question contract on its own.
  - Drawer behavior for expanded Nexus brief detail is deferred.
- Exact deviations:
  - Program cards do not yet surface the full linked-source/action/gate richness shown in the blueprint.
  - Phase and evidence context exists, but next-step guidance is more summary-driven than action-driven.
- Severity: `medium`
- Fix recommendation:
  - Add a canonical portfolio action/filter layer and linked Source event chip behavior at the card/header level.
- Safe to auto-fix: `no`
- Tests that exist:
  - `src/__tests__/integration/programs/program-route-shell-control.test.ts`
  - `src/__tests__/integration/programs/program-route-shell-enforcement.test.ts`
  - `src/__tests__/integration/programs/programs-canonical-surface.test.ts`
- Tests missing:
  - Compliance coverage for portfolio-level five-question answers and linked-source visibility on the list page.
- Recommended next implementation slice:
  - `Programs portfolio wireframe compliance layer`

### `/tenant/apex-retail/programs/[programSlug]`

- Compliance score: `84`
- Sections passing:
  - Route uses `ProgramCanonShell`.
  - The implementation already includes a strong phase journey, gate strip, Nexus editorial lead, deliverable surfaces, and mission guidance.
  - Honest fallback handling is explicit for missing approvals, evidence, and live workflow states.
- Sections failing:
  - The blueprint expects a more explicit `SourceEventChip` / linked-source drilldown in the hero strip.
  - Evidence/detail drawer behavior is still mostly deferred.
  - The five-question answers are distributed across multiple sections instead of being summarized above the fold.
- Exact deviations:
  - Cross-surface linkage exists in the system but is not yet surfaced as strongly as the wireframe calls for in the header context.
  - Workshop, evidence, and deliverable detail panels are strong, but not yet wrapped in the exact flagship header composition from the spec.
- Severity: `medium`
- Fix recommendation:
  - Promote linked-source context and evidence drilldown affordances in the upper detail region.
- Safe to auto-fix: `no`
- Tests that exist:
  - `src/__tests__/integration/programs/programs-canonical-surface.test.ts`
  - `src/__tests__/integration/programs/programs-phase-gate-status.test.ts`
  - `src/__tests__/integration/programs/source-event-chip.test.ts`
- Tests missing:
  - Route-level compliance assertions for header-linked source context and evidence drilldowns.
- Recommended next implementation slice:
  - `Program detail header and cross-surface compliance pass`

### `/source/events/[eventId]`

- Compliance score: `82`
- Sections passing:
  - Route uses `SourceRouteShell` and `SourceCanonShell`.
  - The event canvas is substantially aligned with the wireframe: journey tracker, stage gate panel, artifact strip, stage workspace, alert panel, and persistent Nexus rail are present.
  - Deterministic context disclosure is strong.
  - Linked program context exists in the commercial section and now also feeds the route shell strip when available.
- Sections failing:
  - The blueprint calls for consistent context-used strips, drawer affordances, and explicit `3 choices + custom` behavior across the entire route family; current implementation is still uneven.
  - The event route remains split between the main canvas and a secondary commercial section instead of a tighter single workbench composition.
  - Evidence-basis and risk-detail drawer behavior is not enforced end-to-end.
- Exact deviations:
  - Linked program context was previously absent from the route-level shell strip.
  - The commercial section still uses an older expandable/tabbed sub-surface pattern that does not yet fully match the page blueprint.
  - Some stage-specific agent guidance still lives in the rail rather than the lead workspace zone.
- Severity: `medium`
- Fix recommendation:
  - Keep the current shell alignment and follow with a focused workbench consolidation pass for commercial sections, drawers, and `3 choices + custom`.
- Safe to auto-fix: `yes` for shell metadata; `no` for larger workbench restructuring.
- Tests that exist:
  - `src/__tests__/integration/source/source-event-canvas-shell.test.ts`
  - `src/__tests__/integration/source/source-route-shell-control.test.ts`
  - `src/__tests__/integration/source/source-route-shell-enforcement.test.ts`
  - `src/__tests__/integration/source/source-authenticated-route-smoke.test.ts`
- Tests missing:
  - Route-level compliance tests for linked-program shell context, drawer expectations, and canonical choice/action patterns.
- Recommended next implementation slice:
  - `Source event canvas commercial workbench compliance pass`

### `/tenant/apex-retail/intelligence`

- Compliance score: `61`
- Sections passing:
  - `IntelligenceRouteShell` is mounted and uses the correct Sentinel framing.
  - The route avoids chat-first posture.
  - Deterministic caveat and low-context disclosure are explicit.
  - The surface includes strong evidence treatment and recommended-action sections inside active lenses.
- Sections failing:
  - The blueprint expects five lens modes: `Summary / Evidence / Programs / Actions / Signals`.
  - The current implementation exposes four tabs: `Overview / Patterns / Evidence / Signals`.
  - The route lacks an explicit Programs mode and Actions mode, and therefore misses part of the required workflow sequence.
  - Drawer behavior for evidence basis / Ask Sentinel remains implied rather than clearly enforced by the route surface.
- Exact deviations:
  - `src/lib/intelligence/intelligence-lens-tabs-view.ts` defines only four tabs.
  - The mounted route cannot answer the full page workflow contract around where patterns land in programs and which follow-up actions should be taken in their own dedicated modes.
- Severity: `high`
- Fix recommendation:
  - Add the missing `Programs` and `Actions` canvas modes before attempting visual polish.
- Safe to auto-fix: `no`
- Tests that exist:
  - `src/__tests__/integration/intelligence/intelligence-route-shell-wiring.test.ts`
  - `src/__tests__/integration/qa/intelligence-tower-shell-control.test.ts`
  - `src/__tests__/integration/qa/intelligence-tower-blueprint-verification.test.ts`
- Tests missing:
  - Compliance coverage asserting all five blueprint-required modes and the non-primary Ask Sentinel drawer behavior.
- Recommended next implementation slice:
  - `Intelligence five-mode wireframe compliance`

### `/tenant/apex-retail/tower`

- Compliance score: `68`
- Sections passing:
  - `TowerRouteShell` is mounted and uses Atlas-led orientation.
  - Deterministic caveat is explicit.
  - Scorecard and executive brief content exists in the tab system.
  - Ask-Atlas is not the primary affordance in the current route shell.
- Sections failing:
  - The blueprint expects six lens tabs: portfolio, adoption, value, risk, cost, and tech/data readiness.
  - The current implementation exposes four tabs: `Portfolio / Scorecards / Pressure / Executive Brief`.
  - Pressure cards are present, but the lens model is still narrower than the executive control-tower contract.
  - Cross-links to Admin Architecture / readiness are not surfaced as clearly as the blueprint expects.
- Exact deviations:
  - `src/lib/tower/tower-lens-tabs-view.ts` defines only four tabs.
  - The page does not yet express the full executive scorecard taxonomy from the blueprint.
- Severity: `high`
- Fix recommendation:
  - Expand the tower lens contract before any further visual refinement.
- Safe to auto-fix: `no`
- Tests that exist:
  - `src/__tests__/integration/tower/tower-route-shell-wiring.test.ts`
  - `src/__tests__/integration/qa/intelligence-tower-shell-control.test.ts`
  - `src/__tests__/integration/qa/intelligence-tower-blueprint-verification.test.ts`
- Tests missing:
  - Compliance coverage for the six-lens executive taxonomy and admin-architecture/readiness drilldowns.
- Recommended next implementation slice:
  - `Control Tower six-lens compliance foundation`

## Highest-priority gaps

### P0

- Intelligence route is missing blueprint-required `Programs` and `Actions` modes.
- Control Tower route is missing blueprint-required lens breadth for adoption, value, risk, cost, and tech/data readiness.

### P1

- Source event route still needs consistent context-used, drawer, and `3 choices + custom` behavior across the full workbench.
- Programs portfolio route needs more explicit linked-source, action, and gate emphasis.
- Admin route still carries legacy branch content beyond the canonical setup control-center default path.

### P2

- Architecture and Production Readiness need stronger route-level compliance tests for drilldowns/drawers.
- Program detail route needs stronger header-level linked-source and evidence drilldown alignment.

## What is already strong

- Canonical shells are mounted across Admin, Programs, Source, Intelligence, and Tower routes.
- The Source event page already has substantial deterministic workflow structure: journey, stage gates, artifacts, missions, and commercial context.
- Program detail is one of the strongest surfaces in the set, with a real journey, gate, deliverable, and mission composition.
- Production Readiness is already close to its blueprint and remains honest about readiness blockers.
- The system consistently avoids fake live model, upload, or approval claims on the audited routes.

## What not to build yet

- No model calls
- No chat UI
- No upload/parsing runtime
- No approval engine
- No workflow engine
- No full artifact drawer behavior unless planned in a dedicated slice
- No final vendor selection automation

## Recommended next 5 implementation slices

### 1. Source Events Portfolio route/page

- Purpose: bring `/source/events` up to the wireframe contract before more event-detail polish.
- Allowed files:
  - `src/app/(maestro)/source/events/page.tsx`
  - `src/components/source/*portfolio*`
  - `src/components/source/SourceRouteShell.tsx`
  - focused Source integration tests
- Forbidden files:
  - `src/lib/source/*model*`
  - upload/parsing runtime
  - auth/runtime APIs
- Tests:
  - focused Source route shell + portfolio tests
  - `npx tsc --noEmit --pretty false`
  - scoped eslint
  - `npm run build -- --webpack`
- Acceptance criteria:
  - portfolio zones, filter/action layer, context-used, and Nexus guidance align with the route wireframe
- Readiness impact:
  - improves design/workflow compliance only; no production readiness promotion

### 2. Scorecard Governance shell

- Purpose: bring `/source/events/[eventId]/scorecard` to its governance workspace contract.
- Allowed files:
  - scorecard route/page
  - `src/components/source/ScorecardGovernancePanel.tsx`
  - focused tests
- Forbidden files:
  - new approval engine
  - vendor decision automation
- Tests:
  - scorecard governance route coverage
  - tsc, scoped eslint, build
- Acceptance criteria:
  - governed criteria, rationale, evidence parity, and blocker messaging are visible
- Readiness impact:
  - deterministic UX compliance only

### 3. Artifact Detail shell

- Purpose: align `/source/events/[eventId]/artifacts/[artifactId]` with the artifact review wireframe.
- Allowed files:
  - artifact detail route
  - artifact detail shell/component
  - focused tests
- Forbidden files:
  - real upload/parsing runtime
  - export/import flows
- Tests:
  - artifact detail integration coverage
  - tsc, scoped eslint, build
- Acceptance criteria:
  - artifact context, evidence, review posture, and honest caveats are present
- Readiness impact:
  - design/workflow compliance only

### 4. Source Value Ledger shell

- Purpose: align `/source/value` with the Atlas-led value ledger wireframe.
- Allowed files:
  - `/source/value` route
  - `src/components/source/SourceValueLedger.tsx`
  - focused tests
- Forbidden files:
  - live savings claims
  - persistence/runtime automation
- Tests:
  - value ledger route coverage
  - tsc, scoped eslint, build
- Acceptance criteria:
  - value assumptions, evidence posture, and executive cautions are explicit
- Readiness impact:
  - design/workflow compliance only

### 5. Context-used / 3 choices enforcement across Source pages

- Purpose: standardize context-first agent behavior across the Source route family.
- Allowed files:
  - Source route shells and stage workspace components
  - Source route compliance tests
  - agent-centric Source review packet
- Forbidden files:
  - model calls
  - workflow/approval engine
- Tests:
  - Source route shell enforcement
  - event canvas shell coverage
  - scoped eslint, tsc, build
- Acceptance criteria:
  - context-used, blocker, confidence, next action, and `3 choices + custom` appear where specified
- Readiness impact:
  - raises UX/workflow confidence only

## Next recommended wave

`WIRE3 - Intelligence + Control Tower compliance foundation`

Reason:

- the two highest-severity deviations are both on the intelligence surfaces
- they are structural but still bounded UI/UX compliance work
- fixing them will unblock later visual QA from judging the right surface contract
