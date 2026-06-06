# Lakeshore MP4 Executive Plates - Visual QA

Created: 2026-06-05

Scope: QA note for the Lakeshore MP4 executive frame library V2, regenerated 16:9 scene plates, side-by-side screen/narration storyboard, and OpenAI TTS scene text.

Contact sheet: `docs/build/lakeshore-success-brief/video-storyboard/qa/v2-contact-sheet.png`
Preview MP4: `docs/build/lakeshore-success-brief/video-storyboard/render/LAKESHORE_AI_SUCCESS_PLATFORM_PREVIEW_V1.mp4`
Actual-video sample sheet: `docs/build/lakeshore-success-brief/video-storyboard/render/qa/video-samples.png`

## Files Reviewed

| Artifact | Path | Status |
|---|---|---:|
| Executive plate library | `docs/build/lakeshore-success-brief/video-storyboard/LAKESHORE_MP4_EXECUTIVE_PLATES_2026-06-05.html` | Pass |
| Screen + narration storyboard | `docs/build/lakeshore-success-brief/video-storyboard/LAKESHORE_MP4_SCREEN_NARRATION_STORYBOARD_2026-06-05.html` | Pass |
| OpenAI TTS scene text | `docs/build/lakeshore-success-brief/video-storyboard/OPENAI_TTS_SCENE_TEXT_2026-06-05.md` | Pass |
| Scene images | `docs/build/lakeshore-success-brief/video-storyboard/assets/01-opening.png` through `14-success-standard.png` | Pass |

## Visual Standard Applied

- 16:9 frame discipline: one idea per frame, no scrolling.
- Executive readability: large headline, short proof cards, limited paragraph text.
- Product proof: screenshots appear only where they clarify the process flow.
- Brand: uses the 28px compact dark-nav toolbar logo asset at `124x28` display size.
- MP4 readiness: each frame can support zoom/pan treatment without requiring the viewer to read a full document page.

## Spot Checks

| Scene | Check | Result |
|---|---|---:|
| 01 Opening | Headline, sourced proof metrics, and equal product pillars are readable without implying fake quantitative architecture. | Pass |
| 02 Profile | Lakeshore planning profile is labeled as a profile to confirm, with concise company cards. | Pass |
| 06 Kyriba | Screenshot no longer collides with headline; six gates are readable. | Pass |
| 08 Value case | $500K, $60M, 3-5 decisions, and one-win logic are visible as value potential, not realized savings. | Pass |
| 12 Trust layer | Model boundary graphic shows Claude inside AbarVa governance: tenant, role, corpus, evidence, artifacts, and audit. | Pass |
| MP4 preview | OpenAI voiceover render uses 14 scenes, 1600x900 H.264 video, AAC audio, and post-voice gaps capped at 1.15 seconds. | Pass |
| 13 Roadmap | Six-month plan appears as six clean cards, not a paragraph roadmap. | Pass |

## Known Editorial Notes

- These are executive video plates, not a replacement for the buyer reading brief.
- The reading brief keeps deeper context, treasury doctrine, value detail, and claim-discipline language.
- The V2 contact sheet should be reviewed before MP4 production so any symbolic graphic that feels misleading can be swapped before voiceover timing is locked.
- The preview MP4 is a timing and camera proof, not the final delivery render. Final delivery can tighten voice choice, transition polish, and export bitrate after buyer-slide copy is locked.
- For MP4 production, use these plates as the visual source and `OPENAI_TTS_SCENE_TEXT_2026-06-05.md` as the voiceover source.
- If a scene feels slow in video, prefer zoom/pan and a shorter voice line over adding more text to the frame.

## Validation Commands

```bash
node -e "const fs=require('fs'),path=require('path'); for (const file of ['docs/build/lakeshore-success-brief/video-storyboard/LAKESHORE_MP4_EXECUTIVE_PLATES_V2_2026-06-05.html','docs/build/lakeshore-success-brief/video-storyboard/LAKESHORE_MP4_SCREEN_NARRATION_STORYBOARD_2026-06-05.html']) { const html=fs.readFileSync(file,'utf8'); const refs=[...html.matchAll(/<img[^>]+src=\"([^\"]+)\"/g)].map(m=>m[1]); const missing=refs.filter(src=>!fs.existsSync(path.resolve(path.dirname(file),src))); console.log(file, refs.length, missing.length); }"
git diff --check -- docs/build/lakeshore-success-brief docs/build/DEMO_PROOF_ARTIFACT_INDEX_2026-06-05.md docs/releases/records/2026-06-05-lakeshore-ai-success-platform-brief.md
npm run release:check -- --base origin/main --head HEAD
```

Current validation status: pass.
