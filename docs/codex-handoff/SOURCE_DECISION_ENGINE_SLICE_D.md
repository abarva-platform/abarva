# Codex Handoff — Source Decision Engine · Slice D

**Archetype-specific artifact branching (audit done — verdict: build the injection wire)**

> Read `SOURCE_DECISION_ENGINE_OVERVIEW.md` first. **Depends on Slice B** (auto-draft must exist;
> this slice deepens what the draft contains).

---

## 0 · Why this slice — AND the audit is already done

An AMS RFP should not look like an ERP-SI, AI-data-platform, or renewal RFP — different sections,
evaluation weights, commercial asks, risk areas, required evidence.

**VERIFIED audit verdict (pre-flight, file/line evidence): NOT AT ALL — archetype is a label;
generation is generic.** You do NOT need to re-run the audit. Findings:

- `prompt-registry.ts` `d09_rfp_pack` has ONE hardcoded `systemPrompt` with a fixed `## §1…§10`
  skeleton — identical for all archetypes. Archetype appears only as a printed label
  (`buildUserMessage`: `Archetype: ${ctx.event.archetype}`). Same for `d01`/`d05`.
- `context-binder.ts` threads `archetype` into the context as a passthrough string; nothing
  downstream branches on it.
- `stage-canvas-config.ts` and `stage-packs/S3_rfp.ts` have **zero** archetype references.

**The canon EXISTS and is rich — and it is already on `main`.** `src/lib/source/archetypes/`
(merged via PR #3374) defines per-archetype, *structurally distinct* content:
- `archetypes/registry.ts` — per-archetype `rfpDocumentStructure` (AMS:
  `service_towers / sla_kpi / resource_units / productivity / transition / retained_org`; ERP-SI:
  `process_scope / rollout_waves / integrations / data_migration / testing_cutover / change_adoption`),
  per-archetype `evaluationModel.criteria` **weights**, vendor-guide `ask[]` commercial asks,
  `riskModel`, `negotiationLevers`, `deliverablePack`.
- `archetypes/rfp-canon.ts` — `buildArchetypeRfp(archetype, readiness)` + `renderRfpMarkdown(rfp)`
  already turn that structure into an evidence-gated RFP outline.
- `archetypes/resolver.ts` — maps an event to its registry archetype.

It is **dormant** (no runtime consumers outside `__tests__`). Since slices branch off `main`, the
module is present — **the only missing work is the injection wire.** Do NOT rebuild canon.

> Note: the canon is on `main` but was NOT on the `codex/corpus-wave-24` working branch. Branch
> this slice off `main` (as all slices do) and the `archetypes/` module will be present.

---

## 1 · Task — implement the injection wire (canon already exists; reuse it)

- In `prompt-registry.ts`, make `d09_rfp_pack` archetype-aware: (a) resolve the archetype via
  `archetypes/resolver.ts` from `ctx.event.archetype`; (b) replace the static `## §1…§10`
  system-prompt skeleton with the resolved `archetype.rfpDocumentStructure` section titles;
  (c) inject `evaluationModel.criteria` weights into the §evaluation section and the vendor
  `ask[]` into the §required-capabilities / §pricing sections.
- **Reuse `buildArchetypeRfp` / `renderRfpMarkdown` from `archetypes/rfp-canon.ts`** to produce the
  archetype outline — do not re-implement rendering.
- Keep the **generic fallback** for events with no archetype set (the current static skeleton).
- Start with the **RFP (`d09`)** as the proof artifact; the wire should generalize to `d01`/`d05`
  later (don't build those here). Leave `stage-canvas-config.ts` archetype-awareness as a separate,
  smaller follow-on (today it's flat) — out of scope for this slice.

---

## 3 · Tests
`src/lib/source/__tests__/archetype-artifact-branching.test.ts`:
1. The resolver returns **materially different** section sets / weights for **two** archetypes
   (e.g. AMS vs renewal) — assert the section lists or weight maps differ, not just a label.
2. The generic fallback applies when archetype is unset.
3. Two generated RFP prompts (AMS vs ERP-SI) differ in structure (assert on the assembled system
   prompt / section list, since generation output is non-deterministic — test the **inputs**,
   not the model text).

Plus standing validation (OVERVIEW).

---

## 4 · Browser verification (the hard gate)
1. On an **AMS** archetype event, generate the RFP → note its section structure + weights.
2. On a **renewal** (or ERP-SI) archetype event, generate the RFP → confirm the structure /
   weights / commercial asks are **visibly different** (not the same skeleton). Screenshot both.
3. Confirm an event with no archetype still generates a sensible generic RFP.

Label `click-verified` or `code-complete` honestly.

---

## 5 · Out of scope / boundaries
- Audit-first: do not add branching where it already exists.
- RFP only as the proof artifact; do not branch every artifact in this slice.
- Do not invent archetype canon if the framework already defines it — consume, don't duplicate.
- Branch: `codex/source-decision-engine-slice-d` ·
  PR title: `Source Decision Engine · Slice D: archetype-specific RFP branching (audit + inject)`
