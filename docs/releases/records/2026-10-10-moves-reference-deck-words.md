# 2026-10-10 — Moves reference deck words and figures

## Release ID

`2026-10-10-moves-reference-deck-words`

## Status

`candidate — signed-in proof pending`

## Plain-English Summary

The read-only deck preview now asks Claude for structured slide words using a
profile selected from the edition, use-case type, phase stage and available
reads. Claude sees figure slot names and meanings, never their values. The
server substitutes each slot from the governed value case, approved ROM,
assumptions register, approved public-source feed or accepted owner readback.
Missing inputs remain visible phrases. The numeric guard rejects any model-
written digit, currency or magnitude outside a known, edition-allowed slot.

A failed words call or rejected slide uses a sentence-form fallback. The
response and signed-in walk identify the reason, and the fidelity score deducts
points for fallback slides. The old `draft words unavailable` marker cannot be
rendered. The value-case reader distinguishes an authoritative absent P4 model
from a genuine read failure. Repeated program/use-case names are removed from
the footer.

## Layer Impact

- Release lane: `experimental`, under the existing synthetic-demo deck flag.
- Layer 3: no schema, canonical object, calculation, or data change.
- Layer 4: read-only deck assembly, model wording and response metadata.

## Client Applicability

- All clients: no change outside the existing feature flag.
- Specific clients: the synthetic demo tenant receives the updated read-only
  deck preview. Other tenants are refused before Move reads.
- Internal only: no.
- Feature flag: the existing `moves_reference_deck_v1` tenant flag.

No raw Move, capture, register, ROM or source prose is added to the model
prompt. Context-specific claims remain unavailable until the read path can
supply an approved model-ready bundle with retrieval and cite-render proof.

## Changes Included

- Register the deck words workload in the existing audited Anthropic egress
  taxonomy and require a structured JSON response.
- Add reason-coded model outcomes, a request ID in the response and server
  diagnostic log, and words status in the signed-in fidelity artifact.
- Build a server-side figure slot table from governed reads. Preserve values,
  source IDs and workbook cells through deterministic substitution. Unknown or
  disallowed edition slots are refused.
- Add a full-sentence fallback for each reference archetype, with fidelity
  deductions when a fallback is used.
- Treat only the value route's named absent-model refusal as an empty value
  case. Keep authentication, network and invalid-model reads as failures.
- Display the program and use case once each in the footer.

## QA / Validation

- **Pass** — Seven focused suites, 42 cases cover the slot guard, literal
  figure rejection, empty versus failed reads, figure lineage, edition rules,
  fallbacks, footer text, PDF rendering, workbook parity and AI key-lane
  classification.
- **Pass** — Three one-at-a-time mutations were killed by the tests: bypassing
  the literal digit guard, breaking slot substitution, and treating the named
  empty value case as a failed read. Original files were restored and retested.
- **Pass** — Synthetic fallback PPTX and PDF files opened at 11 and 22 pages.
  Visual inspection found the figure title and source line readable and the
  missing-ROM title fit on the canvas after wording was tightened.
- **Pass** — TypeScript, changed-file ESLint, library orphan audit, route and
  export reachability, test coverage census (2,826 to 2,828 covered test
  files), tenancy-fence census, manual check, AI surface control catalog, and
  all 11 release gates.
- **Pending** — Current-head CI and a deployed signed-in walk of both editions.

## Rollout Plan

Merge through the protected main branch after current-head CI and the Moves
coverage-count collision check. The repository-owned main workflow owns image
build, deploy and traffic. Inspect the resulting signed-in PPTX/PDF files,
words reasons and fidelity scores. Investment acceptance depends on a separately
approved numbers load and human approval of the estimate.

## Deployment Authority

This candidate does not deploy, dispatch workflows, shift traffic, mutate
tenant data or persist deck artifacts. The existing audited model egress keeps
its standard audit events. Existing deck downloads remain active.

## Rollback Plan

Revert the candidate through a pull request or remove the synthetic demo
tenant from the deck flag through the normal release lane.

## Audit Evidence

The pull request, local validation and mutation results, CI, and the later
signed-in walk artifact. A safe reason code is diagnostic, not acceptance.

## Known Gaps

- The historical wording failure cannot be identified from the first walk:
  all causes were collapsed into one marker and no cause was logged. The new
  read-only walk will classify any reproduced failure.
- The demo Move has no approved ROM snapshot yet; it remains a visible gap.
  No estimate is synthesized or promoted by this change.
- Missing value levers, owner acceptance and approved public sources remain
  explicit. Investment figure coverage and its target score depend on the
  separately governed inputs.
- The current readers do not return a model-ready context bundle with the
  required retrieval and cite-render proof. Claude sees only the coarse design
  profile and figure slot meanings, not client-specific prose.
