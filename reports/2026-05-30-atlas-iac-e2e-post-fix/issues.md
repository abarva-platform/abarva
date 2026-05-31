# Atlas IAC E2E Post-Fix — Issues

Discovered during the post-fix run on `feat/atlas-iac-e2e-harness-post-fix` at `2026-05-30T23:53:29.447Z`.

## [P2] 6 non-adversarial / non-stretch turn(s) declined as intent=none — would route to scripted/LLM via orchestrator

These are portfolio-level questions ("which is most behind", "portfolio percentile distribution") that the IAC composer correctly declines because they are not initiative- or archetype-shaped. In production the orchestrator routes them to scripted intents (`portfolio_status`, `value_attainment_vs_commitment`). Not a bug — surfaced as a coverage observation for the harness:

- `apex-retail` · `Q02-most-behind`: intent=none
- `apex-retail` · `Q04-portfolio-percentile`: intent=none
- `meridian-health` · `Q02-most-behind`: intent=none
- `meridian-health` · `Q04-portfolio-percentile`: intent=none
- `first-capital` · `Q02-most-behind`: intent=none
- `first-capital` · `Q04-portfolio-percentile`: intent=none

