# Knowledge Module Preview

## Purpose

Knowledge Module Preview is a default-off supplier preview that lets downstream
module teams inspect enterprise knowledge cache packets before runtime
integration. It currently supports Moves and Intelligence only.

The preview is not a production module feature. It does not change the default
Moves workflow, the Intelligence chat path, Home, Source, or Tower.

## Feature Flags

| Module | Flag | Default |
| --- | --- | --- |
| Moves | `ENABLE_KNOWLEDGE_LAYER_MOVES_PREVIEW` | `false` |
| Intelligence | `ENABLE_KNOWLEDGE_LAYER_INTELLIGENCE_PREVIEW` | `false` |

The preview helper returns `disabled` unless the relevant flag is explicitly
set to the string `true`. Enabling the Moves flag does not enable Intelligence,
and enabling the Intelligence flag does not enable Moves.

## Preview Output

When enabled, the preview builds a cache-backed packet from the enterprise
knowledge cache foundation:

```text
ModuleContextRequest
  -> Enterprise knowledge cache builder
  -> entity profile cache
  -> relationship slice cache
  -> fast context pack cache
  -> deep context pack cache
  -> preview packet
```

The preview packet exposes:

- fast context pack cache id,
- deep context pack cache id,
- entity profile cache row count,
- relationship candidate count,
- evidence reference count,
- confidence posture,
- Claude-ready payload prepared but not sent.

## Guardrails

Every preview result carries these guardrails:

- preview requires explicit flag,
- module runtime behavior changed: false,
- Claude called: false,
- tenant data written: false,
- Active Tenant Access updated: false,
- candidate promoted: false,
- default module reads candidate data: false.

The preview path may prepare a Claude-ready payload as a governed artifact. It
must not call Claude in this PR.

## Proof Command

Run:

```bash
npm run audit:knowledge-module-preview
```

The command writes:

- `reports/enterprise-knowledge-layer/module-preview-proof/summary.md`
- `reports/enterprise-knowledge-layer/module-preview-proof/summary.json`
- `reports/enterprise-knowledge-layer/module-preview-proof/moves-preview-disabled-default.json`
- `reports/enterprise-knowledge-layer/module-preview-proof/intelligence-preview-disabled-default.json`
- `reports/enterprise-knowledge-layer/module-preview-proof/moves-preview-enabled.json`
- `reports/enterprise-knowledge-layer/module-preview-proof/intelligence-preview-enabled.json`
- `reports/enterprise-knowledge-layer/module-preview-proof/flag-isolation.json`
- `reports/enterprise-knowledge-layer/module-preview-proof/knowledge-module-preview-proof.html`

## Follow-On Work

Future module teams can use this preview to design UI or runtime integration,
but those PRs must remain explicitly scoped. Preview proof is not active runtime
adoption.
