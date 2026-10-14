# Intelligence Exhibit Transport Compatibility

## Release ID

`2026-10-14-intelligence-visual-transport`

## Status

`candidate`

## Plain-English Summary

Valid model-authored exhibits can arrive inside a generic JSON fence or as a standalone object instead of the requested named fence. Decode those exact supported shapes into native exhibits instead of displaying chart instructions as answer text. Keep ordinary JSON and unsupported payloads intact for review. Short explicit visual requests receive the analytical reading allowance so the requested exhibit is not needlessly folded away.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 4: Intelligence answer transport decoding, streaming preview, concise reading allowance and output-format guidance.
- Layers 1-3: unchanged. No source ingestion, readiness promotion, schema, metric, graph or tenant-data mutation.

## Client Applicability

- All clients: users of the existing model-authored Intelligence answer path.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: no; other product data paths remain unchanged.

## Changes Included

- Strict schema recognition for supported tables, charts and graphs in generic fences or standalone objects outside code examples.
- Streaming preview holds incomplete objects until they can be rendered; raw original output remains attached to the packet.
- Already-open conversations retain their historical packet validation for unchanged session export; new responses use the current decoder.
- Explicit empty source arrays are treated as empty metadata, not visible bracket text. Duplicate metadata remains observable.
- Short explicit chart and matrix requests use the existing analytical reading allowance.
- Reinforce named exhibit fences in the active synthesis contract, including visual follow-ups.

## QA / Validation

- Regression first reproduced missing exhibits from generic and bare transports before the decoder change.
- PASS: 94 focused tests across 10 suites covering parser, character-split streaming, concise component rendering, active page wiring and export. Includes a five-option advisory matrix, numeric chart values, graph and table preservation, escaped strings, unsupported objects, historical export compatibility and duplicate metadata.
- PASS: scoped ESLint, Node 24 repository typecheck, all 11 release gates and context-corpus governance; governance retains pre-existing approval-metadata warnings. Final tests, lint and typecheck were rerun after compatibility coverage.
- NOT RUN: protected merge, ACA deployment and signed-in acceptance at candidate preparation; no live acceptance claim yet.

## Rollout Plan

Run local tests, typecheck, lint, governance and release checks. Open a public-safe PR, squash merge through repository controls, then deploy the exact main commit using `.github/workflows/aca-main-deploy.yml`. Independently verify runtime and signed-in responses.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` only.
- Shared runtime mutators: workflow only; no local Azure template or traffic changes.
- Approved image digest: resolve from the successful main deploy.
- ACA runtime invariant: template and healthy 100%-traffic revision match the approved digest.
- Worker image invariant: every required deployment worker job matches the approved digest.
- Feature/env flag update path: none required.
- Live signed-in proof required: yes; categorical matrix, numeric comparison and ordinary nonvisual answer, with sources and follow-ups checked separately.

## Rollback Plan

Revert through a protected PR and redeploy via the same ACA workflow. No data rollback is required.

## Audit Evidence

PR diff, red/green regression results, local gates, deployment run, independent runtime invariant and private signed-in screenshots. Do not publish tenant-specific response payloads or runtime configuration.

## Known Gaps

This change does not certify source readiness, fix conversation isolation, add chart types, infer missing facts or rewrite malformed model output. Unsupported payloads remain reviewable; exact original output is preserved. Visual selection remains question- and evidence-dependent.
