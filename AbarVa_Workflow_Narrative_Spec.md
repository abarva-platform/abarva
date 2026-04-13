# AbarVa — Workflow Narrative Specification
# All 9 Products — Complete Step-by-Step
# The design thinking behind every step of every product
# Version 1.0 — April 14, 2026

---

## HOW TO USE THIS DOCUMENT

This is the narrative layer for every product workflow in AbarVa.
Every step in every product must answer three questions implicitly:
1. Why am I here? (the stakes)
2. What am I learning I did not know before? (the intelligence value)
3. What decision does this prepare me for? (the action orientation)

Copy is non-negotiable. Do not improve or paraphrase.
Use exact headers and sub-headings as written.

---

## PRODUCT 1 — AI INVESTMENT INTELLIGENCE
## (formerly: AI Strategy)

Page header: AI INVESTMENT INTELLIGENCE
CXO Question: "Where should we place our bets — and what are they worth?"

### STEP 1: Ground Truth
Sub-heading: "Before you place any bets, you need to know what's actually
true. Here's what your data says — not what was presented to the board."

### STEP 2: Where Your Executives Disagree
Sub-heading: "Your executives don't all want the same things. Here's where
the fault lines are — and which ones will derail your AI program if you
ignore them."

### STEP 3: Every Bet Available to You
Sub-heading: "Here are every AI investment available to you, ranked by value.
Most of your competitors are chasing the wrong ones."
Failure Genome intro: "We've also scored each initiative against 7 historical
failure patterns. The ones marked red are high-value but high-risk. You'll
want to know why before you commit capital."

### STEP 4: Your Three Bets
Sub-heading: "These are your three bets. Everything else is a distraction
until these are delivering."
Controls label: "Adjust the filters to stress-test your bets"

### STEP 5: Wave 1 Starts in 90 Days
Sub-heading: "Wave 1 starts in 90 days. Here's exactly what happens, in what
order, and who owns what."
Metric card order: Total Investment → Annual Value → Blended ROI → McKinsey last

### STEP 6: Your Board Deck is Ready
Sub-heading: "This took 90 minutes. McKinsey would have charged $3.2M and
16 weeks for the same output."
Exports: HTML Board Presentation, Business Case Excel, Technical Roadmap
No PowerPoint.

---

## PRODUCT 2 — SITUATION INTELLIGENCE
## (formerly: Diagnose)

Page header: SITUATION INTELLIGENCE
CXO Question: "What's actually broken — and what's it costing us?"

### STEP 1: Select Your Role
Sub-heading: "The same data tells a different story depending on where you sit.
Choose your role — the intelligence surfaces what matters to you specifically."
Design note: Role selector is the FIRST and most prominent element.
This is the first personalization signal. It must feel like AbarVa already
knows who they are before they click anything.
Roles: CIO, CFO, CMIO, COO, CDO, CEO

### STEP 2: Your Situation, Right Now
Sub-heading: "Here is what's actually true — before anyone's had a chance
to prepare a presentation about it."
Design note: This is the contradiction reveal. The numbers shown here will
contradict what was in the last board deck. That contrast is the value.
Show three headline metrics with a contradiction flag on each gap.

### STEP 3: Ask Anything
Sub-heading: "Ask the question your team hasn't been able to answer.
Get a specific response with a number attached — not a framework."
Design note: The query interface. Pre-configured cards for common CXO questions
(role-specific). Also a free-text field. Response must stream visibly.
Every response must end with a dollar figure or percentage — never qualitative only.

### STEP 4: The Contradiction Map
Sub-heading: "Here is where what's been reported and what's actually
happening diverge. These are not data errors — they are the gaps your
team has been managing around."
Design note: Visual map of contradictions between reported vs actual.
Each contradiction links to a source document. Clicking reveals the evidence.

### STEP 5: What This Is Costing You
Sub-heading: "Every gap has a price. Here's the running total — and which
three are worth fixing first."
Design note: Financial quantification of each contradiction.
Ranked by dollar impact. The top three are pre-selected as "Start here."

### STEP 6: Your Situation Brief is Ready
Sub-heading: "One page. Every number. Ready to share before the next
conversation."
Exports: HTML Situation Brief (mobile-readable), PDF version
Design note: This is what the Maestro sends to the CXO before a meeting.
One page. All numbers. No narrative. Just the truth.

---

## PRODUCT 3 — BUSINESS CASE INTELLIGENCE
## (formerly: Justify)

Page header: BUSINESS CASE INTELLIGENCE
CXO Question: "How do I make this number defensible to my board?"

### STEP 1: The Investment You're Defending
Sub-heading: "Tell us what you're asking the board to approve.
We'll build the case that holds up when the skeptical director pushes back."
Design note: Input screen. Initiative name, total investment ask, target outcome.
Simple — three fields. The intelligence comes in the next steps.

### STEP 2: Your Baseline — The Number You're Starting From
Sub-heading: "Before you can prove ROI, you need an undisputed starting point.
Here's what your data shows — signed off before anyone sees the projection."
Design note: Pulls from Situation Intelligence if already run. Otherwise
prompts upload. The baseline must be established and timestamped —
this is the foundation of outcome tracking and the future outcome fee model (Series A).
Show current state metrics with source citations.

### STEP 3: The Three Scenarios
Sub-heading: "Conservative. Base case. Aggressive. Your CFO will ask for
all three. Here they are — with the assumptions behind each one visible."
Design note: Three scenario models side by side. Each shows:
- Total investment (implementation + platform fee)
- Year 1, Year 2, Year 3 savings
- NPV at discount rate (editable)
- Payback period in months
- Confidence interval
CFO-grade. Every assumption is visible and editable.

### STEP 4: The Benchmark
Sub-heading: "How does this compare to what similar organizations have achieved?
Here's the peer data — so your projection isn't a number you invented."
Design note: Peer benchmarks from the Transformation Genome.
Shows similar initiative, similar org size, similar vertical.
The benchmark validates the scenario — or flags if the projection is unrealistic.
This is the most powerful credibility tool in the product.

### STEP 5: The Attribution Method
Sub-heading: "Your CFO's first question will be: how do we know Abarva caused
this? Here is the methodology — before they ask."
Design note: Attribution framework shown as a visual flow.
Baseline → Initiative → Metric change → Attribution logic.
Shows exactly how savings will be calculated and verified at close.
This is what makes outcome tracking credible — and prepares the outcome fee
model that activates at Series A.

### STEP 6: Your Board Presentation is Ready
Sub-heading: "Three scenarios, peer benchmarks, attribution methodology,
and a payback period your CFO cannot dismiss — in one document."
Exports: HTML Board Presentation, CFO Excel Model (3 scenarios, full assumptions),
One-Page Summary (for pre-read)

---

## PRODUCT 4 — VENDOR INTELLIGENCE
## (formerly: Select)

Page header: VENDOR INTELLIGENCE
CXO Question: "Who do I actually trust — and why?"

### STEP 1: What You're Selecting For
Sub-heading: "Before we score anything, tell us your actual situation — not
what the RFP template asks for. Your requirements are different from
every other organization's."
Design note: Intake screen. Category (EHR, RCM, Cloud, Analytics, etc.)
Contract timeline, budget range, compliance requirements, existing ecosystem.
This input is what makes the scoring specific — not generic.

### STEP 2: The Vendor Landscape
Sub-heading: "Here are every vendor in this category. Here's what they
actually deliver — not what their sales team says."
Design note: Vendor grid. Each vendor card shows:
- Overall score (0-100, calculated from client's specific situation)
- Implementation risk score
- Reference quality score (KLAS, G2, actual client interviews)
- SLA performance vs contract
- Referral disclosure badge if applicable: "★ AbarVa earns referral fees
  from this vendor — disclosed, does not affect scoring."
Sort by fit score default. Client can re-sort by any dimension.

### STEP 3: Your Top Three — Scored Against Your Situation
Sub-heading: "These three fit your situation best. Here's exactly why —
and what each one gets wrong."
Design note: Deep dive on top 3. Side-by-side comparison.
For each vendor: strengths specific to this client's situation,
risks specific to this client's situation, implementation timeline,
realistic Year 1 cost (not list price), reference clients similar to this org.
No generic pros/cons. Every point references the client's specific inputs.

### STEP 4: The References You Actually Need
Sub-heading: "Not the references they gave you. The ones who have the
same situation you do."
Design note: Reference matching engine. Finds organizations from the
Transformation Genome with similar: size, vertical, tech stack, initiative type.
Shows what outcome they achieved. Shows implementation timeline actual vs promised.
This is the data vendors do not want clients to have.

### STEP 5: The Negotiation Intelligence
Sub-heading: "Here's what they've accepted in other contracts —
and what you should never agree to."
Design note: Contract intelligence from the Genome.
Shows: typical discount off list (by vendor, by deal size), SLA terms
that have been negotiated successfully, red flag clauses to reject,
implementation timeline buffer to build in (vendor actual vs promised).

### STEP 6: Your Vendor Decision is Ready
Sub-heading: "Independent analysis. Disclosed relationships.
The recommendation your procurement team can defend."
Exports: Vendor Scorecard (HTML), RFP Template (Word), 
Negotiation Brief (PDF — confidential)
Note: Referral disclosure appears on every export cover page.

---

## PRODUCT 5 — OUTCOME INTELLIGENCE
## (formerly: Control Tower)

Page header: OUTCOME INTELLIGENCE
CXO Question: "Are we winning — or just spending?"

### TAB 1: Portfolio Overview
Sub-heading: "Every AI initiative. What was promised. What's been delivered.
What the gap is — in dollars."
Design note: The single most important view in the product.
Shows all active initiatives in a heat map.
Green = on track. Yellow = at risk. Red = behind.
Each initiative shows: promised savings, realized savings to date, gap.
No initiative is hidden. No number is softened.

### TAB 2: Initiative Deep Dive
Sub-heading: "What's actually happening inside this initiative —
not what the status report says."
Design note: Click any initiative from Portfolio Overview.
Shows: milestone completion vs plan, budget spent vs allocated,
team velocity, blockers by category, last Maestro assessment.
Evidence-based. Every metric cites its source.

### TAB 3: Outcome Verification
Sub-heading: "Here is what was promised versus what has been delivered —
in dollars, against the baseline we established at the start."
Design note: The financial close process.
Shows: original baseline metrics, current metrics, delta, attribution score.
Three-party verification: AbarVa calculation, client finance sign-off,
third-party audit (at >$5M outcomes).
This tab is what makes outcome accountability real — and what activates
the outcome fee model at Series A.

### TAB 4: Failure Genome
Sub-heading: "These are the patterns that kill AI programs.
Here's where your portfolio is exposed."
Design note: The 7 (growing to 50+) failure patterns from the Genome.
Each pattern shows: description, historical frequency, early warning signals.
Portfolio is scored against each pattern. Red = exposed. Yellow = watch.
This is AbarVa's proprietary IP — show it, but don't explain the methodology.

### TAB 5: Board Report
Sub-heading: "The AI portfolio update your board actually wants —
one page, all outcomes, no activity metrics."
Design note: Auto-generated board report.
Shows only outcomes (savings realized, revenue generated, headcount avoided).
Never shows inputs (hours spent, meetings held, decks produced).
Refreshes automatically. Maestro reviews before sending.

### TAB 6: Maestro Notes
Sub-heading: "What your Maestro sees that the data doesn't show."
Design note: Qualitative layer on top of the quantitative data.
Maestro assessment of: political risks, team dynamics, leadership attention,
upcoming decision points. Private to client — not in board report.

### TAB 7: Alerts & Escalations
Sub-heading: "When something needs your attention before it becomes a problem."
Design note: Proactive alerts triggered by: milestone slip >2 weeks,
budget variance >10%, team velocity drop >20%, Failure Genome pattern activated.
Each alert has: severity, recommended action, Maestro contact.
Alerts go to CXO email within 24 hours of trigger.

---

## PRODUCT 6 — DELIVERY INTELLIGENCE
## (formerly: AI-PDLC)

Page header: DELIVERY INTELLIGENCE
CXO Question: "Are we shipping faster — or just adding tools?"

### STEP 1: Your Current Delivery Baseline
Sub-heading: "Before we tell you where to improve, we need to know
where you actually are — not where your sprints say you are."
Inputs: team size, tech stack, current AI tools in use, sprint velocity,
deployment frequency, incident rate, lead time for changes.

### STEP 2: Peer Benchmark
Sub-heading: "Here's how your delivery performance compares to organizations
your size, in your vertical, with your stack."
Show: percentile ranking on each DORA metric. Where you're ahead.
Where you're behind. What the gap costs in delayed value delivery.

### STEP 3: Where AI Tools Are Actually Helping
Sub-heading: "Not all AI tools improve delivery. Here's which ones
are moving your metrics — and which ones are adding friction."
Tool-by-tool assessment. Each tool scored on: velocity impact,
quality impact, adoption rate, cost per developer per month.
Net impact score. Retire recommendation for negative-impact tools.

### STEP 4: The Toolchain That Fits Your Situation
Sub-heading: "The specific combination of tools that organizations like
yours use to ship 40% faster — and what it costs to get there."
Recommended toolchain for this client's specific situation.
Implementation sequence. Expected velocity gain by quarter.
Cost vs current toolchain spend.

### STEP 5: Your Delivery Roadmap
Sub-heading: "90 days to measurably faster. Here's exactly what changes,
in what order, and who owns what."
Same format as AI Investment Intelligence Step 5.
Wave 1 = quick wins (tool rationalization, process standardization).
Wave 2 = capability build (AI pair programming, automated testing).
Wave 3 = optimization (deployment automation, ML pipeline).

---

## PRODUCT 7 — WORKFORCE INTELLIGENCE
## (formerly: Future of Work)

Page header: WORKFORCE INTELLIGENCE
CXO Question: "What does my team look like in 18 months?"

### STEP 1: Your Current Workforce Map
Sub-heading: "Before AI changes anything, here is what your organization
actually looks like — by role, by function, by task composition."
Upload or integrate: org chart, role descriptions, headcount by function.
Task composition analysis: what percentage of each role is automatable,
augmentable, or human-only in the next 18 months.

### STEP 2: The AI Impact by Role
Sub-heading: "Role by role — what changes, what disappears,
what becomes more valuable, and by when."
Visual timeline. Each role shown on a spectrum:
Unchanged → Augmented → Transformed → Displaced.
Percentage of tasks affected. Confidence interval.
No euphemisms. This is the honest assessment CHROs cannot get elsewhere.

### STEP 3: The Reskilling Gap
Sub-heading: "Here's the distance between where your workforce is today
and where it needs to be in 18 months — and what it costs to close it."
Gap analysis by skill domain.
Current proficiency vs required proficiency.
Training options: build (internal L&D), buy (external programs), rent (contractors).
Cost and timeline for each path.

### STEP 4: The Workforce Plan
Sub-heading: "Who stays, who grows, who transitions, and who you need
to hire — with a timeline your CHRO can execute."
Cohort-based plan. Not individual — functional groups.
Wave 1: protect the core (roles critical to 12-month plan).
Wave 2: reskill the augmentable (biggest ROI on training investment).
Wave 3: transition support (roles that will not exist in 18 months).

### STEP 5: The Board Communication
Sub-heading: "Your board will ask about this. Here's how to answer —
before they ask it in the wrong moment."
Draft board communication. Frames workforce evolution as:
strategic advantage, not cost reduction; reskilling investment, not displacement.
Includes: timeline, investment, and expected productivity improvement.

---

## PRODUCT 8 — DATA ESTATE INTELLIGENCE
## (formerly: Analytics Modernization)

Page header: DATA ESTATE INTELLIGENCE
CXO Question: "Is our data estate an asset or a liability?"

### STEP 1: The Inventory
Sub-heading: "Before you can modernize anything, you need to know
what you actually have — all of it, including what nobody talks about."
Automated discovery: connects to data catalog or uploads manifest.
Shows: every report, dashboard, job, stored procedure, workbook.
Organized by: business domain, user count, last accessed, owner.
The number is always larger than the client expects. That's the point.

### STEP 2: The Rationalization Assessment
Sub-heading: "Most of what you're maintaining has no active users.
Here's what's actually being used — and what's just costing you money."
Usage analysis. Each asset classified:
Active (>10 users/month), Occasional (<10 users), Dormant (0 in 90 days).
Cost-to-maintain per asset (infrastructure + engineering hours).
Total annual cost of dormant assets. This number shocks every CDO.

### STEP 3: Modernize, Retire, or Defer
Sub-heading: "Every asset gets a verdict. Here's the logic behind each one —
and the sequence that minimizes disruption."
Three-bucket classification for every asset.
Modernize: high usage, strategic value, migration path clear.
Retire: low/no usage, high maintenance cost, no strategic value.
Defer: moderate usage, unclear migration path, low maintenance cost.
Migration complexity score. Dependency map. Risk of retiring each asset.

### STEP 4: The Migration Sequence
Sub-heading: "In what order do you touch things — to avoid breaking
what matters while eliminating what doesn't."
Wave-based migration plan.
Wave 1: retire the dead weight (zero disruption, immediate cost savings).
Wave 2: migrate the high-value (modernize top 20% by usage and strategic value).
Wave 3: rationalize the rest (defer decisions until Wave 1 and 2 complete).

### STEP 5: The Business Case
Sub-heading: "The cost of your current estate vs the cost of your
modernized estate — and the savings that justify the investment."
TCO comparison: current vs modernized.
Shows: infrastructure savings, engineering time savings,
decision-making improvement (time from question to answer).
Payback period. NPV at 3 years. CFO-grade.

---

## PRODUCT 9 — PROCUREMENT INTELLIGENCE
## (formerly: Marketplace)

Page header: PROCUREMENT INTELLIGENCE
CXO Question: "What should we buy — and what are we already paying for?"

### STEP 1: Your Current Technology Spend
Sub-heading: "Most organizations are paying for tools nobody is using.
Here's what you're actually spending — and what you're getting for it."
Input: current vendor contracts (upload or connect to procurement system).
Shows: total annual spend by category, utilization rate by tool,
cost per active user, contract renewal dates.
Overlap analysis: tools that do the same thing. Consolidation opportunity.

### STEP 2: What the Market Offers
Sub-heading: "Here is every tool in this category — scored against
your specific situation, not the analyst's generic ranking."
Scored vendor grid specific to this client.
Every score calculated from: client's tech stack, compliance requirements,
team size, existing contracts, budget.
Referral disclosure on every vendor that has a referral agreement:
"★ AbarVa earns referral fees from this vendor — disclosed, does not
affect scoring. Scoring methodology is published and auditable."

### STEP 3: The Consolidation Opportunity
Sub-heading: "Here's where you're paying twice for the same capability —
and the consolidation that saves the most with the least disruption."
Overlap map: which tools duplicate which capability.
Consolidation scenario: if you retire these 3 tools and consolidate to 1,
here is the annual saving, the migration effort, and the risk.
Net recommendation: consolidate, rationalize, or hold.

### STEP 4: What to Buy Next
Sub-heading: "Based on your current gaps and your roadmap, here are
the tools that will have the highest impact — in priority order."
Recommendation list. Each tool:
- Why it fits this client specifically (references their inputs)
- Total cost including implementation
- Expected time to value
- Which team owns it
- Referral disclosure if applicable

### STEP 5: Your Procurement Plan
Sub-heading: "Renewals coming up. New purchases prioritized.
Consolidations sequenced. One plan your procurement team can execute."
12-month procurement calendar.
Month-by-month: renewals to renegotiate, contracts to cancel,
new purchases to initiate, consolidations to begin.
Total 12-month spend: current vs optimized. Annual saving.

---

## HOMEPAGE HERO COPY

Headline (Fraunces, 52px, 900, white):
"Act on intelligence.
Before the window closes."

Sub-heading (DM Sans, 18px, 400, #94A3B8):
"AbarVa gives you what consultants never could — intelligence from your
own data, accountable to your actual outcomes."

CTA primary: "See it in action →" (teal button)
CTA secondary: "Book a Demo" (outlined)

---

## INVESTOR PAGE HERO COPY

Headline (Fraunces, 52px, 900, white):
"$200 billion spent on transformation consulting.
Outcomes are almost never tracked."

Sub-heading (DM Sans, 20px, 400, #94A3B8):
"AbarVa is the first platform to make enterprise transformation
accountable — not to a consulting firm's billable hours, but to
your actual business outcomes."

McKinsey callout card (use exactly once, teal accent):
"This took 90 minutes. McKinsey would have charged $3.2M
and 16 weeks for the same output."

---

## COPY RULES — Apply Everywhere

1. Never describe a mechanism. Describe the value to the CXO.
   BAD: "AI readiness from loaded client data"
   GOOD: "What's actually true — not what was presented to the board"

2. Every step must have stakes before the answer.
   The CXO needs to feel why this matters before they see the data.

3. Numbers always. Every response, every step summary, every export
   must contain at least one specific dollar figure or percentage.
   Qualitative-only responses are never acceptable.

4. The McKinsey line appears exactly once — Step 6 of AI Investment
   Intelligence and once on the investor page. Nowhere else.

5. "Bets" not "opportunities". "Derail" not "risk". "Actually" not
   "currently". These word choices are deliberate. Do not swap them
   for professional-sounding alternatives.

6. Referral disclosure on every vendor recommendation, every time:
   "★ AbarVa earns referral fees from this vendor — disclosed,
   does not affect scoring."

