# 2026-06-03-cxo-corpus-context-operating-model — CXO Corpus and Context Operating Model

## Release ID

`2026-06-03-cxo-corpus-context-operating-model`

## Status

`candidate`

## Plain-English Summary

Adds a standalone CXO-facing HTML explainer that describes how AbarVa updates research, corpus
materials, pattern packs, tenant context, rate cards, and client overrides; how those updates are
parsed and committed into the data plane; how Moves and Source agents use the material; and how the
platform minimizes hallucination.

## Layer Impact

- `internal-admin`: Founder/operator documentation for explaining the corpus/context operating model.
- `global-control-lane`: No runtime behavior changes, but the document describes the shared
  governance model for future corpus and Data Loads work.

## Client Applicability

- All clients: Conceptual model applies to all client deployments.
- Specific clients: None.
- Internal only: Primary audience is Anand, founders, product, engineering, and CXO-facing demos.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- `docs/build/CXO_CORPUS_CONTEXT_OPERATING_MODEL_2026-06-03.html`

## QA / Validation

- Pass: HTML is standalone and uses no external scripts or runtime dependencies.
- Pass: `git diff --check`.
- Pass: `npm run release:check -- --base origin/main --head HEAD`.

## Rollout Plan

Merge to `main`. This is a documentation artifact only; no Vercel runtime rollout is required.

## Rollback Plan

Revert the documentation PR.

## Audit Evidence

- PR URL: pending.
- Document path: `docs/build/CXO_CORPUS_CONTEXT_OPERATING_MODEL_2026-06-03.html`.

## Known Gaps

- This document is explanatory. It does not implement the future Pattern Studio UI, rate-card commit
  tables, or Source/RFP divergence scoring by itself.
