# Codex Handoff — Source Decision Engine · Slice D

**Archetype-specific artifact branching (audit-first)**

> Read `SOURCE_DECISION_ENGINE_OVERVIEW.md` first. **Depends on Slice B** (auto-draft must exist;
> this slice deepens what the draft contains).

---

## 0 · Why this slice

An AMS RFP should not look like an ERP-SI, AI-data-platform, or renewal RFP — different sections,
evaluation weights, commercial asks, risk areas, required evidence. The Source Event Archetype
Framework canon exists (4 archetypes: AMS / ERP-SI / AI-data-platform / renewal). The question is
whether that canon **flows into artifact generation**. From inspection it does not appear to —
`stage-canvas-config.ts` offers the same choices regardless of archetype, and the `d09` RFP
template is generic. **Confirm before building.**

---

## 1 · Task 1 — AUDIT (do this first; report before implementing)

Determine, with file/line evidence, whether archetype already changes artifact structure:
- Does `getPromptTemplate('d09_rfp_pack')` / the prompt registry inject any archetype-specific
  sections, weights, or asks? (`src/lib/source/agent-generation/prompt-registry.ts`)
- Does the archetype framework expose per-archetype RFP canon (sections / weights / commercial
  asks / risk areas) that generation could consume but doesn't?
- Is archetype already threaded into the generation context (`buildSourceGenerationContext`)?

**If archetype branching already exists and is correct → STOP. Report that, do not add a second
branching layer.** If partial → implement only the missing injection.

---

## 2 · Task 2 — IMPLEMENT (only if the audit finds a gap)

- Add an archetype → artifact-canon resolver that, given the event's archetype, supplies the
  archetype-specific **sections, evaluation weights, commercial asks, risk areas, and required
  evidence context** for the artifact being generated. Source this from the existing archetype
  framework canon — do not hand-author new canon if the framework already has it.
- Inject it into the prompt template's **system prompt** (structural sections + weights) and/or
  **bound context** (commercial asks / risk areas), so the generated draft is materially
  archetype-shaped. Keep the generic fallback for events with no archetype set.
- Start with the **RFP (`d09`)** as the proof artifact; the resolver should be general enough to
  extend to scope memo / scorecard later (don't build those here).

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
