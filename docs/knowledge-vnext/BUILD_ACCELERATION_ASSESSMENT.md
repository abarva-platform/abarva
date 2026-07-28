# Build-acceleration assessment — knowledge-worker vs abarva/web (item 5)

Question: should a separate `abarva/knowledge-worker` image be split from
`abarva/web` to accelerate builds?

## Findings

- **One image is built today:** `abarva/web` (`.github/workflows/aca-main-deploy.yml`
  builds `Dockerfile` only). Every ACA Job (deliverable worker, operator job for
  `scripts/knowledge/*`, migrations) **reuses that one web digest** — jobs differ
  only by container name + `npm run <script>` command. The Dockerfile explicitly
  bakes operational scripts in *because* the jobs reuse the web image.
- **The build is already deduplicated:** one `next build` → one digest → reused
  everywhere; the deploy even skips the build when a canonical revision already
  exists.
- **No documented build-time pain point.** The clearest cost signal is the 6 GB
  heap `next build` (`NODE_OPTIONS=--max-old-space-size=6144`) and the 20-min CI
  bundle-budget job. Buildx GHA cache is already configured
  (`cache-from/to: type=gha`).
- `next.config.ts` does **not** set `output: 'standalone'`, so the runtime stage
  ships the full `.next` + full `node_modules` — a larger image than necessary.

## Recommendation: do NOT split for build speed (not yet)

Splitting adds a **second** build target to the single workflow (web *with*
`next build` + worker *without*) — that is *more* total build work, not less,
unless worker-only changes are frequent (they are not, relative to shared-code
changes). It also multiplies the ACR/deploy contract surface (second digest,
second cache scope, extended runtime-invariant proof) inside a deliberately
single-image, single-workflow, digest-pinned model (`AGENTS.md`).

### Cheaper levers first (higher ROI, lower risk)
1. **Enable `output: 'standalone'` in `next.config.ts`** — the Dockerfile already
   anticipates it; shrinks the runtime image (drops full `node_modules`) and
   speeds job cold-starts, no second image/workflow. *(Deferred here because it
   changes the runtime-image contract — propose as its own reviewed change.)*
2. **Verify the Buildx `deps`/`build` layer-cache hit rate** across runs before
   concluding the build is slow.

### Split only conditionally
Gate a `knowledge-worker` split on a concrete measured signal: worker/knowledge-job
cold-start or image-pull latency attributable to Next.js bloat, frequent
worker-only change cycles, or a deliberate blast-radius isolation goal. If split:
keep it as a **second build target inside `aca-main-deploy.yml`** sharing the
`deps` layer, digest-pinned, and extend the runtime-invariant proof — never a
second workflow (violates the single-deploy-authority rule).

**Bottom line:** the split is defensible for image-size/isolation, but it is not a
build-*acceleration* win as framed. Pursue standalone output + cache verification
first; gate the split on a latency/cycle-time measurement.
