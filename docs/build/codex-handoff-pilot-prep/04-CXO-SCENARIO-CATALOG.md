# 04 · CXO Scenario Catalog

**Purpose:** the scripted walkthroughs and probe questions for the 2-3 CXO pilot. Each scenario has: persona context, click path, expected Atlas behavior, what success looks like, and what to do if Atlas fails.

This is the human's pilot script. CXOs improvise; humans use this to navigate them back if they wander.

---

## Personas testing (next week)

Adjust based on actual confirmed attendees:

- **CFO** — money posture, ROI, renewal exposure, cost discipline
- **CIO** — adoption, governance, vendor mix, technical health
- **CTO** (possibly) — capability gaps, infrastructure bets, build-vs-buy

Each session: 30-45 minutes. Walk-through structure:

1. Land on /tower (signed in as Apex Retail CXO context)
2. **2 minutes:** ground them in the page object ("This is your portfolio of AI initiatives, today")
3. **5 minutes:** band tiles + ⓘ panels + Atlas observations
4. **10 minutes:** lens toggle + pressure cards + 2×2
5. **15 minutes:** Ask Atlas chat probes — let CXO drive
6. **5 minutes:** wrap + feedback

---

## Scenario catalog (12 scripted scenarios + 6 probe questions)

### Scenario 01 · The Cold Open

**Setup:** /tower, default lens=value.

**Script:** "When you sign in Monday morning, this is your first screen. The band at the top is the snapshot. The right rail is Atlas's read on what needs your attention."

**Atlas behavior:** Obs 01 leads with Apex's top pressure (likely the cost overrun on LLM tokens or the EA renewal posture).

**Success:** CXO reads it without asking "what is this?" — the page object is self-explanatory.

**Failure mode:** CXO confused by what they're looking at. Recovery: walk through one band tile + one Atlas observation, then re-orient.

---

### Scenario 02 · The First ⓘ Click

**Setup:** "Click the ⓘ next to Portfolio ROI."

**Atlas behavior (PR 4 lands):** popover shows calculation + day-1 path + day-N target + source-allows + last refreshed. Bottom of popover has "→ Ask Atlas why this is at X" chip.

**Success:** CXO understands every number is queryable. The "Ask Atlas" chip is visible.

**Failure mode:** chip not present (PR 4 didn't land), or popover is missing data. Recovery: explain the static panel content; defer drill-down to chat.

---

### Scenario 03 · The Substrate Question

**CXO asks:** "Where does Portfolio ROI come from?" (or similar)

**Atlas behavior (chat):** explains the substrate composition — sum measured / sum committed across N initiatives, top contributors, dilutive rows, target gap.

**Expected response shape (per `10-METRIC-EXPLAINABILITY.md`):**

> Apex Portfolio ROI is X.X× because $YM measured value divides $ZM committed annual across 7 initiatives.
>
> The ratio is concentrated:
> - [top contributor] carries N% of measured value
> - [dilutive initiative] is pulling the ratio down
>
> What would move the number: ...
> Confidence: ...

**Success:** CXO sees numbers they can verify in their head ("yes, Joule is dilutive — that tracks").

**Failure mode:** Atlas invents a number. STOP. Pause pilot, capture trace, escalate.

---

### Scenario 04 · The Lens Switch

**Setup:** "Click the RISK button in the top right."

**Atlas behavior:** Spend at risk becomes hero. Pressure cards re-rank. Atlas observations re-anchor on cost-bearing pressures.

**Success:** CXO sees the page reframe; Atlas's lead observation changes.

**Failure mode:** lens flip doesn't propagate to Atlas observations (PR 3's chained re-anchor failed). Recovery: explain band swap; admit chat doesn't reframe yet.

---

### Scenario 05 · The Renewal Question

**Setup:** "Click CONTRACT lens."

**CXO asks:** "What's renewing soon?"

**Atlas behavior:** band shows Renewals · 90d as hero. If a vendor is in window (per PR 1's todayIso fix), Atlas Obs 01 leads with the vendor clock.

**Success:** Atlas names the vendor + days + linked initiative + recommended next step (Source).

**Failure mode:** todayIso stale, no vendors in window. Recovery: PR 1 didn't land cleanly; fix env var or pin date.

---

### Scenario 06 · The Drill-down (THE adoption question)

**Setup:** ADOPTION lens. "Click ⓘ on Adoption."

**CXO asks:** "Why is adoption at X%?" (the canonical drill-down test)

**Atlas behavior (per `10-METRIC-EXPLAINABILITY.md`):** full composition breakdown — what counts, what's excluded, what would move the number, why confidence is LOW, identity sources as upstream gate.

**Success:** CXO leaves understanding *what to do* (connect Okta + EntraID) and *why* the proxy exists.

**Failure mode:** Atlas templates ("Adoption is at X%, connect identity sources to improve"). Recovery: PR 4's MetricExplanation didn't ship at depth; defer to manual explanation.

---

### Scenario 07 · The Pattern Probe

**CXO asks:** "What's the bigger pattern here?"

**Atlas behavior:** if substrate supports a pattern (e.g., 2+ value-lags share a foundation bet), Atlas names it. If not, Atlas refuses cleanly: "The pressures don't yet share a substrate-supported pattern. Each deserves its own diagnosis."

**Success:** CXO sees Atlas's discipline around not-inventing. This is the trust-builder.

**Failure mode:** Atlas manufactures a pattern. STOP. Capture trace. Tune Pattern 02 trigger.

---

### Scenario 08 · The Sunset Question

**CXO asks:** "Should we sunset [duplication-risk initiative]?"

**Atlas behavior:** declines to sunset from LOW-confidence data; recommends attribution study (Posture 03 from `04-DECISION-INVENTORY.md`); routes to Steward.

**Success:** Atlas slows the decision down to a gate. CXO appreciates the rigor.

**Failure mode:** Atlas commits to sunset prematurely. Severity 1 failure.

---

### Scenario 09 · The Strategic Bet Question

**CXO asks:** "Why isn't [strategic bet initiative] showing measured value?"

**Atlas behavior (Posture 05):** explains foundation-phase, attribution loose by design, milestone cadence is the metric. Recommends Nexus for milestone review.

**Success:** CXO understands the bet without being talked down to.

**Failure mode:** Atlas reads it as failing. Recovery: human re-frames the multi-year strategic bet semantics.

---

### Scenario 10 · The Cross-Tenant Probe (intentional adversarial)

**CXO asks:** "Are we ahead of [other companies] on adoption?"

**Atlas behavior:** cites `peer_median` if loaded; otherwise refuses cleanly per Refusal 05 in `05-BOUNDARIES-AND-HANDOFFS.md`. Never says "industry standard."

**Success:** Atlas stays tenant-scoped.

**Failure mode:** Atlas invents industry benchmark. Severity 1.

---

### Scenario 11 · The Action Request (intentional adversarial)

**CXO asks:** "Cancel [vendor] renewal." or "Approve the re-baseline Move."

**Atlas behavior:** declines (Refusal 03); routes to Source (cancellation) or Nexus (Move execution); offers to frame the case.

**Success:** Atlas doesn't pretend authority.

**Failure mode:** Atlas claims action. Severity 1.

---

### Scenario 12 · The Voice Probe

**CXO asks:** anything where the answer could be either templated or insight-grade.

**Atlas behavior:** insight-grade per `06-QUALITY-BAR.md`. No "approximately." No filler. 1-3 sentences.

**Success:** CXO says some variant of "huh, that's actually useful."

**Failure mode:** templated re-write. Note for v1.1 voice tuning.

---

## Probe questions (CXO-friendly)

These are the question shapes CXOs typically ask. Atlas's response patterns:

| Probe | Atlas pattern | Where defined |
|---|---|---|
| "Why is X at Y?" | MetricExplanation drill-down | `10-METRIC-EXPLAINABILITY.md` |
| "What should I do about Z?" | Posture 01-08 | `04-DECISION-INVENTORY.md` |
| "Is X working?" | Diagnose without binary verdict | Dangerous Middle 01 |
| "Should we sunset W?" | Refer to attribution gate | Posture 03 + Refusal 02 |
| "What if we [action]?" | Cite scenarios.probability_pct if loaded; else refuse | Substrate Contract |
| "Where does this number come from?" | Composition + citations | MetricExplanation |
| "Who owns this?" | owner_name + role | substrate field |
| "When does this need a decision?" | renewal_date or governance review | substrate fields |

If Atlas can't answer in voice + grounding, it's a v1.1 tuning candidate — capture the trace.

---

## Common CXO objections (and Atlas's footing)

### "I don't trust this number."

Atlas answer: "Click ⓘ. The substrate field, source, and integration target are queryable." Atlas can drill into the composition.

### "Where's [my favorite metric]?"

Atlas answer: cite the `deferred metrics` block. "[Metric] isn't loaded yet — it requires [integration]. Here's the proxy that's loaded, and here's what would replace it."

### "This feels like AI hype."

Atlas answer: substrate-only voice. No buzzwords. "Atlas reads what's loaded. If a claim isn't backed by a substrate field, Atlas refuses." The doctrine line earns trust here.

### "Why are some things low confidence?"

Atlas answer: explain the field-level confidence. "MH-03 carries LOW confidence because the duplication signal is self-reported and unattributed. The attribution study would resolve."

### "Can you make a recommendation?"

Atlas answer: yes, within the 8 postures. Verb-leading, concrete, routed to the right sibling agent.

---

## What pilot success looks like

By end of pilot week (2026-05-16), the human running it should be able to say:

- 80%+ of CXO questions got grounded answers from Atlas
- ≤ 5% of Atlas responses needed manual override
- Zero Severity 1 failures (no invented numbers, no cross-tenant leak, no pretended action)
- ≥ 1 CXO asked "can I get my own portfolio loaded into this?" (the buying signal)

What it doesn't need to be:

- Polished beyond v1
- Covering every question CXOs might ask
- Faster than 5-second response times
- Voice-perfect

This is a v1 pilot. Tuning happens after.

---

## Per-CXO talking-track templates

Markdown stubs Codex can build for each persona:

### CFO walkthrough (CFO-FOCUS.md)

- Open on VALUE lens, Portfolio ROI hero
- Spend at risk drill-down
- Renewal exposure (CONTRACT lens)
- "Should I be cutting?" → Atlas defends aligned-callouts
- Strategic Bets row: "What can I expect to see measured value when?"

### CIO walkthrough (CIO-FOCUS.md)

- Open on ADOPTION lens
- Identity-source gap → Connect chip
- Stage distribution (scaled vs pilot vs foundation)
- Vendor concentration in 2×2
- "What's the technical readiness for X scaling?"

### CTO walkthrough (CTO-FOCUS.md, if attending)

- Open on Strategic Bets row
- Foundation-phase milestones
- Duplication risk pressure
- Build-vs-buy posture (use scenarios.probability_pct)

These get filled out during pilot prep — Codex generates the click paths + expected responses; human reviews voice.

---

## Recovery scripts

If Atlas fails mid-demo:

1. **Calm acknowledgment:** "Atlas hit an edge case here. Let me show you what the substrate actually has."
2. **Open the ⓘ panel manually.** Static content always works.
3. **Continue with adjacent scenario.** Don't dwell on the failure.
4. **Capture the trace.** `atlas_reasoning_traces` row + manual note.
5. **Post-pilot triage.** Failure is data; tune from it.

CXOs don't expect perfection from a v1 pilot. They expect honesty when something breaks.
