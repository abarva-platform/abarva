# AGENTX — Agent-Centric Enforcement Review Standard

## Slice Metadata

- **sliceId:** AGENTX
- **title:** Agent-Centric Enforcement Review Standard
- **wave:** wave-20
- **lane:** AGENTX
- **status:** code_complete
- **date:** 2026-04-26

## Purpose

Establishes the minimum design review bar for every AbarVa page that surfaces an agent. Defines 9 enforcement rules covering all four agents (Nexus, Sentinel, Steward, Atlas) across 7 workflow surfaces. Generic agent guidance — guidance that could apply to any client, event, or stage without modification — is a design defect under this standard.

## Files Created

| File | Description |
|---|---|
| `docs/platform-design/experience-system/AGENT_CENTRIC_ENFORCEMENT_REVIEW.md` | Full enforcement standard document with 10 rules, page-level checklists, master failure checklist, and agent panel minimum viable structure |
| `src/lib/qa/agent-centric-enforcement-review.ts` | Runtime enforcement rule catalog, surface/agent filter functions, and deterministic report builder |
| `src/__tests__/integration/qa/agent-centric-enforcement-review.test.ts` | Jest integration suite — 25 tests covering rule catalog, filter functions, and report shape |
| `docs/build/slices/AGENTX_AGENT_CENTRIC_ENFORCEMENT_REVIEW.md` | This slice contract |

## Enforcement Rules Count

**9 rules** (AGENTX-R1 through AGENTX-R10, with R7 encoded as a pattern-only rule in the doc but not instantiated as a separate catalog entry):

| Rule | Title |
|---|---|
| AGENTX-R1 | Agent UI must be context-first, not prompt-first |
| AGENTX-R2 | Every workflow-stage agent panel must show six mandatory fields |
| AGENTX-R3 | Nexus must feel like an orchestration lead, not a chatbot |
| AGENTX-R4 | Sentinel must surface evidence gaps and unsupported claims |
| AGENTX-R5 | Steward must surface gate, approval, and readiness blockers |
| AGENTX-R6 | Atlas must surface executive value and risk tradeoffs |
| AGENTX-R8 | Low-context responses must disclose missing data |
| AGENTX-R9 | No page should pass design review if agent guidance is generic |
| AGENTX-R10 | No agent response should pass if it lacks engagement context |

## Surfaces Covered

1. programs
2. source
3. intelligence
4. control_tower
5. admin_setup
6. production_readiness
7. architecture

## Related Slices

- QA24 — AbarVa Design Canon Regression Tests
- QA27 — Apex Retail Source → Program Storyline Verification
- QA28 — Active Route Shell Verification
- DEMO7 — Apex Retail 30-Minute Demo Storyline
- DEMO8 — Founder Live Route Review Checklist
- SHELL1 — Canonical AbarVa App Shell Ownership

## Constraints

- All checks are deterministic seed-based. No live model calls.
- No production_ready promotions.
- Deferred checks (AGENTX-C9, AGENTX-C11) resolve post-integration at QA29.
