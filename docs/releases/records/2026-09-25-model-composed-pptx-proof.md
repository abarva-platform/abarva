# 2026-09-25-model-composed-pptx-proof — Governed model-composed PPTX, architecture proof

## Release ID

`2026-09-25-model-composed-pptx-proof`

## Status

`candidate`

## Plain-English Summary

A proof of a different way to build a PowerPoint deck from an artifact that has already been
approved. Today the deck is drawn by fixed renderer code that puts one document section on
each slide, which is why the slides read as a section list rather than an argument. In this
proof the model is given the approved content and writes the *composition code*; that code
runs inside a locked-down sandbox, and the file it produces is then checked by deterministic
gates — does every shape fit on the page, does every number trace back to governed data,
does the deck still reach the same conclusion as the document — before anyone sees it.

Nothing in the product calls any of this. The existing renderer is untouched and remains the
only path a client deliverable takes.

## Layer Impact

**Release lane: experimental**

Layer 4 (products) only, and only behind an operator-run proof driver. No change to layer 1
client intake, layer 2 source adapters, or layer 3 canonical model. DOCX generation is
unchanged and is used here as the control the deck is compared against.

## Client Applicability

- All clients: no
- Specific clients: no
- Internal only: **yes — operator-run proof driver only; no product route reaches it**
- Public/demo only: no
- Feature flag: none, because there is no runtime path to gate

The proof runs against a synthetic lab tenant's governed intake data.

## Changes Included

- `docs/design/deliverables/GOVERNED_MODEL_COMPOSED_PPTX_INCREMENT.md` — the contract,
  committed before implementation
- `docs/design/deliverables/MODEL_COMPOSED_PPTX_PROOF_RESULT.md` — what the proof found
- `src/lib/deliverables/composer/` — frozen packet, number ledger and lineage gate, plan
  gate and context narrowing, module assembler, response parser, cross-projection gate,
  material-claim extractor, and their tests
- `scripts/deliverables/composer/` — AST gate, sandbox runtime and entry point, presentation
  SDK, embedded font-width table and its generator, planted-failure suite, SDK self-check
- `scripts/deliverables/proof/` — evidence-bundle builder, generation driver, composer
  driver, baseline renderer, visual review and revision, re-gate, blind pack, report

No migrations. No routes. No jobs.

## QA / Validation

**Status: pass, with one stated shortfall (see Known Gaps).**

| Check | Result |
|---|---|
| `npx jest src/lib/deliverables/composer` | **pass** — 50 tests, 6 suites |
| Planted sandbox failures | **pass** — 38/38 blocked, each with its mechanism recorded |
| SDK self-check | **pass** — 11/11 |
| `npx eslint` on all new paths | **pass** — clean |
| `release:check` locally | **pass** |
| Rendered-file inspection, both decks | **pass** — 0 off-canvas shapes, both physically intact |
| DOCX ↔ PPTX consistency, both decks | **pass** |
| Numeric lineage, composed deck | **11 findings** — see Known Gaps |
| Revision non-regression | **pass** — rejected once correctly, then accepted on four invariants |

The three sandbox layers are proven separately on purpose: with all of them enabled the
outer layer catches everything and the inner ones are never exercised, so a suite run only
end-to-end would report green for guards it never reached.

## Rollout Plan

No runtime rollout. This merges as code, tests and documentation with no reachability from
any product surface. There is nothing to enable.

## Deployment Authority

Not applicable. This release cannot affect Azure Container Apps, deploy workflows, runtime
images, feature flags, environment variables, worker jobs, traffic, DNS, or environment
promotion.

- Repo-owned deploy workflow: unchanged
- Shared runtime mutators: none
- Approved image digest: not applicable — no runtime image change
- ACA runtime invariant: unaffected
- Worker image invariant: unaffected
- Feature/env flag update path: none required
- Live signed-in proof required: no — no client-visible surface changes

## Rollback Plan

Revert the merge commit. Nothing downstream depends on any of it, no data is written, and no
migration is applied.

## Audit Evidence

- The design contract and the result document listed under Changes Included
- Per-run manifests recording the packet hash, plan hash, composer source hash, SDK hash,
  runtime versions and output file hash, so a deck is reconstructible from its stored inputs
  rather than by re-running a model and hoping for identical bytes
- Planted-failure and self-check output, reproducible by running the two Python suites
- A blind A/B pack: both decks rendered to images, shuffled, with the mapping held in a
  separate key file

## Known Gaps

- **Numeric lineage is not clean.** The composed deck carries 11 findings, all of them
  citation footers written without a `Source:` prefix. The exemption rule requires two
  signals and deliberately errs toward flagging: a false finding is noise, a false exemption
  is an invented number reaching a client. The composer prompt now requires the prefix; the
  count has not yet been re-measured under it, and is reported as 11 rather than as expected
  to be zero.
- **The Python suites are operator-run.** CI has no interpreter with the presentation
  library. A test that skips where CI gates it is worse than no test, so none was added.
  Provisioning that interpreter is a prerequisite for migrating any artifact type.
- **No human quality verdict yet.** Whether model-authored composition materially improves
  communication at fixed truth is the question this increment exists to answer, and no gate
  in it can answer that. The blind pack is the ask.
- **Not migrated, by design.** No artifact type moves to this path. The deterministic
  renderer stays wired as the only production route.
