# Intelligence Knowledge Runtime Proof

Generated: 2026-07-15T00:00:00.000Z
Verdict: PASS

## Truth Split

- Feature flag defaults to false.
- Existing Intelligence behavior and default Claude prompt are unchanged.
- Claude is not called by this audit.
- No production tenant data writes, Active Tenant Access updates, or candidate promotion occur.
- Candidate context is excluded from active mode unless explicitly requested by a future path.

## Scenarios

| Scenario | Tenant | Selected catalog | Profiles | Relationships | Evidence | Gaps | Timing misses |
| --- | --- | --- | ---: | ---: | ---: | ---: | --- |
| Meridian — Agent Assist member service readiness | meridian-health | meridian-health-agent-assist-member-service | 36 | 35 | 5 | 4 | none |
| Meridian — Finance Analytics modernization | meridian-health | meridian-health-finance-analytics | 53 | 52 | 5 | 4 | none |
| HarborTrust — Fraud analyst copilot | harbortrust-bank | harbortrust-bank-fraud-analyst-copilot | 35 | 34 | 5 | 4 | none |
| Generic — Vendor onboarding modernization fallback | meridian-health | meridian-health-vendor-onboarding-modernization | 32 | 31 | 4 | 4 | none |

## Quality Assessment

The Intelligence runtime assembles fast and deep governed context before any Claude handoff, keeps unsupported claims outside the model-visible payload, and preserves active-vs-candidate boundaries.
