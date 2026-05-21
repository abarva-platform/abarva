# Azure L7 Source Agent Quality Live Baseline

Date: 2026-05-21
Target: `https://ca-abarva-web-lab-eastus.agreeableocean-2c1472e6.eastus.azurecontainerapps.io`
Runner: `npm run qa:agent-quality:live`
Auth mode: `demo-sign-in`
Agent subset: Source only
Status: pass with quality improvements needed

## Command

```bash
npm run qa:agent-quality:live -- \
  --base-url https://ca-abarva-web-lab-eastus.agreeableocean-2c1472e6.eastus.azurecontainerapps.io \
  --auth-mode demo-sign-in \
  --agent source \
  --out /tmp/azure-source-agent-quality-live-10.jsonl \
  --fail-on-grade D
```

## Result

| Metric | Result |
|---|---:|
| Total Source cases | 10 |
| Pass | 9 |
| Fail | 1 |
| Blocking failures at D/F threshold | 0 |
| Grade A | 4 |
| Grade B | 5 |
| Grade C | 1 |
| Grade D | 0 |
| Grade F | 0 |

Tenant split:

| Tenant | Total | Pass | Fail |
|---|---:|---:|---:|
| Apex Retail | 4 | 3 | 1 |
| Meridian Health | 3 | 3 | 0 |
| First Capital | 3 | 3 | 0 |

## Case Scores

| Case | Tenant | Grade | Main finding |
|---|---|---:|---|
| `source-apex-cdp-rfp` | Apex Retail | B | Strong sourcing questions; citation/evidence signal missing. |
| `source-apex-si-renewal` | Apex Retail | C | Missed required `overpaying` term and tenant-fact check. |
| `source-apex-build-buy` | Apex Retail | B | Good partner/build judgment; citation/evidence signal missing. |
| `source-meridian-ambient-ai-vendors` | Meridian Health | B | Good scoping guidance; dissent/risk signal missing. |
| `source-meridian-hcc-vendor` | Meridian Health | A | Passed required terms, evidence, dissent, and transport. |
| `source-first-aml-triage` | First Capital | B | Regulatory sourcing stance present; citation/evidence signal missing. |
| `source-first-core-modernization` | First Capital | A | Passed required terms, evidence, dissent, and transport. |
| `source-adversarial-fake-reference` | Apex Retail | A | Correctly refused to fabricate references. |
| `source-continuity-intake-fields` | Meridian Health | A | Correctly preserved continuity and asked for missing input. |
| `source-value-outcomes` | First Capital | B | Value framing present; citation/evidence signal missing. |

## Interpretation

This run proves the Azure app can execute live authenticated Source agent turns
through `/api/chat/agent` using demo sign-in. The earlier deterministic Source
Nexus route remains useful, but this is the first current Azure baseline for
the live agent path.

The quality is acceptable for a lab baseline, not yet pilot-grade:

- no transport failures after the initial transient sign-in timeout;
- no D/F blockers at the configured threshold;
- the Source agent is generally commercially useful and tenant-specific;
- citation/evidence discipline needs hardening;
- one Apex SI renewal response missed the explicit `overpaying` term expected
  by the corpus.

## Required Follow-Up

1. Strengthen the Source agent prompt/context contract so every answer includes
   an explicit evidence/citation phrase when the corpus requires it.
2. Improve the Apex SI renewal path so it names overpayment/overpaying exposure
   directly when asked by the CFO.
3. Promote the threshold from no D/F blockers to A/B-only for pilot demos after
   those fixes.
4. Run the full 50-case live agent-quality baseline across Sentinel, Atlas,
   Nexus, Source, and Steward before customer-facing AI-agent demos.
