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
   ACA job, etc.) declared in `ingestion_method`. A loader that writes through the
   data plane reads this registry first and refuses to execute unless the manifest
   carries a `load_approval` for the exact version it is about to load (see
   [Load approval](#load-approval)).
4. **Prove it, don't assume it.** If `retrieval_proof_required` is true (the
   default for any retrievable dataset), the dataset is not `agent_ready` until
   live signed-in retrieval + cite-render verification is shown (PR-3 readiness
   ledger + PR-5 runtime). "Loaded" ≠ "indexed" ≠ "retrievable" ≠ "cited."

## Manifest fields (see `src/lib/governance/dataset-manifest.ts`)

| Field                         | Meaning                                                                     |
| ----------------------------- | --------------------------------------------------------------------------- |
| `dataset_id` / `title`        | Stable id + human name.                                                     |
| `tenant_scope`                | `canonical_tenant`, `corpus_global`, or `move_registry`.                    |
| `client_key`                  | Required canonical key for fixed tenant datasets; `corpus_global` for shared corpus; null for `move_registry`. Never a real client name. |
| `source_layer`                | One of the canonical `SOURCE_LAYERS`.                                       |
| `classification`              | `public`/`internal`/`confidential`/`pii`/`phi`/`restricted`.                |
| `owner`                       | Accountable person/team.                                                    |
| `source_basis`                | Where the content comes from (citation root).                               |
| `ingestion_method`            | How it loads.                                                               |
| `retrieval_plan`              | `postgres_fts` / `azure_ai_search` / `fts_plus_search` / `move_scoped_prompt_context` / `not_retrievable`. |
| `retrieval_proof_required`    | Whether live retrieval proof gates `agent_ready`.                           |
| `pii_phi_handling`            | Required for sensitive classifications.                                     |
| `approved_by` / `approved_at` | Human sign-off for declaring the dataset. It does not approve loading it.   |
| `load_approval`               | Optional until a load is approved. A named person's approval for ONE exact version: `approved_by`, `approved_at`, `assessment_id`, `source_set_hash`, `release_record`. |
| `serving_approval`            | Optional until that loaded version is approved for a product surface. The same fields plus `surface` (`home`). Requires a `load_approval` for the same version. |

## Hard rules enforced by CI

- `client_key` outside `CANONICAL_TENANT_KEYS` + `corpus_global` → **fail**.
- `move_registry` requires `client_key: null`; runtime tenancy is resolved from the authenticated Move and canonical tenant registry, never from a manifest, filename, or folder.
- `canonical_tenant` requires a canonical `client_key`; `corpus_global` requires `client_key: "corpus_global"`.
- Sensitive (pii/phi/restricted) targeting `corpus_global` → **fail**.
- Sensitive classification without `pii_phi_handling` → **fail**.
- Unknown manifest fields (strict schema) → **fail**.
- `load_approval.approved_by` or `serving_approval.approved_by` naming an agent, a team, a role or a delegation → **fail**.
- A `release_record` in either approval that is not an existing `docs/releases/records/*.md` file → **fail**.
- `serving_approval` without a `load_approval`, or for a different assessment or source-set hash than it → **fail**.
- The manifest's own `approved_by` naming an agent, a team, a role or a delegation → **warn**.
- Two manifests declaring the same `dataset_id` → **fail**.
- Retrievable plan with `retrieval_proof_required: false` → **warn**.

## Load approval

Declaring a dataset and loading it are two decisions. The manifest's `approved_by`
covers the first. A data-plane load needs the second, recorded in the same manifest:

```json
"load_approval": {
  "approved_by": "<the approving person's name>",
  "approved_at": "YYYY-MM-DD",
  "assessment_id": "<the assessment the load writes>",
  "source_set_hash": "<sha256 of the exact source set>",
  "release_record": "docs/releases/records/<record>.md"
}
```

- It is bound to one assessment and one source-set hash. If the data changes, the
  hash changes, the approval no longer matches, and the loader refuses again.
- The loader finds the manifest by the `dataset_id` it declares, never by filename,
  and also checks that the manifest's tenant, `ingestion_method` and
  `expected_object_count` describe what it is about to load.
- A value the job supplies about itself (an environment flag, an operator string)
  cannot stand in for it. The job's release-record binding must equal the one the
  approval names.
- The check on `approved_by` refuses strings that plainly are not a person. It
  cannot prove who typed the name; the control is that the approval is a committed,
  reviewed line. An agent must not write it on a person's behalf.
- Approving a load is not reviewing its rows. Loaded rows stay `not_reviewed` until
  a review step says otherwise.

## Serving approval

Loading a version does not approve showing it to anyone. Selecting a loaded version
for a product surface is a third decision, recorded beside the load approval:

```json
"serving_approval": {
  "approved_by": "<the approving person's name>",
  "approved_at": "YYYY-MM-DD",
  "assessment_id": "<the same assessment>",
  "source_set_hash": "<the same sha256>",
  "release_record": "docs/releases/records/<record>.md",
  "surface": "home"
}
```

- It needs a `load_approval` for the same assessment and source-set hash.
- A job that changes what a surface serves refuses without it. A check-only run
  reports the decision and changes nothing.
- Retiring a served version, which returns the surface to what it served before,
  does not need it.

Enforced today by `resolveLoadApproval` and `resolveServingApproval` in
`src/lib/governance/dataset-manifest.ts`: the synthetic enterprise context loader
and its Home projection job require the load approval, and its Home promotion job
requires the serving approval. Other loaders do not read either yet.

This closes the framework: PR-1 contract → PR-3 readiness → PR-4 CI gate →
PR-5 runtime seam → PR-6 coverage → **PR-8 onboarding gate** ensures the next
dataset enters governed from the first commit.
