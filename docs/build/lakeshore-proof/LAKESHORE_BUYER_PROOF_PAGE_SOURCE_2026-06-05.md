# Lakeshore Buyer Proof Page Source

Created: 2026-06-05

Purpose: durable source brief for a buyer-facing Lakeshore proof page showing why AbarVa is more than a raw LLM chat. This file points to the actual screenshot and hard-question QA evidence captured from production and Final4.

## Current Proof Inputs

| Proof layer | Status | Location |
|---|---:|---|
| Live production screenshot pack | 26/26 pass, 0 watch, 0 fail | `/private/tmp/nexus-lakeshore-atlas-boundary/reports/2026-06-05-final-lakeshore-app-demo-readiness-screens-post3128/lakeshore-app-demo-readiness-2026-06-05T19-32-58-793Z-277cb8eb3/` |
| Screenshot manifest | Available | `screenshots.json` |
| Screenshot report | Available | `report.html` |
| Final4 CXO hard-question QA | 100 questions, 88 pass, 12 watch, 0 fail | `/private/tmp/nexus-lakeshore-cxo-qa-hardening/reports/2026-06-05-lakeshore-cxo-hard-question-qa-final4/lakeshore-cxo-hard-question-qa-2026-06-05T20-16-23-176Z-d0215cec/` |
| Final4 report | Available | `report.html` |
| Final4 answers | Available | `answers.jsonl` |
| Final4 scores | Available | `scores.jsonl` |

## Screenshot Coverage

| Area | Count | Proof role |
|---|---:|---|
| Admin | 2 | Data trust and setup posture |
| Setup | 3 | CXO intel setup path |
| Source | 14 | Kyriba treasury event through 11-stage lifecycle, plus AMS evaluation-only story |
| Moves | 4 | Kyriba Move, documents tab, and Data Spine Move |
| Tower | 1 | Source portfolio value / value tracking |
| Intelligence | 2 | Intelligence landing and Ask surface |

Key screenshots for first proof page:

1. `01-admin-admin-data-trust.png` — context/data trust posture.
2. `03-setup-cxo-intel-index.png` — setup/admin context intake.
3. `08-source-source-kyriba-strategy.png` — Source strategy stage.
4. `12-source-source-kyriba-evaluation.png` — vendor/evaluation reasoning.
5. `15-source-source-kyriba-executive-decision.png` — executive decision moment.
6. `21-moves-moves-kyriba-detail.png` — Move view for rollout success.
7. `22-moves-moves-kyriba-documents.png` — persisted documents/evidence.
8. `24-tower-tower-source-value.png` — value/control tower view.
9. `26-intelligence-intelligence-ask.png` — final ask/answer experience.

## Final4 QA Summary

| Metric | Value |
|---|---:|
| Questions | 100 |
| Pass | 88 |
| Watch | 12 |
| Fail | 0 |
| Average overall score | 4.08 / 5 |
| Known issue: missing evidence reference | 8 |
| Known issue: weak finance depth | 4 |

The proof page should not hide the 12 watch items. Use them to show AbarVa is honest about evidence gaps and refinement areas.

## Buyer-Facing Thesis

AbarVa is not "a chat interface on top of a model." The proof page should show:

1. Context first
   - Lakeshore answers are grounded in loaded tenant context, corpus coverage, Source/Moves artifacts, and Data Trust posture.

2. Evidence visible
   - Answers carry evidence references and identify what is not yet proven.

3. Workflow attached
   - AbarVa does not stop at an answer; it links to Source stages, Move artifacts, approval state, value ledger, and Tower.

4. Human command and control
   - The system proposes; executives approve, hold, refine, or ask for missing evidence.

5. Safer than raw LLM
   - A raw LLM can produce a plausible Kyriba rollout answer. AbarVa shows the decision owner, evidence refs, artifact state, value caveats, and what not to claim.

## Three Proof Vignettes

### Vignette 1 — "What can we safely claim before Kyriba is live?"

Use Final4 question: `LSH-CXO-001`.

Buyer point: AbarVa does not overstate value. It says Kyriba is not live, value is not realized, and the Source event is still at Executive Decision with downstream stages in review.

Suggested visual pair:

- `15-source-source-kyriba-executive-decision.png`
- `22-moves-moves-kyriba-documents.png`

Key answer elements to highlight:

- Decision owner: CFO.
- Evidence references include `LAKESHORE_LIVE_DATA_AUDIT_2026-06-05.md`.
- Evidence gap: full setup/admin approval ledger is not yet populated.

### Vignette 2 — "What stalls Kyriba rollouts, and how does Move 0 de-risk them?"

Use Final4 question: `LSH-CXO-002`.

Buyer point: AbarVa turns implementation failure modes into gates, artifacts, and owner actions.

Suggested visual pair:

- `21-moves-moves-kyriba-detail.png`
- `22-moves-moves-kyriba-documents.png`

Key answer elements to highlight:

- Bank connectivity.
- ERP feed quality.
- Entity hierarchy.
- Historical cash reconstruction.
- Adoption.
- Intercompany reconciliation.

Watch note: Final4 marked this as pass but thinner than ideal. The proof page should improve the narrative by explicitly listing all six gates from the evidence pack.

### Vignette 3 — "How do we sequence bank connectivity without letting tail banks stall?"

Use Final4 question: `LSH-CXO-003`.

Buyer point: AbarVa converts a treasury rollout question into sequencing logic, readiness gaps, and next actions.

Suggested visual pair:

- `08-source-source-kyriba-strategy.png`
- `13-source-source-kyriba-pricing.png`

Key answer elements to highlight:

- Prioritize critical cash-visibility banks first.
- Keep tail banks from blocking the main program.
- Requires integration timeline and readiness assessment as evidence gap.

## Draft Page Structure

1. Header
   - Title: "AbarVa Proof: From AI Answer to Governed Execution"
   - Subtitle: "Lakeshore finance and treasury example using live production screenshots and Final4 hard-question QA."

2. Proof strip
   - 26/26 live screenshots passed.
   - 100 hard questions captured.
   - 88 pass / 12 watch / 0 fail.
   - 1,329 context records and 9 complete inventory segments if citing the live-data audit.

3. Why not raw LLM
   - Raw LLM: plausible answer.
   - AbarVa: tenant context, corpus, evidence refs, owner, next action, evidence gap, Source/Move/Tower workflow.

4. Three vignettes
   - Each vignette should include screenshot, question, AbarVa answer excerpt, evidence refs, next action, and why this prevents AI failure.

5. Honesty section
   - Synthetic demo tenant.
   - Loader-backed context records.
   - Value ranges are planning values, not realized savings.
   - Full setup/admin approval ledger is not yet populated.

6. Close
   - "AbarVa helps the executive decide what to do next, what evidence supports it, what is still missing, and who must approve it."

## Next Build Step

Create:

```text
docs/build/lakeshore-proof/LAKESHORE_ABARVA_VS_RAW_LLM_PROOF_2026-06-05.html
```

Use the screenshots listed above and selected Final4 answers. Keep the page concise, visual, and buyer-facing. Do not make it a generic architecture page.
