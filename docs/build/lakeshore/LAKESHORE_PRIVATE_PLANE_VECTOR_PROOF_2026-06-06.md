# Lakeshore Private-Plane Vector Proof

Date: 2026-06-06
Client: Lakeshore
Scope: Kyriba / treasury wave 1 context activation
Evidence status: private-plane proof captured

## Executive Read

The Lakeshore Kyriba / treasury corpus is no longer only a governed loader success in the application database. It has also been activated and verified inside the private Azure substrate.

The key unblock was architectural, not content-related: Azure AI Search is intentionally private-network restricted, so a local machine cannot be the source of truth for vector/search proof. The proof has to run from the Azure private execution plane with managed identity.

## What Was Blocking

| Blocker | Truth | Resolution |
|---|---|---|
| Local Azure Search calls failed | Expected. The Search service has public network access disabled. | Run proof from Container Apps inside the private plane. |
| First private job failed on schema | Private job database lagged the app database and did not yet have `genome_patterns.doctrine_context`. | Applied additive private-plane migration before load. |
| Search upload needed private network + identity | Local API-key/AAD attempts are not authoritative because source network is denied. | Used Container Apps job with managed identity and Key Vault-backed secrets. |
| Corpus proof was split | App DB loader was green, but vector/Search proof was still missing. | Loaded and queried the private Search index from inside Azure. |

## What Was Loaded

| Area | Result |
|---|---:|
| Lakeshore Kyriba / treasury patterns | 12 |
| Pattern graph edges | 26 |
| Azure AI Search documents uploaded | 12 |
| Azure AI Search upload statuses | 12 x `201` |
| Search filter proof | `tenant_scope eq 'lakeshore'` returned 12 |

## Private-Plane Executions

| Execution | Purpose | Result |
|---|---|---|
| `job-lsh-vector-wave1-eus-jy268d1` | Apply private DB schema alignment, load 12 patterns and 26 edges, embed, upload to Azure Search. | Succeeded; upload statuses all `201`. |
| `job-lsh-vector-wave1-eus-yofotrs` | Delayed private-plane Search read proof after indexing. | Succeeded; count `12`; Kyriba query returned ranked hits. |

## Search Proof

Private-plane query:

```text
search = *
filter = tenant_scope eq 'lakeshore'
index = lakeshore-patterns-v1
```

Result:

```json
{
  "ok": true,
  "count": 12,
  "anyHits": [
    "LSH-TMS-004",
    "LSH-TMS-010",
    "LSH-TMS-002",
    "LSH-TMS-009",
    "LSH-TMS-001",
    "LSH-TMS-011",
    "LSH-TMS-006",
    "LSH-TMS-008",
    "LSH-TMS-005",
    "LSH-TMS-007",
    "LSH-TMS-003",
    "LSH-TMS-012"
  ]
}
```

Kyriba / treasury query:

```text
search = Kyriba treasury bank connectivity ERP feed
filter = tenant_scope eq 'lakeshore'
index = lakeshore-patterns-v1
```

Top returned hits:

| Pattern | Title | Why It Matters For Demo |
|---|---|---|
| `LSH-TMS-003` | ERP feed quality scorecard is the reconciliation gate | Shows AbarVa understands Kyriba failure caused by GL/AP/AR feed quality. |
| `LSH-TMS-012` | Banking consolidation Source event should precede automation of fragmentation | Connects treasury rollout success to Source/vendor/bank optimization. |
| `LSH-TMS-002` | Bank connectivity matrix clears before rollout confidence is claimed | Names the H2H/SWIFT readiness gate before the rollout burns time. |
| `LSH-TMS-001` | Daily cash pre-walk remains mandatory after Kyriba feeds automate | Prevents the demo from sounding like naive automation-only AI. |
| `LSH-TMS-004` | Entity hierarchy and account registry prevent treasury misclassification | Connects holding-company complexity to treasury controls. |

## Current Truth

| Layer | Status | Evidence |
|---|---|---|
| App DB governed loader | Green | Commit-mode loader inserted 12 patterns and 26 edges; ingestion run recorded. |
| Private job DB | Green for this wave | Private job applied additive schema alignment and loaded the 12-pattern wave. |
| Azure AI Search | Green for this wave | Private-plane proof returned `count: 12` and Kyriba-ranked hits. |
| Live product retrieval | Still must be proven | The app must visibly use these private/Search-backed patterns in Lakeshore Intelligence/Moves/Source/Tower flows. |

## Rerun Standard

Do not prove private Azure Search from a laptop. Rerun through an Azure Container Apps job in the approved private execution environment.

Minimum rerun checks:

1. Confirm the job runs in `rg-abarva-controlplane-lab-eastus`.
2. Confirm it uses the private Container Apps environment and managed identity.
3. Apply additive schema checks before loading.
4. Upsert the Lakeshore `LSH-TMS-*` patterns and edges.
5. Generate embeddings with the configured provider key from Container Apps secrets.
6. Upload to `lakeshore-patterns-v1`.
7. Query with `tenant_scope eq 'lakeshore'`.
8. Capture count and ranked Kyriba hits.

The proof is not complete unless both write and read are green:

```text
write: patterns loaded + embeddings generated + Search upload status 201
read: Search count > 0 + Kyriba query returns LSH-TMS hits
```

## What Still Gates Finish

This closes the private-plane vector activation gap. It does not by itself prove the buyer demo.

Remaining finish gates:

1. Signed-in Lakeshore product routes must retrieve and cite this context.
2. Agent answers must use the CXO response shape and evidence-gap discipline.
3. Source/Moves/Tower screenshots must show persisted workflow artifacts, not just chat output.
4. The 100-question CXO QA report must open cleanly from the HTML proof page.
5. The MP4 and detailed HTML must label seeded/demo versus live-loader-backed proof.
