# 2026-08-17-canonical-fact-basis — Fact basis on canonical records

## Release ID

`2026-08-17-canonical-fact-basis`

## Status

`candidate`

## Plain-English Summary

The same metric legitimately arrives twice by different routes, and the two do not match. A client
intake workbook declares annual spend of $44M; metered cloud cost reports $51M. Neither is wrong —
one is a budget, the other is consumption.

Until now there was no way to say which was which. That left three options, all of them lossy:
overwrite one with the other, keep them in separate stores so they never meet, or mark the metric
`CONFLICT` and refuse to quote it at all. Every option discards the 16% gap, which is the most
useful thing either number can tell you.

This adds `basis` to every canonical fact — `declared`, `observed`, or `derived` — so one model can
hold both and the difference becomes a fact in its own right.

It also corrects a definition. `CONFLICT` should mean *two sources of the same basis disagree*. Two
different bases differing is not a conflict; it is the finding.

## Layer Impact

**Release lane: `internal-admin`.** A contract field and an audit gate. No runtime code path
changes, no data written, no product surface affected.

- **Layer 1–2:** unchanged.
- **Layer 3:** `SourceAuthority` gains an optional `basis`. The canonical build sets `declared` on
  every record it produces, which is accurate — everything from a client intake workbook is the
  client asserting something about themselves.
- **Layer 4:** unchanged.

## Client Applicability

- All clients: no
- Internal only: yes
- Feature flag: none

## Changes Included

- `src/lib/enterprise-data/contracts/canonical-ingestion.ts` — `FactBasis` type and the optional
  `basis` field on `SourceAuthority`.
- `src/lib/enterprise-data/canonical-build/canonical-tenant-data-build.ts` — sets `basis: "declared"`.
- `scripts/audit/validate-fact-basis.mjs` — the gate.
- `package.json` — `validate:fact-basis` and `validate:fact-basis:strict`.

## QA / Validation

- Pass: `npm run validate:fact-basis` — 5,553 canonical records, all `declared`, exit 0.
- Pass: `NODE_OPTIONS="--max-old-space-size=12288" npx tsc -p tsconfig.json --noEmit` — 0 errors.
- Pass: `npx eslint` on all three changed files — 0 errors.
- Pass: `npm run test:behaviors` — 195 tests.
- Pass: `npm run release:check`.

**Fault injection.** Removing `basis` from the canonical build makes the gate fail, naming the
record count and the affected object types. Restoring it returns exit 0.

## Rollout Plan

Merge to main. No runtime rollout: no migration, no flag, no data load. The `basis` field is
optional on the contract, so nothing that does not set it breaks.

## Deployment Authority

Not applicable — cannot affect Container Apps, runtime images, flags, environment variables, worker
jobs, traffic, or DNS.

## Rollback Plan

Revert the commit. The field is additive and optional; nothing persists.

## Audit Evidence

- The commit and its PR.
- `npm run validate:fact-basis` output.
- Fault-injection result above.

## Known Gaps

- **No fact yet carries two bases**, because the ten telemetry collectors still write to
  `public.tower_*` rather than the canonical model. The gate reports this honestly rather than
  implying the capability is exercised. It becomes live when those collectors are rehomed.
- **`--strict` is not the default.** It fails when a metric carries two bases without a derived
  variance, which cannot happen until the above lands. Making it default now would be a gate that
  can never fire.
- **The `CONFLICT` definition is corrected in this record and in code comments, but the fact
  lineage reporter has not been updated to apply it.** Until it is, two bases of the same metric
  would still be reported as a conflict by that tool. That is the next change, not this one.
- Default-to-`declared` when `basis` is omitted is deliberate: intake is the common path, so the
  burden of declaring provenance falls on collectors reading live systems, which are the exception.
