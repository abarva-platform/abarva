# Packet 35 Phase 0D — Codex Execution Prompt (Tenant Canonicalization)

**Purpose:** Hand this prompt to Codex to execute the tenant canonicalization decided by founder 2026-05-29.

**Authority:** Class G (data destruction) pre-approved by founder for this Phase 0D scope only.

**Companion:** ADR-0001 Amendment A1, Packet 31 amendments (I9/I10/anti-pattern), Phase 0B (currently in flight on PRs #2409 + #2410).

---

## The Prompt

```
You are authorized to execute Packet 35 Phase 0D (Tenant Canonicalization)
with full Class G authority for this scope only. Class G authority does
NOT extend beyond this prompt; future destructive operations require
separate explicit approval.

AUTHORITY SOURCE:
  - This prompt (Class G one-time)
  - ADR-0001 Amendment A1 (industry vocabulary + Phase 0D declaration)
  - Packet 31 §4.3 authority matrix (D/E pre-approved per Phase 0)

READING ORDER:
  1. docs/architecture/adr/0001-canonical-pattern-storage.md
     (including Amendment A1 — read fully)
  2. docs/architecture/packet-31-amendments/2026-05-29-i9-i10-allowlist-drift.md
  3. docs/build/PACKET_35_RETAIL_ADJACENT_CORPUS_AUDIT_GENERATE_VALIDATE.md §2

CANONICAL TENANT LIST (post-Phase-0D state):
  1. apex-retail        industry=retail
  2. meridian-health    industry=healthcare_provider
  3. northstar-clinical industry=healthcare_medtech
  4. first-capital      industry=financial_services_banking
  5. skyharbor-air      industry=airline

TENANTS TO RETIRE:

A. brindlemark-financial — DUPLICATE OF first-capital → MERGE THEN HARD DELETE
B. helix-therapeutics — TEST/DRIFT ARTIFACT → HARD DELETE WITH ARCHIVE
C. keystone-energy-holdings — TEST/DRIFT ARTIFACT → HARD DELETE WITH ARCHIVE

EXECUTION ORDER:

STEP 1 — DIAGNOSTIC (read-only, 30 minutes)
  For each of the 3 retiring tenants, capture:
    - Clerk org ID + active user list + last login activity
    - clients table row state (full row dump)
    - Substrate content count in enterprise_context_chunks
    - Pattern subscriptions in tenant_overlay_subscriptions
       (or equivalent current table name)
    - ai_egress_audit activity in last 30 days
    - Any rows in other tenant-scoped tables (programs, moves, source_events,
      etc.) — full enumeration
    - For brindlemark specifically: identify any data that does NOT exist
      under first-capital and would need migration vs is purely duplicate

  Output: verification/phase-0d/NON_CANONICAL_TENANT_DIAGNOSTIC.md

  STOP after diagnostic. Founder reviews findings before STEP 2 starts.

STEP 2 — FOUNDER REVIEW GATE
  Wait for founder confirmation that the diagnostic findings are
  expected (no surprise data in retiring tenants).

  If diagnostic reveals real user activity, real substrate, or
  non-duplicate data in any retiring tenant — STOP immediately and
  escalate. Class G authority is for clean retirement, not surprise
  data loss.

STEP 3 — BRINDLEMARK MERGE (if any non-duplicate data exists)
  If diagnostic shows brindlemark holds any data not already present
  in first-capital:
    a. Reassign the data to first-capital tenant key (preserve content,
       update foreign keys)
    b. Verify first-capital queries surface the migrated content
    c. Document the merge in
       verification/phase-0d/BRINDLEMARK_MERGE_LOG.md

  If brindlemark is pure duplicate (likely case):
    - Skip merge, proceed directly to STEP 4 for brindlemark

STEP 4 — ARCHIVE + HARD DELETE PER TENANT

  Execute the following per retiring tenant (brindlemark, helix, keystone):

  4.A — Archive
    Export full state to verification/phase-0d/archives/<tenant-key>-<timestamp>/
    contents:
    - clients table row
    - enterprise_context_chunks rows (full content)
    - tenant_overlay_subscriptions rows
    - All rows from any other tenant-scoped tables
    - Clerk org export (users, roles, sessions)
    - ai_egress_audit rows
    Archive is the audit floor. Never deleted from this point forward.

  4.B — Verify archive integrity
    Re-read the archive. Count matches diagnostic counts.

  4.C — Hard delete
    Execute in order (foreign-key safe):
    1. ai_egress_audit rows for tenant
    2. tenant-scoped data in: programs, moves, source_events, etc.
    3. tenant_overlay_subscriptions rows
    4. enterprise_context_chunks rows scoped to this tenant
    5. clients row
    6. Clerk org (after DB cleanup confirmed)

  4.D — Orphan check
    For each table that could have tenant references, query for any
    remaining rows referencing the retired tenant_key. Expected: zero.

  4.E — Release record per tenant
    docs/releases/records/2026-05-29-phase-0d-retire-<tenant-key>.md
    With ## Audit Evidence section per Packet 31 §1.2 I8.

STEP 5 — I10 ALLOWLIST IMPLEMENTATION
  Create src/config/tenants/CANONICAL_TENANTS.ts per the spec in
  docs/architecture/packet-31-amendments/2026-05-29-i9-i10-allowlist-drift.md
  §I10 Implementation.

  Add CI drift detection job per the spec in same file.

  Test:
    - Allowlist contains exactly 5 entries
    - Drift detection SQL returns empty against post-Phase-0D production
    - PR adding a 6th entry without ADR reference fails CI

STEP 6 — INDUSTRY VOCABULARY UPDATE
  Per ADR-0001 §A1.1:
    - Update controlled vocabulary in corpus_patterns.industry enum (or
      check constraint) to include healthcare_provider, healthcare_medtech,
      financial_services_banking, financial_services_insurance
    - Migrate existing rows tagged healthcare → split per §A1.3:
        * Patterns originating from Packet 22 Northstar overlay → healthcare_medtech
        * All other current healthcare patterns → healthcare_provider
    - Update tenant clients.industry_code per §A1.2

  Verify: each canonical tenant's industry_code matches §A1.2 exactly.

STEP 7 — FULL POST-PHASE-0D VERIFICATION
  Verification matrix (replaces the 8-tenant matrix referenced in earlier
  Phase 0B plans):

  For each of 5 canonical tenants:
    - Sign in as primary persona
    - Ask one tenant-specific question
    - Inspect source payload
    - Confirm sources scoped to tenant's industry + cross_industry only
    - Confirm zero sources from any other tenant or any retired tenant

  Cross-tenant isolation stress (per Packet 30 Phase 6 §6):
    - Sign in as Apex CIO; attempt prompt injection to retrieve SkyHarbor data
    - Expected: zero airline patterns surface
    - Repeat for each pair (5×4 = 20 attempts)
    - Expected: 20/20 attempts return zero cross-tenant data

  Document: verification/phase-0d/POST_PHASE_0D_VERIFICATION_REPORT.md

STEP 8 — UPDATE PACKET 31 §1.2 INVARIANTS TABLE
  Add I9 and I10 rows per the amendment file:
    docs/architecture/packet-31-amendments/2026-05-29-i9-i10-allowlist-drift.md

  Add the anti-pattern entry per §1.5.

  Add the §4.4 universal-verification rule.

  Commit the Packet 31 update.

OUT-OF-SCOPE FOR THIS PROMPT:
  ❌ I9 ESLint guard implementation — separate slice (covered in Phase 0B)
  ❌ I9 regression test — separate slice (Phase 0B)
  ❌ Retail corpus generation (Packet 35 Phase 2 Waves 1-5)
  ❌ Apex substrate refresh
  ❌ Packet 34 execution
  ❌ Any class G operations beyond the three retiring tenants

ESCALATION:
  - Any retiring tenant shows surprise activity → STOP, escalate
  - Brindlemark merge surfaces data founder didn't expect → STOP, surface
  - Orphan check reveals references that can't be cleaned → STOP, surface
  - Hard delete fails partway through → ROLLBACK from archive, escalate
  - Any canonical tenant smoke fails after vocabulary update → STOP, escalate

CADENCE:
  - Status post after STEP 1 diagnostic complete (founder reviews)
  - Status post after STEP 3 merge complete (if executed)
  - Status post after each STEP 4 tenant retirement
  - Status post after STEP 5 I10 allowlist live
  - Status post after STEP 7 verification report
  - Final status when Phase 0D closure summary posted

DEFINITION OF DONE (Phase 0D closes when all true):
  □ Diagnostic report committed (STEP 1)
  □ Founder confirmation received (STEP 2)
  □ Brindlemark merged if needed (STEP 3)
  □ Three tenants archived + hard-deleted (STEP 4 × 3)
  □ Three release records committed
  □ CANONICAL_TENANTS.ts in place (STEP 5)
  □ CI drift detection job active and green
  □ Industry vocabulary updated, all rows reclassified (STEP 6)
  □ Post-Phase-0D verification report green (STEP 7)
  □ Packet 31 §1.2 / §1.5 / §4.4 updated (STEP 8)
  □ Final closure summary posted

Begin with STEP 1 diagnostic. STOP at STEP 2 founder gate.
```

---

## What I'm watching for in the diagnostic status post

When Codex completes STEP 1 and pings for founder review, three signals:

### Signal 1 — Are the retiring tenants genuinely dormant?
- Zero active users
- Zero recent login activity (last 30 days)
- Zero recent egress
- Minimal or zero substrate content

If yes → straightforward retirement, proceed to STEP 3+

### Signal 2 — Is Brindlemark genuinely a duplicate?
- Same user roster as First Capital?
- Same substrate content?
- Pattern subscriptions point at the same overlays?

If yes → skip merge, hard-delete

If Brindlemark has any unique content → founder classifies whether to migrate or discard

### Signal 3 — Are there surprises?

The R8 escalation case. If diagnostic surfaces:
- A retiring tenant with real user activity
- A retiring tenant with a substantial substrate (>50 chunks)
- Foreign-key chains to retiring tenants that aren't documented
- Any sign the "test/drift artifact" classification is wrong

→ STOP, escalate, reassess before destruction

---

## Sequencing note vs Phase 0B

Phase 0D can run in parallel with Phase 0B, but two coordination points:

1. **Phase 0B's regression test scope must update.** When Phase 0B's industry-scoping fix lands, the regression test matrix expects 5 tenants, not 8 (per the I9 amendment). Coordinate timing so the regression test doesn't reference tenants Phase 0D just deleted.

2. **Industry vocabulary update (STEP 6) must precede Phase 0B's final regression run.** If Phase 0B regression runs with `healthcare` as the industry but Phase 0D has split to `healthcare_provider` / `healthcare_medtech`, the test will fail spuriously. Easiest sequencing: STEP 6 happens before Phase 0B regression. Codex can fold this into the same execution thread.

---

## What's pending after Phase 0D closes

In sequence:

1. **Phase 0B closes** (industry-scoping fix + universal verification) — already in flight on PRs #2409/#2410
2. **Phase 0C audit document** — updated audit query runs against the now-clean canonical schema
3. **Phase 0 closure summary** — combined report
4. **Phase 1 audit** per Packet 35 §2 (already largely covered by 0C)
5. **Phase 2 Wave 1** — retail corpus generation begins (5,500 patterns target)
6. **Wave 2-5** — paced by founder review cadence
7. **Phase 3 validation gauntlet** — the 5-test expert-consultant check
8. **Apex substrate refresh** per Packet 32 C1
9. **Packet 34 comprehensive browser crawl**

Each gate dictates pace. Phase 0D + 0B closure is the immediate unblock.

---

## The bigger picture

In one founder session, you systematically caught and queued fixes for four structural drift gaps:

| Gap | Surfaced via | Closing via |
|---|---|---|
| Storage drift (3 pattern tables) | 2026-05-29 DB audit | ADR-0001 |
| Industry filter drift (Apex retrieval bug) | Phase 0A diagnostic | I9 + Phase 0B |
| Tenant duplication (8 vs 5) | Founder asked the right question | I10 + Phase 0D |
| Healthcare sub-vertical collapse (provider vs medtech) | Founder defined Northstar mimics Solventum | ADR-0001 Amendment A1 |

All four are instances of "drift via implicit allowlist" — the anti-pattern catalog entry now codifies it. **The pattern is named. The discipline is documented. Future Codex sessions inherit the rule.** That is the operating model compounding the way Packet 31 §4.10 envisioned.

---

Ready for hand-off to Codex once the branch pushes.
