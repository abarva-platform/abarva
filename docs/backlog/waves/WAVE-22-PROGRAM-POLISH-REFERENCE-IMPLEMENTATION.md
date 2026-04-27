# Wave 22 — Program Polish + Reference Implementation

_Status: PLANNING | Estimated wave date: Late April / Early May 2026_

---

## Wave Goal

Elevate the Programs surface to exemplar fidelity — rich data on all 4 Apex Retail programs, fully connected to Source and Intelligence. Make the 30-minute demo flow without gaps.

---

## Pre-Flight Dependencies

- Wave 21 must be merged (BRAND1-2, DES9, PX2, INTEL1-3, TOWER1-3, QA29, DEMO9, BLG1)
- All 16 routes must return 200 (verify with route smoke test)
- Founder approval of Wave 22 scope

---

## Slices

| Slice | Title | Lane | Goal |
|---|---|---|---|
| PROG10 | APX-CDP-2026 Workshop Canvas Data | A | Seed all 8 workshops with full data |
| PROG11 | APX-CDP-2026 Deliverables Library | B | Deliverables by phase (15+ items) |
| PROG12 | APX-CDP-2026 Evidence Panel | C | Evidence manifest with trust levels |
| PROG13 | APX-CDP-2026 Intelligence Tab | D | Sentinel signals on program detail |
| PROG14 | APX-CDP-2026 Missions Tab | E | Nexus missions seeded |
| PROG15 | 3 Remaining Apex Programs Data | F | Contact Center AI, Store Assoc, Demand Forecasting |
| MW9 | Workshop Canvas Format | G | Expandable workshop detail UI |
| INTEL4 | Intelligence Lens Tabs | H | Overview, Patterns, Evidence, Signals tabs |
| TOWER4 | Tower Lens Tabs | I | Portfolio, Scorecards, Pressure, Executive Brief tabs |
| QA25 | Programs Verification Suite | J | Full route + data + no-fabrication verification |
| DEMO6 | Programs Demo Script | K | 15-min advisor demo script |
| DEMO7 | Apex Retail 30-Min Storyline | L | End-to-end 30-min demo script |

---

## Key Data Contracts

**APX-CDP-2026 workshop data contract**:
- 8 workshops total (Discovery through Selection)
- Each workshop: title, date, status, facilitator, deliverable links, source event link

**Deliverables by phase**:
- Discovery: 3 deliverables
- Assessment: 4 deliverables
- Selection: 4 deliverables
- Negotiation: 2 deliverables
- Implementation: 2 deliverables

**Evidence documents for APX-CDP-2026**:
- Northstar Analytics Proposal (agent-usable)
- BlueMaster CDP Proposal (usable)
- DataPeak RFP Response (available)
- ArcVault CDP Proposal (agent-usable)
- CDP RFP Document (decision-grade)

---

## Integration Cherry-Pick Order

1. LANE-A (PROG10) → LANE-B (PROG11) → LANE-C (PROG12)
2. LANE-D (PROG13) after PROG12 evidence is merged
3. LANE-E (PROG14), LANE-F (PROG15) in parallel with PROG13
4. LANE-G (MW9) after PROG10
5. LANE-H (INTEL4), LANE-I (TOWER4) in parallel
6. LANE-J (QA25) last — verifies all previous lanes
7. LANE-K (DEMO6), LANE-L (DEMO7) after QA25

---

## Acceptance Criteria

- [ ] APX-CDP-2026 shows all 7 tabs with real data (no placeholders)
- [ ] Programs list shows 4 Apex Retail programs
- [ ] Intelligence tab on program detail shows Sentinel signals
- [ ] 30-minute demo can be walked cold by the founder
- [ ] npx tsc --noEmit passes
- [ ] All 16 routes return 200
- [ ] No fabricated dollar amounts or percentages
