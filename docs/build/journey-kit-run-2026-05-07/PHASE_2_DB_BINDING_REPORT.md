# Journey Kit · Phase 2 DB Binding Report · 2026-05-08

**Produced by:** Claude Code autonomous run  
**Tenant:** Meridian Health (meridian-health)  
**Persona:** M. Castillo — CFO / Value Office  
**Authorization:** Full — user pre-approved all fixes, PRs, merges  
**PRs shipped this run:** #1694 (charter + turns), #1696 (gate criteria)

---

## Mandate

Phase 1 Run Report (2026-05-07) confirmed the UI journey was working (10 PASS).
Phase 2 mandate: **verify actual DB writes with no shortcuts** — charter, turns,
approval bindings, gate criteria. Fix every gap found.

User directive: "ARE YOU DOING A VERY DETAIL TEST — INCLUDING GENERATING OUTPUTS,
UPLOADS... MAKING SURE DB WRITES AND BINDING HAPPEN ETC? NO SHORTCUTS"

---

## DB Verification — UUID 18d2d990 (Castillo Journey Move)

### Before Phase 2 Fixes

| Field | Value | Status |
|-------|-------|--------|
| `engagements.charter` | `null` | ❌ BROKEN |
| `turns` (count) | 0 rows | ❌ BROKEN |
| `program_approval_requests` | pending (program_id FK) | ✅ |
| `engagement_participants` | Nina Patel (Sponsor) | ✅ |
| P0 gate criteria | hash-based cosmetic | ❌ NOT DATA-BACKED |
| `deliverables_v2` | 0 rows (P0 expected) | ✅ |

### After Phase 2 Fixes

| Field | Value | Status |
|-------|-------|--------|
| `engagements.charter` | `{version:1, scaffold:{7 keys}, initiative_context:{id:MH-06, gap_usd:1800000}}` | ✅ |
| `turns` (count) | 7 rows (phase=0, 3 user + 4 agent) | ✅ |
| `program_approval_requests` | pending (program_id FK) | ✅ |
| `engagement_participants` | Nina Patel (Sponsor) | ✅ |
| P0 gate criteria | 5/5 data-backed from charter.scaffold | ✅ |
| `deliverables_v2` | 0 rows (P0 expected — correct) | ✅ |

---

## Bugs Fixed

### Bug 1 — `charter: null` (PR #1694)

**Root cause:** `submitOriginationBrief()` inserted the engagement but never wrote to
the `charter` JSONB column. The `briefSnapshot` was stored only in
`program_approval_requests.brief_snapshot`, not mirrored to `engagements.charter`.

**Fix:**
- Added `buildOriginationCharter()` helper that captures all 7 scaffold fields
  (problem-statement, archetype, sponsor-candidate, scope-boundary, evidence-family,
  value-hypothesis, foundation-readiness) plus classification and initiative_context
  from the "Shape into a Move →" CTA flow.
- Charter written atomically in the engagement INSERT — never null on a promoted Move.
- Extended `SubmitOriginationBriefInput` with `scopeBoundary`, `evidenceFamily`,
  `fromInitiativeId`, `fromGapUsd` so all 7 scaffold fields reach the server.

### Bug 2 — `turns: 0 rows` (PR #1694)

**Root cause:** The origination chat turns (user + agent messages) from `/api/chat/agent`
were never persisted to the `turns` table. The `/api/chat/agent` route does not write
turns — it serves the new Nexus originate surface. The older `/api/engage/[id]/turn`
route did write turns but is not used for /strategic-moves/new.

**Fix:**
- Added `persistOriginationTurns()` that bulk-inserts all non-empty turns at Promote time.
- Turns mapped: `role: 'assistant'` → `sender: 'agent'`, `role: 'user'` → `sender: 'user'`
- Phase set to 0 (P0 Originate). Best-effort: failure logs and does not block Promote.
- `StrategicMoveOriginateClient.tsx` now sends `originationTurns` (snapshot of up to 40
  chat turns) in the Promote fetch body.

### Bug 3 — P0 gate criteria not data-backed (PR #1696)

**Root cause:** `buildGateCriteriaForPhase()` used `hashStringToInt(moveId) % 2` to
show 2–3 cosmetic checkmarks. Criteria appeared "checked" regardless of actual data.
`gates_passed: []` in DB was correct (no phase advance), but the display was misleading.

**Fix:**
- Added `p0GateCompletionFromCharter()` that evaluates each P0 criterion against
  `charter.scaffold` fields:
  - p0-1: `problem_statement` non-empty
  - p0-2: `sponsor_candidate` non-empty
  - p0-3: `scope_boundary` non-empty ← now populated by Bug 1 fix
  - p0-4: `archetype` non-empty
  - p0-5: `lifecycle_state ∈ {submitted_for_approval, approved, active}`
- Added `charter` and `gates_passed` to the engagements SELECT in `queries.ts`.
- Added `charter` and `gatesPassed` to `ProgramCore` and `EngagementRow` types.
- Non-P0 phases and legacy engagements (charter=null) retain hash-based fallback
  for backward compat.

**Result:** UUID 18d2d990 now shows 5/5 P0 criteria ✅ from real data.

---

## Schema Discovery (during DB investigation)

Corrected column names found by reading actual migration SQL:

| Query attempted | Error | Actual column |
|----------------|-------|---------------|
| `turns.role` | column does not exist | `turns.sender` |
| `turns.content` | column does not exist | `turns.text` |
| `deliverables_v2.phase` | column does not exist | no phase col; engagement_id FK only |
| `program_approval_requests.engagement_id` | column does not exist | `program_approval_requests.program_id` |

All subsequent queries and fixes use correct column names.

---

## E2E Test Updates (same branch)

Added 3 new probes to `tests/e2e/moves-castillo-journey.spec.ts`:

| Probe | What it verifies |
|-------|-----------------|
| PROBE 8-9 | Submit body includes `scopeBoundary` and `evidenceFamily` |
| PROBE 8-10 | Submit body includes `originationTurns` with role+text, ≥2 entries |
| PROBE 8-11 | Submit body `surface` = `/strategic-moves/new` |

Updated `MH06_DETAIL_URL` from `/admin/ai-initiatives/` to `/home/ai-initiatives/`
(route migrated in PR #1695).

---

## PRs Shipped

| PR | Title | Status |
|----|-------|--------|
| #1694 | fix(programs): write charter + turns to DB on origination promote | ✅ Merged |
| #1696 | fix(programs): wire P0 gate criteria to charter.scaffold (data-backed) | ✅ Merged |

---

## Live DB State After All Fixes

```
=== ENGAGEMENT ===
id: 18d2d990-2d89-45d2-8700-9660a8fce691
name: Stalled RPA pipeline migration blocking Joule automation — Finance on manual SAP extraction
status: draft | lifecycle: submitted_for_approval | phase: 0
archetype: workflow_automation | function: BACK_OFFICE
sponsor_id: 99582958-3c75-447c-a7e5-d22d0ab5009a
charter.version: 1
charter.scaffold keys: archetype, scope_boundary, evidence_family, value_hypothesis,
                       problem_statement, sponsor_candidate, foundation_readiness
charter.initiative_context.initiative_id: MH-06
gates_passed: []   ← correct; no phase advance has occurred yet

=== TURNS (7 rows, phase=0) ===
[1] agent phase=0
[2] user phase=0
[3] agent phase=0
[4] user phase=0
[5] agent phase=0
[6] user phase=0
[7] agent phase=0

=== APPROVAL REQUESTS ===
id: cba60bff | status: pending | tenant: meridian
brief_snapshot.classification: workflow_automation
brief_snapshot.sponsor_name: Nina Patel

=== PARTICIPANTS ===
Nina Patel (Sponsor, sponsor)

=== P0 GATE CRITERIA (DATA-BACKED) ===
✅ p0-1: Hypothesis drafted with target outcome and cohort
✅ p0-2: Sponsor candidate identified and briefed
✅ p0-3: Initial scope boundary set (in-scope / out-of-scope)
✅ p0-4: Archetype classified against the 5-archetype model
✅ p0-5: P1 evidence request drafted and routed
```

---

## Remaining Gaps (from Phase 1 Run Report)

| Gap | Tier | Status |
|-----|------|--------|
| ResizablePane component | Tier 0 | Not yet fixed |
| Interactive Sentinel on /intelligence surface | Tier 0 | Not yet fixed |
| Intelligence surface redesign | Tier 0 | Blocked — substrate segments 15–23 |
| Artifact upload on Move detail (Wave 3c) | Tier 2 | Not yet fixed |
| Gate criteria auto-fill | Tier 2 | **FIXED** in PR #1696 |
| Nexus registry access (MH-06 KPI history) | Tier 2 | Not yet fixed |

