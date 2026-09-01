# Moves Rich-Context Build — End-to-End Execution Spec

**For:** Codex (or any implementing agent)
**Repo:** `abarva-platform/abarva` (PUBLIC — see Disclosure Rules)
**Baseline verified at:** `origin/main` (commit at time of writing: `114444320`)
**Status of every claim below:** traced in code, file:line cited. Do not re-derive; do verify.

---

## 0. The problem, stated precisely

Document generation is starved of context. Not by the model, not by the context
window — by a retrieval default nobody revisited.

| | tokens |
|---|---|
| Claude context window | 200K (1M in beta) |
| System + contract + structure + adaptive depth | ~10–15K |
| Reserved for output | ~16–32K |
| **Available for evidence** | **~150K** |
| **Actually sent today** | **12 chunks ≈ 6–18K** |

We use roughly **10%** of the room we have.

A consultant pasting ten documents into a chat window today gives Claude *more*
context than this product does. That is not a defensible position for a tool
whose value proposition is governed context. Everything in this spec exists to
close that gap without giving up the governance that makes the tool worth
buying.

### Why the governance still matters

Rich context alone is a chat window. The product's advantages only exist if the
context is BOTH rich and governed:

- the digest is computed once and reused across P2→P5 and every artifact
- every claim carries a citation to an approved source
- draft and approved evidence are structurally distinct
- the same governed facts feed the P3 architecture and the P4 business case, so
  the numbers agree
- coverage is measurable, so "did it see everything?" has an answer

All five are worthless if the prompt starves. Fix the starvation first.

---

## 1. Verified current state

Every line here was read on `origin/main`. Quotes are verbatim.

### 1.1 Evidence assembly

`src/lib/deliverables/orchestrator/evidence-assembler.ts`

- `assembleGovernedEvidence` — **line 459**
- `topK: params.topK ?? 12` — **line 467**
- Merges two streams:
  - **Move-scoped (Postgres)** via `loadMoveCurrentStateCandidates` (line 279):
    - `program_modules` — line 298, `.limit(80)` line 305. Comment at line 292:
      *"The operator's phase capture is the Move's own source of truth for the
      current generation pass … it must lead generation context so broad tenant
      facts cannot hijack a specific Move narrative."*
    - `evidence_ledger` — line 326, `.limit(80)` line 333
    - `program_evidence_reviews` — line 363, filtered `.eq("decision","approved")`,
      `.limit(40)` line 368
    - `program_evidence_items` — line 376 (joined to the approved reviews)
    - `generated_artifacts` — line 427, `.limit(24)` line 436
  - **Tenant-wide (Azure AI Search)** via `queryTenantContext`, `minConfidence 0.5`
- Both pass through `buildSourceRegister`, which assigns citation numbers and
  drops `internal_only` evidence for vendor-facing audiences.

### 1.2 The retrieval query

`src/lib/deliverables/orchestrator/generate-service.ts` — **lines 110–112**

```ts
query:
  input.evidenceQuery ??
  `${input.deliverableType} ${input.useCaseArchetype} current state baseline`,
```

One generic BM25 string. For a P3 architecture artifact it never asks about the
subject matter of the actual document set.

### 1.3 Token budget is OUTPUT-only

`src/lib/ai/document-generation-policy.ts` — `resolvePassTokenBudget` at **line 237**,
consumed at `prompt-builder.ts:582` as `maxTokens`. There is **no input-side
budget anywhere**. Nothing truncates evidence, because nothing ever gets close.

### 1.4 No prompt caching

`grep -rn "cache_control\|cacheControl\|ephemeral" src/lib/deliverables/orchestrator/ src/lib/ai/`
returns **nothing**. The shared context block is rebuilt and re-billed on every
pass despite being identical across the architect pass and all drafting passes.

### 1.5 Prompt assembly

`src/lib/deliverables/orchestrator/prompt-builder.ts`

- `buildContextBlock` — **line 121**; assembles audience, quality bar,
  `AVAILABLE GOVERNED EVIDENCE` (line 169, rendered at 170),
  `MISSING EVIDENCE` (172), `CLIENT-TO-COMPLETE ITEMS` (175),
  `APPROVED ASSUMPTIONS` (178), required structure (181), adaptive depth (229).
- `buildPassPrompt` — **line 437**. Multi-pass: architect → drafting.
- **The plan gate is the anti-fabrication control.** Lines 461–465: a plan is
  auto-rejected if it cites a citation number not in the bundle, or marks a
  section `governed_facts`/`mixed` with no citation, assumption, or placeholder.
  **Do not weaken this. Everything below must keep it intact.**

### 1.6 Upload → parse → review ladder

`src/app/api/v1/programs/[programId]/artifacts/upload/route.ts`
- `saveMoveArtifact` — line 112
- then `ingestUploadedMoveEvidence` (best-effort; a failure never blocks upload)

`src/lib/programs/current-state-doc-ingest.ts` — header lines 1–17, verbatim:

```
//   upload → parse → program_evidence_items (append-only, cited)
//          → program_evidence_reviews decision='pending'   → readiness 'review_required'
//          → human approval            decision='approved' → readiness 'committed'
//
// Free-form PDF/PPTX/DOCX NEVER auto-commit — extraction is lossy and must be
// reviewed. A schema-validated structured KPI table (XLSX/CSV) MAY auto-promote
// (decision='approved', auto_promoted=true)
```

Key exports: `ingestUploadedMoveEvidence` (540), `decideEvidenceReview` (662),
`resolveDocFamilyReviews` (814), `ensureEvidenceReviewForUploadedEvidence` (369).

### 1.7 THE CRITICAL GAP — approval never happens in the normal flow

- Per-document approval exists: `CurrentStateReadinessPanel.tsx`, mounted at
  `MovesPhaseStandaloneClient.tsx:3890`, on the **P2 Findings substep only**,
  posting to `/api/v1/programs/{programId}/current-state/evidence/{evidenceId}/approve`.
- **The phase gate does NOT approve evidence.** Verified: no `decideEvidenceReview`,
  no bulk evidence promotion anywhere in
  `src/app/api/v1/programs/[programId]/phase-gate-approval/route.ts`.

**Consequence:** upload a current-state volumetric, skip the Findings substep,
approve the P2 gate — the document is parsed, stored, left `review_required`,
and is **invisible to every downstream generation, permanently**. Nothing later
picks it up.

This is the single highest-impact defect in the whole chain. Rich packing on an
empty approved set changes nothing.

### 1.8 Existing infrastructure to reuse — do not invent new patterns

- Workers: `src/scripts/process-deliverable-queue.ts`,
  `src/scripts/process-source-artifact-generation-queue.ts` (ACA Jobs)
- Staged ingestion precedent: `src/lib/context-ingestion/bulk-context-upload.ts`
  already models `worker_queue → private_worker → operator_review → tenant_context_commit`

---

## 2. Non-negotiable invariants

These are drawn from defects already shipped and fixed in this codebase. Each
one cost a live incident. **Any increment that violates one is rejected.**

**I1 — Unreadable is never clean.** A document that could not be read must
report its own failure state and be counted separately. It must never be folded
into a success count. Precedent: `office-text-extract.ts` returns `ok:false`
with no `text` field, making the failure unrepresentable rather than unlikely.

**I2 — Not-scanned is not clear.** Same shape one level up. If nothing was
examined, say so; never report an unexamined thing as passing.
Precedent: `client-readiness-gate.ts` `not_scanned` verdict.

**I3 — Derived content inherits its parent's review state.** A digest of an
unapproved document is unapproved. It becomes prompt-eligible only when its
source does. Nothing derived may outrank its source.

**I4 — Version identity, not name identity.** Key every derived artifact to
`(sourceId, contentHash)`. A re-upload invalidates; it must never shadow.
Precedent: superseded artifacts stayed `board_ready` alongside replacements and
both were live simultaneously — the duplicate was worse than the original defect.

**I5 — Counts must cover the whole set.** A summary over a filtered subset,
presented as a summary of everything, is a lie. Precedent: an operator scan
reported "30 scanned, all clean" over a set that was actually 32, and the two
excluded documents were the two with findings.

**I6 — The plan gate stays intact.** `prompt-builder.ts:461–465`. Richer
context must not make it easier to cite a number that does not exist.

**I7 — Every rule gets a negative test.** A guard with only positive tests
becomes noise people learn to ignore. Test both directions, always.

**I8 — Live proof over green tests.** Every increment ends with a real run
against a real Move, measured numerically — not a screenshot, not "looks right."

---

## 3. Increment 1 — Context packing

**Objective:** raise usable evidence from ~6–18K to ~100–140K tokens, and make
retrieval ask about the artifact instead of a generic string.
**Depends on:** nothing. Start here.

### 3.1 Section-driven retrieval

`generate-service.ts:110–112`. Replace the single generic query with queries
derived from the artifact's own required structure (`brief.requiredSections`,
plus `expectedExhibits`/`expectedTables` where present).

Run one retrieval per section group (batch them), union the results, dedupe by
`chunkId`. A P3 architecture artifact should be retrieving against its actual
section topics, not `"target_state_architecture ANALYTICS_CAPABILITY_REPATRIATION current state baseline"`.

Keep `evidenceQuery` as an explicit override.

### 3.2 Real input budget

New module: `src/lib/deliverables/orchestrator/context-budget.ts`

```ts
export interface ContextBudget {
  /** Total model context window. */
  windowTokens: number;
  /** Reserved for the completion. */
  outputReserveTokens: number;
  /** Measured size of system + contract + structure + adaptive depth. */
  fixedOverheadTokens: number;
  /** What remains for evidence. */
  evidenceTokens: number;
}

export function resolveContextBudget(input: {...}): ContextBudget;

/** Pack in priority order until the budget is spent. Never mid-item. */
export function packEvidence(
  items: GovernedEvidenceItem[],
  budget: ContextBudget,
): { packed: GovernedEvidenceItem[]; droppedCount: number; usedTokens: number };
```

**Packing priority — this order is deliberate and must be preserved:**

1. `program_modules` phase capture (the Move's own truth — see the comment at
   `evidence-assembler.ts:292`; broad tenant facts must not hijack the Move)
2. Approved `program_evidence_items` (the client's own uploaded documents)
3. `evidence_ledger`
4. Prior-phase `generated_artifacts`
5. Tenant-wide Azure Search chunks

Raise the SQL limits (305/333/368/436) and `topK` (467) so the budget, not an
arbitrary constant, is what binds. Token estimation may be approximate
(`chars/4` is acceptable) — but **it must be explicit, and the drop count must
be reported** (I5).

### 3.3 Prompt caching

Add `cache_control: { type: "ephemeral" }` at the end of the shared context
block in `model-caller.ts` (line ~136/155). The block is identical across the
architect pass and every drafting pass — caching it is what makes rich context
affordable rather than a cost cliff.

### 3.4 Coverage instrumentation

New: `src/lib/deliverables/orchestrator/context-coverage.ts`

```ts
export interface ContextCoverage {
  approvedAvailable: number;   // approved evidence items that exist for this Move
  retrieved: number;           // returned by retrieval
  packed: number;              // actually placed in the prompt
  droppedForBudget: number;
  unreadable: number;          // parsed/extracted and failed — NEVER counted clean (I1)
  cited: number;               // referenced in the finished artifact
  coverageRatio: number;       // packed / approvedAvailable
}
```

Persist it on the generation run and surface it in the response. **A generation
where `approvedAvailable > 0` and `packed === 0` must be a visible, loud state**
— not a silently thin document.

### 3.5 Tests

- Budget arithmetic: overhead + output reserve + evidence never exceeds window
- Packing respects priority order
- Packing never splits an item
- `droppedForBudget` is accurate (I5)
- Section-driven query builds distinct queries per artifact type
- **Negative:** empty evidence set still produces a valid prompt and reports
  `coverageRatio: 0` rather than throwing or silently passing (I2, I7)

### 3.6 Acceptance

- Generate one P3 artifact **before** and **after** on the same Move
- Report both coverage readouts side by side
- Record measured token counts, not estimates of estimates
- **Do not claim improvement without both numbers.**

---

## 4. Increment 2 — Close the approval gap

**Objective:** stop uploaded evidence from silently never reaching generation.
**Depends on:** nothing. Can run parallel to Increment 1.
**Requires a product decision — see §8.**

### 4.1 Extend deterministic auto-commit

`current-state-doc-ingest.ts` already permits auto-promotion for
schema-validated structured KPI tables (`validateKpiTable`, line 174). Extend
the same deterministic tier to other structured, schema-shaped families —
volumetrics, systems inventories, application lists — where the file *is* the
fact and extraction is reliable.

**Free-form PDF/PPTX/DOCX still require review.** Extraction is lossy, and a
misread sentence becomes a cited client fact. Do not relax this.

Auto-committed rows must remain distinguishable from human-reviewed rows
(`auto_promoted=true` already exists). Never let the two collapse into one
undifferentiated "approved."

### 4.2 Make the gate honest

`phase-gate-approval/route.ts`. The gate must **report** unreviewed evidence:

> "6 uploaded documents are unreviewed and will not inform any deliverable."

Two options for behaviour — §8 decides:
- **(a)** Report only; approval proceeds.
- **(b)** Block until reviewed or explicitly waived, with the waiver recorded.

Either way the count must be visible at the gate. Today the gate is silent and
the documents rot.

### 4.3 Tests

- A structured volumetric auto-commits and becomes retrievable
- A free-form PDF does **not** auto-commit (negative — I7)
- Gate response includes the unreviewed count
- Auto-committed and human-reviewed rows remain distinguishable

### 4.4 Acceptance

Upload a structured volumetric to a test Move, run generation, and show it in
the coverage readout as `approvedAvailable` and `packed`. **End to end, measured.**

---

## 5. Increment 3 — Digest layer

**Objective:** digest each document once at upload; reuse across every artifact
and every phase.
**Depends on:** Increments 1–2. **Do not start until Increment 1 is measured** —
if section-driven packing at 100K already produces the needed quality, this
becomes an optimisation rather than a rescue, and its scope should shrink.

### 5.1 Contract

New: `src/lib/programs/evidence-digest/types.ts`

```ts
export interface EvidenceDigest {
  digestId: string;
  sourceEvidenceId: string;
  /** (sourceId, contentHash) is the identity. A re-upload invalidates. (I4) */
  sourceContentHash: string;
  /** Mirrors the parent's review state. Never higher. (I3) */
  reviewState: "review_required" | "committed" | "rejected";
  facts: DigestFact[];
  decisions: DigestDecision[];
  metrics: DigestMetric[];
  entities: string[];
  gaps: string[];
  /** Loud failure. Never silently absent. (I1) */
  status: "digested" | "digest_failed" | "not_digestible";
  failureReason?: string;
  model: string;
  promptVersion: string;
  digestedAt: string;
}

export interface DigestFact {
  statement: string;
  /** Anchor back into the source so a citation can be rendered. */
  sourceAnchor: string;
  confidence: "high" | "medium" | "low";
}
```

Every digest item must be traceable to a location in its source. A digest fact
that cannot be anchored is not usable — drop it rather than emit it.

### 5.2 Trigger

Enqueue **at upload**, immediately after `ingestUploadedMoveEvidence` in
`artifacts/upload/route.ts`. Never inline: uploading 25 documents must not block
on 25 model calls, and a digest failure must never fail an upload whose bytes
are already stored.

Reuse the existing ACA Job worker pattern
(`process-deliverable-queue.ts`). Do not invent new infrastructure.

**Why at upload rather than at approval:** the digest is what makes review fast
enough to actually happen. Approving six digests that each say *"asserts 14
facts, 3 metrics, 2 gaps"* takes a minute; reviewing six raw parsed documents is
a chore people skip — which is how §1.7 happens.

### 5.3 Governance binding

```
document review_required  →  digest exists, NOT prompt-eligible
document approved         →  digest becomes prompt-eligible
document rejected         →  digest dies with it
document re-uploaded      →  digest invalidated by contentHash change (I4)
```

Enforce in the type system where possible, not only in a query filter.

### 5.4 Tests

- Digest inherits parent review state; cannot exceed it (I3)
- Content-hash change invalidates rather than shadows (I4)
- `digest_failed` is a distinct state and never counts as clean (I1)
- An unapproved document's digest is not prompt-eligible (negative — I7)
- Digest facts without a source anchor are dropped

---

## 6. Increment 4 — Digest-aware packing + live proof

- Pack digests (small, dense) plus highest-relevance full passages to fill the
  budget, ordered by the artifact's section structure
- Full coverage readout: available → digested → packed → cited
- **Live proof on a real Move**, numbers reported (I8)

---

## 7. Sequencing and the measurement discipline

```
Increment 1 (packing)  ──┐
                          ├─→ MEASURE before/after ──→ decide Increment 3 scope
Increment 2 (approval) ──┘
                                                   Increment 3 → Increment 4
```

**Ship 1 and 2, measure, then decide 3's scope.** Do not build the digest layer
on the assumption it is needed. A before/after P3 artifact with two coverage
readouts is worth more than any design document.

---

## 8. OPEN DECISION — required from Anand

**Which document families auto-commit on parse?**

Recommended: deterministic, schema-shaped files (volumetrics, systems
inventories, KPI tables, application lists) auto-commit; free-form
PDF/PPTX/DOCX still require review.

Alternative: everything auto-commits in pilot, tightened later — reversible, but
the gate must still distinguish auto-committed from reviewed so the distinction
survives even when the friction does not.

**And:** does the gate *report* unreviewed evidence (4.2a) or *block* on it (4.2b)?

---

## 9. Disclosure rules — this repo is PUBLIC

- No real client names in commit messages, PR titles/bodies, code comments, or
  release records. Use synthetic tenants.
- No incident narratives. Describe the *mechanism* of a fix, never the
  engagement, the consequence, or the dispute.
- Before writing any commit/PR/comment, ask whether it would be safe on a public
  GitHub page read by a competitor or a prospect doing diligence.

## 10. Release discipline

Every increment: release record under `docs/releases/records/` using the
template, `npm run release:check` green locally
(`node scripts/release-check.mjs --base origin/main --head HEAD`), PR to `main`,
squash merge, deploy via the repo-owned ACA workflow only. Prove the runtime
invariant (template digest == 100%-traffic revision digest) before calling
anything live.

Do not commit locally-regenerated `reports/**` churn — restore it from
`origin/main` before committing.

---

## 11. REAL-TIME STATUS IN THE REPO — MANDATORY

Anand must be able to see progress at any moment without asking. Codex maintains
a live status file **in the repo**, committed and pushed as work proceeds.

### 11.1 The file

`docs/status/moves-rich-context/STATUS.md`

Rewritten in place on every update. Always reflects reality now — never a log of
intentions.

### 11.2 Required shape

```markdown
# Moves Rich-Context Build — Live Status

**Updated:** <ISO-8601 UTC>
**Agent:** codex
**Branch:** <branch>
**Head:** <short sha>

## Now
<one sentence: what is being worked on this minute>

## Increments
| # | Increment | State | Evidence |
|---|-----------|-------|----------|
| 1 | Context packing | not_started \| in_progress \| pr_open \| merged \| deployed \| live_proven | PR / SHA / deploy run |
| 2 | Approval gap | … | … |
| 3 | Digest layer | … | … |
| 4 | Digest-aware packing | … | … |

## Measurements
| Metric | Before | After |
|--------|--------|-------|
| Evidence tokens in prompt | | |
| approvedAvailable / packed / cited | | |
| coverageRatio | | |

## Blocked on
<what, and who owns it — or "nothing">

## Decisions taken
<any judgement call made without asking, and the reasoning>

## Known gaps
<what is deliberately not done yet>
```

### 11.3 Update triggers — push on every one

- Starting an increment
- Opening a PR (record the number)
- Merging (record the squash SHA)
- Deploy succeeding (record the ACA run id and image digest)
- **Any blocker** — immediately, do not batch
- **Any measurement taken** — record the number, before and after
- Any judgement call made without asking

Small, frequent commits: `chore(status): <what changed>`. Status commits may go
straight to a status branch or ride along with the working branch — but they
must be **pushed**, not left local. An unpushed status file is not status.

### 11.4 State vocabulary — use these words exactly

`not_started` · `in_progress` · `pr_open` · `merged` · `deployed` · `live_proven`

**`deployed` and `live_proven` are different facts.** A deploy that succeeded is
`deployed`. Only a real signed-in run with measured numbers is `live_proven`.
Never write `live_proven` on the strength of green tests, a health endpoint, or
a successful deploy — that distinction is the whole point of the vocabulary.

### 11.5 Honesty rules for the status file

- Report what **is**, not what is intended. No "should be working."
- A number with no measurement behind it does not go in the Measurements table.
  Leave the cell empty rather than estimating.
- If an increment is blocked, say so the moment it blocks — a stale "in_progress"
  that is actually stuck is worse than no status at all.
- If a claim later proves wrong, correct the file and note the correction under
  **Decisions taken**. Do not silently overwrite a wrong number.
- Never write a real client name into this file. It is in a public repo.

### 11.6 First action

Before writing any code: create `docs/status/moves-rich-context/STATUS.md` with
all four increments at `not_started`, commit, and push. That commit is the signal
that the work has begun.
