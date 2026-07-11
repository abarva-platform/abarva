# Enterprise Data Architecture

Status: official architecture baseline.

Read these documents as the product contract for how tenant evidence becomes facts, relationships, insights, module actions, and measured value. Runtime code may still contain historical names while compatibility adapters are phased in, but new architecture language, onboarding contracts, reports, and module API contracts must use the enterprise names here.

## Reading Order

1. `enterprise-data-layer.md` - the architecture spine and target layers.
2. `naming-conventions.md` - approved language and legacy-name boundaries.
3. `tenant-packet-contract.md` - the new-client input contract.
4. `canonical-ingestion-contract.md` - source/data-layer decoupling contract.
5. `source-adapter-framework.md` - parser/adapter responsibilities.
6. `mapping-registry.md` - source-to-canonical mapping governance.
7. `schema-contract-registry.md` - version compatibility rules.
8. `target-data-layer-writer.md` - persistence responsibilities.
9. `module-context-apis.md` - module read/write contracts.
10. `module-memory.md` and `outcome-ledger.md` - write-back and value proof.
11. `proof-harness.md` - how a load becomes proven, not merely present.

## Enforcement

Run:

```bash
npm run audit:enterprise-naming
```

Legacy version labels are allowed only as migration, compatibility, appendix, or evidence-path identifiers.
