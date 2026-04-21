# AbarVa · Program Lifecycle Specification

**Purpose:** Define what a program *is*, end to end, from the moment it originates through outcome verification and integration back into the Genome. Every page in AbarVa renders a slice of this lifecycle; without this spec, page design flies blind.

**Companion to:** `abarva-nexus-agent-spec.md` (defines Nexus's identity, voice, memory, purpose — which this spec depends on).

**Rename applied:** "Engagement" → "Program" per today's strategic reframe.

---

## 1 · The six phases

```
Origination → Charter → Diagnose → Design → Execute → Verify
   (0)          (1)       (2)        (3)      (4)       (5)
```

| Phase | Duration | CXO involvement | Primary output |
|---|---|---|---|
| 0 · Origination | Hours to 1 day | Optional | Program scope hypothesis |
| 1 · Charter | 1–5 days | Light | Charter doc + baseline plan |
| 2 · Diagnose | 1–4 weeks | Light | Diagnosis + baseline locked |
| 3 · Design | 2–6 weeks | **Interview + Gate** | Options + business case |
| 4 · Execute | 1–12 months | Light | Milestone deliverables |
| 5 · Verify | 2–4 weeks | **Verification** | Outcome report + fee proposal |

CXO (sponsor) engages twice in the formal loop: Phase 3 interview and Phase 5 verification. Everything else is Nexus + program lead with sponsor briefed async. This is deliberate — sponsor time is the scarce resource.

---

## 2 · Phase 0 · Origination

**The moment a program starts.**

### Entry triggers

Three ways a program originates:

1. **Tower-triggered.** A contradiction fires in Control Tower. User clicks "Trigger program." The contradiction context (dollar impact, affected vendors, observed signals) is pre-loaded into the new program. Most organic origin path.
2. **User-initiated.** User clicks "+ New program" from Home or Engagements list. Blank start.
3. **Scheduled/recurring.** Quarterly AI governance review, annual vendor rationalization, etc. Nexus auto-opens the program at cadence.

### What happens

Nexus opens the program with an Origination turn. If Tower-triggered:

> I've loaded the Abridge + Nuance DAX overlap into scope. Before we formalize the charter, three diagnostic questions to pressure-test the framing — want to answer them here or should I schedule time with the relevant stakeholders?

If user-initiated:

> Starting a new program. Four things to establish quickly: what problem, what outcome, who's accountable, rough value at stake. What's the problem?

Nexus then does structured intake, asking minimum-viable-questions, pattern-matching against Genome to suggest scope, proposing sponsor if the client org is known.

### Who does what

- **User:** Describes the problem, answers diagnostic questions, confirms scope, names sponsor
- **Nexus:** Intake, pattern matching, scope hypothesis, value-at-stake estimate, suggested phase 1 timeline
- **AbarVa team:** Not yet involved

### Output artifacts

- Program scope hypothesis (1 paragraph)
- Value at stake estimate (range with confidence)
- Proposed sponsor
- Suggested topics to assign (from Pack L library)
- 3-5 initial diagnostic questions that will drive Phase 1

### Gate criteria for exit

Phase 0 ends when:
- Problem statement is crisp
- Value at stake has a range with basis
- Sponsor is named
- User types "proceed to charter" or Nexus proposes proceeding

No formal gate — this is the warm-up.

### User-visible experience

Minimal UI. Conversational intake. Program header at top. Right rail stays empty or shows "Origination in progress." Feels like the first meeting of a new engagement — get the shape right, then formalize.

---

## 3 · Phase 1 · Charter

**Formalize the program.**

### Entry triggers

User or Nexus proceeds from Origination. The scope hypothesis becomes the basis of the charter.

### What happens

Nexus drafts the Charter deliverable — structured document covering:

- **Value case.** What outcome, what dollar impact, what timeline
- **Scope.** What's in, what's out
- **Sponsor.** Named, with their context
- **Success criteria.** Specific metrics, specific thresholds
- **Baseline measurement plan.** How will we measure pre-state so we can credibly verify outcome later
- **Stakeholder map.** Who's involved, what's their role
- **Timeline + milestones.** Phase-by-phase projection
- **Risks.** Known risks with mitigation approaches

User reviews, edits, refines via turn-based conversation. Nexus regenerates sections on request.

In parallel, Nexus pulls relevant patterns from Genome that match this program's shape and populates the Active Patterns panel in the right rail.

### Who does what

- **User:** Reviews charter drafts, refines scope, clarifies sponsor, approves
- **Nexus:** Drafts, regenerates, pulls patterns, surfaces relevant prior programs from Genome
- **Sponsor:** Signs off on charter (async — email, not interview)

### Output artifacts

- **Charter deliverable** (primary)
- **Baseline measurement plan** (secondary, critical for Phase 5)
- Assigned topic playbooks (from Pack L library)
- Patterns activated in program context
- Stakeholder list

### Gate criteria for exit

Phase 1 ends when:
- Charter is approved by sponsor (async sign-off recorded)
- Baseline measurement plan is locked
- Topics assigned
- User triggers gate approval

This is the first formal gate — Phase 1 → Phase 2. Gate is light (charter approval).

### User-visible experience

Program console now shows:

```
ZONE 1 · CONVERSATION                 │ ZONE 2 · ACTIVE CONTEXT
- Origination turns                   │ - Active patterns (3 from Genome)
- Charter refinement turns            │ - Assigned topics (2)
- Current turn                        │ - Sponsor: Sarah Chen
                                      │ - Recent library refs
                                      │
ZONE 3 · DELIVERABLES
- Charter · 80% · approved by sponsor
- Baseline measurement plan · 60%
                                      
ZONE 4 · PHASE PROGRESS
●━━━●━━○━━○━━○  Phase 1 · Charter (gate in review)
```

---

## 4 · Phase 2 · Diagnose

**Quantify the problem. Lock the baseline.**

### Entry triggers

Phase 1 gate approved.

### What happens

Two parallel tracks:

**Track A · Data gathering.** Nexus identifies what data is needed to quantify the problem. Drives uploads (contract PDFs, vendor usage exports, expense feeds, Zscaler logs) via the Onboarding Companion agent. Data gets classified and ingested into L2 client context.

**Track B · Analysis.** Nexus runs diagnostic analysis:
- Current-state mapping (who uses what, how much, for what)
- Cost attribution (what's actually being spent, where, by whom)
- Performance signals (adoption rates, utilization, outcomes)
- Contradiction detection (what doesn't add up)
- Pattern matching against Genome (which archetypes apply)
- Peer benchmarking (how does this compare to similar orgs)

Turns during this phase are dense with data. Nexus surfaces findings as they emerge:

> *Diagnostic finding: Abridge's actual overlap with DAX is $143K/mo, not the $478K/mo Tower initially flagged. The Tower estimate double-counted specialty usage. Updating baseline.*

### Who does what

- **User:** Reviews diagnostic findings, approves baseline adjustments, pushes back when Nexus's interpretation is wrong
- **Nexus:** Drives the diagnostic, generates the Diagnosis deliverable, flags contradictions, adjusts baseline based on new data
- **Client data team:** Provides data uploads (via Onboarding Companion) or API integration
- **AbarVa Maestro:** Oversees quality, reviews diagnostic rigor

### Output artifacts

- **Diagnosis deliverable** — root-cause analysis, current-state quantification, baseline locked value
- **Baseline lock** — formally committed number against which Phase 5 outcome is measured
- Updated Tower entries with new findings
- New contradictions surfaced (fed back to Tower)

### Gate criteria for exit

Phase 2 ends when:
- Baseline is formally locked (date, value, methodology documented)
- Diagnosis deliverable is reviewed by program lead
- Root causes are articulated with confidence
- User triggers gate approval

Gate approval for Phase 2 → Phase 3 is important because the locked baseline is what drives Phase 5 verification. If the baseline is wrong, the outcome math is wrong. Lock it right.

### User-visible experience

Console now shows rich diagnostic activity:

```
ZONE 1 · CONVERSATION
- Diagnostic questions + findings turns
- User pushbacks on interpretations
- Nexus regenerations of analysis

ZONE 2 · ACTIVE CONTEXT
- Active patterns (5, two newly triggered)
- Contradictions surfaced (3 during diagnosis)
- Recent library refs (7 citations)
- Baseline calibration history

ZONE 3 · DELIVERABLES
- Charter · approved
- Baseline plan · approved
- Diagnosis · 85% · under review

ZONE 4 · PHASE PROGRESS
●━━━●━━●━━○━━○  Phase 2 · Diagnose (baseline locking)
[Baseline locked: $143K/mo · Apr 12]
```

---

## 5 · Phase 3 · Design

**Generate options with economics. Sponsor interview. Gate approval.**

### Entry triggers

Phase 2 gate approved, baseline locked.

### What happens

Three streams:

**Stream A · Options generation.** Nexus generates 3 decision options with:
- Economics (cost, savings, investment, ROI)
- Tradeoffs (risk, timeline, organizational impact)
- Peer precedents (similar decisions at similar orgs)
- Vendor landscape relevance
- Confidence per option

**Stream B · Business case.** Nexus drafts a CFO-grade business case with:
- Executive summary
- Quantified problem statement
- Options analysis with NPV / IRR
- Recommendation with rationale
- Implementation plan
- Risks + mitigations
- Success metrics

**Stream C · Sponsor interview.** User schedules the sponsor interview (Sarah Chen). Nexus prepares interview guide based on diagnostic findings + options generated. Interview is conducted by the program lead (live conversation). Transcript captured, Nexus extracts decisions and concerns.

### Who does what

- **User (program lead):** Reviews options, sharpens business case, conducts sponsor interview
- **Nexus:** Generates options, drafts business case, prepares interview guide, extracts signals from interview transcript, updates deliverables based on sponsor input
- **Sponsor:** Participates in interview (CXO touch #1), provides strategic context Nexus can't infer from data
- **AbarVa Maestro:** Reviews business case rigor, gate quality

### Output artifacts

- **Options deliverable** — 3 decision paths with economics
- **Business case** — full CFO-grade document
- **Sponsor interview transcript** with extracted decisions
- **Gate pack** — materials for Phase 3 gate approval

### Gate criteria for exit

Phase 3 ends when:
- Sponsor signs off on Option X (the decision)
- Business case is approved
- Implementation plan is locked
- Gate approval formally recorded

This is the biggest gate. Sponsor commits the organization to a direction. From here, Execute is downhill.

### User-visible experience

Console during Phase 3 gets intense:

```
ZONE 1 · CONVERSATION
- Options iteration turns
- Sponsor interview prep turns
- Business case refinement
- Post-interview signal extraction

ZONE 2 · ACTIVE CONTEXT
- Active patterns (6)
- Peer decisions (4 precedents surfaced)
- Chained patterns (this decision depends on F004 + F008)
- Interview prep: open questions, risks to probe

ZONE 3 · DELIVERABLES (horizontal scroll, now 4 cards)
- Charter · approved
- Diagnosis · approved
- Options · 100% · sponsor-reviewed
- Business case · 90% · final review

ZONE 4 · PHASE PROGRESS
●━━━●━━●━━●━━○  Phase 3 · Design (gate pack ready)
Sponsor interview: Apr 18 · Gate meeting: Apr 22
```

---

## 6 · Phase 4 · Execute

**Run the plan. Track milestones. Adjust in flight.**

### Entry triggers

Phase 3 gate approved — sponsor committed to Option X.

### What happens

The longest phase — can run 1–12 months depending on program scope. Three workstreams:

**Workstream A · Milestone tracking.** Every committed milestone has a deliverable + deadline + owner. Nexus tracks status, surfaces when milestones slip, proposes mitigations.

**Workstream B · Risk management.** Nexus monitors signals for risks:
- Adoption dropping below threshold
- Vendor changes (pricing, contract, ownership)
- Regulatory changes
- Internal political shifts
- Data quality issues

Fires alerts when risks materialize. Suggests responses.

**Workstream C · Change adaptation.** When reality diverges from plan, Nexus proposes adjustments, captures decisions, maintains baseline integrity (if scope changes, baseline adjusts with auditable rationale).

### Who does what

- **User (program lead):** Drives execution, reviews status, approves adjustments
- **Nexus:** Milestone tracking, risk monitoring, auto-generation of status reports, exec briefings, change logs
- **Sponsor:** Briefed weekly/monthly via auto-generated briefings. Engaged only on material deviations.
- **AbarVa Maestro:** Quality oversight, escalation path for critical decisions

### Output artifacts

- **Milestone deliverables** (per milestone)
- **Weekly status updates** (auto-generated, approved by program lead)
- **Monthly exec briefings** (auto-generated, approved)
- **Risk logs** (real-time)
- **Change logs** (with rationale and baseline impact)

### Gate criteria for exit

Phase 4 ends when:
- All committed milestones are delivered (or explicitly descoped)
- Execution is ready for outcome measurement
- User triggers transition to Verify

### User-visible experience

Execute is the calmest phase on the console. Activity is high but structured:

```
ZONE 1 · CONVERSATION
- Status updates
- Risk flags
- Adjustment decisions

ZONE 2 · ACTIVE CONTEXT
- Active milestones (8, 5 complete)
- Open risks (2 medium)
- Chained dependencies
- Recent library refs (new research published)

ZONE 3 · DELIVERABLES
- [all prior deliverables approved]
- Milestone 1-5 · approved
- Milestone 6 · in progress
- Weekly status · Apr 19 · draft
- Monthly exec brief · Apr 1 · approved

ZONE 4 · PHASE PROGRESS
●━━━●━━●━━●━━●━━○  Phase 4 · Execute (Month 4 of 6)
Next milestone: Specialty migration complete · May 8
```

---

## 7 · Phase 5 · Verify

**Measure actual outcome against locked baseline. Attribute. Close.**

### Entry triggers

Execute phase complete. Enough time has passed for outcomes to materialize.

### What happens

**Outcome measurement.** Nexus compares actual state vs. Phase 2 locked baseline. Calculates delta. Attributes delta to program actions (vs. external factors).

**Attribution modeling.** The hard part. Not every dollar saved is because of the program — market conditions, other initiatives, etc. Nexus builds an attribution model:
- What fraction of savings is directly program-driven (high confidence)
- What fraction is adjacent (medium confidence)
- What fraction is ambient (low confidence)

**Verification interview.** Sponsor (CXO touch #2) reviews outcome. Confirms or challenges attribution. Signs off.

**Fee calculation.** Based on verified outcome, fee is calculated per commercial terms (outcome-share %). Fee proposal generated.

**Lessons-learned extraction.** Nexus extracts patterns from the program for Genome ingestion — what worked, what didn't, what archetype this program represents.

### Who does what

- **User (program lead):** Reviews outcome report, sharpens attribution, presents to sponsor
- **Nexus:** Calculates delta, builds attribution, drafts outcome report, generates fee proposal, extracts lessons for Genome
- **Sponsor:** Verifies outcome, signs fee approval (CXO touch #2)
- **AbarVa Maestro:** Reviews attribution rigor — this is the audit moment
- **AbarVa finance:** Processes fee

### Output artifacts

- **Outcome report** — actual vs. baseline, attribution, confidence levels
- **Fee proposal** — tied to verified outcome per commercial terms
- **Lessons-learned document** — for internal program knowledge
- **Genome candidate pattern** — proposed addition to the pattern library based on this program

### Gate criteria for exit

Phase 5 ends when:
- Outcome verified by sponsor
- Fee approved
- Genome pattern proposed and reviewed
- Program archived

Program lifecycle complete.

### User-visible experience

```
ZONE 1 · CONVERSATION
- Outcome measurement turns
- Attribution refinement
- Verification interview prep + post
- Genome pattern discussion

ZONE 2 · ACTIVE CONTEXT
- Baseline: $143K/mo
- Actual savings: $112K/mo
- Attribution: 85% program-driven · 10% adjacent · 5% ambient
- Proposed pattern: "Healthcare IDN ambient doc consolidation"

ZONE 3 · DELIVERABLES
- [all prior approved]
- Outcome report · 100% · verified
- Fee proposal · 100% · approved

ZONE 4 · PHASE PROGRESS
●━━━●━━●━━●━━●━━●  Phase 5 · Verify · COMPLETE
Program outcome: 78% of target · Fee: $189K (15% share of verified $112K/mo annualized)
```

---

## 8 · Program ↔ Tower loop

Programs and Tower are symbiotic.

### Contradictions become programs

Tower detects contradictions continuously. Each contradiction has a "Trigger program" button. One click:
- Pre-loads contradiction context into new program Origination
- Nexus opens with awareness of the contradiction
- Phase 0 intake pre-filled with what Tower knows
- Saves ~30 minutes of setup

### Outcomes flow back to Tower

When a program verifies:
- The Tower tile for that contradiction updates from "open" to "resolved via program X"
- Actual outcome feeds Tower's value tracking
- Attribution data feeds Tower's accuracy calibration (learns which signals predict successful resolution vs. which don't)

### Ongoing program state in Tower

Every active program shows up in Tower as a tile:
- Current phase
- Value at stake
- Baseline status
- Last activity
- Projected completion

Executives live in Tower; they can see programs without opening them.

---

## 9 · Program ↔ Genome loop

Programs and the pattern library compound.

### Patterns activate in programs

During Phase 2 diagnosis, Nexus matches current program against Genome patterns. Matching patterns:
- Surface in the Active Context panel
- Inform Nexus's reasoning
- Get cited in deliverables

### Programs propose patterns

During Phase 5 verification, Nexus extracts pattern candidates:
- What archetype does this program represent
- What triggers did we see
- What options worked
- What magnitudes should future programs expect

Candidates enter a review queue. Approved candidates become official Genome patterns.

### Network effect

Every program run enriches Genome. Every new Genome pattern sharpens future programs. After 100 programs, Genome has seen 100 archetypes; after 1000, the pattern coverage approaches consulting-partner-level muscle memory.

**This is the core compounding moat AbarVa has vs. any LLM-wrapper competitor.**

---

## 10 · Program Console wireframe

The single hero surface. Every phase renders in this console.

```
┌─────────────────────────────────────────────────────────────────────────┐
│ [Abar Va]  Home  Programs  Intelligence  Tower  Platform    [Prat ▾]   │
├─────────────────────────────────────────────────────────────────────────┤
│ META STRIP                                                              │
│ Meridian Analytics Modernization · HEALTHCARE_IDN · Sarah Chen, CIO    │
│ Value at stake $24M · Baseline locked $143K/mo · MTD $112K saved       │
│ Phase 2 · Diagnose · Gate approved Apr 12 · Next: Design gate Apr 22   │
├──────────────────────────────────────────┬──────────────────────────────┤
│                                           │                              │
│  ZONE 1 · CONVERSATION (60%)              │  ZONE 2 · ACTIVE CONTEXT    │
│                                           │  (40%)                       │
│  [Nexus greeting / turn history]          │                              │
│                                           │  ACTIVE PATTERNS (5)         │
│  Nexus · 2 hours ago                      │  · F004 Vendor overlap       │
│  Diagnostic finding — overlap is          │  · F008 Consolidation        │
│  $143K/mo, not $478K. Tower double-       │  · F012 Specialty-first      │
│  counted specialty. Baseline updating.    │                              │
│                                           │  ASSIGNED TOPICS (2)         │
│  [▸ Checking pattern library]             │  · AI Governance · 8 of 17   │
│  [▸ Pulling industry + client context]    │  · Analytics Mod · 12 of 22  │
│  [▸ Pulling topic playbooks · 2 assigned] │                              │
│  [▸ Traversing chained patterns · 3]      │  CONTRADICTIONS (2)          │
│                                           │  · Abridge+DAX overlap       │
│  You · 1 hour ago                         │  · Adoption vs baseline gap  │
│  Specialty-first vs primary-first?        │                              │
│                                           │  PEER DECISIONS (3)          │
│  Nexus · 58 min ago                       │  · IDN-A chose specialty-    │
│  Three angles. [substantive answer with   │    first, 82% adoption       │
│  sources, confidence, next step]          │  · IDN-B chose specialty-    │
│                                           │    first, 78% adoption       │
│  [Source pills · F014 · IDN-B Case · ...] │  · IDN-C primary-first, 45%  │
│                                           │                              │
│  [Type a message to Nexus...]             │  RECENT LIBRARY REFS (5)    │
│                                           │  · F014 Specialty-first      │
│                                           │  · Abridge vendor profile    │
│                                           │  · Healthcare governance...  │
│                                           │                              │
├──────────────────────────────────────────┴──────────────────────────────┤
│ ZONE 3 · DELIVERABLES (horizontal scroll)                                │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐                 │
│  │ Charter  │  │Diagnosis │  │ Options  │  │ Bus Case │                 │
│  │ ✓ approv │  │ 85% rev  │  │  60% gen │  │  20%     │                 │
│  │ Apr 8    │  │ Apr 14   │  │ Apr 18   │  │ Apr 20   │                 │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘                 │
├─────────────────────────────────────────────────────────────────────────┤
│ ZONE 4 · PHASE PROGRESS                                                  │
│ ●━━━●━━━○━━━○━━━○                                                      │
│ Charter   Diagnose  Design   Execute   Verify                           │
│ ✓         in prog   gate Apr 22                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

**Key design principles applied:**

- **Meta strip (top)** always visible — outcome accountability is primary
- **60/40 split** between conversation and context — context panel is NOT a sidebar afterthought, it's first-class
- **Cognitive stages** visible during generation (the `[▸ ...]` beacons)
- **Source pills** visible by default under every Nexus turn
- **Deliverables strip** horizontal — scales with phase progress
- **Phase progress bar** anchors the bottom — you always know where you are

Compare this to a standard ChatGPT-style interface: same physical space, 3–4× more information per square inch, all of it signal, none of it clutter.

---

## 11 · Worked example · Prat runs Abridge/DAX consolidation at Meridian

The full program, day by day, as Prat would experience it.

### Day 0 · Origination (Monday 9:15am)

Prat lands on Home. Sees Tower alert: *"Abridge $340K/mo + Nuance DAX $138K/mo · regional overlap at Meridian · no consolidation owner named."* Clicks **Trigger program**.

Program console opens. Nexus greeting:

> Welcome back, Prat. I've loaded the Abridge + Nuance DAX overlap at Meridian into scope — $478K/mo as Tower detected it, though I'll want to verify that's not double-counting specialty vs. primary care.
>
> Before charter, three diagnostic questions:
>
> 1. Is this a cost optimization program (consolidate to save), a governance program (right-size risk posture), or both?
> 2. Who's the sponsor — Sarah Chen, given healthcare IDN context, or different?
> 3. What's your urgency — quarter-end cost signal, or can this run the full design cycle?
>
> Best case this becomes an $8–24M program over 6 months. Worst case it's a $2M vendor-renegotiation exercise in 6 weeks. The diagnostic questions will tell us which.

Prat answers inline: *"Cost + governance. Sarah. Full cycle."*

Nexus responds with scope hypothesis, value-at-stake range ($18–24M over 18 months), proposed topics (AI Governance + Vendor Rationalization from Pack L), and proceeds to Charter drafting.

Elapsed: 22 minutes. Program exists.

### Day 1–3 · Charter

Nexus drafts charter. Prat reviews, refines sponsor stake statement, approves. Baseline measurement plan drafted — how to quantify current Abridge + DAX spend, utilization, and overlap precisely.

Sarah (sponsor) receives auto-generated charter summary email. Approves via reply. Approval logged.

**Day 3 · Gate 1 approved.** Program enters Phase 2.

### Day 4–18 · Diagnose (2 weeks)

Nexus drives data gathering. Onboarding Companion collects contract PDFs, usage exports from both vendors, adoption metrics from EHR audit logs. Data ingested, classified, routed to L2 client context.

Nexus analyzes and surfaces findings progressively:

- Day 6: *"Actual overlap is $143K/mo, not $478K. Tower double-counted specialty primary usage — fixing the Tower tile."*
- Day 10: *"Pattern F012 triggered — 'Specialty-first migration 3.2× more successful than primary-first at healthcare IDNs.' Three peer precedents."*
- Day 14: *"Adoption data: Abridge at 72% primary care, 41% specialty. DAX at 38% primary, 63% specialty. The overlap window is smaller than it looks."*
- Day 16: *"Contradiction: Meridian's governance posture treats Abridge as Tier 2 (operational-clinical) but DAX as Tier 3 (productivity). Same category, different governance. Rationalizing may require governance harmonization first."*

By Day 18, Diagnosis deliverable complete. Baseline locked: **$143K/mo true overlap**. Program lead (Prat) reviews, approves.

**Day 18 · Gate 2 approved.** Program enters Phase 3.

### Day 19–35 · Design (2.5 weeks)

Nexus generates 3 options:

- **Option 1 · Retain both, rationalize usage.** Governance harmonization, no vendor change. $47K/mo savings through usage optimization. Lowest risk, smallest prize.
- **Option 2 · Migrate DAX → Abridge (specialty-first).** $98K/mo savings over 9 months. Medium risk, medium prize. Pattern F012 precedent.
- **Option 3 · Consolidate to DAX + retire Abridge.** $132K/mo savings but requires significant workflow change. Higher risk, bigger prize, weaker precedent.

Business case drafts. Peer benchmarks populated. Vendor landscape refreshed.

**Day 32 · Sponsor interview (CXO touch #1).** Sarah Chen, 45 minutes. Nexus prepares interview guide. Prat conducts. Transcript captured. Key signals extracted: Sarah concerned about PCP pushback on workflow change (rules out Option 3), prefers phased approach (rules out big-bang Option 2 variant), wants governance harmonization as prerequisite (integrates Option 1 into Option 2).

Nexus regenerates: **Option 2 with governance-first phasing** as recommended path. Savings revised to $87K/mo with higher confidence.

**Day 35 · Gate 3 approved.** Sarah commits to Option 2 (governance-first, specialty-first, phased). Fee structure confirmed: 15% outcome share of verified savings above locked $143K baseline minus governance costs.

### Day 36–180 · Execute (~5 months)

Month 1 (Day 36–65): Governance harmonization. Tier policies aligned. Abridge and DAX both Tier 2. Oversight committee formed. New approval workflow for both.

Month 2 (Day 66–95): Specialty-first migration begins. 3 specialty departments migrate from DAX to Abridge. Adoption monitored weekly. Adoption dips at week 10 — Nexus surfaces, proposes adjustment: additional training session. Adoption recovers by week 12.

Month 3 (Day 96–125): Remaining specialty migration. 7 more departments. Smoother — learning from Month 2.

Month 4 (Day 126–155): Primary care migration begins cautiously. Pattern F012 warned about PCP pushback — Nexus schedules biweekly PCP feedback sessions. Small issues surface and get resolved in-flight.

Month 5 (Day 156–180): Final migration. DAX decommissioned at Day 175. Contracts terminated.

Throughout: weekly status updates auto-drafted, monthly exec briefings go to Sarah + executive team. Nexus produces, Prat reviews, ships.

**Day 180 · Execute complete.** Program enters Phase 5.

### Day 181–210 · Verify

Actual savings measured: **$112K/mo over the Execute period, stabilizing at $118K/mo in final month.**

Target was $87K/mo. Achievement: **129% of target.**

Attribution analysis:
- 85% directly program-driven (migration happened, savings materialized)
- 10% adjacent (concurrent Meridian efficiency work contributed)
- 5% ambient (vendor pricing changes helped)

Outcome report drafted. Reviewed by AbarVa Maestro for attribution rigor. Approved.

**Day 198 · Verification interview (CXO touch #2).** Sarah confirms outcome. Signs fee approval.

Fee calculation:
- 15% outcome share of verified savings
- Annualized verified savings: $118K/mo × 12 = $1.42M/year
- First-year fee: **$213K**
- AbarVa earns $213K for a program that would have cost Meridian $2–4M with a traditional consulting firm

**Day 205 · Fee approved.** Finance processes.

Genome pattern candidate generated:

> **Proposed pattern F014-v2 · "Healthcare IDN ambient doc consolidation · governance-first sequencing"**
>
> Trigger: Two ambient doc vendors at IDN with regional overlap > $100K/mo
> Preconditions: Mixed tier classification across vendors
> Optimal sequence: Governance harmonization (Month 1) → specialty migration (Months 2-3) → primary migration (Months 4-5)
> Expected achievement: 100–130% of identified overlap
> Confidence: Medium-high (N=1 direct, 3 adjacent precedents)

Pattern reviewed by Maestro, approved into Genome.

**Day 210 · Program archived.** Outcome, attribution, fee, and pattern all logged. Meridian's next ambient doc decision will be informed by this program's learnings automatically.

---

## 12 · Implementation priorities

For Prat demo, the lifecycle must *feel* credible across at least one phase fully. Not all six.

**Must be fully built and data-rich (for demo):**

- Program Console with all 4 zones rendering real data
- Phase 2 · Diagnose rendered fully for Meridian (active patterns, contradictions, baseline locking)
- Phase 3 · Design partially rendered (options draft, peer decisions, interview prep)
- Meta strip with live values
- Phase progress bar with gate history
- Deliverables strip with 3+ deliverables in various states

**Must exist but doesn't need to be dense:**

- Phase 4 · Execute view (milestones visible, status update template)
- Phase 5 · Verify view (outcome report template)

**Can be specced but not rendered (for demo):**

- Genome pattern proposal flow from Phase 5

**Effort estimate for "demo-ready lifecycle":** ~20–25h of Claude Code + Codex parallel work. Biggest pieces:

1. Program Console 4-zone layout (~10h Codex + Claude Code)
2. Data seed extension — Meridian engagement turn history to 15+ turns, 3 deliverables in various states, baseline-lock event, Phase 2 gate approved with history (~6h Claude Code)
3. Meta strip component with live values (~3h Codex)
4. Phase progress bar with gate markers (~2h Codex)
5. Deliverables strip component (~3h Codex)

---

## 13 · Why this is the product

A traditional consulting engagement is:
- 6 months of work
- $2–5M fee
- Partner-heavy, margin-captured
- Knowledge walks out with the partners when it's done
- No compounding

An AbarVa program is:
- 6 months of work
- $100–500K fee (2–10× less)
- Nexus-heavy, Maestro-light
- Knowledge compounds into Genome
- Every program makes every future program sharper

Same outcome. Different economics. Different architecture. That's the whole pitch.

Every page we build from here renders this lifecycle for the buyer. Program console is the hero. Tower is the portfolio view. Intelligence is the knowledge view. Platform is the plumbing. Nexus is the partner that walks through all of it with the user.

When Prat sees this lifecycle rendered with Meridian's real data at Phase 2–3 depth, he will understand what AbarVa actually is in under 10 minutes. That's the demo.
