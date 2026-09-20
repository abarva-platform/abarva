# 2026-09-19 Ownership Map Asks The Import Graph

## Release ID

`2026-09-19-ownership-map-asks-the-import-graph`

## Status

`candidate`

## Plain-English Summary

The route ownership map is a QA reference for what is actually mounted, and the check that held it honest only asked whether a route's file text contained a component's name. A name in a comment satisfied it, and a component genuinely reached through intermediate modules failed it. The check now resolves each claimed component to a file and asks the import graph whether the route reaches that file. Doing so found a false claim the textual check had accepted: one entry listed a TypeScript type among a route's components.

## Layer Impact

- Release lane: `global-control-lane`.
- One QA reference correction, one behavior suite, and one addition to the shared route-reachability library.
- No production code, no runtime behavior change, no schema change.

## Client Applicability

- All clients: no client-facing change.
- Internal release assurance only.

## Changes Included

- Add a single-entry graph walk to the shared reachability library, alongside the existing whole-repository one. The existing function answers whether any route can reach a file, which is the right question for finding orphans and the wrong one for checking a claim about a particular route.
- Resolve each claimed component to a file and require the route to reach that file, rather than searching text.
- Correct the map entry that listed a type union among a route's components.
- Add a negative control asserting the check can distinguish a reached component, an unreached one, a nonexistent one, and a type — and a second control that a component name matching a file name only as a substring is not a match.

## QA / Validation

- PASS: behavior suite passes 30 of 30; the sibling QA suite passes 4 of 4; the existing route-reachability audit exits 0, unchanged.
- PASS: mutation harness catches 5 of 5, including restoring the corrected claim, claiming a component the route does not reach, claiming one that does not exist, answering "reached" unconditionally, and loosening the file-name comparison to a substring.
- Two of those five survived a first run and both were genuine gaps: nothing in the suite asserted a negative, so a verdict function that always answered "reached" passed every case; and no two component names in the map collide, so a substring comparison went unnoticed. A control was added for each.
- PASS: TypeScript exit code 0; scoped ESLint exit code 0.

## Rollout Plan

Merge through the protected pull-request lane. Test and QA-reference change only.

## Rollback Plan

Restore the textual comparison, the removed map entry, and remove the library addition. No runtime, data, or schema rollback is required.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None.
- Approved image digest: Not applicable; no image change.
- ACA runtime invariant: Not applicable.
- Worker image invariant: Not applicable.
- Feature/env flag update path: None.
- Live signed-in proof required: No.

## Audit Evidence

- The failing claim the stronger check surfaced, and the confirmation that the named symbol is a type rather than a component.
- Behavior suite and mutation harness output, before and after the two controls were added.
- The existing reachability audit's exit code, unchanged by the library addition.

## Known Gaps

**A first attempt did the thing the backlog item warned against, and it is worth recording rather than quietly correcting.** The item said not to widen the text match, because a broader test passes more without proving more. The first version searched the text of every file reachable from the route — which accepts a name mentioned anywhere in a four-hundred-file graph, and is weaker than what it replaced. Resolving to a file is what makes it stronger.

**A component declared inside a file that does not bear its name is resolved by reading text across the reachable files**, which is the weaker half of this check. It is narrower than before because the search is confined to files the route actually reaches, but a name in a comment inside one of those files would still satisfy it. Closing that needs a parse rather than a read.

**The map's other fields remain unchecked by this.** The expected shell, the expected wordmark and the compliance rating are still assertions nothing verifies.
