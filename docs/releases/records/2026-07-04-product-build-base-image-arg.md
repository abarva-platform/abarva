# 2026-07-04-product-build-base-image-arg - Product Build Base Image Override

## Release ID

`2026-07-04-product-build-base-image-arg`

## Status

`candidate`

## Plain-English Summary

Product environment builds need to run in Product Dev, Product Preview, and Product Prod registries without silently depending on the lab registry for the Node base image. This release keeps the existing lab base image as the default, but makes the Docker base image configurable so product builds can use an approved public Node 24 base or an environment-owned base image.

## Layer Impact

- `global-control-lane`: changes the shared Docker packaging contract used by Azure Container Apps builds.
- `internal-admin`: enables controlled product environment migration readiness work without adding a parallel build harness.

## Client Applicability

- All clients: No direct client behavior change.
- Specific clients: None.
- Internal only: AbarVa product environment release operations.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- `Dockerfile`: adds `BASE_NODE_IMAGE`, defaulting to the existing lab base image, and uses it across all three Docker stages.

## QA / Validation

- Pass: Product Dev ACR was upgraded to Premium before retrying product release builds.
- Fail, before this change: `az acr build --registry acrabvpdev001 --image abarva/web:main-c3474947cdd8294528c095d77183c44a794c1cb6 --file Dockerfile .` failed because Product Dev ACR could not pull `acrabarvalab001.azurecr.io/base/node:24-bookworm-slim`.
- Pending: rerun product ACR build with `--build-arg BASE_NODE_IMAGE=node:24-bookworm-slim`.
- Pending: `npm run release:check`.

## Rollout Plan

Merge to `main`, build the product web image in Product Dev ACR with `--build-arg BASE_NODE_IMAGE=node:24-bookworm-slim`, resolve the image digest, import the same digest into Product Preview and Product Prod ACRs, and deploy by digest-pinned image only.

## Deployment Authority

- Repo-owned deploy workflow: Not yet available for Product Dev/Preview/Prod; this release enables the documented product environment lane.
- Shared runtime mutators: Product environment Container Apps only; no `app.abarva.ai` DNS or public cutover.
- Approved image digest: To be captured after product ACR build.
- ACA runtime invariant: Product web runtimes must be digest-pinned before they are called release-operational.
- Worker image invariant: No worker jobs are changed by this release.
- Feature/env flag update path: Not applicable.
- Live signed-in proof required: Required before public/client cutover; out of scope for this packaging-only release.

## Rollback Plan

Revert this Dockerfile change. Product builds will again use the existing lab base image default and product ACR builds that cannot authenticate to the lab base registry will remain blocked rather than deploying an unreviewed image.

## Audit Evidence

- PR URL: To be added after PR creation.
- CI: To be added after PR checks complete.
- Product build retry output: To be added to the product release readiness evidence bundle.

## Known Gaps

Product-specific GitHub Actions deploy workflows still need to be created; this release only removes the hidden base-image blocker for the immediate controlled migration-readiness lane.
