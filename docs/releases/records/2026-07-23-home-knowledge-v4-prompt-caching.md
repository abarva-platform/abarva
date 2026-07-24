# 2026-07-23-home-knowledge-v4-prompt-caching — enable prompt caching for Home V4 generation

## Release ID

`2026-07-23-home-knowledge-v4-prompt-caching`

## Status

`candidate`

## Plain-English Summary

Makes the Home V4 generation prompts cacheable, and corrects the cost ledger's pricing to Opus
4.8 list rates.

The cost ledger added in the previous PR measured **0.0% prompt-cache utilisation across 86
calls** — every call re-sent its full context packet at full input price. This PR fixes that.

### Why caching was impossible, not merely disabled

Two separate defects, both required to be fixed:

1. **No `cache_control` was ever set.** Nothing was requested to be cached, so nothing was.

2. **Even a correctly-placed breakpoint would have cached nothing.** Prompt caching matches on an
   exact byte prefix over `tools` → `system` → `messages`. Every dimension prompt led with
   `task`, which names the dimension and therefore differs on every call — poisoning the ~47KB of
   byte-identical content behind it (`common`, `story_architecture`, `relationship_samples`,
   `evidence_sources`). The residual shared prefix measured **~3,610 tokens, below Opus 4.8's
   4,096-token minimum cacheable prefix**, so a breakpoint at the end of the blob would have
   silently cached nothing and reported no error.

A breakpoint on the tool definition alone would also have failed: tool schema + system prompt is
~1,250 tokens, likewise under the minimum.

### The fix

Partition each prompt into a stable block and a variable block, ordered most-widely-shared first,
and put a single `cache_control` breakpoint at the end of the stable block. Because caching is a
prefix match, that one breakpoint covers the tool schema and system prompt as well as the stable
body.

`task` and any retry `repair_instruction` now sit *after* the breakpoint.

Measured against the stored Meridian prompts, offline, with no Claude calls:

| | Before | After |
|---|---:|---:|
| Cacheable stable block | — | **13,171 tokens** |
| Identical across all dimension calls | — | **yes, byte-for-byte** |
| Clears Opus 4.8's 4,096-token minimum | no (~3,610) | **yes** |

### Pricing correction

The cost ledger defaulted to $15/$75 per MTok. **Opus 4.8 is $5/$25.** The previously reported
$101.68 for the five-tenant run was ~3x too high — the real figure is **$33.89**. Defaults are
now $5 input / $25 output / $10 cache-write (2x for the 1h TTL used here) / $0.50 cache-read.

### Expected saving — projection, not a measurement

On the observed 12-dimension-call shape, ~11 of 12 stable blocks become cache reads: roughly
145K tokens moving from $5/MTok to $0.50/MTok, net of the write premium — about **$0.58 per
tenant against a measured $8.70**, ~7%. Under the current single-dimension contract the same
block is re-sent 38 times instead of 12, so the saving scales to roughly **$2 per tenant**.

This is a real but moderate input-side saving, not a halving of spend. It has **not** been
verified against a live run — the next generation must be checked with
`HOME_V4_CACHE_UTILISATION` before this is treated as proven.

## Layer Impact

- `global-control-lane`: request construction and pricing constants in one operator script. No
  schema, no runtime read path, no writes, no change to any client-visible content.

## Client Applicability

- All clients: affects how every tenant's generation request is assembled.
- Internal only: operator tooling.
- Feature flag: None.

## Changes Included

- `scripts/knowledge/build-home-knowledge-v4-review-pack.mjs`
  - `CACHE_STABLE_KEYS` + `splitPromptForCache()` — partition prompts, most-widely-shared first.
  - `callClaude` sends two text blocks with `cache_control: {type: "ephemeral", ttl: "1h"}` on
    the stable one.
  - Cost-ledger pricing corrected to Opus 4.8 list rates.

## QA / Validation

- `pass` — `node --check` clean; `npx eslint` exit 0.
- `pass` — Offline verification against the 20 stored Meridian prompts: stable block is 13,171
  tokens and byte-for-byte identical across all dimension calls; old layout's shared prefix
  measured at ~3,610 tokens, confirming it was below the cacheable minimum.
- `pass` — Prompt content is unchanged. The split only reorders keys within the request body and
  changes where the block boundary falls; the full prompt is still written to
  `prompts/<pass>.json` for audit exactly as before.
- `n/a` — No migration, no runtime change, no database writes, no generation run.

## Rollout Plan

Merge + deploy through the normal ACA main lane. The next generation run must be followed by
`npm run home:knowledge-v4:cost-ledger -- <bundle>` and the `HOME_V4_CACHE_UTILISATION` line
checked. A run that still reports 0.0% means a silent invalidator remains and the caching is not
working — do not assume it worked.

## Deployment Authority

- Repo-owned deploy workflow: Azure Container Apps main deploy after merge.
- Shared runtime mutators: none — operator script only.
- Migration application: none.
- Feature/env flag update path: `HOME_V4_PRICE_*` overrides remain optional and unset by default.
- Live signed-in proof required: no runtime-visible change.

## Rollback Plan

Revert the PR. Caching is transparent to output — reverting restores uncached requests, which
cost more but produce the same content.

## Audit Evidence

- Offline split verification output over the stored Meridian prompts (stable-block size,
  byte-identity across dimension calls, pre-fix shared-prefix measurement).
- `cost-ledger.json` showing the 0.0% cache utilisation this PR responds to.

## Known Gaps

- **Not verified live.** The token-level effect is arithmetic from stored prompts; only a real
  run can confirm non-zero `cache_read_input_tokens`. Treat as unproven until then.
- `common` differs slightly between pass types (3,697 vs 3,870 bytes), so cross-pass-type sharing
  is only ~148 tokens. Normalising `common` would extend the cached prefix across all passes —
  deliberately out of scope here.
- The 1h TTL costs 2x on write against 1.25x for 5m. Chosen because a tenant run spans ~40
  minutes and retries or concurrency can open gaps; at 12+ reads either TTL pays for itself many
  times over, and 1h removes a class of silent expiry.
- No canary has run. This changes request shape, so the first paid run after this should be a
  three-dimension canary, not a full tenant.
