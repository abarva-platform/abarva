# Home Canvas Height

## Release ID

`2026-10-13-home-canvas-height`

## Status

`candidate`

## Plain-English Summary

Keep the Home canvas within the space allocated below the shared navigation. A collapsed advisor must not expand its wrappers to fit all explorer items, causing an outer hidden container to scroll and conceal the page heading.

## Layer Impact

Layer 4, Products: Home-only chat-wrapper sizing. Release lane: `global-control-lane`. Shared advisor branding, transport, source identity, data and other products are unchanged.

## Client Applicability

- All clients: Existing Home canvas.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: Existing controls remain unchanged.

## Changes Included

- Definite-height, shrinkable Home wrapper and scoped advisor-shell wrapper.
- Mode-change regression keeps canvas content and existing chat controls intact.

## QA / Validation

- Pass: Signed-in pre-change reproduction captured hidden-ancestor scrolling and heading occlusion after explorer navigation.
- Pass: 150 Home chat/canvas component tests across 13 suites, Node 24 typecheck and focused lint.
- Pass: All 11 release checks and independent bounded review; no findings.
- Not run: Protected CI, ACA deployment and signed-in post-change geometry/desktop/mobile proof are required.

## Rollout Plan

PR-only protected squash merge followed by the repo-owned ACA main workflow. Prove runtime images independently, then navigate lower explorer items with the advisor collapsed and restored.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` only.
- Shared runtime mutators: That workflow only.
- Approved image digest: Resolve from the exact merge SHA and save in private proof.
- ACA runtime invariant: Template and healthy 100% traffic revision match the approved digest.
- Worker image invariant: All required worker jobs match.
- Feature/env flag update path: No change.
- Live signed-in proof required: Headings stay below navigation, workspace stays within the viewport, and only intended internal panes scroll.

## Rollback Plan

Revert through a PR and the same main workflow. No data rollback is needed.

## Audit Evidence

PR diff, component tests, private before/after geometry and screenshots, protected CI, exact-SHA deployment and runtime invariant.

## Known Gaps

This corrects framing, not data completeness, source refresh, other-module responses or full visual PDF export. Unit style assertions do not replace live browser geometry proof.
