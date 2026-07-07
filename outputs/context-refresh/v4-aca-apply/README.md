# V4 ACA Context Refresh Receipt

Run date: 2026-06-18

This folder contains the evidence for the V4 pilot context refresh executed
through the ACA/VNet lane against Azure Postgres and Azure AI Search.

## Final State

| Client | DB records | DB facts | DB chunks | DB relationships | Private patterns | Search chunks |
|---|---:|---:|---:|---:|---:|---:|
| SkyHarbor Air | 6,094 | 55,956 | 6,094 | 5,200 | 9 | 6,094 |
| First Capital Financial | 2,227 | 24,474 | 2,227 | 1,800 | 6 | 2,227 |
| Meridian Health | 1,538 | 16,728 | 1,538 | 1,000 | 6 | 1,538 |
| Lakeshore Industries | 1,348 | 14,619 | 1,348 | 850 | 5 | 1,348 |
| Apex Retail | 1,644 | 17,548 | 1,656 | 1,000 | 6 | 1,656 |

## Completed

- Client-scoped truncate/archive/load ran through `job-phs-meridian-load2-0606`.
- Live DB read verification ran through the same ACA/VNet lane.
- Azure AI Search was rebuilt with `job-a24-search-rebuild-eus`.
- `tenant-context-v1` Search counts matched committed chunks for the refreshed clients.

## Still Pending

- Live signed-in browser QA for Home, Intelligence, Tower, and golden questions.
- DB `enterprise_context_chunks.embedding_status` remains `pending` because the
  current Azure Search rebuild uploads chunks but does not update that DB column.

## Key Evidence

- `job-logs-live-count-verify.txt`
- `job-logs-search-rebuild.txt`
- `execution-live-count-verify.json`
- `execution-search-rebuild.json`

