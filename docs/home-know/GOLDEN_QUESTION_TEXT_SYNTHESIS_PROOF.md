# Golden Question Text Synthesis Proof

Status: implementation candidate, pending live ACA proof.

Golden question:

> How is our IT and business organized today? Who are our technology leaders under our CIO?

Required live result:

- Claude invoked: true
- output mode: text
- Claude selected: true
- deterministic fallback: false
- answer starts with synthesis
- loaded named leaders included when present in the dossier
- no banned phrases
- no raw IDs
- no debug labels
- no JSON parsing failure
- deterministic artifacts/citations still attached

Expected style:

> SkyHarbor Air's loaded context supports a portfolio-led view of IT and business organization. Technology accountability is visible across business functions, IT domains, application ownership, and executive/role-level leadership. The loaded leadership evidence includes named leaders where available...

Proof bundle path after live verification:

`proof/home-consultant-text-synthesis/`

