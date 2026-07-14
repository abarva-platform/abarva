# Entity Profile Contract

Status: design baseline.

An `EntityProfile` is the business-readable unit of enterprise knowledge. It is
not just a row from a CSV. It is a governed profile that carries meaning,
relationships, evidence, confidence, gaps, and active/candidate truth status.

## Required Profile Types

- `EnterpriseProfile`
- `FunctionProfile`
- `SystemProfile`
- `DataDomainProfile`
- `InfrastructureProfile`
- `VendorProfile`
- `ContractProfile`
- `ProgramProfile`
- `RiskProfile`
- `MetricProfile`
- `UseCaseProfile`
- `ProcessProfile`

## Required Fields

Every profile must support:

- profile id,
- tenant key,
- entity type,
- entity name,
- business meaning,
- current-state summary,
- target-state direction,
- operating role,
- related functions,
- related systems,
- related data domains,
- related infrastructure,
- related vendors/contracts,
- related spend,
- related programs,
- related risks/controls,
- related metrics/outcomes,
- related use cases,
- canonical facts,
- relationship edges,
- evidence refs,
- confidence,
- known gaps,
- caveats,
- active/candidate/synthetic truth status,
- source lineage,
- as-of date,
- module readiness.

## Why Profiles Matter

Profiles give AbarVa enough structure to answer executive questions without
losing the richness of tenant context.

Examples:

- A finance mart is not only a system name. It has business purpose, upstream
  ERP dependency, downstream dashboard consumers, refresh risk, owner gaps, and
  value-measurement caveats.
- A contact center agent-assist use case is not only an AI idea. It connects
  workflows, roles, CRM, claims, eligibility, benefits, transcripts, knowledge
  base, PHI controls, metrics, and gaps.
- A fraud copilot is not only a model. It connects alert queues, AML data, KYC
  evidence, case outcomes, model-risk controls, queue aging, and loss metrics.

## Profile Readiness

`moduleReadiness` communicates whether a profile may be used by a module:

- `agent_ready`
- `needs_review`
- `not_ready`
- `candidate_only`
- `restricted`
- `missing_evidence`
- `relationship_not_validated`

No profile becomes active runtime truth just because it exists in a generated
or source-adapter packet.
