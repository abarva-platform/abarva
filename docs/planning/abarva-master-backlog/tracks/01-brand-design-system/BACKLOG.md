# Track 01 - Brand and Design System

## BRAND1 - Canonical name-only AbarVa wordmark

**Priority:** P0
**Status:** done
**Type:** feature
**Primary agent:** Steward

### Current state
Merged on `main` through PR `#385`.

### Outcome
- Canonical `AbarVaLogo` component exists.
- Name-only wordmark replaced prior symbol usage in active brand surfaces.

## VIS2 - Authenticated visual QA pass

**Priority:** P0
**Status:** pending
**Type:** docs
**Primary agent:** Atlas

### Purpose
Record the authenticated route-by-route visual QA pass for the highest-value product surfaces before more screenshot polish or route-level visual claims are made.

### Expected files
- `docs/planning/abarva-master-backlog/AUTHENTICATED_VISUAL_QA_PASS.md`

### Review scope
- `/source`
- `/source/events/evt-source-data-ai-si-selection`
- `/platform/admin/experience-gallery`
- `/platform/admin/production-readiness`

### Validation
- `git diff --check`
- `python3 -m json.tool docs/planning/abarva-master-backlog/backlog-registry.json`
- `rg -n "TODO|TBD|coming soon|placeholder" docs/planning/abarva-master-backlog/AUTHENTICATED_VISUAL_QA_PASS.md || true`

### Acceptance criteria
- Records pass/fail/deferred findings by route.
- Confirms wordmark, shell, and route-level design canon posture where visible.
- Separates visual polish findings from runtime/product blockers.
- Does not claim production readiness or live workflow behavior.

## VIS4 - Design compliance CI/checklist enforcement

**Priority:** P1
**Status:** blocked
**Type:** qa
**Primary agent:** Steward

### Block reason
This slice still needs a reconciled runtime/file-scope contract before autonomous execution.

## DESIGN1 - Experience Gallery screenshot polish

**Priority:** P1
**Status:** blocked
**Type:** ui
**Primary agent:** Steward

### Block reason
This slice should execute only after authenticated visual QA and screenshot review are explicitly scheduled.
