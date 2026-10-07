# Platform and architecture readiness

**SYNTHETIC - NOT CLIENT-ATTESTED.** No real environment inventory, no actual
architecture diagram, and no production configuration is represented here.

## Working model for the scenario

A governed data foundation for the synthetic IDN needs a platform that can hold
PHI safely, separate governed zones, serve certified measures to analytics and
AI, and keep an auditable boundary between raw clinical/claims data and the
curated layer that models and reports consume.

## Candidate zones and responsibilities

| Zone | Purpose (synthetic) | Control expectation |
|---|---|---|
| Restricted ingestion | Land raw EHR/claims/enrollment extracts | PHI-restricted; access logged; no direct consumer reads |
| Curated / certified | Governed, versioned certified datasets and measures | Read only via approved definitions; lineage recorded |
| Serving | Datasets/features served to analytics and AI | Minimum necessary; de-identified where possible |
| Model context | Governed slices passed to AI/LLM features | No raw PHI to ungoverned models; approved use only |

## Readiness questions for design

1. Which environments exist today, and which can legally hold PHI under the
   client's agreements? (Not established here.)
2. Is there a governed curated layer, or do reports read raw sources directly?
3. How are non-production environments de-identified or minimized?
4. What is the current path by which data reaches a model, and is it governed?
5. Where are the boundaries that keep behavioral-health (42 CFR Part 2) data
   segmented?

## Still required before this is a client fact

The real platform inventory, the data-residency and PHI-handling agreements, the
existing curated-layer coverage, and the current model-access path are not known
here and must be confirmed with the client before sizing a build.
