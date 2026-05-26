# 2026-05-26-packet-22-northstar-pattern-overlay — Packet 22 Northstar Industry Pattern Overlay + CXO Business Case

## Release ID

`2026-05-26-packet-22-northstar-pattern-overlay`

## Status

`candidate`

## Plain-English Summary

Adds the industry pattern overlay and CXO-grade business case for Northstar Clinical Tech, the fourth demo composite tenant (medtech vertical, grounded on Solventum's real post-3M-separation profile). Companion to Packet 21 which authors the data pack; Packet 22 specifies (a) the patterns the Source / Atlas / Sentinel modules must render, (b) the $225K pilot scope, (c) the $750K ARR commit math, (d) the 10x–50x payback defence, (e) a deep-org-chart + five demo logins, (f) 16 Sentinel verification questions, and (g) the four-tenant cross-comparison matrix. This release adds documentation only; the actual data files and ingestion ship through Packet 21 + Codex Phase A.

## Layer Impact

- `ops-release-lane`: adds the authoring spec under `docs/build/`. Documentation-only lane impact — no runtime path, no schema, no tenant-data write.
- No other lane is affected by this change.

## Client Applicability

- All clients: no
- Specific clients: Northstar Clinical Tech (tenant key `northstar`, the fourth composite). Apex / Meridian / First Capital unaffected.
- Internal only: yes (authoring spec to be paired with Packet 21 for Codex Phase A)
- Public/demo only: no
- Feature flag: none

## Changes Included

- `docs/build/PACKET_22_NORTHSTAR_INDUSTRY_PATTERN_OVERLAY.md` (12 parts, ~9KB)
- PR: this PR

## QA / Validation

- Source grounding: **passed**. All Solventum-specific factual claims cite SEC filings, investor day presentation, recent earnings, FDA / EU regulatory primary sources, and named industry analyses (Forrester TEI, McKinsey-Merck CSR, Zylo 2025, Gartner 2025).
- Composite tenant integrity: **passed**. Forbidden-term list extended to include the real-world parent company name, the real CEO/CFO/CIDO/CCO names, and the real ticker. Every product-visible artifact must use "Northstar Clinical Tech" only.
- Parity with prior packets (Packet 18 Apex, Packet 19 Meridian, Packet 20 First Capital): **passed**. Same folder shape, same forbidden-term scanner pattern, same Sentinel verification harness format, same TENANT_PROFILES registry compatibility.
- Cross-tenant matrix self-consistency check: **passed**. Northstar row added at row counts that match the Packet 21 generator's declared output (240 apps / 820 edges / 80 initiatives / 90 contracts / 3,400 roles / 720 corpus chunks).
- Lint / typecheck: **not run** — no code added.
- Runtime / unit tests: **not run** — documentation-only change with no executable surface.

## Rollout Plan

Merge to `main`. No production rollout — this is a documentation deliverable. The follow-up rollout has three phases already in motion under Packet 21 (`codex/p21-northstar-context` worktree):

- **Phase A:** Codex authors the data files under `datasets/northstar-clinical-tech-synthetic-v1/` using BOTH Packet 21 (data shape) AND Packet 22 (industry pattern overlay, 16 verification questions, 5 demo personas, deep-org chart).
- **Phase B:** loader `scripts/seed/northstar-substrate.ts` writes the rows into Supabase scoped to `clients.tenant_key = 'northstar'` and enqueues 720 chunks through the AI Egress Control Plane.
- **Phase C:** parameterized stress runner `scripts/audit/run-full-module-stress.mjs` adds a `northstar` entry to TENANT_PROFILES (30-line change — same harness that drives Apex / Meridian / First Capital).

## Rollback Plan

Revert the merge commit. No runtime, no schema, no policy change.

## Audit Evidence

- Solventum FY25 Q4 earnings + FY26 guide: https://investors.solventum.com/news-events/press-releases/detail/143/
- Solventum 2025 Investor Day Long-Range Plan: https://investors.solventum.com/image/SOLV-2025-IR-Day-Presentation.pdf
- FDA PCCP final guidance: https://www.mcdermottplus.com/insights/fda-issues-final-guidance-on-predetermined-change-control-plans-for-ai-enabled-devices/
- FDA 524B + False Claims Act exposure: https://www.morganlewis.com/blogs/asprescribed/2025/11/
- Medtech tariff impact: https://www.medtechdive.com/news/one-year-in-how-medtech-companies-are-coping-with-tariff-challenges/816982/

## Known Gaps

- Packet 22 is a pattern + business-case spec only. The actual seed data, ingestion harness, and stress-test wiring all happen through Packet 21 + Codex Phase A/B and the existing parameterized runner.
- Pattern catalog in Part 4 specifies eight named patterns (AMS rebid, SBOM/clause-gap, tariff scenario, multi-vendor benchmark, renewal pressure, shadow-SaaS, TBM cost transparency, IT/ERP transition). Implementing each as a first-class object in the Source module is a downstream product workstream — Packet 22 specifies the contract, not the implementation.
- Part 13 (consulting + SI displacement reframe) added in a later commit on the same branch. The displacement levers ($5–15M/yr strategy-consulting avoidance + 20–30% on $50–100M/yr SI execution) reset the conservative case past 50x without depending on any single lever performing at the aggressive end. The CXO 30-second pitch now leads with displacement, not procurement.
- Tasks #17 remains open and is not in scope here.
