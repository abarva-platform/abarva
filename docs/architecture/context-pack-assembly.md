# Context Pack Assembly

Status: design baseline.

Context Pack Assembly is the shared supplier process for Home, Intelligence,
Moves, Source, and Tower. Modules ask for context; the assembler returns a
governed packet. Modules should not read CSVs, canonical tables, or Home objects
directly once this path is implemented.

## Assembly Flow

```text
ModuleContextRequest
-> resolve active or explicit candidate mode
-> collect relevant entity profiles
-> attach canonical facts
-> attach relationship edges or candidates
-> attach evidence references
-> attach gaps and caveats
-> compute confidence summary
-> exclude candidate-only context when active mode is requested
-> create ContextAssemblyTrace
-> return ModuleContextResponse
```

## Request Inputs

`ModuleContextRequest` declares:

- tenant key,
- module key,
- purpose,
- active/candidate/synthetic mode,
- requested domains,
- module scope,
- evidence policy,
- relationship policy,
- optional active or candidate version ids.

## Pack Sections

Each `ContextPack` contains:

- tenant identity,
- module key,
- purpose,
- mode,
- executive summary,
- relevant entity profiles,
- facts,
- validated relationships,
- relationship candidates,
- metrics,
- risks,
- evidence,
- gaps,
- confidence summary,
- caveats,
- excluded candidate-only context,
- unsupported claims,
- recommended next evidence,
- assembly trace,
- truth boundary,
- Claude-ready context payload.

## Truth Boundary

Every pack carries a `CandidateTruthBoundary`:

```text
activeTenantContextDefault: true
candidatePreviewExplicitlyRequested: boolean
candidateContextIncluded: boolean
sourceAdapterRowsActive: false
activeTenantAccessUpdated: false
productionTenantDataWritten: false
candidatePromoted: false
moduleRuntimeBehaviorChanged: false
```

These fields are intentionally explicit so proof artifacts cannot accidentally
sound like active tenant truth.

## Claude-Ready Context Payload

The Claude-ready context payload is the governed, model-visible subset of the
`ContextPack`. It is a design artifact only in this PR. It must not call Claude
or change runtime behavior.

The payload must preserve these instructions:

- answer only from the context pack,
- cite evidence refs,
- mark inference,
- do not convert candidate or synthetic context into active tenant truth,
- do not make unsupported value or capability claims.

The payload must exclude:

- audit-only diagnostics,
- inactive candidate context unless explicitly requested,
- unsupported claims as facts,
- source-adapter-only facts unless explicitly requested.
