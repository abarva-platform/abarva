# Home Consultant Synthesis Evaluation

## What We Compare

`src/lib/home/know/evaluate-home-consultant-synthesis.ts` produces side-by-side
evaluation rows:

1. dossier summary
2. deterministic composer output
3. Claude consultant synthesis output
4. quality gate result
5. final rendered answer
6. difference analysis
7. recommendation: `use_claude`, `fallback`, or `needs_fix`

## Required Test Matrix

SkyHarbor:

1. How is our IT and business organized today? Who are our technology leaders under our CIO?
2. Which systems and applications are loaded, and what domains do they support?
3. What does the data and analytics estate tell us?
4. What vendor and contract context is loaded?
5. What are the biggest context gaps?
6. Where should SkyHarbor place the next $30M in AI?

Lakeshore:

1. What do we know about Lakeshore's IT and business organization today?
2. Which systems and applications are loaded for Lakeshore?
3. What does Lakeshore's data and analytics estate tell us?
4. What vendor and contract context is loaded?
5. What are Lakeshore's biggest context gaps?
6. Where should Lakeshore invest next in AI?

## Scoring

Claude must beat deterministic output on:

- executive readability
- business implication
- gap specificity
- artifact narration
- citation discipline
- Home/Intelligence boundary

Claude must not weaken:

- grounding
- tenant fence
- no-fabrication standard
- no raw IDs/internal terms

## Acceptance

The final answer can use Claude only when the validator passes. Otherwise the
deterministic dossier composer remains the final answer.
