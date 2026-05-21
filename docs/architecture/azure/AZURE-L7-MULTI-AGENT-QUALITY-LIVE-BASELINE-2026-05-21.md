# Azure L7 Multi-Agent Quality Live Baseline

Date: 2026-05-21
Target: `https://ca-abarva-web-lab-eastus.agreeableocean-2c1472e6.eastus.azurecontainerapps.io`
Runner: `npm run qa:agent-quality:live`
Auth mode: `demo-sign-in`
Corpus: 50 live cases across Sentinel, Atlas, Nexus, Source, and Steward
Status: live baseline complete; no F blockers after retry, but not yet pilot-green

## Commands

Initial full run:

```bash
npm run qa:agent-quality:live -- \
  --base-url https://ca-abarva-web-lab-eastus.agreeableocean-2c1472e6.eastus.azurecontainerapps.io \
  --auth-mode demo-sign-in \
  --out /tmp/azure-agent-quality-live-50.jsonl \
  --fail-on-grade F
```

Atlas rerun after the initial sign-in transport failures:

```bash
npm run qa:agent-quality:live -- \
  --base-url https://ca-abarva-web-lab-eastus.agreeableocean-2c1472e6.eastus.azurecontainerapps.io \
  --auth-mode demo-sign-in \
  --agent atlas \
  --out /tmp/azure-agent-quality-live-atlas-rerun.jsonl \
  --fail-on-grade F
```

Combined score after replacing the three initial Atlas sign-in timeout rows:

```bash
npm run qa:agent-quality:score -- \
  --answers /tmp/azure-agent-quality-live-50-combined-after-atlas-rerun.jsonl \
  --out /tmp/azure-agent-quality-live-50-combined-score.json \
  --fail-on-grade F
```

## Initial Run Result

The initial 50-case run completed with three F rows. All three were transport
failures, not expert-answer failures:

```text
atlas-apex-lagging-value: page.goto timeout loading /sign-in
atlas-apex-renewal-clock: page.goto timeout loading /sign-in
atlas-apex-evidence-map: page.goto timeout loading /sign-in
```

Those rows had empty answers because Clerk sign-in did not reach
`domcontentloaded` before the 30s Playwright timeout.

Initial summary:

| Metric | Result |
|---|---:|
| Total cases | 50 |
| Pass | 39 |
| Fail | 11 |
| Grade A | 28 |
| Grade B | 11 |
| Grade C | 7 |
| Grade D | 1 |
| Grade F | 3 |
| Blocking failures at F threshold | 3 |

## Atlas Rerun

The Atlas-only rerun passed the three previously failing Apex cases and
confirmed the original failures were sign-in transport flake.

| Metric | Result |
|---|---:|
| Atlas cases | 10 |
| Pass | 9 |
| Fail | 1 |
| Grade A | 8 |
| Grade B | 1 |
| Grade C | 1 |
| Grade D | 0 |
| Grade F | 0 |
| Blocking failures at F threshold | 0 |

The previously failing Atlas/Apex cases reran as Grade A:

| Case | Grade after rerun | Meaning |
|---|---:|---|
| `atlas-apex-lagging-value` | A | Tower value-lag answer was present, grounded, cited, and action-oriented. |
| `atlas-apex-renewal-clock` | A | Renewal-risk answer was present, grounded, cited, and action-oriented. |
| `atlas-apex-evidence-map` | A | Evidence-map answer was present, grounded, cited, and action-oriented. |

## Combined Current Baseline

After replacing the initial Atlas transport-timeout rows with the Atlas rerun:

| Metric | Result |
|---|---:|
| Total cases | 50 |
| Pass | 41 |
| Fail | 9 |
| Grade A | 31 |
| Grade B | 10 |
| Grade C | 8 |
| Grade D | 1 |
| Grade F | 0 |
| Blocking failures at F threshold | 0 |

By agent:

| Agent | Total | Pass | Fail | A | B | C | D | F |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| Atlas | 10 | 9 | 1 | 8 | 1 | 1 | 0 | 0 |
| Nexus | 10 | 8 | 2 | 7 | 1 | 2 | 0 | 0 |
| Sentinel | 10 | 9 | 1 | 4 | 5 | 1 | 0 | 0 |
| Source | 10 | 8 | 2 | 6 | 2 | 2 | 0 | 0 |
| Steward | 10 | 7 | 3 | 6 | 1 | 2 | 1 | 0 |

By tenant:

| Tenant | Total | Pass | Fail |
|---|---:|---:|---:|
| Apex Retail | 21 | 18 | 3 |
| Meridian Health | 15 | 11 | 4 |
| First Capital | 14 | 12 | 2 |

## Remaining Quality Gaps

The current baseline is good enough to prove the live Azure model path works,
but it is not yet good enough for an unattended customer pilot demo. The
remaining misses are quality gaps, not infrastructure outages.

### Blocking for pilot-green

| Case | Agent | Tenant | Grade | Finding |
|---|---|---|---:|---|
| `steward-production-readiness` | Steward | First Capital | D | Missed explicit `production readiness` and `lab` terms, failed tenant-fact and citation checks. |

This is the only D after the Atlas transport retry. It should be fixed before
using the full multi-agent experience in a customer-facing pilot.

### Non-blocking but important

Common failure modes across B/C rows:

- citation/evidence signal missing even when the answer was otherwise useful;
- tenant-fact scorer misses where the answer was too generic or did not use the
  expected tenant markers;
- missing required phrases in adversarial/continuity cases;
- dissent/risk signal missing on a few Source and Nexus answers.

Representative cases:

| Case | Agent | Grade | Main issue |
|---|---|---:|---|
| `atlas-meridian-adoption-gaps` | Atlas | C | Missing required `value` term and tenant-fact signal. |
| `nexus-adversarial-no-sponsor` | Nexus | C | Correctly refused the move, but missed the exact `do not originate` language and risk signal. |
| `sentinel-first-sr117` | Sentinel | C | Good SR 11-7 answer, but missed explicit `model validation` scorer term and tenant-fact signal. |
| `source-meridian-ambient-ai-vendors` | Source | C | Useful sourcing advice, but missing explicit citation/evidence and dissent/risk signals. |
| `source-continuity-intake-fields` | Source | C | Answer correctly said no prior paragraph was present, but missed expected `missing` term and tenant-fact signal. |
| `steward-meridian-phi-control` | Steward | C | Correct containment stance, but missed explicit `audit` term and tenant-fact signal. |

## Harness Hardening Added

The live runner was hardened after the Atlas timeout finding:

- demo sign-in now retries once before recording a failed captured answer;
- `/sign-in` navigation timeout was raised from 30s to 45s;
- score-file mode now writes the scored JSON when `--out` is provided, matching
  the documented command contract.

This reduces false F rows caused by transient auth-page load failures and makes
the score artifact durable.

## Interpretation

This run proves live authenticated model execution on Azure across all five
agents and all three existing demo tenants. The model path is real, not only a
deterministic fallback.

The result is still a lab baseline, not a customer cutover green light:

- infrastructure and auth path: proven after retry;
- model answer generation: proven for 50 cases;
- no F blockers after retry: achieved;
- one D remains: Steward production-readiness answer must be fixed;
- multiple B/C polish gaps remain: evidence/citation and exact compliance with
  corpus-required terms need tightening.

## Required Follow-Up

1. Fix `steward-production-readiness` so it explicitly addresses production
   readiness, lab-vs-production posture, tenant facts, and evidence/citation.
2. Add a shared answer contract requiring an explicit evidence/source sentence
   when the corpus requires citations.
3. Harden continuity/adversarial templates so they preserve exact required
   refusal and gap language without becoming robotic.
4. Rerun the full 50-case baseline with `--fail-on-grade D`; pilot green should
   mean 0 D/F, then move toward A/B-only for board demos.
5. Store scored JSON artifacts from scheduled runs now that `--out` works for
   score-file mode.
