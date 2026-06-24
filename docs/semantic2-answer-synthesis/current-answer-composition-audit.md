# Current Answer Composition Audit (Part 1)

_Read-only audit of where and how aVa answers are composed today, across all five surfaces. Basis for the Semantic2-native answer-synthesis rebuild._

## Headline findings

1. **"Semantic2" already exists** as `src/lib/semantic2/` — and its composer is the row-count offender we are removing. Build the new synthesis layer by **upgrading this in place**, not by forking a parallel `semantic2-answer/`.
2. **The wired "semantic layer" is volumetric (count-shaped)**, not concept-shaped. The lead answer on the semantic path is built from record counts, dimensions, and source-table counts.
3. **Real entity tables exist** (`public.applications`, `public.initiatives`, `public.vendors`) but are queried narrowly (regex-gated) and are not traversed into connected business concepts.
4. **No relationship-traversal / metric-synthesis / concept-composition tier** feeds any lead answer today.
5. **Home has no ask endpoint.** Home is a static fixture; the live Home ask rides `/api/intelligence/ask` (the shared engine). Part 8 requires *creating* `/api/home/know/ask`, not updating it.
6. Every surface composes its own prose. There is no shared answer composer — the architectural fix the rebuild introduces.

## Per-surface composition

### Home — `KNOW`
- **Endpoint:** none (`/api/home/know/ask` does **not** exist).
- **Surface:** `src/components/home/HomeIndexPage.tsx` renders a static deterministic fixture `HOME_VIEW` from `src/lib/home/shell-home-fixture.ts` (hardcoded stats: programs, coverage %, pattern count).
- **Live ask:** routes through the shared `/api/intelligence/ask` engine (per the screenshots and FE KNOW-mode review) — which is why Home inherits experts, decision framing, and row-count prose.
- **Lead built from:** static fixture + shared Intelligence engine. **No semantic concept layer.**

### Intelligence — `ANALYZE`
- **Endpoint:** `src/app/api/intelligence/ask/route.ts` (`handleAsk`).
- **Two paths:**
  - **Semantic/volumetric path** (gated by `shouldUseEnterpriseSemanticLayer`, route.ts:140): `answerEnterpriseSemanticQuestionFromAzure` → `buildDirectAnswer` (semantic-answer-runtime.ts:235). **Lead = record counts** ("the semantic layer has N records across M dimensions…", line 226/232). Sources: `tenant_data_volumetrics`, `tenant_dimension_coverage`, `tenant_question_readiness`.
  - **Sentinel synthesis path** (default): `askIntelligence` (lib/intelligence/ask/index.ts:103) gathers tenant structured facts (`retrieveTenantStructuredFacts` → applications/initiatives/vendors), a **file snapshot** (`datasets/{tenant}/derived-intelligence/enterprise-reads.json`), surface-context facts, and chunk RAG (`retrieveWorldview`), then LLM-synthesizes via `synthesizeStream` (synthesizer.ts:273).
- **Lead built from:** either a **row-count direct answer** (semantic path) or **LLM synthesis over mixed retrieval** (Sentinel path). Real entities used only when the Sentinel regex matches.

### Source — `SOURCE`
- **Engine:** `src/lib/source/source-answer-engine.ts` (`buildSourceAnswerEngine`, L120).
- **Composition:** evidence ranking → current-state findings → mode-gated guidance → `formatAnswerText` (L458). **Semantic-first** (CXO guidance, assumptions, risks, confidence/limits) — does **not** lead with counts.
- **Leak:** evidence labels expose `recordId` / `sourceDoc` (L470). The newer `semantic2/build-answer-packet.ts` path leads with "I found N rows" (see leakage audit).

### Moves — `EXECUTE`
- **Engine:** `src/lib/programs/expert-kernel/living-move.ts` + `business-case-compiler.ts`.
- **Composition:** structured business-case skeleton (baseline → value range → cost → assumptions → sensitivity → kill criteria → recommendation → Tower handoff), rendered by expert-kernel exports. **Semantic, structured** — no row-count lead.

### Tower — `CONTROL`
- **Engines:** `src/lib/atlas/tower-grounding.ts`, `src/lib/tower/band-metrics-view.ts`, `metric-explanation-view.ts`, `pressure-cards-view.ts`.
- **Composition:** **mixed.** Band-metric tiles lead with a semantic metric value; but `metric-explanation-view.ts:370` leads with renewal **count**, `pressure-cards-view.ts:352` leads with pressure **count**, and grounding emits "Substrate counts: N initiatives…" (tower-grounding.ts:291).
- **Leak:** initiative `displayId` / `stage` / `statusFlag` into grounding and into `atlas/composition/compose.ts` user prose (`view.code`, L47/72).

## Implication for the rebuild
- The single shared composer must **replace** `semantic2/build-answer-packet.ts` and the volumetric `buildDirectAnswer`, become the lead-answer authority for all five surfaces, and demote counts to expandable proof.
- The entity foundation (applications/initiatives/vendors) is real and is the seed for concept/relationship/metric retrieval (Parts 4–5).
- Home needs a net-new `/api/home/know/ask` routed through the shared composer.
