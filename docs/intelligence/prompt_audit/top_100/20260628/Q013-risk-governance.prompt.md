# Q013 · risk-governance

Question: Which AI initiatives create the greatest governance or operational risk before scale? Frame it for a CIO and CFO joint decision.

## Model Visible Packet

```json
{
  "tenantFacts": [
    {
      "id": "fact-1",
      "statement": "SkyHarbor's AI portfolio has named value pools: IROPS recovery decisioning at $270M, customer AI/Digital Concierge at $180M, data estate rationalization at $122M, MRO predictive maintenance at $96M, and flight planning and dispatch optimization at $74M. IROPS recovery is blocked by a real-time operations data readines…",
      "sourceRefIds": [
        "source-1"
      ],
      "confidence": "high"
    },
    {
      "id": "fact-2",
      "statement": "IROPS recovery decisioning depends on IBM Z / mainframe operational feeds, Slot-Sabre-Service availability, Weight-SAP-Hub data freshness, crew legality signals, aircraft routing state, and passenger reaccommodation workflow controls. The graph shows no single accountable owner for the cross-domain readiness gate.",
      "sourceRefIds": [
        "source-2"
      ],
      "confidence": "high"
    },
    {
      "id": "fact-3",
      "statement": "AI maturity is early-stage for IROPS agentic recovery because operational-data certification, owner accountability, and benefit measurement are incomplete. AI maturity is emerging for revenue management and pricing because bounded decision loops and revenue controls are clearer. The evidence does not show an approved…",
      "sourceRefIds": [
        "source-3"
      ],
      "confidence": "high"
    },
    {
      "id": "fact-4",
      "statement": "The SkyHarbor Intelligence surface is in airline portfolio-decision context and expects CXO-readable prioritization, evidence boundaries, chart/table-ready comparisons, and decision caveats rather than raw evidence labels.",
      "sourceRefIds": [
        "source-4"
      ],
      "confidence": "high"
    }
  ],
  "entities": [
    {
      "id": "entity-2afa353f96",
      "name": "SkyHarbor",
      "kind": "other",
      "sourceRefIds": [
        "source-1"
      ]
    },
    {
      "id": "entity-8693d26d77",
      "name": "IROPS",
      "kind": "capability",
      "sourceRefIds": [
        "source-2"
      ]
    },
    {
      "id": "entity-09194d107e",
      "name": "AI/Digital Concierge",
      "kind": "initiative",
      "sourceRefIds": [
        "source-3"
      ]
    },
    {
      "id": "entity-8c15c8d310",
      "name": "MRO",
      "kind": "capability",
      "sourceRefIds": [
        "source-4"
      ]
    },
    {
      "id": "entity-9832daf27e",
      "name": "IBM Z",
      "kind": "vendor",
      "sourceRefIds": [
        "source-1"
      ]
    },
    {
      "id": "entity-d50ca78816",
      "name": "Slot-Sabre-Service",
      "kind": "vendor",
      "sourceRefIds": [
        "source-2"
      ]
    },
    {
      "id": "entity-2e65f25e4f",
      "name": "Weight-SAP-Hub",
      "kind": "vendor",
      "sourceRefIds": [
        "source-3"
      ]
    },
    {
      "id": "entity-2ca623f182",
      "name": "SkyHarbor AI",
      "kind": "initiative",
      "sourceRefIds": [
        "source-4"
      ]
    },
    {
      "id": "entity-f615a3a72a",
      "name": "SkyHarbor Intelligence",
      "kind": "other",
      "sourceRefIds": [
        "source-1"
      ]
    },
    {
      "id": "entity-d9e41c3db3",
      "name": "IROPS recovery decisioning",
      "kind": "capability",
      "sourceRefIds": [
        "source-2"
      ]
    },
    {
      "id": "entity-682d14215f",
      "name": "MRO predictive maintenance",
      "kind": "capability",
      "sourceRefIds": [
        "source-3"
      ]
    },
    {
      "id": "entity-183b7cab6a",
      "name": "Flight planning and dispatch",
      "kind": "capability",
      "sourceRefIds": [
        "source-4"
      ]
    },
    {
      "id": "entity-5aa6364c44",
      "name": "real-time operations data",
      "kind": "data-product",
      "sourceRefIds": [
        "source-1"
      ]
    },
    {
      "id": "entity-1b754a7e5b",
      "name": "IBM Z / mainframe operational feeds",
      "kind": "vendor",
      "sourceRefIds": [
        "source-2"
      ]
    }
  ],
  "relationships": [
    {
      "id": "relationship-1",
      "from": "tenant evidence",
      "relationship": "indicates",
      "to": "SkyHarbor operational dependency graph",
      "implication": "SkyHarbor operational dependency graph",
      "sourceRefIds": [
        "tenant-2"
      ],
      "confidence": "high"
    },
    {
      "id": "relationship-2",
      "from": "tenant evidence",
      "relationship": "indicates",
      "to": "SkyHarbor AI maturity and readiness notes",
      "implication": "SkyHarbor AI maturity and readiness notes",
      "sourceRefIds": [
        "tenant-3"
      ],
      "confidence": "high"
    }
  ],
  "metrics": [
    {
      "id": "metric-1",
      "label": "SkyHarbor AI portfolio decision ledger",
      "value": "SkyHarbor's AI portfolio has named value pools: IROPS recovery decisioning at $270M, customer AI/Digital Concierge at $180M, data estate rationalization at $122M, MRO predictive m…",
      "basis": "retrieved tenant evidence",
      "sourceRefIds": [
        "tenant-1"
      ]
    }
  ],
  "gaps": [
    {
      "id": "inferred-gap-1",
      "statement": "IROPS recovery is blocked by a real-time operations data readiness gap: freshness, lineage, and disruptio…",
      "severity": "high",
      "decisionImplication": "Treat this as a gating caveat before approving scale, funding, or board-level claims.",
      "sourceRefIds": []
    },
    {
      "id": "inferred-gap-2",
      "statement": "IROPS recovery decisioning depends on IBM Z / mainframe operational feeds, Slot-Sabre-Service availability, Weight-SAP-Hub data freshness, crew legality signals, aircraft routing state, and passenger reaccommodation workflow controls.",
      "severity": "medium",
      "decisionImplication": "Treat this as a gating caveat before approving scale, funding, or board-level claims.",
      "sourceRefIds": []
    }
  ],
  "corpusContext": [
    {
      "id": "airline-irops-ai-sequencing-pattern",
      "label": "Airline IROPS AI sequencing pattern",
      "summary": "Airline industry pattern context: disruption recovery AI performs best when carriers first certify operational data freshness, keep dispatcher or operations-control review in the loop, and sequence passenger reaccommodation after crew and aircraft recovery co… This is industry/pattern context, not a tenant fact.",
      "role": "HELPFUL",
      "tenantBoundary": "industry_context_not_tenant_fact",
      "sourceRefIds": [
        "corpus-1"
      ]
    },
    {
      "id": "airline-operational-ai-benchmark-context",
      "label": "Airline operational AI benchmark context",
      "summary": "Benchmark context: airline IROPS automation case studies commonly report value from shorter recovery cycles, lower misconnects, and fewer manual recovery steps, but exact dollar impact depends on tenant disruption baseline, route network, labor rules, and dat… This is industry/pattern context, not a tenant fact.",
      "role": "HELPFUL",
      "tenantBoundary": "industry_context_not_tenant_fact",
      "sourceRefIds": [
        "corpus-2"
      ]
    }
  ],
  "expertLenses": [
    {
      "id": "lens-6dbb9e327a",
      "lens": "CIO",
      "role": "HELPFUL",
      "whySelected": "Pressure-test architecture, system dependencies, integration, and technology feasibility.",
      "pressureTest": "Which systems, integrations, and lifecycle constraints govern feasibility?"
    },
    {
      "id": "lens-aec1e343eb",
      "lens": "CFO",
      "role": "HELPFUL",
      "whySelected": "Pressure-test value, funding source, benefit proof, and unsupported ROI.",
      "pressureTest": "What measured baseline, target, and value-capture method support the recommendation?"
    },
    {
      "id": "lens-b60781da98",
      "lens": "COO",
      "role": "HELPFUL",
      "whySelected": "Pressure-test operating workflow, adoption, service impact, and accountable execution.",
      "pressureTest": "Which operating owner and workflow control must change before scale?"
    },
    {
      "id": "lens-4c35db16e8",
      "lens": "CDAO",
      "role": "HELPFUL",
      "whySelected": "Pressure-test data readiness, lineage, ownership, freshness, and AI substrate gates.",
      "pressureTest": "Which governed data products, freshness SLAs, and lineage controls are proven versus missing?"
    },
    {
      "id": "lens-79d362dcb3",
      "lens": "CISO / risk",
      "role": "REQUIRED",
      "whySelected": "Pressure-test controls, auditability, compliance, and risk caveats.",
      "pressureTest": "What control, audit, compliance, or human-approval gate prevents unsafe automation?"
    }
  ],
  "benchmarkContext": [
    {
      "id": "benchmark-1",
      "claim": "Benchmark context: airline IROPS automation case studies commonly report value from shorter recovery cycles, lower misconnects, and fewer manual recovery steps, but exact dollar impact depends on tenant disruption basel…",
      "basis": "Airline operational AI benchmark context",
      "caveat": "Benchmark applicability depends on tenant maturity and source comparability.",
      "sourceRefIds": [
        "benchmark-1"
      ]
    }
  ],
  "outputInstructions": [
    "Start with the direct executive answer.",
    "Use tenant facts first; distinguish corpus or benchmark context from tenant facts.",
    "Put caveats and missing evidence after the useful answer.",
    "Do not expose raw IDs, storage names, file names, table names, route names, or debug labels.",
    "Do not fabricate ROI, dates, dollars, vendors, owners, or commercial terms."
  ]
}
```
