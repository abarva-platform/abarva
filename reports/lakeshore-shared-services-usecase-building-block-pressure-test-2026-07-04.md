# Lakeshore Shared-Services — Solution Building-Block Pressure Test

**Date:** 2026-07-04 · **Scope:** 30 corporate shared-services use cases across 6 functions · **Purpose:** validate that AbarVa's Moves "solution building blocks" model scales across many real use cases *without* enumerating endless archetypes and *without* forcing each Move into one misleading archetype.

Machine-readable output: `proof/lakeshore-shared-services-usecase-building-block-pressure-test-2026-07-04/usecase-pressure-test.json` and `.csv`.

---

## 1. Executive verdict

**The model holds. The concept passed; the supporting machinery is where the work is.**

- **All 30 use cases composed cleanly into a bundle of building blocks** — average bundle size **5.0** blocks, every case within the 3–6 target. **Zero cases over-selected (>6) or collapsed to one archetype.** The core worry — "too many blocks / one misleading archetype" — did **not** materialize.
- **Overall quality 4.15 / 5**; every use case scored **≥ 3.0**. The model consistently answered all seven required questions (problem, work-change, blocks, evidence, safe-now-vs-later, phase-1, later phases) for functions as different as Legal, Treasury, and IT.
- **The failures the test was designed to find were NOT in the model's concept** — they are in the **product machinery around it**: P2 has no per-function evidence contract, P3 has no building-blocks canvas, P4 doesn't convert blocks → workstreams, and ~7 control/lifecycle primitives are missing as first-class concepts.
- **Bottom line:** lock the 10-block model. Fund the P2/P3/P4 hardening and the missing primitives before scaling beyond the Legal (and AP) demos.

| Function | Avg score | Use cases |
|---|---|---|
| IT / Shared Services | 4.35 | 5 |
| Procurement / Vendor Management | 4.22 | 5 |
| Finance / AP / Treasury | 4.15 | 5 |
| HR / People Operations | 4.15 | 5 |
| Security / Risk / Compliance | 4.07 | 5 |
| Legal | 3.93 | 5 |
| **All** | **4.15** | **30** |

*(Legal's lower average is a feature of the test, not a weakness of Legal: it includes the deliberately-thin "outside-counsel intake" case that we scored low to prove the model surfaces sparse-evidence risk rather than over-generating confident structure.)*

## 2. Method

Six independent assessments (one per function), each pressure-testing 5 Lakeshore corporate shared-services use cases against the 10-block model. For each use case: business outcome, current-state work problem, phase-one approach, selected blocks, blocks-not-yet (with reason), required P2 evidence, P2/P3/P4/P5 focus, Tower metrics, controls, stakeholders, "what good looks like," risks/traps, demo- and product-readiness, gaps in the current Moves model, and 8 quality scores (1–5). Scoring is expert design judgment, not measured outcomes. Language kept client-friendly; no internal engineering jargon.

## 3. The 10 reusable solution building blocks

1. Process redesign · 2. Data readiness / remediation · 3. Knowledge / retrieval copilot · 4. AI-assisted decision support · 5. Workflow automation · 6. Human-in-the-loop agent · 7. Analytics / intelligence layer · 8. System / platform implementation · 9. Controls / governance / risk model · 10. Value tracking / operating cadence.

**How often each was *selected* (of 30) vs. *held back* ("not yet"):**

| Block | Selected | Held "not yet" |
|---|---:|---:|
| Human-in-the-loop agent | 23 | 4 |
| Value tracking / operating cadence | 23 | — |
| Controls / governance / risk | 21 | 5 |
| Knowledge / retrieval copilot | 18 | — |
| Workflow automation | 15 | 15 |
| Process redesign | 14 | — |
| Data readiness / remediation | 14 | 3 |
| Analytics / intelligence layer | 12 | 8 |
| AI-assisted decision support | 11 | 15 |
| System / platform implementation | ~4 | **20** |

**Reading:** the model's instincts are healthy. **Human-in-the-loop, value tracking, and controls are near-universal** (the "AI assists, humans decide, and we measure it" thesis). **System/platform implementation and AI-assisted decision support are the most-deferred** — the model consistently refuses to re-platform or hand judgment to AI in phase one. That is the `ambition ≤ readiness` guardrail working in practice.

## 4. All 30 use cases assessed

| # | Function | Use case | Blocks | Demo | Prod | Avg |
|---|---|---|---:|---:|---:|---:|
| 1 | Legal | Contract intake and obligation control | 6 | 5 | 4 | 4.88 |
| 2 | Legal | Contract search / clause Q&A | 3 | 5 | 3 | 3.88 |
| 3 | Legal | Renewal and notice tracking | 5 | 4 | 3 | 4.00 |
| 4 | Legal | Policy exception review | 4 | 4 | 3 | 3.88 |
| 5 | Legal | Matter and outside-counsel intake and triage | 5 | 3 | 2 | 3.00 |
| 6 | Finance/AP/Treasury | Invoice exception reduction | 5 | 5 | 4 | 4.62 |
| 7 | Finance/AP/Treasury | Vendor payment status deflection | 5 | 5 | 4 | 4.12 |
| 8 | Finance/AP/Treasury | Month-end close issue tracking | 5 | 4 | 4 | 4.00 |
| 9 | Finance/AP/Treasury | Treasury cash forecast variance | 5 | 3 | 3 | 3.62 |
| 10 | Finance/AP/Treasury | Duplicate/erroneous payment prevention | 5 | 4 | 4 | 4.38 |
| 11 | IT/Shared Services | Service desk deflection | 5 | 5 | 4 | 4.50 |
| 12 | IT/Shared Services | Application access request automation | 5 | 4 | 3 | 4.12 |
| 13 | IT/Shared Services | Incident summarization and routing | 5 | 5 | 4 | 4.38 |
| 14 | IT/Shared Services | Application portfolio rationalization | 5 | 4 | 4 | 4.25 |
| 15 | IT/Shared Services | Onboarding/offboarding orchestration | 5 | 4 | 4 | 4.50 |
| 16 | Procurement | Vendor intake and risk review | 5 | 5 | 4 | 4.62 |
| 17 | Procurement | SOW review and compliance | 5 | 5 | 4 | 4.62 |
| 18 | Procurement | Renewal pipeline intelligence | 5 | 5 | 3 | 4.12 |
| 19 | Procurement | Supplier performance insights | 5 | 4 | 3 | 3.88 |
| 20 | Procurement | Tail-spend / maverick-buying control | 5 | 4 | 3 | 3.88 |
| 21 | HR | HR case triage | 6 | 4 | 3 | 4.12 |
| 22 | HR | Job description generation and approval | 5 | 5 | 4 | 4.50 |
| 23 | HR | Employee policy Q&A | 5 | 5 | 3 | 4.25 |
| 24 | HR | Workforce onboarding task orchestration | 6 | 4 | 3 | 4.00 |
| 25 | HR | Leave and accommodation intake/status | 6 | 3 | 2 | 3.88 |
| 26 | Security/Risk | Access recertification support | 5 | 4 | 3 | 4.25 |
| 27 | Security/Risk | Policy attestation tracking | 5 | 5 | 4 | 4.62 |
| 28 | Security/Risk | Third-party risk evidence collection | 5 | 4 | 3 | 4.00 |
| 29 | Security/Risk | Control exception triage | 5 | 3 | 3 | 4.12 |
| 30 | Security/Risk | Regulatory change monitoring/routing | 5 | 4 | 3 | 3.38 |

Full detail (all fields per use case) is in the JSON/CSV.

## 5. Top 5 demo-ready use cases

| Rank | Use case | Function | Why |
|---|---|---|---|
| 1 | **Contract intake and obligation control** | Legal | Richest evidence, executive-friendly, safe with human-in-loop, clean metrics (avg 4.88) |
| 2 | **Invoice exception reduction** | Finance/AP | Metric-heavy, easy hard-dollar value story, deterministic first wins |
| 3 | **Vendor intake and risk review** | Procurement | Clear front-door redesign + human sign-off; visible risk value |
| 4 | **SOW review and compliance** | Procurement | Copilot-flags-deviations pattern reads well; ties to Source |
| 5 | **Policy attestation tracking** | Security/Risk | Cleanest evidence model (version-bound proof); highest evidence-clarity score |

*Also strong (4.5):* IT Service desk deflection, IT Onboarding/offboarding, HR Job-description generation. These confirm the buyer instinct that **Legal (#1) and AP (#2)** are the right first two recordings.

## 6. Top 5 use cases that reveal product gaps

| Use case | Function | Gap it exposes |
|---|---|---|
| **Matter and outside-counsel intake** | Legal | Thin evidence baseline → model over-generates confident structure on sparse data (ev 2, art 2) |
| **Regulatory change monitoring** | Security/Risk | No model of **continuous external-signal monitoring** with coverage/completeness as a tracked attribute (art 2) |
| **Treasury cash forecast variance** | Finance | Needs a **"explain-not-execute" liquidity boundary** and a defensible liquidity-risk view the model can't represent |
| **Contract search / clause Q&A** | Legal | No first-class **document-permission scoping** or verified answer-accuracy test set |
| **Supplier performance insights** | Procurement | **Data-remediation effort under-scoped**; no way to show/act on data-confidence so weak data isn't over-trusted |

## 7. Repeated evidence requirements by function (what to bake into P2)

Each function has a *predictable* evidence contract — this is the single biggest quick win for P2:
- **Legal** — contract/request logs with age & missing-field detail, obligation/exception registers, policy standards, source-system + access inventory, privilege/privacy rules.
- **Finance/AP/Treasury** — 12+ months of transaction/exception extracts with reason codes, vendor master + duplicate rules, tolerances & coding rules, forecast-vs-actual history, approval/routing rules.
- **HR** — case history with true category/owner, authoritative & current policy set (with effective dates), required legal language by jurisdiction, joiner/mover/leaver task sets, data-privacy rules.
- **IT** — ticket/incident history with categories & routing, knowledge-source inventory with owners/freshness, application/access catalog with risk tiers, audit findings, CMDB/usage data.
- **Procurement** — intake volumes & cycle times, standard-terms playbook & rate cards, contract inventory with renewal dates & spend, consolidated performance/spend data, screening-source coverage.
- **Security/Risk** — campaign calendars & populations, entitlement extracts, attestation rosters bound to policy versions, vendor evidence with expiry, exception/severity criteria, audit findings.

## 8. Repeated controls by function (what to make first-class)

Controls are remarkably consistent across all 30 — the model already reaches for the right ones:

| Control | Cited in |
|---|---:|
| Human sign-off / approval required | 48 |
| Audit trail | 25 |
| Access scoping / least privilege | 15 |
| Privilege / privacy / **medical** fence | 11 |
| No auto-action (never decide/execute) | 11 |
| Segregation of duties | 10 |

**Implication:** the "Controls/governance/risk" block should ship with a reusable **control matrix template** (human-approval gate, audit trail, SoD, access scope, protected-data tier, no-auto-action boundary) that every Move inherits and tailors.

## 9. Repeated Tower metrics (the reusable metric groups)

Across functions the metrics cluster into five reusable groups — this is the Tower metric taxonomy:
- **Process** — cycle time, aged/breached queue, first-pass yield, on-time completion.
- **Quality/completeness** — missing-field / intake-completeness rate, accuracy vs. verified sample, citation/currency rate.
- **Deflection/adoption** — deflection rate, auto-clear rate, adoption, escalation/reopen rate.
- **Control** — sign-off compliance, override/exception rate, audit-evidence retrieval time, coverage gap.
- **Value** — realized vs. projected, discount/savings captured, dollars prevented, buffer/rework reduced (with finance attestation).

## 10. Where Moves needs stronger P2/P3/P4 support

Three product features + seven missing primitives. This is the hardening backlog the test surfaced.

**The three phase features (your predicted gaps — confirmed):**
1. **P2 — a per-function evidence contract.** Every function's required uploads are predictable (§7) but the model treats evidence as generic "clean uploads." P2 should present the function-specific "here's exactly what to give us" list. *(18 of 30 cases flagged data/evidence under-scoping — the #1 gap.)*
2. **P3 — a "solution building blocks" canvas.** P3 should render: *for this Move, these blocks; phase one; later; not recommended yet (with reason).* The model composes bundles well but has no canvas to show them.
3. **P4 — convert blocks → workstreams.** Each selected block should become a named workstream with owner, evidence, controls, and metrics (data-readiness → remediation workstream, controls → approval matrix, value-tracking → Tower contract).

**The seven missing first-class primitives (ranked by frequency):**
1. **Data-readiness as a scoped, gating prerequisite *inside* the move** (18 cites) — not an assumption; size it before greenlight.
2. **Source/version currency, effective-date & provenance-per-fact** as a tracked quality gate (6) — Legal, HR, Procurement, Security.
3. **Recurring compliance campaign with a completion SLA** (distinct from a one-time deliverable) (6) — all of Security/Risk.
4. **Cross-OpCo / holdco ownership** — one vendor/policy/app, many owners; approver ambiguity (6).
5. **"Automation-stops-here" / answer-vs-decide boundary + confidence-threshold gating (suggest vs. defer)** as a control primitive (6+5) — IT, HR, Security.
6. **Value: planned-vs-realized + cross-surface (Moves/Source/Tower) attribution** to prevent double-counting (5).
7. **Requested → executed → verified state** for downstream remediation actions (3) — plus **protected-data (medical) as a distinct control tier** (HR).

## 11. Implications for the Lakeshore Legal demo

- **Contract intake and obligation control is the clear #1 (4.88).** It is executive-friendly, safe (human-in-loop), and — critically — the only case with a *deep, real* evidence pack (2,400 requests, 81.5% missing-field, 31.6-day avg age, 320 obligation gaps, 360 policy exceptions). **Record Legal first.**
- **It exercises 6 of the 10 blocks** (process, data, workflow, human-in-loop, controls, value tracking) — the ideal showcase for the *bundle* story, not a single archetype.
- **Second recording: AP invoice exception reduction (4.62)** — metric-heavy, easy hard-dollar value, deterministic quick wins. Best contrast to Legal's judgment-heavy story.
- **What the demo must not overreach on:** keep AI as assist (triage, extraction, status). Full contract review, autonomous decisions, and hard-dollar savings claims stay in "not yet / pending finance attestation." The model already frames this correctly — the demo should mirror it.

## 12. Recommended backlog

**Now (before scaling past Legal/AP):**
1. Build the **P2 per-function evidence contract** (§7) — biggest, cheapest win.
2. Build the **P3 building-blocks canvas** (recommended / phase-one / later / not-yet-with-reason).
3. Build **P4 block → workstream** conversion.
4. Ship the **Controls block as a reusable control-matrix template** (§8).
5. Ship the **Tower metric groups** (§9) as reusable metric sets.

**Next (the primitives, §10):** data-readiness-as-gating-prerequisite → source-currency/provenance quality gate → recurring-campaign-with-SLA → automation-stops-here + confidence gating → planned-vs-realized + cross-surface value attribution → cross-OpCo ownership → requested/executed/verified state + protected-data tier.

**Do not:** add more top-level building blocks (the 10 held across 30 diverse cases); attempt full agentic workflows for judgment-, medical-, payment-, or access-critical steps (§ below).

**Should NOT be attempted as full agentic workflows** (keep human-in-loop; full autonomy stays "not yet"): Leave & accommodation intake, Matter/outside-counsel intake, Application-access granting, Duplicate-payment release, Treasury cash movement, Control-exception approval, Policy-exception approval, any legal-judgment or medical-eligibility step.

**Likely to require custom analytics/platform build:** Application portfolio rationalization, Supplier performance insights, Treasury forecast variance, Renewal pipeline intelligence, Tail-spend control — all analytics-heavy with a real data-remediation dependency (score them honestly on evidence up front).

## 13. Explicit non-claims

- This is a **design/audit pressure test, not built product.** It validates the *model*, not a shipped capability.
- **Scores are expert design judgment, not measured outcomes.** No client data was used.
- Use cases are **synthetic and illustrative** for Lakeshore (a diversified industrial holdco with corporate shared services); numbers cited in the Legal cases come from the synthetic Lakeshore demo pack, not production.
- **Demo-ready ≠ product-ready ≠ production-proven.** A high demo score means it presents well; product-readiness depends on the §10 hardening.
- The model's **concept is validated; the supporting P2/P3/P4 machinery and the seven primitives are not yet built.**
- This test does **not** implement any product code and makes no claim about current Moves runtime behavior beyond the gaps named here.
