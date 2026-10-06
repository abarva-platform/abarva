# Responsible AI and model-risk boundary

**SYNTHETIC - NOT CLIENT-ATTESTED.** This scenario is a reporting data
foundation, not an approval to deploy a predictive model or automate HR
decisions.

## Intended system boundary

The ten requested outputs are descriptive/aggregated reports. This scope does
not rank employees, screen applicants, recommend compensation, make promotion
or termination decisions, or infer sensitive traits. Any later predictive or
generative use is a separate proposal requiring its own purpose, risk review,
validation, monitoring, and human-accountability design.

## Controls to estimate and validate

1. Maintain an inventory of reports, models, prompts, and downstream uses; each
   has an owner and approved-purpose statement.
2. Tests assert that excluded personal fields, free text, and direct identifiers
   do not reach Gold datasets or report extracts.
3. Data and semantic changes require versioned review and reproducible tests.
4. A human owner reviews report definitions, exceptions, and publication.
5. If any model is proposed later, assess population impact, bias, explainability,
   appeal/recourse, model monitoring, and legal obligations before build.
6. AI coding assistants may help create synthetic tests or reviewed source code;
   do not provide real HR records or secrets to Claude Code, Codex, or another
   assistant.

## Synthetic test cases

- Attempt to add a prohibited free-text field: schema test must fail.
- Attempt to publish a group below the approved suppression threshold: report
  test must suppress the cell and show a suppression indicator.
- Change a metric formula without updating its version: release gate must fail.
- Introduce an unapproved predictive score: scope and model inventory checks
  must stop publication.

No model performance, fairness result, or production control is asserted here.
