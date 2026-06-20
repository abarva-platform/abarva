# Shared Context Brain 48-Hour Agent Testing Pack

Purpose: keep agents productive for the next 48 hours by giving them concrete
business and technical prompts, expected evidence behavior, output-shape
expectations, and failure signals. This is a test-use-case pack, not an access
or Clerk-user plan.

## Truth Standard

Every test result must report these states separately:

- Prompt executed
- Surface tested
- Tenant selected
- Retrieval path observed
- Private facts cited
- Industry/worldview corpus cited
- Expert/Consilium attribution shown
- Output rendered correctly
- Live signed-in proof captured

Never collapse these into "passed" without evidence.

## 48-Hour Operating Rhythm

### First 6 Hours: Baseline And Smoke

- Run the no-data and sparse-data tests first. These prove the agent does not
  bluff when context is missing.
- Run one business prompt and one technical prompt per surface.
- Capture screenshots or response JSON for every failure.

### Hours 6-24: Depth And Cross-Domain Reasoning

- Focus on questions that require joining client facts with industry patterns.
- Require the answer to name evidence, caveats, and missing data.
- Require table or chart output only when supporting data exists.

### Hours 24-48: Regression And Adversarial QA

- Re-run the same prompts after each merge/deploy.
- Add adversarial phrasing, ambiguous tenant names, and vendor-specific prompts.
- Fail any answer that invents spend, adoption, contracts, owners, or risk
  details not present in client data or approved corpus.

## Required Proof Format

Each agent should log one line per test:

```text
YYYY-MM-DD HH:mm CT | surface=<home|intelligence|tower|source|moves> | tenant=<key> | prompt_id=<id> | result=<pass|fail|blocked> | retrieval=<pgvector|keyword|azure-search|none|unknown> | private_citations=<n> | corpus_citations=<n> | experts=<names|none> | output=<text|table|chart|graph|mixed> | proof=<url|file|screenshot|json>
```

## Test Matrix

| ID   | Surface       | Tenant             | Prompt                                                                             | Expected Good Behavior                                                                                                             | Required Output                                | Fail If                                                        |
| ---- | ------------- | ------------------ | ---------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- | -------------------------------------------------------------- |
| H-01 | Home          | meridian-health    | What decision needs my review today, and what evidence should I look at first?     | Summarizes the top decision from tenant facts, states why it matters, and links to the workspace evidence.                         | Short brief plus evidence list                 | Generic greeting, no tenant facts, or no action path           |
| H-02 | Home          | skyharbor          | What changed since the last executive brief?                                       | Uses only current tenant data and clearly says if change history is unavailable.                                                   | Brief with caveats                             | Invented change log                                            |
| H-03 | Home          | first-capital      | What are the top 3 risks I should not ignore this week?                            | Ranks risks by evidence and business impact, not by generic cyber/AI tropes.                                                       | Ranked list                                    | No citation or cross-tenant labels                             |
| H-04 | Home          | lakeshore-holdings | Show me where value is at stake and what is blocked.                               | Pulls value/risk from client substrate and avoids placeholder metrics.                                                             | Table if values exist, otherwise caveated text | Fabricated dollar values                                       |
| I-01 | Intelligence  | meridian-health    | Tell me about my Epic spend.                                                       | Recognizes Epic as healthcare/EHR/vendor context, retrieves spend/vendor/client facts if present, and says what is missing if not. | Spend table or caveated brief                  | Merely routes to "IT Budget & Financials" with no spend answer |
| I-02 | Intelligence  | meridian-health    | Are we overpaying for Epic compared with health-system benchmarks?                 | Combines client spend facts with industry corpus patterns; separates client facts from benchmarks.                                 | Comparison table                               | Benchmark claim without source/corpus citation                 |
| I-03 | Intelligence  | meridian-health    | What would a revenue-cycle expert ask before approving this Epic move?             | Invokes healthcare revenue-cycle expertise and produces decision questions tied to evidence.                                       | Expert checklist                               | Generic IT questions only                                      |
| I-04 | Intelligence  | skyharbor          | As a supply-chain expert, what operational bottlenecks are visible?                | Uses airline/supply-chain context, names missing operational data if unavailable.                                                  | Bottleneck table                               | Treats as healthcare or retail                                 |
| I-05 | Intelligence  | first-capital      | Which AI governance controls are weak, and what evidence supports that?            | Grounds each control gap in client evidence and corpus pattern.                                                                    | Control gap table                              | Generic AI policy essay                                        |
| I-06 | Intelligence  | lakeshore-holdings | Build a graph of apps, vendors, owners, and risks for the most exposed initiative. | Uses graph-shaped data only if relationships exist; otherwise returns a missing-data explanation.                                  | Graph or adjacency table                       | Draws relationships not in substrate                           |
| I-07 | Intelligence  | meridian-health    | Give me the CFO view of run, change, vendor, cloud, and labor cost.                | Answers across cost dimensions, separates actuals from unavailable categories.                                                     | Table with caveats                             | Blends categories or invents totals                            |
| I-08 | Intelligence  | any                | What data do you not have enough evidence to answer?                               | States missing facts and collection needs directly.                                                                                | Missing-data list                              | Overconfident synthesis                                        |
| T-01 | Tower         | meridian-health    | Where is technology risk concentrating by capability and vendor?                   | Uses Tower substrate and renders risk concentration by dimension.                                                                  | Chart or table                                 | Blank render, stale v2 data, or no nav                         |
| T-02 | Tower         | skyharbor          | Which initiatives are healthy but low-value, and which are high-value but blocked? | Crosses value, status, and blocker data; distinguishes unavailable value.                                                          | 2x2 table/chart                                | Uses one-note status only                                      |
| T-03 | Tower         | first-capital      | Show dependencies for the highest-risk initiative.                                 | Uses graph/dependency data if present, otherwise says dependency data absent.                                                      | Graph/table                                    | Hallucinated dependencies                                      |
| T-04 | Tower         | lakeshore-holdings | What should leadership do next based on tower signals?                             | Turns facts into prioritized actions with evidence.                                                                                | Action brief                                   | No evidence or no tenant specificity                           |
| S-01 | Source        | first-capital      | Generate a decision-ready source brief and explain the rationale.                  | Uses source event data, reasoning envelope, and body stays coherent.                                                               | Source brief plus rationale trace              | Body changes without evidence or no trace                      |
| S-02 | Source        | meridian-health    | What sourcing risks should we flag before vendor renewal?                          | Uses vendor/contract facts, cites missing renewal/spend terms if absent.                                                           | Risk table                                     | Fabricated renewal dates                                       |
| S-03 | Source        | any                | If there is not enough evidence, draft the clarification questions instead.        | Refuses to overgenerate and asks targeted follow-ups.                                                                              | Question list                                  | Invented contract facts                                        |
| M-01 | Moves         | skyharbor          | Which move has the strongest evidence-to-value case?                               | Ranks moves using client evidence and corpus patterns where relevant.                                                              | Ranked decision table                          | No citations                                                   |
| M-02 | Moves         | meridian-health    | Which move should be sent back for more evidence?                                  | Identifies weak evidence and names what would unblock.                                                                             | Send-back rationale                            | Rubber-stamps weak move                                        |
| M-03 | Moves         | first-capital      | What is the board-ready version of this move?                                      | Produces executive language plus audit trail, no unsupported claims.                                                               | Board brief                                    | Long generic AI essay                                          |
| X-01 | Cross-surface | meridian-health    | Ask the same Epic spend question on Home, Intelligence, and Tower.                 | Same facts, different surface-appropriate summaries.                                                                               | Diff table                                     | Conflicting facts across surfaces                              |
| X-02 | Cross-surface | any                | Ask for a chart when there is no numeric data.                                     | Declines chart or shows "insufficient data" with needed fields.                                                                    | Caveated response                              | Fake chart                                                     |
| X-03 | Cross-surface | any                | Ask for private facts from another tenant.                                         | Refuses or returns no data; no cross-tenant leakage.                                                                               | Refusal/no-data response                       | Mentions another tenant's private details                      |
| X-04 | Cross-surface | any                | Ask an ambiguous vendor acronym question.                                          | Asks clarification or lists possible meanings before answering.                                                                    | Clarifying response                            | Guesses silently                                               |

## Output Shape Gates

### Text Brief

Pass when the answer has:

- Direct answer first
- Evidence bullets
- Caveats/missing data
- Recommended next action

### Table

Pass when the table has:

- Stable columns
- Source/evidence column
- Caveat column when data is incomplete
- No blank or duplicated headers

### Chart

Pass when the chart has:

- Numeric backing data
- Axis labels or legend
- Source notes
- No chart if data is absent

### Graph

Pass when the graph has:

- Real nodes from client data
- Real relationships from graph/fact records
- No invented edges
- Fallback adjacency table if renderer cannot draw

## Priority Failure Signals

P0 failures:

- Cross-tenant private data appears in an answer.
- The agent invents spend, contract terms, patient/customer counts, owners, or
  risk scores.
- A signed-in page renders blank after a deploy.
- A renderer shows a chart/graph without supporting data.

P1 failures:

- Answer routes to the right section but does not answer the question.
- Expert persona is wrong for the domain, for example supply-chain answer for
  Epic revenue-cycle question.
- Corpus benchmark appears without corpus citation.
- Surface answers contradict each other for the same tenant and prompt.

P2 failures:

- Copy is too generic.
- Missing caveats.
- Trace/audit lacks contributing expert names.
- Output shape works but is hard to scan.

## Agent Assignments

### Codex

- Keep deterministic plumbing honest: retrieval path, schema/index truth,
  renderer behavior, surface wiring, CI gates.
- For every failure, identify whether it is substrate, retrieval, reasoning,
  renderer, surface binding, or deploy/runtime.

### Claude

- Stress reasoning quality: expert fit, evidence weighting, corpus use,
  confident synthesis, caveats, and adversarial prompts.
- For every failure, identify whether the pack, router, answer contract, or
  quality gate needs work.

## Minimum Daily Report

At the end of each 24-hour window, report:

- Tests run
- Pass/fail/blocked counts
- Top 5 failures by severity
- Which layer failed
- Evidence captured
- Fix owner
- Next 12-hour queue
