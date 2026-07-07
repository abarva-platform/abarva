# AbarVa Internal Knowledge Base

Status: active
Owner: AbarVa operations
Audience: engineers, operators, founder staff, sales engineering, security reviewers
Backlog task: T108 - Internal wiki / knowledge base

This is the in-repo home for AbarVa operating knowledge. It keeps standards,
runbooks, decisions, release records, customer/pilot notes, and architecture
contracts discoverable without scattering source-of-truth material across
untracked documents.

---

## 1. Start Here

| Need | Go to | Why |
| --- | --- | --- |
| Coding conventions and AI-agent rules | `AGENTS.md` | Source of truth for engineering rules and release discipline. |
| Governance file map | `GOVERNANCE.md` | Index of standards, PR template, CODEOWNERS, ADRs, runbooks, and release records. |
| Engineer setup | `docs/runbooks/engineer-onboarding.md` | Local environment, expectations, and safe first steps. |
| Release process | `docs/runbooks/release-cadence.md` | How releases are classified, validated, rolled out, and rolled back. |
| Current release evidence | `docs/releases/records/` | Append-only release records used by CI and audit review. |
| Architecture decisions | `docs/architecture/adr/README.md` | ADR index for durable technical decisions. |
| Operational runbooks | `docs/runbooks/` | Procedures for incidents, rollback, secrets, quality gates, and compliance. |

## 2. Operating Areas

| Area | Canonical folder | Notes |
| --- | --- | --- |
| Engineering governance | `GOVERNANCE.md`, `AGENTS.md`, `.github/` | Standards, PR shape, owners, branch protection, and AI-tool rule generation. |
| Architecture | `docs/architecture/`, `docs/platform-architecture/` | Plane boundaries, Azure posture, model gateway, tenancy, ADRs, runtime architecture. |
| Release control | `docs/releases/` | Release record template and release records. CI enforces records for release-relevant changes. |
| Runbooks | `docs/runbooks/` | Operator procedures and guardrail documentation. |
| Security and compliance | `docs/security/`, `docs/compliance/`, `docs/architecture/ai/` | Encryption posture, AI readiness, license/SBOM, data return/deletion, evidence packs. |
| Backlog and planning | `docs/backlog/`, `docs/planning/` | Planning artifacts and in-repo backlog references. The pilot tracker workbook remains the live status source when explicitly updated. |
| Customer and pilot material | `docs/pilot/`, `docs/build/`, `docs/skyharbor/`, `docs/enterprise-context/` | Customer-context packages, pilot evidence, synthetic context, and build artifacts. |
| Product and design specs | `docs/specs/`, `docs/product/`, `docs/platform-design/`, `docs/design/` | Product surface contracts, page workflow catalog, design canon, and wireframes. |
| Knowledge corpus | `docs/knowledge-corpus/`, `docs/pattern-library/`, `docs/platform-design/pattern-operating-model/` | Pattern, corpus, provenance, retrieval, and authoring standards. |

## 3. Job-To-Be-Done Index

| Job | Primary reference | Supporting references |
| --- | --- | --- |
| Open or review a PR | `.github/PULL_REQUEST_TEMPLATE.md` | `docs/runbooks/release-cadence.md`, `docs/releases/templates/release-record-template.md` |
| Add a release-relevant change | `docs/releases/templates/release-record-template.md` | `AGENTS.md`, `GOVERNANCE.md` |
| Explain the Vercel/Azure posture | `docs/architecture/adr/ADR-0007-vercel-control-plane-posture.md` | `docs/architecture/CLOUD1_ENTERPRISE_DEPLOYMENT_MODELS.md`, `docs/architecture/VERCEL1_PER_CUSTOMER_VERCEL_OPTION.md` |
| Explain AI/model egress posture | `docs/architecture/ai/ENTERPRISE-AI-READINESS-ROADMAP.md` | `docs/architecture/MODEL1_AZURE_CLAUDE_ROUTE_VALIDATION.md`, `docs/architecture/ABARVA_MODEL_GATEWAY_AND_TOOL_PLANE.md` |
| Roll back a release | `docs/runbooks/rollback.md` | `docs/runbooks/disaster-recovery.md`, release record for the change |
| Handle an incident | `docs/runbooks/incident-response.md` | `docs/runbooks/on-call.md`, `docs/runbooks/disaster-recovery.md` |
| Run a disaster tabletop drill | `docs/runbooks/disaster-scenario-drills.md` | `docs/runbooks/disaster-recovery.md`, `docs/runbooks/incident-response.md`, `docs/pilot/SUPPORT-MODEL.md` |
| Manage secrets and leak scans | `docs/runbooks/secret-scanning.md` | `docs/deployment/ENV_EXAMPLE_POLICY.md` |
| Check supply-chain posture | `docs/runbooks/license-sbom-compliance.md` | `docs/compliance/` |
| Understand branch/quality gates | `docs/runbooks/bundle-budget.md`, `docs/runbooks/lighthouse-ci.md`, `docs/runbooks/coverage-threshold.md` | `docs/runbooks/accessibility-axe.md`, `docs/runbooks/dependency-vulnerability-management.md` |
| Sync AI tool rules | `docs/runbooks/sync-ai-rules.md` | `AGENTS.md`, `scripts/governance/sync-ai-rules.ts` |
| Scaffold governance artifacts | `docs/runbooks/scaffold-scripts.md` | `scripts/governance/` |
| Prepare security review material | `docs/security/`, `docs/compliance/` | `docs/architecture/ai/ENTERPRISE-AI-READINESS-ROADMAP.md`, `docs/releases/records/` |
| Prepare a sales engineering conversation | `docs/gtm/sales-engineering-toolkit/README.md` | `docs/demo/ABARVA_BOARDROOM_DEMO_SCRIPT.md`, `docs/pilot/SECURITY_POSTURE.md`, `docs/gtm/D1-NARRATIVE-AND-VALUE-PROP.md` |
| Answer competitive differentiation questions | `docs/gtm/COMPETITIVE_INTELLIGENCE.md` | `docs/gtm/sales-engineering-toolkit/README.md`, `docs/gtm/D1-NARRATIVE-AND-VALUE-PROP.md` |
| Find pilot/customer context | `docs/pilot/`, `docs/enterprise-context/`, `docs/build/` | Current release records and tracker notes |
| Pin or audit a corpus release | `docs/runbooks/corpus-release-manifest.md` | `docs/knowledge-corpus/releases/README.md`, `docs/knowledge-corpus/PROVENANCE_AND_VERSIONING.md` |

## 4. Ownership Rules

1. Prefer in-repo source-of-truth documents over untracked notes.
2. If a document changes release posture, add or update a release record.
3. If a decision will outlive a single PR, record it as an ADR or architecture
   contract.
4. If a procedure will be repeated, make it a runbook.
5. If a customer-specific detail is not safe to publish internally, store only
   a pointer and keep sensitive evidence in the approved secure location.
6. Do not hand-edit generated AI-rule derivatives. Update `AGENTS.md` and run
   the sync script.

## 5. Maintenance Cadence

| Cadence | Task |
| --- | --- |
| Every PR | Confirm release record, runbook, ADR, and customer-note links are current when the PR touches those areas. |
| Weekly | Review newly added docs and add them to this index if they are operationally important. |
| Monthly | Audit stale links, archived material, and release record coverage. |
| Before pilot/customer review | Verify the architecture, security, release, and customer-context links are current and backed by evidence. |

## 6. Known Gaps

- This index does not replace the pilot readiness tracker workbook.
- This index does not create a Notion space or external wiki.
- Customer-specific access controls remain governed by repository permissions
  and approved secure storage, not by this markdown file.
