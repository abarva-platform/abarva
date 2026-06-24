# Home Org Answer Before / After

## Question

`how is our IT and business organized today? who are our technology leaders under our CIO?`

## Before

The live stale revision answered with a false refusal:

> The organizational structure of IT and business functions cannot be characterized from the available information...

Why this failed:

- It led with absence instead of synthesis.
- It treated missing named-person leader mapping as if the entire operating model were missing.
- It used loader-style language and row-count-style detail.
- It did not explain the role/domain/portfolio accountability that Home can safely answer from the loaded context.

## After

The expected answer shape is:

> The loaded Home context supports a portfolio-led view of IT and business organization. Technology accountability is visible by role, domain, and portfolio where the tenant supplied those fields, while named individual leaders under the CIO are not loaded. That means aVa can explain the operating model and role-level accountability, but should not invent a people-org chart until leader-name data is added.

## Guardrails

The regression gate fails visible prose containing:

- `cannot be characterized`
- `cannot be identified`
- `I found`
- row-count leads
- `missing source support` as the lead
- `named contract owner` for this org question
- raw IDs
- `Read:` or `Evidence:` debug labels

Proof/source details remain expandable; they do not lead the answer.
