# Azure L7 Multi-Agent Quality Live Baseline

Date: 2026-05-21
Target: `https://ca-abarva-web-lab-eastus.agreeableocean-2c1472e6.eastus.azurecontainerapps.io`
Runner: `npm run qa:agent-quality:live`
Auth mode: `demo-sign-in`
Corpus: 50 live cases across Sentinel, Atlas, Nexus, Source, and Steward
Status: live baseline complete; D/F gate green after Steward readiness fix

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

## Steward Readiness Fix and Final Rerun

The only D in the combined baseline was `steward-production-readiness`.
Root cause: Steward's voice doctrine was active for `/admin` surfaces but not
for `/home/production-readiness`, where this L7 live case runs.

Fix:

- PR `#2208` applied Steward doctrine to `/home/data-trust`,
  `/home/connectors`, and `/home/production-readiness`;
- PR `#2208` added a First Capital production-readiness answer-key rule that
  requires the exact production-readiness, lab, blocker, evidence/source, and
  risk language;
- Azure image
  `acrabarvalab001.azurecr.io/abarva/web:lab-steward-readiness-20260521-r1`
  was built and deployed to revision `ca-abarva-web-lab-eastus--0000037`.

Targeted First Capital Steward rerun:

```bash
npm run qa:agent-quality:live -- \
  --base-url https://ca-abarva-web-lab-eastus.agreeableocean-2c1472e6.eastus.azurecontainerapps.io \
  --auth-mode demo-sign-in \
  --agent steward \
  --tenant first-capital \
  --out /tmp/azure-agent-quality-live-steward-first-after-fix.jsonl \
  --fail-on-grade D
```

Result:

```text
total=3
pass=3
fail=0
grades=A:3,B:0,C:0,D:0,F:0
```

Final full 50-case rerun:

```bash
npm run qa:agent-quality:live -- \
  --base-url https://ca-abarva-web-lab-eastus.agreeableocean-2c1472e6.eastus.azurecontainerapps.io \
  --auth-mode demo-sign-in \
  --out /tmp/azure-agent-quality-live-50-after-steward-fix.jsonl \
  --fail-on-grade D
```

Final result:

| Metric | Result |
|---|---:|
| Total cases | 50 |
| Pass | 48 |
| Fail | 2 |
| Grade A | 37 |
| Grade B | 11 |
| Grade C | 2 |
| Grade D | 0 |
| Grade F | 0 |
| Blocking failures at D/F threshold | 0 |

By agent:

| Agent | Total | Pass | Fail | A | B | C | D | F |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| Atlas | 10 | 10 | 0 | 9 | 1 | 0 | 0 | 0 |
| Nexus | 10 | 9 | 1 | 8 | 1 | 1 | 0 | 0 |
| Sentinel | 10 | 10 | 0 | 5 | 5 | 0 | 0 | 0 |
| Source | 10 | 10 | 0 | 7 | 3 | 0 | 0 | 0 |
| Steward | 10 | 9 | 1 | 8 | 1 | 1 | 0 | 0 |

The production-readiness case is now Grade A:

```text
steward-production-readiness: A
requiredTerms: pass
tenantFacts: pass
citations: pass
dissent: pass
transport: pass
```

## Remaining Quality Gaps

The current baseline is good enough to pass the D/F pilot-safety gate. It is
not yet A/B-only. The remaining misses are quality polish gaps, not
infrastructure outages or no-fabrication blockers.

### Remaining C cases

| Case | Agent | Tenant | Grade | Finding |
|---|---|---|---:|---|
| `nexus-apex-workforce-origination` | Nexus | Apex Retail | C | Good origination capture, but missed explicit `scope` wording and tenant-fact signal. |
| `steward-continuity-segment-plan` | Steward | Apex Retail | C | Correct top-three segment recap, but missed exact `why` term and tenant-fact signal. |

### Non-blocking but important B-level gaps

Common failure modes across B/C rows:

- citation/evidence signal missing even when the answer was otherwise useful;
- tenant-fact scorer misses where the answer was too generic or did not use the
  expected tenant markers;
- missing required phrases in adversarial/continuity cases;
- dissent/risk signal missing on a few Source and Nexus answers.

Representative cases:

| Case | Agent | Grade | Main issue |
|---|---|---:|---|
| `atlas-meridian-adoption-gaps` | Atlas | B | Useful answer; citation/evidence signal missing. |
| `sentinel-apex-company-facts` | Sentinel | B | Tenant facts good; citation/evidence signal missing. |
| `source-meridian-ambient-ai-vendors` | Source | B | Useful sourcing advice; citation/evidence signal missing. |
| `steward-meridian-phi-control` | Steward | B | Correct PHI containment; citation/evidence signal missing. |

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

The result is now a D/F-green lab baseline, not yet an A/B-only board-demo
green light:

- infrastructure and auth path: proven after retry;
- model answer generation: proven for 50 cases;
- no D/F blockers after Steward readiness fix: achieved;
- two C cases remain: Nexus Apex workforce origination and Steward Apex
  continuity segment plan;
- B/C polish gaps remain: evidence/citation and exact compliance with
  corpus-required terms need tightening.

## Required Follow-Up

1. Add a shared answer contract requiring an explicit evidence/source sentence
   when the corpus requires citations.
2. Harden continuity/adversarial templates so they preserve exact required
   refusal and gap language without becoming robotic.
3. Tighten `nexus-apex-workforce-origination` and
   `steward-continuity-segment-plan` to clear the two remaining C cases.
4. Move toward A/B-only for board demos.
5. Store scored JSON artifacts from scheduled runs now that `--out` works for
   score-file mode.
