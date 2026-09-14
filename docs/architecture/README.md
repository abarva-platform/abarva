# Enterprise Data Architecture

Status: official architecture baseline.

Read these documents as the product contract for how tenant evidence becomes facts, relationships, insights, module actions, and measured value. Runtime code may still contain historical names while compatibility adapters are phased in, but new architecture language, onboarding contracts, reports, and module API contracts must use the enterprise names here.

## Reading Order

1. `ENTERPRISE_INFORMATION_ARCHITECTURE.md` - the constitution for the four layers.
2. `integrated-data-engineering-design.md` - the detailed medallion, operational, and aVa/RAG data engineering design. Review HTML: `integrated-data-engineering-design.html`.
3. `enterprise-data-layer.md` - the architecture spine and target layers.
4. `module-data-layer-serving-map.md` - current vs target data source by module.
5. `module-context-serving-contract.md` - generic read-only context packet contract.
6. `naming-conventions.md` - approved language and legacy-name boundaries.
7. `tenant-packet-contract.md` - the new-client input contract.
8. `canonical-ingestion-contract.md` - source/data-layer decoupling contract.
9. `source-adapter-framework.md` - parser/adapter responsibilities.
10. `mapping-registry.md` - source-to-canonical mapping governance.
11. `schema-contract-registry.md` - version compatibility rules.
12. `target-data-layer-writer.md` - persistence responsibilities.
13. `module-context-apis.md` - module read/write contracts.
14. `module-memory.md` and `outcome-ledger.md` - write-back and value proof.
15. `proof-harness.md` - how a load becomes proven, not merely present.

## Enforcement

Run:

```bash
npm run audit:enterprise-naming
```

Legacy version labels are allowed only as migration, compatibility, appendix, or evidence-path identifiers.
