# Rollback And Stop Conditions

This package is plan-only, so rollback for this PR is deleting this folder and its release record
before merge.

## Stop Before Apply

Stop and do not create the Phase 1 apply PR if any of these occur:

- Azure account does not show subscription `701a8554-a166-46e9-bf13-743bc50e3b20`.
- Operator command omits `tenant_key=healthcare-demo-new`.
- Operator command omits `release_id=healthcare-demo-new-source-corpus-v1.0.0`.
- Operator command omits
  `approval_manifest_sha=06f645913353988eb722eeccb2b89ee5f7d96fbf2b4c60d86d6bff3bee4412fd`.
- Azure what-if includes delete, replacement, public network enablement, shared ACA web mutation,
  product runtime traffic change, Airline content, or wildcard tenant scope.
- The current web image digest cannot be refreshed and locked before ACA job definition apply.
- Private DNS, RBAC, or evaluator-isolation checks cannot be expressed as commands.

## Rollback After Future Apply

The future Phase 1 apply PR must include the actual deployment IDs and rollback commands. Minimum
rollback sequence:

1. Disable all Healthcare ACA jobs.
2. Remove role assignments for Healthcare managed identities.
3. Delete Healthcare-specific resource group only if zero-data verification confirms no source or
   tenant facts landed.
4. Preserve audit logs and Azure deployment records.
5. Record the rollback as a separate execution report.

## Later Phases Not Covered

PostgreSQL migrations, source landing, parser waves, graph projection, publication, and product
runtime cutover require their own rollback plans. They are not authorized here.
