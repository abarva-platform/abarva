# Increment: Governed artifact controls

Status: brief, awaiting go-ahead
Scope: five controls upstream of rendering, plus one framing change
Non-scope: migrating artifact types to the composed path — that decision is separate

Follows [the composer proof](MODEL_COMPOSED_PPTX_PROOF_RESULT.md). The proof established
that composition can be model-authored safely. This increment fixes the controls that sit
**above** composition — most of which only became visible because the proof ran on a
corpus governed enough to expose them.

The organising principle:

> The model has freedom over communication. It has no freedom over phase, facts, claims,
> decisions, or evidence.

And the governing sequence, which is what this increment installs:

> **Move-process uploads are used in full.** **Scope** decides what further evidence may
> exist for this Move. **Admission** decides what
> evidence this artifact may use. **Coverage and containment** decide whether that
> evidence set is valid. **Eligibility** decides what artifact that valid evidence can
> support.

```
Governed intake
    ↓
1. Move Scope Contract
    ↓
2. Evidence Admission — typed edges + bounded depth
    ↓
3. Coverage + Containment
    ↓
4. Retrieval / Packing
    ↓
5. Artifact Eligibility
    ↓
6. Artifact Generation
    ↓
7. Claim / Numeric / Phase / Approval gates
```

---

## 1 · Move scope and evidence admission

**This is first because it defines the evidence universe the Move is allowed to reason
over at all.** Everything below it is downstream of getting this wrong.

**The defect, measured.** A P2 current-state assessment for one contact-centre capability
was generated from a bundle of 159 governed evidence items. **19** came from the Move's own
intake. **2** were the enterprise anchor. **35** named an object the Move declared. The
other **103 had no connection to the Move at all** — enterprise IT budget lines for the EHR
and ERP, risks belonging to other use cases, applications outside the contact flow, and the
economics of seven unrelated AI programmes. Twenty of those reached the rendered deck,
including a slide comparing the capability to Microsoft 365 Copilot and a developer-
productivity programme, in a pack addressed to the VP of Member Services.

Eighty-seven per cent of what the model reasoned over was never part of this process, and
the planner wrote an enterprise AI portfolio story because that is what it was handed.

**The inversion.**

> No admission path → no evidence admission.

A relevance score may rank items **inside** the admitted set. It must never expand it.
"It is also about AI" is topic similarity, and topic similarity is what put Copilot on
slide 5.

### 1.1 · Two tiers, and only one of them is optional

The evidence universe has two tiers, and they are governed by opposite defaults.

**Tier A — evidence uploaded through the Move's own process, at P0, P1, P2 and every phase
since. Mandatory, and utilised in full.** It is cumulative: a P2 artifact is accountable for
everything uploaded at P0 and P1 as well as at P2. Someone was asked for this, produced it,
and loaded it against this Move. It does not have to earn admission — it is the reason the
Move has evidence at all.

**Tier B — wider tenant context. Admitted, never assumed.** Bounded by scope, typed edges and
depth, per §1.3–§1.4. Default exclusion.

A relevance score may rank **inside** Tier B. It may never expand Tier B, and it has no
standing over Tier A at all.

**What "utilised 100%" means, precisely.** A fourteen-slide deck cannot carry every row of a
large intake on its face, and pretending otherwise would produce a worse artifact. So
utilisation is judged at the level of the **artifact package** — narrative, tables, exhibits
and appendix together — and every Tier A item must end in one of exactly two states:

- **used** — cited in the analysis or rendered in the package; or
- **declared not applicable** — with a reason, an actor, and a line in the source register.

**Silently unused is a defect.** Not a rounding error, not an editorial choice: a defect. On
the run that prompted this, an uploaded headcount figure was cited in a 15,264-word narrative
and appeared on none of the fourteen slides, and nothing anywhere said so. Under this rule it
is either on a slide, in the appendix, or declared — and the declaration is visible to the
person who supplied the number.

**An unusable upload is itself a finding.** If a Tier A item cannot be placed, one of two
things is true and both are worth surfacing: the upload was out of scope for the phase, or
the artifact brief is missing a section that should have consumed it. A pipeline that quietly
drops evidence hides both.

### 1.2 · Move Scope Contract

Scope is declared from governed intake **using IDs, not inferred from text**. It is
versioned.

```ts
type MoveScope = {
  moveId: string;
  version: number;
  capabilityIds: string[];      // the thing being assessed or changed
  programmeIds: string[];
  systemIds: string[];
  dataDomains: string[];
  businessFunctions: string[];
  accountableOwnerIds: string[];
  vendorIds: string[];
};
```

If scope legitimately changes, that is a **governed scope amendment** carrying actor,
reason, timestamp, and prior/new values. Never silent inference.

**Scope must not become the loophole.** Adding an enterprise domain — or Microsoft Copilot —
to a Move's scope would make its evidence admissible, and the engine would correctly accept
it. So an amendment is a material governed decision, with approval appropriate to the Move's
phase, and the diff is visible in the artifact's audit trail. A control whose bypass is one
unlogged field edit is not a control.

### 1.3 · Evidence Admission Policy

Resolved by `artifactType × archetype`, not per Move. Roughly 24 artifact types by a handful
of archetypes is a bounded table, written once and reviewed like any other contract; the Move
supplies only its scope objects, which intake already captures.

```ts
type EvidenceAdmissionPolicy = {
  policyVersion: string;
  required:  { family: string; minItems: number; requiredEvidenceKeys?: string[]; maxDepth: 0 | 1 | 2 }[];
  permitted: { family: string; maxDepth: 0 | 1 | 2; maxItems?: number }[];
  benchmark: { family: string; appendixOnly: true; mustBeLabelled: true }[];
  excluded:  string[];
  /** Edge types legal at each depth. "Two hops away" is not a specification. */
  legalEdges: { depth: 1 | 2; relationshipTypes: string[] }[];
};
```

Depth: **d0** the scope objects themselves · **d1** records naming a scope object · **d2**
one typed hop the brief permits. Edge types stay explicit and come from the canonical
`relationship_types` dictionary. This is precisely the dependency-context use the V6 graph
substrate exists for, and it calculates no metric.

Policies differ by artifact because the surface differs: a P2 current-state needs scoped
systems and blocking gaps at d1; a P5 handoff is far narrower; a P4 business case admits peer
benchmarks as **required** rather than benchmark-only.

### 1.4 · Admission record

Persisted per candidate, admitted or not, so the source register can answer *why was this
evidence even considered?*

```ts
type EvidenceAdmissionDecision = {
  evidenceId: string;
  admitted: boolean;
  artifactType: string;
  policyVersion: string;
  family: string;
  admittedBy: 'move_scope' | 'named_object' | 'enterprise_anchor' | 'benchmark';
  traversalDepth: 0 | 1 | 2;
  traversalPath: { fromId: string; relationshipType: string; toId: string }[];
  reason: string;
};
```

### 1.5 · Coverage gate

**Tier A first: every Move-uploaded item must be `used` or `declared not applicable`.** That
check is per item and admits no minimum — a percentage would let the pipeline choose which of
the client's own evidence to ignore.

For Tier B, required families must meet their minimums — **and `minItems` alone is
insufficient.** A
dimension at 96% is worthless if the omitted item is the baseline the decision rests on, so
coverage supports both `minItems` and explicit `requiredEvidenceKeys`. A named
decision-critical requirement missing is a coverage failure whatever the count says.

### 1.6 · Containment gate

Every packed, cited and rendered item must trace to an admission decision. Benchmark evidence
must obey its location and labelling policy.

**Off-scope material is a defect even when it is factually correct.** The Copilot comparison
was true, well-argued, and inadmissible.

This is the half the earlier evidence-funnel work was missing entirely: it measured what
*should* be present and was blind to what should not. It reported 13 of 13 uploaded facts
arriving while 103 inadmissible items sat in the same bundle.

### 1.7 · Two denominators

The funnel previously had one denominator — whatever retrieval happened to find. There are
now two, and they answer different questions:

```
eligible governed evidence universe
        ↓
admitted evidence universe
        ↓
retrieval funnel
```

*Did we admit the right evidence?* and *of what we admitted, did retrieval surface it?* A
perfect retriever over a polluted universe is wrong; a perfect admission policy with poor
retrieval is also wrong, and the previous single funnel could not distinguish them.

### 1.8 · Shadow adoption first

Per the graph adoption rule, admission reports before it gates. Every artifact generation
emits:

```
available evidence
admitted
would exclude
retrieved
packed
cited
rendered
```

and flags specifically:

- **Tier A items that were never used and never declared**
- inadmissible items that retrieval selected
- inadmissible items that reached prose
- inadmissible items that reached PPTX
- **required admitted items that were never retrieved**

On the run that prompted this, the shadow report would have read: *103 of 159 inadmissible,
20 of them reaching the deck.*

### 1.9 · Policy proof before enforcement

Four planted cases per policy, not two. A policy proven in one direction is taste with a type
signature.

```
drop one Move-uploaded item       → coverage FAIL  (Tier A, per item)
remove a required family          → coverage FAIL
remove a decision-critical item   → coverage FAIL
add an off-scope family           → containment FAIL
place benchmark in the core story → containment FAIL
```

---

## 2 · Artifact eligibility becomes deterministic

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

## 3 · Claim boundaries become a typed contract

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

> **Evidence completeness**, previously its own section, is now §1.4 and §1.5. Reporting a
> funnel per dimension was the right instinct with the wrong denominator: it measured
> retrieval against whatever retrieval found. Admission supplies the denominator that makes
> the measure mean something.

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

1. Every item uploaded through the Move's process, at any phase, ends as `used` or
   `declared not applicable` with a reason and an actor. Silently unused fails the build.
2. No evidence enters a bundle without an admission decision, and every packed, cited and
   rendered item traces to one. Scope amendments are logged with actor, reason and diff.
3. Each admission policy passes its four planted cases before it gates anything, and runs in
   shadow first.
4. A Move in `context_only` / `baseline_only` cannot produce a P3 artifact by any path,
   including a direct API call, and the refusal names the governed fields.
5. Claim constraints are typed, and the prohibition gate reads structure where it exists.
6. Coverage reports both `minItems` and `requiredEvidenceKeys`, and a missing
   decision-critical item blocks whatever the count says.
7. All three governance markers are present in the rendered file, each independently
   proven by removal.
8. P2's framing and section intents are updated, and an artifact with no evidenced cost
   says so rather than omitting the question.

## 7 · Not in this increment

Migrating any artifact type to the composed path. That decision rests on the human
verdict against the six review questions, and this increment neither assumes nor
forecloses it. The deterministic renderer stays wired throughout.
