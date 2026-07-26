# 2026-07-25-roadmap-pr7-cross-format-sync — PR7: contract→HTML preview + cross-format synchronization proof

## Release ID

`2026-07-25-roadmap-pr7-cross-format-sync`

## Status

`candidate`

## Plain-English Summary

PR7 of the roadmap governed-artifact-synchronization series. Adds the in-product **HTML preview**
renderer from the shared contract (PR4) — completing the set — and an automated **cross-format
synchronization proof** that HTML, DOCX (PR6) and PPTX (PR5) all derive from ONE contract: they carry
the same content hash + version, the same executive conclusion, the same governance/lifecycle state
and the same evidence discipline. HTML labels itself the in-product preview, NOT the client
deliverable.

## Layer Impact

- **global-control-lane**: HTML preview renderer + cross-format proof over the shared contract.

## Client Applicability

- All clients: yes, once the live generation route builds the shared contract and offers the three
  synchronized downloads (the next integration PR). This PR ships the preview renderer + proof only.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- ACA runtime invariant: to be verified after deploy.
- Live signed-in proof required: yes — the live-route wiring + Meridian regeneration + office-app
  acceptance (all recorded as remaining closure work below).

## Changes Included

- `src/lib/deliverables/roadmap-preview-html-renderer.ts` — `renderRoadmapPreviewHtml(contract)`;
  labels itself "In-product preview · review & QA — not the client deliverable"; embeds lifecycle
  banner + contract stamp.
- Tests: `roadmap-cross-format-sync.test.ts` — all three formats embed the same content hash + version;
  same executive conclusion; same review-draft lifecycle + evidence labels; HTML self-labels as
  preview; changing the contract (e.g. lifecycle → final) changes the hash in all three (no stale
  drift).

## QA / Validation

- `npx jest` — 5/5 pass.
- `npx eslint` — clean. `tsc --noEmit` — pass.
- **Automated office-application round-trip:** NOT run in this environment — LibreOffice (`soffice`)
  is not installed and Microsoft PowerPoint app-control access was declined at request time. A real
  editable `.pptx` was generated from the PR5 renderer and written to disk for a manual acceptance
  check on Anand's Mac (PowerPoint is installed). This is recorded as the explicit remaining
  application-level proof, per the agreed staged closure.

## Rollout Plan

Squash-merge to `main`. No flag, no migration (renderer + tests).

## Rollback Plan

Revert the merge commit. No schema/data changes.

## Audit Evidence

- PR: to be opened. Completes the code series: PR1 #5613, PR2 #5615, PR3 #5616, PR4 #5617, PR5 #5619,
  PR6 #5621.

## Known Gaps

The roadmap pilot **stays OPEN**. What this 7-PR series delivered (all tested + merged/merging):
governance-state accuracy (banner-from-state, no UUID leak, no self-contradiction — #5610), authoritative
context precedence + architecture-readiness-from-accepted-P3 (PR1), the unified lifecycle model (PR2),
the blocking contradiction validator (PR3), the shared renderer-neutral contract with version+hash
(PR4), and three synchronized renderers — editable PPTX (PR5), editable DOCX (PR6), HTML preview +
cross-format proof (PR7).

**Not yet done — the remaining closure work, stated plainly:**

- **Live route wiring (GOV-7 integration).** The live generation/download path still produces the
  prompt-generated HTML roadmap; it does NOT yet build the shared `RoadmapPresentationContract` and
  expose the PPTX/DOCX/HTML/PDF downloads from it. Wiring generation → contract → three downloads on
  the real product route is the next integration PR.
- **GOV-5 live regeneration** on the Meridian Move + verify accurate governance state, once wired.
- **GOV-10 pipeline parity** via the shared contract (both pipelines emit the same contract).
- **Application-level editability proof** — a Microsoft PowerPoint (or headless LibreOffice)
  open/edit/save/reopen/export round trip. Neither could run automatically in this environment; the
  generated `.pptx` awaits a manual PowerPoint acceptance on Anand's Mac.

**Closure language stays: "story-first renderer proven; governed-artifact synchronization, executive
packaging and editable PPTX delivery remain open."** The three synchronized renderers now exist and
are proven to share one source; converting the live route to use them, and the office-application
acceptance, are what remain before "governed, synchronized and client-editable across PPTX, DOCX, HTML
preview and PDF distribution."
