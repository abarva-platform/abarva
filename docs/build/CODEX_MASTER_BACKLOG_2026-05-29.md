# Codex Master Backlog — Sequenced for Execution

**Created:** 2026-05-29 (post Phase 0D close)
**Author:** AbarVa Founder + Claude
**Status:** Live — replaces any prior in-flight task list
**Authority:** Per Packet 31 §4.3 + ADR-0001 + Amendment A1 (in effect)

---

## How to use this document

This is the **single canonical backlog** for Codex. Load it at session start. Work top-to-bottom respecting the gates. Each item has:

- **Scope** — what to do
- **Reference** — packet/file with the detailed spec
- **Gate** — what must close before this item starts
- **Authority class** — A/B/C/D/E/F/G per Packet 31 §4.3
- **Acceptance** — when this item closes
- **Parallel-OK** — whether this can run alongside another item

When status posts hit founder, format as: *"Closed item N.X. Next: N.Y per backlog."*

---

## Operating model essentials (must read before starting)

| Standing brief | What it governs |
|---|---|
| `docs/build/PACKET_31_ARCHITECTURAL_CONSTITUTION_AND_OPERATING_MODEL.md` | Invariants I1–I10, authority matrix, trust ladder, ADR process |
| `docs/architecture/adr/0001-canonical-pattern-storage.md` (with Amendment A1) | Pattern storage canonical = `corpus_patterns`; 5 canonical tenants; industry vocabulary |
| `docs/architecture/packet-31-amendments/2026-05-29-i9-i10-allowlist-drift.md` | I9 (industry isolation) + I10 (tenant allowlist) + anti-pattern |
| `docs/build/PACKET_30_ARCHITECTURAL_CONSOLIDATION.md` | 7-phase consolidation; Phases 0/1/2A/2B done; 2C/2D/3-7 pending |
| `docs/build/PACKET_35_RETAIL_ADJACENT_CORPUS_AUDIT_GENERATE_VALIDATE.md` | Retail corpus generation plan |
| `docs/build/PACKET_34_COMPREHENSIVE_BROWSER_CRAWL_SESSION.md` + Amendment B | Browser crawl validation |

**Trust calibration update (2026-05-29):** Codex earned class D auto-merge during business hours via the Phase 0D + Vercel migration gate run (zero rollbacks, zero P0 regressions, correct scope-expansion judgment on production hotfix). This advancement is referenced throughout the backlog below.

---

## Section 1 — Residual cleanup (do first, parallel-OK)

### 1.1 — Draft PRs triage
**Scope:** Post a one-line scope description for each open draft PR:
- #2393
- #2360
- #2280
- #2256 (Gamma — note the blocking dependency)

Recommend: close, rebase, or hold-for-review per draft.

**Authority class:** A (read-only, status only)
**Acceptance:** One-line summary per PR posted in status update
**Parallel-OK:** Yes — pure inventory work

### 1.2 — Close stale #1903
**Scope:** PR #1903 marked stale UI work, not safe to auto-merge blind. Close as "Stale — re-open if relevant when UI refresh schedules." Document close reason.

**Authority class:** B (PR close)
**Acceptance:** PR closed with documented reason
**Parallel-OK:** Yes

### 1.3 — Phase 0D closure summary
**Scope:** Post explicit closure summary documenting:
- 5 canonical tenants confirmed live (apex-retail, meridian-health, northstar-clinical, first-capital, skyharbor-air)
- I10 allowlist enforced via PR #2413 (CI drift detection live)
- Brindlemark merged into First Capital then hard-deleted
- Helix and Keystone hard-deleted with archives
- Industry vocabulary updated (healthcare → healthcare_provider + healthcare_medtech)
- Zero cross-tenant leak observed during execution
- Vercel migration gate root cause fixed via PR #2414

**Reference:** `docs/build/PACKET_35_PHASE_0D_CODEX_PROMPT.md` §Definition of Done
**Authority class:** A (documentation)
**Acceptance:** `verification/phase-0d/PHASE_0D_CLOSURE_SUMMARY.md` committed; release record with `## Audit Evidence`
**Parallel-OK:** Yes

---

## Section 2 — Phase 0 final closure (gate to Packet 35 Phase 2)

### 2.1 — Phase 0B final close
**Scope:** Complete the industry-scoping fix from PRs #2409/#2410:
- I9 ESLint guard active (`require-industry-filter` rule)
- Industry isolation regression test passing across all 5 canonical tenants (25 test cases per the I9 spec)
- Production smoke verifies zero cross-industry leakage across 5 tenants
- Universal-verification rule (Packet 31 §4.4 amendment) codified in CI

**Reference:** `docs/architecture/packet-31-amendments/2026-05-29-i9-i10-allowlist-drift.md` §I9
**Gate:** 1.3 (Phase 0D closure summary)
**Authority class:** D (auto-merge per advanced trust ladder)
**Acceptance:** All I9 acceptance checkboxes green
**Parallel-OK:** No — gates Phase 0C audit

### 2.2 — Phase 0C audit doc
**Scope:** Run Packet 35 Phase 1 audit queries against canonical post-Phase-0D state. Produce `docs/architecture/audits/INDUSTRY_CORPUS_AUDIT_2026-05-29.md` per Packet 35 §2.4 specification.

Capture:
- Pattern counts per `corpus_patterns.industry` (5 industries + cross_industry)
- Per-tenant `corpus_pattern_embeddings` retrieval coverage
- Gap matrix vs Packet 35 §3 coverage targets (60+ super-cats, 300+ packs, 5,500+ patterns)
- Reusability map for cross-industry extraction opportunities

**Reference:** `docs/build/PACKET_35_RETAIL_ADJACENT_CORPUS_AUDIT_GENERATE_VALIDATE.md` §2
**Gate:** 2.1
**Authority class:** A (read-only)
**Acceptance:** Audit document committed, founder reviews
**Parallel-OK:** No — informs Section 3

---

## Section 3 — Packet 30 Phase 2C/2D (Supabase migration completion)

### 3.1 — Phase 2C codemod execution
**Scope:** Per PR #2406 proposal — execute the AST-aware codemod migration of remaining ~140 files from Supabase imports to `azureRead`. Ship in area-grouped PRs (<100 files each):
- 2C.1 — admin reads
- 2C.2 — programs reads
- 2C.3 — other tenant-scoped reads

Per PR: parity test artifact, per-file rollback plan, ESLint allowlist count delta.

**Reference:** Earlier Packet 30 §5.7 rolling release; PR #2406
**Gate:** 2.2
**Authority class:** D (auto-merge per advanced trust ladder)
**Acceptance:** All 2C PRs merged, deployed, smoke green; ESLint allowlist count <30
**Parallel-OK:** No — sequenced sub-phases

### 3.2 — Phase 2D guard enforcement
**Scope:** Flip ESLint `no-restricted-imports` rule for `@supabase/*` in `src/app/` and `src/lib/` from warn to fail. Add explicit allowlist for genuine migration utilities under `scripts/`. Delete dead Supabase client imports.

**Reference:** Packet 30 §3.2 + Packet 31 I2
**Gate:** 3.1
**Authority class:** D
**Acceptance:** CI guard active, zero `@supabase/*` runtime imports in `src/app/` or `src/lib/`
**Parallel-OK:** No

### 3.3 — Phase 2 migration scripts Supabase cleanup (newly surfaced)
**Scope:** Address the latent Supabase residue in `scripts/vercel-build.sh` and DB migration scripts (the root cause of the production deploy concurrency bug fixed in PR #2414). Migrate any remaining `db:migrate`-class paths off Supabase session-mode clients.

**Reference:** PR #2414 audit notes
**Gate:** 3.2
**Authority class:** D
**Acceptance:** No Supabase session-mode client usage in build/migration scripts; Vercel deploy concurrency safe
**Parallel-OK:** Yes (with Section 4)

---

## Section 4 — Packet 30 Phases 3-7 (consolidation completion)

### 4.1 — Phase 3 Coverage Contract
**Scope:** Per Packet 30 Phase 3 spec. Build `src/lib/knowledge/coverage.ts` with `QUESTION_CATEGORIES`, `categoryToRequiredSegments`, `assertCoverage`. Wire classifier to route via map not keywords. Make retrievers return `CoverageReport`.

**Reference:** `docs/build/PACKET_30_ARCHITECTURAL_CONSOLIDATION.md` §4 Phase 3
**Gate:** 3.2
**Authority class:** E (architecture-affecting) — already approved via Packet 30 §2
**Acceptance:** All 25 Tier-1 question categories mapped; coverage tests pass
**Parallel-OK:** Yes (with 3.3)

### 4.2 — Phase 4 Verifier Rebuild
**Scope:** Per Packet 30 Phase 4 spec. Rewrite `scripts/skyharbor/07_verify/ground_truth_runner.mjs` as Node-fetch only, per-question UUID tabId, fresh Clerk ticket per question, latency budgets, harness-vs-product status taxonomy.

**Reference:** Packet 30 §4 Phase 4 + Packet 31 amendment §4.4
**Gate:** 4.1
**Authority class:** D (script-only)
**Acceptance:** Three consecutive runs within ±2 questions; zero `fail-harness` rows
**Parallel-OK:** No — gates Phase 5

### 4.3 — Phase 5 Partial-Evidence Policy
**Scope:** Per Packet 30 Phase 5 spec. Sentinel system prompt updated with partial-evidence policy. Cap `unavailableAdmissionRate < 10%`.

**Reference:** Packet 30 §4 Phase 5
**Gate:** 4.2
**Authority class:** D (prompt-only with regression tests)
**Acceptance:** Partial-evidence test cases pass; SkyHarbor verifier ≥23/25 on three consecutive runs
**Parallel-OK:** No

### 4.4 — Phase 6 E2E Validation
**Scope:** Per Packet 30 Phase 6 spec. Run validation matrix across 5 canonical tenants (was 4; now 5 per Amendment A1). Cross-tenant isolation stress per pair (5×4 = 20 attempts). Load test 50 concurrent.

**Reference:** Packet 30 §4 Phase 6
**Gate:** 4.3
**Authority class:** A (validation, no code)
**Acceptance:** SkyHarbor ≥23/25 × 3 runs; other 4 tenants ≥18/25; zero cross-tenant leak; load test passes
**Parallel-OK:** No

### 4.5 — Phase 7 Demo Readiness Certificate
**Scope:** Per Packet 30 Phase 7 spec. Tag production deploy as `delta-demo-ready-v2`. Substrate snapshot recorded. Generate Playwright capture against locked deploy. Signed certificate.

**Reference:** Packet 30 §4 Phase 7
**Gate:** 4.4
**Authority class:** A (certification)
**Acceptance:** Certificate signed; production tagged
**Parallel-OK:** No — major milestone

---

## Section 5 — Packet 35 Phase 2 (Retail Corpus Generation)

### 5.1 — Wave 1 — Retail Strategy → E-commerce
**Scope:** Author super-categories A–F per Packet 35 §3.2: ~895 patterns covering retail strategy, consumer dynamics, merchandising, pricing, store ops, e-commerce. Per-pattern format per §3.7.

Output: `docs/build/industry-overlays/retail/RETAIL_OVERLAY_v1_WAVE_1_STRATEGY_TO_ECOMM.md`

**Reference:** Packet 35 §3.2 (A–F) + §3.7 (format)
**Gate:** Section 4 closure (Packet 30 Phase 7)
**Authority class:** E (founder reviews each wave; not auto-merge)
**Acceptance:** ~895 patterns committed; founder spot-check passes; pattern count report
**Parallel-OK:** No (founder review gates next wave)

### 5.2 — Wave 2 — Omnichannel → Marketing
**Scope:** Super-categories G–N: ~1,265 patterns. Omnichannel, supply chain, inventory, logistics, returns, CDP/identity, loyalty, marketing/retail-media.

**Gate:** 5.1 + founder approval
**Authority class:** E
**Acceptance:** ~1,265 patterns committed; founder review passes
**Parallel-OK:** No

### 5.3 — Wave 3 — CX → AI
**Scope:** Super-categories O–T: ~830 patterns. CX, workforce, real estate, payments/BNPL, retail tech stack, AI in retail.

**Gate:** 5.2 + founder approval
**Authority class:** E
**Acceptance:** ~830 patterns committed
**Parallel-OK:** No

### 5.4 — Wave 4 — Format Verticals
**Scope:** Super-categories U–AI: ~1,050 patterns. Grocery, apparel, beauty, consumer electronics, home, DIY, c-stores, automotive, luxury, off-price, department stores, specialty, membership clubs, pharmacy, QSR/restaurants.

**Gate:** 5.3 + founder approval
**Authority class:** E
**Acceptance:** ~1,050 patterns committed
**Parallel-OK:** No

### 5.5 — Wave 5 — Adjacent + Cross-Cutting
**Scope:** Super-categories AJ–BH: ~1,350 patterns. CPG, trade promotion, wholesale, 3PL, carriers, cross-border, marketplaces, DTC, subscription, social/live/conversational commerce, MarTech/AdTech, travel retail, mall operators, consumer financial services, plus cross-cutting (retail finance, M&A, cyber, privacy, regulatory, sustainability, board, IR, crisis, innovation).

**Gate:** 5.4 + founder approval
**Authority class:** E
**Acceptance:** ~1,350 patterns committed; total corpus ≥5,200 patterns across ≥60 super-cats and ≥300 packs
**Parallel-OK:** No

### 5.6 — Consolidated overlay file
**Scope:** Merge waves into `RETAIL_OVERLAY_v1_CONSOLIDATED.md`. Generate JSON manifest.

**Gate:** 5.5
**Authority class:** B (mechanical merge)
**Acceptance:** Single canonical retail overlay file
**Parallel-OK:** No

---

## Section 6 — Packet 35 Phase 3 (Retail Corpus Validation)

### 6.1 — Load + embed + Azure-store retail overlay
**Scope:** Run extraction → schema validation → Voyage embeddings → Azure load per Packet 35 §6.1 Steps 1-4. Tag `overlay_namespace = 'retail-v1'`. Subscribe Apex tenant via `tenant_overlay_subscriptions`.

**Reference:** Packet 35 §6.1
**Gate:** 5.6
**Authority class:** E (DB write at scale)
**Acceptance:** ≥5,500 retail-overlay chunks loaded; embeddings 100%; integrity verified
**Parallel-OK:** No

### 6.2 — Coverage contract integration
**Scope:** Update `src/lib/knowledge/coverage.ts` (built in 4.1) with retail-specific question categories. Each retail category declares required overlay packs.

**Gate:** 6.1
**Authority class:** D
**Acceptance:** Every retail Tier-1 category has ≥3 required overlay packs; coverage tests pass
**Parallel-OK:** No

### 6.3 — Retrieval smoke
**Scope:** 25 retail-CXO questions through `/api/intelligence/ask` as `cio@apex-retail.example.com`. Each must show ≥3 retail-overlay chunks + ≥2 pattern citations.

**Gate:** 6.2
**Authority class:** A (verification)
**Acceptance:** ≥22/25 questions show overlay grounding
**Parallel-OK:** No

### 6.4 — Expert-consultant 5-test gauntlet
**Scope:** Run the 5 tests from Packet 35 §6.1 Step 7:
1. Vocabulary fluency (shrink/ORC/self-checkout)
2. Vendor landscape depth (Manhattan vs Oracle vs IBM Sterling vs Salesforce vs Commerce Cloud)
3. Time-horizon awareness (seasonal cycles, Q3-vs-Q1 decisions, budget windows)
4. Peer benchmarking specificity (anonymized peer references with $ ranges + timeframes)
5. Counter-intuitive reasoning (≥3 substantive counter-arguments to "why might X be wrong")

**Gate:** 6.3
**Authority class:** A
**Acceptance:** ≥4/5 tests pass — Sentinel certified expert-retail-consultant grade
**Parallel-OK:** No — major milestone

### 6.5 — Cross-tenant isolation verification
**Scope:** Confirm SkyHarbor Sentinel does NOT retrieve retail overlay; Apex Sentinel does NOT retrieve airline overlay. RLS-tag isolation enforced. Per Packet 31 I9.

**Gate:** 6.4
**Authority class:** A
**Acceptance:** Zero leak in either direction
**Parallel-OK:** No

### 6.6 — Validation report
**Scope:** Produce `verification/retail-overlay-v1/VALIDATION_REPORT.html` covering Steps 6.1-6.5.

**Gate:** 6.5
**Authority class:** A
**Acceptance:** HTML report committed; founder reviews
**Parallel-OK:** No

---

## Section 7 — Packet 35 Phase 4 (Apex Foundation Training)

### 7.1 — Apex substrate refresh
**Scope:** Per Packet 32 C1 Phase C — refresh Apex tenant substrate to match Phase 3 coverage contract. Use Packet 28 generator. Author missing segments. Verify with Packet 30 Phase 4 verifier.

**Reference:** Packet 32 §C1 Phase C + Packet 28
**Gate:** 6.6
**Authority class:** E
**Acceptance:** All 15 substrate segments populated; Apex Tier-1 verifier ≥22/25
**Parallel-OK:** No

### 7.2 — Apex tenant config
**Scope:** Update tenant config per Packet 31 §2.4 to declare `patternOverlays: ['core', 'retail-v1']`. Confirm subscription works.

**Gate:** 7.1
**Authority class:** D
**Acceptance:** Tenant config commits; smoke shows retail overlay reachable
**Parallel-OK:** Yes

### 7.3 — Apex verifier baseline
**Scope:** Run Apex-shaped 25-question Tier-1 verifier (retail-CXO question set, NOT SkyHarbor airline/IBM set). Capture baseline.

**Gate:** 7.2
**Authority class:** A
**Acceptance:** ≥22/25 on three consecutive runs; documented baseline
**Parallel-OK:** No

---

## Section 8 — Packet 32 P0 Work (Parallel-OK with Sections 4-7)

These run alongside the Packet 30 / 35 critical path. Sequenced internally but not blocking 34 execution.

### 8.1 — C12 thumbs up/down on Sentinel answers
**Scope:** Wire thumbs up/down feedback on Sentinel answers per Packet 32 C12 spec. Feeds continuous learning loop later.

**Authority class:** D
**Acceptance:** Feedback persisted; admin view shows aggregate
**Parallel-OK:** Yes

### 8.2 — C8 Phase 1 — 404 remediation
**Scope:** Per Packet 32 C8 — crawl every route, classify working / stub / 404 / inconsistent. Fix demo-critical 404s; stub the rest cleanly.

**Authority class:** D
**Acceptance:** Zero 404s in main demo flows for any of 5 canonical tenants
**Parallel-OK:** Yes

### 8.3 — C6 Phase 1 — Observability foundation
**Scope:** Per Packet 32 C6 Phase 1 — structured logs with tenant context; tenant-bleed alert wired and tested with simulated cross-tenant query.

**Authority class:** D
**Acceptance:** Alert fires on simulated cross-tenant attempt; production logs include tenant context
**Parallel-OK:** Yes

### 8.4 — C13 Security baseline
**Scope:** Activate Defender for Cloud in production Azure; weekly vulnerability scanning enabled.

**Authority class:** D (infra config, not code)
**Acceptance:** Defender active; weekly scan report generated
**Parallel-OK:** Yes

### 8.5 — C9 PHS compliance schema (HIPAA / BAA tracking)
**Scope:** Tenant config compliance schema; BAA execution date tracking; HIPAA risk assessment template.

**Authority class:** D
**Acceptance:** Schema in tenant config; PHS pilot will use when signed
**Parallel-OK:** Yes

### 8.6 — C4 Phase 1 read-only customer admin
**Scope:** Per Packet 32 C4 Phase 1 — `/admin/customer` routes (read-only): audit log, user list, AI egress audit, cost/usage dashboard, substrate inventory.

**Authority class:** E (new routes, RBAC)
**Acceptance:** All read-only routes functional with cross-tenant isolation
**Parallel-OK:** Yes

### 8.7 — C5 CSV upload connector
**Scope:** Per Packet 32 C5 — file upload UI + schema mapper + batch loader. End-to-end CSV → chunks → embedded → searchable.

**Authority class:** E (new feature)
**Acceptance:** CSV upload works end-to-end on demo tenant
**Parallel-OK:** Yes

### 8.8 — C7 Phase 1 prompt versioning
**Scope:** Per Packet 32 C7 Phase 1 — `src/lib/prompts/` directory; one file per agent prompt with semver naming; active version selected by config.

**Authority class:** D
**Acceptance:** Sentinel prompt versioned; regression test pairs prompt to expected citations
**Parallel-OK:** Yes

---

## Section 9 — Packet 34 (Comprehensive Browser Crawl Session) with Amendment B

This is the major demo-readiness milestone. **Gated on Section 7 (Apex foundation training) closing.**

### 9.1 — Pre-Act 0 — Artifact Framework Audit
**Scope:** Per Packet 34 Amendment B §"Pre-Act 0". Inventory the artifact framework (`src/lib/artifact-excellence/`, `src/lib/deliverables/`, `src/lib/source/agent-generation/`, `src/lib/programs/board-artifacts/`). Coverage matrix. Gap analysis vs Packets 33+34. Document at `audit-artifacts/comprehensive-crawl-<DATE>/00-framework-audit/ARTIFACT_FRAMEWORK_INVENTORY.md`.

**Gate:** 7.3
**Authority class:** A (audit, read-only)
**Acceptance:** Inventory + gap analysis committed; founder reviews
**Parallel-OK:** No — informs whether 9.2 needs prerequisites

### 9.2 — Framework gap-filling (conditional)
**Scope:** If 9.1 surfaces material gaps (e.g., Intelligence-tier deliverable template missing), author the gap-filler templates per the existing template contract pattern (`charter.ts` as model).

Specific likely targets:
- `src/lib/deliverables/templates/executive_briefing_memo.ts`
- `src/lib/deliverables/templates/strategic_decision_paper.ts`
- `src/lib/deliverables/templates/quarterly_executive_memo.ts`

**Gate:** 9.1
**Authority class:** D (gap-fill against existing contract)
**Acceptance:** Each gap-filler template includes TOC, rubric, worked example; tests pass
**Parallel-OK:** No

### 9.3 — Apex Retail Acts 1-7 + 2B + 8 + 9
**Scope:** Per Packet 34 §5-§11 + Amendment B. Execute all acts against Apex tenant with universal artifact quality verification.

Acts: Setup (1), Intelligence 3 topics × 10 Qs (2), Intelligence-tier deliverable synthesis (2B), Moves + artifacts + enhancement (3), Business case + mobilization (4), SI sourcing (5), AMS/IMS sourcing (6), Tower review (7), Multi-format export validation (8), Founder faithfulness sampling (9).

**Reference:** Packet 34 + Amendment B
**Gate:** 9.2
**Authority class:** E (real persistence + artifact generation against production demo tenant)
**Acceptance:** All quality cards captured; ≥80% artifacts pass `board_circulation`; zero hard-fail codes triggered without explicit founder waiver
**Parallel-OK:** No

### 9.4 — Apex HTML walkthrough report
**Scope:** Generate `APEX_RETAIL_WALKTHROUGH_REPORT.html` per Packet 34 §12 + Amendment B §"Updated HTML report" — including Artifact Quality Scorecard and Framework Validation Verdict.

**Gate:** 9.3
**Authority class:** A
**Acceptance:** Report renders cleanly; founder reviews
**Parallel-OK:** No

### 9.5 — SkyHarbor Retail Acts 1-7 + 2B + 8 + 9
**Scope:** Same as 9.3 against SkyHarbor tenant. (Re-uses learnings from Apex execution.)

**Gate:** 9.4
**Authority class:** E
**Acceptance:** Same as 9.3
**Parallel-OK:** No

### 9.6 — SkyHarbor HTML report + Cross-tenant summary
**Scope:** SkyHarbor walkthrough report + `COMPREHENSIVE_CRAWL_SUMMARY.html` comparing both tenants.

**Gate:** 9.5
**Authority class:** A
**Acceptance:** Both reports committed; founder reviews
**Parallel-OK:** No — final milestone

---

## Section 10 — Operating Model Updates (continuous)

### 10.1 — Packet 31 §4.10 trust ladder progression
**Scope:** Codify Codex's earned class D auto-merge during business hours. Update Packet 31 §4.10 with explicit progression note: "2026-05-29 — Codex advanced from class C auto / class D-review-then-merge to class D auto during business hours, based on incident-free runtime through Phase 0D + production hotfix discipline."

**Authority class:** Founder authors (Claude drafts)
**Acceptance:** Packet 31 §4.10 updated; committed
**Parallel-OK:** Yes — any time

### 10.2 — Session decisions log
**Scope:** Stand up `docs/architecture/session-decisions/INDEX.md` with rolling quarter entries. Backfill 2026-05-27 → 2026-05-29 entries (Packets 30-35, ADR-0001 + A1, I9 + I10, Phase 0D close, Vercel migration gate). Future Codex sessions append; future Series A due diligence reviews.

**Authority class:** B (documentation scaffold)
**Acceptance:** Index + Q2 2026 file with backfilled entries
**Parallel-OK:** Yes

### 10.3 — Packet 31 §1.4 update — artifact framework canonical
**Scope:** Declare `src/lib/artifact-excellence/cxo-artifact-excellence-framework.ts` as the single-source-of-truth for artifact quality standards. Add to §1.4 declarations table.

**Authority class:** D
**Acceptance:** §1.4 updated
**Parallel-OK:** Yes

### 10.4 — Pre-existing typecheck blocker triage
**Scope:** The `@azure/*`, `pptxgenjs`, `@resvg/resvg-js` missing optional packages. Decide: install, deprecate the code that imports them, or pin in dev dependencies. Document the decision.

**Authority class:** D
**Acceptance:** Full `tsc` runs clean OR documented suppression with rationale
**Parallel-OK:** Yes

---

## Section 11 — Strategic Forward Planning (queued, not active)

These are queued for after Section 9 closes (Apex demo-ready end-to-end).

### 11.1 — Packet 36 healthcare-provider overlay
**Scope:** Apply the Packet 35 methodology to author healthcare-provider overlay for PHS pilot. Target ~150 packs / ~2,500 patterns.

**Gate:** 9.6 + PHS commercial signal
**Authority class:** E
**Parallel-OK:** N/A — future work

### 11.2 — Packet 33 K05 multi-format completion
**Scope:** Whatever Amendment B Pre-Act 0 surfaces as missing format support. Likely targeted gap-fill (e.g., one missing export path).

**Gate:** 9.1
**Authority class:** D
**Parallel-OK:** Yes

### 11.3 — Phase 6 e2e validation for non-SkyHarbor canonical tenants
**Scope:** Run Packet 34 against Meridian (healthcare provider), Northstar (healthcare medtech), First Capital (banking) once retail overlay validates and the Apex run proves the methodology. Lower priority because healthcare/banking overlays don't exist yet.

**Gate:** 11.1 (or healthcare overlay for Meridian/Northstar; banking overlay for First Capital)
**Authority class:** E
**Parallel-OK:** N/A — future

### 11.4 — PHS pilot SOW v3 / Delta SOW
**Scope:** Founder + Claude work; not Codex scope. Updates customer commercial artifacts based on Phase 0D learnings (5 canonical tenants, BYOC path, T3/T4 tier framework).

**Authority class:** Founder
**Parallel-OK:** N/A

---

## Critical Path Summary

```
[1.1, 1.2, 1.3]  ───┐
                    │
[2.1] Phase 0B ─────┴───→ [2.2] Phase 0C audit
                                    │
                          ┌─────────┴─────────┐
                          ↓                   ↓
                  [3.1] Phase 2C       [Section 8 P0 work runs parallel]
                          ↓
                  [3.2] Phase 2D
                          ↓
                  [3.3] Migration script Supabase cleanup
                          ↓
                  [4.1] Coverage Contract
                          ↓
                  [4.2] Verifier Rebuild
                          ↓
                  [4.3] Partial-Evidence Policy
                          ↓
                  [4.4] E2E Validation (5 canonical tenants)
                          ↓
                  [4.5] Demo Readiness Certificate
                          ↓
                  [Section 5] Retail Corpus Wave 1-5
                          ↓
                  [Section 6] Retail Corpus Validation
                          ↓
                  [Section 7] Apex Foundation Training
                          ↓
                  [9.1] Framework Audit
                          ↓
                  [9.2] Framework Gap-Filling (if needed)
                          ↓
                  [9.3] Packet 34 Apex Execution
                          ↓
                  [9.4] Apex HTML Report
                          ↓
                  [9.5] Packet 34 SkyHarbor Execution
                          ↓
                  [9.6] Final cross-tenant report — MILESTONE
```

---

## Authority class quick reference (per Packet 31 §4.3 + 2026-05-29 trust update)

| Class | Examples | Codex authority |
|---|---|---|
| **A** | Status posts, audit docs, validation | Auto |
| **B** | Routine refactor, typos, doc scaffolds | Auto |
| **C** | Single-file bug fix with regression test | Auto |
| **D** | Feature within architecture, behind flag, prompt updates, infra config | **Auto during business hours** (NEW 2026-05-29) — review post-merge if needed |
| **E** | Architecture-affecting, new module, ADR-class | PR open, founder approves before merge |
| **F** | Cross-tenant impact, RLS changes | ADR + threat model + founder + on-call notice |
| **G** | Production data destruction, migration that drops tables | Per-change explicit approval; never standing |

**Escalation rules unchanged:**
- R8 — three-attempt rule (stop, report blocker)
- R9 — founder-unavailable autoproceed after 24 hours for class D and below
- Time-boxing — 90 min diagnosis, 4 hr prototype, then re-plan

---

## Status update cadence

Codex posts at:
- Start of each Section (plan)
- End of each Section (results + next gate)
- Start + end of each Packet 35 wave (founder review point)
- Any time R8 escalates
- Any time class E/F/G surfaces

**Format every status post as:**

```
CLOSED: [items just completed]
NEXT: [item starting]
GATE: [what must close before next]
RISKS: [anything surfaced]
```

---

## Definition of "this backlog is closed"

When all of these are true:
- [ ] Sections 1-3 closed (residuals + Phase 0 + Phase 2)
- [ ] Section 4 closed (Packet 30 Phases 3-7 + Demo Readiness Certificate)
- [ ] Section 5 closed (retail corpus authored, ~5,500 patterns)
- [ ] Section 6 closed (validation + expert-consultant gauntlet ≥4/5)
- [ ] Section 7 closed (Apex foundation trained, verifier ≥22/25)
- [ ] Section 8 P0 items closed
- [ ] Section 9 closed (Apex + SkyHarbor Packet 34 walkthroughs + final report)
- [ ] Section 10 operating model updates committed
- [ ] Section 11 surfaced for founder strategic review

**Then:**
- AbarVa is demo-ready for Delta CTO
- AbarVa is pilot-ready for PHS
- The retail overlay is a reusable asset for any future retail customer
- The artifact framework has been end-to-end validated
- The platform multi-tenant architecture is procurement-defensible

---

## Document control

- **Version:** v1
- **Date:** 2026-05-29
- **Owner:** Anand (founder) + Claude (drafting) + Codex (execution)
- **Refresh:** When any major milestone closes OR when scope materially changes
- **Companion:** Packets 28-35 + ADR-0001 (with A1) + Packet 31 amendments (I9/I10)

---

*End of Master Backlog. Codex begins at Section 1 next session start.*
