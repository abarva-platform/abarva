# Enterprise Data Architecture

Status: official architecture baseline.

Read these documents as the product contract for how tenant evidence becomes facts, relationships, insights, module actions, and measured value. Runtime code may still contain historical names while compatibility adapters are phased in, but new architecture language, onboarding contracts, reports, and module API contracts must use the enterprise names here.

## Reading Order

1. `enterprise-data-layer.md` - the architecture spine and target layers.
2. `module-data-layer-serving-map.md` - current vs target data source by module.
3. `naming-conventions.md` - approved language and legacy-name boundaries.
4. `tenant-packet-contract.md` - the new-client input contract.
5. `canonical-ingestion-contract.md` - source/data-layer decoupling contract.
6. `source-adapter-framework.md` - parser/adapter responsibilities.
7. `mapping-registry.md` - source-to-canonical mapping governance.
8. `schema-contract-registry.md` - version compatibility rules.
9. `target-data-layer-writer.md` - persistence responsibilities.
10. `module-context-apis.md` - module read/write contracts.
11. `module-memory.md` and `outcome-ledger.md` - write-back and value proof.
12. `proof-harness.md` - how a load becomes proven, not merely present.

## Enforcement

Run:

```bash
npm run audit:enterprise-naming
```

Legacy version labels are allowed only as migration, compatibility, appendix, or evidence-path identifiers.
