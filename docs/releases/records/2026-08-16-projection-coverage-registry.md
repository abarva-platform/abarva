# 2026-08-16-projection-coverage-registry — Projector registry and projection coverage gate

## Release ID

`2026-08-16-projection-coverage-registry`

## Status

`candidate`

## Plain-English Summary

Products are fed by three independent supply chains today: client intake resolves through the
canonical model, operational telemetry runs its own ingest, and the corpus is assembled alongside
both. All three work. What was missing was any statement of which canonical object types are
supposed to reach which product — so a type could be produced on every refresh, consumed by
nothing, and nobody would notice.

That is not hypothetical. `spend_value_fact` — 44 records per refresh, the client's own declared
spend — reaches no product. Tower answers spend questions from metered cloud cost through a separate
pipeline. Neither number is wrong; nothing declared which one a surface used, and nothing failed.

This adds a registry where each projector declares the canonical types it consumes, and a gate that
checks that declaration against what the canonical build actually emits.

Current reading: **19 canonical types, 2 reaching a product (11%)**, one surface on the spine, four
fed by other paths.

## Layer Impact

**Release lane: `internal-admin`.** Operator tooling and a declaration module. No runtime code path
changes, no data written, no product surface affected.

- **Layer 1–3:** unchanged. The gate reads the canonical build's source to determine emitted types;
  it does not run the build or write anything.
- **Layer 4:** unchanged behaviour. The registry describes existing projectors; it does not alter
  them.

## Client Applicability

- All clients: no
- Internal only: yes
- Feature flag: none

## Changes Included

- `src/lib/enterprise-data/projection/projector-registry.ts` — canonical type list, projector
  registration shape, and coverage helpers.
- `scripts/audit/validate-projection-coverage.mjs` — the gate.
- `package.json` — `validate:projection-coverage` and `validate:projection-coverage:strict`.

## QA / Validation

- Pass: `npm run validate:projection-coverage` — exit 0, reports 2 of 19 types covered.
- Pass: `npm run validate:projection-coverage:strict` — exit 1, as intended against the known gap.
- Pass: `npx eslint` on both new files.
- Pass: `NODE_OPTIONS="--max-old-space-size=12288" npx tsc -p tsconfig.json --noEmit` — 0 errors.
- Pass: `npm run release:check`.

**Fault injection**, before the gate was trusted:

| Injection | Result |
| --- | --- |
| Registry declares a type the build does not emit | Caught — named the type and the remedy |
| Projector consumes a non-existent type | Caught — named the projector and the type |
| `--strict` against the real coverage gap | Exit 1, as designed |
| Clean tree, default mode | Exit 0 |

## Rollout Plan

Merge to main. No runtime rollout: no image behaviour change, no migration, no flag, no data load.

## Deployment Authority

Not applicable — cannot affect Container Apps, runtime images, flags, environment variables, worker
jobs, traffic, or DNS.

## Rollback Plan

Revert the commit. Nothing persists outside the repository.

## Audit Evidence

- The commit and its PR.
- `npm run validate:projection-coverage` output showing 19 types, 2 covered, 17 uncovered.
- Fault-injection results above.

## Known Gaps

- **The default mode does not enforce coverage.** Turning the gate on at full strength today would
  fail every build for a gap that is already known and is being closed deliberately. A gate that
  fails for a reason nobody can act on immediately gets muted, and a muted gate protects nothing.
  `--strict` becomes the default once the spine work lands.
- **The registry is hand-maintained.** A projector added without a registry entry is invisible to
  the gate. Deriving registrations from the implementations themselves would close this, and is the
  natural follow-up.
- **`parallel_source` is recorded, not resolved.** Registering `project-tower-mart` as reading
  `public.tower_*` makes the gap measurable; it does not rehome it. That is the next slice.
- The gate reads emitted types by scanning the canonical build's source for `objectType:` literals.
  If that build ever emits a type computed at runtime rather than written as a literal, the scan
  would miss it. Acceptable today because the build declares them literally; worth revisiting if
  that changes.
