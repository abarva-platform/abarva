# What's-Changed Briefing Engine · Foundation Specification v1.0

**The architectural specification for AbarVa's What's-Changed Briefing engine — the surface that greets every executive with a 4-minute briefing that reads like it was written by the smartest person in their building who has been paying attention since yesterday. This is the Anticipation vibe made structural.**

Reads alongside:
- `docs/specs/platform/intelligence-layer-north-star-spec.md` — authoritative north star
- `docs/specs/platform/executive-profile-system.md` — executive profile schema
- `docs/specs/_meta/seed-data/[tenant]-intelligence-layer-overlay.md` — per-tenant signal envelope

---

## Part 1 · Strategic Context

### 1.1 · Why this engine exists

Executives operate with scarce attention and abundant information. The scarcest commodity in an executive's day is the first five minutes — the moment when they decide what matters. Consultants capture this window with morning briefings, industry news emails, personalized updates. Most enterprise software squanders it with dashboards, to-do lists, and menus.

**AbarVa's Anticipation vibe claims the platform has been paying attention for the executive while they were away.** Between interactions, signals have been ingested. KPIs have drifted. Patterns have been re-detected. Peer moves have happened. Regulatory changes have landed. The platform organizes all of this into a coherent briefing that puts the executive back up to speed in 4 minutes.

The experience is structural, not performative. A briefing without substance degrades to a newsletter. A briefing with substance is a competitive moat.

### 1.2 · The Prat demo moment

Prat logs into the composite Target tenant for the first time. No dashboard. No menu. Just a greeting: "Good morning, Prat. Here's what I've been tracking since we last talked."

Four sections. Each crisp. Each grounded. Each ending with "here's what I'd recommend next."

At the third item, Prat pauses: "how did you know that?" The answer is that AbarVa ingested his earnings call, detected a commitment, linked it to a tracked initiative, and noticed the initiative slipped against target. That's the Anticipation moment — the platform was paying attention to his world in the background.

### 1.3 · What this engine does

- **Detects change** since last login across six categories (KPI drift, pattern shift, peer move, regulatory change, commitment status, contradiction emergence)
- **Ranks** by what matters for the specific user (role, program, priorities, recent interactions)
- **Composes** a 4-minute briefing with informed-indirection discipline per dual-scope model
- **Personalizes** voice and framing per executive profile
- **Serves** at the login surface as the first-touch experience
- **Adapts** based on user behavior (what they click, what they ignore, what they ask follow-up on)

### 1.4 · What this engine is not

- Not a news aggregator. Curation against the user's specific signal envelope, not generic industry news.
- Not a dashboard. Narrative with drill-through, not tiles with numbers.
- Not a notification system. Proactive context-setting, not event alerts.
- Not a reporting tool. For executives operating, not for status reporting.

---

## Part 2 · The Six Change Categories

Every briefing is composed from six detection categories. Not every briefing includes all six — only those with material change qualify for inclusion.

### 2.1 · Category 1 — KPI Material Drift

Significant movement in KPIs within the user's scope since last briefing.

**Detection logic.**
- Check every KPI in user's scope (program-scoped reasoning access per dual-scope)
- Compare current value to value at last briefing
- Flag when drift exceeds material threshold for that KPI
- Prioritize by strategic priority linkage and stakes

**Material thresholds.**
- Financial KPIs: >50 bps movement or >5% relative
- Clinical/operational: >1 standard deviation of historical variance
- Customer: >3 points on 100-point scale
- Workforce: >2 percentage points

**Example briefing line.** "Your same-day fulfillment % moved from 42% to 46% over the past two weeks — that's acceleration faster than your program plan suggested. Worth understanding whether it's sustainable before committing to the committed endpoint."

### 2.2 · Category 2 — Pattern Shift

New pattern emerged or existing pattern intensified/resolved since last briefing.

**Detection logic.**
- Run pattern library against current tenant state
- Compare to pattern state at last briefing
- Flag: new patterns detected, intensification (more evidence), resolution (pattern evidence fading)

**Example briefing line.** "The Omnichannel Fulfillment Decisioning pattern we flagged three weeks ago has intensified — three additional evidence sources this week, including a CSAT decline in the customer segments most affected. The intervention window is narrowing."

### 2.3 · Category 3 — Peer Move

Material action by a tracked peer competitor since last briefing.

**Detection logic.**
- Monitor external signal ingestion for tracked peers (per tenant external signal envelope)
- Filter for material moves: earnings surprises, strategic announcements, product launches, executive moves, regulatory actions against peers
- Prioritize by direct competitive implication for user's tenant

**Example briefing line.** "Target announced a $2B capital commitment to owned-brand expansion over three years at their investor day yesterday. For context, they're already at 35% owned-brand penetration vs our 24%, and this announcement accelerates the gap. This is the moment to revisit the owned-brand roadmap."

### 2.4 · Category 4 — Regulatory Change

New regulatory action, filing, ruling, or rulemaking affecting user's tenant since last briefing.

**Detection logic.**
- Monitor tracked regulatory bodies (per tenant envelope)
- Filter for material actions: new rulings, enforcement actions, proposed rulemakings with comment periods, guidance updates
- Link to affected KPIs, programs, and risk registry entries

**Example briefing line.** "FERC issued Order 2025-14 yesterday on PJM co-location arrangements. For your data center interconnection strategy, this is meaningful — the order constrains certain co-location structures we were considering in the Queue Management Program. Rachel's team is already reviewing; you'll want a briefing within 48 hours."

### 2.5 · Category 5 — Commitment Status

Change in status of tracked public commitments — progress or slippage against commitment timelines.

**Detection logic.**
- Track commitments registered in the commitment tracker
- Check internal KPI trajectory against commitment endpoint
- Flag: new commitments (extracted from external events), trajectory shift against existing commitments, deadline proximity

**Example briefing line.** "Your CEO's Q2 commitment to 68% VBC revenue by end of FY26 is now 11 months out. Current trajectory gets to 52% by that date — the 16-point gap hasn't moved this quarter. If acceleration is the answer, the window for capital reallocation closes in the next rate case cycle. If reforecasting is the answer, the Q3 earnings call is the right moment."

### 2.6 · Category 6 — Contradiction Emergence

New contradiction detected or existing contradiction changing state since last briefing.

**Detection logic.**
- Query Contradiction Engine for state changes
- Filter for user-scoped contradictions (per dual-scope)
- Prioritize by stakes score

**Example briefing line.** "A new contradiction emerged this week worth discussing: Keystone's public positioning on AI-first grid operations vs. the internal AI governance maturity at Stage 2 with 11 Shadow AI tools outside formal governance. This isn't about fixing something today — it's about getting ahead of the messaging before it becomes a credibility issue."

---

## Part 3 · Schema

### 3.1 · Briefing entity

```
Briefing {
  // Identity
  id: string
  client_id: string
  user_id: string                      // for whom
  
  // Temporal
  generated_at: timestamp
  last_user_touchpoint_at: timestamp   // previous interaction; window of change
  next_scheduled_refresh_at: timestamp
  
  // Composition metadata
  composition_mode: enum               // full_briefing | catch_up | quick_update |
                                       // event_driven
  target_reading_time_seconds: integer // typically 240 (4 minutes)
  estimated_reading_time_seconds: integer
  
  // Sections (can be null if no material change in category)
  section_kpi_drift: BriefingSection
  section_pattern_shift: BriefingSection
  section_peer_move: BriefingSection
  section_regulatory_change: BriefingSection
  section_commitment_status: BriefingSection
  section_contradiction_emergence: BriefingSection
  
  // Personalization
  opening_line: text                   // role-aware, executive-profile-shaped
  closing_recommendation: text         // 1-3 suggested next actions
  voice_profile_applied: string        // which executive profile shaped voice
  
  // User interaction
  user_viewed_at: timestamp
  user_dwell_time_seconds: integer
  user_clicked_sections: array[section_id]
  user_followup_queries: array[query_id]
  user_dismissed_items: array[item_id]
  user_feedback: enum                  // helpful | redundant | incomplete | other
  
  // Composition provenance
  source_entities_considered: number
  source_events_considered: number
  ranking_model_version: string
  personalization_model_version: string
}

BriefingSection {
  category: enum                       // kpi_drift | pattern_shift | peer_move |
                                       // regulatory_change | commitment_status |
                                       // contradiction_emergence
  included: boolean
  item_count: integer
  items: array[BriefingItem]
  section_headline: text               // composed
  section_reading_time_seconds: integer
}

BriefingItem {
  id: string
  category: enum
  headline: text                       // one-liner
  context: text                        // 2-4 sentences of context
  why_it_matters: text                 // specific to user's scope
  recommended_action: text             // what to do next
  
  // Grounding
  primary_source_entity: entity_id
  supporting_evidence: array[evidence_id]
  linked_entities: array[entity_id]    // KPIs, patterns, contradictions, etc.
  
  // Scoring
  priority_score: number               // 0-100
  urgency_score: number                // 0-100
  familiarity_to_user: enum            // known | sensed | new
  
  // Sensitivity and disclosure
  reasoning_scope: AccessScope
  disclosure_scope: AccessScope
  disclosure_mode: enum                // full | informed_indirection | 
                                       // reasoning_only_acknowledge |
                                       // suppressed
  
  // User action
  user_clicked: boolean
  user_dismissed: boolean
  user_asked_followup: boolean
}
```

### 3.2 · Composition pipeline data

```
BriefingComposition {
  briefing_id: string
  composition_steps: array[{
    step_name: string
    step_input: json
    step_output: json
    step_duration_ms: integer
    notes: text
  }]
  total_composition_time_ms: integer
  total_source_entities_scanned: integer
  filtering_applied: array[filter_description]
}
```

### 3.3 · User briefing preference

```
UserBriefingPreference {
  user_id: string
  preferred_length: enum               // brief (2min) | standard (4min) | deep (8min)
  category_weights: {
    kpi_drift: number                  // 0-1
    pattern_shift: number
    peer_move: number
    regulatory_change: number
    commitment_status: number
    contradiction_emergence: number
  }
  always_include_on_change: array[entity_id]  // specific KPIs, initiatives
  never_include: array[entity_id]
  preferred_generation_time: string    // "7am local" etc.
  delivery_channel: enum               // in_app | email | both
}
```

---

## Part 4 · Composition Pipeline

### 4.1 · Seven-step composition

**Step 1 — Scope determination.** Who is this briefing for? What programs, priorities, initiatives are in their scope? What is their role context? When did they last interact?

**Step 2 — Change detection.** Across all six categories, scan for material change since last interaction. Produce candidate item list.

**Step 3 — Scoping filter.** Filter candidate items to user's reasoning scope per dual-scope. Items outside user's scope are dropped entirely.

**Step 4 — Prioritization.** Score candidates on: priority (strategic importance), urgency (time sensitivity), familiarity (known vs new to user), stakes (if contradiction). Pick top items per category with target reading time of 4 minutes.

**Step 5 — Composition.** For each included item: headline, context, why it matters, recommended action. Use executive profile voice shaping. Use informed-indirection where reasoning scope exceeds disclosure scope.

**Step 6 — Assembly.** Order sections by user preference weighting and item urgency. Compose opening line and closing recommendation. Estimate reading time.

**Step 7 — Delivery.** Render at login surface. Schedule followup generation. Log composition metadata for auditing and improvement.

### 4.2 · The "familiarity spread" principle

When the engine has many candidate items, it prefers a spread across familiarity levels:

- At least one "known" item (user already sensed it; confirms their instinct)
- At least one "sensed" item (user had a vague feeling; briefing crystallizes it)
- At least one "new" item (user didn't see it at all; genuine surprise)

The three-layer spread creates the arc: "yes, I knew that" → "huh, I thought so" → "wait, really?"

Without this discipline, briefings either become boring (all "known") or overwhelming (all "new"). The spread makes the briefing feel like intelligent conversation.

### 4.3 · Composition time budget

Target: 4 minutes of reading.
- 30 seconds: opening line and briefing framing
- 45-60 seconds per included category section (typically 3-5 sections included)
- 30 seconds: closing recommendation

Items are sized to read in ~30 seconds each. Sections with more candidate items show top 1-2 and offer a "see all N items in this category" drill-through.

### 4.4 · Voice shaping via executive profile

Per the Executive Profile System (Part 5 of profile spec), the personalization layer applies:

- **Opening greeting.** Uses preferred name. Uses their voice patterns.
- **Framing emphasis.** Leads with their preferred frames.
- **Evidence selection.** Prefers their evidence type preference.
- **Pacing.** Matches their information density preference.
- **Closing recommendation.** Uses their preferred decision-pacing vocabulary.

Example contrast:

*For Prat (compound-value framing, mixed evidence, moderate density, deliberate pacing):*
"Good morning, Prat. Four things worth three minutes of your attention this morning — one of them is genuinely new."

*For Tim Peterson / Jonathan (integration-focused, operator-voice, dense, decisive):*
"Morning, Jonathan. Three items this morning — two operational, one regulatory. The FERC ruling matters most; Rachel has context."

### 4.5 · Dual-scope output filtering

Every briefing item passes through the output filter per north star Part 11:
- If reasoning_scope includes user but disclosure_scope does not: mode becomes `informed_indirection`
- If reasoning_scope does not include user: item suppressed entirely
- If disclosure_scope is broader than user's role but item is relevant: fully disclosed

The filter operates *after* composition, before rendering. The composer produces the full item; the filter trims what can be shown.

---

## Part 5 · Personalization Dynamics

### 5.1 · Adaptation from user behavior

The briefing engine learns per user:

**What they click.** If the user regularly clicks into KPI drift items but skips regulatory change items, category weighting adjusts.

**What they dismiss.** Dismissed items signal misalignment; similar items de-prioritize.

**What they ask follow-up about.** Follow-up queries signal depth of interest; topics driving follow-up get more coverage.

**Reading time.** If user consistently leaves within 90 seconds, briefings shorten. If user regularly drills through all sections, briefings stay longer.

**Time of day.** Generation timing aligns with user's observed login pattern.

### 5.2 · Cross-user learning (anonymized)

Patterns of what resonates across similar executives refine composition:

- If CFOs across tenants consistently prioritize financial KPI items, that pattern informs composition for new CFO users
- If Chief Customer Officers consistently skip cybersecurity items unless severe, baseline weighting adjusts

Aggregate learning respects tenant isolation; no cross-tenant specific data flows.

### 5.3 · The overrides

Users can explicitly configure:
- "Always include" for specific KPIs, initiatives, patterns
- "Never include" for specific topics
- Preferred length
- Preferred delivery time
- Preferred delivery channel

Explicit overrides dominate learned patterns.

---

## Part 6 · Worked Briefing Examples

### 6.1 · Prat at composite Target tenant · Monday morning briefing

**Opening.** "Good morning, Prat. Four things worth about four minutes of your attention this morning — one of them is genuinely new."

**Section 1 · KPI Drift (familiar — "known").**

> **Same-day fulfillment accelerated.** Your same-day fulfillment percentage moved from 42% to 46% in the last two weeks. That's faster than the Digital Commerce Modernization program plan projected. The acceleration is concentrated in drive-up categories — suggests the operational changes made in early April are landing. Worth confirming this is sustainable before you let it set an aggressive new expectation.
> *Recommended: 15 minutes with [CDO] on what drove the acceleration and whether plan targets should move.*

**Section 2 · Pattern Shift (sensed — "I had a feeling").**

> **Omnichannel Fulfillment Decisioning pattern intensified.** Three additional evidence signals this week: CSAT declined 2 points in categories with highest out-of-stock rates, click-and-collect abandonment up 8% at stores with elevated cross-node inventory variance, and a customer-survey callout on 'why are things unavailable when the app says they're here.' The pattern is crossing from emerging to active.
> *Recommended: elevate to decision moment — either accelerate the fulfillment orchestration investment or accept the CSAT trajectory. The window for a ROI-positive intervention is narrowing.*

**Section 3 · Peer Move (new — "wait, really?").**

> **Target announced $2B owned-brand capital commitment.** At yesterday's investor day, Target committed $2B over three years to owned-brand expansion — new product development, sourcing infrastructure, and marketing support. They're already at 35% owned-brand penetration vs your 24%. This announcement accelerates what was already a structural gap. Your Owned Brand Expansion Program will be read by your board against this benchmark within weeks.
> *Recommended: 30-minute session with [CMO] and [CFO] this week on how Apex's program compares in ambition, and whether the response is a reframe or an acceleration.*

**Section 4 · Commitment Status (familiar — "known").**

> **CEO's same-day fulfillment commitment: still on track.** The Q4 2025 earnings call commitment to 68% same-day fulfillment by end of FY26 remains achievable given the current trajectory and the acceleration noted above. Two quarters of continued pace keeps the commitment credible.
> *Recommended: no action this week. Revisit in monthly briefing cycle.*

**Closing.** "Prat, the owned-brand move is the item I'd flag highest this morning. Want me to sketch three possible strategic responses to share with your team before your next leadership alignment?"

### 6.2 · Jonathan Aldridge at Keystone · Post-weekend briefing

**Opening.** "Morning, Jonathan. Three items this morning — two operational, one regulatory. The FERC ruling matters most."

**Section 1 · Regulatory Change (new — "wait, really?").**

> **FERC Order 2025-14 on PJM co-location.** Issued Friday afternoon. The order constrains certain co-location arrangements for large-load customers — specifically the synchronous generation-adjacent structures we'd been considering in the interconnection queue strategy. This doesn't kill the strategy, but it reshapes several of the active customer conversations. Rachel Navarro's team has initial read; full analysis by Wednesday.
> *Recommended: 30 minutes with Rachel and James Oppenheim tomorrow to scope customer-communications implications before the Wednesday deep-brief.*

**Section 2 · Pattern Shift (sensed).**

> **Storm Response Coordination Fragmentation pattern intensified.** Post-event debrief from the Friday storm in the New Jersey service territory surfaced 11 additional coordination failure modes across the subsidiary handoff chain — several of which overlap with the December 2024 ice storm after-action findings. This is the third significant storm since January that reveals the same fragmentation.
> *Recommended: the operating model decision you've been circling needs a phase-gate moment. Proposal — bring a recommendation to the next Executive Committee with three specific options.*

**Section 3 · KPI Drift (known).**

> **Transmission engineering turnover stabilized this month.** Monthly exit rate dropped to 1.8% from the 2.3% running average — not enough data to call it a trend, but the first indicator that may show the Workforce Modernization Initiative's early interventions are landing.
> *Recommended: no action this week. Ask Derek to flag if next month shows continuation.*

**Closing.** "Jonathan, the FERC order deserves your close attention — the downstream implications for the $340M transmission capital allocation are significant."

### 6.3 · Dr. Linda Chen-Winters at Meridian (President Health Plans) · Midweek briefing

**Opening.** "Good morning, Dr. Chen-Winters. Three items to run through — all health-plan-side, all with cross-system implications."

**Section 1 · KPI Drift (sensed).**

> **MLR moved 120 bps this month.** The trailing-three-month Medical Loss Ratio is at 88.4% — up from 87.2%. Primary drivers: seasonal flu-adjacent utilization above forecast, a specific specialty-drug cost increase, and the re-opened case at a high-cost member. None of this is structural, but it's early enough in the quarter that if it persists, the quarterly forecast will need reworking.
> *Recommended: standing briefing with Meridian Health Plans CFO this week to validate the actuarial pattern and determine whether forecast adjustment is warranted.*

**Section 2 · Commitment Status (known).**

> **VBC commitment: trajectory remains 16 points short of CEO's committed endpoint.** No change from last week — the acceleration needed to close the gap has not materialized in program velocity metrics. The next rate-case-cycle decision on capital reallocation is within 60 days; after that, the only path is timeline reforecasting.
> *Recommended: bring a go/no-go recommendation on acceleration-vs-reforecasting to the next VBC Steering Committee.*

**Section 3 · Peer Move (new).**

> **Kaiser Permanente announced Medicare Advantage star-rating recovery plan.** Their plan landed 0.5-star improvement in the 2025 cycle after aggressive quality-metric focus — specifically in HCAHPS-adjacent member-experience measures and medication adherence. Their framework is publicly disclosed in a CMS-filed document. Several of their interventions are applicable to Meridian's star-rating improvement roadmap.
> *Recommended: 20 minutes for Erin's team to assess applicable interventions for your 4.0-to-4.5 star progression plan.*

**Closing.** "Dr. Chen-Winters, the MLR movement is the operational priority — everything else can wait a week."

---

## Part 7 · Delivery Surface

### 7.1 · Login surface integration

When a user logs in:
1. Check if a briefing has been generated since their last interaction
2. If yes: present as the primary surface
3. If no: trigger on-demand generation (target <30 seconds)

The briefing IS the entry experience. Dashboard and menu are secondary.

### 7.2 · Briefing interaction model

- **Read-through.** Scroll through sections. Estimated reading time displayed.
- **Drill-through.** Any item can be expanded to full context.
- **Follow-up query.** "Tell me more about X" or "What should I do about this?"
- **Dismiss.** "Not relevant this time" — signal for adaptation.
- **Save.** Store for later reference.
- **Share.** Forward to team member (subject to dual-scope constraints).

### 7.3 · Second-channel delivery

Options for delivery beyond in-app:

- **Email.** Text rendering with evidence links. Opens in-app when clicked.
- **Slack.** Summary thread with drill-through back to platform.
- **Text message.** Highest-urgency items only; opt-in.

Cross-channel analytics track engagement.

### 7.4 · Briefing cadence

- **Daily default.** Generated fresh every ~8 hours of user absence.
- **Event-driven.** Material events (earnings surprise, regulatory action, critical pattern emergence) trigger immediate update; user notified.
- **Weekly synthesis.** Monday briefings synthesize the weekend plus week-ahead.
- **Pre-meeting.** Before a scheduled high-stakes interaction, pre-meeting briefing specific to the meeting.

---

## Part 8 · Smoke Tests

### Schema tests

1. Generate briefing for Prat at Apex tenant → entity created with 4-section scope
2. Generate briefing for Jonathan at Keystone tenant → distinct sections per category
3. Briefing respects user scope filter → items outside scope excluded

### Composition tests

4. Composition time under 10 seconds for standard briefing
5. Reading time estimate within 20% of actual measured dwell time
6. Familiarity spread discipline: at least one of each known/sensed/new when candidates available

### Personalization tests

7. Prat's opening line differs from Jonathan's opening line (voice shaping)
8. Evidence selection differs per executive profile preference
9. Closing recommendation matches decision-pacing preference

### Dual-scope tests

10. BSA/AML item suppresses for non-BSA/AML user at First Capital
11. MNPI item in informed-indirection mode for non-Finance user
12. Reasoning-only items acknowledged without specifics

### Adaptation tests

13. User who consistently skips regulatory section → category weight adjusts
14. User follow-up query increases topic weight
15. Override configuration respected

---

## Part 9 · Ingestion Notes for Codex

### 9.1 · Net-new infrastructure

Schema migration required. Composition pipeline required. Personalization layer integration (depends on Executive Profile System). Delivery surface scaffolding.

### 9.2 · Ordering

1. Schema migration (briefing, briefing_section, briefing_item, user_briefing_preference, briefing_composition)
2. Detection pipeline for six change categories (reuses infrastructure from Contradiction Engine, external signal pipeline)
3. Scoping filter integration with dual-scope model
4. Prioritization engine (scoring model)
5. Composition pipeline (7-step)
6. Voice shaping integration with Executive Profile System
7. Delivery surface scaffolding (login integration hook, simple rendering)
8. Seed example briefings per composite (1 per tenant = 4 total, using examples in Part 6 as templates)
9. Smoke tests

### 9.3 · Dependencies on earlier drops

- **Intelligence Layer Overlays (Drops 3, plus wave 2 Meridian/First Capital):** Provide the KPIs, patterns, and external signal envelopes the engine reads from.
- **Contradiction Engine (Drop 4):** Category 6 (contradiction emergence) reads from contradiction state.
- **Executive Profile System (Drop 5):** Voice shaping integration.

If these haven't landed yet, the briefing engine can ship schema + composition pipeline scaffolding + stub integrations, then activate category-by-category as dependencies land.

### 9.4 · Placeholder approaches for missing pieces

Where a dependency isn't yet available, the briefing engine stubs gracefully:

- **No external signals yet?** Category 3 (peer move) and Category 4 (regulatory change) sit empty with "coming soon" placeholder.
- **No contradiction engine yet?** Category 6 sits empty.
- **No executive profile yet?** Voice shaping uses generic professional tone.

### 9.5 · Non-goals for this drop

- No actual email/Slack/SMS delivery (scaffold only)
- No learning/adaptation implementation (log user behavior for future)
- No automated event-driven generation (daily cadence only)
- No cross-channel analytics

---

**END OF WHAT'S-CHANGED BRIEFING ENGINE FOUNDATION**

*This is the architecture for AbarVa's Anticipation vibe. Version 1.0. Reviewed against north star v1.0. Depends on intelligence layer overlays, Contradiction Engine, and Executive Profile System. Demo-critical for Prat bet #1.*
