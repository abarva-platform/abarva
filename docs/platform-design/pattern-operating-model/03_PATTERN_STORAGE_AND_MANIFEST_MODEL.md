# Pattern Storage and Manifest Model

## Purpose

Define how AbarVa stores patterns in human-readable and machine-usable forms.

## Storage Layers

### 1. Authored Markdown Source

Human-readable source of truth where expert thought leadership lives.

Example paths:

- `docs/patterns/source/ams-managed-services-pattern.md`
- `docs/patterns/source/data-modernization-pattern.md`
- `docs/patterns/source/ims-pattern.md`

Markdown should remain reviewable by humans and should preserve narrative depth.

### 2. Machine-Readable Manifest

Registry that makes patterns discoverable by id, domain, type, stage, archetype, tags, version, and owner.

Potential future locations:

- `src/lib/intelligence/generated/pattern-manifest.json`
- `src/lib/source/pattern-packs.ts`

This slice does not create generated JSON or code.

### 3. Structured Pattern Sections

Patterns should be split into sections agents can retrieve:

- `applicability`
- `signals`
- `antiSignals`
- `diagnosticQuestions`
- `requiredInputs`
- `guidanceRules`
- `artifactTemplates`
- `scorecardDefaults`
- `pricingLevers`
- `negotiationLevers`
- `risks`
- `validationRules`
- `evidenceBase`

### 4. Runtime Pattern Context

The selected pattern sections that are loaded into a Context Bundle for an event, program, artifact, or agent turn.

### 5. Future Vector / Graph Retrieval

Vector and graph retrieval can support semantic discovery and relationship traversal, but they do not replace the manifest or structured sections.

### 6. Citations / Evidence Linkage

Pattern usage should cite pattern id, section id, version, and evidence where relevant.

## Layer Responsibilities

| Layer | Responsibility |
| --- | --- |
| Markdown | Human source of truth and expert depth. |
| Manifest | Discoverability and metadata. |
| Sections | Retrievable and composable knowledge units. |
| Runtime context | Agent-usable pattern payload. |
| Retrieval | Find relevant patterns and sections. |
| Citations | Make usage auditable and explainable. |

## Enforcement

Markdown alone is not enough for agent-grade behavior. Patterns become operational when manifest, sections, runtime context, and validation rules are defined.

