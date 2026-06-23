# Codex runbook — Instantiate the brain, prove it, report it

> Paste this whole file to Codex. It is the executable version of `BRAIN_CONTRACT_CODEX_BRIEF.md`:
> clear steps, a progress tracker you must keep, the exact files you need, and a required HTML
> proof report (screenshots + every result/failure/fix).

## 0 · Pre-flight (do this first, every session)
1. **`git fetch origin && git rebase origin/main`** (or branch fresh off `origin/main`). Your
   checkout has been drifting behind `main` — that drift is the "flips back" bug. Never edit a
   file you haven't first synced to `origin/main`.
2. **Read these (they already exist on `origin/main`):**
   - `docs/build/ABARVA_HOW_THE_BRAIN_WORKS.html` — the architecture you must instantiate.
   - `docs/build/BRAIN_CONTRACT.md` — the 7 invariants = the acceptance test.
   - `docs/build/BRAIN_CONTRACT_CODEX_BRIEF.md` — the fix plan (audit → source → engine → output → voice → continuity).
   - `docs/build/BRAIN_CONTRACT_PROGRESS.md` — the tracker you must keep current.
   - `scripts/qa/tenant-matrix-gate.mjs` — the conformance gate (do NOT fork it; extend in place).
   - `scripts/qa/reality-crawl.mjs` + `reality-crawl-bank.mjs` + `reality-crawl-report.mjs` — the deep test + HTML report.
   - Source you will touch: `src/components/home/HomeSurface.tsx`, `src/components/agent-answer/AvaAsk.tsx`,
     `src/components/intelligence-v2/IntelligenceV2Surface.tsx`, `src/components/agent-answer/AgentAnswerRenderer.tsx`,
     `src/lib/intelligence/answer/agent-answer.ts`, `src/lib/intelligence/answer/structured-exhibits.ts`,
     `src/app/api/intelligence/ask/route.ts`, `src/lib/tower-v2/v4-data.ts`,
     `src/lib/home/enterprise-landscape-view-model.ts`,
     `src/lib/intelligence/binding/binding-payload.ts` + `all-tenants.json`, and the
     `datasets/<tenant>-synthetic-v4/manifest.yaml` packs (the canonical dimension truth).

## 1 · Mission
Make the product **instantiate the brain** in `ABARVA_HOW_THE_BRAIN_WORKS.html`: conform to all 7
invariants in `BRAIN_CONTRACT.md`, on the deployed app, for all five tenants. Root-cause only —
one canonical source, one engine, one renderer, one ask/history component. No band-aids, no forks.

## 2 · Progress tracking (mandatory — keep it live)
`docs/build/BRAIN_CONTRACT_PROGRESS.md` is the single source of progress truth. **In every PR:**
- Update the conformance-matrix cells you moved (🟥→🟩) for each tenant, with the PR link.
- Append a step-log entry: what changed, the root cause, the gate/crawl delta, the report link.
- Update the reality-crawl pass-rate row.
Do not claim a cell green without a deployed-app screenshot in the HTML report backing it.

## 3 · Work (each step = its own PR, squash-merged on green, with a release record)
Follow `BRAIN_CONTRACT_CODEX_BRIEF.md` §Step 0–5, smallest-first:
0. **Audit report** (no code) — current vs canonical owner + root cause per invariant.
1. **Canonical source** (`dims19`) — one v4 read-model bound by every surface; delete competitors;
   add a CI gate that fails on divergence.
2. **Engine facade** (`experts`,`grounded`) — one ask contract; fix tenant resolution so answers
   stop hedging "not loaded".
3. **Output** (`visual`) — model-emitted typed `tables/charts/graphs`; retire prose-scraping.
4. **One voice** (`readable`) — shared textarea + conversation thread + renderer across surfaces.
5. **Continuity** (`continuity`) — owned by the other lane; coordinate, don't build it here.

## 4 · Prove every fix (browser, on the deployed app — not code reasoning)
After deploy, for each fix:
1. Run the **conformance gate** (signed-in, per tenant):
   `BASE_URL=… COOKIE_APEXRETAIL=… COOKIE_ARCTURUS=… COOKIE_SKYHARBOR=… COOKIE_MERIDIAN=… COOKIE_LAKESHORE=… node scripts/qa/tenant-matrix-gate.mjs`
2. Run the **reality crawl** (captures every answer): `… node scripts/qa/reality-crawl.mjs`
3. **Capture screenshots** with Playwright (reuse the gate's signed-in context): for each tenant ×
   key question, screenshot the rendered answer to `out/reality-crawl/shots/<tenant>/<id>.png`
   (the `<id>` = the bank question id; the report auto-embeds them). At minimum capture: a
   `dims`-question (rail), a `table`/`chart`/`graph` question (the rendered exhibit), and a
   `grounded` question.
4. **Generate the HTML proof report:** `node scripts/qa/reality-crawl-report.mjs` →
   `out/reality-crawl/report.html`. It contains: the pass-rate matrix, **every** question→answer
   (expandable, failures highlighted), the typed exhibits each returned, the judge notes, and the
   embedded **screenshots**. Attach this report (or its key screenshots) to the PR as the proof.

## 5 · Guardrails
- No band-aids; one canonical source per concept; no prose-scraped exhibits; one renderer; one ask
  component. Honesty/fence gates stay green throughout.
- Extend the existing gate/harness — never fork a parallel version (that is the flip-back).
- Rebase on `origin/main` before each PR; if you touch a file another open PR touches, say so.
- Tenant isolation must hold (fence green) at every step.

## 6 · Definition of done
- `BRAIN_CONTRACT_PROGRESS.md` conformance matrix **all 🟩 for all five tenants**, each backed by a
  screenshot in `report.html`.
- The reality-crawl pass rate is high and the **table/chart/graph categories are non-zero and
  correct** (read the corpus to confirm the exhibits are right, not just present).
- THEN — and only then — start the 100-tough-question stress test (expand the bank).

## 7 · Out of scope until done
Do not run the stress test, and do not declare the brain real, until §6 is met with the HTML
report as evidence. "MATRIX PASSED" alone is the shape, not the brain.
