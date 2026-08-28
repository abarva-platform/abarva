# 2026-08-28-home-ecl-executive-narrative-v2-design — Home ECL Executive Narrative V2 Design

## Release ID

`2026-08-28-home-ecl-executive-narrative-v2-design`

## Status

`candidate`

## Plain-English Summary

Adds a design contract for the next Home ECL narrative rebuild. The document defines how Home
should turn governed ECL facts and product signals into executive-grade narrative without exposing
row-count prose, implementation vocabulary, or unsupported synthesis.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 4 Products: documents the target Home projection narrative contract, including chapter
  output, signal-packet inputs, publication gates, and browser proof requirements.
- Layer 3 Canonical Enterprise Model: no schema or data changes. The document restates that facts,
  money, counts, relationships, and gaps remain owned by governed ECL data.
- Layer 1 and Layer 2: no intake or adapter changes. Future Tower, Source, Moves, Intelligence,
  and interview inputs are treated as signal sources rather than product-owned truth.

## Client Applicability

- All clients: applies as a design standard for Home ECL narrative generation.
- Specific clients: none.
- Internal only: design and delivery guidance for engineering and product agents.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- `docs/architecture/home-ecl-executive-narrative-v2-design-2026-08-28.md`

## QA / Validation

- `git diff --cached --check` passed before commit.
- Public-disclosure review completed: no private prospect names, screenshots, or confidential
  customer narrative details are included.

## Rollout Plan

No runtime rollout. The design becomes active for engineering once merged to `main`. Future
implementation work must add its own release record, tests, data-build proof, readback, and browser
evidence.

## Deployment Authority

- Repo-owned deploy workflow: not applicable.
- Shared runtime mutators: none.
- Approved image digest: not applicable.
- ACA runtime invariant: not applicable.
- Worker image invariant: not applicable.
- Feature/env flag update path: none.
- Live signed-in proof required: not for this documentation-only change.

## Rollback Plan

Revert the documentation commit if the design contract is superseded or replaced.

## Audit Evidence

- PR: `#6980`
- Architecture document: `docs/architecture/home-ecl-executive-narrative-v2-design-2026-08-28.md`

## Known Gaps

- This does not implement the V2 writer.
- This does not change Home runtime behavior.
- This does not publish a new narrative bundle.
- This does not validate the in-flight Tower or Source data additions.
