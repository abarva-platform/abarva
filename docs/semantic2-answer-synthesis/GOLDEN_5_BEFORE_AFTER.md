# Golden-5 Before / After + Implementation Notes

_"Before" = the row-count / template behaviour the [composition audit](current-answer-composition-audit.md) found in the existing answer path (`semantic2/build-answer-packet.ts` "I found N rows…", the volumetric `buildDirectAnswer` "N records across M dimensions", and the original IT-org-as-strategy-memo failure). "After" = verbatim live `claude-opus-4-8` output via the Semantic2 composer ([GOLDEN_5_RESULTS.md](GOLDEN_5_RESULTS.md))._

| # | Before (row-count / template) | After (semantic synthesis) |
|---|---|---|
| Q1 IT org | "I found 38 IT org rows and 500 application rows." / a 90-day IT-productivity pilot with DORA metrics & retail experts | "SkyHarbor runs a portfolio-based technology organization under the Office of the CDTO… $4.87B total spend… Accountability is structured around executive owner roles rather than named individuals." |
| Q2 capability dependency | "I found N relationship rows." | "Eight capabilities carry critical status, clustering in airline-operations value streams… dependency is read at the domain/criticality level rather than from explicit system links" (+ names the 5,200-edge node-ID gap) |
| Q3 data estate | "No data found for analytics." / "I found 420 data product rows." | "Every product carries a platform, status, and trust score. Databricks leads… 78.5. The one thing the estate cannot tell us is who is accountable — there is no owner." |
| Q4 vendor footprint | "I found 320 vendor rows in vendor landscape." | "Teradata carries the heaviest footprint — 29 critical apps… Dependency and cost do not track together" |
| Q5 AI $30M | "Based on several patterns, invest in AI." | "Anchor the next $30M on the IROPS / disruption-recovery estate…" — tenant fact vs. labeled corpus; gaps gate the scale-up; phased plan |

## Generality (not 5 hard-coded questions)
The synthesis composer phrases any bound packet; only retrieval was question-specific. A **general retriever** (`semantic-query.ts`) indexes every entity across all five dimensions and selects for an arbitrary question. Five **off-script** questions (not the golden 5) were answered live, all `noRowCountLead`/`rawIdClean`:
- "Which applications are unsupported or near end of life?" → all 10 unsupported apps, criticality-led; gap: no EOL dates.
- "What does it cost to run our most critical systems?" → critical apps ranked by run cost, ~$108.6M total.
- "Which platforms hold our highest-trust data products?" → Databricks/Fabric, Cargo Revenue 99 trust; gap: no owner.
- "Who leads cybersecurity and what's its budget?" → CISO, $196M, 780 FTE; gap: role not named person.
- "Biggest cost exposure — teams, applications, or vendors?" (cross-dimension) → *"team budgets are the only cost dimension visible… application- and vendor-level cost is not present in what's loaded, so the answer can only be given for teams."* — spans dimensions and states what it cannot answer.

**Depth vs breadth:** curated golden slices give richer metrics on known families; the general retriever is the breadth floor for everything else. The real architecture = general retriever + a route catalog (Part 4) for depth — both feed the one composer.

## Files changed (spike)
- `src/lib/semantic2/contract.ts` — canonical `Semantic2AnswerPacket` + `HomeKnowResponse` view (Part 2).
- `src/lib/semantic2/golden/types.ts` — `GoldenAnswer` = view of the contract; the 5-question catalog.
- `src/lib/semantic2/golden/skyharbor-retrieval.ts` — deterministic local-dataset adapter (entities/metrics/4 computed gaps).
- `src/lib/semantic2/golden/compose-golden.ts` — prompt builders (librarian/advisor) + `composeFromSlice` (shared merge) + safety assessment.
- `src/lib/semantic2/golden/generate.ts` — injectable generators (direct Claude / stub).
- `src/lib/semantic2/golden/semantic-query.ts` — general "ask anything" retriever across all dimensions.
- `tests/semantic2-answer/golden-five.test.ts` — hermetic gate test (incl. row-count-lead FAILS, acceptance #10).
- `docs/semantic2-answer-synthesis/` — audit (Part 1), packet contract (Part 2), GOLDEN_5_RESULTS, this file.

## Boundaries (honest)
- Retrieval is **local v4 dataset**, not live Azure. The same composer wired to live Azure via the audited client is the follow-on **and** the substrate-proof.
- The general retriever is keyword/overlap-based — a real floor, not the final router (Part 4 route catalog adds depth + intent precision).
- **No deployment, nothing merged.** Production wiring (`/api/home/know/ask` + the audited generator) is the next gate after a green substrate-proof.
