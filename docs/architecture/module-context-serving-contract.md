# Module Context Serving Contract

Status: supplier contract for downstream module consumers.

This document defines the generic, read-only context-serving interface that
Home, Intelligence, Moves, Source, and Tower can use after Active Tenant Access
promotion work is complete.

This is a data-layer supplier contract. It does not implement module behavior.
It does not create Move evidence, Source artifacts, Tower values, Intelligence
answers, or Home summaries.

## Contract Boundary

The data layer supplies tenant-scoped, lineage-backed context packets.

Modules decide how to use those packets.

```text
Module request
-> Module Context Serving Contract
-> Active Tenant Access or explicit Candidate Preview
-> ModuleContextPacket
-> Module-specific behavior later
```

Default reads use active context only. Candidate context is returned only when a
caller explicitly requests `mode: "candidate_preview"`.

## Read Function

```ts
getModuleContext({
  tenantKey,
  moduleKey,
  purpose,
  mode,
  scope,
  requestedDomains,
  evidencePolicy,
  relationshipPolicy,
});
```

Modules that need a deterministic executive explanation should call:

```ts
explainModuleContext({
  tenantKey,
  moduleKey,
  purpose,
  mode,
  scope,
  requestedDomains,
  evidencePolicy,
  relationshipPolicy,
});
```

`getModuleContext(...)` returns the facts, evidence, gaps, relationships,
readiness, and guardrails.

`explainModuleContext(...)` returns deterministic English and action lists
derived from the packet. It does not call Claude, does not synthesize new facts,
and does not implement module behavior.

### Module Keys

```text
home
intelligence
moves
source
tower
```

### Modes

```text
active
candidate_preview
```

When `mode` is omitted, it resolves to `active`.

Active mode never falls back to inactive candidate read models.

### Purposes

```text
context_summary
evidence_extract
readiness_preview
answer_context
handoff_context
```

### Requested Domains

```text
functions
applications_systems
vendors_contracts
data_assets_integrations
programs_priorities
risks_controls
metrics_outcomes
enterprise_profile
relationships
evidence_sources
```

## Packet Shape

The serving contract returns a `ServedModuleContextPacket`, which extends the
legacy `ModuleContextPacket` for compatibility and adds the new supplier fields:

```text
tenantKey
moduleKey
purpose
mode
sourceMode
activeTenantAccessVersionId
candidateVersionId
generatedAt
domains[]
records[]
evidenceRefs[]
validatedRelationships[]
relationshipCandidates[]
gaps[]
caveats[]
lineage
readiness
guardrails
contextCompleteness
```

Each record includes:

```text
recordId
domain
canonicalDomain
objectType
title
summary
fields
sourceEvidenceIds
citationStatus
agentReadiness
relationshipReadiness
restricted
confidence
```

Readiness classifications are generic:

```text
agent_ready
needs_review
not_ready
candidate_only
restricted
missing_evidence
relationship_not_validated
```

Every packet also carries `contextCompleteness`:

```json
{
  "breadth": 92,
  "depth": 84,
  "relationshipCoverage": 41,
  "evidenceCoverage": 88,
  "answerability": 79,
  "overall": "Good"
}
```

These scores are deterministic and packet-local. They are not Tower metrics,
realized value, or a client outcome claim. Modules may render the same scores
with different labels:

| Module | Display label |
| --- | --- |
| Home | Enterprise Understanding |
| Intelligence | Answer Readiness |
| Moves | Evidence Readiness |
| Source | Commercial Readiness |
| Tower | Measurement Readiness |

## Explanation Shape

`explainModuleContext(...)` returns:

```text
summary
strengths[]
limitations[]
supportedQuestions[]
unsupportedQuestions[]
nextActions[]
contextCompleteness
guardrails
```

The explanation is deterministic and evidence-bound. It is intended to prevent
each module from inventing its own English for the same packet.

## Guardrails

Every packet includes guardrails that make the active/candidate split explicit:

```text
activeByDefault: true
candidatePreviewRequiresExplicitMode: true
defaultModuleReadsCandidateData: false
activeTenantAccessLayerUpdated: false
productionTenantDataWritten: false
candidatePromoted: false
moduleRuntimeConsumptionChanged: false
moveRuntimeModified: false
moveEvidenceCreated: false
homeReadsCandidateByDefault: false
```

These flags describe the serving call. They do not rewrite historical release
artifacts. A tenant may have an Active Tenant Access metadata pointer while the
serving contract still proves that the read did not write data, promote a
candidate, or change module runtime consumption.

## Moves Example

Moves can later request context like this:

```ts
await getModuleContext({
  tenantKey: "meridian-health",
  moduleKey: "moves",
  purpose: "evidence_extract",
  mode: "active",
  scope: {
    moveId,
    phase,
    targetPhase,
    useCase,
    charter,
    evidenceFamilies,
  },
  requestedDomains: [
    "functions",
    "applications_systems",
    "data_assets_integrations",
    "programs_priorities",
    "risks_controls",
    "metrics_outcomes",
    "enterprise_profile",
  ],
  evidencePolicy: "lineage_required",
  relationshipPolicy: "validated_and_candidates",
});
```

The data layer returns context only. A future Moves PR decides what becomes:

```text
Attached Evidence
Suggested Context
Excluded Context
Gaps
```

## Non-Goals

This contract does not:

- modify Moves runtime;
- create Move artifacts;
- attach Move evidence;
- change Source, Tower, Intelligence, or Home behavior;
- promote candidate versions;
- update Active Tenant Access;
- make Home or any module read candidate data by default.

## Validation

The contract is enforced by:

```text
npm run audit:module-context-serving
```

The audit proves:

- default module reads resolve to `active`;
- active reads do not consume candidate records;
- missing active access does not fall back to candidate data;
- candidate preview returns records only when explicitly requested;
- relationship candidates are omitted unless requested;
- context completeness is available in every packet;
- deterministic explanations preserve guardrails;
- module-runtime and data-mutation guardrails remain false.
