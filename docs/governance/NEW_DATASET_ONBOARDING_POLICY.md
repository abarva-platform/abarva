# New Dataset Onboarding Policy (PR-8)

Every new context/corpus dataset — for any tenant, from any agent (Codex, Claude
Code, Cursor) or operator — must pass through this gate **before** it loads. The
goal: a dataset can never be loaded "and governed later." Governance is declared
up front, in a manifest, and checked in CI.

## The rule

1. **Declare a manifest first.** Copy
   `DATASET_POLICY_MANIFEST_TEMPLATE.json`, fill it in, and commit it as
   `dataset-manifests/<dataset_id>.json`.
2. **It must pass CI.** `npm run validate:context-corpus:manifests` (part of the
   Context Corpus Governance workflow) validates schema, canonical tenant key,
   classification rules, and sensitive-data handling. A failing manifest blocks
   the PR.
3. **Then load.** Run the load (admin bulk loader, structured promotion, operator
   ACA job, etc.) declared in `ingestion_method`.
4. **Prove it, don't assume it.** If `retrieval_proof_required` is true (the
   default for any retrievable dataset), the dataset is not `agent_ready` until
   live signed-in retrieval + cite-render verification is shown (PR-3 readiness
   ledger + PR-5 runtime). "Loaded" ≠ "indexed" ≠ "retrievable" ≠ "cited."

## Manifest fields (see `src/lib/governance/dataset-manifest.ts`)

| Field                         | Meaning                                                                     |
| ----------------------------- | --------------------------------------------------------------------------- |
| `dataset_id` / `title`        | Stable id + human name.                                                     |
| `client_key`                  | Canonical key or `corpus_global` — **never a real client name**.            |
| `source_layer`                | One of the canonical `SOURCE_LAYERS`.                                       |
| `classification`              | `public`/`internal`/`confidential`/`pii`/`phi`/`restricted`.                |
| `owner`                       | Accountable person/team.                                                    |
| `source_basis`                | Where the content comes from (citation root).                               |
| `ingestion_method`            | How it loads.                                                               |
| `retrieval_plan`              | `postgres_fts` / `azure_ai_search` / `fts_plus_search` / `not_retrievable`. |
| `retrieval_proof_required`    | Whether live retrieval proof gates `agent_ready`.                           |
| `pii_phi_handling`            | Required for sensitive classifications.                                     |
| `approved_by` / `approved_at` | Human sign-off.                                                             |

## Hard rules enforced by CI

- `client_key` outside `CANONICAL_TENANT_KEYS` + `corpus_global` → **fail**.
- Sensitive (pii/phi/restricted) targeting `corpus_global` → **fail**.
- Sensitive classification without `pii_phi_handling` → **fail**.
- Unknown manifest fields (strict schema) → **fail**.
- Retrievable plan with `retrieval_proof_required: false` → **warn**.

This closes the framework: PR-1 contract → PR-3 readiness → PR-4 CI gate →
PR-5 runtime seam → PR-6 coverage → **PR-8 onboarding gate** ensures the next
dataset enters governed from the first commit.
