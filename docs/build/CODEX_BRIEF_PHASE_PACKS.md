# Codex Brief — Author Phase Intelligence Packs (P0/P1/P3/P4/P5/P6)

**Sender:** Anand (founder, AbarVa)
**Recipient:** Codex
**Context doc:** `docs/build/AGENT_INTELLIGENCE_SURFACE_AREA.md` §1
**Reference pack already shipped:** `src/lib/programs/phase-packs/P2_synthesis.ts`
**Schema:** `src/lib/programs/phase-packs/types.ts`
**Test contract:** `src/lib/programs/phase-packs/__tests__/phase-packs.test.ts`

---

## The job

Author **6 Phase Intelligence Pack files** — one per phase that's
currently missing — to the same quality bar as the P2 Synthesis
reference. Each file is a single TypeScript module exporting one
`PhasePack` const. The packs feed Nexus's prompt at every turn on a
`/programs/<id>` surface, so the content directly determines whether
Nexus behaves like a senior PM or a generic chatbot.

| File to create | Phase | Phase name |
|---|---|---|
| `src/lib/programs/phase-packs/P0_originate.ts` | 0 | Originate |
| `src/lib/programs/phase-packs/P1_discovery.ts` | 1 | Discovery |
| `src/lib/programs/phase-packs/P3_design.ts` | 3 | Design |
| `src/lib/programs/phase-packs/P4_build.ts` | 4 | Build |
| `src/lib/programs/phase-packs/P5_activate.ts` | 5 | Activate |
| `src/lib/programs/phase-packs/P6_operate.ts` | 6 | Operate |

Phase names are canonical from `src/lib/programs/programs-fixture.ts`
`PHASE_LABEL_MAP`. Use exactly those labels (`'P0 Originate'`, `'P1 Discovery'`, etc.).

After all 6 files exist, update `src/lib/programs/phase-packs/index.ts`
to import + register them in the `PACKS` map.

---

## Schema (from `types.ts`)

```typescript
interface PhasePack {
  phase: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  label: string;            // exactly matches PHASE_LABEL_MAP
  outcome: string;           // one paragraph, ≥80 chars
  definitionOfDone: PhaseEvidenceItem[];   // ≥1 must be severity:'hard'
  rightQuestions: {
    open: PhaseQuestion[];     // ≥1
    converge: PhaseQuestion[]; // ≥1
    close: PhaseQuestion[];    // ≥1
  };
  antiPatterns: PhaseAntiPattern[];   // ≥3
  coachingArc: { entry: string; midPhase: string; exit: string };  // each ≥20 chars
  dependencies: { requiresFromPrior: string[]; producesForNext: string[] };
}

interface PhaseEvidenceItem {
  id: string;                // kebab-case, unique within pack
  label: string;
  severity: 'hard' | 'soft'; // hard = blocks advance
  evaluationHint: string;    // ≥20 chars, "how Nexus would know this exists"
}

interface PhaseQuestion {
  id: string;                // kebab-case, unique across the pack (open+converge+close)
  text: string;              // ≥15 chars, phrased as Nexus would ask it
  why: string;               // ≥20 chars, why this matters at this point
  expectedAnswerShape?: string;
}

interface PhaseAntiPattern {
  id: string;
  label: string;             // punchy name, like "The Phantom Sponsor"
  detectionHint: string;     // ≥20 chars, observable signal
  whatToFlag: string;        // ≥20 chars, what Nexus says/does
  mitigation: string;        // ≥20 chars, what to redirect toward
}
```

**The schema-sanity test suite** in `phase-packs.test.ts` runs over
every authored pack. Each new pack must pass it without modification.
If a pack fails the suite, it's malformed and won't merge.

---

## Quality bar

Read `P2_synthesis.ts` first. The packs you author must reach that bar
or they will be rejected. Specifically:

### Hard rules (auto-fail if violated)

1. **No consulting platitudes.** "Engage stakeholders early" is a fail.
   "Identify the named operator who owns the legacy contact-center
   roster — they will block the new flow if you reach out to them in
   week 6 instead of week 1" is acceptable.

2. **Anti-patterns must be observable.** Every `detectionHint` has to
   describe a concrete signal Nexus could see in chat or in evidence —
   "scope mentions >3 functional areas," "vendor named before problem,"
   "sponsor cannot commit calendar time." Vibes-based detection ("the
   user seems unfocused") is a fail.

3. **Questions must have a `why`.** No question without a reason it
   matters at this point in the phase. The `why` is what tells Nexus
   when the question is satisfied vs still open.

4. **Evidence items must have an `evaluationHint`.** "Charter is
   signed-off" is not enough. "deliverables_v2 row with
   deliverable_type_key='charter' and status='signed_off'" is the
   bar. Reference real tables/columns when they exist; the schema is
   in `supabase/migrations/`.

5. **Coaching arc must change posture.** Each of `entry`/`midPhase`/`exit`
   has to describe a *different* posture for Nexus, not just summarize
   the phase. "Validate sponsor reality before scope" is a posture.
   "The discovery phase is about understanding the problem" is a fail.

6. **Cross-phase dependencies must be specific.** "Findings from
   discovery" is too generic. "Validated baseline KPI with source
   (NICE WFM, Tableau dashboard, finance close)" is the bar.

### Soft rules (style — get these right or the pack reads off)

7. **Voice match.** Read the P2 anti-pattern names: "The Phantom
   Sponsor," "The Wishlist Baseline," "The Vendor-Driven Charter."
   That's the voice. Punchy. Operator-coded. Not "Stakeholder
   Engagement Risk" (consulting deck) and not "yo this charter is sus"
   (too casual).

8. **Length: dense but not bloated.** P2_synthesis.ts is ~457 lines.
   That's the order of magnitude. Don't pad. Don't truncate.

9. **No emoji. No markdown formatting in field values** — these are
   TypeScript string literals consumed by a prompt formatter.

10. **Inline header comment.** Mirror the P2 file header — name the
    phase semantics, the gate rules from `governance.ts`, what's in
    scope vs out, and the source of the failure modes you're encoding.

---

## Cross-phase consistency requirements

The packs aren't independent — phases hand off to each other. Codex
must verify that:

| Producing phase | Consuming phase | Field that must match |
|---|---|---|
| P0 `producesForNext` | P1 `requiresFromPrior` | "value hypothesis seed," "sponsor candidate," "classification" |
| P1 `producesForNext` | P2 `requiresFromPrior` | "validated problem statement," "OKR baseline," "stakeholder map" |
| P2 `producesForNext` | P3 `requiresFromPrior` | already authored — match against P2_synthesis.ts |
| P3 `producesForNext` | P4 `requiresFromPrior` | "detailed design signed off," "pilot cohort named," "success criteria locked" |
| P4 `producesForNext` | P5 `requiresFromPrior` | "pilot outcome (pass/fail vs criteria)," "operating model, "rollout plan" |
| P5 `producesForNext` | P6 `requiresFromPrior` | "rollout completion," "adoption telemetry baseline," "support readiness" |

Phrasing doesn't need to be word-identical, but the *content* of each
handoff must be present in both phases. Mismatches = real bugs in
agent reasoning.

---

## Source material to draw from

In addition to the P2 reference, consult:

| Source | What's in it |
|---|---|
| `src/lib/intelligence/program-lifecycle-patterns.ts` | Per-pattern (CDP, AMS, etc.) failure modes and contradictions. Pull pattern-agnostic patterns into your generic packs. |
| `src/lib/programs/governance.ts` | `GATE_RULES` array — the actual hard/soft gate checks per transition. Your `definitionOfDone` items must include all the hard checks for the matching transition. |
| `src/lib/programs/workshop-readiness.ts` | Workshop intelligence (objectives, evidence requests, output kinds). Phase packs should reference the same vocabulary. |
| `src/lib/programs/quality-gates.ts` | Voice rules (forbidden phrases). Your prose should never contain those phrases. |
| `src/lib/programs/programs-fixture.ts` | `PHASE_LABEL_MAP` — canonical phase names. |

---

## Definition of done for this brief

Codex's deliverable is **one PR** that:

1. Adds 6 files: `P0_originate.ts`, `P1_discovery.ts`, `P3_design.ts`,
   `P4_build.ts`, `P5_activate.ts`, `P6_operate.ts`
2. Updates `src/lib/programs/phase-packs/index.ts`:
   - Adds 6 imports
   - Registers all 6 in the `PACKS` map
   - Updates the `listAuthoredPhases` test from `[2]` to `[0,1,2,3,4,5,6]`
3. Passes `npx tsc --noEmit` with zero errors
4. Passes `npx eslint src/lib/programs/phase-packs/` with zero errors
5. Passes `npx jest src/lib/programs/phase-packs --silent` — the
   schema-sanity suite will multiply: 14 sanity checks × 7 packs =
   98 schema tests + the 7 base tests = ~105 tests total. All green.
6. Each pack's commit-message-grade rationale lives in its file's
   header comment, not in the PR body.

The PR title should be:
> `feat(programs/phase-packs): author P0/P1/P3/P4/P5/P6 Phase Intelligence Packs (Surface 2 PR-D)`

---

## What Codex should NOT do

- Do not modify the schema in `types.ts`. If something feels missing,
  flag it in the PR body — don't extend the schema unilaterally.
- Do not modify the prompt formatter in `index.ts`. Same reason.
- Do not author content for phase 2 — that's the reference and it's
  already shipped.
- Do not generate dummy/placeholder content for any field. Empty arrays
  fail the schema-sanity suite. Placeholder strings ("TODO", "lorem
  ipsum") will be visible in PR review and get rejected.
- Do not mention or invoke phase-pack-evolution (Wave 5 in the surface
  area doc) — the packs are static at this point. Just author the
  static content well.

---

## Verifying before opening the PR

```bash
npx tsc --noEmit
npx eslint src/lib/programs/phase-packs/
npx jest src/lib/programs/phase-packs --silent
```

All three must be clean. If `phase-packs.test.ts` reports a failure
involving "schema sanity," look at the failing pack — it's missing
something the suite requires.

---

## Founder review focus

Anand will review for:
1. Does each pack pass the consulting-platitude test? Could a senior
   PM read it and say "yes, those are the real failure modes"?
2. Are the cross-phase handoffs coherent end-to-end? Read P0 →
   P1 → P2 → P3 → P4 → P5 → P6 dependencies in sequence.
3. Voice consistency with the P2 reference.
4. Anti-pattern realism — do the names land? "The Phantom Sponsor"
   lands. "The Stakeholder Misalignment Issue" doesn't.

If a pack doesn't pass review, the feedback comes as inline review
comments and the iteration is owned by Codex, not Claude.
