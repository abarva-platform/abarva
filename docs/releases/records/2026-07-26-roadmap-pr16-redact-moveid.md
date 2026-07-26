# 2026-07-26-roadmap-pr16-redact-moveid — PR16: redact the raw Move UUID from client-facing roadmap outputs

## Release ID

`2026-07-26-roadmap-pr16-redact-moveid`

## Status

`candidate`

## Plain-English Summary

The PR15 live Meridian success capture confirmed the full download path works, but the provenance/
contract STAMP footer exposed the raw internal Move UUID — "roadmap-contract v1.0.0 · <hash> · Move
3fc8e69f-… · tenant meridian" — in the HTML preview and DOCX (eyebrow, Appendix H, document title).
Per the no-UUIDs / opaque-reference rule, an internal database id must not appear in a client artifact.
PR16 adds `opaqueMoveRef(moveId)` — a stable non-UUID token (`move-<10 hex>`, deterministic per Move) —
and uses it in the client-facing HTML/DOCX stamps instead of the raw UUID. The tenant is a canonical
cover name ("meridian") and stays; the content hash (already non-UUID) stays. The PPTX footer never
carried the Move id. The raw ids remain ONLY in the restricted provenance JSON (audit/admin download).

## Layer Impact

- **global-control-lane** (flag-gated): presentation-only change to two client renderers + one helper.

## Client Applicability

- Gated behind the **feature flag** `moves_governed_roadmap_downloads` (Meridian first). No other change.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`; ACA runtime invariant verified
  after deploy; live Meridian re-capture confirms the UUID is gone.

## Changes Included

- `roadmap-presentation-contract.ts` — new `opaqueMoveRef(moveId)`.
- `roadmap-preview-html-renderer.ts`, `roadmap-docx-renderer.ts` — use the opaque ref in stamps/lineage.
- `roadmap-moveid-redaction.test.ts` — HTML/DOCX/PPTX contain no raw UUID; opaque ref present + stable.

## QA / Validation

- Status: **pass** — 12 targeted tests pass (incl. cross-format-sync unaffected: the content hash is over
  the contract data, not the presentation stamp, so it is unchanged); full `src/lib/deliverables`
  pre-existing 6-failure baseline unchanged; `tsc` 0; `eslint` clean.

## Audit Evidence

- PR: to be opened. Follows PR15 #5651. Live diagnosis: the PR15 success capture (run 8188e662, hash
  fd03fd01…) showed "Move 3fc8e69f-… · tenant meridian" in the client HTML/DOCX stamp.

## Rollout Plan

Squash-merge; deploy; re-run the Meridian build + downloads and confirm the raw UUID is absent and the
opaque ref present, with the content hash unchanged.

## Rollback Plan

Revert, or disable the flag. No schema/data change; presentation-only.

## Known Gaps

Remaining pilot work: orchestrator pipeline parity (same dedicated pass + governed builder), the
Microsoft PowerPoint acceptance round-trip on the live deck, the final live artifact ZIP outside /tmp,
and the durable-worker migration + per-stage status/UI. Content hash is unchanged by PR16, so the live
PPTX from PR15 (fd03fd01…) is still valid for the PowerPoint acceptance once re-downloaded post-deploy.
