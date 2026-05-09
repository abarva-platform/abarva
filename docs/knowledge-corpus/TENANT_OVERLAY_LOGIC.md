# Tenant Overlay Logic

**Purpose:** Same canonical corpus, different views per tenant. Filtering and scoring happens at retrieval time based on tenant profile. The corpus stays canonical; the surface adapts.

---

## Why tenant overlay

The corpus carries industry knowledge — what's true across all healthcare systems, all retailers, all financial services firms. But each tenant has a profile that makes some corpus entries highly relevant and others irrelevant.

Without overlay: Castillo at Meridian sees all 23 healthcare use cases ranked alphabetically. Cognitive load high. The 3 use cases that actually matter for Meridian get lost.

With overlay: Castillo sees the same 23 use cases, but ranked by relevance to Meridian's specific situation (size, segment, current portfolio, regulatory exposure). Top 3-5 surface as "for your context"; the rest are browseable but de-emphasized.

The corpus doesn't change per tenant. The *view* of the corpus does.

---

## Tenant profile · what feeds overlay

Each tenant has a profile in the AI Initiatives Registry substrate:

```yaml
tenant_id: meridian-health
display_name: "Meridian Health"

industry: healthcare
sub_segment: integrated_health_system  # IDN | community_hospital | academic | for_profit | etc.

size:
  bucket: mid  # small | mid | large | very_large
  metrics:
    facilities: 8 hospitals + 142 clinics
    annual_revenue: $4.2B
    annual_it_budget: ~$120M
    workforce: ~25,000

current_portfolio:
  initiative_count: 7
  initiatives_by_use_case:
    - use_case_id: UC-HC-FRONT-001  # Ambient AI Clinical Documentation (MH-01)
    - use_case_id: UC-HC-MIDDLE-001  # Epic AI Revenue Cycle (MH-04)
    - use_case_id: UC-HC-BACK-001  # SAP Joule for Finance (MH-06)
    # ...
  business_goals: 4

regulatory_exposure:
  - REG-US-005  # HIPAA
  - REG-US-008  # CMS quality reporting
  - REG-US-012  # Medicare ACO regulations
  # No EU exposure (US-only operations)

strategic_context:
  - "Post-COVID margin pressure"
  - "Workforce shortage in clinical roles"
  - "Active value-based care contracts"
  - "Recent CFO turnover"

stakeholders:
  - role: CIO
    name: P. Iyer
  - role: CFO
    name: M. Castillo
  - role: CMO
    name: ...
```

This profile feeds overlay scoring. It lives in tenant substrate (already specified in AI Initiatives Substrate Package), not in the corpus.

---

## Overlay scoring algorithm

For each corpus entity (use case, pattern, vendor, SI, regulatory), score relevance to the tenant on multiple dimensions:

```typescript
function scoreUseCaseForTenant(useCase: UseCase, tenant: Tenant): RelevanceScore {
  let score = 0;
  const factors: ScoreFactor[] = [];

  // Industry match (binary; if mismatch, score = 0 immediately)
  if (useCase.industry !== tenant.industry) {
    return { score: 0, factors: [{ factor: 'industry_mismatch', impact: -100 }] };
  }
  factors.push({ factor: 'industry_match', impact: +20 });
  score += 20;

  // Sub-segment match
  if (useCase.applicable_sub_segments?.includes(tenant.sub_segment)) {
    score += 10;
    factors.push({ factor: 'sub_segment_match', impact: +10 });
  }

  // Size band match (use case has size-specific business value ranges)
  const sizeRange = useCase.business_value_ranges.per_company_size[tenant.size.bucket];
  if (sizeRange) {
    score += 10;
    factors.push({ factor: 'size_band_match', impact: +10, value: sizeRange });
  }

  // Current portfolio relevance
  // If tenant already has this use case in flight, lower priority for "new bets"
  // but higher priority for "improve what's running"
  if (tenant.current_portfolio.initiatives_by_use_case.some(i => i.use_case_id === useCase.id)) {
    score += 5; // exists; can be enhanced
    factors.push({ factor: 'already_in_portfolio', impact: +5 });
  } else {
    score += 15; // candidate new bet
    factors.push({ factor: 'candidate_new_bet', impact: +15 });
  }

  // Regulatory exposure match
  const useCaseRegs = useCase.regulatory_context.applicable;
  const tenantRegs = tenant.regulatory_exposure;
  const overlap = useCaseRegs.filter(r => tenantRegs.includes(r));
  if (overlap.length > 0) {
    score += 5 * overlap.length;
    factors.push({ factor: 'regulatory_alignment', impact: +5 * overlap.length });
  }

  // Strategic context match (heuristic; matches use case art_of_possible_framing
  // against tenant strategic_context themes)
  const contextMatch = matchStrategicContext(useCase, tenant.strategic_context);
  score += contextMatch.score;
  factors.push(...contextMatch.factors);

  // Recency boost — if use case was recently updated with significant changes
  if (daysSince(useCase.last_refreshed) < 90) {
    score += 5;
    factors.push({ factor: 'recently_updated', impact: +5 });
  }

  return { score, factors, max_possible: 100 };
}
```

Returns score 0-100 plus `factors` array showing which signals contributed. CIO can click "why this score?" and see the factors.

---

## Filtering vs scoring

Two separate operations:

**Filter** — binary include/exclude based on hard criteria:
- Industry mismatch → exclude
- No size-band data → exclude
- Tenant doesn't have applicable regulatory exposure → exclude (sometimes)

**Score** — relative ranking among included entities:
- Higher score = more relevant for this tenant
- Score factors visible to CIO for trust ("this is high because: size band match, regulatory alignment, candidate new bet")

Default Intelligence view shows top 5-7 entities by score, with "see all (N)" affordance for exploratory mode.

---

## Per-entity overlay rules

### Use Cases

**Filter:** Industry must match.
**Score:** Combine industry (binary), sub-segment, size, regulatory, current portfolio status, strategic context.

### Patterns

**Filter:** Industry match (cross-industry patterns always included).
**Score:** Patterns scored by which use cases they apply to (transitively use case relevance).

### Vendors

**Filter:** Industry match (cross-industry vendors like Microsoft always included).
**Score:** Score by use cases served (relevant to tenant's portfolio + candidate bets) + alliance signals if SI relationships matter to tenant.

### SIs

**Filter:** Industry practice exists.
**Score:** Score by use case coverage relevance + alliance with vendors tenant uses + size match (Big 4 SI for large tenant; mid-tier SI for mid tenant).

### Regulatory

**Filter:** Jurisdiction match (US-only tenant doesn't see EU regs).
**Score:** Score by applicable use cases that match tenant portfolio + recent change recency.

---

## Example · what Castillo sees on Intelligence

**Without overlay** (corpus default):
> Healthcare use cases (23 total, alphabetical):
> - Ambient AI Clinical Documentation
> - Care Coordination AI
> - Care Management AI
> - Clinical Risk Stratification
> - Clinical Trial Patient Matching
> ... [17 more]

Cognitive load high. Hard to find the bets that matter for Meridian.

**With overlay** (Castillo's view):
> **Top candidate bets for Meridian Health:**
> 1. **Ambient AI Clinical Documentation (UC-HC-FRONT-001)** — score 87 · already in portfolio (MH-01); Move to scale or refine
> 2. **Population Health AI for ACOs (UC-HC-MIDDLE-007)** — score 82 · candidate new bet · matches your value-based-care contracts and CMS regulatory exposure
> 3. **Care Management AI for high-risk panels (UC-HC-MIDDLE-009)** — score 78 · candidate · matches workforce shortage strategic context
> 4. **Epic AI Revenue Cycle expansion (UC-HC-MIDDLE-001)** — score 75 · already in portfolio (MH-04); refine value capture
> 5. **Sepsis early warning (UC-HC-MIDDLE-003)** — score 72 · candidate · margin pressure context
>
> [See all 23 healthcare use cases →]

Top 5 surface; the rest browseable. Each shows score and factor rationale on hover.

---

## Implementation notes

**Where overlay logic lives:**

In retrieval middleware between agents and corpus. Agents call `scoreUseCasesForTenant(tenantId)` and the middleware:

1. Loads tenant profile from substrate
2. Loads all use cases from corpus
3. Filters per industry / regulatory / etc.
4. Scores each remaining use case
5. Returns sorted list

The corpus itself is untouched. Overlay is a query-time transformation.

**Caching:**

Tenant profiles change infrequently (monthly minimum). Corpus changes quarterly. Cache scored results per tenant for ~24 hours. Invalidate on tenant profile update or corpus update.

**Score visibility:**

Default UI shows score (0-100) and top 3 contributing factors. "Why this score?" affordance shows full factor breakdown. CIOs trust scoring when they can see what drove it.

---

## Doctrine constraint

Overlay does NOT change the corpus. Different tenants see different rankings of the same canonical knowledge. We do not maintain per-tenant corpus copies, per-tenant pattern variations, or per-tenant vendor opinions. The corpus is the platform's industry knowledge; overlay is the platform's personalization layer.

If a tenant has unique knowledge that isn't in the corpus (e.g., "we have a private contract term with Vendor X that affects renewal"), that's tenant substrate (AI Initiatives Registry · stakeholder notes · decision history), not corpus content.

This separation keeps the corpus credible across tenants and the overlay credible per tenant. Mixing them creates a corpus that drifts toward the loudest tenant's biases.

---

## What overlay does NOT do

- Does not hide entities from tenants based on subscription tier (entitlement is separate)
- Does not personalize beyond profile-based scoring (no learning from CIO behavior in v1)
- Does not run real-time relevance recalculation per page view (cached, rebuilt periodically)
- Does not handle multi-tenant comparisons (CIO at tenant A asking "how does my portfolio compare to peers?" is a v2 capability)
- Does not adjust corpus content based on tenant feedback (that's customer-contributed signal, separate v2 layer that updates the corpus, not overlays it)
