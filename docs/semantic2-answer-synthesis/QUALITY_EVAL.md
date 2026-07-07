# Home KNOW — answer-quality evaluation

The check that decides whether main's template prose is good enough or needs the LLM-synthesis graft. Two layers: a **deterministic gate** (hard fails) and an **LLM judge** (the executive-vs-mechanical call). Run against main's live engine (`/api/home/know/ask`, SkyHarbor, DB-connected env).

## Question bank
| # | Question | Expected |
|---|---|---|
| 1 | What do we know about SkyHarbor's IT organization and ownership model? | KNOW answer + IT-org table; gap = named owners not loaded |
| 2 | Which business capabilities are most dependent on mission-critical systems? | KNOW answer; gap = capability→system edges unresolvable |
| 3 | What does the loaded data and analytics estate tell us, and what is still missing? | KNOW answer; gap = data-product owner (NOT "platform missing") |
| 4 | Which vendors create the largest operational dependency footprint? | KNOW answer + vendor table |
| 5 | Where should SkyHarbor place the next $30M in AI? | **Hand-off** to Moves/Intelligence (Home is KNOW, not DECIDE) |
| 6 | Which of our applications are unsupported or near end of life? | KNOW answer + table |
| 7 | What does it cost to run our most critical systems? | KNOW answer; may use a chart |
| 8 | Who leads cybersecurity and what is its budget? | KNOW answer, no exhibit (narrow lookup) |

## Layer 1 — deterministic gate (hard fails)
For each answer's lead prose:
- **no_rowcount_lead** — lead does NOT match `^\s*(i found|there (are|were)|we have|loaded)\b` or `^\s*\d[\d,]*\s+(rows|records|...)`
- **no_raw_ids** — no `SHA-..-\d+ | APP-\d+ | DP-\d+ | CON-\d+ | NODE-\d+ | EDGE-\d+` in prose
- **no_debug_language** — no `local env | read path | pattern family | enterprise_context_ | mv_home_ | Current-state read | Evidence points`
- **q5_is_handoff** — Q5 returns `answerStatus: "handoff"` (or a handoff block), not a strategy answer

Any hard fail = the engine has a leak to fix regardless of prose quality.

## Layer 2 — LLM judge (paste-able)
Paste per answer into Claude (or run via the runner). Returns a JSON verdict.

```
You are grading an enterprise "Home" context assistant. It answers factual questions
about a company's LOADED data ("what do we know?"). It must read like a senior advisor
stating what the evidence shows — NOT like a database report.

QUESTION:
<question>

ANSWER:
<the engine's prose for that question>

Score each 1-5 (5 best):
- executive_lead: does the FIRST sentence lead with business meaning, not a row/record
  count or coverage %?  (1 = "I found 38 IT org rows…"; 5 = "SkyHarbor's IT is portfolio-led
  under the CDTO, with budget concentrated in operations…")
- synthesis: does it interpret and connect the facts, or just list them?
- gap_specificity: when something is missing, does it name the EXACT missing field
  (e.g. "named owners are not loaded"), not a vague "no data"?

Hard checks (true/false):
- no_rowcount_lead: the lead does not start with a count or "I found/loaded N rows/records".
- no_raw_ids: no internal IDs (SHA-IT-001, APP-0001, NODE-123, etc.) in the prose.
- no_debug_language: no "local env", table/view names, "read path", "pattern family".

Verdict: one of  executive | acceptable | mechanical | blocked.

Return ONLY JSON:
{ "executive_lead": n, "synthesis": n, "gap_specificity": n,
  "no_rowcount_lead": bool, "no_raw_ids": bool, "no_debug_language": bool,
  "verdict": "...", "one_line_reason": "..." }
```

## Decision rule
- **≥6 of 8 answers verdict ∈ {executive, acceptable}** and **all hard checks pass** → main's prose is good enough. **No graft. Done.**
- **≥3 answers "mechanical"** (lists facts, flat phrasing, no interpretation) → **do the one PR**: add the optional LLM phrase-only step to main's `home-know-engine` (see [RECONCILIATION.md](RECONCILIATION.md)).
- **Any hard fail** → fix that leak in main's engine first (independent of the graft decision).

## Runner
`scripts/qa/eval-home-know-quality.mjs` POSTs all 8 questions to the engine, applies Layer 1 automatically, prints a table, and — if `ANTHROPIC_API_KEY` is set — runs the Layer-2 judge per answer and prints the verdict + the decision. See its header for env vars (`BASE_URL`, `HOME_KNOW_COOKIE` for an authenticated session).
