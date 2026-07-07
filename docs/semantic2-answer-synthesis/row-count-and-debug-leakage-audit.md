# Row-Count & Debug-Leakage Audit (Part 1)

_Every place a user-facing answer leads with counts/coverage/mechanics, or leaks raw IDs / schema / debug language. These are the concrete targets the Semantic2 quality gate (Part 6) must block and the composer (Part 3) must replace._

## A. Row-count / coverage-first LEAD (must demote to expandable proof)

| # | File:line | Offending lead | Surface |
|---|---|---|---|
| A1 | `src/lib/semantic2/build-answer-packet.ts:46` | `"I found ${rows.length} supporting rows in ${viewLabel}"` | Semantic2 Q&A — **primary target** |
| A2 | `src/lib/semantic2/build-answer-packet.ts:47` | `"I do not have enough loaded ${viewLabel}…"` (count-framed gap) | gap fallback |
| A3 | `src/lib/enterprise-context/semantic-answer-runtime.ts:226` | `"The semantic layer has ${total} records across ${dimensions} dimensions and ${sources} source tables"` | Intelligence semantic path |
| A4 | `src/lib/enterprise-context/semantic-answer-runtime.ts:232` | `"The largest supporting dimension is ${dim} from ${source} with ${count} records."` | Intelligence semantic path |
| A5 | `src/lib/tower/metric-explanation-view.ts:370` | `"${inWindow.length} vendor renewals fall within 90 days…"` | Tower |
| A6 | `src/lib/tower/pressure-cards-view.ts:352` | `"${combined.length} pressure(s) need a CFO posture…"` | Tower |
| A7 | `src/lib/atlas/llm.ts:102` | `"Tower is grounded on ${N} initiatives…"` (LLM fallback) | Tower/Atlas |

**Internal-but-adjacent (prompt grounding, not user-facing — keep, but never let surface):**
- `src/lib/atlas/tower-grounding.ts:291` — `"Substrate counts: ${initiatives} initiatives, ${vendors} vendors, ${kpiSnapshots} KPI snapshots…"`

## B. Raw-ID / schema / debug leakage into prose (must sanitize)

| # | File:line | Leak | Surface |
|---|---|---|---|
| B1 | `src/lib/source/source-answer-engine.ts:470` | `item.sourceDoc \|\| item.recordId` in evidence labels | Source |
| B2 | `src/lib/semantic2/build-answer-packet.ts:54` | `row.source_table \|\| row.source_file \|\| row.dimension_key` in citation detail | Semantic2 Q&A |
| B3 | `src/lib/atlas/composition/compose.ts:47,72,75,78,80` | `view.code` (e.g. `APX-CDP-2026`) in "your data" / gap / next-move prose | Tower/Atlas |
| B4 | `src/lib/atlas/tower-grounding.ts:315` | `initiative.displayId` / `.stage` / `.statusFlag` (e.g. `flag=cost_overrun`) into grounding | Tower (to LLM) |

## C. Debug vocabulary to ban from user-facing prose
Per spec Part 6, fail any answer whose lead contains: `found X rows`, `loaded X records`, `Current-state read`, `Evidence`, `Evidence points`, raw IDs, internal table/view names, `local env`, `read path`, `pattern family`, `$0 basis`.

Observed instances of this vocabulary in user-facing builders: A1–A7 above, plus `Evidence points` label in `lib/intelligence/ask/response-policy.ts` (`buildCurrentStateAdvisory`).

## D. Gap-language quality (must be field-specific, not total-absence)
- A2 frames gaps by missing **row volume** ("not enough loaded …"). Replace with field/mapping-specific gaps per spec Part 3, e.g. *"Data analytics records are loaded, but platform/tool fields are not mapped into the semantic answer path."*

## Priority order for the rebuild
1. **A1/A2 + B2** — `semantic2/build-answer-packet.ts` is both the row-count lead and a schema leak; it is the single highest-value replacement.
2. **A3/A4** — the volumetric `buildDirectAnswer`; demote counts to proof, lead with concept synthesis.
3. **A5/A6 + B3/B4** — Tower count-leads and `view.code`/`displayId` leakage.
4. **B1** — Source evidence-label record IDs.
