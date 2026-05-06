# Cross-Product Agent Architecture Audit · v1

| Field | Value |
|---|---|
| Audit ID | `CROSS_PRODUCT_AGENT_AUDIT_2026-05-06` |
| Products covered | Moves · Source · Tower · Intelligence · Setup |
| Audit type | Focused M4 (agent architecture) per product, synthesized |
| Reference architecture | Front-agent-per-product · specialists hidden · catalog published |

---

## 1 · TL;DR

**Source is the outlier.** Three of five products (Moves, Tower, Intelligence) already implement the front-agent-per-product model. Setup has resolvable drift. Source is the only product with a parallel-all multi-agent model that contradicts the refined architecture. The redesign work is mostly Source converging to the pattern Tower already embodies, not the other way around.

---

## 2 · Compliance scorecard

| Product | Front agent | Pattern in code | Substrate match | Compliance |
|---|---|---|---|---|
| **Moves** | **Nexus** | Singular front; others as lookup roles in phase templates | N/A — no agent persistence in Moves substrate | ✅ **Compliant** |
| **Source** | **Sentinel** (target) | **Parallel-all** via `SourceMultiAgentBriefing` runs all 4 every stage | `SOURCE_LEAD_AGENT='Nexus'` constant disagrees | ❌ **Non-compliant** |
| **Tower** | **Atlas** | Singular front; full orchestrator with threads/observations | `atlas_threads` + `atlas_observations` tables exclusive to Tower | ✅ **Compliant — reference architecture** |
| **Intelligence** | **Sentinel** | Singular front; voice doctrine with 17 banned patterns | `sentinel-broker-adapter.ts` is the named adapter | ⚠ **Partial — doctrine flag-gated** |
| **Setup** | **Steward** | `StewardEditorial.tsx` is primary editorial; spine says Sentinel chats | All 4 named in `admin_blockers.owner_agent`; only Atlas has dedicated tables | ⚠ **Drift — resolved by audit** |

---

## 3 · The Atlas dual-scope question · resolved

**Before the audit:** unclear whether Atlas-in-Source and Atlas-in-Tower were one identity or two.

**After the audit:** **One identity, two scope applications.** Evidence:

- **Same voice doctrine:** "direct, calm, humble" applied across both products ([src/lib/atlas/prompt.ts:24](src/lib/atlas/prompt.ts:24))
- **Same system prompt suffix:** both reference `AGENT_DEMO_SYSTEM_BLOCK`
- **Different routing depth:** Tower has full orchestrator (`runAtlasTurn`, `runAtlasTurnDetailed`) with 5 dedicated `/api/v1/atlas/*` routes; Source has 4 atlas-aware functions inside event-stage logic
- **Different substrate:** `atlas_threads` and `atlas_observations` are Tower-exclusive ([src/lib/atlas/repository.ts](src/lib/atlas/repository.ts)). Source does not consume them.

**Under the refined model:** Atlas FRONTS Tower (chat window says "Atlas," full orchestrator behind). In Source, Atlas's *capabilities* (executive-brief writing) are exposed as specialists that Sentinel (the Source front) routes to. The brand identity is preserved across products; the chat window mapping is product-by-product.

This is exactly the architecture the user intended with the front-agent-per-product refinement.

---

## 4 · The Sentinel dual-product question · resolved

**Before the audit:** unclear whether Sentinel-in-Source and Sentinel-in-Intelligence were one identity or two.

**After the audit:** **One identity, two broker scopes.** Asymmetric depth — Intelligence is the "primary" Sentinel surface; Source usage is secondary.

- **One voice doctrine** applies to both ([src/lib/agent/voice-doctrine/sentinel.ts](src/lib/agent/voice-doctrine/sentinel.ts)) — 17 banned patterns, surface-aware word caps (`/intelligence` capped at 120 words, `/source` would inherit)
- **One AGENT_VOICE['Sentinel']** fallback line at [src/app/api/chat/agent/route.ts:207](src/app/api/chat/agent/route.ts:207)
- **Asymmetric broker adapters:** Intelligence has a dedicated `sentinel-broker-adapter.ts` (corpus-wide, programId optional); Source has no parallel named adapter. Comment in code: *"Mirror of ProgramsBrokerAdapter, scoped to the Intelligence surface"* — explicit asymmetry.

**Under the refined model:** Sentinel FRONTS Intelligence (corpus-wide reasoning is her primary application). In Source, her capabilities (evidence integrity, citation grounding, contradiction detection) are exposed as specialists that the Sentinel-as-Source-front routes to. Same identity, different broker scope per product.

---

## 5 · Specialist catalog status

The architecture catalog ([docs/architecture/specialist-catalog.md](docs/architecture/specialist-catalog.md)) now has **67 specialists captured** across 5 products + cross-product utilities:

| Section | Front | Captured | Implementation status |
|---|---|---|---|
| Source | Sentinel | 12 | mostly shipped; bundled inside multi-agent generators |
| Setup | Steward | 16 | mix; substrate gaps for some |
| Moves | Nexus | 12 | all shipped — most mature |
| Tower | Atlas | 15 | all shipped — reference architecture |
| Intelligence | Sentinel | 11 | mostly shipped; voice doctrine flag-gated |
| Cross-product | shared | 4 | partial; per-user RLS pilot-blocking |

---

## 6 · Product architecture maturity ranking

Ordered by how close each product's implementation is to the front-agent-per-product target:

1. **Tower** — reference architecture. Atlas-only routes, dedicated substrate, full orchestrator. **Adopt this pattern elsewhere.**
2. **Moves** — singular Nexus front, no multi-agent runtime, 12 named specialist modules. Only minor drift (V1/V2 phase-pack coexistence; agent role labels hardcoded in templates).
3. **Intelligence** — singular Sentinel front, named broker adapter, voice doctrine. Drift: doctrine gated behind `SENTINEL_VOICE_DOCTRINE_DRAFT` flag (P1 — needs founder sign-off).
4. **Setup** — Steward fronts via `StewardEditorial.tsx`, mature substrate (7 admin tables + 5-rung trust ladder). Drift: spine doc says Sentinel chats; resolution = recast Setup chat as Steward routing to Sentinel-flavored specialists.
5. **Source** — only product with parallel-all anti-pattern. `SourceMultiAgentBriefing` runs all 4 agents on every stage. P0 architectural drift.

---

## 7 · The redesign work · concentrated, not distributed

The audit's net finding: **the agent-architecture redesign is mostly a Source refactor, not a cross-product rewrite.**

Product-specific work:

| Product | Work required | Effort estimate |
|---|---|---|
| **Source** | Refactor `SourceMultiAgentBriefing` to single Sentinel front; rename `SOURCE_LEAD_AGENT` constant; route what was Atlas/Steward/Nexus mission generation through specialists | High (1–2 weeks) |
| **Moves** | Minor — V1/V2 phase-pack consolidation; move agent role labels out of templates into config | Low (~1 week) |
| **Tower** | None for agent architecture. Add 2 missing lens routes (inventory, cost) for 5D completeness | Low (~3 days) |
| **Intelligence** | Founder sign-off on Sentinel voice doctrine; flag flip; ship INT-5 4-mode toggle UI | Low (~3 days) |
| **Setup** | Per-user RLS (P0, pilot-blocking); rename `/admin/agents/atlas` to workflow-named route; generalize `atlas_threads` pattern to `agent_threads` for all four agents | Medium (~1 week) |

Plus cross-product work:

| Cross-product item | Required for | Effort |
|---|---|---|
| Generalize `atlas_threads`/`atlas_observations` substrate to `agent_threads`/`agent_observations` with `agent_name` discriminator | All products | Medium |
| Per-user RLS rollout | Pilot readiness | Medium-High |
| Voice doctrine for Nexus, Atlas, Steward (only Sentinel has one currently) | All four front agents | Medium |
| Specialist catalog as runtime-routable data (not just doc) | Future orchestrator routing | Medium |

---

## 8 · Cross-product design observations

### F-CP-201 · Tower's substrate pattern is the right primitive
`atlas_threads` (context_scope enum) + `atlas_observations` (pillar enum) is the cleanest agent-state model in the codebase. Generalizing this to a single `agent_threads` + `agent_observations` table with `agent_name` column gives all five products the same persistence shape. Estimate: 1 migration, ~4 hours.

### F-CP-202 · Voice doctrine should expand from Sentinel to all four agents
Sentinel has 17 banned patterns + surface-aware word caps + drift detector. Nexus, Atlas, Steward have voice generators but no equivalent doctrine. Under the refined model, each front agent needs the same rigor.

### F-CP-203 · Three-corpus retrieval is shared infrastructure
`assembleRetrievalContext()` in Intelligence ([src/lib/agent/retrieval.ts:134-178](src/lib/agent/retrieval.ts:134)) queries client + industry + global namespaces in parallel. Source's evidence retrieval should plug into the same infrastructure rather than reinvent.

### F-CP-204 · Failure-mode classifier is consumed cross-product
Moves imports `listAiProgramFailureModes` from `src/lib/intelligence/ai-program-failure-modes`. This is the right specialist-cross-product pattern — Intelligence owns the catalog, Moves consumes via the broker contract. Should propagate.

### F-CP-205 · `admin_blockers.owner_agent` is the substrate model for capability tagging
The substrate already names all 4 agents as enum values for blocker ownership. Under the specialist model, this is exactly the kind of tagging the catalog needs. Generalize: any task/blocker/observation can carry `owner_capability` (specialist) or `owner_agent` (front agent) tags.

### F-CP-206 · Source's `LEAD_AGENT='Nexus'` constant is a 1-line fix
[src/lib/source/constants.ts:13](src/lib/source/constants.ts:13) — change `'Nexus'` to `'Sentinel'`. This single-line fix doesn't refactor the parallel-all model, but it aligns the constant with the refined direction. Trivial; ship now.

---

## 9 · Decision matrix · what to fix in what order

The audit recommends this sequencing for the redesign:

| Phase | Work | Why first | Effort |
|---|---|---|---|
| 1 · Trivial wins | (a) Rename `SOURCE_LEAD_AGENT` to `'Sentinel'` (1 line). (b) Flip Sentinel voice doctrine flag to prod (after founder sign-off). (c) Rename `/admin/agents/atlas` to workflow-named route. | Low cost, high signal — aligns constants and surfaces with intent | 1 day |
| 2 · Substrate generalization | Generalize `atlas_threads`/`atlas_observations` to `agent_threads`/`agent_observations` with discriminator. Single migration. | Foundation for all four agents to have parallel persistence | ~4 hours migration + ~1 day code reactor |
| 3 · Source refactor | Replace `SourceMultiAgentBriefing` with Sentinel-single-front + specialist routing. Use existing voice generators as specialists with no rewrite. | The biggest piece of redesign work; unlocks Source's compliance | 1–2 weeks |
| 4 · Voice doctrine expansion | Add doctrines for Nexus, Atlas, Steward (mirror Sentinel's 17-banned-pattern model). | Each front agent needs the rigor | ~1 week |
| 5 · Per-user RLS | Pilot-blocking. Substrate-wide. | P0 for first real customer | ~2 weeks |
| 6 · Polish | Tower 5D lens completion, Moves V1/V2 consolidation, Setup audit-trail, Intelligence INT-5 toggle UI | Per-product cleanup | ~1 week each |

---

## 10 · What this audit DID NOT cover

- **Per-product M3 Chrome verification.** All M3 modes deferred for focused sessions.
- **Live data verification** that Apex Retail substrate is actually populated for each product's expectations.
- **Performance** of multi-corpus retrieval at production scale.
- **Voice quality** at the rendered output level (only template-level analysis here).
- **Cross-product UX coherence** — does navigating between Moves → Source → Tower feel cohesive? Needs UX walk.

---

End of cross-product audit.
