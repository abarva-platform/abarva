# Source/aVa Crawl Report

Generated: 2026-06-22T14:01:46.782Z
Base URL: http://localhost:3000
Event ID: data-ai-modernization-si-selection
Mode: browser-crawl

## Summary

- Verdicts: ACCEPT=0 DEFER=21 REJECT=0
- Routes checked: 12
- Browser status: blocked

## Routes

| Route | Status | Browser access | Evidence terms |
|---|---:|---|---|
| `/source` |  | blocked |  |
| `/source/value` |  | error |  |
| `/source/events/data-ai-modernization-si-selection` |  | blocked |  |
| `/source/events/data-ai-modernization-si-selection/scope` |  | blocked |  |
| `/source/events/data-ai-modernization-si-selection/rfp` |  | blocked |  |
| `/source/events/data-ai-modernization-si-selection/responses` |  | blocked |  |
| `/source/events/data-ai-modernization-si-selection/scorecard` |  | blocked |  |
| `/source/events/data-ai-modernization-si-selection/pricing` |  | blocked |  |
| `/source/events/data-ai-modernization-si-selection/bafo` |  | blocked |  |
| `/source/events/data-ai-modernization-si-selection/decision` |  | blocked |  |
| `/source/events/data-ai-modernization-si-selection/transition` |  | blocked |  |
| `/source/events/data-ai-modernization-si-selection/value` |  | blocked |  |

## Lifecycle Checks

| Stage | Verdict | UI evidence | Response evidence | Required fix |
|---|---|---|---|---|
| Current state | DEFER |  |  | Run with a signed-in browser session or test credentials and attach the resulting report before release. |
| Demand challenge | DEFER |  |  | Run with a signed-in browser session or test credentials and attach the resulting report before release. |
| Scope | DEFER |  |  | Run with a signed-in browser session or test credentials and attach the resulting report before release. |
| RFP | DEFER |  |  | Run with a signed-in browser session or test credentials and attach the resulting report before release. |
| Vendor responses | DEFER |  |  | Run with a signed-in browser session or test credentials and attach the resulting report before release. |
| Evaluation | DEFER |  |  | Run with a signed-in browser session or test credentials and attach the resulting report before release. |
| Pricing | DEFER |  |  | Run with a signed-in browser session or test credentials and attach the resulting report before release. |
| BAFO | DEFER |  |  | Run with a signed-in browser session or test credentials and attach the resulting report before release. |
| Executive decision | DEFER |  |  | Run with a signed-in browser session or test credentials and attach the resulting report before release. |
| Transition | DEFER |  |  | Run with a signed-in browser session or test credentials and attach the resulting report before release. |
| Value realization | DEFER |  |  | Run with a signed-in browser session or test credentials and attach the resulting report before release. |

## Persona Verdicts

### CIO

Persona: CIO
Route: `/source`
Scenario: CIO reviews active sourcing portfolio before weekly operating review
Verdict: DEFER
Rationale: Browser route was protected or redirected to auth; signed-in behavior was not proven.
Evidence observed: None proved
Nexus response observed: Not supplied. Use --response-file to score captured aVa/Nexus responses.
Failures: Browser access blocked by auth or route protection; Missing UI terms: active events, lifecycle, status, owner, aging; No captured aVa/Nexus response supplied
Required fix before release: Run with a signed-in browser session or test credentials and attach the resulting report before release.

### CFO

Persona: CFO
Route: `/source`
Scenario: CFO reviews value at stake, assumptions, confidence, and delay impact
Verdict: DEFER
Rationale: Browser route was protected or redirected to auth; signed-in behavior was not proven.
Evidence observed: None proved
Nexus response observed: Not supplied. Use --response-file to score captured aVa/Nexus responses.
Failures: Browser access blocked by auth or route protection; Missing UI terms: value at stake, projected, assumption, confidence, owner; No captured aVa/Nexus response supplied
Required fix before release: Run with a signed-in browser session or test credentials and attach the resulting report before release.

### Procurement leader

Persona: Procurement leader
Route: `/source/events/data-ai-modernization-si-selection`
Scenario: Procurement leader checks whether the RFP can be released
Verdict: DEFER
Rationale: Browser route was protected or redirected to auth; signed-in behavior was not proven.
Evidence observed: None proved
Nexus response observed: Not supplied. Use --response-file to score captured aVa/Nexus responses.
Failures: Browser access blocked by auth or route protection; Missing UI terms: gate, required inputs, scorecard, artifact, readiness; No captured aVa/Nexus response supplied
Required fix before release: Run with a signed-in browser session or test credentials and attach the resulting report before release.

### CTO

Persona: CTO
Route: `/source/events/data-ai-modernization-si-selection/scorecard`
Scenario: CTO reviews scorecard defaults before vendor evaluation begins
Verdict: DEFER
Rationale: Browser route was protected or redirected to auth; signed-in behavior was not proven.
Evidence observed: None proved
Nexus response observed: Not supplied. Use --response-file to score captured aVa/Nexus responses.
Failures: Browser access blocked by auth or route protection; Missing UI terms: technical, criteria, weight, rationale, security; No captured aVa/Nexus response supplied
Required fix before release: Run with a signed-in browser session or test credentials and attach the resulting report before release.

### PMO lead

Persona: PMO lead
Route: `/source`
Scenario: PMO lead runs daily review of waiting or stuck events
Verdict: DEFER
Rationale: Browser route was protected or redirected to auth; signed-in behavior was not proven.
Evidence observed: None proved
Nexus response observed: Not supplied. Use --response-file to score captured aVa/Nexus responses.
Failures: Browser access blocked by auth or route protection; Missing UI terms: blocked, owner, aging, due, next action; No captured aVa/Nexus response supplied
Required fix before release: Run with a signed-in browser session or test credentials and attach the resulting report before release.

### Legal/compliance reviewer

Persona: Legal/compliance reviewer
Route: `/source/events/data-ai-modernization-si-selection`
Scenario: Legal reviews RFP package and vendor exception handling
Verdict: DEFER
Rationale: Browser route was protected or redirected to auth; signed-in behavior was not proven.
Evidence observed: None proved
Nexus response observed: Not supplied. Use --response-file to score captured aVa/Nexus responses.
Failures: Browser access blocked by auth or route protection; Missing UI terms: evidence, compliance, audit, gate, artifact; No captured aVa/Nexus response supplied
Required fix before release: Run with a signed-in browser session or test credentials and attach the resulting report before release.

### Business sponsor

Persona: Business sponsor
Route: `/source/events/data-ai-modernization-si-selection/decision`
Scenario: Sponsor reviews recommendation before vendor selection decision
Verdict: DEFER
Rationale: Browser route was protected or redirected to auth; signed-in behavior was not proven.
Evidence observed: None proved
Nexus response observed: Not supplied. Use --response-file to score captured aVa/Nexus responses.
Failures: Browser access blocked by auth or route protection; Missing UI terms: decision, recommendation, alternative, value, risk; No captured aVa/Nexus response supplied
Required fix before release: Run with a signed-in browser session or test credentials and attach the resulting report before release.

### Sourcing lead

Persona: Sourcing lead
Route: `/source/events/data-ai-modernization-si-selection`
Scenario: Sourcing lead checks vendor response status and exception normalization
Verdict: DEFER
Rationale: Browser route was protected or redirected to auth; signed-in behavior was not proven.
Evidence observed: None proved
Nexus response observed: Not supplied. Use --response-file to score captured aVa/Nexus responses.
Failures: Browser access blocked by auth or route protection; Missing UI terms: vendor response, exception, normalization, scorecard, readiness; No captured aVa/Nexus response supplied
Required fix before release: Run with a signed-in browser session or test credentials and attach the resulting report before release.


## Table And Chart Evidence

| Expectation | Verdict | Rationale |
|---|---|---|
| Response table evidence | DEFER | Could not prove both structure and evidence terms in accessible browser text. |
| Chart evidence | DEFER | Could not prove both structure and evidence terms in accessible browser text. |
