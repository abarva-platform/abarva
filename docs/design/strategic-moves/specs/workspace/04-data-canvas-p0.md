# Workspace Canvas Read Bindings — P0 Originate phase — W-4.2 (P0)

| | |
|---|---|
| **Work Package** | W-4.2 (P0) |
| **Doc path** | `docs/design/strategic-moves/specs/workspace/04-data-canvas-p0.md` |
| **Version** | 1.0 |
| **Date** | 2026-05-05 |
| **Status** | Draft |
| **Preceding layers** | `01-anatomy-canvas-p0.md` (frozen) · `02-state.md` (frozen) · `03-interactions-canvas-p0.md` (frozen) |
| **Author** | Claude Code |

---

## Overview

P0 canvas surfaces the origination brief — the 7 sections authored on `/strategic-moves/new` — for read/edit in the Workspace. Content is stored in `engagements` columns (promoted from `program_origination_drafts.state` at P0→P1 time) or in the associated `deliverables_v2` / `program_approval_requests` rows.

**View mode behavior:**
- `current` (move is at P0): Promote bar visible; brief sections editable
- `current` (move is past P0, user opened P0 edit): Post-P0 edit mode via `ws-canvas-p0-edit-btn`
- `past` (user clicked P0 rail from a later phase): All edits hidden; read-only overlay

---

## §1 · Column Definitions

Same as `04-data-shell.md §1`.

---

## §2 · P0 Brief Sections

### §2.1 Brief sections content (×7)

| element-id | db-table-or-view | query-api-route | computed-or-stored | refetch-trigger | fallback | update-permissions |
|---|---|---|---|---|---|---|
| `ws-canvas-p0-brief-section-1-content` (What's the bet / hypothesis) | `engagements.problem_statement` | Server: `getProgramById(ctx, moveId)` | Stored (column added in migration `20260503113000`) | After inline edit save (INT-WS-P0-02); page load | Empty placeholder: `"Describe the core bet or hypothesis for this move..."` | role = `'admin'`, `'lead'`, `'governance'`; `viewMode = current` only |
| `ws-canvas-p0-brief-section-2-content` (Archetype classification) | `engagements.program_archetype` | Server: `getProgramById(ctx, moveId)` | Stored | After inline edit save; page load | Empty placeholder: `"Archetype classification will appear here..."` | Same roles; `viewMode = current` only |
| `ws-canvas-p0-brief-section-3-content` (Sponsor candidate) | `engagement_participants` row where `approval_authority = 'sponsor'` → `user_name` (or `persons.name` via `person_id`) | Server: `engagement_participants` join to `persons` | Stored | After sponsor assignment; page load | Empty placeholder: `"Sponsor candidate will appear here..."` | Admin/governance via participant management |
| `ws-canvas-p0-brief-section-4-content` (Scope / boundary) | `engagements.value_assumptions_jsonb->>'scope_boundary'` (interim storage until dedicated column added — gap-ws-4-005, B-121) | Server: `getProgramById(ctx, moveId)` | Stored in JSONB field (interim) | After inline edit save; page load | Empty placeholder: `"Initial scope boundary will appear here..."` | Admin, lead, governance; `viewMode = current` only |
| `ws-canvas-p0-brief-section-5-content` (Evidence family selection) | `engagements.value_assumptions_jsonb->>'evidence_family'` (interim storage — gap-ws-4-006, B-122) | Server: `getProgramById(ctx, moveId)` | Stored in JSONB field (interim) | After inline edit save; page load | Empty placeholder: `"Evidence family will appear here..."` | Admin, lead, governance; `viewMode = current` only |
| `ws-canvas-p0-brief-section-6-content` (Value hypothesis seed) | `engagements.target_outcome` | Server: `getProgramById(ctx, moveId)` | Stored (column added in migration `20260503113000`) | After inline edit save; page load | Empty placeholder: `"Value hypothesis seed will appear here..."` | Admin, lead, governance; `viewMode = current` only |
| `ws-canvas-p0-brief-section-7-content` (Foundation readiness F1–F4) | `engagements.value_assumptions_jsonb->'foundation_checks'` (interim — gap-ws-4-008, B-123) | Server: `getProgramById(ctx, moveId)` | Stored in JSONB field (interim) | After foundation check interaction; page load | Empty placeholder: `"Foundation readiness checks will appear here..."` | Admin, lead, governance |

### §2.2 Brief section status icons

| element-id | db-table-or-view | query-api-route | computed-or-stored | refetch-trigger | fallback | update-permissions |
|---|---|---|---|---|---|---|
| `ws-canvas-p0-brief-section-{N}-status` | Computed from corresponding section content field: `empty` when null/blank; `complete` when non-null + non-blank | Server: derived from same engagement row | Computed at render | Same as section content | `'empty'` | Not directly editable — derived |

### §2.3 Foundation readiness sub-checks (Section 7)

| element-id | db-table-or-view | query-api-route | computed-or-stored | refetch-trigger | fallback | update-permissions |
|---|---|---|---|---|---|---|
| `ws-canvas-p0-brief-section-7-f1` | `engagements.value_assumptions_jsonb->'foundation_checks'->>'f1'` | Server: `getProgramById` | Stored in JSONB (interim — gap-ws-4-008) | After F1 toggle interaction; page load | `'not-checked'` | Admin, lead; `viewMode = current` |
| `ws-canvas-p0-brief-section-7-f2` | `engagements.value_assumptions_jsonb->'foundation_checks'->>'f2'` | Server: same | Stored in JSONB (interim) | Same | `'not-checked'` | Same |
| `ws-canvas-p0-brief-section-7-f3` | `engagements.value_assumptions_jsonb->'foundation_checks'->>'f3'` | Server: same | Stored in JSONB (interim) | Same | `'not-checked'` | Same |
| `ws-canvas-p0-brief-section-7-f4` | `engagements.value_assumptions_jsonb->'foundation_checks'->>'f4'` | Server: same | Stored in JSONB (interim) | Same | `'not-checked'` | Same |

---

## §3 · P0 Promote Bar

| element-id | db-table-or-view | query-api-route | computed-or-stored | refetch-trigger | fallback | update-permissions |
|---|---|---|---|---|---|---|
| `ws-canvas-p0-promote-bar` (visibility) | Computed: visible when `viewMode = current` AND `engagements.current_phase = 0` AND `engagements.status NOT IN ('handed_off', 'archived')` | Server: `getProgramById` | Computed | After phase promotion; after status change | Hidden | Not editable — derived |
| `ws-canvas-p0-promote-bar-gate-summary` | Computed: count of non-null, non-blank brief section fields out of 7 | Server: derived from engagement row | Computed at render | After any brief section save | `"0 of 7 sections complete"` | Not editable — derived |
| `ws-canvas-p0-promote-bar-status-text` | Computed from gate evaluation result: `evaluateGate(ctx, moveId, 0, 1)` → `GateCheck` result | Server: `evaluateGate(ctx, moveId, 0, 1)` from `governance.ts` | Computed | After gate evaluation; after section save | `"Complete all 7 sections to promote"` | Not editable — derived |
| `ws-canvas-p0-promote-bar-promote-btn` (enabled/disabled) | Computed: `gateState = 'ready'` (all hard checks passing) AND `userRole` in `['admin', 'lead', 'governance', 'sponsor']` AND `viewMode = 'current'` | Server: gate evaluation + `hasAuthority(ctx, moveId, 'sponsor')` | Computed | After gate state change; after brief section save | Disabled | Not editable — state derived |

### §3.1 P0→P1 gate criterion data sources (from `governance.ts`)

| Gate criterion key | governance.ts check | Data source |
|---|---|---|
| `program_seed_recorded` (hard) | `isSignedOff(originationBriefRow)` | `deliverables_v2` row with `deliverable_type_key IN ('origination_brief', 'program_seed_brief', 'program_seed')` AND `status = 'signed_off'` |
| `value_hypothesis_seed` (hard) | `hasSignedOriginationBrief AND /problem.../trigger.../ AND /value hypothesis.../outcome.../` in brief text | `deliverables_v2` → `deliverable_versions.content` text search |
| `sponsor_assigned` (hard) | `hasSponsor` (any `engagement_participants.approval_authority = 'sponsor'`) OR brief text contains "sponsor" | `engagement_participants` WHERE `approval_authority = 'sponsor'` |
| `discovery_funding_envelope` (soft) | Brief text contains `timeline`, `funding`, `capacity`, `budget` | `program_approval_requests.brief_snapshot` text search OR `deliverable_versions.content` |
| `initial_scope_boundary` (soft) | Brief text contains `scope`, `cohort`, `use case` | Same brief snapshot text search |
| `evidence_family_selected` (soft) | `Boolean(program.archetype)` OR brief text contains `evidence` | `engagements.program_archetype` non-null OR brief text |

---

## §4 · Post-P0 Edit Button

| element-id | db-table-or-view | query-api-route | computed-or-stored | refetch-trigger | fallback | update-permissions |
|---|---|---|---|---|---|---|
| `ws-canvas-p0-edit-btn` (visibility) | Computed: visible when `viewMode = current` AND `engagements.current_phase > 0` | Server: `getProgramById` | Computed | After phase change | Hidden | Not editable — visibility derived |

---

## §5 · Write Bindings (P0 mutations)

P0 write mutations cross-reference `04-data-writes-promote.md` (promotion) and `04-data-writes-gate.md` (gate criterion updates).

| interaction-id (Layer 3) | what gets written | target table/column | API route |
|---|---|---|---|
| `INT-WS-P0-02` (save section edit) | Updated brief section field | `engagements.problem_statement`, `target_outcome`, `program_archetype`, or `value_assumptions_jsonb` depending on section | **gap-ws-4-001** — no dedicated workspace content-update API route; see `04-data-gaps.md` B-117 |
| `INT-WS-P0-03` (promote P0→P1) | `engagements.current_phase = 1`; audit log entry | `engagements` + `program_audit_log` | `POST /api/programs/phase-gate` — see `04-data-writes-promote.md` |
| `INT-WS-P0-04` (toggle post-P0 edit) | No DB write — local UI state toggle only | N/A | N/A |

---

## §6 · Self-QA

| Check | Status |
|---|---|
| Every P0 element from `01-anatomy-canvas-p0.md` has a binding row | PASS |
| All 7 brief section content columns mapped to specific DB columns | PASS — sections 1+6 to named columns; 2, 3 to existing columns; 4, 5, 7 documented as JSONB interim with gap references |
| Gate criterion data sources documented for all 6 P0→P1 checks | PASS |
| Substrate gaps referenced to `04-data-gaps.md` | PASS |
| No "TBD" values | PASS |
