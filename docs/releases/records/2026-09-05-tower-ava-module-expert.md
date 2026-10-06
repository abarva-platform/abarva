# 2026-09-05-tower-ava-module-expert — Tower module expert on the shared aVa contract

## Release ID

`2026-09-05-tower-ava-module-expert`

## Status

`candidate`

## Plain-English Summary

Tower had no conversational module expert. It has narrative generation for executive stories, and it has deterministic read models that own every number, but nothing that lets the assistant answer "where are we on this metric, and what can we actually claim yet" from governed state.

This adds that, built on the shared module-expert interface rather than a second bespoke stack.

Tower's governing rule shapes the whole design. Read models and metric tables own values; the assistant owns narrative. So the packet never computes, sums, converts, or derives a figure. It carries only figures the deterministic layer already published *and* marked safe to display. A metric that exists but is not cleared for display is named without its number, so the assistant can say the metric is tracked and not yet reportable rather than guessing or staying silent.

The post-hoc gate enforces the same rule from the other direction. An answer that states a figure the packet never published fails. An answer that calls value realized when no claim permits that language fails. An answer claiming Tower certifies value fails, because Tower tracks evidence and the accountable owner or Finance certifies it. When the packet carries blocked claims, withheld metrics, or evidence gaps, an answer that does not name that limit fails.

Questions about executing phase work or about vendor and contract mechanics are classified as out of scope and redirected, because Tower observes that work rather than running it.

## Layer Impact

Release lane: `global-control-lane` — shared library capability. Not wired to any route in this change.

- Layer 4 (Products — Tower): new module-expert library only. No route, no surface, no flag consumes it yet.
- Layer 3 (Canonical model): unchanged, and deliberately so. The packet reads an already-built context pack and derives no value of its own.
- Layers 1-2 (Client intake, source adapters): unchanged.

## Client Applicability

- All clients: no behaviour reaches any client from this change. Nothing calls it.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none yet. The packet builder already takes a hardening flag so the surface can be enabled per tenant the way the transformation surface is.

## Changes Included

- `src/lib/tower/ava-chat/types.ts` — packet and answer-mode types, extending the shared module-expert base.
- `src/lib/tower/ava-chat/answer-modes.ts` — deterministic classifier over metric status, value realization, adoption, funding gate, evidence gap, and out-of-scope redirect.
- `src/lib/tower/ava-chat/packet.ts` — builds the packet from an existing Tower context pack, filtering to published-and-displayable figures and carrying blocked claims with their reasons and required evidence.
- `src/lib/tower/ava-chat/quality-gate.ts` — post-hoc checks for unsupported figures, realized-value overclaim, certification claims, unnamed evidence boundaries, and internal implementation language.
- `src/lib/tower/ava-chat/system-prompt.ts` — packet-to-prompt formatter.
- `src/lib/tower/ava-chat/module-expert.ts`, `index.ts` — binding onto the shared contract.
- `src/lib/tower/ava-chat/__tests__/tower-module-expert.test.ts` — coverage including the phase exit criterion.

## QA / Validation

- `npx jest src/lib/tower/ava-chat --runInBand` — 11 passed.
- Exit criterion met: an answer stating a figure the packet never published is rejected by the gate.
- Mutation-tested in three directions. Making the figure check always pass, ignoring the safe-to-display flag when building the packet, and always allowing realized-value language each fail a test. The guards detect the behaviour they claim to, rather than describing the current state.
- `npx jest src/lib/tower src/lib/programs/ava-chat` — 580 passed, 18 failed. All 18 failures are pre-existing on the base branch, verified by stashing and re-running (569 passed, identical failing suites). No suite regressed.
- `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false` — 0 errors repo-wide.
- `npx eslint src/lib/tower/ava-chat` — clean.

## Rollout Plan

Merge to main via PR (squash) after the shared contract it builds on. The repo-owned ACA main deploy workflow builds and deploys the image. No migration, no data build, no flag, no env change, and no route consumes this yet.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none in this change.
- Approved image digest: assigned by the main deploy workflow on merge.
- ACA runtime invariant: to be proven after deploy, though this change adds no runtime path.
- Worker image invariant: unaffected.
- Feature/env flag update path: not applicable yet; a tenant flag is the intended enablement path when a route adopts this.
- Live signed-in proof required: not for this change, because nothing calls it. Required before any route adopts it.

## Rollback Plan

Revert the PR. Nothing consumes the module, so revert removes an unused library with no runtime or data effect.

## Known Gaps

- Nothing calls this. It is a library plus its guards, exactly as the shared contract was. Until a route adopts it, the behaviour is unproven in the live path and only the tests speak for it.
- The figure check compares rendered figures textually. An answer that restates a published figure in a different form — rounding, a different unit, or spelling a number in words — would not be caught. Tightening that needs the deterministic layer to expose a normalized figure set rather than display strings.
- Adoption evidence and funding-gate notes are optional inputs with no producer yet, so an adoption question currently answers from caveats rather than adoption state.
- The classifier is keyword-based and inherits that ceiling. A metric question phrased without any matched term falls to the general mode, which still receives the packet and the gate but gets no mode-specific framing.
- The out-of-scope redirect names the owning surface but does not hand over context. Cross-surface handoff is a later phase.

## Audit Evidence

- PR URL: to be attached on open.
- CI run for the PR.
- Local validation output recorded in the QA section above.
