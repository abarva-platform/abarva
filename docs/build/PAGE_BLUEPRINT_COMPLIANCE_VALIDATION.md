# Page Blueprint Compliance Validation
**Authority: PX2 · Wave 21 · Lane D**
**Status: Active**

## Purpose

PX2 makes PX1 blueprints enforceable at runtime. It extends the PX1 Page Blueprint Authority with stricter section-level checks — verifying that each of the 10 mandatory sections defined in `PAGE_EXPERIENCE_BLUEPRINT_STANDARD.md` is present and populated in each blueprint file.

## What It Checks

For every blueprint in `TARGET_BLUEPRINTS`, PX2 verifies that each of the 10 mandatory sections is present by scanning for at least 2 of the section's representative keywords.

### Target Blueprints (10)

| Blueprint File | Page Name |
|---|---|
| HOME_PAGE_BLUEPRINT.md | Home Page |
| PROGRAMS_PAGE_BLUEPRINT.md | Programs Page |
| PROGRAM_DETAIL_PAGE_BLUEPRINT.md | Program Detail Page |
| SOURCE_PAGE_BLUEPRINT.md | Source Page |
| SOURCE_EVENT_PAGE_BLUEPRINT.md | Source Event Page |
| INTELLIGENCE_PAGE_BLUEPRINT.md | Intelligence Page |
| CONTROL_TOWER_PAGE_BLUEPRINT.md | Control Tower Page |
| ADMIN_SETUP_PAGE_BLUEPRINT.md | Admin Setup Page |
| PRODUCTION_READINESS_PAGE_BLUEPRINT.md | Production Readiness Page |
| ARCHITECTURE_PAGE_BLUEPRINT.md | Architecture Page |

### Required Sections (10)

Each section is checked by scanning for at least 2 of the listed keywords:

| Section | Keywords Checked |
|---|---|
| 1. Page Identity | Route, Primary agent, Demo data |
| 2. Job-to-be-Done | Job-to-be-Done, 10 seconds, decision, First 10 |
| 3. Data Contract | Data Contract, Must not claim, Available today, Missing |
| 4. Layout | Layout, ┌, canvas, rail, header |
| 5. Workflow Sequence | Workflow Sequence, Unlocks, Blocks |
| 6. Agent-Centric | Agent-Centric, Context used, Confidence, Recommended next action |
| 7. Visual Canon | Visual Canon, off-white, teal |
| 8. Interaction Model | Interaction Model, Tabs, Drawer, Empty state |
| 9. Acceptance Criteria | Acceptance Criteria, - [ ] |
| 10. Route Ownership | Route Ownership, Route file, Expected shell, Legacy risk |

## Compliance Statuses

| Status | Meaning |
|---|---|
| `compliant` | Blueprint file exists and all 10 sections pass keyword checks |
| `non_compliant` | Blueprint file exists but one or more sections fail keyword checks |
| `missing` | Blueprint file does not exist on disk |
| `deferred` | Check deferred (reserved for future use) |

## Overall Report Status

| Status | Condition |
|---|---|
| `pass` | All blueprints compliant — missingCount = 0, nonCompliantCount = 0 |
| `fail` | Any blueprint is missing or non-compliant |
| `partial` | Some blueprints deferred |

## UI Work Order Requirements

Every UI implementation work order must include all 6 attestations from `UI_WORK_ORDER_REQUIREMENTS`:

1. Blueprint followed: yes/no (with reference to blueprint file)
2. Blueprint deviations: list any intentional deviations
3. Design canon followed: yes/no
4. Agent-centric enforcement followed: yes/no (reference AGENTX rules)
5. Deterministic/live caveat preserved: yes/no
6. Canonical logo used: yes/no

## Enforcement

- PX2 validator runs as a deterministic integration test in `src/__tests__/integration/qa/page-blueprint-compliance.test.ts`
- All checks are filesystem keyword scans — no live rendering, no model calls, no network calls
- Test expects `overallStatus === 'pass'` — all 10 blueprints must be compliant
- A blueprint is compliant when all 10 sections each have at least 2 matching keywords
- Any new blueprint added to `TARGET_BLUEPRINTS` must pass all 10 section checks before CI can be green
- Non-compliant blueprints returned by `getNonCompliantBlueprints()` must be remediated before merge

## Implementation

- Source: `src/lib/qa/page-blueprint-compliance.ts`
- Test: `src/__tests__/integration/qa/page-blueprint-compliance.test.ts`
- Extends: `src/lib/qa/page-blueprint-authority.ts` (PX1)
- Authority standard: `docs/platform-design/page-blueprints/PAGE_EXPERIENCE_BLUEPRINT_STANDARD.md`

## Caveats

All checks are deterministic filesystem keyword scans. This validator does not render pages, call models, or make network calls. It verifies that documented blueprint sections contain the expected vocabulary — not that the UI implementation matches the blueprint. Blueprint-to-UI compliance remains a human review gate enforced via UI work order attestations.
