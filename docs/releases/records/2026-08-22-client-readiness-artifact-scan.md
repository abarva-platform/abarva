# Release Record — Client-Readiness Artifact Scan

## Release ID

`2026-08-22-client-readiness-artifact-scan`

## Status

Merged. Operator tooling only — no product surface changes, nothing wired into
the generation path yet.

## Plain-English Summary

An offline check that reads a generated Move artifact the way a client would
and reports anything that should never reach them.

It covers `.docx`, `.pptx`, `.html`, `.md` and `.txt`, and flags UUIDs, content
hashes, model names, schema identifiers, internal reference codes, unresolved
placeholders, pipeline vocabulary and filler language. Blockers and
review-items are counted separately, because some findings are unambiguous
leaks and some need a human to judge in context.

```
npm run moves:scan-artifacts -- <path or directory>
```

Exit codes: `0` clean · `1` blockers found · `2` unreadable documents · `3`
usage error.

### Why this exists, and why extraction is separate from scanning

An earlier ad-hoc version of this check fetched fifteen live artifacts and
parsed each as HTML. Ten of them were DOCX. The ZIP byte stream parsed as
markup produced garbage, the garbage matched a hex pattern, and the scan
reported internal hashes in eight documents. Every one was false. The real
content had never been read at all.

Two properties are built in as a result:

1. **Extraction is a separate, typed step.** A document that cannot be read
   returns `ok: false` with a reason, and there is no `text` field for a caller
   to scan. The failure mode is unrepresentable rather than merely unlikely.
2. **Unreadable is never clean.** The CLI prints `UNREADABLE … NOT scanned —
do not treat as clean`, counts it separately, and exits `2`. Silence about a
   file we failed to open is exactly how the false positives happened.

### Why every rule has a negative test

A scanner people stop trusting is worse than no scanner, because it launders
real findings into ignorable noise. So each rule is pinned in both directions.
Concretely, the scan must flag `engagement_id` and must **not** flag
`human_approval` or `external_benchmark` — both observed in a real architecture
document, both legitimate prose about governance behaviour.

Similar negatives: a long run of digits is not a content hash; `#1B2B5C` is
not a hash; `AI-DRIVEN` is not an internal reference code; "the predictive
model" is not a model name; and `[EVIDENCE MISSING — …]` is our deliberate
reader-facing gap marker, not an unfilled template.

## Layer Impact

Lane: `internal-admin`. No other lane is affected.

No layer changes. Two new pure modules under
`src/lib/deliverables/shared/`, one operator CLI, one npm script. No product
surface reads them yet.

## Client Applicability

Not applicable — internal operator tooling. No client receives a behaviour
change; nothing is rendered differently and no generation path is altered.

## Changes Included

- `src/lib/deliverables/shared/client-readiness-scan.ts` (new) — the rules.
- `src/lib/deliverables/shared/office-text-extract.ts` (new) — DOCX/PPTX text
  extraction via the existing `jszip` dependency, with a ZIP-signature guard.
- `scripts/moves/scan-artifacts.ts` (new) — the CLI.
- `package.json` — adds `moves:scan-artifacts`.
- Two test files, 52 tests.

## QA / Validation

**Status: pass.**

- `jest .../client-readiness-scan.test.ts` — **pass**, 36/36.
- `jest .../office-text-extract.test.ts` — **pass**, 16/16.
- `tsc --noEmit` — **pass**, clean. `eslint` — **pass**, clean.
- `jest src/lib/deliverables` — failing-suite set byte-identical to the
  pre-change baseline, verified by stashed comparison.
- **End-to-end CLI proof** against four purpose-built fixtures:
  - a clean DOCX → `CLEAN`
  - a DOCX whose only leak is a UUID and model name **in the footer** →
    both found, proving header/footer parts are read
  - a PPTX with `[INSERT CLIENT NAME]` on slide 2 → blocker
  - an HTML error page named `.docx` → `UNREADABLE`, refused, not scanned
- All four exit codes verified individually (0, 1, 2, 3).

One rule defect was found and fixed by its own test: the model-name pattern
stopped at the first hyphen, so `claude-sonnet-5` — the exact string found
leaking on a live page — did not match.

## Rollout Plan

No deploy required; the tooling is not on a request path. It ships with the
next ordinary main deploy.

## Deployment Authority

`.github/workflows/aca-main-deploy.yml` only.

## Rollback Plan

Revert. Nothing depends on these modules, so rollback removes the tooling and
changes no behaviour.

## Audit Evidence

Test fixtures are synthetic and generated in a scratch directory. No tenant
artifact was downloaded, copied, or mutated to produce this record.

## Known Gaps

- **Not wired into generation or the release gate.** It is a manual check
  today. Running it automatically after a phase build, and blocking promotion
  on `blockers > 0`, is the obvious next step and is deliberately not bundled
  here.
- The rules are heuristic and English-only. They catch identifier-shaped and
  phrase-shaped problems; they do not judge whether an argument is any good, or
  whether a figure is correct. "Client-grade substance, not consultant filler"
  is only partly mechanisable, and the filler list is intentionally short and
  high-precision rather than broad.
- Vendor and procurement realism is not checked at all. That needs domain
  rules, not pattern matching.
- PDF is not supported.
- The ten DOCX artifacts on the reserved Move that prompted this work have
  **not** yet been scanned — that requires downloading them, which is a
  separate operator step.
