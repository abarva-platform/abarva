# Knowledge Layer Demo Readiness Proof

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
- Visible enabled route uses demo-ready Nexus Knowledge language; proof details stay collapsed.

## Scenarios

| Scenario | Catalog | Shared profiles | Shared relationships | Shared evidence | Confidence | Intelligence timing |
| --- | --- | ---: | ---: | ---: | --- | ---: |
| Meridian - Agent Assist / Member Service | meridian-health-agent-assist-member-service | 36 | 35 | 5 | good | 0ms |
| Meridian - Finance Analytics | meridian-health-finance-analytics | 53 | 52 | 5 | good | 0ms |
| HarborTrust - Fraud Analyst Copilot | harbortrust-bank-fraud-analyst-copilot | 35 | 34 | 5 | good | 0ms |
| Generic - Vendor Onboarding Modernization | meridian-health-vendor-onboarding-modernization | 32 | 31 | 4 | limited | 0ms |

## Failures

- None
