# Lakeshore and Meridian Shared Readiness Evidence

Date: 2026-06-05

Status: shared-environment rehearsal

## Executive Summary

Lakeshore and Meridian can be used now to prove the operating discipline around
tenant setup, context/corpus loading, AI liability controls, and audit evidence.
They should not be represented as true private data-plane proof, SSO proof,
customer-subscription proof, HIPAA production proof, or live customer PHI proof.

This lets setup/admin loader sessions keep moving without overstating the
architecture state. The later private subscription dry run remains the moment
where dedicated Azure resources, SSO, audit export, rollback, and teardown are
proven end to end.

## Compact Backlog Status

| Backlog Area | Current Status | Percent | What Can Move Now | What Must Wait |
| --- | --- | ---: | --- | --- |
| AI liability defense controls | In progress | 75% | Responsible AI acknowledgement, human approval boundary, citations, advisory labels, no silent remediation, usage cap evidence. | Live customer legal acceptance and production operating evidence. |
| Context layer and corpus setup | In progress | 70% | Loader-backed setup/admin evidence, corpus coverage map, gap assessment, retrieval/showcase validation. | Customer-owned corpus acceptance and live PHI authorization. |
| Shared tenant rehearsal | In progress | 65% | Lakeshore/Meridian client keys, loader manifests, validation reports, leakage checks, audit bundle. | Dedicated private data-plane proof. |
| Private data-plane architecture | In progress | 45% | IaC validation, runbooks, parameter files, private-plane checklist. | Customer or pilot subscription deployment, SSO, audit export, teardown proof. |
| SSO readiness | In progress | 40% | Configuration verifier and org-mapping checklist. | Actual customer IdP/Clerk organization production mapping. |

## Evidence Levels

| Level | Name | Claim Allowed |
| --- | --- | --- |
| 1 | Product control proof | Product and control-plane controls exist and can be exercised. |
| 2 | Shared tenant rehearsal | Loader-backed setup/admin flow, tenant-scoped evidence, context/corpus rehearsal, and leakage checks work in the shared environment. |
| 3 | Private subscription proof | Dedicated resources, SSO, customer audit export, rollback, and teardown are proven after a private dry run. |

Current Lakeshore/Meridian status: Level 2 shared tenant rehearsal.

## Controls To Exercise Now

| Control | Lane | Status | Evidence To Capture |
| --- | --- | --- | --- |
| Admin loader ingestion evidence | Architecture | Can verify now | Source manifest, scan, schema validation, mapping preview, approval, commit or dry run, rollback note. |
| Client id lineage | Architecture | Can verify now | Client key, client id, loader evidence references, leakage-check output. |
| Context/corpus setup | Architecture | Partial shared rehearsal | Context manifest, corpus coverage map, gap assessment, retrieval or showcase validation. |
| Responsible AI acknowledgement | AI liability | Can verify now | Sign-in acknowledgement, stored acknowledgement, annual re-acknowledgement behavior. |
| AI human approval boundary | AI liability | Can verify now | No silent apply proof, approval user id, reason, action evidence ids. |
| AI output defense | AI liability | Can verify now | Citations, confidence/estimate labels, advisory framing, edit-before-commit proof. |
| Usage/cost cap | Architecture | Can verify now | Tenant usage meter, cap threshold, approval required for overage. |
| Private subscription dry run | Architecture | Deferred private plane | Subscription id, resource outputs, private database/storage/search/key vault proof, SSO mapping, audit export, teardown evidence. |

## Truth Boundaries

Use these labels in status updates:

- shared-environment rehearsal,
- not private data-plane proof,
- not SSO proof,
- not customer-subscription proof,
- not HIPAA production proof.

## What This Unlocks

The setup/admin loader sessions can keep working on the practical pieces:

- context layer and corpus loading discipline,
- setup evidence capture,
- AI acknowledgement and approval gates,
- usage-cap evidence,
- leakage checks,
- managed-service upkeep artifacts,
- product feedback from realistic tenant workflows.

This is enough to advance the backlog without waiting for the private
subscription dry run. It also creates the evidence vocabulary we will reuse when
the private data plane is deployed later.

## Related Runbooks

- `docs/runbooks/pilot-data-loader-governance.md`
- `docs/runbooks/setup-ai-governance.md`
- `docs/runbooks/lakeshore-private-data-plane.md`
- `docs/runbooks/tenant-shared-readiness-evidence.md`
