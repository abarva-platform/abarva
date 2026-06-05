# Demo Proof Artifact Index

Created: 2026-06-05

Purpose: single navigation point for current AbarVa buyer-proof artifacts, QA evidence, and remaining proof gaps across Lakeshore, Meridian / PHS, and SkyHarbor.

## Current Status

| Client / lane | Status | Percent | Buyer-ready artifact | QA evidence | Blocker / next action |
|---|---:|---:|---|---|---|
| Lakeshore | Proof-page ready | 95% | `docs/build/lakeshore-proof/LAKESHORE_ABARVA_VS_RAW_LLM_PROOF_2026-06-05.html` | `docs/build/lakeshore-proof/LAKESHORE_ABARVA_VS_RAW_LLM_VISUAL_QA_2026-06-05.md` | Optional buyer polish and video/storyboard cuts. |
| Meridian / PHS | Proof-page ready for review | 88% | `docs/build/meridian-phs-proof/MERIDIAN_PHS_CDAO_PROOF_2026-06-05.html` | `docs/build/meridian-phs-proof/MERIDIAN_PHS_CDAO_PROOF_VISUAL_QA_2026-06-05.md` | Package into deeper CDAO/admin training and resolve citation/context gaps before final buyer reliance. |
| SkyHarbor | Dataset-ready, not live-proofed | 25% | None yet | `reports/2026-06-05-skyharbor-reality/00-before-state.md` | Azure/Postgres host did not resolve; run read-only counts, loader, screenshots, persisted Moves/Source proof after access is restored. |

## Lakeshore Proof Packet

| Artifact | Path | Notes |
|---|---|---|
| Source brief | `docs/build/lakeshore-proof/LAKESHORE_BUYER_PROOF_PAGE_SOURCE_2026-06-05.md` | Maps screenshots and Final4 hard-question QA into buyer-proof vignettes. |
| HTML proof page | `docs/build/lakeshore-proof/LAKESHORE_ABARVA_VS_RAW_LLM_PROOF_2026-06-05.html` | Shows why AbarVa is more than a raw LLM for finance/treasury rollout decisions. |
| Visual QA note | `docs/build/lakeshore-proof/LAKESHORE_ABARVA_VS_RAW_LLM_VISUAL_QA_2026-06-05.md` | Records desktop/mobile QA, image load, console, and overflow checks. |
| Video storyboard | `docs/build/lakeshore-proof/LAKESHORE_DEMO_VIDEO_STORYBOARD_2026-06-05.md` | 4-6 minute narration plan, scene list, buyer questions, and what-not-to-say guardrails. |
| Video shot list | `docs/build/lakeshore-proof/LAKESHORE_DEMO_VIDEO_SHOT_LIST_2026-06-05.md` | Recording checklist with exact visuals, framing, narration cues, guardrails, and post-recording QA. |
| Desktop screenshot | `docs/build/lakeshore-proof/qa/lakeshore-proof-desktop.png` | Rendered proof page. |
| Mobile screenshot | `docs/build/lakeshore-proof/qa/lakeshore-proof-mobile.png` | Rendered proof page. |

Evidence basis:

- Live production screenshot pack: 26/26 pass, 0 watch, 0 fail.
- Final4 CXO hard-question QA: 100 questions, 88 pass, 12 watch, 0 fail.
- Known watch themes are intentionally preserved: missing evidence reference and weaker finance depth in some answers.

## Meridian / PHS Proof Packet

| Artifact | Path | Notes |
|---|---|---|
| Demo plan | `docs/build/meridian-phs-demo/PHS_AI_STRATEGY_DEMO_PLAN_2026-06-05.md` | Review/approval source for PHS-inspired CDAO strategy demo. |
| Prompt source | `docs/build/meridian-phs-demo/PHS_AI_STRATEGY_PROMPT_SOURCE_2026-06-05.md` | Prompt contract after human approval. |
| Walkthrough HTML | `docs/build/meridian-demo-walkthrough/meridian-demo-crawl-2026-06-05T19-21-realapp/MERIDIAN_DEMO_WALKTHROUGH.html` | Live production walkthrough capture. |
| Proof source brief | `docs/build/meridian-phs-proof/MERIDIAN_PHS_CDAO_PROOF_PAGE_SOURCE_2026-06-05.md` | Buyer-proof source: CDAO, context layer, AI failure avoidance, Azure / Databricks modernization. |
| HTML proof page | `docs/build/meridian-phs-proof/MERIDIAN_PHS_CDAO_PROOF_2026-06-05.html` | Buyer proof page using real product screenshots and the current logo asset. |
| Visual QA note | `docs/build/meridian-phs-proof/MERIDIAN_PHS_CDAO_PROOF_VISUAL_QA_2026-06-05.md` | Records desktop/mobile QA, image load, console, and overflow checks. |
| Training manual source | `docs/build/meridian-phs-proof/MERIDIAN_PHS_CDAO_DEMO_TRAINING_MANUAL_SOURCE_2026-06-05.md` | Route-by-route talk track, prompts, expected answer shapes, context-layer explanation, human controls, and services attach framing. |
| HTML training manual | `docs/build/meridian-phs-proof/MERIDIAN_PHS_CDAO_DEMO_TRAINING_MANUAL_2026-06-05.html` | Visual manual with left-side navigation, route-by-route screenshots, prompt blocks, evidence boundaries, and services attach framing. |
| Training manual QA note | `docs/build/meridian-phs-proof/MERIDIAN_PHS_CDAO_DEMO_TRAINING_MANUAL_VISUAL_QA_2026-06-05.md` | Records desktop/mobile QA, image load, console, and overflow checks for the training manual. |
| Desktop screenshot | `docs/build/meridian-phs-proof/qa/meridian-phs-proof-desktop.png` | Rendered proof page. |
| Mobile screenshot | `docs/build/meridian-phs-proof/qa/meridian-phs-proof-mobile.png` | Rendered proof page. |

Evidence basis:

- Live production walkthrough: 12 route screenshots.
- Screenshots cover Home, Admin/Setup, Intelligence, Moves, Source, and Tower.
- Important readiness truth: the walkthrough shows citation-gap warnings and an internal-context-not-loaded message. These are not hidden; they are framed as proof that AbarVa does not pretend private context exists before it is loaded.

## SkyHarbor Reality Packet

| Artifact | Path | Notes |
|---|---|---|
| Before-state report | `reports/2026-06-05-skyharbor-reality/00-before-state.md` | Truthful baseline: dry-run ready, not live Azure/Postgres proven. |

Verified locally:

- Dataset root exists: `datasets/skyharbor-air-synthetic-v1`.
- Loader dry-run identifies 3,240 chunks, 92 apps, 38 initiatives, and 52 vendor contracts.
- Tenant key used by loader: `skyharbor-air`.
- Client id used by loader: `6f3c8d21-9b45-4f12-8d61-4b8f7c2a9301`.

Not yet proven:

- Setup/Admin loader completed.
- Azure/Postgres chunks exist.
- Embeddings completed.
- Admin UI shows SkyHarbor source files.
- Saved Moves exist.
- Saved Source events exist.
- Persisted generated artifacts exist and open.
- KK/CTO login is tenant-isolated to SkyHarbor.

Current blocker:

```text
Postgres connection failed: getaddrinfo ENOTFOUND pg-abarva-context-lab-001.postgres.database.azure.com
```

## PR / CI State

| PR | State | Checks | Notes |
|---|---:|---:|---|
| #3099 `docs(readiness): add shared tenant evidence checklist` | Merged 2026-06-05T17:52:41Z | Green | Shared tenant readiness record is merged. |
| #3130 `fix(auth): gate detail pages behind sign-in` | Merged 2026-06-05T20:25:09Z | Green | Signed-out page gating is merged. |

## Next Recommended Work

1. Meridian / PHS: review the new HTML training manual, then optionally convert it into Word/deck/video script form.
2. Lakeshore: record or rehearse the walkthrough using the storyboard and shot list.
3. SkyHarbor: wait for Azure/Postgres reachability, run read-only counts, then load via admin/setup path, create saved Moves/Source artifacts, and capture screenshots before making the KK primer.
4. Auth/setup: refresh signed-in storage state for each real user/profile once Clerk user mapping is finalized; never grant multi-account access unless explicitly approved.
