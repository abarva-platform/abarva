# first-capital-financial Local Data-Plane Reconciliation

Status: PASS

This reconciles generated local candidate artifacts before any Azure/Postgres write. It does not prove persisted database rows or page/API consumption from the data plane.

- source template file count: pass (19 observed, 19 expected)
- source row threshold: pass (4840 observed, >=4000 expected)
- canonical records manifest match: pass (4840 observed, 4840 expected)
- canonical facts manifest match: pass (9680 observed, 9680 expected)
- facts have evidence ids: pass (0 observed, 0 expected)
- no orphan canonical facts: pass (0 observed, 0 expected)
- evidence registry count: pass (140 observed, 140 expected)
- graph node threshold: pass (1600 observed, >=1500 expected)
- graph edge threshold: pass (2600 observed, >=2500 expected)
- no orphan graph edges: pass (0 observed, 0 expected)
- gap threshold: pass (2100 observed, >=2000 expected)
- retrieval chunk threshold: pass (4600 observed, >=4000 expected)
- retrieval chunks candidate-preview only: pass (0 observed, 0 expected)
- Home dimensions: pass (19 observed, 19 expected)
- Tower approved programs: pass (12 observed, 12 expected)
- Tower candidate AI opportunities: pass (12 observed, 12 expected)
- Moves candidate opportunities: pass (12 observed, 12 expected)
- Source vendor contexts: pass (12 observed, 12 expected)
- no Azure/Postgres mutation: pass (false observed, false expected)
- no active pointer update: pass (false observed, false expected)
