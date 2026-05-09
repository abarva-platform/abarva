# 04 · Decision Inventory

**Purpose:** the CFO/CIO postures Atlas helps shape. Each decision posture has: trigger substrate state, the decision Atlas surfaces, the recommended next action, the right downstream surface (Source/Nexus/Sentinel/Steward), and the confidence floor.

This is Atlas's *job description from the user's perspective.* When a CFO opens Tower, these are the postures Atlas can put in front of them.

---

## The eight CFO postures Atlas supports

| # | Posture | Trigger | Atlas's job |
|---|---|---|---|
| 1 | **Defend the aligned-callout** | aligned_callout = true AND scaled stage AND healthy | Name what's working; protect the budget line |
| 2 | **Re-baseline the value-lag** | value_lag AND aligned_callout = true | Don't sunset; re-baseline at next governance review |
| 3 | **Resolve the duplication** | duplication_risk on ≥ 1 initiative | Run attribution study; defer consolidation choice |
| 4 | **Open the renewal posture** | vendor.renewal_date < 90d | Frame the renewal as a forcing function; route to Source |
| 5 | **Hold the foundation bet** | strategic_bet AND foundation_phase | Don't expect measured value yet; track milestone cadence |
| 6 | **Sunset the candidate** | low value AND low alignment AND no aligned_callout | Recommend sunset gate; defer to Steward for governance |
| 7 | **Connect the missing source** | adoption_gap AND deferred MAU metrics | Name the integration that unlocks the metric |
| 8 | **Stay quiet** | pressuresView.cards.length === 0 | Resist filler; surface look-ahead only if substantive |

---

## Posture 01 · Defend the aligned-callout

**Substrate trigger:** `ai_initiatives.aligned_callout = true` AND `stage = scaled` AND `status_flag = healthy`

**The decision:** the CFO's instinct under pressure is often to cut. Atlas's job is to remind them that the budget on aligned-callouts is *exactly the budget that's working* — a defensive posture is the right call.

**Atlas surfaces:**
- The initiative(s) by display_id + name
- `measured_value_usd` vs `committed_annual_usd` (always above for true callouts)
- Why it matters — the `aligned_rationale` field if non-null

**Recommended next action:** "Defend MH-01's budget line at next governance review."

**Downstream surface:** Steward (governance review prep).

**Confidence floor:** HIGH. This is Atlas's most defensible posture — the data clearly supports it.

**Worked example (Meridian):**

> MH-01 (Clinical Documentation Copilot) is the aligned-callout you want to defend: scaled stage, healthy, $5.8M measured against $4.1M committed. The aligned rationale is the clinical-documentation-time KPI tracking 17min → 11min and physician satisfaction NPS 12 → 33 over four quarters. Hold the line on this budget at the next governance review.

---

## Posture 02 · Re-baseline the value-lag

**Substrate trigger:** `status_flag = value_lag` AND `aligned_callout = true`

**The decision:** an aligned-callout that's lagging is *not* a sunset candidate. The strategic intent is right; the realization curve is off. The right move is re-baseline, not cut.

**Atlas surfaces:**
- The gap (`committed_annual_usd - measured_value_usd`)
- The `status_summary` (often names the realization driver)
- Time horizon — usually next governance review

**Recommended next action:** "Open re-baseline review for MH-04 at the next governance window."

**Downstream surface:** Steward (governance) + Nexus (re-baseline Move if formal).

**Confidence floor:** MED. The lag is real; the *cause* often isn't isolated yet.

**Worked example:**

> MH-04 (Epic AI for Revenue Cycle) is aligned but lagging: $1.4M measured against $1.3M committed annually, but $2.6M committed total over multi-year. Denials reduction is tracking 3% → 8% across Q4-Q2 — slower than the original 15% target. The aligned-callout overrides the value-lag for posture purposes; defend it via re-baseline, don't sunset. Open re-baseline review at next governance.

---

## Posture 03 · Resolve the duplication

**Substrate trigger:** `status_flag = duplication_risk` on at least one initiative

**The decision:** duplications are politically charged but evidentially weak. Two tools claiming the same deflection metric, both self-reported, neither with a clean baseline. The CFO's instinct is to pick a winner; Atlas's job is to slow that decision down to a study.

**Atlas surfaces:**
- The two (or more) overlapping initiatives by name
- The `status_summary` — usually names the overlap surface (e.g., "M365 Copilot deflection")
- The evidence gap — both self-reported
- The proposed gate — attribution study, ~6 weeks

**Recommended next action:** "Run a clean attribution study before recommending consolidation. Estimate: 6 weeks."

**Downstream surface:** Nexus (Move proposal: attribution-study).

**Confidence floor:** LOW. The duplication is real; the consolidation choice rarely is in the v1 substrate.

**Worked example:**

> MH-03 (Autonomous Helpdesk via ServiceNow) overlaps with M365 Copilot on the same deflection use case. Both tools self-report deflection rates; neither has a clean attribution baseline. The duplication is real; the consolidation choice isn't supported by current data. Run the attribution study before recommending sunset — 6-week effort, minimal disruption.

---

## Posture 04 · Open the renewal posture

**Substrate trigger:** `ai_initiative_vendors.renewal_date` within 90 days of `todayIso`

**The decision:** vendor renewals are calendar forcing functions. The CFO doesn't get to defer; the contract closes whether the posture is defined or not.

**Atlas surfaces:**
- Vendor name + contract value
- Days until renewal
- Linked initiative's current state (which often informs the negotiation lever)
- Source brief status (open / drafted / not started)

**Recommended next action:** "Open the [vendor] renewal brief in Source. Posture due in [N] days."

**Downstream surface:** Source.

**Confidence floor:** HIGH (the renewal date is calendrical; no ambiguity).

**Worked example:**

> Epic Systems renewal closes in 38 days. \$2.6M contract on MH-04 (Epic AI for Revenue Cycle), currently flagged value-lag with HIGH-confidence aligned-callout. The renewal is the forcing function for the re-baseline conversation: defend the aligned-callout, but don't sign without the value-lag root cause named. Open the brief in Source.

---

## Posture 05 · Hold the foundation bet

**Substrate trigger:** `stage = multi_year_strategic_bet` AND `status_flag = foundation_phase` AND `measured_value_usd = 0` (or null)

**The decision:** strategic bets in foundation phase look like they're failing — no measured value, big committed total. They're not failing; they're foundational. Atlas's job is to remind the CFO that attribution is loose by design, milestones are the metric, and pulling the plug early is how you destroy compounding capability.

**Atlas surfaces:**
- The bet by display_id + name + `committed_total_usd`
- The fact that measured value is 0 (and that this is expected)
- Which downstream initiatives depend on it (cite from `status_summary` or `description` if linked)
- Milestone cadence (from `stage_detail`)

**Recommended next action:** "Track the foundation milestone cadence. Don't expect measured value until programs migrate."

**Downstream surface:** Nexus (program-level milestone review).

**Confidence floor:** MED.

**Worked example:**

> MH-07 (Model Governance & FinOps Platform) is the multi-year strategic bet feeding the value-lag pressures above — \$4.2M total committed over 3 years, currently in foundation phase. It won't show measured value until MH-04 and MH-06 migrate onto its instrumentation. The structural unblock for two of three current pressures runs through this bet. Track the foundation milestone cadence; don't expect measured value yet.

---

## Posture 06 · Sunset the candidate

**Substrate trigger:** initiative in BL quadrant of 2×2 (low value AND low alignment) AND `aligned_callout = false` AND `confidence_level ≥ MED`

**The decision:** the rare initiative where the data actually supports sunset. Atlas should still defer the call to Steward but can clearly name the candidate.

**Atlas surfaces:**
- The candidate by display_id + name
- Why it qualifies (low realized + low alignment + no override)
- The recommended Move type (sunset Move)

**Recommended next action:** "Propose a sunset Move via Steward governance review."

**Downstream surface:** Steward.

**Confidence floor:** MED. Atlas should never sunset a LOW-confidence initiative — the evidence isn't strong enough.

**Worked example (hypothetical):**

> MH-03 (Autonomous Helpdesk) sits in the sunset quadrant: $380K measured against $900K committed, duplication-risk flag, MED confidence. If the attribution study (Posture 03) confirms the overlap is genuine, this is the sunset candidate. Propose via Steward at the next governance review — but only after the attribution study.

Note: this posture composes *with* Posture 03. Atlas typically surfaces 03 first (the gate), then 06 conditionally if the gate confirms.

---

## Posture 07 · Connect the missing source

**Substrate trigger:** `status_flag = adoption_gap` OR `bandMetrics.adoption_rate.confidence = 'low'` (the proxy is firing because per-tool MAU isn't loaded)

**The decision:** a low-confidence adoption number isn't a problem with adoption — it's a problem with telemetry. Atlas's job is to name the integration that would replace the proxy.

**Atlas surfaces:**
- The current adoption proxy (e.g., "% in scaled stage")
- The integrations that would unlock real measurement (M365 Graph, Cursor admin, ServiceNow Performance Analytics, GitHub admin)
- The deferred metric from `deferredMetrics`

**Recommended next action:** "Connect identity sources to unlock per-tool MAU. (5 min — Okta + EntraID via /admin/connectors.)"

**Downstream surface:** Steward (data integration owner) or platform admin.

**Confidence floor:** HIGH (the integration gap is a fact, not an interpretation).

**Worked example:**

> Adoption confidence is LOW because the rate you see is a stage-based proxy — 50% of non-foundation initiatives are in scaled stage. Real adoption requires per-tool MAU integrations: M365 Graph for Copilot, Cursor admin API for the IDE rollout, ServiceNow Performance Analytics for Now Assist. Connect identity sources first; the rest follow.

---

## Posture 08 · Stay quiet

**Substrate trigger:** `pressuresView.cards.length === 0` AND no vendor renewals in 90d

**The decision:** the senior advisor talks less. A quiet portfolio is a quiet portfolio. Don't manufacture a worry.

**Atlas surfaces:**
- Aligned-callouts that are working (defensive observation)
- Foundation-phase look-ahead, if substantive

**Recommended next action:** "Use the time to read MH-07's foundation plan." or "No CFO posture demands today; review next-quarter scenario library."

**Downstream surface:** None mandatory.

**Confidence floor:** HIGH (silence is high-confidence when substrate supports it).

**Worked example:**

> Portfolio is quiet this week. Three of seven initiatives in scaled stage; MH-01 and MH-04 carry aligned-callouts and are delivering above committed. No CFO postures demand a decision today. Use the time to read MH-07's foundation plan — that's the next inflection.

---

## What's NOT a CFO posture Atlas owns

| Decision | Owner | Why not Atlas |
|---|---|---|
| Approving a Move | Maestro / Admin | Atlas advises; humans approve |
| Setting strategy / portfolio rebalance | Sentinel | Strategic trade-off requires multi-perspective synthesis Atlas doesn't have |
| Vendor selection / scoring | Source | Procurement scoring is Source's job |
| Headcount / org changes | Out of platform | Atlas reads owners; doesn't reorganize |
| Compliance interpretations | Steward + legal | Atlas surfaces signal; legal interprets |
| Public communication / press | Out of platform | Never |

When a question approaches one of these, Atlas defers cleanly: "That's a [Sentinel | Source | Steward] decision. Atlas can frame the substrate state; the trade-off call is theirs."

---

## How Atlas chains postures

A typical Tower CFO morning surfaces 2-3 postures in combination:

| Substrate state | Posture chain | Render |
|---|---|---|
| 1 vend in 38d on aligned-callout, 1 dup_risk, 1 strategic bet | 04 (lead) + 02 (defend) + 05 (look-ahead) | Obs 01 + 02 + 03 |
| 0 pressures, 2 aligned-callouts, 1 strategic bet | 01 (defend) + 05 (look-ahead) | Obs 01 + 02 |
| 3 value-lags sharing root, 2 aligned-callouts | 02 (Pattern 02 root) + 03 (defend) + 07 (telemetry?) | Obs 01 + 02 + 03 |
| 0 substrate loaded | (refusal: substrate empty) | Empty Atlas with load-instructions hint |

The eight postures cover the v1 surface. Atlas v2 expands into stakeholder-note-rich postures (e.g., "executive sponsor dissent recorded") and scenario-library-rich postures ("if X event triggers, MH-Y becomes Z").
