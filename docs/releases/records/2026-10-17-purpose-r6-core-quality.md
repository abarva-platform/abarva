# Export evidence context and page-quality controls

## Release ID

`2026-10-17-purpose-r6-core-quality`

## Status

`draft` - review-branch candidate. No runtime enrollment or deployment.

## Plain-English Summary

Preserve a structured paragraph's citations when evaluating its individual sentences. Separate
conditional decision language from factual absence claims without allowing an unsupported premise
to inherit a conditional exemption. Short semantic labels no longer prevent an otherwise exact
cited claim from matching its evidence.

The charter contract now requires decision rationale, complete material controls, phase-specific
input acceptance tests and an explicit Discovery return within the existing word ceiling. Shared
and offline prompts use one set of title and scope-note limits. Native exports retain declared
scalar periods and locatable upstream references; neither is inferred from names or chart windows.

## Layer Impact

Release lane: `experimental`.

- Layers 1-3: no tenant data, source measurements, approvals or canonical-record mutations.
- Layer 4: experimental export validation, prompt consistency, native formatting and metadata
  propagation. The offline proof harness reuses these controls on hash-pinned inputs.

## Client Applicability

- All clients: none enrolled by this candidate.
- Specific clients: none.
- Internal only: synthetic artifact-quality verification.
- Public/demo only: no public route or media change.
- Feature flag: `moves_purpose_page_design_v1` remains unenrolled.

## Changes Included

- Structured citation context and clause classification, with wrong-source and missing-source tests.
- A measured charter word ceiling, including tables and action rows, not citation markers.
- Declared scalar-period validation and shared native value formatting.
- Explicit upstream reference metadata passed from evidence to the source register.
- Balanced scope columns for qualified headings and locatable source-use lists.
- A single authoritative prompt contract instead of conflicting title and scope limits.
- Complete native workflow annotations, with a compact vertical layout for long handoff descriptions.
- Display-size figures, per-chart trend captions, source-register column allocation and cover-title integrity.
- Independent scope lists, natural charter pagination and reclaimed space beneath short slide headings.

## QA / Validation

Native golden text checks cover 432 blocks with zero flags. All four fresh-writing artifacts
render through the current core into 37 pages. Read-only source re-extraction verifies 79 scalar
bindings and 40 chart points; all four current story audits pass and the reviewed image hashes match.
Native workflow inspection rejects missing step text and missing exception/annotation content.

Independent automated page-review scores are 77, 73, 73 and 76. These remain below the minimum
85 per artifact and below the requested target near 90. No output is accepted. Source provenance
checks do not establish financial validation or entailment of every positive narrative claim.
The review protocol was reconciled with the existing permitted repetition, exception-path and
trend thresholds; the scoring weights and acceptance bar were not changed. Earlier reviews and
rejected attempts remain in the private proof.

Final checks passed: 78 suites / 1,325 tests, Node 24 TypeScript, changed-file ESLint,
diff whitespace and all 11 release gates. The private review page passes browser checks at
1440 and 390 pixels: all 43 images and local links load, with no horizontal overflow or page errors.
Human visual acceptance, production orchestration wiring and live signed-in export proof remain
uncompleted. Tests, automated scores and human acceptance are separate claims.

## Rollout Plan

Keep the parent PR draft and enrollment empty through the four-output review. Every output must
render, preserve traceable numbers and approval states, and meet the review threshold. A separate
accepted release is required before main merge or shared runtime activation.

## Deployment Authority

- Repo-owned main deploy workflow: not invoked.
- Shared web/worker images, traffic, flags and environment: unchanged.
- Approved image digest: not applicable to this offline review.
- ACA runtime invariant and signed-in proof: not claimed by this candidate.

## Rollback Plan

Revert this candidate's commits on the review branch. Existing runtime behavior remains behind
the unchanged feature gate. Preserve prior proof editions and rejected responses.

## Audit Evidence

Private proof bundle `purpose-r6-review-20261017`. No source contents, client-specific findings
or private filesystem paths are published in this record.

## Known Gaps

Four-case visual acceptance fails the numerical threshold. Remaining issues include sparse
continuations, incomplete source-use limitations, phase classification and authorization-condition
rationale. No automated score substitutes for human page review. Later-phase expansion and
production enrollment remain outside this candidate.
