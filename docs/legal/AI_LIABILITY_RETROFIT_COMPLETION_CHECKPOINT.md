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
| Done | T231, T232, T233, T234, T235, T236, T237, T239, T241, T246, T249 | 11 |
| In progress | T238, T240, T242, T243, T244, T245, T247, T248, T250 | 9 |
| Not started | None | 0 |

Strict completion: 11 / 20 rows = 55%.

Weighted execution signal: Done = 1, In progress = 0.5, Not started = 0.
Weighted signal: 15.5 / 20 = 77.5%.

The weighted signal is only a planning aid. It is not a launch claim.
T251 closes only when strict completion reaches 100%.

## Module Completion View

| Module / surface | Backlog rows | Strict state | Weighted signal | Pilot-complete requirement |
| --- | --- | --- | ---: | --- |
| Cross-module catalogs and backfill | T231, T232, T249 | Done | 100% | Keep catalogs current whenever a new route, export, generated UI, or agent action is added. |
| Cross-module CI enforcement | T250 | In progress | 50% | CI must prove label, citation/evidence, and human gate coverage across every audited surface, not just Source-focused controls. |
| Intelligence / Sentinel | T233, T234 | Done | 100% | T233 is Done after visible pattern-card AI labels, evidence refs, confidence, and human-promotion warnings landed. T234 is Done after PR #2902 merged the consuming pattern-to-Move approval gate and PR #2909 enforced catalog coverage for the new covered claim. |
| Moves / Nexus | T235, T236, T237 | Done | 100% | Preserve decision evidence packet, AI Draft/edit-before-commit, and explicit human phase-advance rationale on all bypass paths. |
| Source | T238, T239, T240 | Mixed | 50% | T239 is Done for the audited serve-notice external-action path. Vendor recommendations, generated artifacts, and savings/cost estimates still need complete evidence, assumptions, and CI coverage before Source is pilot-complete. |
| Tower / Atlas | T241, T242, T243 | Mixed | 67% | Executive insights, predictions, and alerts need labels, citations, confidence/assumption disclosure, and persisted human acknowledgment before action. |
| Setup / Steward | T244, T245 | In progress | 50% | AI-suggested setup changes and anomaly remediation need persisted admin approval/triage evidence before changes apply. |
| Universal agent chat | T246, T247, T248 | Mixed | 67% | Every agent response surface needs persistent decision-support disclaimer, source citations for substantive claims, and explicit human approval for agent-suggested actions. |

## Open Pilot-Blocking Gaps

There are no remaining `Not started` rows in T231-T250. The wave is still not
pilot-complete because 9 rows remain `In progress`, and those rows require
durable evidence, broader surface coverage, or live persistence before T251 can
close.

## In-Progress Rows That Need Durable Evidence

These rows have meaningful implementation but remain `In progress` until the
final evidence condition is met.

| Row | Current position | Remaining evidence |
| --- | --- | --- |
| T238 | Source vendor recommendation labels and risk caveats have landed. | Prove coverage across all vendor recommendation surfaces and keep CI regression coverage current. |
| T240 | Source estimates have some staged/scaffolded controls. | CFO-auditable savings/cost assumption disclosure needs complete coverage. |
| T242 | Tower directional value labels and assumptions have landed. | Confidence interval and assumption disclosure must be visible wherever predictions drive executive action. |
| T243 | Tower alerts show human acknowledgment boundary. | Persist acknowledgment evidence before action/dismissal. |
| T244 | PR #2894 merged the setup AI configuration approval foundation and Data Loads guardrail. | Persist approval evidence before applying live setup/admin changes. |
| T245 | PR #2894 merged the setup AI anomaly triage foundation and Data Loads guardrail. | Persist triage evidence before live anomaly remediation. |
| T247 | Agent action approval boundary is visible on shared chat surfaces. | Route/tool-level enforcement and evidence persistence must prove no auto-action bypass. |
| T248 | Agent citation-gap detection exists on shared surfaces. | Substantive RAG-grounded answers need deeper source-binding coverage across all fronts. |
| T250 | PR #2909 merged the catalog claim coverage gate, including coverage enforcement for the new Intelligence pattern-to-Move promotion claim. | Close deferred catalog claims and extend automated coverage to every audited Intelligence, Moves, Source, Tower, Setup, and chat surface. |

## Operating Rule

Every future AI-enabled feature PR must answer three questions in its release
record:

1. What consequential action or generated UI row does this touch?
2. Where are the human decision owner, rationale, evidence, assumptions, and
   missing inputs shown or stored?
3. Which test or verifier prevents regression?

If the answer is "not applicable", the PR must say why. If the answer is
"future work", the affected backlog row stays `In progress` or `Not started`.
