# 2026-07-25-roadmap-pr8-contract-extractor — PR8: structured payload → shared contract extractor

## Release ID

`2026-07-25-roadmap-pr8-contract-extractor`

## Status

`candidate`

## Plain-English Summary

PR8 of the roadmap governed-artifact-synchronization series — the keystone bridge for live-route
wiring. Adds `buildRoadmapContractFromStructured`, the single pure function that turns a generation's
normalized structured roadmap payload into the shared `RoadmapPresentationContract` (PR4) that the
PPTX (PR5), DOCX (PR6) and HTML preview (PR7) renderers already consume. One extractor, so there is
exactly one place that decides what the client artifact says — and both generation pipelines feed the
same function (the foundation for GOV-10 pipeline parity).

It is deliberately a dedicated, tested unit rather than an inline map because it carries governance
guarantees:

1. **It never fabricates certainty.** A cell with no recognized evidence status becomes
   `evidence_required` — never `approved`. Unknown/`tbd`/`pending`/absent all resolve conservatively;
   no unknown token can ever resolve to `approved`.
2. **The message-led title rule is enforced as a surfaced issue.** A generic "Execution Roadmap"
   title is reported in `issues` (code `generic_title`) for the caller/contradiction-validator to act
   on — never silently accepted.
3. **Horizons are outcome-first**, in the reference's canonical order.
4. **It invents nothing.** Decision gates, value milestones and dependencies come only from the
   payload; missing gates/milestones are surfaced as issues, not backfilled from the reference's
   canonical lists.

## Layer Impact

- **global-control-lane**: pure extraction function over the shared contract. No route, schema,
  flag or data change.

## Client Applicability

- All clients: yes, once the live generation route calls this extractor and offers the synchronized
  downloads (the next integration PR). This PR ships the extractor + tests only; nothing is wired
  into a live route yet.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- ACA runtime invariant: to be verified after deploy (no runtime behavior change in this PR).
- Live signed-in proof required: yes — at the live-route wiring PR (GOV-5 regeneration), not here.

## Changes Included

- `src/lib/deliverables/roadmap-contract-extractor.ts` —
  `buildRoadmapContractFromStructured({input, lineage, lifecycleState, phase})` returning
  `{ contract, issues }`; `normalizeEvidenceStatus`; `RoadmapCellInput` / `RoadmapStructuredInput`
  types grounded in `EXECUTIVE_ROADMAP_REFERENCE.requiredItemFields`.
- `src/lib/deliverables/__tests__/roadmap-contract-extractor.test.ts` — 14 tests: evidence
  normalization (incl. "never resolves any unknown to approved"), full-payload mapping, canonical
  outcome-first horizon ordering, no-fabrication of evidence status, generic-title flagging,
  message-led title pass, invents-nothing for gates/milestones, and an end-to-end check that the
  produced contract drives the real DOCX + PPTX renderers and embeds the same content hash.

## QA / Validation

- `npx jest roadmap-contract-extractor` — 14/14 pass.
- `npx eslint` on the new files — clean. `tsc --noEmit` — no errors in the new files.
- No app-level proof in this PR: it is a pure function with no live route. Application-level PPTX
  editability acceptance (Microsoft PowerPoint open/edit/save/reopen/export) remains the outstanding
  manual step recorded across the series.

## Rollout Plan

Squash-merge to `main`. No flag, no migration (pure function + tests).

## Rollback Plan

Revert the merge commit. No schema/data changes.

## Audit Evidence

- PR: to be opened. Builds on the code series: PR1 #5613, PR2 #5615, PR3 #5616, PR4 #5617,
  PR5 #5619, PR6 #5621, PR7 #5623.

## Known Gaps

The roadmap pilot **stays OPEN**. This PR delivers the pure extractor that both pipelines will call;
it does **not** wire it into a live route. Remaining closure work, unchanged and stated plainly:

- **Live route wiring (GOV-7 integration).** Make the live generation/download path call this
  extractor and expose the PPTX/DOCX/HTML/PDF downloads. This PR is the function that path will use;
  the wiring itself is the next PR.
- **GOV-5 live regeneration** on the Meridian Move, then verify accurate governance state.
- **GOV-10 pipeline parity** — wire both pipelines to emit the normalized `RoadmapStructuredInput`
  this extractor consumes, so both produce a materially equivalent contract.
- **Application-level editability proof (GOV-11)** — a Microsoft PowerPoint (or headless
  LibreOffice) open/edit/save/reopen/export round trip; the generated `.pptx` awaits a manual
  PowerPoint acceptance on Anand's Mac.

**Closure language stays: "story-first renderer proven; governed-artifact synchronization, executive
packaging and editable PPTX delivery remain open."**
