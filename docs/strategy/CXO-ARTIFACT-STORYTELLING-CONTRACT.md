# CXO Artifact Storytelling Contract

**Status:** v1 shared contract for CXO/client-facing artifacts.  
**Parent standard:** `CXO-ARTIFACT-EXCELLENCE-FRAMEWORK.md`.  
**Applies to:** Source, Moves, Intelligence, Tower, Home/Context readouts and any
future client artifact generator.  
**Purpose:** make AbarVa artifacts read like advisory decision products, not
software reports.

## 1. Operating Principle

AbarVa artifacts must answer the executive question before they show the
evidence. A consulting-quality artifact does not start by asking "what charts
should we show?" It starts by asking:

1. What executive story are we proving?
2. What decision should the reader make?
3. What evidence makes that decision credible?
4. What happens if the reader does nothing?
5. What action should happen next?

Charts, tables and diagrams are mandatory where relevant, but they exist to
advance the story. Decorative visuals do not count.

## 2. Required Story Spine

Every material CXO artifact must carry this spine, even when the content appears
as a deck, DOCX, PDF, HTML dossier or aVa answer.

| Story element | Required answer | Typical visual |
|---|---|---|
| Executive message | The recommendation in three sentences or fewer. | Decision card |
| So what | Why the issue matters to the enterprise now. | Value/risk callout |
| Where value is moving | What creates, leaks, protects or delays value. | Value tree, exposure bridge, waterfall |
| Why it happened | The operating, commercial, technical or governance mechanism behind the symptom. | Root-cause map |
| What should happen | The action path, timing and owners. | Timeline, roadmap, swimlane |
| Options and tradeoffs | The serious options, why not, and what would change the answer. | Options matrix, scenario table |
| Commercial/opportunity map | How findings cluster into executive opportunity themes. | 2x2/4-quadrant map |
| If we do nothing | Consequence path and risk/cost of inaction. | Do-nothing vs act scenario |
| Business impact | Impact mapped to revenue, cost, risk, speed, customer and compliance. | Impact scorecard |
| Evidence and caveats | What proves it, what is missing, and what cannot be claimed yet. | Evidence/gap matrix |

## 3. Page-Level Advisory Pattern

For board-pack or steering-committee deliverables, the first five pages should
follow this pattern unless the artifact-specific standard is stricter.

### Page 1 - Executive Message

Three sentences:

1. The decision/recommendation.
2. The quantified or qualified value/risk basis.
3. The next action and decision owner.

Example for Source contract optimization:

> SkyHarbor's incumbent AMS agreement should not be renewed under its current
> commercial baseline. AbarVa identified approximately $3.6M-$4.8M of annualized
> commercial exposure driven primarily by invoice variance, staffing gaps,
> recurring change-order normalization and weak SLA economics. The recommended
> action is to issue a cure notice immediately, renegotiate under defined
> commercial conditions and preserve competitive leverage through a prepared RFP.

### Page 2 - Where Value Is Moving

Show a value tree, exposure bridge, waterfall or equivalent that explains where
money, risk, cycle time or value is moving. The page title must be a takeaway,
not a label.

Example:

`Invoice leakage -> recurring change orders -> weak SLA credits -> underfilled staffing -> productivity not priced back`

### Page 3 - Why It Happened

Explain the mechanism, not just the metric. A finding like "invoice variance" is
not enough. The artifact must explain why the operating or commercial model is
creating the result.

Example:

`The contract commercial model no longer reflects today's operating reality.`

### Page 4 - What Should Happen

Show an action timeline or swimlane. Executives should see sequence and decision
points immediately.

Example:

`Today -> cure notice -> commercial reconciliation -> vendor response -> executive decision -> renew with conditions or competitive event`

### Page 5 - Negotiation / Execution Strategy

Group actions by executive theme, not by raw findings.

Example Source themes:

- Commercial recovery
- Service accountability
- Operating model
- Future cost reduction
- Competitive pressure

## 4. Commercial Opportunity Map

Source and other commercial artifacts should translate findings into a
Commercial Opportunity Map whenever commercial value is involved.

| Quadrant | Meaning | Example Source findings |
|---|---|---|
| Recover cash | Correct current leakage or overbilling. | Invoice variance, unsupported pass-throughs |
| Reduce future spend | Prevent the baseline from inflating. | Change-order normalization, productivity glidepath |
| Reduce operational risk | Improve continuity, quality and control posture. | Weak SLA economics, ticket/reopen pressure |
| Increase vendor accountability | Convert claims into obligations, credits and controls. | Staffing true-up, chronic-miss escalators |

This map is reusable beyond sourcing: cloud spend, SaaS portfolios, ERP support,
BPO, MSP, AI vendors and infrastructure outsourcing can all use the same pattern.

## 5. Universal Business Impact Taxonomy

Every material finding or recommendation should map to one or more of these
impact categories:

| Impact category | The executive question |
|---|---|
| Revenue | Does this grow, protect or accelerate revenue? |
| Cost | Does this reduce spend, leakage, waste or run-rate? |
| Risk | Does this reduce operational, vendor, security, financial or execution risk? |
| Speed | Does this improve cycle time, time-to-value or decision velocity? |
| Customer | Does this improve customer/member/employee/provider experience? |
| Compliance | Does this improve audit, legal, regulatory, privacy or control posture? |

Artifacts should not stop at `facts -> insights -> recommendation`. They must
continue to `business impact`.

## 6. Claude / Model Instruction Rule

When an artifact uses a model to phrase or synthesize the final narrative, the
prompt must give the model a structured story packet, not loose context.

The packet should include:

- `executiveMessage`
- `decisionAsk`
- `storySpine`
- `visualExhibits`
- `businessImpact`
- `evidenceBasis`
- `knownGaps`
- `forbiddenClaims`

The model may phrase the story. It must not invent facts, joins, values,
relationships, evidence or visuals. If a required story element lacks evidence,
the artifact must show an explicit gap or owner.

## 7. Acceptance Criteria

A client artifact passes this contract only if:

1. The first page or first screen states the executive message in three
   sentences or fewer.
2. The artifact explains "so what", "why", "what should happen" and "what if we
   do nothing".
3. Every major finding maps to at least one business impact category.
4. Tables, charts, trend charts, diagrams or maps are included where they clarify
   the decision.
5. Visuals are generated from deterministic view models or clearly marked as
   conceptual.
6. Evidence/caveats are visible without leading the artifact.
7. Details move to appendices when they interrupt the executive story.
8. The artifact remains editable where the client is expected to redline or
   approve it.

## 8. Immediate Backlog Implication

The next Source and Moves artifact work should not add more generic feature
surface first. It should make storytelling unmistakably advisory-grade:

- Source contract optimization: create a true board-pack renderer with
  executive message, value tree, root-cause map, action timeline, opportunity
  map and business-impact scorecard.
- Source RFP/evaluation: convert vendor profiles, challenge logs and decision
  briefs into the same executive story spine.
- Moves: apply the same spine to current-state, solution approach, architecture,
  roadmap, business case and handoff artifacts.
