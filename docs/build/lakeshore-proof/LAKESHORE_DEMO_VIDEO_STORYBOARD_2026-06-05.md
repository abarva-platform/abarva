# Lakeshore Demo Video Storyboard

Created: 2026-06-05

Purpose: storyboard for a short buyer-facing walkthrough that turns the Lakeshore proof page into a narrated demo. This is designed for a 4-6 minute video, screen recording, or live demo rehearsal.

## Video Thesis

AbarVa is not a raw LLM answer box. It helps finance and treasury leaders move from an AI-assisted answer to governed execution: loaded context, evidence gaps, rollout risks, Source decisions, Move artifacts, value posture, and named human approval.

## Source Material

| Asset | Location |
|---|---|
| Proof page | `docs/build/lakeshore-proof/LAKESHORE_ABARVA_VS_RAW_LLM_PROOF_2026-06-05.html` |
| Proof source | `docs/build/lakeshore-proof/LAKESHORE_BUYER_PROOF_PAGE_SOURCE_2026-06-05.md` |
| Visual QA | `docs/build/lakeshore-proof/LAKESHORE_ABARVA_VS_RAW_LLM_VISUAL_QA_2026-06-05.md` |
| Desktop QA screenshot | `docs/build/lakeshore-proof/qa/lakeshore-proof-desktop.png` |
| Mobile QA screenshot | `docs/build/lakeshore-proof/qa/lakeshore-proof-mobile.png` |

Evidence basis:

- Live production screenshot pack: 26/26 pass, 0 watch, 0 fail.
- Final4 CXO hard-question QA: 100 questions, 88 pass, 12 watch, 0 fail.
- Known watch themes: missing evidence reference and weaker finance depth in some answers.

## Recommended Length

Target: 4-6 minutes.

If live: keep it under 8 minutes and pause after Scene 4 for buyer questions.

## Scene Plan

| Scene | Time | Visual | Narration goal | Proof point | Boundary |
|---:|---:|---|---|---|---|
| 1 | 0:00-0:35 | Proof page header / proof strip | Frame AbarVa as governed execution, not generic AI chat. | 26 screenshots, 100 hard questions, 0 fails. | Synthetic demo tenant. |
| 2 | 0:35-1:15 | `01-data-trust.png` | Show context/data trust as the first step. | Tenant context and corpus are visible before answers are trusted. | Do not claim every approval ledger item is complete. |
| 3 | 1:15-2:05 | `03-source-kyriba-executive-decision.png` | Show Kyriba decision posture before go-live. | AbarVa says what can be claimed and what cannot. | No realized Kyriba value claimed. |
| 4 | 2:05-3:00 | `04-kyriba-move-detail.png` + `05-kyriba-documents.png` | Show how rollout failure modes become gates and artifacts. | Bank connectivity, ERP feeds, entity hierarchy, historical cash, adoption, intercompany. | Some Final4 answers were thinner than desired; use page narrative to strengthen. |
| 5 | 3:00-3:50 | `02-kyriba-strategy.png` | Show sequencing logic for bank connectivity and tail-bank risk. | AbarVa turns an operational question into next actions and evidence gaps. | Integration timeline/readiness still needed. |
| 6 | 3:50-4:35 | `06-tower-value.png` | Show value posture and executive control. | Tower ties decisions to value and governance. | Planning values, not realized savings. |
| 7 | 4:35-5:20 | `07-intelligence-ask.png` or proof page close | Close with why this beats raw LLM. | Evidence refs, owner, next action, gap list, workflow. | Human approves; AI proposes. |

## Narration Script

### Scene 1 - Set The Frame

> The question is not whether an LLM can write a treasury rollout answer. It can. The question is whether the answer is grounded, evidence-aware, tied to workflow, honest about gaps, and safe for a CFO to act on. That is the difference AbarVa is designed to create.

### Scene 2 - Context Comes First

> AbarVa starts with context. The product shows what is loaded, what is trusted, and what is still missing. For a treasury program, that matters because rollout success depends on bank connectivity, ERP feeds, entity hierarchy, cash history, adoption, controls, and operational ownership.

### Scene 3 - Do Not Overclaim Before Go-Live

> Here, AbarVa answers the question a finance leader will ask: what can we safely claim before Kyriba is live? The answer is intentionally disciplined. It distinguishes planning value from realized value, names the decision owner, and points to the downstream review state.

### Scene 4 - Turn Failure Modes Into Gates

> Most rollouts fail for ordinary reasons: bank connectivity, feed quality, entity mapping, historical reconstruction, adoption, and reconciliation. AbarVa turns those into gates, artifacts, owners, and evidence requirements. That is how the product moves from advice to execution control.

### Scene 5 - Sequence Without Letting Tail Banks Stall

> The system can help sequence critical cash-visibility banks first while preventing long-tail bank work from blocking the main program. A raw model may give a reasonable recommendation; AbarVa attaches it to readiness, next action, and evidence gaps.

### Scene 6 - Keep Value Under Control

> Tower keeps the executive lens visible. It shows what value is planned, what is proven, what depends on the next decision, and where governance is required. The product should not make a savings claim until evidence supports it.

### Scene 7 - Close

> AbarVa helps the executive decide what to do next, what evidence supports it, what is missing, who owns the next move, and who must approve it. That is a safer and more valuable way to use AI than asking a raw model for a one-off answer.

## Live Demo Click Path

If running live instead of using the static proof page, use this path:

1. Open the Lakeshore proof page.
2. Start with proof metrics and the "Why not raw LLM" section.
3. Click or scroll to the Executive Decision vignette.
4. Show the Move detail and documents screenshots.
5. Show Tower value posture.
6. End with the Intelligence ask and the honesty section.

## Buyer Questions To Invite

Ask these after the walkthrough:

1. "Which rollout risk worries you most: data, bank connectivity, adoption, controls, or partner execution?"
2. "What evidence would your CFO need before accepting the value case?"
3. "Which work should stay internal, which should be agent-assisted, and which should be sourced?"
4. "Where would you want AbarVa to stop and require named human approval?"
5. "If this were your treasury program, what would you want loaded into the context layer first?"

## What Not To Say

- Do not say Kyriba is live.
- Do not say savings have been realized.
- Do not hide the 12 watch items from Final4.
- Do not imply AbarVa sends external actions without approval.
- Do not claim the full setup/admin approval ledger is populated.

## Production Notes

Use a calm, executive pace. The power of this demo is not spectacle; it is discipline:

- Evidence before confidence.
- Gaps before claims.
- Workflow before answer.
- Human approval before action.
- Value tracking before success claims.

## Next Cut

Optional next artifact:

```text
docs/build/lakeshore-proof/LAKESHORE_DEMO_VIDEO_SHOT_LIST_2026-06-05.md
```

Use the storyboard above to create a shot-by-shot recording checklist with exact file names, zoom targets, and narration snippets.
