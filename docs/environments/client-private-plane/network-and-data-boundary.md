# Client Private-Plane Network And Data Boundary

Status: non-mutating scaffold

Client Preprod and Client Prod use private data-plane boundaries. Product Dev, Product Preview, and Product Prod must not store raw client private documents.

## What Lives In AbarVa Product/Control Plane

- shared application code
- product release metadata
- tenant routing metadata
- approved product telemetry
- non-sensitive control-plane configuration
- release evidence and operational reports that do not expose client private content

## What Lives In Client Private Plane

- source files and originals
- extracted records, facts, chunks, and citations
- Azure AI Search indexes
- artifacts/evidence tied to client events or Moves
- context bundle traces where they include client context
- client-specific secrets and keys

## Network Assumptions

- private endpoints for data services
- no public database access
- private worker or Container Apps job path for ingestion, migration, search refresh, and health proof
- private DNS zones where required
- diagnostic and activity logs retained per environment

## Data Rules

Minimum necessary data only. PHI is not accepted. PII is not accepted unless a future contract and governance update explicitly allow it. Named executives should be title/role-first unless client-approved business-contact classification exists.
