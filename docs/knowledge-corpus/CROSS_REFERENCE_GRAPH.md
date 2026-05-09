# Cross-Reference Graph

**Purpose:** The relational structure between corpus entities. Use cases link patterns. Patterns link use cases. Vendors link use cases and SIs. SIs link vendors. Regulatory links use cases. The corpus is a graph, not a flat list.

---

## Why a graph

Three agents asking three different questions of the same data need the data interconnected. Without cross-references:

- Sentinel surfaces a use case but can't pull applicable patterns
- Source surfaces a vendor but can't show what use cases they serve
- Nexus invokes a pattern but can't ground it in specific use cases
- A regulatory change can't cascade — corpus doesn't know which use cases are affected

With cross-references: querying any entity pulls its connected entities in one traversal. Sentinel asks for a use case; gets patterns + regulatory + vendor names automatically. Source asks for a vendor; gets use cases served + SI partners + relevant patterns. Nexus invokes a pattern; gets use cases where pattern applies + benchmark metrics from those use cases.

---

## Reference types

Six reference types between entities:

### 1. Use Case → Pattern (success/failure patterns applicable)

```yaml
# In Use Case entity:
success_patterns:
  - pattern_id: P-HC-005
    relevance: HIGH
  - pattern_id: P-HC-007
    relevance: MED
failure_modes:
  # Inline failure modes, but may reference patterns:
  - mode: "Adoption gap"
    related_pattern: P-HC-018
```

**Reverse traversal** (Pattern → Use Cases where observed):

```yaml
# In Pattern entity:
evidence_basis:
  observed_in_use_cases:
    - UC-HC-FRONT-001
    - UC-HC-FRONT-003
```

### 2. Use Case → Vendor (vendors serving this use case)

```yaml
# In Use Case entity:
vendor_landscape:
  incumbent:
    - vendor_id: V-HC-001
  challenger:
    - vendor_id: V-HC-005
  emerging:
    - vendor_id: V-HC-008
```

**Reverse traversal** (Vendor → Use Cases served):

```yaml
# In Vendor entity:
product_lines:
  - product_name: "DAX"
    serves_use_cases:
      - UC-HC-FRONT-001
```

### 3. Use Case → SI (SIs with practice in this use case)

```yaml
# In Use Case entity:
si_landscape:
  credible_practice:
    - si_id: SI-CROSS-001
    - si_id: SI-CROSS-005
  emerging_practice:
    - si_id: SI-HC-007
```

**Reverse traversal** (SI → Use Cases served):

```yaml
# In SI entity:
use_case_coverage:
  serves_use_cases:
    - UC-HC-FRONT-001
    - UC-RTL-MIDDLE-009
```

### 4. Vendor → SI (alliance / partnership relationships)

```yaml
# In Vendor entity:
related_sis:
  - SI-CROSS-001  # Strategic partner
  - SI-CROSS-005

# In SI entity (richer; SI tracks alliance tier):
vendor_alliances:
  - vendor_id: V-CROSS-001
    alliance_tier: "Diamond Alliance Partner"
```

### 5. Use Case → Regulatory (regulations applicable)

```yaml
# In Use Case entity:
regulatory_context:
  applicable:
    - reg_id: REG-US-005

# In Regulatory entity:
applicable_use_cases:
  - UC-HC-FRONT-001
  - UC-HC-MIDDLE-001
  # ... all healthcare use cases that touch PHI
```

### 6. Pattern → Pattern (related patterns)

```yaml
# In Pattern entity:
related_patterns:
  - P-HC-007  # companion pattern
  - P-HC-018  # opposing failure pattern
  - P-CROSS-002  # cross-industry parallel
```

---

## Cross-reference integrity

References must be **bidirectional and consistent**. If Use Case UC-HC-FRONT-001 references Pattern P-HC-005, then Pattern P-HC-005 must list UC-HC-FRONT-001 in its `observed_in_use_cases`.

This is enforced at write time:

```typescript
function validateCrossReferences(entity: Entity, corpus: Corpus): ValidationResult {
  const errors: string[] = [];

  // Forward references exist?
  for (const ref of getOutboundReferences(entity)) {
    if (!corpus.has(ref.targetId)) {
      errors.push(`Entity ${entity.id} references missing entity ${ref.targetId}`);
    }
  }

  // Reverse references consistent?
  for (const ref of getOutboundReferences(entity)) {
    const target = corpus.get(ref.targetId);
    const reverseRefs = getReverseReferences(target);
    if (!reverseRefs.includes(entity.id)) {
      errors.push(`Asymmetric reference: ${entity.id} → ${target.id} but no reverse`);
    }
  }

  return { valid: errors.length === 0, errors };
}
```

If validation fails, entity rejects on commit. Curation must fix references.

---

## Index file

To make graph traversal fast without loading every entity, an index file at `docs/knowledge-corpus/index.json` precomputes:

```json
{
  "version": "2026-05-08",
  "last_built": "2026-05-08T03:00:00Z",
  "entity_count": {
    "use_cases": 45,
    "patterns": 50,
    "vendors": 75,
    "sis": 25,
    "regulatory": 25
  },
  "by_industry": {
    "retail": {
      "use_cases": ["UC-RTL-FRONT-001", ...],
      "patterns": ["P-RTL-001", ...],
      "vendors": ["V-RTL-001", ...],
      "sis": ["SI-RTL-001", ...],
      "regulatory": ["REG-US-001", ...]
    },
    "healthcare": { ... }
  },
  "by_office": {
    "front": ["UC-RTL-FRONT-001", "UC-HC-FRONT-001", ...],
    "middle": [...],
    "back": [...]
  },
  "use_case_links": {
    "UC-HC-FRONT-001": {
      "patterns": ["P-HC-005", "P-HC-007", "P-HC-012"],
      "vendors": {
        "incumbent": ["V-HC-001"],
        "challenger": ["V-HC-005"],
        "emerging": ["V-HC-008"]
      },
      "sis": {
        "credible": ["SI-CROSS-001", "SI-CROSS-005"],
        "emerging": ["SI-HC-007"]
      },
      "regulatory": ["REG-US-005", "REG-US-007"]
    },
    ...
  },
  "vendor_links": {
    "V-CROSS-001": {
      "use_cases": ["UC-RTL-FRONT-001", "UC-HC-FRONT-005", ...],
      "sis": ["SI-CROSS-001", "SI-CROSS-005"]
    },
    ...
  },
  "pattern_links": {
    "P-HC-005": {
      "use_cases": ["UC-HC-FRONT-001", "UC-HC-FRONT-003"],
      "related_patterns": ["P-HC-007", "P-HC-018"]
    },
    ...
  }
}
```

The index is rebuilt on every commit to the corpus (build hook). Agents query the index for fast lookup, then load specific entity JSON for full detail.

---

## Common traversal patterns

**Sentinel: "What candidate Moves should we consider for this tenant?"**
1. Get tenant profile (industry, size, current portfolio)
2. listUseCases({ industry, ... }) → use case IDs
3. For each use case, scoreUseCasesForTenant() → ranked list
4. For top-N use cases, getUseCase() → load detail with linked patterns + regulatory

**Source: "What vendors should we evaluate for this Move?"**
1. findVendorsForUseCase({ useCaseId }) → vendor IDs grouped by tier
2. For each vendor, getVendor() → load detail
3. compareVendors(ids) → side-by-side
4. findSIsForUseCase({ useCaseId, vendorId }) → SIs with joint practice

**Nexus: "What patterns apply to this Move shape?"**
1. findPatternsForMove({ useCaseId, archetype }) → pattern IDs
2. For each pattern, load detail
3. Surface success patterns as guidance, failure patterns as warnings
4. getBenchmarkMetrics({ useCaseId, tenantSize }) → for value hypothesis

---

## Graph evolution rules

**Adding entities:** New entity must reference at least one existing entity (or be cross-industry foundational). Orphan entities reject.

**Removing entities:** Entity can be marked deprecated but not deleted. Outbound references redirected to replacement (if any) or marked dangling. Inbound references reviewed.

**Changing references:** When an entity's references change, both ends update atomically. Single-side updates that break bidirectional consistency reject.

**Cross-industry references:** Patterns and Vendors can be cross-industry (`scope: cross_industry`). Use Cases are industry-bound (a retail use case doesn't directly apply to healthcare even if mechanically similar — the context, vendors, regulatory, patterns differ enough that it's a separate use case).

---

## What this graph does NOT capture

- Temporal relationships (which use case came first, what evolved from what) — out of scope
- Sentiment / quality ratings (vendor "goodness" scores) — too subjective; corpus surfaces signals, not opinions
- Customer-specific overlays — that's tenant overlay logic, separate file
- Transitive closures (precomputed multi-hop paths) — agents do their own traversal; corpus stays small/maintainable

---

## Why this matters for the bet-shaping thesis

When Iyer (Castillo's CIO) opens Intelligence and asks "what bets should I be considering for ambient AI in revenue cycle?", the chain that produces a credible answer is:

1. Sentinel queries use cases → gets UC-HC-MIDDLE-001 (Epic AI Revenue Cycle)
2. Sentinel pulls success patterns → P-HC-014, P-HC-018
3. Sentinel pulls regulatory context → REG-US-005 (HIPAA), REG-US-008 (CMS automation guidance)
4. Sentinel pulls vendor names (light touch) → Epic, Notable, Akasa
5. Sentinel scores the use case for Meridian's profile → "high-leverage given your current Joule investment and revenue cycle baseline"
6. Sentinel hands off to Source for vendor depth ("for vendor evaluation, see Source")

That whole chain runs on cross-reference traversal. Without the graph, each step requires Sentinel to confabulate or hit dead ends. With the graph, Iyer gets a substantive, traceable, multi-source answer in 30 seconds.

That's the bet-shaping thesis materialized.
