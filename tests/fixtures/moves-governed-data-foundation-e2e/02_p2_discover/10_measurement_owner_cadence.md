# Measurement owners and operating cadence

**SYNTHETIC - NOT CLIENT-ATTESTED.** Owners below are role placeholders. No
actual baseline, target, or service level has been measured or approved.

| Measure | Candidate definition | Owner role | Cadence | Source required | Status |
|---|---|---|---|---|---|
| Report inventory completion | Approved report definitions / 10 requested reports | HR analytics product owner | Weekly during delivery | Decision log | Synthetic target only |
| Source-to-Gold freshness | Elapsed time from accepted source batch to certified Gold publication | Data platform owner | Each run / monthly review | Pipeline run metadata | Baseline unknown |
| Critical quality-rule pass rate | Critical rules passed / critical rules executed | Data quality owner | Each run | Rule results | Baseline unknown |
| Semantic certification coverage | Reports with approved metric contract / 10 | Data Product Council | At each release | Versioned metric registry | Baseline unknown |
| Access review completion | In-scope grants reviewed / grants due | Security owner | Quarterly | Entitlement review record | Baseline unknown |
| Report adoption | Authorized users / eligible group, using privacy-safe aggregation | HR business owner | Monthly after launch | Aggregate usage telemetry | Instrumentation unknown |
| User-reported usefulness | Structured feedback with response rate and sample size | HR business owner | Monthly after launch | Feedback instrument | No survey exists in scenario |

The first delivery measure is completeness of the ten-report scope, not a
business outcome. Adoption is business-owned; this technical project does not
include HR process redesign, workforce behavior change, or a change-management
program. A later roadmap may include training support if the business requests
and funds it.

Every target must be paired with a definition, source, population, owner,
baseline period, and review cadence. Do not present a target as a current-state
fact or as realized value.
