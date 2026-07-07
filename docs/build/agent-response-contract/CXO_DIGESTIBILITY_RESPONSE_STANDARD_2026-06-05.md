# CXO Digestibility Response Standard

Date: 2026-06-05
Scope: All AbarVa clients and strategic agent surfaces

## Standard

Hard CXO or strategic questions should default to a short decision digest, not a wall of prose. The answer should be scannable in 10 seconds, show the recommendation, expose the evidence basis, and make the next decision fork obvious.

Use this shape for strategic answers:

1. My read
   One direct recommendation or judgment.

2. Why
   Two or three evidence-backed reasons, each short.

3. Decision fork
   Use two options when uncertainty or strategy matters:
   - Option A: faster, narrower, or lower-risk.
   - Option B: bigger, more transformative, or higher-dependency.

4. What I would do next
   One concrete action.

5. Evidence gap
   One line naming the proof still needed.

Simple factual questions should stay simple. Do not force a report shape when a one-paragraph answer is enough.

## Applies To

- Sentinel / Intelligence
- Nexus / Moves
- Atlas / Tower
- Source advisor responses
- Setup / Steward readiness guidance
- QA golden-answer scoring

## Guardrails

- Avoid wall-of-text answers over roughly 120 words before the first visual break.
- Avoid raw pattern IDs, use-case IDs, database field names, vendor IDs, or artifact IDs unless the user asks for evidence-field references.
- Use short labeled sections for complex answers.
- If the right answer depends on uncertainty, show two clear choices.
- Always end complex answers with one concrete next move or one evidence gap.
- Keep tenant facts tenant-scoped. Do not import another client's facts unless the user explicitly asks for a cross-client comparison.

## Example Shape

My read:
Fund the treasury program as a data-readiness and operating-control move first, not as an AI forecasting deployment first.

Why:
- The value depends on clean bank connectivity, ERP feeds, entity hierarchy, and historical cash reconstruction.
- AI forecasting is weak until cash-position history and variance rules are governed.
- Finance should treat savings as projected until the CFO attests the baseline and measurement method.

Decision fork:
- Option A: Prove the foundation first. Lower risk, slower AI story.
- Option B: Launch one narrow AI pilot now. Faster demo, higher dependency risk.

What I would do next:
Approve a 30-day readiness sprint with treasury, finance, ERP, and bank-connectivity owners named.

Evidence gap:
The loaded context still needs owner-attested bank-feed status, historical cash completeness, and finance-approved baseline values.
