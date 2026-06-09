# Agent Response Wisdom Evaluation Rubric — 2026-06-09

Automated + human-readable scoring for governed **Nexus (Moves)** and
**Sentinel (Intelligence)** answers. The rubric consumes the PR-1
`AgentContextTrace` plus the answer text and returns a production-readiness
verdict. It is implemented as code (`src/lib/agent-eval/`) and exercised by
`src/__tests__/behaviors/agent-eval-rubric.test.ts`.

## Why split deterministic vs injected

Five dimensions are **deterministic** — computed from the trace + answer text
with no model, so they run in CI/lab mode and cannot drift. Five dimensions are
**subjective** and accept an **injected judgment** from an Anthropic judge or a
human reviewer; the library never calls a model itself (keeps it pure, testable,
and provider-agnostic). Unassessed subjective dimensions are reported as
`not_assessed` and excluded from the average — they are never silently scored.

| Dimension | Basis | How it is scored |
|-----------|-------|------------------|
| `tenant_grounding` | deterministic | count of tenant context objects in the bundle |
| `pattern_grounding` | deterministic | approved patterns present **and** namespace-clean |
| `source_discipline` | deterministic | citations emitted vs available source basis |
| `risk_failure_mode_awareness` | deterministic | risk / failure-mode / trade-off language present |
| `missing_context_honesty` | deterministic | does the answer flag thin evidence honestly |
| `business_judgment` | injected | judge: soundness of the strategic call |
| `specificity` | injected | judge: tenant-specific vs generic filler |
| `actionability` | injected | judge: concrete next action |
| `no_hallucination` | injected | judge: no invented facts/numbers |
| `executive_usefulness` | injected | judge: board/CXO usefulness |

Each dimension scores **1–5**. `overallScore` is the mean of assessed
dimensions.

## Production-readiness gate

An answer is **production-ready** only when **all** hold:

1. `overallScore >= threshold` (default **3**), and
2. no assessed dimension scored below threshold, and
3. no automatic-fail condition fired.

### Automatic-fail conditions (any one → not production-ready)

- **Any tenant leakage** — the answer referenced another tenant's context.
- **Any unsupported _critical_ claim** — value / KPI / vendor / architecture /
  outcome claim with no backing evidence (from PR-4).
- **Any phantom or cross-namespace pattern citation** — a cited pattern id that
  does not exist, or that belongs to a different grounding namespace than the
  tenant's industry scope (from PR-4).

## Evaluator output

`evaluateAgentResponse(input)` returns:

- `overallScore`, `dimensionScores[]` (with per-dimension `basis` + `rationale`)
- `failedDimensions[]`
- `supportingTraceIds[]` (question_id + response_id)
- `unsupportedClaims[]`, `missingCitations[]`
- `tenantLeakageFindings[]`, `patternNamespaceFindings[]`
- `autoFailReasons[]`
- `recommendedFix` (names the remediation lane(s))
- `productionReady` (boolean)

Any below-threshold answer is marked not production-ready and yields a
`recommendedFix` that maps to a remediation lane, which the verification report
(PR-5) rolls up into the backlog.

## Sample evaluations

Real rubric output over **synthetic but realistic** traces (deterministic
dimensions are genuine; subjective dimensions are illustrative judge inputs) is
committed at:

- `docs/build/agent-context-bundle-verification-2026-06-09/sample-evaluations.json`

These cover **Apex (retail)**, **Meridian/PHS (healthcare)**, and **SkyHarbor
(airline)** for both a strong grounded answer and a thin over-claiming answer,
plus a leakage auto-fail case. **Lakeshore** is shown as `NOT_LOADED` (not a
canonical tenant with Azure data), not fabricated. These are illustrative of the
rubric mechanics; **live scores must be produced by running the verification
harness against Azure data on Azure Container Apps** (the private DB is
unreachable from localhost). See PR-5.

## Tuning notes

- The default threshold (3) is intentionally a floor; raise to 4 for
  board-grade surfaces once the corpus depth supports it.
- Deterministic heuristics are intentionally conservative (e.g. thin evidence +
  no caveat scores 1 on honesty) — they err toward flagging, not passing.
