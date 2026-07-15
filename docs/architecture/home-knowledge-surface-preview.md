# Home Knowledge Surface Preview

## Status

`KNOWLEDGE-LAYER-HOME-SURFACE-PR7` adds a feature-flagged proof path for a client-facing Home Knowledge Surface powered by Enterprise Knowledge Layer outputs.

The flag is:

```text
ENABLE_KNOWLEDGE_LAYER_HOME_PREVIEW=false
```

The flag defaults to false. This PR does not change the default Home route, navigation, runtime behavior, tenant data, or module behavior.

## Purpose

Home should not lead as a file/status diagnostic page. The preview proves Home can instead answer:

- What does AbarVa know about this enterprise?
- Why does it matter?
- How does it connect?
- What can be safely answered?
- What evidence supports it?
- What is missing?
- What should be collected next?

## Data Source

The preview consumes the existing Enterprise Knowledge Layer:

```text
ContextSourceCatalog
  -> Home ModuleContextRequest
  -> Enterprise Knowledge cache builder
  -> HomeKnowledgePack
  -> Home Knowledge Surface
```

It does not create a separate Home retrieval path.

## Surface Sections

The preview surface contains:

- Enterprise Brief
- Context Confidence
- What AbarVa Knows
- Key Relationships
- Ready Areas
- Important Gaps
- Evidence Coverage
- Double-Click Profiles
- Recommended Next Evidence

Diagnostics remain secondary under collapsed technical diagnostics in the proof.

## Double-Click Profiles

Profile cards support:

- Enterprise Profile
- Function Profile
- System Profile
- Data Domain Profile
- Infrastructure Profile
- Vendor Profile
- Contract Profile
- Program Profile
- Risk / Control Profile
- Metric / Outcome Profile
- Use Case Profile
- Process Profile

Each profile card carries business meaning, operating summary, target direction, related entities, evidence refs, confidence, known gaps, caveats, active/candidate status, source lineage, as-of date, and module readiness.

## Guardrails

- Feature flag required.
- Default enabled is false.
- Default Home behavior unchanged.
- No route or navigation change in this PR.
- No Claude call.
- No production tenant data write.
- No Active Tenant Access update.
- No candidate promotion.
- No module runtime behavior change.
- No diagnostic-first visible UX.
- No unsupported value or savings claims.

## Proof

Run:

```bash
npm run audit:home-knowledge-preview
```

Proof bundle:

```text
reports/enterprise-knowledge-layer/home-preview-proof/
```

Required files:

- `summary.md`
- `summary.json`
- `meridian-enterprise-overview.json`
- `meridian-finance-profile.json`
- `meridian-agent-assist-profile.json`
- `harbortrust-fraud-profile.json`
- `home-knowledge-surface-proof.html`
