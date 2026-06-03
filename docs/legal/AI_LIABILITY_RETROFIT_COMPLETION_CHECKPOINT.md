# AI Liability Retrofit Completion Checkpoint

Status: pilot completion checkpoint
Owner: AbarVa platform owner
Last updated: 2026-06-03
Backlog row: T251

This checkpoint rolls up the AI liability retrofit rows T231-T250 into one
reviewable completion view. It does not replace the detailed catalogs:

- `docs/legal/AI_CONSEQUENTIAL_ACTION_CATALOG.md`
- `docs/legal/AI_GENERATED_UI_CATALOG.md`
- `docs/legal/AI_DECISION_SUPPORT_CONTROLS.md`

Pilot launch standard: every cataloged consequential action is gated when it
can affect a business decision, every generated or recommendation surface is
labeled with evidence/assumptions, and every module-specific retrofit row is
`Done` with implementation or accepted external evidence.

## Current Rollup

As of 2026-06-03, the strict backlog state for T231-T250 is:

| State | Rows | Count |
| --- | --- | ---: |
| Done | T231, T232, T235, T236, T237, T241, T246, T249 | 8 |
| In progress | T233, T234, T238, T240, T242, T243, T244, T245, T247, T248, T250 | 11 |
| Not started | T239 | 1 |

Strict completion: 8 / 20 rows = 40%.

Weighted execution signal: Done = 1, In progress = 0.5, Not started = 0.
Weighted signal: 13.5 / 20 = 67.5%.

The weighted signal is only a planning aid. It is not a launch claim.
T251 closes only when strict completion reaches 100%.

## Module Completion View

| Module / surface | Backlog rows | Strict state | Weighted signal | Pilot-complete requirement |
| --- | --- | --- | ---: | --- |
| Cross-module catalogs and backfill | T231, T232, T249 | Done | 100% | Keep catalogs current whenever a new route, export, generated UI, or agent action is added. |
| Cross-module CI enforcement | T250 | In progress | 50% | CI must prove label, citation/evidence, and human gate coverage across every audited surface, not just Source-focused controls. |
| Intelligence / Sentinel | T233, T234 | In progress | 50% | PR #2898 adds visible pattern-card AI labels/evidence refs and the from-thread promotion-gate contract; the consuming approval dialog still needs persisted rationale/evidence before Move creation. |
| Moves / Nexus | T235, T236, T237 | Done | 100% | Preserve decision evidence packet, AI Draft/edit-before-commit, and explicit human phase-advance rationale on all bypass paths. |
| Source | T238, T239, T240 | Mixed | 33% | Vendor recommendations, external actions, generated artifacts, and savings estimates need visible labels, evidence, assumptions, and human send/approval gates. |
| Tower / Atlas | T241, T242, T243 | Mixed | 67% | Executive insights, predictions, and alerts need labels, citations, confidence/assumption disclosure, and persisted human acknowledgment before action. |
| Setup / Steward | T244, T245 | In progress | 50% | AI-suggested setup changes and anomaly remediation need persisted admin approval/triage evidence before changes apply. |
| Universal agent chat | T246, T247, T248 | Mixed | 67% | Every agent response surface needs persistent decision-support disclaimer, source citations for substantive claims, and explicit human approval for agent-suggested actions. |

## Open Pilot-Blocking Gaps

This row remains the highest-risk blocker because it is still `Not started`:

| Row | Gap | Why it matters |
| --- | --- | --- |
| T239 | Source external actions need explicit human gates. | RFP sends, vendor notices, and contract-draft commits can affect external parties and must be human-owned. |

## In-Progress Rows That Need Durable Evidence

These rows have meaningful implementation but remain `In progress` until the
final evidence condition is met.

| Row | Current position | Remaining evidence |
| --- | --- | --- |
| T233 | PR #2898 opened with Sentinel active pattern card AI-assisted labels, evidence refs, confidence, and human promotion-gate warning. | Merge green CI, then keep coverage current as live Sentinel persistence replaces seed-only detections. |
| T234 | PR #2898 opened with the from-thread `promotionGate` contract requiring source thread, selected pattern, minimum rationale, and evidence keys. | Wire the consuming approval dialog and persist the rationale/evidence packet before Move creation. |
| T238 | Source vendor recommendation labels and risk caveats have landed. | Prove coverage across all vendor recommendation surfaces and keep CI regression coverage current. |
| T240 | Source estimates have some staged/scaffolded controls. | CFO-auditable savings/cost assumption disclosure needs complete coverage. |
| T242 | Tower directional value labels and assumptions have landed. | Confidence interval and assumption disclosure must be visible wherever predictions drive executive action. |
| T243 | Tower alerts show human acknowledgment boundary. | Persist acknowledgment evidence before action/dismissal. |
| T244 | Setup AI configuration approval foundation is in PR #2894. | Merge green CI, then persist approval evidence before applying live changes. |
| T245 | Setup AI anomaly triage foundation is in PR #2894. | Merge green CI, then persist triage evidence before remediation. |
| T247 | Agent action approval boundary is visible on shared chat surfaces. | Route/tool-level enforcement and evidence persistence must prove no auto-action bypass. |
| T248 | Agent citation-gap detection exists on shared surfaces. | Substantive RAG-grounded answers need deeper source-binding coverage across all fronts. |
| T250 | CI has Source-focused and governance gates. | Extend automated coverage to every audited Intelligence, Moves, Source, Tower, Setup, and chat surface. |

## Operating Rule

Every future AI-enabled feature PR must answer three questions in its release
record:

1. What consequential action or generated UI row does this touch?
2. Where are the human decision owner, rationale, evidence, assumptions, and
   missing inputs shown or stored?
3. Which test or verifier prevents regression?

If the answer is "not applicable", the PR must say why. If the answer is
"future work", the affected backlog row stays `In progress` or `Not started`.
