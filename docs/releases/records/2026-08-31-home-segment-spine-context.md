# 2026-08-31-home-segment-spine-context — Add deterministic segment context to Home packets

## Release ID

`2026-08-31-home-segment-spine-context`

## Status

`candidate`

## Plain-English Summary

Home page prompt packets now carry deterministic exhibits before the writer generates narrative:
the declared business-segment spine, cross-domain segment shares, source evidence tables, and full
selected source-file content. The writer is told to interpret those fixed tables rather than
recalculate, rename, or invent categories.

This closes the gap where executive pages could over-weight a prominent vendor or system fact
instead of starting from the enterprise profile, segment economics, ownership, spend, value, risks,
metrics, programs, and AI evidence.

## Layer Impact

Release lane: `global-control-lane`.

- **Layer 1 / client intake:** unchanged; reads existing source files.
- **Layer 2 / source adapters:** unchanged.
- **Layer 3 / canonical model:** unchanged.
- **Layer 4 / products:** no route change; Home packet-generation input is richer and more
  auditable.
- **Build/QA tooling:** adds package scripts for the deterministic application and segment-spine
  reporters.

## Client Applicability

- All clients: no, the current segment map is industry-shaped.
- Specific clients: no live-client applicability in this release.
- Internal only: yes.
- Public/demo only: no runtime behavior changes in this PR.
- Feature flag: none.

## Changes Included

- `scripts/ecl/build_source_intelligence_home_packets.mjs`
  - Adds `--segment-spine-report`.
  - Adds `segment_spine_context` to each Home page packet when supplied.
  - Adds `source_evidence_tables`, computed from the included full source files.
  - Updates the writer prompt contract to use deterministic tables as fixed exhibits.
- `scripts/ecl/__tests__/run-source-intelligence-home-packets-tests.mjs`
  - Verifies segment context, source evidence tables, and numeric summaries are present.
- `package.json`
  - Adds `data-build:application-segmentation`.
  - Adds `data-build:segment-spine`.

## QA / Validation

- PASS `npm run test:ecl-source-intelligence-home-packets`
- PASS `npm run data-build:segment-spine -- --tenant meridian-health --json /tmp/segment-spine.json`
- PASS Home packet build with `--inventory-dir` and `--segment-spine-report`
- PASS `npm run release:check`

## Rollout Plan

Merge to main. No migration, no data-plane mutation, no traffic change. The next Home narrative
generation run can consume the richer packet.

## Deployment Authority

- Repo-owned deploy workflow: not exercised.
- Shared runtime mutators: none.
- Approved image digest: not applicable.
- ACA runtime invariant: not affected.
- Worker image invariant: not affected.
- Feature/env flag update path: none.
- Live signed-in proof required: no route change in this PR.

## Rollback Plan

Revert the commit. Existing Home packets can still be generated without a segment-spine report.

## Audit Evidence

- Packet manifests include `source_content_context_count`, `source_evidence_table_count`, and
  `segment_spine_context_page_count`.
- Each packet carries source file hashes and deterministic table context.

## Known Gaps

- This PR does not itself regenerate or publish Home chapter prose.
- Program attribution is still a declared gap in the segment-spine reporter until sponsor-to-function
  mapping is explicitly modeled.
