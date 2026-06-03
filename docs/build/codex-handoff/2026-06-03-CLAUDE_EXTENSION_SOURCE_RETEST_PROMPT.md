# Claude Extension Prompt — Source Module Final Retest

Paste everything below into Claude-in-Chrome and let it execute the full retest.

---

You are an expert **VP of IT Sourcing** and an **Independent L6 QA Auditor**. You are testing the AbarVa **Source** module as if you are about to use it for a real sourcing event, not a demo.

Your job is to run a **strict end-to-end confirmatory retest** of the live production build and determine whether Source is now ready for a **GO**, **CONDITIONAL GO**, or still a **NO-GO**.

## Environment

- URL: `https://app.abarva.ai`
- Primary tenant/persona: **Apex Retail**
- Primary user: `cio@apex-retail.example.com` / Carlos Rivera / CIO Office
- Primary event slug: `apex-retail-ams-outsourcing-2026`
- Primary event name: **Apex Retail AMS Sourcing Event**
- Secondary seeded event: **AMS Outsourcing 2026** / `SRC-004`
- Browser: Chrome with extension automation
- Capture screenshots, console, network, DOM observations, and download behavior

## Critical instruction

This is a **load-bearing retest**, not a fresh exploratory audit.

You must explicitly evaluate the fixes that were supposed to land, then run the executive-quality workflow checks.

If any **load-bearing regression** appears, stop and flag it immediately.

## Scenario

You are a newly joined VP of IT Sourcing at Apex Retail. The IT VP has already defined the business need:

- optimize the AMS portfolio
- reduce run cost
- normalize pricing across vendors
- improve SLA accountability
- pressure-test BAFO negotiation leverage
- prepare executive decision artifacts

You enter after the use case is defined. You now test whether AbarVa Source can actually support the sourcing workflow and produce auditable outputs.

## Required retest structure

Run the following sections in order.

---

## Section A — Load-bearing retest checks

### A.1 Strategy Memo generation
1. Open `/source/events/apex-retail-ams-outsourcing-2026?stage=strategy`
2. Click **Generate with Sentinel** on `d01_strategy_memo`
3. Verify:
   - no HTTP 500
   - no UUID/slug error
   - generated content appears
   - content is AMS-specific
   - clear AI Draft / Human Review labeling exists

**FAIL immediately if:**
- network response returns 500
- response body includes `invalid input syntax for type uuid`
- generation silently fails

### A.2 Additional generation surfaces
Test generation on these artifact surfaces if available:
- `d09_rfp_pack`
- `d22_bafo_question_pack`
- executive brief equivalent if the stage is reachable

Record whether the generation surface works or is correctly unavailable due to stage lock.

---

## Section B — Artifact export and persistence

### B.1 Strategy Memo export
After generating the Strategy Memo:
- test HTML render
- test PDF download
- test DOCX download

Verify:
- correct HTTP status
- correct content type
- artifact content is tenant-specific
- artifact is not blank

### B.2 Generated memo persistence
After successful generation:
- verify whether the generated memo appears in **Stored documents**
- navigate away and back
- confirm whether it persists as a DB-backed document

This is a key audit question. Do not assume persistence because the body is visible.

### B.3 CXO Report / Deal Pack / PPTX behavior
Test:
- CXO Report HTML
- PPTX endpoint
- Deal Pack endpoint

Pass criteria:
- HTML opens correctly
- PPTX returns either a real file or a structured non-crashing response
- Deal Pack returns either a real file or a structured non-crashing response

Fail criteria:
- raw 500 / 503 without structured explanation
- redirect loop
- silent no-op

---

## Section C — Gate / approval / audit-trail behavior

### C.1 Strategy gate enforcement
At Strategy stage:
- inspect gate criteria
- verify stage promotion is blocked when unmet
- verify reason field and confirmation behavior

### C.2 Approval UX
Test Approve / Promote behavior with:
- empty reason
- reason present

Check:
- disabled state
- inline validation
- whether a real API call fires
- whether the action produces a durable audit record

### C.3 Self-approval handling
You have QA authority to self-approve for test purposes.

If you self-approve:
- verify whether the system visibly flags self-approval
- verify whether the log captures actor, timestamp, reason, and event/stage

Do **not** give credit for “nice UX” unless the log actually records it.

---

## Section D — Pricing / BAFO / outcome leverage

### D.1 Pricing stage rendering
Open the advanced event and inspect the Pricing stage.

Determine whether the stage:
- renders meaningful scaffold or content
- is empty
- uses virtual fallback correctly
- exposes user-facing rather than developer-facing messaging

### D.2 BAFO stage rendering
Do the same for BAFO.

Check specifically whether the system now avoids the prior “No artifacts scaffolded” dead-end behavior for partial legacy events.

### D.3 Savings proof quality
Do not accept asserted savings.

Look for:
- baseline
- normalized pricing
- TCO bridge
- scope adjustments
- transition cost handling
- negotiated delta
- evidence citations
- CFO-auditable math

State clearly whether savings are:
- **PROVEN**
- **PARTIALLY PROVEN**
- **NOT PROVEN**

---

## Section E — UI/UX clutter and executive trust

At every step, evaluate:
- whether the screen helps a VP Sourcing make the next decision
- whether internal/dev language leaks into UI
- whether buttons are misleading, inert, or ambiguous
- whether labels are sourcing-grade and buyer-readable
- whether AI chat dominates the workspace too much
- whether readiness / evidence counters are actionable

Specifically check whether these older problem patterns still exist:
- raw scaffold/dev instructions
- “seeded” or internal jargon in executive-facing copy
- duplicate rows in decision queue
- misleading placeholder verdicts
- silent failures

---

## Section F — Tenant isolation regression

This is a hard gate.

Test:
- `/source?client=skyharbor`
- `/source/events?client=meridian`
- `/tower?client=skyharbor`
- `/home?client=meridian`
- direct cross-tenant event URL if possible

Verify:
- param stripping or safe redirect
- no foreign-tenant data in visible UI
- no cross-tenant event access

**If cross-tenant event access returns 200 with foreign data or broken anti-enumeration behavior, mark as P0 regression immediately.**

---

## Section G — AI governance / liability controls

Verify all of the following:
- AI Draft labeling
- Human approval required language
- “AI may produce errors” disclaimer
- citation gap warnings where appropriate
- no “AI decided” language
- named human accountability
- clear separation of recommendation vs decision

Do not over-credit architecture. These controls only pass if visible and legible in the live UI.

---

## Section H — Chat robustness

Ask:
- “Which vendor looks strongest and why?”
- “Normalize buried pricing risks across vendors.”
- “What BAFO levers should I use?”
- “What evidence is still missing before I can claim savings?”

Verify:
- no truncation
- no incomplete answer
- no silent clipping
- citations or citation gap warnings
- complete rendering in the visible UI

If truncation still appears around prior observed lengths, record it as a live defect.

---

## Required output format

Produce a final audit memo with:

1. Environment
2. Executive verdict
3. What was explicitly retested
4. Pass/fail table for Sections A–H
5. Pricing / BAFO / savings-proof verdict
6. Gate / approval / audit-log verdict
7. Tenant isolation verdict
8. UI/UX clutter findings
9. Console/network findings
10. New issues found
11. What is now genuinely fixed
12. What is still deferred / not complete
13. Final score out of 10

## Verdict rules

Use this exact interpretation:

- **15/15 PASS** → declare **GO** at approximately **9.8/10**
- **13–14/15 PASS** → declare **CONDITIONAL GO** and treat residual failures as polish unless they affect load-bearing workflow
- **A.1 / A.2 / B.2 / B.3 / D.1 / D.2 FAIL** → load-bearing fix did not take; investigate immediately
- **F tenant isolation FAIL** → treat as **P0 regression**

## Final discipline

- Be strict.
- Be evidence-based.
- Do not award points for architecture that is not usable in the live app.
- Do not soften operational failures.
- If a critical fix holds, say so clearly.
- If it does not hold, stop pretending the build is ready.

---

When done, end with:

`FINAL VERDICT: GO`
or
`FINAL VERDICT: CONDITIONAL GO`
or
`FINAL VERDICT: NO-GO`

and one paragraph explaining why.
