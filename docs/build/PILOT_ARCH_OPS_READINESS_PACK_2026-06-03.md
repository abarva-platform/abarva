# Pilot Architecture and Operations Readiness Pack

Status: candidate
Date: 2026-06-03
Release lane: internal-admin
Backlog coverage: T028, T046, T049, T053, T118, T149, T159, release-environment gap

## Purpose

This pack converts several open pilot-readiness rows into controlled,
repo-owned operating artifacts. It does not provision infrastructure, change
runtime behavior, or assert that live load testing has already happened.

The goal is to make the next enterprise pilot discussion concrete:

- what deployment model AbarVa recommends,
- how corporate SSO and Azure connectivity should be tested,
- what onboarding and support commitments are in scope,
- how Responsible AI controls are stated,
- what load profiles should be measured,
- which SLO/SLA numbers are contractual now versus still evidence-gated.
- what pre-production, pilot-production, and multi-client production mean.

## Backlog Mapping

| Task | Tracker row | Artifact | Status after this pack |
| --- | --- | --- | --- |
| Decide deployment model: client-tenant Azure recommended | T028 | `docs/architecture/adr/ADR-0007-vercel-control-plane-posture.md`, this pack | Done |
| Document key-person risk and runbook commitment in SOW | T046 | `docs/runbooks/key-person-risk-and-continuity.md` | Done |
| Write 30/60/90 pilot kickoff playbook | T049 | `docs/pilot/PILOT_KICKOFF_30_60_90_PLAYBOOK.md` | Done |
| Define managed services scope in/out explicitly in SOW | T053 | `docs/pilot/MANAGED_SERVICES_SCOPE.md` | Done |
| AI ethics / Responsible AI policy | T118 | `docs/legal/responsible-ai-policy.md` | Done |
| Define load profiles: 10 pilot, 50 year-1, 100 stretch | T149 | `docs/runbooks/load-profile-and-slo-plan.md` | Done |
| Document SLO/SLA based on observed perf, not guess | T159 | `docs/runbooks/load-profile-and-slo-plan.md` | In progress until soak evidence exists |
| Structured preview/pre-prod/production promotion plan | Release environment gap | `docs/runbooks/product-release-environment-plan.md` | Done |

## Existing Architecture Anchors

This pack intentionally references existing repo artifacts instead of
inventing a new architecture:

- `docs/architecture/adr/ADR-0007-vercel-control-plane-posture.md`
- `docs/architecture/azure/AZURE-FULL-STACK-TEST-LAYERS.md`
- `docs/deployment/AZURE_PRIVATE_DATA_PLANE_LAB_RUNBOOK.md`
- `infra/azure/**`
- `docs/pilot/SUPPORT-MODEL.md`
- `docs/runbooks/disaster-scenario-drills.md`
- `docs/legal/AI_DECISION_SUPPORT_CONTROLS.md`

## What Changed

### Deployment and test posture

The deployment model is now easy to cite: Vercel remains the shared SaaS
control plane; Azure is the client-scoped data plane and private-lane target.
The new SSO/connectivity runbook explains how to rehearse corporate identity,
role mapping, private dependency reachability, negative public-path tests, and
tenant isolation before pilot go-live.

### Pilot operating model

The new 30/60/90 playbook turns kickoff from a vague customer-success activity
into weekly gates: identity, users, data, templates, agent quality, executive
reviews, value proof, security evidence, and renewal conversion.

The managed-services scope document makes explicit what AbarVa operates and
what remains a client responsibility.

### Responsible AI

The Responsible AI policy consolidates decision-support language, human
approval gates, source discipline, sensitive-data handling, no autonomous
external action, and cross-client isolation into one policy artifact.

### Load and SLO/SLA discipline

The load-profile plan defines the exact pilot/year-1/stretch scenarios and
ties them to the existing `azure:load:primary-surfaces` and agent-quality
harnesses. It also prevents premature SLA claims by marking formal SLO/SLA
publication as evidence-gated until real soak results exist.

### Release environment ladder

The product release plan defines local dev, PR preview, pre-prod/staging,
first-client pilot production, and multi-client production. It also defines
what changes when AbarVa moves from one pilot client to two or three clients:
per-client blast-radius review, stronger staging, all-client smoke, tenant
isolation probes, and client-specific rollout policy.

## Known Gaps

- T159 remains in progress. This pack defines the SLO/SLA evidence path, but
  does not fabricate observed performance results.
- T029 remains open. The repo has Azure Bicep modules under `infra/azure/**`,
  but this pack does not claim a fresh end-to-end tenant deployment was run.
- T115 remains in progress. Disaster scenarios are documented in
  `docs/runbooks/disaster-scenario-drills.md`; they still need a recorded
  drill evidence packet before being marked Done.
- The dedicated pre-prod/staging environment decision is still open. The plan
  defines the standard and allows a protected Vercel preview convention until
  a dedicated staging project is created.
- No customer production data is loaded or processed by this release.
