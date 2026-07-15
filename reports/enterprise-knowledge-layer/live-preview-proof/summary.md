# Knowledge Layer Live Preview Proof

Generated: 2026-07-15T00:00:00.000Z
Verdict: PASS

## Route

- Path: `/admin/knowledge-preview`
- Required token: `?proof=knowledge-layer-live-preview`
- Navigation exposure: false
- Default state: disabled guardrail only

## Truth Split

- Hidden lab-only route exists.
- Preview flags default false.
- No default Home, Moves, or Intelligence behavior change.
- No default Claude behavior change.
- No tenant writes, Active Tenant Access updates, or candidate promotion.
- Signed-in browser proof is required after deployment.

## Scenarios

| Scenario | Catalog | Shared profiles | Shared relationships | Shared evidence | Confidence | Intelligence timing |
| --- | --- | ---: | ---: | ---: | --- | ---: |
| Meridian - Agent Assist / Member Service | meridian-health-agent-assist-member-service | 36 | 35 | 5 | good | 0.54ms |
| Meridian - Finance Analytics | meridian-health-finance-analytics | 53 | 52 | 5 | good | 0.61ms |
| HarborTrust - Fraud Analyst Copilot | harbortrust-bank-fraud-analyst-copilot | 35 | 34 | 5 | good | 0.33ms |
| Generic - Vendor Onboarding Modernization | meridian-health-vendor-onboarding-modernization | 32 | 31 | 4 | limited | 0.3ms |

## Failures

- None
