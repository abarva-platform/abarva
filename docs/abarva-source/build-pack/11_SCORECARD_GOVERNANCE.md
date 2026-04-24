# 11 SCORECARD GOVERNANCE

## Lifecycle

Default Generated -> Client Edited -> Rationale Added -> Reviewed -> Approved -> Locked -> Used for Vendor Evaluation

## Required Behavior

- pattern-pack default criteria and weights
- client override support
- total weight validation = 100%
- rationale required for material changes
- material-change flag when weight changes beyond threshold
- approval/lock before evaluation
- audit trail from default to customized model
- Nexus explanation of weighting tradeoffs
- Steward enforcement before evaluation begins

## Material Change

A material change occurs when:

- a criterion weight changes beyond threshold
- a criterion is added
- a criterion is removed
- evaluation meaning changes materially

Material changes require rationale and review.

## Default Scorecard: Data & AI Modernization Sourcing

| Criterion | Weight |
|---|---:|
| Data platform modernization capability | 20% |
| Migration factory / delivery approach | 15% |
| Domain/data model expertise | 15% |
| Cloud platform expertise | 15% |
| Governance/security/quality | 10% |
| Commercial model | 10% |
| AI/GenAI enablement roadmap | 10% |
| Change/adoption and operating model | 5% |

## Default Scorecard: AMS / Managed Services Sourcing

| Criterion | Weight |
|---|---:|
| Commercial competitiveness | 20% |
| Transition capability | 20% |
| Service delivery operating model | 15% |
| Technical/application portfolio fit | 15% |
| Automation / AI productivity roadmap | 10% |
| Risk, security, compliance | 10% |
| Cultural / stakeholder fit | 5% |
| Innovation / continuous improvement | 5% |

## Default Scorecard: Digital Product Build Vendor Selection

| Criterion | Weight |
|---|---:|
| Product delivery capability | 20% |
| UX/design and discovery approach | 15% |
| Architecture and engineering quality | 15% |
| Agile delivery model | 15% |
| Relevant domain experience | 10% |
| Commercial model | 10% |
| Security/compliance | 10% |
| Post-launch support model | 5% |

## Validation Rules

- total weight must equal 100%
- rationale required for material changes
- locked scorecard is read-only
- evaluation cannot begin until approved and locked

## Anti-Patterns

- vendor scoring before scorecard lock
- hidden weight changes
- criteria without definitions
- rationale-free overrides
- generic scorecards unrelated to sourcing archetype
