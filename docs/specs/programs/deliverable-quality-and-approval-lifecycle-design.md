# Deliverable Quality & Approval Lifecycle — Design Doc (Workstreams A + C)

Status: **draft v2 — awaiting sign-off before any migration or code**
Author: Claude Code, 2026-07-20 (revised same day per reviewer decisions on the 4 open questions from v1)
Scope: Workstream A (artifact-quality contracts) and Workstream C (approval workflow lifecycle),
from the broader 7-workstream governance program (A–G). This revision incorporates explicit
reviewer decisions on all 4 open questions from v1, plus 10 additional structural directions:
event-sourced lifecycle (not a single mutable status column), a controlled reviewer-role model, an
explicit "upload as already-approved-final" exception path, per-artifact gate policy, intrinsic
AI-disclosure at the version level, and a full state-transition/backfill/rollback specification.
Nothing has been implemented — this is design only, per direction.

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
  'architecture','data','security','risk','legal','procurement',
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

### 3.7 Gate policy is per-artifact, not global (reviewer-directed)

`ArtifactQualityContract.gateRelationship` (§2) carries this, per type:

| Artifact | `minimumLifecycleState` | `requiredReviewerRoles` | `requiresClientAuthority` |
|---|---|---|---|
| Diagnostic findings (`discovery_report`) | `human_approved` | — | false |
| Workshop guide | `human_approved` | — | false |
| Target-state recommendation (`target_state_architecture`) | `human_approved` | `architecture` | false |
| Business case | `human_approved` | `finance` | false |
| Program charter (`charter`) | `client_final` | — | true |
| Mobilization authorization | `client_final` | `executive_sponsor` | true |

`evaluateGate()` (Workstream F, not built in this pass) checks, per gate-artifact deliverable: (a)
`getAuthoritativeVersion()` resolves to a non-null version whose `lifecycleCurrentState` meets or
exceeds `minimumLifecycleState`; (b) if `requiresClientAuthority`, the resolved version's
`authoritative_flag_source` traces to a `client_authority`-role event, not merely `normal_flow` with
an internal reviewer; (c) the version-scoped `deliverable_role_approvals` (§3.2) independently
confirms `allRequiredApproved` for the REQUIRED_APPROVAL_ROLES 4-axis, unaffected by this table.

### 3.8 Reviewer-role-code → REQUIRED_APPROVAL_ROLES mapping

```ts
const REVIEWER_ROLE_TO_GATE_ROLE: Partial<Record<ReviewerRoleCode, ApprovalRole>> = {
  business_owner: 'business',
  technology_owner: 'technology',
  architecture: 'technology',
  finance: 'finance',
  risk: 'risk_security',
  security: 'risk_security',
};
// executive_sponsor, client_authority, artifact_owner, workstream_lead, data, legal, procurement,
// abarva_quality, other, workstream_lead have NO gate-role mapping — they are descriptive-only and
// never satisfy a REQUIRED_APPROVAL_ROLES check by themselves.
```

An `approval_granted` event with `reviewer_role_code = 'architecture'` therefore *also* upserts
(or confirms) the corresponding `deliverable_role_approvals` row for role `technology` at that
version — one recorded decision, two consumers (the descriptive audit trail and the gate-required-role
mechanism), kept consistent by this single mapping table rather than by two independently-maintained
write paths.

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

## 10. Open items still requiring reviewer sign-off before Phase 1 begins

1. `REVIEWER_ROLE_TO_GATE_ROLE` mapping (§3.8) — see `MOVES-DESIGN-001` in
   `docs/backlog/moves-product-backlog.md` for the proposed mapping and decision table.
2. The gate-policy table in §3.7 is illustrative, using the reviewer's own 6 examples — see
   `MOVES-DESIGN-002` in the canonical backlog for the full 16-type decision table.
3. The ACA data-build Job contract for the backfill — see `MOVES-DESIGN-003` in the canonical
   backlog for the full decision table (proof bundle fields, tenant scope, idempotency key,
   batching, rollback, audit output, failure handling).
