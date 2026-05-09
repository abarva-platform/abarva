# Provenance and Versioning

**Purpose:** Apply the Three Tests gate discipline to the knowledge corpus. Every claim has a source. Every entry has a refresh cadence. Stale entries get flagged. Agents cite provenance in responses.

---

## Why this matters

The corpus is what makes AbarVa credibly knowledgeable about industry AI. If it's not provenance-disciplined, agents confabulate (or repeat unverified claims), CIOs catch the slip, and the bet-shaping thesis collapses.

The Three Tests gate that applies to tenant metrics applies here too — adapted for industry knowledge:

**Test 1 — Source identifiable.** Every claim traces to a specific source (analyst report, vendor disclosure, peer-reviewed study, public earnings, government data). "Common knowledge" is not a source.

**Test 2 — Currency tracked.** Every entity has a `last_refreshed` date. Claims about volatile data (vendor pricing, vendor health, regulatory) carry their own currency dates separate from the entity's refresh date.

**Test 3 — Reliability rated.** Sources are graded HIGH / MED / LOW reliability. Claims drawn from LOW reliability sources are flagged or omitted. Multiple sources for high-stakes claims preferred.

If an entry can't pass Test 1 (no source), it doesn't enter the corpus. If it fails Test 2 (stale), it gets flagged for refresh. If it fails Test 3 (low reliability), it gets challenged or omitted.

---

## Provenance block · standard shape

Every entity carries a `provenance` block:

```yaml
provenance:
  primary_sources:
    - source: "<canonical source name>"
      currency_date: "YYYY-Qn" or "YYYY-MM-DD"
      reliability: HIGH | MED | LOW
      url: "<if publicly accessible>"
      access_date: YYYY-MM-DD  # when AbarVa pulled it
  supporting_sources:
    # Optional secondary sources for triangulation
    - source: "..."
      currency_date: "..."
      reliability: ...
  curation_pass: "v0-bootstrap-2026-05-08"  # which curation run produced this entry
  reviewer: null  # populated when a human reviews
  reviewed_at: null
  notes: |
    Optional context about provenance decisions made during curation.
```

---

## Reliability rating definitions

**HIGH:**
- Peer-reviewed academic publications
- Public government data or regulatory filings
- Public company financial filings (10-K, 10-Q, earnings transcripts)
- First-party vendor disclosures (with caveats — vendor self-reporting is HIGH for "what they offer," MED for "how well it works")
- Established analyst firms (Gartner, Forrester, KLAS, IDC) for their core competency areas
- Direct customer references with named attribution

**MED:**
- Trade press / industry journalism (TechCrunch, Healthcare IT News, etc.)
- Vendor case studies (vendor-curated; verify against customer-side reports when possible)
- Conference presentations
- LinkedIn posts from named industry figures
- Survey-based research from less-established firms

**LOW:**
- Anonymous forum posts (Reddit, blind, etc.)
- Vendor marketing materials (without supporting data)
- AI-generated summaries of unknown source
- "Things people say at conferences"
- Anything where the source can't be verified

**LOW-reliability claims should not enter the corpus** unless:
- They are clearly framed as anecdotal ("In a Reddit thread, several users reported X — unverified but worth noting")
- They are corroborated by multiple LOW sources, lifting to MED-equivalent
- They serve as a flag for further investigation, not a binding claim

---

## Currency dates per claim type

Different claim types have different volatility. Currency expectations:

**Use case definition:** ~12-24 months before refresh needed
**Use case business value ranges:** ~6-12 months
**Pattern entries:** ~12-24 months (patterns are slow-moving wisdom)
**Vendor product lines:** ~3-6 months (vendors ship features fast)
**Vendor pricing patterns:** ~3-6 months
**Vendor financial health:** Quarterly minimum (each earnings cycle)
**Vendor customer roster:** ~6-12 months
**SI practices:** ~6-12 months
**SI vendor alliances:** ~3-6 months (alliances shift)
**Regulatory entries:** Quarterly minimum; immediate refresh on rule changes

Each entity has both:
- `last_refreshed` (entity-level)
- Per-field currency dates for volatile fields

When agents query, retrieval logic checks staleness:
```typescript
function checkStaleness(entity: Entity, claim: Claim): StalenessFlag {
  const fieldCurrency = claim.currency_date;
  const expectedCadence = getCadenceForClaimType(claim.type);
  if (daysSince(fieldCurrency) > expectedCadence) {
    return { stale: true, claim, expected_cadence_days: expectedCadence };
  }
  return { stale: false };
}
```

Stale claims are flagged in agent responses: "note: vendor financial health data is 4 months old; recent changes may not be reflected."

---

## Version history

Every entity carries a `version_history` array:

```yaml
version_history:
  - version: 1
    changed_at: 2026-05-08
    changed_by: "v0-bootstrap-curation"
    summary: "Initial entry"
    sources_used: ["Gartner MQ 2026", "KLAS Research 2025-Q4"]
  - version: 2
    changed_at: 2026-08-15
    changed_by: "quarterly-refresh-2026-Q3"
    summary: "Updated business value ranges per Q2 2026 customer survey data; added emerging vendor V-HC-014"
    sources_used: ["AbarVa customer signal pool 2026-Q2", "Forrester Wave 2026-Q3"]
    diff_summary: |
      - business_value_ranges.mid: $3M-$8M → $4M-$12M
      - vendor_landscape.emerging: added V-HC-014
      - failure_modes: refined "adoption gap" mode based on customer evidence
```

When an entity is updated, the version increments and the prior version is preserved in history. Agents can be queried for "as of date X" if needed for regulatory or audit purposes.

For repo-committed JSON, version history lives in the file. For DB-backed corpus, version history is a separate table referencing the entity.

---

## Refresh discipline

**Quarterly refresh cycle:**
- Every entity reviewed at least once per quarter
- Volatile fields (vendor health, regulatory) refreshed within their per-field cadence
- Curation run produces a refresh report: what changed, what stayed, what's now stale

**Triggered refresh:**
- Major industry event (vendor acquisition, major regulatory change, major outage) triggers immediate refresh of affected entities
- Customer signal: when AbarVa customers report something contradicting corpus, that's a refresh trigger
- Agent failure: when an agent produces a response based on corpus that turns out to be wrong, the corpus entry gets reviewed

**Refresh authority:**
- v0/v1 (bootstrap): hand-curation by AbarVa team
- v1 (AI-augmented): research-augmented agent proposes refresh, human reviews
- v2 (customer-contributed): customer signal contributes, AbarVa team curates and integrates

---

## Three Tests gate applied to corpus entries

When a new entity is proposed (or a refresh updates an entity), it must pass all three tests:

**Test 1 — Source identifiable**
- Every claim traces to a named source
- Sources are accessible (URL or citation specific enough to retrieve)
- Sources are credible (HIGH or MED reliability per definitions)

If Test 1 fails: entry rejected. Curation must find sources or omit the claim.

**Test 2 — Currency tracked**
- `last_refreshed` populated
- Per-field currency dates on volatile fields
- Refresh cadence specified

If Test 2 fails: entry rejected. Curation must add dates.

**Test 3 — Reliability rated**
- Each source has reliability rating
- Claims based on LOW-reliability sources are challenged
- High-stakes claims (binding success ranges, vendor health verdicts) require multiple HIGH sources

If Test 3 fails: claim either gets multiple sources OR gets demoted to "qualitative observation" (less weighted in agent responses) OR gets removed.

---

## Provenance in agent responses

When agents cite corpus content, they include provenance inline. Standard format:

> "Ambient AI clinical documentation typically delivers 30-50% reduction in physician documentation time **[per KLAS Research 2025-Q4 · HIGH reliability]**. The CMIO sponsorship pattern is the binding success factor **[per JAMIA 2025 published study + KLAS observations]**."

For low-confidence or stale claims:

> "Vendor financial health for Suki: **stable per Q3 2025 funding round disclosure [4 months old; refresh due]**."

CIOs see the provenance. They can click through (where URLs are stored). They can challenge it. The platform's epistemic humility is visible.

---

## What this discipline does NOT do

- Does not guarantee corpus is "right." It guarantees corpus is *traceable* and *current within stated cadence*. Wrong claims with HIGH-reliability sources can still enter the corpus; the discipline catches them faster on refresh.
- Does not replace human review. Provenance discipline + Three Tests gate makes review *faster*, not unnecessary.
- Does not handle conflicting sources automatically. When two HIGH-reliability sources disagree, curation surfaces the disagreement (it doesn't pick one). Agent responses cite both.
- Does not encrypt or restrict the corpus. Agent reads are open in v1; auth comes when corpus has tenant-private content (later).
