# Moves Context Pack Dry-Run

## Purpose

Moves needs a governed way to ask the Enterprise Knowledge Layer what is known, safe, missing, and phase-relevant before any Move evidence is attached or any phase deliverable is generated.

This design adds a non-default dry-run path:

```text
Move question / phase
  -> ModuleContextRequest
  -> Enterprise Knowledge Layer assembler
  -> MovesContextPack
  -> phase-specific sections
  -> Claude-ready context payload
  -> proof artifact
```

## Boundary

This is a supplier-consumer proof, not a runtime Moves feature.

- Default Moves behavior is unchanged.
- Production generation behavior is unchanged.
- Existing Move Context Extract is not replaced.
- Claude is not called.
- Move evidence is not attached.
- Tenant data is not written.
- Candidate data is not promoted.
- Active Tenant Access is not updated.
- Home, Intelligence, Source, and Tower runtime behavior is unchanged.

## Generic Request Shape

Moves uses the shared module context contract:

```ts
getModuleContext({
  tenantKey,
  moduleKey: "moves",
  purpose: "phase_readiness",
  mode,
  requestedDomains,
  scope: {
    moveId,
    phase,
    question,
    useCase,
    requiredEvidenceFamilies
  },
  evidencePolicy: "lineage_required",
  relationshipPolicy: "validated_and_candidate"
})
```

The resolver must remain generic. It may infer archetypes, domains, and entity terms, but it must not branch on exact named use cases such as a specific agent-assist, fraud, finance, or vendor-onboarding fixture.

## Phase Sections

The dry-run proof maps the generic `MovesContextPack` into phase-oriented sections:

- `phasePurpose`
- `impactedFunctions`
- `relevantSystems`
- `dataDomains`
- `ownersAndParticipants`
- `baselineCandidates`
- `risksAndControls`
- `vendorAndSpendContext`
- `evidenceRefs`
- `requiredUploads`
- `safeToUse`
- `notSafeToClaim`
- `nextEvidence`

These sections help Moves determine what should be inspected later. They do not decide what becomes attached evidence.

## Claude-Ready Payload

The dry run emits the governed, model-visible subset as `claudeReadyContextPayload`.

The payload must exclude:

- audit-only diagnostics,
- unsupported claims as facts,
- inactive candidate context unless explicitly requested,
- source-adapter-only facts unless explicitly requested.

The proof validates that unsupported audit claims remain available for governance while not leaking into the Claude-ready payload as supported facts.

## Proof Outputs

The audit command writes:

```text
reports/enterprise-knowledge-layer/moves-pack-proof/
  summary.md
  summary.json
  meridian-agent-assist-p2.json
  meridian-finance-analytics-p1.json
  harbortrust-fraud-copilot-p2.json
  generic-vendor-onboarding-fallback.json
  moves-context-pack-proof.html
```

## Validation Command

```bash
npm run audit:moves-context-pack-dry-run
```

The audit checks:

- four fixture scenarios are generated,
- every pack is `moduleKey=moves`,
- requested phases are preserved,
- profiles, relationships, evidence, gaps, and unsupported claims are present,
- Claude-ready payloads have no unsupported claims,
- the generic fallback scenario uses fallback entity extraction,
- non-destructive truth boundaries remain false for writes, promotion, active updates, and runtime behavior changes,
- no use-case-specific branching is introduced in the source logic.
