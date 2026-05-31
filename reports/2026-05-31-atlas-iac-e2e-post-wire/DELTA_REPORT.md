# Atlas IAC E2E — Delta vs Verbal Baseline

Ran at `2026-05-31T00:34:19.863Z` on branch `unknown`.

## Headline delta

| Metric | Verbal baseline (pre-fix audit) | Post-fix (this run) | Delta |
|---|---|---|---|
| Total turns | 90 | 90 | 0 |
| True HI-1 LLM-fallback rate | 0/90 | 0/90 | 0 |
| IAC composition answered | (not measured) | 72/90 | n/a |
| IAC declined as intent=none (correct hand-off) | (not measured) | 12/90 | n/a |
| Pass rate (A+B) | 64/90 = 71% | 90/90 = 100.0% | 26 |
| **Hybrid four-section composition** | **0/18** | **21/21** | **21** |
| Shaper-damage patterns | 14+ turns | 0 turns | -14 |
| Banned-phrase emissions | (uncounted, present) | 0 | n/a |
| Cross-tenant leaks (per-turn content) | 0 | 0 | 0 |
| Cross-tenant API probes blocked | 2/2 | 6/6 | 4 |

## Note on "fallback rate" semantics

The verbal baseline's "0/90 fallback" was a count of true HI-1 LLM-failure
fallbacks (the regression check after PR #2611 dropped the deprecated
`temperature` param on `claude-opus-4-7`). This in-process harness never
invokes the LLM, so true LLM-fallback is structurally 0. The 18 turns where
`composeAtlasIacAnswer` returned null (Q02, Q04, Q22, Q25, Q27, Q29 across
3 tenants = 18) represent CORRECT intent=none declines — those are
non-IAC questions (portfolio diagnostics, archetype-bootstrap-mismatch,
nonexistent archetype, stretch questions) that the orchestrator routes to
scripted or LLM turns. The HI-1 regression check should be wired through
the full orchestrator in a follow-up; see the issues report.

## Targets vs actuals

| Target | Actual | Verdict |
|---|---|---|
| True HI-1 fallback = 0 | 0/90 (LLM not exercised here) | PASS (structural) |
| Pass rate >=85% | 100.0% | PASS |
| **Hybrid composition >=15/18** | 21/21 | PASS |
| **Shaper damage = 0** | 0 | PASS |
| **Banned phrases = 0** | 0 | PASS |
| Cross-tenant leaks = 0 | 0 (per-turn) + 0 (probes) | PASS |

## Spot-check: "Compare AR-02 to industry benchmarks" (Apex hybrid Q15)

This is the canonical HI-2 test case — before the fix, this returned "No such initiative" because the
intent classifier extracted "AR-02" but the loader didn't accept display_ids.

**Baseline behavior (verbal audit, pre HI-2):**
> "No such initiative in your scope: AR-02. Atlas did not retrieve cross-tenant content."

**Post-fix behavior (this run):**

- Composition returned null: `false`
- Intent: `hybrid` (initiative=AR-02, archetype=null)
- Four-section fired: `true`
- Grade: `A` (all scorecard dims green)

```
Your data
From your Tower / Source ledger as of Q4-2025: AR-02 (GitHub Copilot for Engineering) is scaled, owned by R. Chen · CTO. Baseline: Value realization $M: 0.9 $M (target 1.8 $M, as of Q4-2025); Adoption penetration %: 61 % (target 77 %, as of Q4-2025); Automated test pass rate after AI edits: 81 % (target 82 %, as of Q4-2025). Value: value attainment is 155.56%; no upcoming gate is recorded. Signals: critical Shadow AI detected across Jasper, Abridge, and Grammarly Business; high Demand Forecasting attestation is 31 days overdue.

Industry context
GitHub Copilot trend: mainstream-scaling; driver: GitHub Universe 2024 announcements — multi-model Copilot, Copilot code review, Copilot Workspace, and Copilot Extensions. (GitHub Universe 2024 — Thomas Dohmke keynote, 2024-10). Metrics: developer_use_in_year: 76% (Stack Overflow Developer Survey 2024, 2024-07); github_copilot_paid_users: 1800000 paid users (Microsoft Q2 FY24 earnings call (Satya Nadella prepared remarks), 2024-01). Patterns: ide-inline-completion: Developers accept tab-completions inline as they type in VS Code, JetBrains, Visual Studio, or Neovim. This is the default deployment surface and the one most use disclosures refer to. (Stack Overflow Developer Survey 2024, 2024-07) copilot-chat-in-ide: Developers use Copilot Chat panels inside the IDE for explanations, refactors, test scaffolding, and error debugging. GitHub repositions Chat as the gateway to agentic Copilot features such as code review and workspace tasks. (GitHub Research — "Quantifying GitHub Copilot’s impact on developer productivity and happiness", 2022-09) Industry context refreshed 2026-05-30.

The gap
AR-02 is in line with the tenant middle on value attainment (57th percentile). The gap is measurement depth: Atlas needs KPI trend and gate evidence before claiming the initiative is ahead of named peers.

Next move
Use the next governance gate to require owner sign-off on KPI movement and seat/tool telemetry for AR-02; expand only if the next ledger refresh improves measured attainment.
```
