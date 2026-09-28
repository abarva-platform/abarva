# P4 Estimate Method and Assumptions

## Purpose
Planning estimate for a bounded pilot, not a vendor quote, commitment, approved funding request or savings case. All rates/hours are synthetic assumptions.

## Arithmetic
- AI hours saved = base hours × eligible acceleration percentage.
- Human review hours are added explicitly; model use does not remove them.
- For each low/base/high scenario, adjusted hours = scenario hours × (1 − eligible acceleration percentage) + human review hours.
- Scenario cost = adjusted hours × the disclosed blended planning rate. The role mix is shown on every work-package row; replace blended rates with approved role-level rate cards before funding.

Example: 360 engineering hours × 15% = 54 hours saved; add 18 human-review hours; adjusted effort = 324 hours; 324 × $190 = $61,560. This is a sensitivity assumption, not measured productivity.

Security approvals, human acceptance, evidence review, business decisions, deployment controls, and Finance validation receive no AI discount. AI-assisted effort is an adjustable sensitivity; Claude Code/Codex are accelerators for eligible scaffolding, tests and documentation, not substitutes for engineering ownership or acceptance.

Internal and vendor cases must cover the same acceptance criteria, security controls, testing, and support. Obtain actual rate cards before funding. Low/base/high hours are synthetic planning ranges, not statistical confidence intervals; refine them with the team after source interfaces, queue, cohort, data access and acceptance criteria are confirmed. No savings ROI is included because baseline definitions conflict and capacity conversion is not Finance-validated.
