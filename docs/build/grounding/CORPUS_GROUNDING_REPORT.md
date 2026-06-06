# Corpus Grounding Report — 2026-06-06

**Question:** are Nexus / Sentinel / Atlas / Steward grounded on the corpus?
**Method:** a deterministic battery of **140 grounding questions** run through the
real production binding path (`bindMoveFunctionPack` + `resolveFunctionPack`).
**Result:** **140 / 140 grounded.**

Run it: `npx tsx scripts/grounding/run-corpus-grounding-battery.ts`
CI guard: `src/lib/programs/expert-kernel/__tests__/corpus-grounding-battery.test.ts`

---

## What "grounded" means here (and what this is not)

A Domain Function Pack is the curated, function-indexed depth an agent binds
into context **before** it reaches for general intelligence (spec
`ABARVA-DOMAIN-FUNCTION-PACK-SPEC.md` §1). A question is *grounded* when the pack
the agent would bind for that `(industry, function)` actually supplies the
metric, vocabulary, anti-pattern, archetype, own-it discipline, or
architecture-outline section the answer requires. If it does not, the agent
falls back to general reasoning — the precise gap the battery surfaces.

This is a **coverage + regression battery**, run against the binding layer — not
a live-LLM red-team. A live 100-question eval needs the deployed app with real
Clerk + Azure + Anthropic credentials (not available in this environment) and
would add flakiness without testing anything the binding layer doesn't already
determine: the pack IS the curated depth. The battery is CI-enforced so the
grounding cannot silently regress when a pack is edited.

---

## Results

| Dimension | Grounded |
|---|---|
| **Total** | **140 / 140** |
| Healthcare (provider) | 68 / 68 |
| Retail | 36 / 36 |
| Financial services | 36 / 36 |

By the surface that would ask the question (the corpus *can* ground it):

| Surface | Grounded |
|---|---|
| Nexus / Moves | 125 / 125 |
| Sentinel / Intelligence | 11 / 11 |
| Steward / Setup | 3 / 3 |
| Atlas / Tower | 1 / 1 |

The 23 curated hero-pack questions probe the depth added this work-stream:
own-it-vs-rent grounding, the landing-zone / own-it-ingestion / HITRUST
architecture outline, domain vocabulary (HEDIS / Stars / HCC / RADV / HEI /
sepsis), the Epic Sepsis Model and RAF-overreach anti-patterns, and the
foundation reference patterns. The 117 auto-generated questions assert every
catalogued pack (all 3 verticals × ~12 functions) binds curated depth (≥10
metrics, ≥5 archetypes) and inherits a real solution-architecture outline.

---

## Wiring audit — which surfaces actually consume the corpus today

Grounding has two parts: (1) the corpus *contains* the depth (proved above), and
(2) the *surface is wired* to bind it. Audit of who calls the binding path:

| Surface | Binds the function-pack registry today? | Evidence |
|---|---|---|
| **Nexus / Moves** | **Yes — fully** | All four phase-artifact models bind the pack: `move-discover-brief-model.ts`, `move-business-case.ts`, `move-solution-architecture-model.ts`, `move-mobilize-model.ts`; plus `origination-submit.ts`, `tenant-metric-inventory.ts`, `gateLifecycle.ts`. |
| **Sentinel / Intelligence** | **Partially** | The Meridian VBC decision surfaces (`meridian-vbc-decision-home.ts`, `meridian-vbc-bet-selection.ts`) consume packs; the broader Intelligence surface does not yet bind generically. |
| **Audit pack** | Yes | `audit-pack-model.ts` binds the pack. |
| **Sentinel / Source** | **Not yet** | No direct registry binding found. |
| **Atlas / Tower** | **Not yet** | No direct registry binding found. |
| **Steward / Setup** | **Not yet** | No direct registry binding found. |

**Honest conclusion:** the corpus depth is solid and proven (140/140), and the
**Nexus/Moves** surface is fully grounded on it. **Sentinel/Source, Atlas/Tower,
and Steward/Setup are not yet wired** to bind the registry — that is a wiring
gap, distinct from the corpus depth. Closing it means having those surfaces call
`resolveFunctionPack` / `bindMoveFunctionPack` (or the shared context broker) for
their `(industry, function)` context, exactly as the Moves models do. The
battery already proves the depth those surfaces would inherit is present.

---

## Known limitations

- Coverage/regression battery, not a live adversarial eval (see above).
- Probes are authored assertions; they verify the grounding is *present and
  bindable*, not that a downstream LLM phrases the answer well.
- Surface tags record who would ask; the wiring audit is the source of truth for
  who actually binds today.

---

## Grounding model — final per-surface resolution

Grounding is per-`(industry, function)`. The honest answer differs by surface
because the surfaces differ in shape — forcing a single-function bind onto a
cross-function surface would be fabrication, not grounding.

| Surface | Shape | Grounding model | State |
|---|---|---|---|
| **Nexus / Moves** | Single-function (a Move *is* a function) | `bindMoveFunctionPack` — binds the one pack | ✅ Wired + grounded + CI-proven |
| **Sentinel / Source** | Event-scoped | `groundSurfaceContext` — bind when the event resolves a `(industry, function)` | Seam + optional carrier + pass-through shipped (#3225); live population needs `(industry, function)` threaded in |
| **Atlas / Tower** | Cross-function (the whole portfolio) | `groundTenantPortfolio` — **aggregate** over the portfolio's functions; a single bind would be wrong | Aggregate primitive shipped + tested; live wiring needs `ProgramInstance` to carry function identity |
| **Steward / Setup** | Config / loader (admin, ingestion, readiness) | **No function bind by design** — Setup *enables* grounding by loading the data; it is not a function-reasoning surface | ✅ Correct as-is (not a gap) |

### Grounding API — now complete for both shapes

- `groundSurfaceContext({ industryCode, functionPackKey })` → single-function grounding (Moves, Source).
- `groundTenantPortfolio({ industryCode, functionKeys })` → aggregate grounding for cross-function surfaces (Tower): union of metrics + regulatory frames + per-function grounding, unbound functions surfaced honestly.

### The one honest remaining step

Both live populations (Source, Tower) are blocked on the same thing, stated
plainly: **the surfaces' in-memory context objects do not yet carry the
tenant's `(industry, function)` identity** (`SourceTenantContext` has no
industry; `ProgramInstance` has `patternId`/`tenantId` but no function key).
The tenant's industry is resolvable via `resolveTenant` (`industry_code`); the
function must be threaded from the event/program. Wiring that typed identity
through these heavily-tested surfaces is a bounded plumbing follow-up —
deliberately not faked here as "done."

## Follow-on

1. Thread `(industry, function)` identity into the Source bundle + `ProgramInstance`
   so the shipped seams populate live.
2. Grow the battery as packs deepen (it auto-covers each new catalogued pack).
3. When the deployed app + credentials are available, add a thin live-LLM
   smoke layer on top of this deterministic battery.
