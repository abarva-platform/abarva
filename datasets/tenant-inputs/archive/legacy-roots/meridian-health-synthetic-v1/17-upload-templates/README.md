# Meridian Context Layer Upload Templates

These templates show how Meridian's healthcare context layer is built from
operator-owned files, not from static demo copy. Each file maps to an existing
Meridian substrate family and can be used in a walkthrough from upload to
classification, parsing, validation, approval, embedding, and evidence-backed
agent retrieval.

The set intentionally covers clinical, revenue-cycle, IT, regulatory, vendor,
workforce, finance, and data-platform dimensions so a Meridian pilot can show
more than a generic healthcare chatbot. The target is to demonstrate how the
same ingestion path can accept real client artifacts later without changing the
control plane.

Minimum showcase bar:

- 20 or more healthcare upload templates.
- 8 or more guided upload scenarios.
- Every template declares owner role, refresh cadence, required fields,
  downstream agent workflows, and evidence checks in `template-catalog.json`.
- Templates remain synthetic and PHI-free.
