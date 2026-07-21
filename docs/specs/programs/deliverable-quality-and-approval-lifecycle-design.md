# Deliverable Quality & Approval Lifecycle — Design Doc (Workstreams A + C)

Status: **draft v3 — decision-complete; awaiting owner sign-off before any migration or code**
Author: Claude Code, 2026-07-20 (v2 incorporated reviewer decisions on the 4 open questions from v1;
v3 resolves all 3 remaining design decisions — MOVES-DESIGN-001/002/003 — with specific,
adoptable recommendations, per the standing Moves Continuous Execution Directive's instruction that
an owner-decision block is not a reason to leave decisions as open questionnaires)
Scope: Workstream A (artifact-quality contracts) and Workstream C (approval workflow lifecycle),
from the broader 7-workstream governance program (A–G). This revision incorporates explicit
reviewer decisions on all 4 open questions from v1, plus 10 additional structural directions:
event-sourced lifecycle (not a single mutable status column), a controlled reviewer-role model, an
explicit "upload as already-approved-final" exception path, per-artifact gate policy, intrinsic
AI-disclosure at the version level, and a full state-transition/backfill/rollback specification.
Nothing has been implemented — this is design only, per direction. **No migration or code will be
written until the owner explicitly approves §3.8 (MOVES-DESIGN-001), §3.7 (MOVES-DESIGN-002), and
§11 (MOVES-DESIGN-003) — or amends them.**

**Revised workstream order** (per reviewer): **A → C → B → D → E → F → G** — swapped from v1's
A→C→D→F→B→E→G. Rationale: (1) disclosure (B) should be correct from the moment versions are first
introduced, not retrofitted after D/E/F exist; (2) users need a governance workspace to understand
and remediate origin/version/approval/authority (E) *before* gates (F) start enforcing the new
lifecycle, or the system blocks advancement with no usable remediation surface.

## 0. Why this needs a design pass, not just a PR

This is a new schema decision (an event-sourced, version-scoped approval lifecycle) and a new
invariant (gates read an *authoritative* version, resolved live against current approval state — not
a legacy status column). Getting this wrong is expensive to unwind once Files/UI/gates depend on it.

## 1. What already exists (unchanged from v1, confirmed via fresh `origin/main` reads)

*(Full detail preserved from v1; summarized here since the reviewer did not dispute this section.)*

Three overlapping quality-contract systems exist today (`DeliverableSpec` in
`deliverable-registry.ts`; `QualityBar`/`ExpectedExhibit`/`DeliverableArtifactBrief` in
`orchestrator/types.ts`; `DeliverableProfile`/`DeliverableResultState` in `deliverables/quality/`).
Approval/lineage is partially built: `deliverables_v2.status` (`draft/in_review/signed_off/superseded`),
`current_version`, `signed_off_version`, `approved_artifact_id`; `deliverable_versions` (immutable,
one row per version, `structured_data` JSONB); `deliverable_role_approvals` (4-role gate-approval
axis: `business/technology/finance/risk_security`, currently **scoped only to `deliverable_id`, with
no `version` column at all** — see §3.2 for why this is a real, separate bug this design must fix).
`signOffDeliverable()` correctly advances the upload-replacement lineage forward; `completeDeliverable()`
(the Nexus-tool path) never writes `signed_off_version`/`approved_artifact_id` at all — a real
divergence. No `supersede()` function exists despite `'superseded'` being a ready schema value.

## 2. Workstream A: consolidated `ArtifactQualityContract`

**Naming decision (reviewer-directed): one canonical model, others become adapted/deprecated/compatibility-only.**

```
ArtifactDefinition
  └─ ArtifactQualityContract
       ├─ requiredOutline        (required outline)
       ├─ narrative               (narrative expectations)
       ├─ evidenceRequirements    (evidence requirements)
       ├─ requiredExhibits        (visual requirements)
       ├─ depthBand / qualityBar  (minimum depth)
       ├─ gateRelationship        (required approval roles + minimum lifecycle state — see §3.7)
```

| Existing system | Disposition |
|---|---|
| `DeliverableSpec` (`deliverable-registry.ts`) | **Canonical for**: artifact definition, outline, phase, audience. Extended with a typed `exhibits: ExpectedExhibit[]` field (today this is prose baked into `sections[]`/`generationPromptHint`). |
| `QualityBar` / `ExpectedExhibit` / `DeliverableArtifactBrief` (`orchestrator/types.ts`) | **Adapted into** `ArtifactQualityContract.qualityBar` / `.requiredExhibits` — these shapes are already close to right; they become the *canonical* quality/visual-requirement vocabulary, not a parallel one. |
| `DeliverableProfile` / `DeliverableResultState` (`deliverables/quality/`) | **Adapted into** the generation/evaluation *result* type — `DeliverableResultState`'s existing blocked-* reasons are specific and good; they stay, but are now computed by checking one contract, not two. This system becomes "the evaluator," not "a second contract." |
| `quality-bar-registry.ts` per-module overrides | **Deprecated**, folded into `ArtifactQualityContract.depthBand` + explicit per-field overrides on the canonical contract. |

```ts
// src/lib/programs/artifact-quality-contract.ts (new file)

export type ExhibitKind =
  | 'diagram' | 'matrix' | 'timeline'
  | 'conceptual_architecture' | 'logical_architecture' | 'physical_architecture'
  | 'agent_orchestration' | 'heatmap' | 'waterfall' | 'sensitivity_table'
  | 'raci' | 'process_flow' | 'decision_rights_matrix' | 'priority_matrix';

export interface RequiredExhibit {
  key: string;
  title: string;
  kind: ExhibitKind;
  requiredElements?: string[];
  legendRequired?: boolean;
  minimumFor: 'client_ready' | 'internal_draft';
}

export type LifecycleGateState = 'human_approved' | 'client_final'; // see §3
export type ReviewerRoleCode =
  | 'artifact_owner' | 'workstream_lead' | 'business_owner' | 'technology_owner'
  | 'architecture' | 'data' | 'security' | 'risk' | 'legal' | 'procurement'
  | 'finance' | 'executive_sponsor' | 'client_authority' | 'abarva_quality' | 'other';

export interface GateRelationship {
  minimumLifecycleState: LifecycleGateState;
  requiredReviewerRoles?: ReviewerRoleCode[]; // descriptive/required reviewer capacities beyond REQUIRED_APPROVAL_ROLES's 4-role axis
  requiresClientAuthority: boolean;           // must the authoritative version's designation trace to a real client_authority actor
}

export interface ArtifactQualityContract {
  deliverableTypeKey: string;   // MUST match deliverable-registry.ts's key (same lesson as the REQUIRED_APPROVAL_ROLES key-mismatch incident)
  audiencePrimary: string;
  decisionToSupport: string;
  requiredOutline: string[];
  depthBand: 'light' | 'standard' | 'deep';
  qualityBar: {
    minSections: number;
    minBodyWords: number;
    targetBodyWordsMax?: number;
    requiresCitations: boolean;
    requiresDecision: boolean;
    requiresRecommendation: boolean;
    requiresRiskTable: boolean;
    requiresSourceRegister: boolean;
    requiresCentralTension?: boolean;
    requiresOptionsConsidered?: boolean;
    requiresEvidenceGapsNoted?: boolean;
  };
  requiredExhibits: RequiredExhibit[];
  requiredNextActions: boolean;
  gateRelationship: GateRelationship;
  exportFormats: DeliverableFormat[];
}
```

Document-specific exhibit table (unchanged from v1, reproduced for completeness):

| Type | `requiredExhibits` (kind list) |
|---|---|
| Executive brief | `priority_matrix`, `decision_rights_matrix` |
| Current-state assessment (`discovery_report`) | `heatmap`, `matrix` (maturity), evidence table |
| Target-state architecture | `conceptual_architecture`, `logical_architecture`, `physical_architecture` |
| Operating model (`operating_model_design`) | `raci`, `process_flow`, `decision_rights_matrix` |
| Business case | `waterfall`, `sensitivity_table`, `matrix` (scenarios) |
| Roadmap (`execution_roadmap`) | `timeline`, `decision_rights_matrix` |
| Readiness review | `heatmap`, risk/decision tables |

## 3. Workstream C: event-sourced, version-scoped approval lifecycle

### 3.1 Core principle (reviewer-directed): state is a projection, not the record

The **event log is the source of truth**. `lifecycle_current_state` (one of the 6 states below) is
always *computed* from the latest relevant event for a given version — never written directly as an
independent mutable field. This is what makes "a revised document does not inherit approval,"
"approval revocation," and "supersession" all fall out of one mechanism instead of three.

**Current states** (6, per reviewer's tightened list — "Revised Draft" is not a 7th state; a revision
is simply a new immutable version starting its own lifecycle at `ai_draft`/uploaded-origin):

```
ai_draft → in_review → changes_requested
                      → human_approved → client_final
                                        → superseded (terminal, from either approved state)
```

**Event types** (append-only, immutable, one row per event):

```
version_created         -- origin: ai_generated | client_uploaded | abarva_uploaded | system_extract
submitted_for_review
review_assigned
comment_added
changes_requested
approval_granted        -- reviewer_role_code, decision, comments
approval_revoked        -- reason required
marked_authoritative     -- state: human_approved | client_final; may carry exception=true (see §3.4)
authority_replaced       -- fired on the OLD version when a newer version becomes authoritative
superseded               -- terminal; fired on the OLD version alongside authority_replaced
```

### 3.2 Two entities, not one — fixing a real, previously-undiscovered bug

**`deliverable_role_approvals`** (existing, REQUIRED_APPROVAL_ROLES gate axis — business/technology/
finance/risk_security) is **currently scoped only to `deliverable_id`, with no `version` column**.
This means today, once a `business_case` gets business+finance approval, that approval silently
counts as satisfied for **every future regeneration of that deliverable**, forever — the exact
"revised document must not inherit the prior version's approval" violation the reviewer named,
except it already exists in the shipped required-role-approval mechanism, undiscovered until this
design pass. **Fix**: add `version INT NOT NULL` to this table, change its unique constraint to
`(deliverable_id, role, version)`, and update `getRoleApprovalSummary()`/`meetsApprovalBar()` in
`governance.ts` to query for the deliverable's *current authoritative version specifically* — not
just any historical approval row.

**`deliverable_lifecycle_events`** (new) is the separate, richer, descriptive audit trail —
reviewer identity/organization/capacity, comments, revocation reasons, supersession lineage. It is
not a gate-approval mechanism itself; `governance.ts` never queries it directly for a pass/fail
decision. It feeds the Files-explorer timeline (Workstream E) and the projected `lifecycle_current_state`
that `getAuthoritativeVersion()` (§3.6) reads.

### 3.3 Reviewer role model (reviewer-directed: controlled code + optional label, not free text alone)

```sql
reviewer_role_code TEXT NOT NULL CHECK (reviewer_role_code IN (
  'artifact_owner','workstream_lead','business_owner','technology_owner',
  'architecture','data','security','risk','legal','compliance','procurement',
  'finance','executive_sponsor','client_authority','abarva_quality','other'
)),
reviewer_role_label TEXT,   -- REQUIRED when reviewer_role_code = 'other'; optional descriptive context otherwise
reviewer_name TEXT NOT NULL,
reviewer_organization TEXT, -- e.g. 'AbarVa' vs the client's org name — distinguishes internal vs client reviewers without a separate boolean
approval_scope TEXT,        -- free descriptive text: what, specifically, this reviewer's decision covers (e.g. "financial model assumptions only")
```

This is distinct from `deliverable_role_approvals.role` (the 4-value REQUIRED_APPROVAL_ROLES enum,
unchanged) — `reviewer_role_code` is the descriptive capacity an individual event's actor held;
`deliverable_role_approvals.role` is which of the 4 gate-required categories that event counts toward
(a `technology_owner` or `architecture` reviewer, for instance, both plausibly satisfy the
`technology` required role — the mapping between the 15-value descriptive code and the 4-value gate
role is a lookup table, not a 1:1 rename, specified in §3.8).

### 3.4 The upload-as-already-approved-final exception (reviewer-directed)

Normal path for any client upload:

```
Client Uploaded → In Review → Human Approved → Client Final / Authoritative
```

A client upload **cannot** jump directly to `client_final` through the normal path. The **only**
way to reach `client_final` immediately on upload is a distinct, explicit action —
`uploadApprovedFinalReplacement()` — requiring ALL of:

- named uploader (`ctx.userId`/`ctx.email`, captured automatically)
- named approving authority (`reviewer_name`, `reviewer_role_code = 'client_authority'`, required)
- approval date (`decided_at`, required, may be back-dated to when the client actually approved it, distinct from `created_at`)
- approval basis or reference (`approval_scope` or a dedicated `approval_basis_reference` field — e.g. "Approved via client email dated 2026-07-18," or a link/evidence id)
- explicit confirmation flag: `confirmedAuthoritative: true` (a checkbox in the eventual UI; the API rejects the call without it)
- source file checksum (already computed during upload/parse, same as today's upload path)

This writes two events in one transaction: `version_created(origin='client_uploaded')` then
`marked_authoritative(state='client_final', exception=true, exception_basis=<approval basis>)` —
explicitly skipping `in_review`/`human_approved`. The `exception=true` flag on the event (and a
mirrored `authoritative_flag_source = 'upload_as_approved_final_exception'` on the deliverable's
pointer, see §3.5) makes this fast-path always visibly distinguishable from the normal, reviewed
path — in the UI, in audit exports, and in any future compliance review.

### 3.5 Keeping `human_approved` and `client_final` distinct (reviewer-directed)

`deliverables_v2.status` (existing enum: `draft/in_review/signed_off/superseded`) is kept, unchanged,
as a **compatibility projection only** — not the source of authority truth. It is derived (both
`human_approved` and `client_final` project to `signed_off`) so every existing hard-gate check,
20+ tests, and this session's own Phase Advancement Control work keeps working unmodified.

The *real* authority truth lives on the deliverable's pointer, extended with two new columns:

```sql
ALTER TABLE deliverables_v2
  ADD COLUMN authoritative_lifecycle_state TEXT CHECK (authoritative_lifecycle_state IN ('human_approved','client_final')),
  ADD COLUMN authoritative_flag_source TEXT CHECK (authoritative_flag_source IN (
    'normal_flow', 'upload_as_approved_final_exception', 'legacy_backfill'
  ));
-- signed_off_version / approved_artifact_id (existing) continue to point at the authoritative version.
```

Example (matches the reviewer's illustration exactly):

```
deliverables_v2.status = signed_off
authoritative_lifecycle_state = human_approved
authoritative_flag_source = normal_flow
```
```
deliverables_v2.status = signed_off
authoritative_lifecycle_state = client_final
authoritative_flag_source = normal_flow
```

**Gate evaluation queries `authoritative_lifecycle_state` (validated live against the event log per
§3.6), never infers authority from `status` alone.**

### 3.6 Authoritative-version resolution — validated live, not trusted from a stale pointer

```ts
async function getAuthoritativeVersion(deliverableId: string): Promise<{
  version: number;
  lifecycleCurrentState: LifecycleGateState; // recomputed from the event log, not read from the pointer
  authoritativeFlagSource: string;
  checksum: string | null;
} | null> {
  // 1. Read deliverables_v2's pointer (signed_off_version, authoritative_lifecycle_state).
  // 2. Recompute that SPECIFIC version's current projected state from deliverable_lifecycle_events
  //    (latest approval_granted/approval_revoked/marked_authoritative/superseded event for that version).
  // 3. If the live-projected state no longer matches the pointer (e.g. an approval was revoked
  //    after the pointer was set, or a newer version has since superseded it), the pointer is
  //    stale — return null (or the newer authoritative version, if superseded in favor of one).
  //    Gates must never trust a cached pointer over the live event log.
}
```

This directly closes the exact defect class this session's Phase Advancement Control and Phase
Capture Evidence Integrity programs fixed: a gate must see a REAL, currently-valid human decision
behind the evidence it reads, not a status column that could have gone stale.

### 3.7 Gate policy is per-artifact, not global — MOVES-DESIGN-002, FINAL

**Status: resolved, recommended for adoption.** This closes MOVES-DESIGN-002. All 16 governed Moves
artifact types are covered — the 15 `DELIVERABLE_REGISTRY` entries plus `origination_brief` (the P0
gate artifact, created by the origination flow rather than the registry, but real, governed gate
evidence per `governance.ts`'s `hasSignedOriginationBrief` check). No row is left open.

**Governing distinction (per reviewer direction):** working/analytical artifacts (assessments,
findings, workshop/working outputs, technical analysis, option evaluation, readiness analysis)
normally require only `human_approved`. Client decision artifacts (charter, target-state decision,
approved operating model, finance-approved business case, roadmap commitment, mobilization
authorization) normally require `client_final`. Applied below per type, not assumed uniformly — a
few artifacts are genuinely working documents even though they sit in a phase whose headline
decision is client-facing (e.g. `root_cause_worksheet` is explicitly "not for executive
distribution" per its own `documentPurpose`).

`ArtifactQualityContract.gateRelationship` (§2) carries one row of this table per type:

| `deliverableTypeKey` | Phase | Purpose (from registry) | Required outline (condensed) | Required evidence | Required exhibits / visual forms | Min. depth | Min. lifecycle state | Required reviewer roles | Client authority required? | Authoritative version required? | Min. quality threshold | Gate criterion satisfied (governance.ts) | Legacy inferred approval accepted? | `requires_revalidation` blocks advancement? |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `origination_brief` | 0 | Sponsor-attested seed brief — the origination commitment instrument | Problem statement, sponsor candidate, value hypothesis, evidence family, recommendation to advance | Sponsor's own attestation (this is the one type where the sponsor's approval genuinely *is* the content's authorship+approval act — see `closeP0OnApproval`, judged legitimate this session, not a fabrication) | None required | Light | `human_approved` | — | false | Yes | Standard | `hasSignedOriginationBrief` | Yes, as `human_approved` (never `client_final` — P0 has no client-final concept) | Yes |
| `charter` | 1 | Commitment instrument — scope, value hypothesis, governance, kill criterion | Exec summary, sponsor commitment, stakeholder map, success metrics, scope boundary, governance model, kill criterion | Named sponsor with documented commitment; preliminary value range with labeled assumptions | Priority/decision matrix (recommendation exhibit); stakeholder map view | Standard | **`client_final`** *(recommended — see note)* | — | **true** | Yes | Deep (`requiresCentralTension`, `requiresOptionsConsidered`) | `charterRow` signed off | Yes, `human_approved` only (never silently upgraded to `client_final`) | Yes |
| `discovery_report` | 2 | Evidence base — current state, root causes, gate recommendation | Current-state baseline, root cause analysis, data/AI readiness, stakeholder findings, continuation verdict | Quantified metrics with source citations; 3-5 ranked root causes with confidence | Heatmap/maturity view; issue-theme table; evidence/source register | Standard | `human_approved` | — | false | Yes | Standard | `discoveryReportRow` signed off | Yes | Yes |
| `root_cause_worksheet` | 2 | Working document — causal decomposition for team alignment, explicitly not for executive distribution | Problem statement, causal chain decomposition, evidence map, root cause ranking, design implications | Each root cause linked to a specific evidence reference | Causal chain/Ishikawa diagram; impact×confidence×addressability matrix | Light (working doc) | `human_approved` | — | false | No — supports `discovery_report`'s gate, is not itself a gate blocker (`gateArtifact: false`) | Light | Not independently gate-checked — feeds `discovery_report` | Yes | No (non-gate working doc) |
| `target_state_architecture` | 3 | Architecture decision record — conceptual to physical stack, technical leadership sign-off | Conceptual/logical/physical architecture, patterns applied, ADRs, integration contracts | ADRs must show rejected alternatives; every integration explicitly specified | **Conceptual, logical, and physical architecture diagrams** (all three required, per `ExpectedExhibit` kinds) + integration contract table | Deep (`requiresCentralTension`, `requiresOptionsConsidered`, `requiresEvidenceGapsNoted`) | `human_approved` | **`architecture`** (specifically, not just any `technology_owner` — see §3.8) | false | Yes | Deep | `designRow` (alias group incl. `design_spec`/`design`/`design_brief`/`solution_design`/`operating_model_design`/`target_state_architecture`) signed off | Yes | Yes |
| `solution_design` | 3 | Delivery-facing spec — configuration/build requirements, traceable to root causes | Solution scope, functional/non-functional requirements, configuration specs, AI/agent design, acceptance criteria | Every requirement numbered and traced to a P2 root cause | Requirements traceability matrix | Standard | `human_approved` | `technology_owner` | false | Yes, as an alternate satisfier of the `design_approved` gate (§3.8) | Standard | Alias of `designRow` group | Yes | Yes |
| `operating_model_design` | 3 | How the org runs with the new capability — roles, governance, Today vs. Tomorrow | Today vs. Tomorrow comparison, new role definitions, handoff map, governance design, change impact, capability gap | Named roles, not generic; per-stakeholder change impact | RACI / decision-rights matrix; process-flow diagram; governance-forum structure | Standard | `human_approved` | `business_owner` **and** `technology_owner` (per existing `REQUIRED_APPROVAL_ROLES`) | false | Yes, as an alternate satisfier of `design_approved` (§3.8) | Standard | Alias of `designRow` group; separately gated by `meetsApprovalBar`'s role-approval check | Yes | Yes |
| `sourcing_strategy` | 3 | Build/buy/configure/partner decisions with vendor shortlist | Sourcing decision summary, vendor evaluation, make-vs-buy, partnership model, commercial risk register, procurement pathway | Vendor score matrix with rationale; commercial risk register | Vendor evaluation matrix; commercial risk register table | Standard | `human_approved` | `procurement` (satisfies `business`) **and** `legal` (satisfies `risk_security` for IP/partnership terms) | **true** for the commercial/partnership terms specifically | Yes | Standard | Not yet an independently-named `governance.ts` check — recommended addition: a `sourcingStrategyRow` alias group, currently unchecked (see Known Gaps) | Yes | Yes |
| `p3_design` *(deprecated)* | 3 | Legacy combined P3 doc | — | — | — | — | N/A — `gateArtifact: false`; excluded from gate evaluation entirely | — | false | No | N/A | Not a gate check today (correctly) | Recommend: existing historical rows stay readable/exportable; no new generation | N/A |
| `execution_roadmap` | 4 | Execution plan — workstreams, milestones, critical path, resource model | Workstream breakdown, phased timeline, resource model, critical path analysis, change mgmt timeline, governance cadence | Named leads per workstream | Timeline/Gantt-style workstream diagram with dependencies; decision-gate markers | Standard | **`client_final`** *(recommended — this is a delivery commitment, not just an analysis)* | — | **true** | Yes | Standard | `executionRoadmapRow` signed off | Yes, `human_approved` only | Yes |
| `business_case` | 4 | Investment decision document — value thesis, cost structure, financial returns | Exec summary, value architecture, investment summary, financial returns, scenario analysis, investment risks, funding ask | Every benefit lever traced to a P2 root cause | Waterfall (value bridge); scenario comparison table; sensitivity view (in companion `financial_model`) | Deep (`requiresCentralTension`) | **`client_final`** | `business_owner` **and** `finance` (existing `REQUIRED_APPROVAL_ROLES`) | **true** | Yes | Deep | `businessCaseRow` + `meetsApprovalBar` role check | Yes, `human_approved` only — a `business_case` inferred only from `signed_off_version` must not be treated as `client_final` even if legacy `status` reads `signed_off` | **Yes — blocks `client_final` specifically; a `requires_revalidation` business_case cannot fund a phase advance** |
| `financial_model` | 4 | Interactive financial model — client-editable assumptions, recalculated NPV/IRR | Assumptions, benefit levers, implementation costs, value model, scenarios (Excel sheets) | Every lever traced to root cause; realistic, grounded numbers | Sensitivity/scenario table (native to the Excel workbook, not a rendered exhibit) | Standard | `human_approved` | `finance` | false | Yes, as `business_case`'s supporting workbook — not independently gate-checked | Standard | Not independently gate-checked — supports `business_case` | Yes | No (non-gate companion; `gateArtifact: false`) |
| `tower_metrics_plan` | 4 | What Tower measures post-handoff — KPIs, methodology, owners, cadence | Measurement philosophy, KPI definitions, ownership matrix, reporting design, baseline plan, measurement risk | Named accountable + reporting + data owner per KPI | Ownership matrix; reporting-cadence/dashboard structure diagram | Standard | `human_approved` | — | false | Yes | Standard | Not yet an independently-named `governance.ts` check — recommended addition (see Known Gaps) | Yes | Yes |
| `roadmap` *(deprecated)* | 4 | Legacy combined P4 doc | — | — | — | — | N/A — `gateArtifact: false`; excluded from gate evaluation entirely | — | false | No | N/A | Not a gate check today (correctly) | Recommend: existing historical rows stay readable/exportable; no new generation | N/A |
| `handoff_package` | 5 | Mobilization package — everything delivery needs without returning to the program team | Delivery RACI, open decisions register, risk handoff register, artifact inventory, operating procedure summary | Named accountable owner per workstream; complete P1-P4 artifact inventory with status | RACI table; risk-handoff register; artifact-inventory status table | Standard | **`client_final`** | `executive_sponsor` | **true** | Yes | Standard | `handoffPackageRow` signed off | Yes, `human_approved` only | Yes |
| `value_measurement_contract` | 5 | Formal accountability document — committed outcomes, measurement, accountability | Committed outcomes, measurement methodology, accountability table, review cadence, revision conditions | Single named accountable individual per outcome — never "team" accountability | Accountability table; committed-outcomes summary with baseline/target/timeline | Standard | **`client_final`** | `executive_sponsor` | **true** | Yes | Standard | `valueMeasurementContractRow` signed off | Yes, `human_approved` only | Yes |

**Where product intent is genuinely ambiguous — recommended policy, alternative, risk, preferred choice:**

1. **`charter`'s minimum lifecycle state.** *Recommended*: `client_final` (a charter is fundamentally
   a sponsor commitment instrument the client organization is agreeing to, not an internal analysis).
   *Alternative*: `human_approved` only, treating P0→P1 as internally-driven and deferring true
   client commitment to later artifacts. *Risk of the alternative*: a program could advance past P1
   without any client-side confirmation that the charter's scope/kill-criterion is actually agreed,
   which is the same "advanced without real evidence" failure class this whole program exists to
   prevent, just moved one phase later. *Preferred*: `client_final`.
2. **`execution_roadmap`'s minimum lifecycle state.** *Recommended*: `client_final` (the roadmap
   commits delivery timeline and resourcing the client organization must staff against).
   *Alternative*: `human_approved`, treating the roadmap as an internal delivery-planning artifact
   the program team owns. *Risk of the alternative*: a delivery timeline could become the
   operative plan without the client's resourcing commitment ever being confirmed. *Preferred*:
   `client_final`.
3. **`sourcing_strategy`'s and `tower_metrics_plan`'s governance.ts checks.** Both types currently
   have **no independently-named hard-gate check** in `governance.ts` — they satisfy `gateArtifact:
   true` in the registry but nothing in the current gate-evaluation code specifically requires them
   the way `charterRow`/`discoveryReportRow`/`designRow`/etc. do. *Recommended*: add
   `sourcingStrategyRow`/`towerMetricsPlanRow` hard checks to `governance.ts` as part of Workstream F
   (gate integration), not deferred indefinitely — flagged as a **Known Gap**, not silently accepted.
   *Alternative*: leave them soft/advisory only. *Risk*: a P3→P4 or P4→P5 advance could proceed
   without a real sourcing decision or a real measurement plan ever being reviewed, which is exactly
   the evidence-integrity gap this program exists to close. *Preferred*: add the hard checks.
4. **`requires_revalidation`'s enforcement strength.** Per reviewer direction, this is a **hard
   block** for gate-critical (client_final-requiring) artifacts, not a warning — a
   `requires_revalidation = true` version can never satisfy a `client_final`-requiring gate until a
   named reviewer re-confirms it, full stop. For `human_approved`-only artifacts, the same hard-block
   rule applies identically — the reviewer's direction ("do not use a warning-only rule for
   gate-critical artifacts") is read here as applying to every gate-checked type in this table, not
   only the `client_final` subset, since a `human_approved`-only artifact can still be the deciding
   evidence for a phase advance.

`evaluateGate()` (Workstream F, not built in this pass) checks, per gate-artifact deliverable: (a)
`getAuthoritativeVersion()` resolves to a non-null version whose `lifecycleCurrentState` meets or
exceeds `minimumLifecycleState`, AND that version's `requires_revalidation` is not `true`; (b) if
`requiresClientAuthority`, the resolved version's `authoritative_flag_source` traces to a
`client_authority`-role event, not merely `normal_flow` with an internal reviewer; (c) the
version-scoped `deliverable_role_approvals` (§3.2) independently confirms `allRequiredApproved` for
the REQUIRED_APPROVAL_ROLES 4-axis, unaffected by this table.

### 3.8 Reviewer-role-code → REQUIRED_APPROVAL_ROLES mapping — MOVES-DESIGN-001, FINAL

**Status: resolved, recommended for adoption.** This closes MOVES-DESIGN-001. The table below is the
complete, non-partial mapping — every one of the 16 `reviewer_role_code` values is accounted for,
with no open cells.

**Governing principles (apply to every row):**
1. **One person, one approval scope per event.** A person may hold multiple organizational
   capacities over time (e.g., someone who is both a `technology_owner` and, on a different
   artifact, an `architecture` reviewer), but a single `approval_granted` event names exactly one
   `reviewer_role_code`. An approval event is never recorded as satisfying two roles at once.
2. **Separation of duties is enforced at the write path, not left to policy alone.** When an
   artifact's `ArtifactQualityContract.requiredReviewerRoles` names two or more of the 4 gate roles
   (e.g. `business_case` needs both `business` and `finance`), the same `reviewer_name`/identity
   cannot record both required roles' approvals for the same version. `recordRoleApprovalDecision()`
   must reject a second required role's approval from an identity that already holds another
   required role's approval on that version, returning a clear `separation_of_duties_violation`
   error rather than silently allowing it.
3. **Self-approval by the author is never permitted for any gate-required role**, regardless of
   which role. If the reviewer identity recorded as the version's author (via
   `deliverable_lifecycle_events.version_created`'s actor) is the same identity attempting
   `approval_granted` on that version, the write is rejected. This is distinct from — and does not
   change — the existing, separate `governance.ts` concept of "self-approve the gate" (a founder/
   admin approving a phase-advance request without a separate approval-request round-trip): that
   mechanism governs *phase* self-approval capability, not *content-authorship* self-approval, and
   both restrictions apply independently and simultaneously.

| `reviewer_role_code` | Gate-role mapping | Direct / contextual | May one reviewer satisfy multiple gate roles? | Self-approval permitted? | Internal / client / either | Artifact types using this role | Separation-of-duties conflicts |
|---|---|---|---|---|---|---|---|
| `business_owner` | `business` | Direct | No — a `business_owner` approval satisfies only `business`; a second required role on the same artifact (e.g. `finance`) needs a distinct identity | Permitted if approving stakeholder work they did not author; never permitted for their own drafted content | Either | `business_case`, `operating_model_design`, `sourcing_strategy` (business dimension), `charter` (business/sponsor readiness) | Cannot also record the `finance` approval on `business_case`, or the `technology`/`architecture` approval on `operating_model_design` |
| `technology_owner` | `technology` | Direct | No | Same rule as above | Either (client-side technology leadership counts) | `target_state_architecture` (if no more specific `architecture` reviewer recorded), `solution_design`, `operating_model_design` (technology dimension) | Cannot also record `business` on the same `operating_model_design` version |
| `architecture` | `technology` | **Contextual** — maps to the generic `technology` gate role by default, but `ArtifactQualityContract.gateRelationship.requiredReviewerRoles` may require `architecture` *specifically* (not merely any `technology`-mapped code) for architecture-sensitive types. `target_state_architecture` is the one type in this registry that requires it specifically (see §MOVES-DESIGN-002) | No | Same rule as above | Either, but for `requiresClientAuthority` types the client-side architecture lead must be the one recorded | `target_state_architecture` (specifically required), `solution_design`, `operating_model_design` (as an alternate technology-role satisfier) | Cannot also record `finance` on a co-required artifact; if both `architecture`-specific and generic-`technology_owner` approvals exist for the same version, the more specific `architecture` approval is authoritative for gate policies that name it specifically |
| `data` | `technology`, **unless an artifact policy explicitly requires it separately** | Contextual | No | Same rule as above | Either | Any artifact whose evidence/exhibit relies materially on data-domain review (none in this registry require it as a distinct required role today; available for future artifact types, e.g. a dedicated data-governance sign-off) | Same as `technology_owner` |
| `finance` | `finance` | Direct | No | Permitted if approving work they did not author; never for their own drafted content | Either | `business_case`, `financial_model` | Cannot also record `business` on `business_case` — this is the canonical separation-of-duties pair `REQUIRED_APPROVAL_ROLES` already encodes for that type |
| `risk` | `risk_security` | Direct | No | Same rule as above | Either | `target_state_architecture` (risk_security dimension), any artifact carrying a materialized risk register | Cannot also record `business`/`technology`/`finance` on the same version if that would leave only one distinct approving identity across all required roles |
| `security` | `risk_security` | Direct | No | Same rule as above | Either | `target_state_architecture`, `sourcing_strategy` (commercial/data-sovereignty risk) | Same as `risk` |
| `legal` | `risk_security` | Direct | No | Same rule as above | Either, but for `client_final` artifacts with legal exposure (e.g. `sourcing_strategy`'s partnership/IP terms) client-side legal counts as authoritative | `sourcing_strategy` | Same as `risk` |
| `compliance` | `risk_security` | Direct | No | Same rule as above | Either | Any artifact with a regulated-industry compliance dimension (available for future artifact types; none in this registry name it as a distinct required role today) | Same as `risk` |
| `procurement` | `business` **for sourcing artifacts**; otherwise requires an **additional artifact-specific approval** (does not default to any of the 4 gate roles outside sourcing context) | Contextual | No | Same rule as above | Either | `sourcing_strategy` (satisfies `business`); elsewhere, procurement sign-off is recorded as a descriptive event only and does not satisfy any of the 4 gate roles | Cannot double as the `technology`/`risk_security` approver on `sourcing_strategy` |
| `executive_sponsor` | `business` **authority**, but explicitly **not a substitute for `finance` or `risk_security`** approval where those are separately required | Contextual | An executive-sponsor approval can satisfy `business` but never simultaneously stands in for a co-required `finance`/`risk_security` role | Permitted (an executive sponsor approving is expected, not a conflict, since they are not typically the artifact's author); never permitted if they personally authored the content | Either | `charter` (sponsor commitment), `handoff_package`/mobilization-tier artifacts requiring executive authorization | Cannot also be recorded as the `finance` approver on `business_case` even if also holding financial authority — a distinct finance-role identity is required |
| `client_authority` | **No direct gate-role mapping** — this is an authority-level designation, not one of the 4 `REQUIRED_APPROVAL_ROLES` axes. It feeds `authoritative_flag_source`/`requiresClientAuthority` (§3.5, §3.7) directly | Contextual (governs `client_final` eligibility, not the 4-role axis) | N/A — orthogonal to the 4-role axis; a `client_authority` event can co-occur with any of the above without conflict | Not applicable in the self-authorship sense (a client authority is by definition not the platform's content author); still cannot be the same identity as the uploader when using the §3.4 exception path without also being the confirmed approving authority named in that exception | Client only, by definition | Any artifact whose `gateRelationship.requiresClientAuthority = true` (`charter`, `sourcing_strategy` commercial terms, `handoff_package`/mobilization authorization — see §MOVES-DESIGN-002) | None on the 4-role axis (orthogonal); still cannot be the uploader's own unverified self-designation — the exception path (§3.4) requires this to be a *named, distinct* approving authority, not the uploader asserting their own authority |
| `abarva_quality` | **No gate-role mapping — quality review only; never satisfies client gate approval or any of the 4 required roles** | Direct (as a non-mapping) | N/A | Permitted for internal QA review of content the reviewer did not author; irrelevant to self-authorship rule since this role can never satisfy a gate by itself | Internal only | Any artifact, as a pre-review quality pass (feeds Workstream G's document-quality validation, §3.7/§9) — never itself gate-satisfying evidence | Cannot be used to "launder" a missing `business`/`technology`/`finance`/`risk_security` approval — an `abarva_quality` event alone never advances `lifecycle_current_state` past `in_review` |
| `artifact_owner` | **No gate-role mapping — workflow role** | Direct (as a non-mapping) | N/A | **This is exactly the role the self-approval prohibition targets** — the artifact owner accountable for producing the content must not also be its sole approver | Internal only | Every artifact type (every deliverable has an accountable owner) | The artifact owner acting as the *only* recorded approval for a required role is itself a separation-of-duties violation, even if the role mapping would otherwise permit it — this is enforced via the authorship check in the governing principles above, not a separate rule |
| `workstream_lead` | **No gate-role mapping — workflow role** | Direct (as a non-mapping) | N/A | Same as `artifact_owner` | Internal only | Every artifact type, as the workstream-level coordination role | Same as `artifact_owner` |
| `other` | **No automatic gate-role mapping without an explicit, documented policy exception** | Contextual (requires a named policy addition, not a silent default) | N/A until a policy exception is written | Same rule as above | Either, per the policy exception | None by default | Any use of `other` to satisfy a required role must cite the specific policy exception that authorized it, in `approval_scope` |

**Recommended decision**: adopt this table as written, including adding `compliance` as a 16th
`reviewer_role_code` enum value (not present in the v2 draft's 15-value list) to give regulated-
industry compliance reviewers a distinct, correctly-`risk_security`-mapped identity rather than
overloading `legal` or `risk` for it.

**Consequences of adopting this table:**
- The two workflow roles (`artifact_owner`, `workstream_lead`) can never, by themselves, satisfy a
  gate — this is a deliberate, load-bearing consequence: it closes the exact "the same person who
  drafted the deliverable also signs off on it" pattern that this whole design program exists to
  prevent, structurally, rather than by policy reminder alone.
- `client_authority` and `executive_sponsor` are explicitly **not** interchangeable with the 4-role
  axis — a `client_final` artifact still independently needs its `REQUIRED_APPROVAL_ROLES` satisfied
  (e.g. `business_case` still needs both `business` and `finance` approvals even once `client_final`
  is reached); reaching `client_final` state and satisfying the 4-role axis are two separate,
  simultaneously-required conditions, not one substituting for the other.
- `procurement` and `data`/`compliance` are intentionally under-mapped today (no artifact in the
  current registry names them as a distinct required role) — this is correct and forward-compatible,
  not an oversight: it means adding a new artifact type that DOES require, say, a distinct
  `compliance` sign-off is a one-line addition to that type's `gateRelationship.requiredReviewerRoles`,
  not a schema change.
- `recordRoleApprovalDecision()` and the version_created-authorship check both need new validation
  logic (separation-of-duties rejection, self-authorship rejection) — this is new code, scoped into
  Phase 1 alongside the schema migration, not deferred.

### 3.9 Revocation behavior

`approval_revoked` is a **new event**, never a deletion or in-place update of the prior
`approval_granted` event (both remain in the immutable log). Effects:

- The version's projected `lifecycle_current_state` reverts to `in_review` (the latest event now
  wins in the projection — an `approval_revoked` event ranks above the earlier `approval_granted`
  it revokes).
- If the revoked approval's role mapped to a `deliverable_role_approvals` row (§3.8), that row's
  `status` is updated to `rejected` (this table remains "current state per role per version," not
  append-only — it always reflects the latest decision for that exact version).
- If the revoked version was the deliverable's current authoritative pointer,
  `authoritative_lifecycle_state`/`signed_off_version` are cleared (the deliverable has **no**
  authoritative version until a new decision is recorded) — the gate must fail closed, never fall
  back to a stale pointer.
- Revocation is only valid on a version that is not already `superseded` (a superseded version's
  history is frozen — see §3.10's invalid-transition list).

### 3.10 State-transition table

| From | Event | To | Notes |
|---|---|---|---|
| (none) | `version_created(origin=ai_generated)` | `ai_draft` | Initial state for AI-generated versions only. |
| (none) | `version_created(origin∈{client_uploaded,abarva_uploaded,system_extract})` | `in_review` | An uploaded/extracted version is never `ai_draft` — it did not come from the platform's own generation. |
| `ai_draft` | `submitted_for_review` | `in_review` | |
| `in_review` | `changes_requested` | `changes_requested` | Terminal for this version — see below. |
| `in_review` | `approval_granted` | `human_approved` | |
| `human_approved` | `marked_authoritative(client_final)` | `client_final` | Normal path only; requires a prior `human_approved` event on the same version. |
| (none, client-uploaded only) | `version_created` + `marked_authoritative(client_final, exception=true)` | `client_final` | The §3.4 exception path — the ONLY way to reach `client_final` without an intervening `human_approved` event, and only for `origin=client_uploaded`. |
| `human_approved` or `client_final` | `approval_revoked` | `in_review` | See §3.9. |
| `human_approved` or `client_final` (was the authoritative pointer) | `authority_replaced` + `superseded` | `superseded` | Fired on the OLD version when a NEWER version becomes authoritative (§3.11). Terminal. |

**Invalid transitions (must be explicitly rejected, not silently allowed):**

- `ai_draft → client_final` directly (must pass through `in_review`/`human_approved`, or use the
  upload-exception path — which is unavailable to `ai_generated` origin by definition).
- `changes_requested → human_approved` or `→ client_final` on the **same version** (a version that
  had changes requested cannot later be approved as-is; a NEW version must be created and starts its
  own lifecycle at `ai_draft`/`in_review`).
- `superseded → ` anything (terminal; a superseded version cannot be revived — reusing its content
  requires creating a new version, not reactivating the old one).
- Any state `→ ai_draft` (a version can never regress to `ai_draft`; it is an entry state only).
- Approval of version N implicitly carrying to version N+1 (not a transition per se, but an explicit
  rule: creating a new version never copies a `human_approved`/`client_final` event forward).

### 3.11 Supersession

When a version's lifecycle event stream causes it to become the NEW authoritative version (i.e. a
`marked_authoritative` event whose resulting state meets the deliverable's current pointer
requirements), and a DIFFERENT version currently holds the authoritative pointer:

1. The OLD version gets an `authority_replaced` event, immediately followed by a `superseded` event
   (both fired in the same transaction as the new version's `marked_authoritative` event).
2. The OLD version's own approval events remain in its history, untouched — "prior approvals remain
   historically valid for their old version; they do not transfer."
3. `deliverables_v2`'s pointer (`signed_off_version`, `approved_artifact_id`,
   `authoritative_lifecycle_state`, `authoritative_flag_source`) moves to the NEW version.
4. Gate evaluation (§3.6/§3.7) only ever considers the CURRENT pointer's live-validated version —
   never a superseded one, even if it happens to still show `human_approved`/`client_final` in its
   own frozen history.

### 3.12 Legacy backfill (reviewer-directed: conservative, visibly inferred, never upgraded silently)

For every existing `deliverables_v2` row with `status = 'signed_off'`:

```
version = signed_off_version ?? current_version

IF approved_artifact_id IS NOT NULL:
  -- A real uploaded replacement is provable.
  backfill: version_created(origin='client_uploaded', backfill=true)
            marked_authoritative(state='human_approved', exception=false)
  deliverables_v2.authoritative_lifecycle_state = 'human_approved'   -- NEVER client_final, even here
  deliverables_v2.authoritative_flag_source = 'legacy_backfill'
  is_current_authoritative = true
  confidence = 'inferred'

ELSE (only signed_off_version, no approved_artifact_id proof):
  backfill: version_created(origin='ai_generated', backfill=true)
            marked_authoritative(state='human_approved', exception=false)
  deliverables_v2.authoritative_lifecycle_state = 'human_approved'
  deliverables_v2.authoritative_flag_source = 'legacy_backfill'
  is_current_authoritative = true          -- still usable for continuity/non-strict reads
  requires_revalidation = true             -- NEW flag: any gate policy requiring client_final
                                            --   (or a future "strict mode") must NOT accept this
                                            --   version until a real reviewer re-confirms it
  confidence = 'inferred'
```

**Never infer `client_final`** for any backfilled row, under any condition — only forward-looking,
explicit `marked_authoritative(client_final)` events (normal path or the exception path) can produce
`client_final`. The UI (Workstream E) must render backfilled rows with a visible marker: *"Legacy
approval imported — reviewer identity or approval basis may be incomplete."* No silent upgrading.

### 3.13 AI-disclosure is intrinsic to the version (reviewer-directed, feeds Workstream B)

`deliverable_versions` gets one new, immutable, denormalized column:

```sql
ALTER TABLE deliverable_versions ADD COLUMN origin TEXT NOT NULL DEFAULT 'ai_generated'
  CHECK (origin IN ('ai_generated','client_uploaded','abarva_uploaded','system_extract'));
```

Written once at version creation (mirrors the same `origin` recorded on the `version_created`
lifecycle event — denormalized here so every consumer that reads a version's content can render
correct disclosure without a second query against the event log). Every surface that displays or
exports this version — DOCX cover/footer, HTML preview, the artifact workspace, Files, metadata
exports — reads this single field, replacing today's hardcoded, un-conditional renderer string
(PR #5092) with disclosure text that is actually correct for uploaded/extracted content, not just
AI-generated content. (Workstream B implements the actual rendering changes; this design only
specifies the field they read.)

### 3.14 Convergence — how every existing write path lands in the new model

| Existing function | Change required |
|---|---|
| `completeDeliverable()` (Nexus-tool path) | Writes `version_created(origin='ai_generated')`; if `signOff !== false`, also writes `approval_granted` (reviewer = the invoking authorized user, `reviewer_role_code` derived from `ctx.role`) and updates `authoritative_lifecycle_state='human_approved'`/`signed_off_version`/`approved_artifact_id` — **closing the lineage-pointer gap found in §1** where this path currently writes neither. |
| `signOffDeliverable()`, plain JSON body (approve AI draft as-is) | Writes `approval_granted` → projects to `human_approved`. Never reaches `client_final` through this path. |
| `signOffDeliverable()`, file-upload replacement | Writes `version_created(origin='client_uploaded')` + `submitted_for_review`, then (same call, preserving today's single-request UX) `approval_granted` → `human_approved`. Reaching `client_final` still requires either a further explicit action or the exception path — never automatic on upload. |
| **New** `uploadApprovedFinalReplacement()` | The §3.4 exception path. |
| **New** `supersedeDeliverableVersion()` | Called automatically by any of the above when a new version becomes authoritative and an older version currently holds the pointer (§3.11). |
| Files (Workstream E, not built here) | Reads `deliverable_versions.origin`, the live-projected `lifecycle_current_state` per version, and the deliverable's pointer fields to render the lineage tree. Read-only consumer of this design. |
| `evaluateGate()` (Workstream F, not built here) | Calls `getAuthoritativeVersion()` (§3.6) and checks it against `ArtifactQualityContract.gateRelationship` (§3.7) plus the version-scoped `deliverable_role_approvals` (§3.2/§3.8), instead of today's `status === 'signed_off'` string check. |

## 4. Full schema (additive only; no destructive change to any existing column)

```sql
-- Extend deliverables_v2 (existing table)
ALTER TABLE deliverables_v2
  ADD COLUMN authoritative_lifecycle_state TEXT CHECK (authoritative_lifecycle_state IN ('human_approved','client_final')),
  ADD COLUMN authoritative_flag_source TEXT CHECK (authoritative_flag_source IN (
    'normal_flow', 'upload_as_approved_final_exception', 'legacy_backfill'
  )),
  ADD COLUMN requires_revalidation BOOLEAN NOT NULL DEFAULT false;

-- Extend deliverable_versions (existing table)
ALTER TABLE deliverable_versions
  ADD COLUMN origin TEXT NOT NULL DEFAULT 'ai_generated'
    CHECK (origin IN ('ai_generated','client_uploaded','abarva_uploaded','system_extract'));

-- Extend deliverable_role_approvals (existing table) — fixes the undiscovered version-scoping bug (§3.2)
ALTER TABLE deliverable_role_approvals
  ADD COLUMN version INT; -- backfilled from the deliverable's current signed_off_version/current_version, then made NOT NULL
-- Drop the old UNIQUE(deliverable_id, role); add UNIQUE(deliverable_id, role, version).

-- New: the immutable, append-only lifecycle event log
CREATE TABLE deliverable_lifecycle_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deliverable_id UUID NOT NULL REFERENCES deliverables_v2(id),
  version INT NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN (
    'version_created','submitted_for_review','review_assigned','comment_added',
    'changes_requested','approval_granted','approval_revoked',
    'marked_authoritative','authority_replaced','superseded'
  )),
  origin TEXT CHECK (origin IN ('ai_generated','client_uploaded','abarva_uploaded','system_extract')), -- set on version_created only
  reviewer_role_code TEXT CHECK (reviewer_role_code IN (
    'artifact_owner','workstream_lead','business_owner','technology_owner','architecture','data',
    'security','risk','legal','procurement','finance','executive_sponsor','client_authority',
    'abarva_quality','other'
  )),
  reviewer_role_label TEXT,
  reviewer_name TEXT,
  reviewer_organization TEXT,
  approval_scope TEXT,
  decision TEXT,                      -- e.g. 'approved' | 'rejected', for approval_granted/approval_revoked
  comments TEXT,
  requested_revisions TEXT,
  source_file_checksum TEXT,
  exception_flag BOOLEAN NOT NULL DEFAULT false,   -- true only for the §3.4 upload-as-approved-final exception
  exception_basis TEXT,                             -- required when exception_flag = true
  related_version INT,                              -- for authority_replaced/superseded: which version replaced this one
  backfill BOOLEAN NOT NULL DEFAULT false,          -- true for §3.12 legacy backfill events
  decided_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ON deliverable_lifecycle_events(deliverable_id, version);
CREATE INDEX ON deliverable_lifecycle_events(deliverable_id, created_at DESC);
```

## 5. Compatibility plan for existing readers and tests

- `deliverables_v2.status` keeps its exact current values and meaning for every existing reader —
  it is written identically to today (`signed_off` whenever `authoritative_lifecycle_state` is set to
  either new value). No existing test that asserts on `status` needs to change.
- `content-export/route.ts`, `moves-generate-deps.ts`, `deliverable-content-signals.ts` continue to
  work unmodified in the short term (they already prefer `signed_off_version`); they are candidates
  to migrate to `getAuthoritativeVersion()` in the Workstream F pass, not required to change here.
- `RoleApprovalsPanel`/`ClientApprovedBadge` (`PhaseDocumentsPanel.tsx`) continue to read
  `deliverable_role_approvals`/`signed_off_version` unmodified until Workstream E's UI work updates
  them to show the richer lineage — this design does not require a UI change to ship the schema.
- The one **required** code change bundled with this migration (not deferred): `getRoleApprovalSummary()`
  must start filtering by the deliverable's current version, since the added `version` column changes
  the table's cardinality — an un-migrated caller would otherwise see either zero or duplicate rows.

## 6. Phased migration and rollback plan

**Phase 1 (this design, schema only):**
1. Additive migration: new columns on `deliverables_v2`/`deliverable_versions`/`deliverable_role_approvals`,
   new `deliverable_lifecycle_events` table.
2. Backfill job (§3.12) — an ACA data-build Job per `docs/ops/aca-data-build-job-rule.md`, not an
   ad-hoc script, given it mutates every existing signed-off deliverable across all tenants. Produces
   a proof bundle (rows backfilled, confidence breakdown, any rows that could not be inferred) for
   human review before being considered complete.
3. `getRoleApprovalSummary()`/`recordRoleApprovalDecision()` updated for the new `version` column
   (the one required, non-deferrable code change from §5).
4. New mutations: `uploadApprovedFinalReplacement()`, `supersedeDeliverableVersion()`,
   `getAuthoritativeVersion()`. `completeDeliverable()`/`signOffDeliverable()` updated to also write
   lifecycle events (§3.14).
5. Full regression suite for the state-transition table (§3.10) — every valid transition, every
   listed invalid transition explicitly asserted as rejected, revocation, supersession, and the 3
   legacy-backfill scenarios (approved_artifact_id-backed, signed_off_version-only,
   no-signed-off-history-at-all).

**Rollback**: every schema change in Phase 1 is additive (new nullable columns, new table, a widened
unique constraint on an existing table). Rolling back means: stop writing the new columns/table
(code-level revert), leave the schema in place (dropping it is unnecessary and riskier than leaving
unused nullable columns). The one non-trivial-to-reverse step is the `deliverable_role_approvals`
unique-constraint change — reverting it requires collapsing any version-scoped duplicate rows back
to one row per `(deliverable_id, role)`, which the backfill job's proof bundle makes auditable if
ever needed.

**Phase 2+ (separate design/PRs, not part of this sign-off):** Workstreams B, D, E, F, G, per the
revised order in the header of this document.

## 7. AI-generated disclosure — every surface, no exceptions

Per the standing Moves Continuous Execution Directive, disclosure text
("*AI-generated draft. Requires human review and approval before it may be treated as authoritative
or used for a phase decision.*") must appear, and must never disappear during download or format
conversion, in **all** of:

- artifact metadata (the `origin`/lifecycle fields from §3.13, machine-readable)
- the Moves workspace (live view of an in-progress deliverable)
- the preview surface (before export)
- DOCX export
- **PDF export** (Workstream G / MOVES-QUALITY-001 — the PDF renderer must inherit this requirement
  from day one, not have it retrofitted after the renderer ships)
- Files Explorer (Workstream E)
- **the approval screen itself** — the reviewer approving a version must see the disclosure at the
  moment of decision, not only the eventual reader of the exported document

This is a rendering requirement each of B/D/E/G implements against the single `origin` field (§3.13)
and the live-projected `lifecycle_current_state` (§3.6) — this design section exists so the
requirement is recorded once, centrally, rather than each workstream's own doc re-deriving it
(and potentially missing a surface, which is exactly the failure mode the directive is guarding
against).

## 8. Files Explorer — required states and lineage (read contract for Workstream E)

Not built in this design pass — Workstream E is a UI project. This section specifies the exact
read contract Workstream E must consume, so its own design doesn't have to re-derive it.

**Origin** (one per version, from `deliverable_versions.origin`, §3.13):
`AI Generated` · `Client Uploaded` · `AbarVa Uploaded` · `System Extract` · `Authoritative Approved Version`
(the last is a derived label — the specific version currently pointed to by
`deliverables_v2.signed_off_version`, not a distinct `origin` enum value).

**Lifecycle** (one per version, projected per §3.1/§3.6):
`Draft` (`ai_draft`) · `In Review` (`in_review`) · `Changes Requested` (`changes_requested`) ·
`Human Approved` (`human_approved`) · `Client Final` (`client_final`) · `Superseded` (`superseded`) ·
**`Requires Revalidation`** — this last label is not itself a `lifecycle_current_state` value; it is
a derived, visually-distinct overlay badge shown whenever `deliverables_v2.requires_revalidation =
true` (§3.12/§4), layered on top of whichever of the 6 real lifecycle states the row is otherwise in
(almost always `human_approved`, from legacy backfill). Workstream E must render this as its own
visible flag, not silently fold it into the `Human Approved` label.

**Lineage tree** (per deliverable, across all its versions):

```
Target-State Architecture
├── v1 · AI Generated Draft
├── v2 · AI Generated Revision
├── v3 · Client Uploaded
└── v4 · Client Final · Authoritative
```

**Required linkage** for every file/version shown: tenant, Move, phase, artifact definition
(`deliverableTypeKey`), version number, predecessor version (if any — derivable from
`deliverable_lifecycle_events.related_version` on its `authority_replaced`/`superseded` event),
approval history (all `deliverable_lifecycle_events` rows for that version), authoritative
designation (whether this version is the current `deliverables_v2` pointer target), gate usage
(which phase-gate check(s) this deliverable type satisfies, from `ArtifactQualityContract.gateRelationship`),
and checksum/source metadata (`source_file_checksum` on the relevant lifecycle event, for
uploaded/extracted origins).

## 9. The gate invariant (governs Workstream F; restated here as an explicit 10-point checklist)

**No phase closes on the strength of an AI-generated draft alone.** A gate check must verify all 10
of the following before treating a deliverable as satisfied evidence — this is the authoritative
checklist Workstream F implements against; §3.6/§3.7 describe the mechanics, this section is the
literal enumerated requirement:

1. The required logical artifact (`deliverableTypeKey`) exists at all (`deliverables_v2` row present).
2. The current immutable version is identified (`getAuthoritativeVersion()`, §3.6, resolves non-null).
3. That version meets its `ArtifactQualityContract` (§2) — quality bar, required exhibits, outline.
4. Required human approvals apply to **that exact version** — not a historical approval from an
   earlier version (§3.2's version-scoping fix / MOVES-BUG-001).
5. Authority level meets the artifact's gate policy — `requiresClientAuthority` satisfied by a real
   `client_authority`-role event when required (§3.7).
6. No newer, unapproved version has replaced it — the resolved version is genuinely current, not
   shadowed by a later `ai_draft`/`in_review`/`changes_requested` version sitting on top of it.
7. The authoritative content is retrievable — the version's content/file is not missing, corrupted,
   or inaccessible.
8. Provenance and checksum are intact (`source_file_checksum` present and matching for
   uploaded/extracted origins).
9. Required decisions and evidence are present (`ArtifactQualityContract.qualityBar`'s
   `requiresDecision`/`requiresEvidenceGapsNoted`/etc. — §2).
10. No unresolved `changes_requested` event remains on the resolved version (if the latest event for
    this version is `changes_requested`, it cannot be the resolved authoritative version at all —
    this should already be structurally impossible per the state-transition table in §3.10, but is
    listed here as an explicit, defense-in-depth check Workstream F must still perform).

## 11. ACA lifecycle backfill job contract — MOVES-DESIGN-003, FINAL

**Status: resolved, recommended for adoption.** This closes MOVES-DESIGN-003. All 9 originally-open
questions are answered below with a specific recommendation, not repeated as open questions.

### 11.1 Scope

- **Tenant-batched, not all-tenant-at-once.** The job takes an explicit list of tenant keys per
  invocation (or a single tenant for the first run). There is no "run against every tenant" mode in
  v1 — an operator must explicitly name the tenant(s) for each invocation.
- **Dry-run is mandatory before any apply.** The job always runs in `status` mode first (produces
  the candidate-record report below, mutates nothing); an `apply` run is a separate, explicit
  invocation that requires the immediately-prior `status` run's report id as an input parameter (so
  apply can never run without a corresponding, reviewed dry-run having just happened for that exact
  tenant set).
- **First real invocation is a single named tenant**, not a full-tenant-list run — this is an
  operational rollout decision (start narrow, expand once one tenant's backfill is reviewed and
  judged correct), not a technical constraint the job enforces itself.

### 11.2 Eligibility

- Only `deliverables_v2` rows where `status = 'signed_off'` are candidates (matches the schema
  scope already specified in §3.12).
- Only rows whose lineage can be identified: `version = signed_off_version ?? current_version` must
  resolve to an actual, existing `deliverable_versions` row — a `deliverables_v2` row with
  `signed_off_version` pointing at a version that no longer exists (or was never inserted) is
  **skipped and reported**, not silently defaulted to `current_version` without recording that the
  substitution happened.
- **No inferred `client_final`, ever** — this is unconditional, per reviewer direction; there is no
  eligibility path in this job that produces `client_final`.
- `approved_artifact_id` presence is the sole signal for "may become authoritative without
  revalidation" — specifically, `approved_artifact_id` must reference a real, resolvable
  `move_artifacts` row (not just be non-null) before a record is backfilled without
  `requires_revalidation`. A dangling `approved_artifact_id` (references a deleted/missing artifact)
  demotes the record to the `signed_off_version`-only path below.
- `signed_off_version`-only records (no resolvable `approved_artifact_id`) always become
  `lifecycle_current_state = human_approved`, `authoritative_flag_source = legacy_backfill`,
  `requires_revalidation = true` — never anything stronger.

### 11.3 Execution

- **Runs as a sanctioned ACA operator Job**, per `docs/ops/aca-data-build-job-rule.md` — never a
  long-running `az containerapp exec` session, never a local script against production Postgres.
- **Advisory lock**: the job acquires a Postgres advisory lock keyed on `(tenant_key,
  'moves_lifecycle_backfill')` for the duration of an apply run — a second concurrent apply for the
  same tenant fails fast with a clear "backfill already running for this tenant" error rather than
  racing.
- **Idempotent**, keyed on `(deliverable_id, version, workflow_run_id)` — re-running the same
  workflow-run's apply step against the same tenant is a no-op for rows it already processed
  (checked via the audit output's own record, not by re-deriving eligibility from scratch each time).
- **Restartable**: if an apply run is interrupted partway, re-invoking the same `workflow_run_id`
  resumes from the last successfully-processed record (per the idempotency key above), not from the
  start of the tenant's full candidate set.
- **Bounded batches**: processes candidate records in batches (recommended default: 200 deliverables
  per batch) with a short pause between batches — protects the shared Postgres instance from a
  single large tenant's backfill saturating write throughput for other live traffic.
- **Immutable audit output, pre/post counts, row-level failure report, no silent skips** — every
  candidate record's disposition (backfilled / skipped-and-why / failed-and-why) is written to the
  audit output (§11.5); a record that is skipped for any reason (unresolvable lineage, dangling
  `approved_artifact_id`, already-processed idempotency match) appears in the report explicitly, not
  by omission.

### 11.4 Safety

- **Status/dry-run mode is the default** — `apply` requires an explicit flag plus the prior
  `status` run's report id, per §11.1.
- **Approval-gated apply**: the operator invoking `apply` must be a role authorized for data-build
  jobs per the existing ACA data-build job rule (not a new authorization concept — reuses what
  already governs every other operator data build in this codebase).
- **Schema version check**: the job asserts the target tenant's schema is at or past the migration
  that introduces `deliverable_lifecycle_events`/the new `deliverables_v2`/`deliverable_role_approvals`
  columns before running — refuses to run against a pre-migration schema rather than failing midway
  with a confusing error.
- **Migration hash check**: the job records the exact migration file hash it ran against in its audit
  output, so a later "was this backfill run against the schema we think it was" question is
  answerable without guessing from timestamps.
- **Tenant isolation assertion**: every write is scoped by `engagement_id`/tenant key matching the
  explicitly-named tenant for this invocation — the job never reads or writes across tenant
  boundaries, consistent with every other operator job in this codebase.
- **Rollback limited to backfill events created by the exact workflow run** — reverting a backfill
  means deleting the specific `deliverable_lifecycle_events` rows (and reverting the
  `deliverables_v2` pointer columns) tagged with that exact `workflow_run_id`, never a broader
  "delete all backfilled rows" operation that could touch a different run's output.
- **No deletion of legacy source records** — `deliverables_v2`/`deliverable_versions`'s existing
  rows are never deleted or overwritten by this job; it only adds new `deliverable_lifecycle_events`
  rows and sets the new, additive `deliverables_v2` columns (§4).

### 11.5 Output — per-candidate report row

```text
tenant
move (engagement_id / display name)
phase
artifact (deliverableTypeKey)
version
legacy evidence (signed_off_version | approved_artifact_id, whichever applies)
proposed lifecycle_current_state
authoritative designation (true/false, and authoritative_flag_source)
requires_revalidation (true/false)
reason (one line — e.g. "approved_artifact_id resolves to a real move_artifacts row with checksum"
  or "signed_off_version only, no upload lineage — legacy inferred")
confidence (high | inferred)
action_or_skip (backfilled | skipped:<reason> | failed:<reason>)
```

This report is produced by both `status` (dry-run) and `apply` runs — `apply`'s report additionally
confirms each row's *actual* resulting state after the write, so a dry-run's *prediction* and an
apply's *result* are directly comparable per record.

### 11.6 Recommendation

Adopt this contract as written. The one deliberate scope-narrowing decision — a single named tenant
for the first real `apply` run, not an immediate all-tenant rollout — is a rollout-safety choice, not
a technical limitation; expanding to additional tenants is simply re-invoking the job with a
different (or additional) tenant list once the first tenant's output is reviewed and judged correct.

## 12. Open items — status

All three previously-open design decisions (MOVES-DESIGN-001, MOVES-DESIGN-002, MOVES-DESIGN-003)
are now **resolved with a specific, adoptable recommendation** in §3.8, §3.7, and §11 respectively.
Nothing in this document is left as an unresolved questionnaire. What remains is explicit owner
sign-off on the recommendations themselves — approving (or amending) §3.8/§3.7/§11 is what unblocks
Phase 1 schema implementation. No migration or code has been written; this document remains design
only until that sign-off is given.
