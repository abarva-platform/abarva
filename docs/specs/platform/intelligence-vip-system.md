# AbarVa · Integrated Intelligence + VIP Profile System

**For:** Prat Vemana demo (Target, CIPO) + foundation for any key user
**Effort:** 72h sprint — net-new VIP profile layer + Prat's data + Nexus personalization
**Depends on:** Pack A (Nexus live), Pack B+C (retrieval infra), Pack L (topic intelligence)
**Ships:** Before Prat's session

---

## The four-layer intelligence architecture

AbarVa was specified across packs with three layers — graph, vector, DB. The VIP system adds a fourth. **The architecture is now four layers woven into every Nexus turn.**

```
┌─────────────────────────────────────────────────────────────────┐
│                    NEXUS SYSTEM PROMPT                           │
│                                                                  │
│  ┌────────────────────┐  ┌────────────────────────────────┐   │
│  │ LAYER 4            │  │ LAYER 3                         │   │
│  │ USER PROFILE       │  │ ENGAGEMENT CONTEXT              │   │
│  │ (if VIP logged in) │  │ (turn history, topic, phase,   │   │
│  │                    │  │  active patterns)               │   │
│  └────────────────────┘  └────────────────────────────────┘   │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ LAYER 2 · CLIENT DATA                                       │ │
│  │ Tech stack · use cases · cost centers · contradictions ·   │ │
│  │ workflows · shadow AI · vendor deployments                 │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ LAYER 1 · PUBLIC KNOWLEDGE                                  │ │
│  │ Topics · patterns · vendors · regulations · frameworks ·   │ │
│  │ benchmarks · research · published insights                 │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│         All four assembled per turn, per client, per user        │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
                    ┌─────────────────────┐
                    │  GRAPH + VECTOR + DB │
                    │  (parallel fan-out)   │
                    └─────────────────────┘
```

### Retrieval strategy per layer

Each layer queries the data stores differently:

| Layer | Graph (Neo4j) | Vector (Pinecone) | Structured (Postgres) |
|---|---|---|---|
| **L1 Public** | Topic→pattern→vendor edges | `public:*` namespaces | Library tables |
| **L2 Client** | Client→vendor→project edges | `client:<id>:*` namespaces | Client data tables |
| **L3 Engagement** | Engagement→turn→deliverable edges | `engagement:<id>:*` namespaces | Turn history, deliverable versions |
| **L4 User profile** | User→company→industry edges | User-profile vector context | User profile tables |

When Nexus assembles a system prompt for a turn, it fans out in parallel to all four. The result is labeled sections in the prompt:

```
## USER CONTEXT (Prat Vemana)
Background: Target CIPO since Jan 2025 · Previously Kaiser SVP/CDO (2018-22) · Home Depot CPO · Staples
Areas of focus: GenAI platforms (launched Target Trend Brain, NRF 2026) · digital transformation · healthcare digital
Organizational context: Target does not use consulting firms (company principle) · heavy internal + on/offshore staff aug · cloud-native (AWS primary) · Fortune 40 scale
Inferred preferences: builder mindset · product leadership lens · privacy-architecture sensitivity · outcome attribution rigor

## CLIENT CONTEXT (Meridian Health System)
[Pack J seed data — tech stack, use cases, cost centers, active patterns]

## ENGAGEMENT CONTEXT
[Current engagement — topic, phase, recent turns, active contradictions]

## PUBLIC INTELLIGENCE
[Retrieved topic, patterns, benchmarks, research relevant to current turn]

## TURN
User said: [message]
Generate your response using all context above.
```

**This is what makes Nexus shine for Prat.** The four-layer weave means when Prat types a question, Nexus's answer is simultaneously Meridian-specific, engagement-aware, knowledge-backed, AND calibrated to who Prat is and how he thinks.

---

## VIP Profile System · spec

### Data model

**Migration 034 — VIP profiles**

```sql
BEGIN;

CREATE TABLE vip_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  
  -- Identity
  current_role TEXT,                       -- 'EVP, Chief Information and Product Officer'
  current_company TEXT,                    -- 'Target Corporation'
  current_industry TEXT,                   -- 'Retail'
  current_company_scale JSONB,             -- {revenue_usd, employees, fortune_rank}
  
  -- History
  career_history JSONB,                    -- ordered array of prior roles
  education JSONB,                         -- degrees, institutions
  board_seats JSONB,                       -- current + prior board affiliations
  
  -- Active focus
  current_initiatives JSONB,               -- ['Target Trend Brain (NRF 2026)', 'retail AI governance']
  areas_of_expertise TEXT[],               -- ['digital commerce', 'healthcare digital', 'GenAI platforms']
  recent_public_signals JSONB,             -- public speaking, articles, interviews with date + topic
  
  -- Organizational context
  company_principles JSONB,                -- ['does not use consulting firms', 'build-internal preference']
  labor_model TEXT,                        -- 'heavy internal + on/offshore staff aug'
  cloud_posture TEXT,                      -- 'AWS primary, GCP secondary'
  
  -- Inferred style
  communication_style JSONB,               -- {pace: 'direct', detail_level: 'technical', attention_span: 'short-to-focused'}
  builder_vs_buyer TEXT,                   -- 'builder' | 'buyer' | 'mixed'
  known_concerns JSONB,                    -- ['privacy boundary architecture', 'outcome attribution rigor', 'cloud deployment flexibility']
  
  -- Demo posture
  demo_tier TEXT CHECK (demo_tier IN ('vip', 'design_partner', 'prospect', 'standard')) DEFAULT 'standard',
  relationship_to_abarva TEXT,             -- 'potential design partner via Anand'
  avoid_topics TEXT[],                     -- ['Apex retail demo — lived at Home Depot, will see gaps']
  emphasize_topics TEXT[],                 -- ['Meridian healthcare', 'Helix pharma augmentation', 'cloud deployment']
  
  -- Metadata
  curated_by TEXT DEFAULT 'anand',
  last_updated TIMESTAMPTZ DEFAULT now(),
  confidence TEXT DEFAULT 'high',          -- quality of profile info
  source_urls TEXT[]                       -- where profile was sourced
);

CREATE INDEX idx_vip_profiles_user_id ON vip_profiles(user_id);
CREATE INDEX idx_vip_profiles_demo_tier ON vip_profiles(demo_tier) WHERE demo_tier != 'standard';

NOTIFY pgrst, 'reload schema';
COMMIT;
```

### Graph integration

```cypher
CREATE CONSTRAINT vip_user_id IF NOT EXISTS FOR (v:VIPUser) REQUIRE v.user_id IS UNIQUE;
CREATE CONSTRAINT company_name IF NOT EXISTS FOR (c:Company) REQUIRE c.name IS UNIQUE;

// Key relationships
// (VIPUser)-[:WORKS_AT]->(Company)
// (VIPUser)-[:PREVIOUSLY_AT]->(Company)
// (VIPUser)-[:BUILT]->(Product)  // e.g., Prat built Target Trend Brain
// (VIPUser)-[:INTERESTED_IN]->(Topic)
// (Company)-[:HAS_PRINCIPLE]->(OrgPrinciple {text: 'does not use consulting firms'})
```

This graph layer lets Nexus answer reasoning like: *"Prat previously worked at Kaiser, which is in the same industry (IDN healthcare) as our Meridian composite. Therefore a Meridian-based demo will resonate."* Not fluff — actual retrieval logic.

### Retrieval integration

In `src/lib/agent/retrieval.ts`, add the VIP layer:

```typescript
async function assembleUserContext(userId: string): Promise<UserContextBlock | null> {
  const profile = await getVIPProfile(userId);
  if (!profile || profile.demo_tier === 'standard') return null;
  
  return {
    name: profile.display_name,
    role: `${profile.current_role} at ${profile.current_company}`,
    scale: profile.current_company_scale,
    background: summarizeCareerHistory(profile.career_history, { maxRoles: 4 }),
    focus: profile.current_initiatives,
    expertise: profile.areas_of_expertise,
    orgContext: {
      principles: profile.company_principles,
      labor: profile.labor_model,
      cloud: profile.cloud_posture,
    },
    style: profile.communication_style,
    concerns: profile.known_concerns,
    demoGuidance: {
      emphasize: profile.emphasize_topics,
      avoid: profile.avoid_topics,
    },
  };
}
```

Called by every Nexus turn and every Ask Intelligence query when user is VIP. System prompt gets a USER CONTEXT block at the top.

### How Nexus behavior changes with VIP context

Four concrete behavioral changes:

**1. Greeting and first-turn posture.** When a VIP logs into an engagement for the first time, Nexus opens with contextual awareness instead of a blank prompt. Not sycophantic ("So nice to have you, Prat!") — substantive:

> *"Given Target's build-first culture and your work on Trend Brain, the parts of AbarVa most worth your time are probably how we handle cross-client pattern learning (where we differ from internal tools) and how we deploy into a customer's cloud (where we fit your operating model). Meridian's engagement is a good starting point since you ran digital at Kaiser — you'll recognize the context. Shall we start there?"*

**2. Retrieval weighting.** When Prat is logged in and types a question, Ask Intelligence's Intent Router biases retrieval toward:
- His emphasized topics (healthcare engagements, cloud deployment architecture, cross-client moats)
- His company's scale analogs (pulling Fortune 40-equivalent reference data)
- His expertise areas (GenAI platforms — show the agent atlas, not just vendor comparisons)

**3. Deliverable framing.** If Prat triggers a deliverable generation during demo, the Deliverable Engine produces it with:
- Financial scale calibrated to Target-equivalent ($100B+ revenue reference class, not mid-market)
- Organizational assumptions that fit Target's structure (no consulting line item; staff aug line item dominant)
- Recommendations written for a CIPO decision-maker (technical depth + product framing)

**4. Hard-question answer calibration.** Nexus's responses to common hard questions (*"How is this different from internal tools?"* *"What about privacy?"* *"Deploy in our cloud?"*) draw from his known_concerns and give the crisp answer from the playbook — not a generic one.

---

## Prat Vemana · profile data (ready to seed)

```sql
INSERT INTO vip_profiles (
  display_name, current_role, current_company, current_industry,
  current_company_scale, career_history, education, board_seats,
  current_initiatives, areas_of_expertise, recent_public_signals,
  company_principles, labor_model, cloud_posture,
  communication_style, builder_vs_buyer, known_concerns,
  demo_tier, relationship_to_abarva, avoid_topics, emphasize_topics,
  curated_by, confidence, source_urls
) VALUES (
  'Prat Vemana',
  'Executive Vice President, Chief Information and Product Officer',
  'Target Corporation',
  'Retail',
  '{"revenue_usd": 107_400_000_000, "employees": 440_000, "fortune_rank": 37, "market_cap_usd": 65_000_000_000}'::jsonb,
  '[
    {"role": "EVP, Chief Information and Product Officer", "company": "Target Corporation", "start": "2025-01", "end": null, "scope": "tech, cybersecurity, data platforms, data science, infrastructure, product engineering, UX"},
    {"role": "EVP, Chief Digital and Product Officer", "company": "Target Corporation", "start": "2022-10", "end": "2025-01", "scope": "digital business, Target+, product ops"},
    {"role": "SVP, Chief Digital Officer", "company": "Kaiser Permanente", "start": "2018", "end": "2022-10", "scope": "enterprise product mgmt, consumer experience, CTO office, cloud modernization, telehealth"},
    {"role": "Chief Product and Experience Officer", "company": "The Home Depot", "start": null, "end": "2018", "scope": "digital product, experience strategy"},
    {"role": "VP, Online", "company": "The Home Depot", "start": null, "end": null},
    {"role": "VP, Global E-commerce, Product and Analytics", "company": "Staples", "start": null, "end": null, "scope": "Velocity Lab, mobile strategy"}
  ]'::jsonb,
  '[{"degree": "MBA", "institution": "MIT Sloan School of Management"}, {"degree": "Engineering", "institution": "Sathyabama University"}]'::jsonb,
  '[{"company": "Frontier Communications", "role": "Board Member", "since": "2024", "industry": "Telecommunications"}, {"company": "Graphite Health", "role": "Board Member (former)", "industry": "Healthcare AI"}]'::jsonb,
  '["Target Trend Brain (GenAI trend intelligence, launched NRF 2026)", "Target+ marketplace expansion", "enterprise product operating model", "retail AI governance"]'::jsonb,
  ARRAY['digital commerce', 'healthcare digital transformation', 'GenAI platforms', 'enterprise product management', 'cloud modernization', 'consumer experience', 'telehealth'],
  '[
    {"type": "speaking", "venue": "NRF 2026 Big Show", "date": "2026-01", "topic": "Target Trend Brain — GenAI trend intelligence platform"},
    {"type": "announcement", "venue": "Target", "date": "2025-01", "topic": "Elevated to CIPO role"},
    {"type": "interview", "venue": "AIM Media House", "date": "2025-02", "topic": "CIPO appointment, digital strategy continuity"}
  ]'::jsonb,
  '["Does not use external consulting firms (company principle)", "Build-internal preference for core capabilities", "Product-led engineering culture"]'::jsonb,
  'Heavy internal engineering + large on/offshore staff augmentation for scaling analyst/delivery work',
  'AWS primary; extensive cloud modernization investment during Kaiser tenure carried forward',
  '{"pace": "direct", "detail_level": "technical, product-led", "attention_span": "focused but short — expects substance in first 2 minutes", "preference": "let me read, don''t narrate"}'::jsonb,
  'builder',
  '["privacy boundary architecture — enforced how?", "outcome attribution rigor — measurement methodology", "cloud deployment flexibility — single-tenant?", "how is this different from internal tools I''d build with my team?", "how does the platform improve with scale"]'::jsonb,
  'vip',
  'Potential design partner; warm introduction via Anand Sundaram',
  ARRAY['Apex retail demo — lived at Home Depot CPO + Staples e-commerce + now runs Target; will see retail composite gaps instantly', 'any generic consulting-replacement pitch — Target does not use consultants'],
  ARRAY['Meridian healthcare engagement — his Kaiser Permanente comfort zone, will evaluate with deep specificity', 'Helix pharma + Meridian augmentation — novel to him, showcases cross-client moat', 'privacy boundary architecture — his cybersecurity remit at Target demands it', 'cloud deployment story — single-tenant in customer VPC', 'outcome attribution methodology — CFO-grade rigor required', 'agent atlas — he built Target Trend Brain, will evaluate our orchestration depth'],
  'anand',
  'high',
  ARRAY['https://corporate.target.com/about/purpose-history/leadership/prat-vemana', 'https://nrfbigshow.nrf.com/speaker/prat-vemana', 'https://newsroom.frontier.com/board-of-directors/prat-vemana/', 'https://councils.aimmediahouse.com/prat-vemana-named-chief-information-and-product-officer-at-target/']
);
```

File this as `src/scripts/seed/vip-profiles/prat-vemana.sql`. Run during VIP seeding.

---

## Target-specific positioning (embedded in Prat's Nexus context)

These specific phrases and reframings appear in Nexus responses when Prat is logged in:

**Instead of** *"We replace your consultants"*
**Nexus says** *"We replace the 40-60% of your staff-aug analyst workload that's diagnostic, synthesis, or deliverable-draft work — so your teams focus on the 40-60% that actually requires their judgment."*

**Instead of** *"Our platform runs in our cloud"*
**Nexus says** *"We deploy as a licensed capability inside your cloud account. Your data never leaves your VPC. We become your internal intelligence layer with ongoing platform improvements, not a vendor you send data to."*

**Instead of** *"Engagement pricing is $X"*
**Nexus says** *"For an internal model like Target's, the commercial structure is platform licensing + per-engagement outcome share. Licensing scales with usage, outcome share with verified savings. If the outcomes don't materialize, neither does the share."*

**Instead of** *"We use Claude under the hood"*
**Nexus says** *"Model-agnostic by design. Claude is primary for reasoning quality, but we have abstraction layers over Claude, OpenAI, Cohere, and open-source. For Target, you'd run against whichever foundation model your security posture and cost model prefers."*

---

## The personalized Prat demo flow

Keyed to the updated playbook but with VIP-aware openings. When Prat logs in for the first time:

**0:00 — first login, Nexus greets directly** (this is the wow moment, not after an intro)

> *"Prat, welcome. Given you're running Target's product and tech org and launched Trend Brain this year, I want to be direct about what's worth your time here. Two things specifically: the cross-client pattern learning that would be hard to replicate internally at Target, and the cloud-deployment architecture so this fits your build-internal principle. I'd start with our Meridian healthcare engagement — your Kaiser context will help you evaluate whether what we're showing is real. Then we can get to Helix and the privacy architecture. That work?"*

Prat reads that in 8 seconds. He immediately knows: *this platform knows who I am and has calibrated its pitch.* That's the wow. Not generic greeting. Not over-personalized fawning. Substantive, calibrated, short.

**0:15 — Ask Intelligence query Prat would naturally type**

If Prat types *"compare your approach to Target Trend Brain"* — Ask Intelligence has the answer:

> *"Trend Brain is a trend intelligence platform — the discovery side of commerce decisions. AbarVa is a transformation platform — the execution side of strategic programs. Trend Brain tells you WHAT shoppers want next. AbarVa tells you HOW to execute the technology program that delivers it. Different jobs. You'd use both. The overlap is the retrieval-augmented reasoning spine; we generalized ours across engagement patterns rather than trend patterns. Want me to show the architecture?"*

This answer shows AbarVa knows what Trend Brain is, respects it, and positions thoughtfully. Prat will notice.

**0:30+ — rest of the flow** follows the playbook, with Nexus naturally weaving Target-aware language throughout.

---

## Workflow polish — critical refinements in 72h

Not "refine every part of the app" — that's not scoped. Four specific refinements that touch what Prat sees:

### 1 · First-login experience

Currently: generic dashboard.
Target: VIP-detected welcome state that surfaces 3 suggested entry points based on their profile.

For Prat, the landing page shows:
- **"Start with Meridian"** card (primary CTA based on his Kaiser background)
- **"Try Ask Intelligence"** card with a suggested query: *"What's the typical M365 Copilot adoption gap at Fortune 50 scale?"*
- **"Architecture overview"** card linking to the four-layer diagram

Generic users see the normal Home.

### 2 · Nexus "thinking" state

Currently: spinner.
Target: cognitive stages visible — "retrieving across public knowledge · client data · engagement context · your profile." Each stage ticks off as it completes. Prat sees transparency, not opacity.

This is Pack D Principle 1 (cognitive stages) — prioritize landing this before Prat's session.

### 3 · Empty state honesty

Currently: "No results found."
Target: "We don't have Fortune 50 manufacturer M365 benchmarks indexed. What we do have: Fortune 100 retail (Apex composite) and Fortune 500 healthcare (Meridian composite). Want me to extrapolate or would you like to narrow the question?"

Honest, specific, offers a path forward. Applies to Ask Intelligence + Tower + Library.

### 4 · Transitions

Currently: full page reloads on nav changes.
Target: client-side routing with instant transitions. Nav click → new surface loads in under 200ms. Feels like one app, not a web of pages.

Claude Code to implement with Next.js client routing + preloaded data for top-level pages.

---

## Private cloud deployment architecture (narrative for Prat)

This is the artifact you hand him if he asks about deployment. One-page architecture:

```
Customer Cloud (e.g., Target AWS)
┌─────────────────────────────────────────────────────────┐
│                                                           │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐  │
│  │ AbarVa Web  │  │ AbarVa API  │  │ Agent runtime   │  │
│  │ (Next.js)   │  │ (Node/TS)   │  │ (Nexus, Ask IQ) │  │
│  └─────────────┘  └─────────────┘  └─────────────────┘  │
│         │                │                 │              │
│         ▼                ▼                 ▼              │
│  ┌──────────────────────────────────────────────────┐   │
│  │  Customer VPC — data stores                       │   │
│  │  ┌─────────┐ ┌─────────┐ ┌──────────┐           │   │
│  │  │ Postgres│ │ Neo4j   │ │ Pinecone │           │   │
│  │  │ (RDS)   │ │ (Aura)  │ │ (priv.)  │           │   │
│  │  └─────────┘ └─────────┘ └──────────┘           │   │
│  │  All client + engagement data stays in VPC       │   │
│  └──────────────────────────────────────────────────┘   │
│                          │                                │
│                          │ Outbound calls                 │
│                          ▼                                │
│            ┌─────────────────────────┐                   │
│            │ Foundation model APIs   │                   │
│            │ (Anthropic / OpenAI /   │                   │
│            │  configurable)          │                   │
│            └─────────────────────────┘                   │
│                                                           │
└─────────────────────────────────────────────────────────┘

AbarVa engineering access
┌─────────────────────────────────────────────────────────┐
│  Platform updates via controlled deploy pipeline         │
│  Customer retains audit logs of all deploys              │
│  No direct data access by AbarVa engineers              │
└─────────────────────────────────────────────────────────┘
```

One narrative paragraph to go with it:

> *"AbarVa deploys as a licensed capability into your cloud account. Client data, engagement data, and vector embeddings never leave your VPC. Only foundation model API calls traverse the boundary — and even those are configurable (Claude, OpenAI, or self-hosted open-weight models). Platform updates ship through a controlled deploy pipeline you fully audit. You retain cryptographic evidence of every change. From a security posture standpoint, AbarVa looks like any other enterprise software licensed into your cloud — except the capability it provides is a transformation intelligence layer, not a point product."*

---

## What needs to ship in the next 72h

### Claude Code

1. **Migration 034 — VIP profiles table + graph additions** · 2h
2. **Retrieval integration — assembleUserContext injected into Nexus + Ask IQ** · 4h
3. **Prat profile seeded** (SQL from above) · 30 min
4. **VIP-aware greeting in engagement console first-load** · 3h
5. **Cognitive stages visible in Nexus turns** (Pack D Principle 1) · 6h
6. **Empty-state honesty rewrites** (Ask IQ, Tower, Library) · 2h
7. **Client-side routing for nav transitions** · 4h

Total ~22h of Claude Code work across 2 days with 3 worktrees parallel.

### Codex

1. **Profile-enrichment seed scripts** for 2-3 other VIP users (when names confirmed) · 2-4h
2. **Architecture diagram HTML artifact** (the cloud-deployment diagram above, styled per design system) · 3h
3. **First-login welcome component** (three suggested-entry cards) · 2h

Total ~7-9h of Codex work.

### Anand

1. **Confirm the other two CIO test drivers** so their profiles can be prepped same-way
2. **Approve seed of Prat profile** (review the data above, flag corrections)
3. **Run the demo in staging once it's up** — catch last-mile friction before Prat sees it

---

## Acceptance for the Prat demo

Before Prat's session starts:

- [ ] Log in as Prat's test account → first-load greeting is VIP-aware (names Target Trend Brain, references Kaiser, mentions build-internal culture)
- [ ] Ask Intelligence query *"compare your approach to Target Trend Brain"* returns a calibrated answer
- [ ] Nexus on Meridian engagement uses Target-positioning language ("augment staff-aug workload" not "replace consultants")
- [ ] Cognitive stages visible on every Nexus turn
- [ ] Empty state in Ask IQ proposes specific next steps, not just "no results"
- [ ] Nav transitions under 200ms on staging
- [ ] Architecture diagram accessible at `/platform/deployment` (or similar) for quick reference if he asks
- [ ] Cross-client Helix↔Meridian exposure query works reliably
- [ ] Privacy boundary proof works (log in as Sarah, show the 3-item nav, no Platform, no Helix access)

---

## The strategic frame for Anand

Prat is the hardest audience you could pick — he's lived both your healthcare composite (Kaiser) and your retail composite (Home Depot + Target). He's built enterprise agentic systems (Trend Brain). He evaluates as both operator and investor.

That's also why he's the highest-value audience. If Prat says yes to design-partner, he legitimizes the thesis in a way Shail alone cannot — Shail is friend-of-founder; Prat is brand-name Fortune 40 CIO+CPO who's built what you're building.

The VIP profile system is what lets you signal — in the first 8 seconds of his login — that AbarVa takes its users seriously. Not as generic LLM targets. As specific, substantive, context-laden people whose history shapes what they should see first.

**Ship this before he touches the product.** The wow is architectural, not cosmetic. When he reads the first greeting and realizes Nexus knows him — that's the moment he decides whether AbarVa is serious or a demo. That decision comes before the actual tour.

Everything else follows from that one moment.
