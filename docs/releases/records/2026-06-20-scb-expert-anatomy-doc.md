# 2026-06-20-scb-expert-anatomy-doc — Consilium expert anatomy developer doc

## Release ID

`2026-06-20-scb-expert-anatomy-doc`

## Status

`candidate`

## Plain-English Summary

Adds one self-contained developer HTML doc, `docs/build/CONSILIUM_EXPERT_ANATOMY.html`, that shows how much depth a Consilium expert holds (faculty stats, the 13-layer anatomy of one expert with real content, the question→answer lifecycle, and the 17-expert roster with honest success-model odds). Documentation only — no code, no runtime.

## Layer Impact

- **global-control-lane (docs only):** a static HTML reference under `docs/build/`. No code paths touched.

## Client Applicability

- All clients: No runtime change — documentation only.
- Specific clients: None.
- Internal only: Yes — developer/onboarding reference.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- `docs/build/CONSILIUM_EXPERT_ANATOMY.html`

## QA / Validation

Validation: Pass. Self-contained HTML opens standalone; content sourced from the live packs (counts computed from `EXPERT_PACKS`, sample content from the revenue-cycle pack). Automated tests: not-run — static documentation, no executable code.

## Rollout Plan

Merge to `main`. No runtime rollout — static doc.

## Deployment Authority

Not applicable — documentation only; cannot affect ACA, deploy workflows, images, flags, env, workers, traffic, or DNS.

- Repo-owned deploy workflow: n/a
- Shared runtime mutators: none
- Approved image digest: n/a
- ACA runtime invariant: n/a
- Worker image invariant: n/a
- Feature/env flag update path: n/a
- Live signed-in proof required: No.

## Rollback Plan

Revert the PR — static doc, no constraints.

## Known Gaps

- Snapshot at 17 experts / 2026-06-20; counts will drift as more waves land (regenerate from `EXPERT_PACKS` when refreshed).
- Not yet cross-linked from `INTELLIGENCE_DATA_FLOW_TRAINING.html` (follow-up).

## Audit Evidence

- PR URL: (filled on PR creation) `claude/scb-expert-anatomy-doc` → `main`.
- Source: `src/lib/intelligence/expert-pack/` packs + registry.
