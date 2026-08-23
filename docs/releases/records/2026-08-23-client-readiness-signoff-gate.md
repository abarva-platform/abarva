# Release Record — Client-Readiness Sign-Off Gate

## Release ID

`2026-08-23-client-readiness-signoff-gate`

## Status

Merged — pending live proof.

## Plain-English Summary

Signing off a deliverable is the moment it becomes something a client can be
shown. This adds a check at that moment: if the document contains something a
client must never see, sign-off is refused.

Blockers refuse: UUIDs, content hashes, model names, schema identifiers and
unresolved placeholders. Review items — pipeline vocabulary, filler — never
refuse; they are reported and the reviewer decides.

The refusal names each finding, quotes the surrounding sentence, and explains
why it matters, so a reviewer can act without opening the file.

### The override, and why it exists

A reviewer who judges the findings acceptable can re-submit with
`acknowledgeReadinessBlockers: true`.

The override exists because the scanner is heuristic and has already been
observed to be wrong: an earlier ad-hoc version of these rules reported
internal hashes in eight documents that contained none. A gate with no way
past it turns every future false positive into a hard stop on real work, and
the predictable response is that somebody disables the gate.

It is not a bypass. The reviewer must acknowledge the specific findings, and
those findings are written to the program audit log under
`deliverable_signed_off_with_readiness_blockers`, with each one named. A later
reader can see that a document was signed off over three known leaks, and which
three. **"Signed off with known leaks" and "was clean" are different facts, and
the record has to keep them apart.**

### Nothing to scan is not the same as clean

A version with no content returns `not_scanned`, never `clear`. It still
permits sign-off — whether an empty deliverable is signable at all is another
guard's business — but this gate refuses to vouch for what it did not read.
That distinction is the whole point of the check.

## Layer Impact

Lane: `global-control-lane`. No other lane is affected.

Layer 4 (Products — Moves deliverable sign-off API). No canonical model change,
no schema change, no migration. The audit entry uses the existing
`program_audit_log` write path.

## Client Applicability

All clients receive this change — it is not feature-flagged and no client is
opted out. It affects the JSON sign-off path for every Moves deliverable type.
The multipart upload-approval path is untouched: a client-approved replacement
document is the client's own artifact and is not scanned.

## Changes Included

- `src/lib/deliverables/shared/client-readiness-gate.ts` (new) — the promotion
  policy: verdict, override handling, HTML-to-text reduction.
- `src/app/api/v1/programs/[programId]/deliverables/[deliverableId]/sign-off/route.ts`
  — reads the version's `content`, applies the gate, returns 422 with named
  findings, records an acknowledged override to the audit log, and reports the
  verdict on success.
- Two test files: 18 policy tests, 7 new route tests.

## QA / Validation

**Status: pass.**

- `jest .../client-readiness-gate.test.ts` — **pass**, 18/18.
- `jest .../sign-off/__tests__/route.test.ts` — **pass**, 11/11 (4 pre-existing
  - 7 new), covering: refusal with both findings named; the escape hatch being
    named in the refusal; acknowledged override proceeding; the audit entry
    carrying the exact accepted findings; no audit entry on a clean document;
    review-only findings not blocking; and `not_scanned` for absent content.
- `tsc --noEmit` — **pass**, clean. `eslint` — **pass**, clean.
- `integrity:dom` — **pass**, `violations=0`.
- `jest src/lib/deliverables` — failing-suite set byte-identical to the
  pre-change baseline, verified by stashed comparison.

## Rollout Plan

Standard main deploy through the repo-owned ACA main deploy workflow. No flag.

## Deployment Authority

`.github/workflows/aca-main-deploy.yml` only.

## Rollback Plan

Revert and redeploy. No migration to unwind. Reverting removes the gate; no
persisted state depends on it, and audit entries already written remain valid.

## Audit Evidence

No tenant data was read or mutated to produce this record. Route tests use
mocked tenancy and a mocked data plane.

## Known Gaps

- **Generation is not gated, only sign-off.** A leaky document can still be
  generated and sit in the vault; it just cannot be signed. Scanning at
  generation time would surface it earlier and is the natural follow-up.
- **The upload-approval path is deliberately not scanned.** A client-approved
  replacement is the client's own document, and refusing it on our rules would
  be wrong. This is a judgement call worth revisiting if uploads become a
  common route for AI-drafted content.
- **DOCX and PPTX are not scanned here.** The gate reads
  `deliverable_versions.content`, which is HTML or text. The extraction path
  for Office formats exists (`office-text-extract.ts`) and is used by the CLI,
  but is not wired into this route.
- The rules remain heuristic and English-only. They catch identifier-shaped and
  phrase-shaped problems; they do not judge whether an argument is sound or a
  figure correct.
