# Executive Profile System · Schema and VIP Population v1.0

**The architectural foundation for AbarVa's Presence vibe. Schema for representing the specific humans AbarVa interacts with, style-capture for personalized agent behavior, and initial VIP population covering real-world strategic relationships and composite tenant executives.**

Reads alongside:
- `docs/specs/platform/intelligence-layer-north-star-spec.md` — authoritative north star
- Every per-tenant intelligence layer overlay

---

## Part 1 · Strategic Context

### 1.1 · Why this system exists

Enterprise transformation is fundamentally an exercise in persuasion, coordination, and context-reading across specific humans. A generic agent that treats every CIO the same treats no CIO well. Consultants differentiate themselves by reading the room — remembering that a specific CFO prefers numbers before narrative, that a specific CEO pushes back on long horizons, that a specific sponsor needs public cover before committing privately.

**AbarVa's Presence vibe claims the platform knows the specific human.** Not as a gimmick, but as architected behavior: every agent interaction with a named executive passes through a personalization layer that adjusts framing, emphasis, tone, evidence-type preference, and conversational pacing.

For this to work, the platform must hold structured knowledge about each executive it interacts with.

### 1.2 · Two use modes

**Mode 1 · Real-world executive profiles.** For people AbarVa engages with in business development, investor relations, design partner cultivation. These profiles power meeting preparation, outreach strategy, relationship history, and conversation planning.

**Mode 2 · Composite tenant executive profiles.** For the named executives who populate composite tenants (Jonathan Aldridge at Keystone, Marcus Whitfield at Apex, Dr. Linda Chen-Winters at Meridian, Daniel Kovač at First Capital). These profiles power demo interactions — when the maestro is reasoning as if Jonathan is the sponsor of a program, it uses Jonathan's profile.

Same schema. Different populations. Different access scoping.

### 1.3 · The Prat demo moment

Prat logs into the composite Target tenant. His maestro greets him: "Prat, based on how you framed digital-first customer experience at Target's investor day and what you pushed on at Kaiser around platform modernization, I want to walk through this through the lens of compound value." Prat knows in that opening sentence that this is not a generic AI talking to a generic executive.

The executive profile schema makes that opening sentence possible.

### 1.4 · Sensitivity and ethics

Real-person profiles are sensitive. They contain observed behavioral patterns, decision style inferences, communication preferences. Used well, they enable genuinely useful relationship work. Used poorly, they enable manipulation.

The architecture enforces discipline:
- Real-person profiles are Anand-scope (primary) with specific delegation only
- Profiles prefer **observed public behavior** over inferred private traits
- Profiles avoid psychological categorization ("type A", "dominant", etc.) in favor of specific behavioral patterns with evidence
- Profile data flows to agents for personalization, not to humans for profiling reports
- Every profile carries an "ethics check" note on what it's used for and what it's not

---

## Part 2 · Profile Schema

### 2.1 · Core profile object

```
ExecutiveProfile {
  // Identity
  id: string                           // stable GUID
  profile_type: enum                   // real_world | composite_tenant
  client_id: string                    // for composite; null for real-world
  
  // Basic attributes
  full_name: string
  preferred_name: string               // how they introduce themselves
  pronouns: string
  current_role: string
  current_company: string
  current_tenure_start: date
  
  // Career trajectory
  career_history: array[{
    role: string
    company: string
    tenure_start: date
    tenure_end: date
    notable_accomplishments: array[string]
    exit_context: enum                 // promotion | lateral | departure | 
                                       // retirement | company_exit
  }]
  education: array[{
    institution: string
    degree: string
    year: date
    notable_context: string
  }]
  
  // Scope and remit
  current_remit: text                  // what they own
  reporting_structure: {
    reports_to: string
    direct_reports_count: number
    organizational_scope: text
  }
  strategic_priorities_personally_owned: array[string]  // priority IDs
  initiatives_personally_sponsored: array[string]       // initiative IDs
  
  // Communication style (observed patterns only)
  communication_style: {
    preferred_modality: enum           // in_person | video | phone | email | 
                                       // written_brief | data_first | 
                                       // narrative_first
    response_cadence: enum             // real_time | same_day | 48_hour | 
                                       // structured_batch
    information_density: enum          // dense | moderate | sparse
    evidence_preference: enum          // quantitative | qualitative | mixed
    decision_time_horizon: enum        // fast_decisive | deliberate | 
                                       // consultative_slow
    meeting_style: enum                // structured_agenda | free_flowing | 
                                       // problem_first | data_first
    written_style_observations: array[string]  // e.g., "concise", "avoids jargon"
  }
  
  // Decision and influence patterns (from observed behavior)
  decision_patterns: {
    risk_tolerance: enum               // aggressive | balanced | conservative
    horizon_preference: enum           // short_term | medium_term | long_term
    consensus_building: enum           // convener | driver | delegator
    pushback_patterns: array[string]   // what they typically push back on
    acceleration_patterns: array[string]  // what typically energizes them
    typical_first_questions: array[string]  // what they ask first when shown new ideas
  }
  
  // Public commitments (externally observable)
  public_statements: array[{
    statement_summary: text
    source: string                     // earnings call, conference, interview
    date: date
    topic_tags: array[string]
    commitment_quality: enum           // directional | specific | quantified
    evidence_id: string
  }]
  
  // Personal context (only if relevant and appropriate)
  known_priorities: array[{
    priority_description: text
    source: string                     // "mentioned in interview" etc.
    confidence: enum
  }]
  known_constraints: array[{
    constraint_description: text       // e.g., "board watching cybersecurity posture"
    source: string
    confidence: enum
  }]
  
  // Relationship network
  key_relationships: array[{
    related_person_id: string
    relationship_type: enum            // mentor | peer | direct_report | 
                                       // board_member | external_advisor |
                                       // adversary | ally
    relationship_context: text
    confidence: enum
  }]
  influential_voices: array[{
    voice_description: text             // e.g., "respects McKinsey partner X"
    source: string
  }]
  
  // AbarVa relationship (real-world profiles only)
  abarva_relationship_history: {
    first_contact_date: date
    interaction_count: number
    interaction_log: array[interaction_entry]
    current_relationship_stage: enum   // cold | introduced | conversational |
                                       // engaged | advocacy | design_partner |
                                       // customer
    current_trust_level: enum          // unknown | earning | established | strong
    known_concerns: array[string]
    demonstrated_interests: array[string]
    next_action_recommendation: text
    owner_inside_abarva: string        // Anand, specific team member
  }
  
  // Demo personalization (composite profiles only)
  demo_persona_overrides: {
    use_preferred_name_in_greetings: boolean
    specific_frames_to_open_with: array[string]
    topics_to_lead_with: array[string]
    sensitivities_to_acknowledge: array[string]
  }
  
  // Data sources and provenance
  source_material: array[{
    source_type: enum                  // public_speech | earnings_call | 
                                       // interview | linkedin_post | 
                                       // podcast | article | direct_observation
    source_reference: string
    ingestion_date: date
    confidence: enum
  }]
  last_refreshed_at: timestamp
  
  // Dual-scope
  reasoning_scope: AccessScope         // which agents can reason with profile
  disclosure_scope: AccessScope        // when can profile details be surfaced
  
  // Ethics and governance
  profile_use_statement: text          // what this profile is FOR
  profile_non_use_statement: text      // what it is NOT for
  human_reviewed_by: string            // who last reviewed for accuracy
  human_reviewed_at: timestamp
}
```

### 2.2 · Style capture methodology

Communication style and decision patterns are populated from observed behavior, not inferred psychology:

**From public speech and writing:**
- Word count distribution in public speaking
- Sentence complexity
- Quantitative vs narrative content ratio
- Topic return patterns (what they circle back to)
- Recurring frames and metaphors

**From earnings calls and investor communications:**
- Response length and structure
- Pushback patterns (how they handle adversarial questions)
- Typical first move in Q&A

**From observed meeting behavior (when available):**
- Opening move (agenda-first vs question-first vs context-first)
- Decision pacing (same-meeting vs post-meeting)
- Evidence requests (quantified vs qualitative vs narrative)

**Confidence discipline:**
- Patterns observed 3+ times → high confidence
- Patterns observed 1-2 times → medium confidence
- Inferred from single source → low confidence, noted as inference

### 2.3 · Profile populated minimum

For any profile to be "demo-ready":
- Basic attributes complete
- Career history minimum 2 prior roles
- Current remit populated
- At least 3 public statements with evidence
- Communication style fields populated with at least 2 observed patterns in each
- Source material minimum 5 distinct sources
- Human review completed

---

## Part 3 · VIP Population · Real-World Executives

The four primary real-world profiles Anand actively engages. Populated from public information with confidence notation.

### 3.1 · Prat Vemana

**Basic attributes.**
- Full name: Prat Vemana
- Current role: Executive Vice President, Chief Information and Product Officer
- Current company: Target Corporation
- Current tenure start: 2023

**Career trajectory (public).**
- Before Target: Kaiser Permanente (senior technology role)
- Before Kaiser: technology leadership roles in enterprise and healthcare
- Pattern: consistent progression through large-enterprise digital and product organizations

**Current remit.**
Information technology and product organization at a top-tier Fortune retailer. Accountable for enterprise technology platform, digital product surfaces, data and analytics capability, and increasingly AI platform strategy. Direct reports span engineering, product, data, and platform functions.

**Strategic context.** Operating in a retail sector undergoing intense digital transformation with pressure from Amazon, Walmart, Costco. Sector-wide shrinkage, operational cost pressure, and customer experience expectations elevated. Target specifically has navigated supply chain and operational pressures in recent years.

**Communication style (observed from public appearances).**
- Preferred modality: structured in-person or video; comfortable with both
- Information density: moderate to dense, comfortable with technical detail
- Evidence preference: mixed, with strong quantitative grounding
- Meeting style: appears to lead with problem framing before solution discussion
- Written style observations: direct, avoids hyperbole, technically precise

**Decision patterns (inferred with medium confidence from public statements).**
- Risk tolerance: balanced; willing to commit to ambitious programs but with evidence
- Horizon preference: medium-to-long term
- Pushback patterns: observed in interviews pushing back on hype-driven positioning
- Acceleration patterns: energized by compound-value framing, platform leverage, and genuine customer impact
- Typical first questions: "what does good look like," "how do we measure this," "what's the sequence"

**Public statements (summary).**
- Target investor day statements on digital transformation
- Podcast and conference appearances on AI in enterprise
- Published perspectives on platform strategy
- [Full list populated from source material with specific quotes in live ingestion]

**Known priorities (medium confidence).**
- Digital-first customer experience at scale
- Platform and data infrastructure modernization
- AI integration with clear business outcomes
- Operational leverage through technology

**AbarVa relationship.**
- Current relationship stage: introduced via network
- Current trust level: earning
- Known concerns: authentic value vs AI-hype, vendor commitment to follow-through
- Demonstrated interests: compound leverage models, enterprise-grade AI
- Next action recommendation: Demo-readiness with composite Target-analog tenant; open with compound-value framing; lead with structural differentiation; avoid generic enterprise AI positioning

**Owner inside AbarVa.** Anand (primary and sole)

**Reasoning scope.** Anand-direct; designated Anand-delegate permissions only
**Disclosure scope.** Anand-only; no surfacing outside Anand's direct interaction with the platform

**Profile use statement.** Meeting preparation, conversation planning, demo personalization for Prat's interaction with AbarVa. Relationship cultivation toward design partner candidacy and advocate relationship.

**Profile non-use statement.** Not for psychological profiling. Not for sharing with third parties. Not for manipulation — for understanding and genuine value alignment.

### 3.2 · Shail Jain

**Basic attributes.**
- Full name: Shail Jain
- Current role: Entrepreneur, investor, advisor
- Known context: seed investor in AbarVa; strategic advisor; multiple prior ventures

**Career trajectory.**
- Multiple entrepreneurial ventures with technology focus
- Investor across enterprise SaaS, AI, and adjacent categories
- Pattern: builder-operator-investor with hands-on operating background

**Current remit.**
Operating as investor-advisor across portfolio including AbarVa. Active strategic guide to Anand on company building, positioning, and go-to-market. Part of the Anthology Fund introduction path.

**Communication style (observed directly through interactions).**
- Preferred modality: conversation-driven, high-context
- Information density: dense, operator-level specifics
- Evidence preference: market signals and execution evidence over financial projections
- Decision pacing: fast-decisive within his remit
- Written style: direct, operator-voice, avoids consultant-speak

**Decision patterns.**
- Risk tolerance: aggressive in backing founders he trusts
- Pushback patterns: pushes back on positioning that feels unclear or imitative
- Acceleration patterns: energized by genuinely differentiated structural approaches; the "new category" narrative resonates
- Typical first questions: "what's the wedge," "what's structurally different," "what's the first $10M story"

**Public statements.**
- Background publicly traceable; specific philosophy statements less public-facing than founder-track executives
- Primary signal: ventures backed and roles taken

**Known priorities.**
- Pattern-matching to structurally differentiated companies
- Portfolio support through active advisory rather than passive capital
- Network leverage for portfolio companies

**AbarVa relationship.**
- Current relationship stage: design_partner-adjacent (seed investor + strategic advisor)
- Current trust level: strong
- Known concerns: execution pace and focus; resource management; right-sizing ambition
- Demonstrated interests: Harvey-analog positioning, category-defining narrative, Anthology Fund path
- Next action recommendation: Keep him close on strategic positioning; lean on him for Anthology Fund introduction timing; engage him on pitch refinement before formal partner conversations

**Owner inside AbarVa.** Anand (primary)

**Reasoning scope.** Anand-direct; broader AbarVa-team awareness is appropriate given investor/advisor role
**Disclosure scope.** Anand-only on relationship details; general context can be referenced in team contexts

### 3.3 · Tim Peterson

**Basic attributes.**
- Full name: Tim Peterson
- Current role: Executive Vice President, Chief Customer and Technology Officer
- Current company: Exelon Corporation
- Current tenure start: February 2026

**Career trajectory.**
- Prior role: CIO at an 8-state utility (Upper Midwest regional; prior-employer context for Tim)
- Earlier: Optum CIO (where Anand previously worked directly with Tim)
- Wellmark, TruStage CIO roles before Optum
- Education: MBA University of Minnesota, BBA Wisconsin
- Certification: CISSP
- Pattern: progression through senior technology roles in regulated industries (insurance, health, utility)

**Current remit.**
Combined customer and technology organization at a top-tier U.S. electric utility. Accountable for customer experience, technology platform, digital transformation, AI strategy. Newly created combined role — Tim stood it up upon arrival. Reports directly to CEO.

**Strategic context.** Operating in a utility undergoing massive capital program expansion, data center load surge (industry-wide 2x-3x interconnection queue growth), regulatory complexity across multiple jurisdictions, and workforce modernization. Utility sector-wide AI-first transformation is emerging; Tim specifically has been public about post-AI-deployment integration as the hard problem.

**Communication style (direct observation from Anand's prior work with Tim + LinkedIn and public content).**
- Preferred modality: structured conversations with operator-level specifics
- Information density: dense, engineering-and-business hybrid
- Evidence preference: quantified with specific examples; allergic to hand-waving
- Decision pacing: deliberate but then fast-execution
- Meeting style: agenda-driven, problem-first, willing to go deep
- Written style observations: clear, operator-voice, technically grounded, strategic

**Decision patterns.**
- Risk tolerance: balanced with strong bias to operational rigor
- Horizon preference: medium-term with clear milestones
- Pushback patterns: pushes back hard on under-specified proposals and anything that feels vendor-led rather than outcome-led
- Acceleration patterns: energized by specific operator problems with genuine solutions; platform-and-system thinking; repeatable models
- Typical first questions: "what problem are we solving," "how does this work with what we already have," "what's the first operator story"

**Public statements (from LinkedIn and industry appearances).**
- Extensive thesis on post-AI-deployment integration — the problem isn't deploying AI, it's making AI part of a coherent operating model
- Utility sector transformation perspective
- Platform and workflow integration philosophy

**Known priorities (high confidence from direct interaction + public content).**
- Making AI deployments stick as operational capability, not pilot demonstration
- Customer-technology alignment as organizing principle
- Platform consolidation and workflow integration over point-tool proliferation
- Workforce enablement through capable tools rather than through workforce replacement

**Known constraints.**
- New role: needs early wins that demonstrate the combined-org thesis
- Regulated utility: must land within regulatory constructive-engagement framework
- Large capital program: resource discipline intense

**AbarVa relationship.**
- Current relationship stage: warm-operator (Anand's prior direct boss; known and trusted)
- Current trust level: established, rooted in historical working relationship
- Known concerns: vendor discipline (has seen many pitches), follow-through on promises, genuine utility-sector fit
- Demonstrated interests: operator-focused platforms, outcome accountability, real integration work
- Next action recommendation: Lead with Keystone composite (utility-sector specificity, demonstrates AbarVa understands his world); frame around post-AI-deployment integration (his thesis); propose test drive against a specific operational problem he's working on; avoid generic enterprise AI pitch

**Owner inside AbarVa.** Anand (primary, leveraging personal relationship)

**Reasoning scope.** Anand-direct; composite Keystone demo agent can use relevant framing subset
**Disclosure scope.** Anand-only; demo agent uses style-aware framing without exposing profile

**Profile use statement.** Meeting prep, conversation planning, Keystone demo personalization if Tim engages with composite tenant, relationship cultivation toward design partnership.

### 3.4 · Ranjan Goswami

**Basic attributes.**
- Full name: Ranjan Goswami
- Current role: Senior Vice President (Customer Experience or adjacent technology role)
- Current company: Delta Air Lines
- [Specific title confirmed via LinkedIn at population time]

**Career trajectory.**
- Progression through technology and customer experience roles in travel/hospitality
- Pattern: travel/transportation sector specialization

**Current remit.**
Customer experience and adjacent technology remit at a top-tier global airline. Delta specifically has been a customer-experience-led airline in the industry and Ranjan's role connects to that strategic orientation.

**Strategic context.** Airline industry experiencing customer experience differentiation pressure, technology platform modernization, operational complexity recovery post-pandemic. Delta has positioned itself as the premium/reliable carrier and continues to invest in customer-facing technology.

**Communication style (observed from public appearances).**
- Preferred modality: likely structured with travel/customer context
- Evidence preference: customer-experience data and operational specifics
- Decision patterns: collaborative within Delta's operating rhythm

**Known priorities.**
- Customer experience technology that compounds over interactions
- Operational reliability in customer-facing technology
- Platform integration across channels

**AbarVa relationship.**
- Current relationship stage: warm-operator (network-referenced, pre-vouched for by relationship chain)
- Current trust level: earning
- Known concerns: airline-specific fit, enterprise AI maturity
- Demonstrated interests: compound customer experience, operator-focused platforms
- Next action recommendation: Propose conversation with airline-specific framing — note that AbarVa does not yet have an airline composite but is positioning toward travel/hospitality as a future sector; lead with the Transformation Genome as structure, Apex as adjacent-consumer-facing reference; propose design partner candidacy rather than demo-first

**Owner inside AbarVa.** Anand (primary)

**Reasoning scope.** Anand-direct
**Disclosure scope.** Anand-only

---

## Part 4 · VIP Population · Composite Tenant Executives

The composite executives already seeded in each tenant overlay. This section provides the profile-schema instantiation for the primary VIPs per composite — those the maestro is most likely to interact with in demo and operating scenarios.

### 4.1 · Keystone Energy Holdings · Jonathan Aldridge

**Basic attributes.**
- Full name: Jonathan Aldridge
- Current role: EVP Chief Customer and Technology Officer
- Current company: Keystone Energy Holdings
- Current tenure start: February 2026

**Career trajectory.**
- Prior: CIO at an 8-state utility (Upper Midwest regional)
- Before: Optum CIO, Wellmark CIO, TruStage CIO
- Education: MBA U Minnesota, BBA Wisconsin
- CISSP certification

**Current remit.** Combined customer and technology organization, newly established. Drives customer experience transformation, technology platform modernization, AI strategy, digital transformation. Reports to CEO Marcus Kittrell.

**Strategic context.** Standing up a new combined org; arrived Feb 2026; operating in high-capital-expansion environment; 32 GW data center interconnection queue context; NERC CIP regulated; multi-jurisdictional.

**Communication style.** Structured. Dense. Operator-voice. Pushes for specific problems and specific solutions.

**Decision patterns.** Balanced risk tolerance. Medium-term horizon with clear milestones. Pushes back on under-specified proposals. Energized by operator-focused platform thinking.

**Known priorities.**
- Customer-technology alignment as organizing principle
- Post-AI-deployment integration (not deployment, integration)
- Workforce enablement through capable tools
- Platform consolidation

**Demo persona overrides.**
- Use "Jonathan" in greetings
- Open with customer-technology combined-org framing
- Lead with operational-integration topics, not cutting-edge-AI-demo topics
- Acknowledge multi-jurisdictional regulatory complexity
- Avoid generic digital-transformation framing

**Reasoning scope.** Keystone-tenant maestros
**Disclosure scope.** Keystone-tenant programs as appropriate to program scope

**Note.** This profile intentionally mirrors Tim Peterson's real profile (with identical demo-persona overrides). The composite-to-real continuity is architectural — when Tim engages with the Keystone demo, the agent's style-calibration is already aligned.

### 4.2 · Apex Retail Group · Marcus Whitfield

**Basic attributes.**
- Full name: Marcus Whitfield
- Current role: EVP Chief Customer Officer
- Current company: Apex Retail Group

**Career trajectory.** Retail customer experience and loyalty organization roles through Fortune retailers.

**Current remit.** Customer, loyalty, insights, customer experience architecture. Owns NPS and customer satisfaction measurement.

**Strategic context.** Retail sector digital-commerce acceleration, loyalty program evolution, customer-experience differentiation vs peers.

**Communication style.** Mixed quantitative-narrative. Customer-stories-with-data preference. Decisive within scope.

**Decision patterns.** Balanced. Customer-outcome focus. Pushes back on capability positioning without customer-outcome grounding.

**Known priorities.**
- Loyalty 2.0 evolution
- Customer experience omnichannel cohesion
- Insights-to-action acceleration

**Demo persona overrides.**
- Use "Marcus" in greetings
- Lead with customer insights and experience framing
- Connect to loyalty-program context when relevant

**Reasoning scope.** Apex-tenant maestros
**Disclosure scope.** Apex-tenant programs as appropriate

### 4.3 · Meridian Health System · Dr. Linda Chen-Winters

**Basic attributes.**
- Full name: Dr. Linda Chen-Winters
- Current role: President, Meridian Health Plans
- Current company: Meridian Health System (integrated provider-payer system)

**Career trajectory.** Physician-executive background; health plan leadership progression.

**Current remit.** Meridian Health Plans (the payer organization within the integrated system). Accountable for medical loss ratio, member retention, VBC progression from payer side, health plan growth.

**Strategic context.** Integrated provider-payer health system navigating value-based care transition, Medicare Advantage quality (stars), health plan-provider economics within integrated model.

**Communication style.** Physician-grounded. Clinically rigorous. Policy-aware. Comfortable with clinical and financial detail.

**Decision patterns.** Deliberate. Evidence-heavy. Consultative. Values cross-functional alignment.

**Known priorities.**
- VBC progression on payer side
- MA star rating
- Member retention
- Health-plan-provider economics

**Demo persona overrides.**
- Use "Dr. Chen-Winters" in formal contexts, "Linda" if invited
- Lead with clinical-financial integration framing
- Acknowledge HIPAA compliance as baseline

**Reasoning scope.** Meridian-tenant maestros
**Disclosure scope.** Meridian-tenant programs as appropriate

### 4.4 · First Capital Financial · Daniel Kovač

**Basic attributes.**
- Full name: Daniel Kovač
- Current role: Chief Financial Officer
- Current company: First Capital Financial

**Career trajectory.** Financial services CFO and finance leadership progression.

**Current remit.** Enterprise finance, investor relations, regulatory financial reporting, capital management.

**Strategic context.** Regional/super-regional bank navigating deposit cost pressure, net interest margin management, capital and liquidity requirements, regulatory examination cycle.

**Communication style.** Financial-rigor. Balance sheet first. Regulatory-aware. Structured.

**Decision patterns.** Conservative tilt. Long-term balance-sheet perspective. Deliberate.

**Known priorities.**
- Net interest margin protection
- Capital efficiency
- Regulatory examination outcomes
- Credit quality discipline

**Demo persona overrides.**
- Use "Daniel" in greetings
- Lead with financial performance + regulatory posture framing
- Balance-sheet focused

**Reasoning scope.** First-Capital-tenant maestros
**Disclosure scope.** First-Capital-tenant programs as appropriate

---

## Part 5 · Personalization Layer

### 5.1 · How profiles shape agent behavior

When a maestro is responding in a context involving a specific named executive (either as the interacting user OR as a subject of the conversation), the personalization layer applies:

**Opening.** If the executive has a preferred name and preferred opening framing, use them.

**Framing.** Lead with the executive's preferred frame (e.g., compound-value for Prat, integration-not-deployment for Tim/Jonathan).

**Evidence selection.** Prefer evidence types matching their preference (quantitative for Daniel Kovač, clinical-financial integrated for Linda Chen-Winters).

**Pacing.** Adjust information density and decision-pacing expectations.

**Pushback prediction.** Pre-address likely pushbacks before they're raised.

**Acceleration levers.** Lean into what energizes them.

### 5.2 · Personalization without leaking profile

The personalization layer applies profile knowledge to shape output without exposing the profile itself. Agent doesn't say "I know you prefer quantitative evidence so here are numbers." Agent just leads with numbers.

Users should feel the personalization as natural fit, not as uncanny intelligence about them. The profile works best when invisible.

### 5.3 · When the executive is the user

When the user IS the executive (e.g., Prat logged in as Prat):
- Full personalization applies
- Profile drives conversational dynamics
- Agent uses preferred name
- Profile reasoning scope applies; disclosure scope relevant for what agent reveals about *other* profiles

### 5.4 · When the executive is a subject

When the conversation is ABOUT an executive (e.g., program lead preparing to meet with CFO):
- Profile shapes the briefing the agent produces
- Agent surfaces known concerns, priorities, communication style relevant to the upcoming interaction
- Disclosure scope governs what profile details are surfaced

---

## Part 6 · Schema Instantiation

### 6.1 · Tables

**Primary.** `executive_profiles` (the main profile object per schema Part 2.1)

**Supporting.**
- `executive_career_history` (array attribute normalized for query)
- `executive_public_statements` (array normalized; links to evidence)
- `executive_relationships` (graph edges between profiles)
- `executive_interaction_log` (abarva_relationship_history nested)
- `executive_demo_persona_overrides` (composite-profile specific)

### 6.2 · Graph edges

ExecutiveProfile → has_role → Role
ExecutiveProfile → works_at → Client
ExecutiveProfile → owns → StrategicPriority
ExecutiveProfile → sponsors → Initiative
ExecutiveProfile → stated → PublicStatement
ExecutiveProfile → relates_to → ExecutiveProfile (with relationship_type)
ExecutiveProfile → evidenced_by → Evidence
ExecutiveProfile → ingested_from → Source

### 6.3 · Update protocols

Real-world profiles:
- Public statement ingestion continuous from external signal pipeline
- Interaction log updated every direct Anand-executive touchpoint
- Quarterly human review for accuracy
- Trust level re-assessed on explicit events (meetings, responses, commitments)

Composite profiles:
- Seeded at tenant instantiation
- Demo-review cycle when preparing for specific real-executive engagement
- Updated if composite seed is refreshed

---

## Part 7 · Smoke Tests

**Schema tests.**
1. "Create a real-world profile for a new VIP" → entity created with complete schema
2. "Update an interaction log entry" → interaction appended, trust level re-assessed
3. "Query profiles accessible to Anand" → all real-world profiles return

**Personalization tests.**
4. "Composite Keystone maestro greets Jonathan" → uses "Jonathan," leads with customer-technology combined-org framing
5. "Apex maestro responds to a loyalty question posed as Marcus" → lead with customer-outcome framing
6. "Meridian maestro briefs on Linda Chen-Winters as subject" → clinical-financial integration framing, HIPAA acknowledgment

**Scope tests.**
7. "Can a Meridian program maestro see Prat's real-world profile?" → no, scoped to Anand
8. "Can general Keystone maestros use Jonathan's demo persona?" → yes, within Keystone tenant

**Real-composite continuity.**
9. "Verify Tim-Jonathan style alignment" → both profiles produce same demo persona behavior

---

## Part 8 · Ethics Review

### 8.1 · What these profiles are FOR

- Meeting preparation and conversation planning
- Demo personalization that respects user intelligence
- Relationship cultivation that starts from understanding
- Decision-context briefings for program work

### 8.2 · What these profiles are NOT FOR

- Psychological profiling or manipulation
- Third-party sharing
- Adversarial use (competitive intelligence against these executives)
- Replacing genuine human judgment in relationship work
- Gossip or cross-context disclosure

### 8.3 · Data hygiene

- Profiles prefer observable public behavior over inferred private traits
- All claims grounded in source material
- Confidence notation is mandatory (no claim without confidence)
- Quarterly review for accuracy and appropriateness
- Deprecation path when relationship ends or profile becomes irrelevant

### 8.4 · Access discipline

- Real-world profiles default to Anand-only
- Composite profiles available to maestros operating in tenant scope
- Cross-contamination prevented structurally (real-world profiles never leak into composite maestro context)

---

## Part 9 · Ingestion Notes for Codex

### 9.1 · This is new infrastructure

Executive profile system requires schema migration, graph edge model, personalization layer integration, and UI surfacing (later).

### 9.2 · Ordering

1. Schema migration (executive_profiles + supporting tables)
2. Graph edge types added to graph model
3. Personalization layer hook in agent reasoning pipeline (Part 12 of north star, Step 3: Stakeholder mapping)
4. Seed 4 real-world profiles (Prat, Shail, Tim, Ranjan) from data in Part 3
5. Seed 4 primary composite profiles (Jonathan, Marcus, Linda, Daniel) from data in Part 4
6. Smoke tests

### 9.3 · Dual-scope enforcement

Real-world profiles are Anand-scope by default. Composite profiles are tenant-scope. Structural enforcement at the output filter layer — real-world profile data cannot flow into composite tenant agent context.

### 9.4 · Ethics check required

Before the profiles ingest, Anand reviews the four real-world profiles for accuracy and appropriateness. This is not a routine check; it's a governance checkpoint. After Anand's approval, ingestion proceeds.

### 9.5 · Non-goals for this task

- Full personalization layer implementation (integration points only)
- UI for profile viewing/editing (Claude Code handles later)
- Cross-profile relationship graph depth (basic relationships only; deep analysis future)
- Automated style-capture from public sources (manual population for initial VIPs; automation future)

---

**END OF EXECUTIVE PROFILE SYSTEM SCHEMA AND VIP POPULATION**

*This is the architecture for AbarVa's Presence vibe. Version 1.0. Schema reviewed against north star v1.0. Real-world profiles require Anand's ethics review before ingestion. Next review after initial deployment and tuning against demo feedback.*
