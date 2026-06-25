# Expert Council Dossier Spec

## Role

The expert council helps Claude interpret and pressure-test the question. It does not replace tenant evidence.

## Selection

The selector uses the existing Consilium expert router and caps the council at 3-7 experts.

It considers:

- tenant industry
- question keywords
- advisory intent
- function/domain relevance
- cross-cutting architecture, data, risk, sourcing, value, and adoption lenses

## Shape

Each expert entry includes:

- expert id
- name or role
- lens
- why selected
- expected contribution
- pressure-test questions
- citation ids

## Guardrail

The prompt composer states: experts interpret and pressure-test; they do not prove tenant facts.
