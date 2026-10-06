# Platform and architecture readiness

**SYNTHETIC - NOT CLIENT-ATTESTED.** The following is a reference target
pattern to estimate against. It is not a deployed topology or approved design.

## Candidate target pattern

1. **Ingest:** use an approved API or controlled export; land an immutable,
   encrypted source snapshot with schema/version and batch metadata.
2. **Bronze:** preserve source fidelity, minimize access, apply retention and
   deletion controls, and prevent casual analyst access to raw HR data.
3. **Silver:** validate codes, resolve approved worker/org keys, standardize
   effective dates, and quarantine exceptions with owners.
4. **Gold:** publish only purpose-approved aggregates and certified measures;
   include privacy suppression and freshness status.
5. **Serve:** expose ten versioned reports through the existing approved BI
   surface where feasible. Reuse current identity, audit, and monitoring
   capabilities rather than assuming a new platform is needed.

## Build / extend / reuse questions

| Capability | Initial hypothesis | Proof required before estimate is final |
|---|---|---|
| Landing and orchestration | Extend existing managed data platform if it meets isolation and audit needs | Environment, connector, scheduler, and run log inventory |
| Bronze/Silver/Gold models | Build a scoped HR domain pipeline | Current medallion conventions, deployment tooling, data tests |
| Semantic layer | Reuse certified metrics if definitions already exist; otherwise create a versioned HR package | Existing catalog, owner, and semantic model review |
| Report delivery | Reuse current BI platform and access model | License/capacity, row-level controls, refresh quotas |
| Identity resolution | Reuse enterprise worker key if governed and stable | Data dictionary, lifecycle and rehire rules, key stewardship |
| Observability | Reuse platform monitoring plus domain quality dashboard | Alert ownership, retention and incident workflow |

## Design constraints to validate

- Separate lower environments from production; no unapproved production extracts
  in development.
- Store secrets in the approved vault; never in a workbook, notebook, prompt,
  or repository.
- Keep human approval over report definitions, exception acceptance, and
  release. Automation may validate; it does not create business authority.
- Avoid redesigning HR processes or decision rights in this technical scope.
- No raw HR extract or row-level output is sent to Claude Code, Codex, or any
  generative service. Coding assistants may accelerate synthetic scaffolding,
  tests, documentation, and reviewed code only.

## Estimate boundary

This architecture is detailed enough to size discovery, access validation,
pipeline construction, model certification, report build, test, security review,
and handoff. It is not a complete low-level design: environment diagrams,
network routes, exact service SKUs, production field mappings, runbook commands,
and final control evidence belong in roadmap execution.
