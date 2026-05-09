# Curation Pipeline

**Purpose:** How the corpus gets populated and refreshed over time. Three phases of sourcing maturity: v0 hand-curation, v1 AI-augmented research, v2 customer-contributed signal.

---

## v0 · Hand-curation bootstrap

**Status:** Active for the initial corpus population (this package).
**Driver:** AbarVa team + research-augmented agent runs (the executable prompts in this package).
**Output:** Initial 45 use cases + 50 patterns + 75 vendors + 25 SIs + 25 regulatory entries across retail and healthcare.
**Quality bar:** Three Tests gate · all entities provenance-tagged · cross-references validated.
**Calendar:** ~1-2 weeks for full population per industry, parallelizable.

**Process:**

1. Hand the included CURATION_PROMPT_RETAIL.md and CURATION_PROMPT_HEALTHCARE.md to Claude Code (or a research-augmented agent with web access)
2. Agent reads available public sources (analyst reports, vendor disclosures, peer-reviewed studies, public earnings, press releases, regulatory filings)
3. Agent populates entities per the schema, with provenance tags on every claim
4. Agent commits entries to `docs/knowledge-corpus/{use-cases|patterns|vendors|sis|regulatory}/` directories as JSON files
5. Cross-reference validation runs on every commit
6. Build step regenerates `index.json` for fast retrieval
7. Human review pass: AbarVa team reviews curated entries, accepts/rejects/refines

**v0 limitations:**
- Snapshot quality (research access at curation time)
- Reflects available public sources (private analyst data, customer signal, etc. not yet integrated)
- Refresh requires re-running curation prompts on a cadence

---

## v1 · AI-augmented research pipelines

**Status:** Activated after v0 corpus is live and stable.
**Driver:** Specialized research agents continuously monitoring industry sources.
**Output:** Proposed updates to corpus entities (delta vs current state) for human review.
**Quality bar:** Same as v0 + delta detection + change rationale captured.

**Process:**

1. Research agent runs on schedule (daily for vendor health, weekly for use cases, monthly for SIs, quarterly for full corpus)
2. Agent reads new sources since last run:
   - Analyst report releases
   - Vendor earnings (public companies)
   - Vendor press releases
   - Acquisition / M&A news
   - Regulatory rule changes
   - New peer-reviewed studies
   - Conference presentations and announcements
3. Agent identifies entities affected by new sources
4. Agent proposes updates as PRs against the corpus repo:
   - Diff: what changed
   - Rationale: why (which source, what new evidence)
   - Confidence: HIGH / MED / LOW for the proposed change
5. Human reviewer (AbarVa team member) reviews PR:
   - Accepts → merges, version increments
   - Refines → edits and merges
   - Rejects → closes with reason; reviewer's reason becomes training signal for the agent
6. Customer-facing changelog auto-generates from accepted updates

**v1 advantages:**
- Continuous freshness instead of quarterly batch refresh
- Catches market changes within days/weeks
- Human-in-the-loop maintains quality discipline
- Rejection reasons train the agent over time (better proposals)

**v1 limitations:**
- Public source dependency (private analyst data, vendor internal roadmaps not accessible)
- Requires governance on what counts as a credible source
- Cost of agent runs scales with frequency

---

## v2 · Customer-contributed signal

**Status:** Activated after v1 is operating reliably (+6-12 months from v0).
**Driver:** AbarVa customers running the platform contribute anonymized signal that refines the corpus.
**Output:** Customer-grounded patterns and benchmarks.
**Quality bar:** Privacy-preserved, multi-customer triangulated, human-curated.

**Process:**

1. Customers running AbarVa generate signal automatically:
   - Which use cases their initiatives map to
   - What success metrics they measure (anonymized magnitudes)
   - What patterns their teams observe (anonymized observations)
   - Which vendors they use, contract terms (anonymized)
   - Which SIs they engage, what worked, what didn't
2. AbarVa platform aggregates signal:
   - Multi-customer triangulation (need >5 customers for any signal to surface)
   - Statistical patterns (e.g., "in 12 of 18 health systems, ambient AI achieved >60% physician adoption when CMIO sponsored")
   - Outlier detection (catch atypical claims)
3. Aggregated signal becomes input to corpus updates:
   - New patterns surfaced from customer behavior ("customer signal indicates a new pattern: X")
   - Existing pattern strengthening ("CMIO sponsorship pattern now observed in 18 customer instances")
   - Failure modes refined ("adoption-gap pattern now has earlier signal: usage drop in week 2")
4. Customer signal updates flow through v1 PR process:
   - Research agent surfaces signal as proposed corpus update
   - Human reviewer validates
   - Updates merge with provenance tag indicating "customer signal pool [N customers]"

**v2 advantages:**
- Highest-signal source (real customer experience)
- Self-reinforcing (better corpus → better customer outcomes → better signal)
- Differentiates AbarVa from competitors (no one else has this signal pool)

**v2 limitations:**
- Requires customer base of >50 to generate meaningful pattern signal
- Privacy infrastructure must be airtight (anonymization, aggregation, consent)
- Customers must opt in to signal contribution (likely in standard contract; exit available)
- Slow ramp (>12 months from v0 before signal is rich enough)

---

## Refresh cadences per entity type

| Entity type | v0 refresh | v1 refresh (continuous) | v2 refresh (customer signal) |
|---|---|---|---|
| Use Case | Quarterly | Monthly check, update on change | Continuous as customer signal accumulates |
| Pattern | Quarterly | Monthly | Continuous (high-signal source) |
| Vendor (product lines) | Quarterly | Weekly check, monthly update | N/A (canonical product info) |
| Vendor (financial health) | Quarterly | Weekly (each earnings cycle) | Monthly (customer signal on vendor performance) |
| Vendor (customer roster) | Quarterly | Monthly | Continuous (customer self-identifies usage) |
| SI | Semi-annual | Quarterly | Quarterly |
| Regulatory | Quarterly | Continuous (rule change watch) | N/A (regulatory is canonical) |

---

## Curation governance

**Who can propose changes:**
- v0: AbarVa curation team (via prompts)
- v1: Research agents + AbarVa team
- v2: Customer signal pipeline + AbarVa team

**Who can accept changes:**
- All phases: AbarVa-designated reviewer with corpus authority. v1+ requires reviewer for every PR.

**What constitutes acceptance:**
- All Three Tests pass
- Cross-references valid
- No conflicts with existing corpus
- Provenance complete and credible

**Conflict resolution:**
- When sources disagree (vendor says X, analyst says Y, customer signal says Z), curation captures all three with confidence weights
- Agent responses cite the disagreement explicitly
- Don't pick a winner unless one source is clearly higher reliability

**Audit trail:**
- Every change has a version_history entry
- Reviewer name + reason captured
- Sources used captured
- Rejected proposals also logged (for training)

---

## What the curation pipeline does NOT do

- Does not curate competitive intelligence (e.g., "Vendor A is better than Vendor B"). Corpus surfaces signals; opinions belong to the user.
- Does not curate proprietary AbarVa methodology (that's product doctrine, not industry knowledge).
- Does not generate marketing content from the corpus (downstream concern; corpus stays factual).
- Does not handle multilingual curation in v1 (English-only initial corpus; translation layer is v2+ if needed).
- Does not include vendor-paid placements (corpus is unsponsored; if vendor relationships ever monetize, they're separate from canonical corpus).

---

## Why three phases vs all-at-once

We can't do v2 (customer-contributed) without first having v0 (bootstrap). We shouldn't try v1 (AI-augmented continuous) until v0 is stable, because v1 needs a baseline corpus to propose deltas against.

The three phases are sequenced not because they couldn't theoretically run in parallel, but because each phase's discipline depends on the previous phase being solid. v0 establishes the schema-driven, provenance-disciplined foundation. v1 layers continuous freshness on top. v2 layers customer-grounded signal on top of that.

Skipping v0 to go straight to v1 results in a corpus full of unverified continuous updates against no baseline. Skipping to v2 with no v0/v1 results in customer signal floating in the void without industry-canonical reference points.

The phases compound. Don't skip.

---

## Cost model

**v0 cost:** ~1-2 weeks of focused curation per industry (retail + healthcare = ~2-4 weeks total). Mostly research agent runs + human review time.

**v1 cost:** Ongoing — ~$X/month in agent runs + review time. Scales with corpus size and refresh frequency. Mid-five-figures annually for the kind of corpus we're building.

**v2 cost:** Mostly amortized in customer base growth — cost per signal contribution is near-zero once infrastructure exists. Infrastructure cost is one-time (privacy/anonymization layer).

The corpus becomes more valuable AND cheaper to maintain as it matures (v0 → v1 → v2). That's the right cost trajectory for a defensible knowledge asset.
