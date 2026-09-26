# Increment: Governed artifact controls

Status: brief, awaiting go-ahead
Scope: four controls upstream of rendering, plus one framing change
Non-scope: migrating artifact types to the composed path — that decision is separate

Follows [the composer proof](MODEL_COMPOSED_PPTX_PROOF_RESULT.md). The proof
established that composition can be model-authored safely. This increment fixes the
controls that sit **above** composition, three of which only became visible because
the proof ran on a corpus governed enough to expose them.

The organising principle, and the one sentence worth keeping:

> The model has freedom over communication. It has no freedom over phase, facts,
> claims, decisions, or evidence.

---

## 1 · Artifact eligibility becomes deterministic

**The defect.** The requested artifact type was allowed to lead. A P3 target-state
architecture was requested over a Move whose governed state said
`initiative_status: context_only`, `value_claim_status: baseline_only`,
`metric_boundary: baseline_required_before_value_claim`, no baseline loaded, and four
open discovery gaps. Nothing refused it. The pipeline generated a competent P3 artifact
for a decision nobody could take, and it took a human to notice.

**Invert it.**

```
Governed Move state → Artifact Eligibility Resolver → allowed artifacts
                                                    → generation restricted to that set
```

The resolver is deterministic and reads governed state only. It never consults the
request, so it cannot be argued with.

For this Move it would return:

```
P2 Current-State / Discovery Assessment      ALLOWED
P3 Solution Approach Options                 BLOCKED
P3 Target-State Architecture                 BLOCKED
P3 Solution Design                           BLOCKED
```

with the reasons attached, because a block nobody can explain becomes a block someone
overrides.

**Contract.** `resolveArtifactEligibility(moveState) → { artifactKey, state: 'allowed' | 'blocked', reasons: EligibilityReason[] }[]`.
Every blocked entry names the governed fields that blocked it and what would unblock it.

**Surface.** The UI shows the artifact greyed with one line — *"Target-State
Architecture — not ready: 4 Discovery conditions remain"* — and the conditions on hover.
No explanation of the resolver, no governed vocabulary on a client surface.

**Tests.** Per-condition, never an aggregate. Removing any single blocking condition must
change that artifact's state and no other's; a Move with all conditions cleared must
allow the P3 set. A resolver that returns "blocked" for everything passes an
"is it blocking?" test and is useless, so both directions are asserted.

---

## 2 · Claim boundaries become a typed contract

**Why.** The prohibition gate works, but it infers the rule from sentence wording on
every run. Its first pass produced six findings and all six were false — a denial
written with "nothing", a column header, a conditional value hypothesis. Four
tightenings fixed those, and each tightening is a guess about English rather than a
statement of the rule. The rule should be stated once, at ingest.

```ts
type ClaimConstraint = {
  id: string;
  subject: 'automation_savings' | 'value_realization' | 'scale_readiness'
         | 'sourcing_recommendation' | 'target_state' | string;
  assertion: string;
  state: 'prohibited' | 'conditional' | 'permitted';
  requiredEvidenceIds: string[];
  sourceRefs: string[];
  reason: string;
};
```

This Move would carry:

```
automation_savings   conditional  requires cycle-time baseline, adoption evidence, finance validation
scale_decision       prohibited   until the four discovery gaps close
```

The prose stays — Claude narrates the rule to a reader — but the gate reads the
structure. Text matching becomes the fallback for corpora that have not been normalised
yet, and is labelled as such rather than presented as the mechanism.

**The chain this completes:**

```
evidence → claim boundaries → artifact eligibility → prompt → generated artifact → rendered-claim validation
```

Note that claim boundaries feed eligibility: `scale_decision: prohibited` is precisely
why a P3 is not eligible. The two controls are one mechanism seen twice.

**Tests.** A constraint whose `requiredEvidenceIds` are all satisfied must move from
`conditional` to permitted and stop blocking. A constraint with one unsatisfied id must
still block, and the finding must name **which** id — a gate that says "blocked" without
saying why is a gate someone disables.

---

## 3 · Evidence completeness, per dimension, and not by volume

**Why.** A perfectly lineage-clean artifact can still be incomplete if retrieval never
surfaced the material evidence. Measured on the proof: handed all 145 governed items with
retrieval bypassed, the finished artifact cited 90 (62%), and the 55 it never cited
included 18 of 26 operating metrics. Nothing reported that, because `requiresAttention`
fires only when *zero* items are packed.

Report the whole funnel, per required assessment dimension:

```
OPERATING METRICS
  available 26 · retrieved 23 · packed 23 · assigned 19 · represented 18
  coverage 69%   status ATTENTION
```

**The rule is completeness of REQUIRED evidence, not volume.** A dimension at 96% is
insufficient if the one omitted item is the baseline the decision rests on. So each
dimension declares its required items, and a missing required item blocks regardless of
percentage. Coverage percentage is reported for orientation and never decides adequacy.

**Tests.** Per stage, never a single total — a mutation that zeroes one stage must fail
on that stage's assertion. A run over a full corpus must be distinguishable from a run
over an empty one, so "nothing was available" never reads as "nothing was lost".

---

## 4 · Required governance chrome must survive to the rendered file

**New, and found by the blind review rather than by any gate.** The deterministic
renderer carries an "AI-generated working draft — not approved" banner. The composed deck
**dropped it silently.** Lineage, prohibitions, cross-projection and physical integrity
all passed while a required governance marker vanished from the artifact.

This is the canvas defect again in a different costume: every check green, the artifact
wrong, caught only by a human looking at it.

Three markers, checked on the **rendered file**, not requested in a prompt:

- provenance — AI-generated, draft, approval state
- data basis — a synthetic-data label wherever the corpus flags rows `synthetic_demo`,
  which this one does on every row and neither deck stated
- producer — the AbarVa mark. **Not** "Nexus": internal agent and product names do not
  belong on a steering-committee surface.

Client branding is deliberately excluded. A client's mark on an advisor's deliverable
implies client authorship, and real client identity is `restricted` under the
context/corpus policy — auto-applying a logo would build a disclosure path into the
renderer. The client is named in the title block, which is where a reader expects it.

**Tests.** Each marker removed independently must fail its own assertion. A deck carrying
all three passes. A deck carrying the words in speaker notes but not on any slide face
fails, because the check is what the reader sees.

---

## 5 · What P2 is called

"What is true today and what it costs" presumes cost is evidenced. On this Move it was
not: 231 vendor records carried 3 contract values, and the FY26 budget lines are an
enterprise view rather than this programme's cost.

```
What is true today, what is evidenced, what remains uncertain,
and what must close before the next decision.
```

Cost and value baseline appear when supported, and are absent — visibly — when not. The
band and the section intents follow from that: executive diagnostic, what exists, what
the evidence says, why that is not yet decision-grade, dimension diagnosis where
applicable, root causes, readiness with explicit insufficient-evidence states, and the
decision.

---

## 6 · Acceptance

1. A Move in `context_only` / `baseline_only` cannot produce a P3 artifact by any path,
   including a direct API call, and the refusal names the governed fields.
2. Claim constraints are typed, and the prohibition gate reads structure where it exists.
3. Evidence completeness is reported per dimension, with required-item coverage separate
   from volume, and a missing required item blocks.
4. All three governance markers are present in the rendered file, each independently
   proven by removal.
5. P2's framing and section intents are updated, and an artifact with no evidenced cost
   says so rather than omitting the question.

## 7 · Not in this increment

Migrating any artifact type to the composed path. That decision rests on the human
verdict against the six review questions, and this increment neither assumes nor
forecloses it. The deterministic renderer stays wired throughout.
