# Home + Intelligence 60Q Live Audit - Combined Summary

Home source run: /Users/anand/Projects/nexus/proof/home-intelligence-50q-live-audit/2026-07-06T23-23-14-036Z
Intelligence source run: /Users/anand/Projects/nexus/proof/home-intelligence-50q-live-audit/2026-07-06T22-57-24-137Z

## Aggregate

- Total questions: 60
- Pass/watch/fail: 41/19/0
- Average score: 4.8 / 5
- P95 latency: 36960 ms

## By Module

- home: 24/0/0 pass/watch/fail across 24
- intelligence: 17/19/0 pass/watch/fail across 36

## By Tenant

- lakeshore: 34/8/0 pass/watch/fail across 42
- skyharbor: 7/11/0 pass/watch/fail across 18

## Raw Marker / Renderer Leak Scan

- No <<<TAB:, grounding:, raw JSON canvasType, or Sentinel leaks detected in Intelligence rendered text.

## Main Watch Themes

- answer_too_long: 18
- missing_expected:SkyHarbor: 2
- missing_expected:portfolio: 1

## Prompt / Response Boundary

- Home: this run captured settled browser-rendered behavior, not raw model prompts. The intended contract is context browsing/routing plus safe redirect for advisory/general questions; exact Home prompt capture still needs route-level instrumentation if the deployed Home branch uses an async model endpoint.
- Intelligence: per-question prompt reconstructions are saved under the Intelligence run prompts/ folder. The production audit table exposed workflow/hash metadata only in this environment; raw model prompt snapshots were not available from local env.
- Rendered-vs-returned: Intelligence API stream returned rendered answer text with event types session/classified/sources/intelligence-dossier/advisory-packet/delta/followups/agent-answer/done. No marker leakage was found.

## Artifact Index

- Combined JSON: /Users/anand/Projects/nexus/proof/home-intelligence-50q-live-audit/combined-2026-07-06T23-23-14-036Z/combined-results.json
- Home report: /Users/anand/Projects/nexus/proof/home-intelligence-50q-live-audit/2026-07-06T23-23-14-036Z/report.html
- Intelligence report: /Users/anand/Projects/nexus/proof/home-intelligence-50q-live-audit/2026-07-06T22-57-24-137Z/report.html
- Prompt reconstructions: /Users/anand/Projects/nexus/proof/home-intelligence-50q-live-audit/2026-07-06T22-57-24-137Z/prompts