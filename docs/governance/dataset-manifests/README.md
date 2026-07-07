# Dataset manifests

One JSON manifest per context/corpus dataset, validated by
`npm run validate:context-corpus:manifests` (and the Context Corpus Governance CI
workflow). A NEW dataset must land its manifest here **before** it loads — see
`../NEW_DATASET_ONBOARDING_POLICY.md`.

- Copy `../DATASET_POLICY_MANIFEST_TEMPLATE.json`, fill it in, save as
  `<dataset_id>.json` in this directory.
- `client_key` must be a canonical key or `corpus_global` — never a real client
  name (Meridian = PHS cover, Lakeshore Holdings = Morgan Street cover, etc.).
- Sensitive (pii/phi/restricted) datasets must declare `pii_phi_handling` and may
  not target `corpus_global`.
- Schema + rules: `src/lib/governance/dataset-manifest.ts`.

Files beginning with `_` (and this README) are ignored by the validator.
