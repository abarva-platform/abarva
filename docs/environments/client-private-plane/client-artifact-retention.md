# Client Artifact Retention

Status: scaffold-ready, not executed

This packet defines retention expectations for generated and uploaded client artifacts in Client Preprod and Client Prod.

## Artifact Classes

- uploaded originals
- extracted evidence
- generated deliverables
- Move artifacts
- Source event artifacts
- context bundle traces
- retrieval proof reports
- approval/signoff records

## Retention Rules

- Client Preprod retention is rehearsal-oriented and must be approved per client.
- Client Prod retention follows contract, legal, audit, and deletion requirements.
- Artifacts must be versioned, downloadable when allowed, tenant/client/event/move scoped, and tied to source register or context bundle trace where applicable.
- Superseded artifacts remain audit-visible but are not the default current artifact.

## Deletion Rules

Deletion requires client signoff, owner approval, evidence export, and a rollback/restore posture if the artifact is audit-relevant.
