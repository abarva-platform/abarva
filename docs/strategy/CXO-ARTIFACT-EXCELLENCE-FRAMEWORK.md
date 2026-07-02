# CXO Artifact Excellence Framework

**Status:** v1 canonical standard for AbarVa-generated executive artifacts.
**Applies to:** Intelligence, Moves, Source, Tower, Context and future modules.
**Purpose:** make every CXO artifact materially better than a traditional top-tier
consulting deliverable by combining consulting-grade storyline and exhibits with
AbarVa's advantages: live tenant context, deterministic evidence lineage, editable
outputs, and no-fabrication governance.
**Storytelling contract:** use `CXO-ARTIFACT-STORYTELLING-CONTRACT.md` for the
required executive message, value tree, root-cause explanation, action timeline,
opportunity map, do-nothing scenario and business-impact taxonomy.

## 1. The Bar

AbarVa artifacts should not merely look like consulting slides. They must outperform
them on the dimensions software can own:

| Dimension | Traditional top-tier deck expectation | AbarVa must exceed it by |
|---|---|---|
| Answer | Clear recommendation and rationale | Recommendation plus kill logic, confidence, owner and what would change the answer. |
| Evidence | Cited interviews, analysis and benchmarks | Every claim traceable to tenant substrate, source artifact, assumption or explicit gap. |
| Financials | ROI, investment, sensitivity | Planning-grade ranges, rate-card basis, assumption ledger and what breaks the case. |
| Visuals | Clean exhibits and tables | Required exhibit catalog per artifact, generated from typed view models, never decorative filler. |
| Storyline | Situation-complication-resolution | Decision-first pyramid with action register, governance state and handoff owner. |
| Usability | Static deck for meeting discussion | HTML dossier for live navigation plus editable PPTX for executive circulation. |
| Governance | Partner review and QA | Deterministic score, hard fails, artifact health and audit headers before export. |
| Update path | Manual analyst refresh | Recompute from context layer, mark stale inputs and preserve reviewer sign-off. |

The goal is not "pretty output." The goal is a decision artifact a CXO can use in
3 minutes, defend in 30 minutes and audit 6 months later.

## 2. Non-Negotiable Artifact Anatomy

Every board-grade artifact must contain these sections, even if a section renders
as an honest gap:

1. **Executive answer.** The one-sentence recommendation, decision, confidence and
   owner above the fold.
2. **Why now.** Timing, trigger, urgency, downside of delay and decision window.
3. **Evidence basis.** Tenant facts, source artifacts, corpus patterns, assumptions,
   freshness and missing inputs.
4. **Options considered.** The serious alternatives and why each wins, loses or
   remains open.
5. **Economics.** Investment, value, payback, range, sensitivity, rate-card basis and
   financial caveats where relevant.
6. **Risk and controls.** Operational, security, data, legal, regulatory, vendor and
   adoption risk, with controls and owners.
7. **Expert challenge.** What a CFO, CIO, sourcing VP, legal lead or delivery partner
   would attack.
8. **Decision ask.** Approve, shape, stop, gather evidence, negotiate, rebid, fund or
   escalate, with named next actions.
9. **Measurement handoff.** What Tower or the relevant downstream surface will track,
   from which baseline, on what cadence.
10. **Appendix / trace.** Supporting evidence, assumptions, artifact links and
    reviewer state.

If an artifact lacks the answer, evidence, economics where applicable, challenge
logic and next action, it is not CXO-ready.

## 2.1 Advisory Story Spine

For material client artifacts, "answer first" is necessary but not sufficient.
The artifact must also explain the executive story:

1. **Executive message:** three sentences or fewer.
2. **So what:** why the issue matters now.
3. **Where value is moving:** value tree, exposure bridge, trend or equivalent.
4. **Why it happened:** root-cause mechanism, not just a metric label.
5. **What should happen:** timeline, roadmap or swimlane with owners.
6. **Options and tradeoffs:** serious alternatives and what would change the answer.
7. **If we do nothing:** consequence path and downside of inaction.
8. **Business impact:** every material finding maps to revenue, cost, risk, speed,
   customer and/or compliance.

This spine is defined in `CXO-ARTIFACT-STORYTELLING-CONTRACT.md` and represented
in code by `src/lib/artifacts/cxo-storytelling-contract.ts`.

## 3. Required Exhibit Families

Every artifact type must declare which exhibit families are required. A "visual" can
be a chart, table, heatmap, map, matrix, timeline or scorecard, but it must help the
decision. Decoration does not count.

| Exhibit family | What good looks like | Typical artifacts |
|---|---|---|
| Decision card | Verdict, confidence, owner, blocker, next gate. | All CXO artifacts |
| Value/investment bridge | Baseline -> opportunity -> investment -> net value. | Business case, Source CXO report, Tower pack |
| Sensitivity stack | The 3-5 assumptions that move the answer most. | Business case, financial model, Source economics |
| Scenario range | Conservative/base/upside with explicit assumptions. | Moves, Source, Tower |
| Evidence/gap matrix | Claim, evidence source, freshness, confidence, gap owner. | All artifacts |
| Options comparison | Alternatives, score, trade-offs, why not. | Moves architecture, Source selection, Intelligence bet shaping |
| Risk/control heatmap | Risk, severity, control, owner, residual exposure. | Source risk, Moves controls, Tower |
| Roadmap/swimlane | Workstreams, milestones, dependencies, owners. | Moves mobilization, Source transition |
| Commercial normalization | Apples-to-apples pricing/TCO/contract term comparison. | Source |
| Measurement handoff | Baseline, target, metric, cadence, system of record. | Moves, Tower |
| Value tree / opportunity map | Findings grouped into recover cash, reduce future spend, reduce risk and increase accountability. | Source, Moves, Tower |
| Do-nothing vs act scenario | Consequence of inaction compared to recommended path. | Source, Moves, Intelligence |
| Business impact scorecard | Impact mapped to revenue, cost, risk, speed, customer and compliance. | All material CXO artifacts |

## 4. Quality Score

The quality score is out of 100 and uses the same dimensions across all modules.

| Dimension | Weight | Minimum expectation |
|---|---:|---|
| Decision sharpness | 14 | Answer first; no reader hunts for the recommendation. |
| Executive storyline | 12 | Pyramid logic, meeting-ready flow, no generic filler. |
| Evidence grounding | 14 | Claims trace to tenant substrate, artifacts or explicit gaps. |
| Financial defensibility | 12 | Ranges, assumptions, sensitivity and source of rates/value. |
| Exhibit quality | 12 | Required visuals exist and carry real decision logic. |
| Expert challenge | 10 | Critic logic says what could make the recommendation wrong. |
| Actionability | 10 | Named decisions, owners, dates, handoffs and next actions. |
| Governance/auditability | 8 | Freshness, confidence, reviewer state and no-fabrication proof. |
| Editability/readability | 8 | HTML is navigable; PPTX is editable; pages are readable under pressure. |

Minimum export bars:

- **CXO preview:** 80/100, no critical hard fail.
- **Board/ELT circulation:** 90/100, no hard fail, all required exhibit families present.
- **Gold standard sample:** 94/100, no hard fail, peer-review notes closed.

## 5. Hard Fails

Any hard fail overrides the numeric score.

1. No explicit recommendation or decision ask.
2. A financial claim without source, assumption or range.
3. A metric, rate, benchmark or value claim invented from missing data.
4. A business case without sensitivity.
5. A sourcing recommendation without options considered.
6. A solution architecture without at least one grounded diagram or explicit diagram gap.
7. A risk/control artifact without owners or residual exposure.
8. A deck that cannot be edited where PPTX is the requested format.
9. Stale or missing evidence hidden from the reader.
10. Placeholder/scaffold language visible to the CXO.
11. Artifact lacks the decision job it is supposed to support.
12. Visuals are decorative rather than decision-useful.

## 6. Review Workflow

Every material artifact generation path should follow this gate sequence:

1. **Build typed view model.** No prose-only artifact path.
2. **Run evidence resolver.** Mark evidence, freshness, confidence and gaps.
3. **Run expert critic.** CFO, CIO, sourcing, legal/risk and delivery objections.
4. **Render HTML dossier.** Governed, current, navigable.
5. **Render PPTX when needed.** Editable, meeting-ready, same content spine.
6. **Score artifact.** Dimensions, hard fails, missing sections, missing exhibits.
7. **Block or watermark.** If below bar, show "review draft" and list gaps.
8. **Capture review.** Human reviewer verdict, comments, owner and sign-off state.
9. **Preserve trace.** Export headers, generated-at, source IDs, assumptions and score.

## 7. Module Application

| Module | Application |
|---|---|
| Intelligence | CXO briefs must show decision thesis, tenant facts, options, contradictions, evidence gaps and promote-to-Move path. |
| Moves | Business cases, architecture packs, estimates and go-decision packs must include financial spine, sensitivity, critic logic and Tower measurement handoff. |
| Source | Every Source event must have a CXO narrative report in HTML and PPTX, plus artifact-level standards for demand, scope, RFP, pricing, evaluation, risk, selection and renewal. |
| Tower | Board packs must distinguish projected, tracked and verified value, surface action queue, adoption signals and outcome evidence gaps. |
| Context | Context readouts must show segment freshness, confidence, data owner, source system and what cannot be answered yet. |

## 8. What "Better Than McKinsey/Bain" Means Here

This phrase is not a license to imitate a brand style. It is an operating standard:

- The storyline must be as crisp as a senior partner's board deck.
- The exhibits must be as clean as a top-tier consulting pack.
- The evidence trace must be stronger than a static consulting deck can provide.
- The artifact must be recomputable from live context.
- Missing evidence must be more honest than a human analyst under pressure.
- The output must be both board-readable and machine-auditable.

If an artifact only looks polished but cannot prove its claims, it fails. If an
artifact is well-grounded but visually hard to use, it also fails. The bar is both.

## 9. Implementation Rule For Future PRs

Any future PR that creates or materially changes a CXO-facing artifact must report:

- artifact kind and decision job;
- generated sections and exhibits;
- quality score before/after;
- hard fails closed;
- remaining gaps or seed gaps;
- HTML/PPTX/DOCX/XLSX byte validation where applicable;
- screenshot or generated sample path for visual review;
- explicit statement that no top navigation changed unless requested.
