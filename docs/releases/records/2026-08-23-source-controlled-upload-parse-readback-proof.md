# 2026-08-23-source-controlled-upload-parse-readback-proof

## Release ID

`2026-08-23-source-controlled-upload-parse-readback-proof`

## Status

`candidate`

## Plain-English Summary

Adds a non-mutating proof harness for Source evidence intake. The harness uses
the real CSV/XLSX parser, structured template mapper, document parse/validate
logic, and fact write seam, but swaps the database writer for an in-memory
capture adapter. It proves bytes become parsed rows, mapped facts are persisted
to the seam, parsed document candidates require human decisions before commit,
and readback can be inspected without touching production data.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 1 client intake: validates that uploaded CSV/XLSX-style inputs preserve
  headers and rows before mapping.
- Layer 2 source adapters: validates deterministic header-to-fact mapping and
  document parse/validate behavior using existing adapter code.
- Layer 3 canonical model: no canonical schema or data changes.
- Layer 4 products: no runtime UI or route behavior changes; this is a proof and
  QA harness only.

## Client Applicability

- All clients: the proof covers shared Source evidence-intake mechanics.
- Specific clients: none.
- Internal only: yes, as an engineering proof harness.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `scripts/source/controlled-upload-parse-readback-proof.ts`
- `package.json` script:
  `source:controlled-upload-parse-readback:proof`

## QA / Validation

Status: pass.

- Pass: `npm run source:controlled-upload-parse-readback:proof -- --out-dir /tmp/source-lane2-upload-parse-proof`
- Pass: focused Source parser/route tests for file parsing, structured mapping,
  parse/commit, and upload routes (`7` suites, `82` tests).
- Pass: `npm run release:check`

## Rollout Plan

Merge to main. No Azure Container Apps runtime rollout is required for this
proof harness because no product route, runtime component, migration, feature
flag, or data-plane object changes.

## Deployment Authority

- Repo-owned deploy workflow: not required for this script-only proof.
- Shared runtime mutators: none.
- Approved image digest: not applicable.
- ACA runtime invariant: not applicable.
- Worker image invariant: not applicable.
- Feature/env flag update path: none.
- Live signed-in proof required: no; this does not change signed-in runtime
  behavior.

## Rollback Plan

Revert the script, package script entry, and this release record. No data
rollback is required because the harness performs no production mutation.

## Audit Evidence

- Local proof JSON/Markdown emitted by the harness.
- Focused parser/route test output.
- Release check output.

## Known Gaps

Live upload -> parse -> production persistence -> database readback remains
intentionally gated. Running that final write requires an approved tenant/event,
controlled apply command, pre/post counts, route or operator proof, and
independent readback.
