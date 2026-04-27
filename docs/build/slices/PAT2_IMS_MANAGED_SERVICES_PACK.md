# PAT2 · Infrastructure Managed Services (IMS) Pattern Pack

Slice ID: PAT2_W27
Wave: wave-27
Status: code_complete
Authored: 2026-04-26
Author: Code (sole)

Deterministic pattern pack for infrastructure managed services sourcing events.
Covers vendor selection criteria, standard P1–P4 SLA structure, failure modes,
and BAFO readiness signals for cloud infrastructure and application operations
managed services. **No live runtime, no model invocation, no migrations, no UI.**

## What changed

- New module
  [src/lib/solutions/ims-managed-services-pack.ts](../../../src/lib/solutions/ims-managed-services-pack.ts):
  - Public types: `IMSContractTier`, `IMSSLATier`, `IMSPatternSeverity`,
    `IMSSLADefinition`, `IMSCriterion`, `IMSFailureMode`, `IMSSourcingPattern`.
  - Standard SLA structure: `IMS_STANDARD_SLA` — P1 (4h resolution, 10% credit),
    P2 (8h BH resolution, 5%), P3 (3BD resolution, 2%), P4 (CSAT only).
  - One pattern entry: `ims-vendor-selection-criteria` — 5 criteria (scope
    definition, tooling/automation, staffing model, security/compliance, cloud
    cost optimisation), 3 failure modes (scope boundary disputes, key person
    dependency, monitoring coverage gaps), 5 BAFO readiness signals.
  - Public accessors: `getIMSPattern()`, `getIMSStandardSLA()`,
    `getIMSBafoChecklist()`, `IMS_PATTERN_SLUGS`.
  - `createdFrom: 'pat2_ims_managed_services'` discriminator on every record.

## Validation

- `npx tsc --noEmit --pretty false` — pass
- `npx jest src/__tests__/integration/solutions/pattern-library-packs.test.ts` — 91 passed
- `npm run build` — pass
