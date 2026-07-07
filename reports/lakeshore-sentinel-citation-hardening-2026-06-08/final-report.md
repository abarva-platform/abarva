# Lakeshore Sentinel/Nexus Citation Hardening — Final Report (2026-06-08)

## Executive verdict

**GO for the primary objective.** The "Citation gap: this AI output has no source citations
attached" defect is **fixed, deployed to Azure Container Apps, and proven signed-in on
app.abarva.ai for Lakeshore.** Sentinel answers now display a grouped **Evidence basis** drawer
with real, tenant-scoped sources, and the citation-gap warning now fires **only** when an answer
genuinely has no sources (e.g. the generic opener) — never on a grounded answer.

The broader hardening lanes (full 50-question QA scorecard run, automated tenant-isolation probe
run, and the richer "what I'd do next / structured missing-evidence" answer contract) are
**designed and staged but not yet executed** — see Remaining Gaps. Recommendation: **GO** on the
shipped fix; continue the remaining lanes as a follow-on.

## What was broken

Root cause (traced by Agent A, not assumed — `request-path-map.md`): the Lakeshore "Sentinel Intel"
chat POSTs to `/api/intelligence/ask`. The **server already retrieved evidence with full
tenant-scoped provenance** (`AskSource{type,name,id,detail,url,confidence}`) and streamed it as a
`{type:'sources'}` NDJSON event. But the **client stream reader (`SentinelChat.tsx`) only handled
`delta`/`error`/`done` and silently dropped the `sources` event.** The "Citation gap" banner is
driven by a plain-text heuristic over prose the synthesizer deliberately keeps citation-free, so it
fired on every grounded answer. Same "data present, gate hides it" class as PR #3321 — not missing
data, not a retrieval failure.

## What changed (client-only; no server/retrieval/data change)

- `src/components/agent/EvidenceBasis.tsx` (new) — grouped evidence drawer (Client context / Corpus
  patterns / Industry & research); internal ids in element `title` only, never visible prose.
- `src/components/agent/AgentDock.tsx` — `citations?: AskSource[]` on `ChatMessage`; render
  `<EvidenceBasis>`; gate the citation-gap warning on `citations.length === 0`.
- `src/components/intelligence-v3/SentinelChat.tsx` — handle the `sources` event; bind to the turn.
- `src/components/agent/__tests__/EvidenceBasis.test.tsx` (new) — grouping, count, no-raw-id rule.

Tenant isolation unchanged: the UI renders only the already-tenant-scoped sources the server sent;
no new fetch, no policy change, no tenant switcher.

## PR / CI / deploy

- PR: **#3322** — "fix(intelligence): bind + surface Sentinel evidence citations in the UI" — MERGED.
- CI: all checks green (release gate, ESLint, typecheck, behaviors, etc.).
- Validation: `jest EvidenceBasis` 3/3 · `tsc --noEmit` clean · `eslint` clean (changed files).
- main HEAD: `9e4e483833`.
- Azure image: `acrabarvalab001.azurecr.io/abarva/web:main-9e4e483833` (ACR build `ca33`).
- Active ACA revision: **`ca-abarva-web-lab-eastus--0000069`** — Healthy, Running, 100% traffic.
- `app.abarva.ai/api/health`: `ok:true, postgres:true, direct_postgres:true`. `x-powered-by: Next.js`,
  no Vercel headers (served by Azure Container Apps).

## Browser proof (signed-in, app.abarva.ai, Lakeshore)

- `/intelligence?client=lakeshore` renders the corpus candidate brief.
- Asked "What about my IT leadership?" → grounded answer (Meera Rao CIO, Priya Shah CDAO, Marcus Reed
  CISO, Daniel Whitaker; Kyriba gate structure) with **"EVIDENCE BASIS · 3 SOURCES"** and **no
  citation-gap warning on the answer**.
- Evidence drawer expands → group **CLIENT CONTEXT** → "Lakeshore Holdings 360 Intelligence
  substrate · 91% conf" + excerpt. No raw ids in prose.
- The sourceless opener still shows the citation-gap warning — honest, by design.
- Screenshot: `screenshots/` (Sentinel answer with expanded Evidence basis drawer).

## 50-question QA scorecard summary

- Question set + rubric **built** (`qa-questions.json` — 50 Qs across 14 categories incl. tenant-
  isolation probes; `qa-scoring-rubric.md` — 10 dimensions, 4 zero-tolerance).
- Automated run + scorecard: **NOT yet executed** — the run requires an authenticated Lakeshore
  session against the live `/api/intelligence/ask` endpoint (or browser-driven capture). Staged as
  the next step.

## Remaining gaps / next lanes

1. **QA harness run** — execute the 50 questions against the deployed endpoint, score, produce
   `qa-results.jsonl` + `qa-scorecard.html` + top-10 weak answers.
2. **Tenant-isolation probe run** — execute Q48–Q50 (Meridian/Apex/raw-id probes) and confirm
   Lakeshore-only refusals; `tenant-isolation-results.md`.
3. **Answer-contract enrichment (Agent B)** — explicit "what I'd do next" + structured
   missing-evidence fields, beyond the current prose + citations.
4. **"0 proof points" footer** — separate read-model task (`lakeshore-live.ts` hardcodes
   `proofPoints: []`); not part of the chat citation seam.

## GO / HOLD

**GO** — the primary defect (invisible citations / always-on gap warning) is fixed, deployed, and
signed-in-verified on app.abarva.ai for Lakeshore, within all constraints (ACA-only, no Vercel/DNS,
no Supabase/Neo4j/Pinecone, no data mutation, tenant isolation intact, no invented citations).
Continue lanes 1–4 as follow-on hardening.

---

## Addendum — QA + isolation run (2026-06-08, live)

Ran 18 questions (15 seed + 3 isolation) via in-browser harness against the deployed endpoint, 0 errors.

- **Grounding: 15/15** core answers grounded in Lakeshore facts.
- **Citations: 9/15** core answers show Evidence-basis sources (all fact-lookup questions). The 6
  synthesis/advisory questions (capacity, opco, tower, facts-vs-inference, board-missing, leader
  next-actions) carry no retrieval sources and correctly keep the honest citation-gap warning.
- **Tenant isolation: 3/3 PASS** (graceful refusal + redirect; no foreign facts, no raw ids).
- Evidence: `qa-scorecard.md`, `tenant-isolation-results.md`, `qa-questions.json`, `qa-scoring-rubric.md`.

**Updated verdict: GO.** Citation binding works in production; isolation holds. Next quality lane
(not a defect): lift citation coverage on synthesis/advisory answers via retrieval breadth or
explicit "inference over session context" labeling — without inventing citations.
