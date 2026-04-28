# AGENTUI1 - Program Nexus Workbench Anchor

## Purpose

AGENTUI1 adds a visible Nexus workbench anchor to the Program detail page so the page feels like an agent-led operating surface rather than a collection of program cards and deterministic panels.

## Route Impacted

- `/tenant/apex-retail/programs/[programSlug]`
- Active implementation path: `src/app/(maestro)/tenant/[tenantSlug]/programs/[programSlug]/page.tsx` renders `ProgramCanonicalDetail`, so AGENTUI1 mounts the workbench in `ProgramCanonicalDetail`.
- Reference shell path: `ProgramFlagshipPage` also mounts the same workbench so future flagship usage inherits the same pattern.

## Design Sources Read

- `docs/platform-design/page-blueprints/PROGRAM_DETAIL_PAGE_BLUEPRINT.md`
- `docs/platform-design/experience-system/AGENT_CENTRIC_ENFORCEMENT_REVIEW.md`
- `docs/platform-design/experience-system/PAGE_WORKFLOW_ENFORCEMENT_RULES.md`
- `node_modules/next/dist/docs/01-app/01-getting-started/05-server-and-client-components.md`
- `node_modules/next/dist/docs/01-app/03-api-reference/01-directives/use-client.md`

The requested `docs/platform-design/wireframes/programs/PROGRAM_DETAIL_WIREFRAME.md` file was not present on current `origin/main`, so this slice followed the Program Detail page blueprint and agent-centric enforcement docs as the available canonical sources.

## What Changed

- Added `src/lib/programs/nexus-program-workbench-view.ts`.
- Added `src/components/programs/NexusProgramWorkbench.tsx`.
- Mounted `NexusProgramWorkbench` above the fold in `src/components/programs/ProgramCanonicalDetail.tsx`.
- Mounted `NexusProgramWorkbench` in `src/components/programs/ProgramFlagshipPage.tsx`.
- Added `src/__tests__/integration/programs/nexus-program-workbench.test.ts`.

## Workbench Contract

The workbench shows:

- current program
- current phase
- current gate state
- current workflow stage
- context used
- confidence/evidence state
- blocker or missing input
- recommended next action
- three contextual suggested actions
- custom ask affordance
- deterministic/live caveat
- Nexus, Steward, Sentinel, and Atlas handoff summary

## Suggested Actions

The Apex Retail example actions are:

- Review Design gate blockers
- Open Workshop 5 outcomes
- Inspect deliverable evidence
- Ask Nexus a custom question through the scoped disabled/deferred input affordance

## Deferred

- No model call.
- No live chat.
- No persistence.
- No approval workflow.
- No fake evidence.
- No business logic change.
- No runtime submission behavior.

## Production Readiness Impact

No production readiness promotion. This is a deterministic UI anchor that improves agent-centric clarity and page compliance. It does not make Program data live, approval-ready, or model-backed.

## Validation

Planned validation:

- `npx tsc --noEmit --pretty false`
- `npx jest src/__tests__/integration/programs/nexus-program-workbench.test.ts`
- `npx eslint --max-warnings=0 src/components/programs/NexusProgramWorkbench.tsx src/components/programs/ProgramCanonicalDetail.tsx src/components/programs/ProgramFlagshipPage.tsx src/lib/programs/nexus-program-workbench-view.ts src/__tests__/integration/programs/nexus-program-workbench.test.ts`
- `npm run build`
- `bash scripts/integration/hygiene_gate.sh --skip-build`
- `git diff --check`
