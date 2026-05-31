# 2026-05-30 · Atlas Live-Prod Smoke — close in-process harness gap

## Release ID
`2026-05-30-atlas-live-prod-smoke`

## Status
candidate

## Plain-English Summary
The prior IAC E2E run (release `2026-05-30-atlas-iac-e2e-harness-and-post-fix-validation`)
ran a 90-turn in-process harness that validated the composition + retrieval +
shaper path deterministically, but explicitly did NOT exercise the live
Anthropic call after HI-1's `temperature` parameter deprecation fix (PR #2611,
commit `0aa86e91`). That left one open question — is the live Claude path
actually callable on deployed prod post-fix, or does it return `fallback`?

This release adds `scripts/qa/atlas-live-prod-smoke.ts`: a focused 6-turn
smoke test that authenticates as a real Apex Retail Clerk user, fires the deck
against the deployed `https://app.abarva.ai/api/v1/atlas/ask` endpoint, and
captures the `x-atlas-mode` response header per turn. The deck is deliberately
phrased to push 5 of 6 turns through `routeType='llm'` (the only path that
actually invokes Anthropic — scripted intents return `atlasMode='live'`
without calling the model).

Headline live-prod metrics:
- **6/6 turns returned status 200** and `x-atlas-mode: live`.
- **5/6 turns actually invoked the Anthropic API** (`routeType='llm'`); all 5
  returned `live`, 0 fell back. HI-1 (PR #2611) holds on deployed prod.
- **0/6 banned-phrase emissions** outside cited sources or meta-quoted
  discussion (ME-1 guardrail holds end-to-end on the LLM route, including
  the L06 turn where the user prompt contains the literal banned phrase).
- **0/6 cross-tenant leaks** — no foreign tenant names or display-id
  prefixes appeared in any response.
- **Adversarial honesty (L05)**: model refused to fabricate an exact-dollar
  FY26 ROI and routed the ask back to substrate-grounded measured vs
  projected vs verified framing. Cleanest possible result.

Verdict: **CONFIRMED GO**. HI-1 fix is live and behaving. No P0 found.

One architecture observation (P2, not blocking): the four-section IAC
composition (`Your data / Industry context / The gap / Next move`) fires
only on the in-process IAC composer path — `runAtlasLlm` does not overlay
the four-section structure. 0/2 hybrid turns rendered the headers on the
LLM route. Surfaced as an observation in the report; tracked for follow-up.

## Layer Impact
- `runtime-app-lane`: none. The script is read-only against deployed prod;
  no production code changes.
- `architecture-lane`: adds `scripts/qa/atlas-live-prod-smoke.ts`. The script
  is companion to `scripts/qa/atlas-iac-e2e.ts` and is intentionally narrow
  scope — 6 turns against a single tenant, designed to validate live-LLM
  reachability not invariants (those remain covered by the 90-turn
  in-process harness).
- `qa-validation-lane`: produces `reports/2026-05-30-atlas-iac-e2e-live-prod/`
  with `LIVE_SMOKE.md` (per-turn detail, scorecard, verdict) and `raw.json`
  (machine-readable request/response capture, sensitive tokens stripped at
  capture time by virtue of the script not logging cookies into the
  response payload).
- `data-plane-lane`: read-only on prod; tenant scoping by `clientId` in
  the request body, validated by Clerk session + active-client cookie.

## Client Applicability
- All clients: yes — the live-LLM reachability check is tenant-agnostic at
  the model layer. The smoke run uses Apex Retail because tenant-scoping
  invariants were already validated cross-tenant in the in-process harness;
  this run is about reachability, not isolation.
- Specific clients: Apex Retail (`bb8ed961-a049-4d0c-a38f-f8912138fceb`)
  via `cio@apex-retail.example.com`.
- Internal only: no. The script is committed and re-runnable by any
  maintainer with `CLERK_SECRET_KEY` and a Playwright-capable host.
- Public/demo only: no.

## Changes Included
- `scripts/qa/atlas-live-prod-smoke.ts` — new. Clerk-ticket auth via
  headless Playwright, 6-turn deck, per-turn scorecard, single retry on
  Clerk 307/401, P0 stop-on-fallback. Captures request/response, header
  `x-atlas-mode`, body `atlasMode`, `routeType`, latency, intent.
- `reports/2026-05-30-atlas-iac-e2e-live-prod/LIVE_SMOKE.md` — new.
  Headline metrics, pilot-readiness verdict, per-turn detail with full
  scorecard and response excerpts.
- `reports/2026-05-30-atlas-iac-e2e-live-prod/raw.json` — new.
  Machine-readable capture of all 6 turns.
- `docs/releases/records/2026-05-30-atlas-live-prod-smoke.md` — this record.

## QA / Validation
- `npx tsc --noEmit -p tsconfig.json` clean on the new file.
- Live run against `https://app.abarva.ai` on 2026-05-31T00:20:51Z:
  6/6 status 200, 6/6 `x-atlas-mode: live`, 5/6 `routeType='llm'` (=
  actually invoked Anthropic), 0/5 LLM-turn fallbacks.
- The one transient 307 observed on L05 was Clerk session expiring during
  the long-running Anthropic-call deck (~75s total elapsed before L05).
  The script handles this with a single re-auth + retry; retry succeeded
  with status 200. Logged in the report's per-turn errors field.
- Adversarial L05 spot-check: model said `I can't give you an exact-to-the-
  dollar FY26 return for AR-02. Tower doesn't hold the fields that would
  make that number honest.` — and routed the user to `Source for a FY26-
  scoped value brief on AR-02`. This is the canonical honest-about-gaps
  response shape from the ATLAS_PROMPT_VERSION `tower-w6-v3-banned-phrase-
  guard` system prompt.
- Adversarial L06 spot-check: the user's prompt contains the literal "best
  practice" phrase. The model opened with `I'll answer the substance and
  skip the consensus framing — there isn't a single "best practice" here`
  — meta-quoting the framing to refuse it. The harness's banned-phrase
  detector strips bracketed citations, parenthetical citation tails, and
  quoted spans before scanning; under that nuanced read the response does
  NOT contain a free-standing banned phrase. Surfaced in the per-turn
  scorecard's `bannedPhraseNote` for transparency: a system-prompt-strict
  reading would still flag the literal substring once.

## Rollout Plan
- Merge this PR to main. The script and reports are net-additive; no
  runtime change.
- Re-run before each pilot release in addition to the in-process harness:
  `PROD_URL=https://app.abarva.ai npx tsx -r dotenv/config
  scripts/qa/atlas-live-prod-smoke.ts dotenv_config_path=.env.local`.
- Exit code 2 on any fallback emission, exit 1 on script-level error,
  exit 0 on clean — wires straight into a CI gate when desired.

## Rollback Plan
- Revert the PR. Removes the script and reports directory. No production
  code is touched.

## Audit Evidence
- Validates PR #2611 (HI-1 `temperature` param drop) end-to-end on the
  deployed production endpoint, closing the documented gap from the
  in-process harness release.
- Validates ME-1 (PR #2614 banned-phrase guardrail) behavior on the
  live LLM route with the literal banned phrase in the user prompt.
- Cross-tenant invariants remain covered by the in-process harness's 6
  API probes; not re-run here.

## Known Gaps
- Hybrid four-section composition (`Your data / Industry context / The
  gap / Next move`) does NOT render on the LLM route. 0/2 hybrid LLM
  turns produced the four headers. The in-process harness validates
  4-section fires from the IAC composer; `runAtlasLlm` does not overlay
  the IAC composition on top of the model's free-form output. Tracked
  as a P2 observation; not blocking for HI-1 validation, but it means
  the LLM-route hybrid responses rely on the model self-structuring,
  which is variable.
- Citation detection (parenthetical `(source, YYYY-MM-DD)`) misses the
  bracketed citation style (`[industry_signals_and_benchmarks.json §
  industry_context]`) that the LLM emits in practice. Three turns
  (L02 / L03 / L04) carry the `industry/hybrid content missing source+
  date citations` scorecard flag but in reality contain bracketed
  citations. The grade derivation already handles this gracefully (no
  grade demotion below A), but the false-negative is worth tightening
  in a follow-up.
- Single tenant tested (Apex Retail). The in-process harness covers all
  three pilot tenants for invariants; this run is scoped to reachability
  of the live LLM path which is tenant-agnostic. Adding Meridian and
  First Capital is straightforward (loop the question deck per tenant)
  and tracked for a follow-up if pilot needs multi-tenant live-LLM
  evidence.
- Deck is 6 turns to keep cost and latency bounded — five Anthropic
  calls plus one scripted call run in ~95 seconds of LLM time. A larger
  deck (~25 LLM-route turns) would tighten the confidence on HI-1 from
  "verified on 5 cases" to "verified across a representative spread";
  tracked for the next iteration if pilot requires it.
