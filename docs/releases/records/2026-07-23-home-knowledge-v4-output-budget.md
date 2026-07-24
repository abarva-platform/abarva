# 2026-07-23-home-knowledge-v4-output-budget — fix output truncation that scaled with tenant size

## Release ID

`2026-07-23-home-knowledge-v4-output-budget`

## Status

`candidate`

## Plain-English Summary

Fixes the root cause of Meridian's generation unreliability. It was not flakiness — it was a
deterministic output-budget defect that gets **worse the bigger the tenant is**, which makes it a
direct pilot risk for a real client.

### What was actually happening

`max_tokens` was 12,000. Several dimension calls hit that ceiling *before* the model finished
emitting `client_visible`. The API returned the partial tool call — literally
`{"phase": "Call 5A: Dimension Writer - Executive Brief"}` and nothing else — which the code read
as an "empty response" and retried from scratch, paying for the full call twice.

Evidence from the stored 2026-07-23T17:34Z bundle (offline, no new calls):

| Tenant | Completed passes | Truncated → retried | Calls ending exactly at the 12,000 cap |
|---|---:|---:|---:|
| skyharbor-air | 16 | **0** | 2 |
| lakeshore-holdings | 16 | **0** | 3 |
| apex-retail | 16 | 1 | 1 |
| first-capital | 16 | 1 | 3 |
| **meridian-health** | 16 | **4** | 4 |

Meridian carries the largest context (862,674 input tokens vs 594,360 for skyharbor) and produces
the longest output. The failure rate tracks tenant size. **A real client with more data than
Meridian will hit this harder, not less.** That is the pilot concern, and it is real.

### What was NOT happening — checked, and negative

The 11 calls that terminated at exactly 12,000 tokens but returned successfully were **not**
silently truncated. Every required dimension field was present, and the rate of strings ending
mid-sentence was statistically indistinguishable from calls that finished under the cap (9.7% vs
8.3%). So the damage was confined to hard failures and wasted spend, not undetected quality loss
in shipped content. Worth stating plainly rather than leaving as an implied risk.

### The fix

- `max_tokens` default raised 12,000 → 32,000. Opus 4.8 supports 128K output; 12,000 was far
  below what a dimension page needs.
- **Switched from `messages.create()` to `messages.stream().finalMessage()`.** Above roughly 16K
  `max_tokens`, a non-streaming request hits the SDK's HTTP timeout — raising the budget without
  streaming would have traded truncation for timeouts. `finalMessage()` returns the same
  assembled `Message`, so nothing downstream changes.

### Ledger accounting bug found by this investigation

The cost ledger's waste filter matched `empty-response-attempt` but the files are actually named
`<pass>.empty-response.json`. Those billed-but-discarded attempts were therefore counted as
**successful passes** — which is why Meridian was previously reported as "20 calls" when it in
fact completed 16 passes plus 4 truncation retries.

Fixed: truncated attempts are now counted as waste **and** their tokens included in cost (they
were billed — the call ran and burned its full output budget before being discarded).

Corrected figures for the five-tenant run: **80 completed passes, 6 truncation retries, $33.89.**
Meridian's 4 wasted calls account for roughly $1.20 of its $8.70.

## Layer Impact

- `global-control-lane`: request parameters and ledger accounting in one operator script. No
  schema, no runtime read path, no writes.

## Client Applicability

- All clients: affects every tenant's generation, and disproportionately the largest ones.
- Internal only: operator tooling.
- Feature flag: None.

## Changes Included

- `scripts/knowledge/build-home-knowledge-v4-review-pack.mjs`
  - `maxTokens` default 12000 → 32000 (still overridable via `--max-tokens` /
    `HOME_KNOWLEDGE_V4_MAX_TOKENS`).
  - `client.messages.create(...)` → `client.messages.stream(...).finalMessage()`.
  - Cost ledger: waste filter now matches `empty-response` as well as
    `empty-response-attempt`/`raw-message`, and counts billed-but-discarded attempts' tokens.

## QA / Validation

- `pass` — `node --check` clean; `npx eslint` exit 0.
- `pass` — Root cause established offline against stored artifacts: truncated attempts carry
  `output_tokens: 12000` and a `content` of `{"phase": ...}` with no `client_visible`.
- `pass` — Failure count correlates with tenant input size (skyharbor 0 / meridian 4).
- `pass` — Negative check: at-cap successful responses have all required fields; mid-sentence
  string rate 9.7% at-cap vs 8.3% below-cap, i.e. no evidence of silent truncation.
- `pass` — Ledger re-run after the accounting fix: all five tenants now report 16 completed
  passes; totals 80 passes / 6 truncation retries / $33.89.
- `n/a` — No migration, no runtime change, no database writes, no generation run.

## Rollout Plan

Merge + deploy through the normal ACA main lane. The next paid run is a **three-dimension canary
on skyharbor-air** (the cleanest tenant: 0 truncations, lowest cost), then FS Demo
(first-capital), then Meridian. Confirm on the canary that (a) no call reports a truncated tool
input, (b) `HOME_V4_CACHE_UTILISATION` is non-zero, and (c) replay reports no schema findings,
before committing to a full tenant.

## Deployment Authority

- Repo-owned deploy workflow: Azure Container Apps main deploy after merge.
- Shared runtime mutators: none — operator script only.
- Migration application: none.
- Feature/env flag update path: `HOME_KNOWLEDGE_V4_MAX_TOKENS` remains an optional override.
- Live signed-in proof required: no runtime-visible change.

## Rollback Plan

Revert the PR. `max_tokens` returns to 12,000 and requests go back to non-streaming — restoring
the truncation behaviour, which fails loudly (retry) rather than silently.

## Audit Evidence

- Per-call `output_tokens` and truncated-content analysis over the stored five-tenant bundle.
- Corrected `cost-ledger.json` showing 16 completed passes per tenant and the truncation-waste
  column.

## Known Gaps

- **Not verified live.** 32,000 is an evidence-based headroom choice (roughly 2.7x the observed
  ceiling), not a measured optimum. The canary should report peak `output_tokens` so the budget
  can be tuned rather than guessed.
- Streaming changes the request path; it is the documented requirement above ~16K but has not yet
  run against the live API in this script.
- A tenant larger than Meridian could still exceed 32,000. The durable fix is a per-call output
  budget check plus the API-native task-budget mechanism, not a bigger constant — deliberately
  out of scope here.
- The retry path still re-runs the entire call on truncation. Targeted per-dimension retry
  (already designed, not built) would make a truncation cost one dimension rather than one pass.
