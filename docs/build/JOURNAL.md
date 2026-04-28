# Tower Build Journal

| Date | Wave | Status | Lines +/- | Smoke | Note |
|---|---|---|---|---|---|
| 2026-04-28 | T0 | shipped | +0/-0 | N/A | Audit complete; docs/build/ infrastructure initialized; gap analysis in WAVE-T0-PLAN.md |
| 2026-04-28 | T1 | shipped (PR #544, human review) | +3025/-646 | typecheck clean | TWR-IDX-PORTFOLIO skeleton: Nexus-led KPI band, 8-col program table, vendor concentration bar; ai-program-portfolio-fixture.ts (5 seed programs) |
| 2026-04-28 | T2 | shipped (PR #546, auto-merged) | +770/-0 | typecheck clean | TWR-IDX-PORTFOLIO full: SVG bubble chart (adoption×value, spend sized); TWR-IDX-LENSES Cost lens: /tower/lens/cost with per-program cost cards + dept allocation bars |
| 2026-04-28 | T3 | shipped (PR #547, auto-merged) | +550/-10 | typecheck clean | TWR-DTL-PROGRAM: AiProgramDetailPage — value model panel, adoption by dept, pressure panel, vendor panel, linked decisions. ai-program-detail-fixture.ts (5 programs). Route /tower/programs/[twr-prog-*] |
| 2026-04-28 | T4 | shipped (PR #549, auto-merged) | +830/-15 | typecheck clean | TWR-DTL-PRESSURE: AiPressureDetailPage — drivers, projections, ranked actions. TWR-IDX-DECISIONS: DecisionsIndexPage with type/status log. ai-pressure-detail-fixture.ts (7 pressures). Routes /tower/pressures/[p-*], /tower/activity |
| 2026-04-28 | T5 | shipped (PR #552, auto-merged) | +980/-8 | typecheck clean | TWR-DTL-VENDOR: AiVendorDetailPage (4 vendors). TWR-DTL-OUTCOME: AiOutcomePage with confidence haircut bars. TWR-DTL-DECISION: AiDecisionDetailPage with evidence + alternatives. Routes /tower/vendors/[id], /tower/decisions/[id] |
| 2026-04-28 | T6 | shipped (PR #554, auto-merged) | +694/-0 | typecheck clean | TWR-FLW-ONBOARD: 4-step program intake wizard. TWR-FLW-REALLOCATE: live budget simulator. TWR-FLW-RENEWAL: renewal workspace with per-vendor negotiation checklist. Routes /tower/programs/new, /tower/reallocate, /tower/renewals |
| 2026-04-28 | T7 | shipped | ~+230/-2 | typecheck clean | TWR-EMP-NO-PROGRAMS: TowerEmptyState with setup steps + CTA. TWR-ERR-PROGRAM-NOT-FOUND: not-found.tsx for /tower/programs/[programId]. TowerIndexPage guarded for zero programs |
