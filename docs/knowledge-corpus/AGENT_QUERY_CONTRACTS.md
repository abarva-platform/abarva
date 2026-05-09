# Agent Query Contracts

**Purpose:** Define exactly how Sentinel, Source-agent, and Nexus read the knowledge corpus. Each agent has a different job and asks different questions of the same data.

---

## Why query contracts matter

Three agents share one corpus. Without contracts, each agent retrieves arbitrarily, leading to:
- Inconsistent retrieval (same question gets different results across agents)
- Over-retrieval (agent pulls 100 entries when 5 would do)
- Schema drift (an agent assumes a field exists that doesn't)
- Provenance loss (agent cites a fact without tracing source)

Contracts lock retrieval shape per agent. Predictable, debuggable, evolveable.

---

## Sentinel · Intelligence agent

**Job:** Surface use case landscape, art-of-possible bets, applicable patterns, regulatory headwinds. Help CIO understand "what bets should I be considering?"

**Reads:** Use Case · Pattern · Regulatory entities. Light touch on Vendor (names only, defers to Source for depth).

**Tools exposed:**

```typescript
// Browse the use case landscape
listUseCases({
  industry: 'retail' | 'healthcare',
  office?: 'front' | 'middle' | 'back',
  tenantId?: string  // for tenant overlay scoring
}): UseCaseSummary[]

// Deep on one use case
getUseCase(id: string, tenantId?: string): UseCase

// Find patterns relevant to a use case or industry
findPatterns({
  useCaseId?: string,
  industry?: string,
  patternType?: 'success' | 'failure' | 'mixed'
}): Pattern[]

// Surface regulatory context
findRegulatory({
  industry: string,
  useCaseIds?: string[],
  recencyDays?: number  // for "what's changed recently"
}): Regulatory[]

// Score candidate Moves for a tenant
scoreUseCasesForTenant(tenantId: string): ScoredUseCase[]
// Returns use cases ranked by relevance to tenant profile
// (size, segment, current portfolio, regulatory exposure)
```

**Standard response shape from Sentinel:**

When citing corpus content, Sentinel always includes:
- The entity ID (e.g., "UC-HC-FRONT-001")
- The entity name (e.g., "Ambient AI Clinical Documentation")
- The specific field cited (e.g., "value range for mid-size health system")
- Provenance reference (e.g., "per KLAS Research 2025-Q4")

Example response (verbatim shape):
> "For Meridian's profile, three use cases score highest: **Ambient AI Clinical Documentation (UC-HC-FRONT-001)**, **Epic AI Revenue Cycle (UC-HC-MIDDLE-001)**, and **Population Health AI for ACOs (UC-HC-MIDDLE-007)**. The first is the highest-leverage bet — value range $4-12M annual for an 8-hospital system [per KLAS Research 2025-Q4], with the CMIO sponsorship pattern (P-HC-005) as the binding success requirement."

**What Sentinel does NOT query:**
- Vendor pricing details (defers to Source)
- SI engagement structures (defers to Source)
- Internal tenant substrate (that's the AI Initiatives Registry, separate layer)

---

## Source-agent · Source surface

**Job:** Help CIO pick the right vendor and SI for a Move. Vendor health intelligence, contract patterns, alliance maps, RFI/RFP support, decision-grade vendor scoring.

**Reads:** Vendor · SI entities primarily. Light touch on Use Case (to understand what vendor is being evaluated for) and Pattern (failure-mode patterns for vendor selection).

**Tools exposed:**

```typescript
// Find vendors for a use case
findVendorsForUseCase({
  useCaseId: string,
  vendorTier?: 'incumbent' | 'challenger' | 'emerging'
}): VendorSummary[]

// Deep on one vendor
getVendor(id: string): Vendor

// Find SIs for a use case (or vendor combination)
findSIsForUseCase({
  useCaseId: string,
  vendorId?: string,  // SIs with practice on this vendor specifically
  industryFilter?: string
}): SISummary[]

// Compare vendors head-to-head
compareVendors(ids: string[]): VendorComparison
// Returns side-by-side: products, pricing patterns, customer roster, financial health, failure modes

// Pull vendor health signals
getVendorHealth(id: string): HealthSignal[]
// Recent earnings, customer churn signals, leadership changes, financial stress

// Get applicable failure modes for vendor selection
findVendorSelectionPatterns({
  useCaseId: string
}): Pattern[]
// E.g., "vendor lock-in patterns", "renewal renegotiation patterns"
```

**Standard response shape from Source-agent:**

When citing vendors, includes:
- Vendor entity ID
- Specific product line being referenced
- Vendor tier (incumbent/challenger/emerging) with rationale
- Health signal currency date
- Linked SI options when relevant

Example response shape:
> "For ambient AI clinical documentation, three vendors are credible: **Nuance DAX (V-HC-001)** — Microsoft-owned, deepest market presence, premium pricing [stable financial health per Microsoft Q1 2026 earnings]. **Abridge (V-HC-005)** — challenger with strong physician satisfaction scores [growth-stage; Series D 2025-Q3]. **Suki (V-HC-008)** — emerging, EHR-agnostic [smaller deployments, watch for scale]. SI implementation: **Accenture (SI-CROSS-001)** has the deepest joint practice with Nuance; **Tegria (SI-HC-007)** is health-system-native and works with all three vendors."

**What Source-agent does NOT query:**
- Use case business value (defers to Sentinel)
- Pattern detection at portfolio scale (defers to Sentinel)
- Tenant-specific substrate

---

## Nexus · Strategic Moves originate

**Job:** Help CIO shape a Move properly during P0 Originate and P1 Charter. Reference success patterns. Pull benchmark metrics. Suggest sponsor structure. Avoid known failure modes.

**Reads:** Pattern · Use Case entities primarily. Light touch on Vendor / SI (just enough to know they exist; defers depth to Source-agent).

**Tools exposed:**

```typescript
// Pull patterns relevant to the Move being shaped
findPatternsForMove({
  useCaseId?: string,         // if Move maps to known use case
  archetype?: string,          // operational_optimization | etc.
  industryContext: string,
  pattern_type?: 'success' | 'failure'
}): Pattern[]

// Get benchmark metrics for the Move's value hypothesis
getBenchmarkMetrics(useCaseId: string, tenantSize: 'small' | 'mid' | 'large'): BenchmarkMetric[]

// Suggest sponsor structure
suggestSponsorshipStructure({
  useCaseId: string,
  industryContext: string
}): SponsorshipSuggestion
// Returns named role suggestions per Pattern entries

// Identify likely failure modes for this Move shape
identifyFailureModes({
  useCaseId: string,
  proposedScope: string,
  proposedSponsor: string
}): FailureMode[]
```

**Standard response shape from Nexus:**

When shaping a Move, references corpus with:
- Pattern ID and name when citing wisdom
- Use case ID when grounding in known use case
- Specific failure mode being avoided
- Provenance for any benchmark cited

Example response shape:
> "I'd shape this as a UC-HC-FRONT-001 (Ambient AI Clinical Documentation) Move. Three patterns to honor: **CMIO sponsorship is binding (P-HC-005)** — single-CIO sponsorship pattern fails 70% of the time [per KLAS 2025-Q4]. **Pilot in primary care first (P-HC-007)** — specialty pilots show inflated success metrics. **BAA in place before pilot (P-HC-012)** — HIPAA business associate agreements take 4-6 weeks to negotiate; start now. Value range for an 8-hospital system: $4-12M annual, time-to-value 6-9 months."

**What Nexus does NOT query:**
- Detailed vendor selection (links out to Source-agent)
- Cross-portfolio synthesis (that's not Nexus's job)
- Regulatory deep dive (cites regulatory IDs but doesn't reproduce content)

---

## Shared retrieval discipline

All three agents follow these rules:

**1. Cite by ID always.** Never cite a use case, pattern, or vendor without the entity ID. "Ambient AI" is wrong; "Ambient AI Clinical Documentation (UC-HC-FRONT-001)" is right. IDs make claims traceable.

**2. Provenance survives retrieval.** When pulling a value range or claim from the corpus, the provenance reference comes with. "[per KLAS Research 2025-Q4]" stays attached to the claim through the response.

**3. Tenant overlay applied at retrieval, not inside the corpus.** The corpus is canonical industry knowledge. Tenant scoring (relevance for Meridian's specific profile) happens at retrieval time via `tenantId` parameter. Same corpus, different scored results per tenant.

**4. No fabrication.** If the corpus doesn't have an entry, say so. Don't invent vendor names, value ranges, or patterns. Tier 1 (substrate access) failure better than confabulation.

**5. Stale check.** Each entity has `last_refreshed` and `refresh_cadence`. If an entity is past its cadence, agents flag the staleness in responses ("note: vendor health data last refreshed 90 days ago; recent changes may not be reflected").

**6. Cross-agent handoffs.** When Sentinel is asked about vendor depth, response includes "for vendor evaluation, see Source." When Source is asked about use case business value, response includes "for use case fit, see Intelligence." Agents respect their lanes.

---

## Agent prompts (skeletal)

**Sentinel system prompt addition:**

```
You have access to the knowledge corpus via these tools:
- listUseCases, getUseCase, findPatterns, findRegulatory, scoreUseCasesForTenant

When discussing AI initiatives, candidate Moves, or industry context:
- ALWAYS cite use case IDs when referencing use cases
- ALWAYS cite pattern IDs when invoking patterns
- ALWAYS include provenance references in claims
- Use scoreUseCasesForTenant for relevance scoring against tenant profile
- For vendor depth, defer to Source: "For vendor evaluation, see Source surface"

Never fabricate use cases, patterns, or vendors. If corpus doesn't have it, say so.
```

**Source-agent system prompt addition:**

```
You have access to the knowledge corpus via these tools:
- findVendorsForUseCase, getVendor, findSIsForUseCase, compareVendors, getVendorHealth

When discussing vendors, SIs, or sourcing decisions:
- ALWAYS cite vendor and SI IDs
- Include vendor tier (incumbent/challenger/emerging) with rationale
- Surface health signals with currency dates
- For use case fit, defer to Intelligence: "For use case landscape, see Intelligence surface"

Never fabricate vendors or SIs. If corpus doesn't have it, say so.
```

**Nexus system prompt addition:**

```
You have access to the knowledge corpus via these tools:
- findPatternsForMove, getBenchmarkMetrics, suggestSponsorshipStructure, identifyFailureModes

When shaping a Move during P0 Originate or P1 Charter:
- ALWAYS reference applicable patterns by ID
- Cite benchmark ranges with provenance
- Surface known failure modes proactively
- Suggest sponsorship structure based on patterns
- For vendor selection, defer to Source: "For vendor evaluation, see Source surface"
- For broader use case landscape, defer to Intelligence

Never fabricate patterns or benchmarks. If corpus doesn't have it, say so.
```

---

## How journey kit probes update

Per PROBE_TIER_TAXONOMY in journey kit, corpus integration changes probe expectations:

- **Tier 1 (substrate access)** probes now check that agents query the corpus, not just tenant substrate. Sentinel asked "what bets should we consider?" should pull use cases AND score them against tenant.
- **Tier 2 (substrate instrumentation)** probes verify the corpus is wired (tools exist, entities loaded).
- **Tier 3 (synthesis)** probes verify response shape — citation by ID, provenance attached, lane discipline (Sentinel doesn't go vendor-deep, etc.).

---

## What this contract does NOT do

- Does not specify the LLM model used per agent (model choice is a separate concern)
- Does not specify retrieval algorithm (semantic search vs structured query — implementation decision)
- Does not lock UI rendering of corpus content (that's surface work)
- Does not handle authentication / authorization (corpus is read-only for agents in v1)
