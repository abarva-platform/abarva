# Apex Retail Group · Comprehensive Seed Data Specification

**A Target-class composite retail enterprise designed to populate the AbarVa platform with genuine Fortune 30 depth for demonstration, development, and pattern library seeding.**

This document defines the complete Apex Retail Group tenant data set. Every dataset, person, initiative, vendor, prior program, and financial metric specified here is to be ingested into the Apex tenant and made available to Nexus, Sentinel, Atlas, and Steward as grounded context.

**IMPORTANT:** Apex is a composite. It is sized and structured like a Fortune 30 mass-market retailer, comparable in scale to companies like Target, Costco, or Kroger, but it is distinct from any of them. The financials, named executives, initiatives, and specific details in this document are composite representations built from real retail transformation patterns. When demonstrating the platform, Apex should always be described as "a composite organization built from real-world data" or "a Target-class composite built from real work" — never as a real company.

This specification exists because the Phase 0 test-drive on April 21, 2026 revealed that Nexus's conversational craft is excellent but its specificity is generic. An AbarVa agent interacting with a Fortune 30 sponsor should reference the company by name, know the executives in the room, understand the business structure, and cite recent events. Without that grounding, the agent produces "good consulting AI" rather than "AI that understands my world." This document closes that gap for Apex.

Reads alongside:
- `docs/specs/_meta/seed-data/apex-reconciled.md` — the existing (lighter) Apex seed that this supersedes
- `docs/specs/platform/agent-architecture.md` — how agents consume this data
- `docs/specs/platform/administration-architecture.md` — Track E on org structure as intelligence input
- `docs/specs/intelligence/design-spec.md` — how Intelligence layer references composite data
- `docs/specs/programs/design-spec.md` — how Programs reference composite context

---

## Part 1 · Company Profile

### 1.1 · Identity and positioning

Apex Retail Group is a publicly-traded, mass-market multi-category retailer headquartered in Chicago, Illinois. Founded in 1958 as a single-store discount department store on the south side of Chicago, Apex grew through three waves of expansion — regional consolidation in the 1960s and 1970s, national expansion through the 1980s and 1990s, and multichannel reinvention starting in 2005. The company trades on the New York Stock Exchange under the ticker APEX.

Apex positions itself as "the accessible quality retailer" — distinct from the cost-leader positioning of Walmart-class peers and the premium-curation positioning of department stores. Its brand promise blends design-forward private-label merchandise with competitive pricing, anchored by a multi-format store fleet and an increasingly integrated digital experience.

The company has built substantial competitive moat in three areas over the past decade:

- **Owned brand portfolio.** Apex operates 35 proprietary brands across categories, collectively generating approximately $35B in annual revenue and representing 32% of total sales. The owned brand portfolio includes several brands with individual revenue above $2B, creating merchandise IP that competitors cannot replicate.

- **Store experience and design.** Apex's stores are designed as destinations rather than purely transactional environments, with extensive investment in layout, lighting, and category adjacency. The company maintains in-house design studios in Chicago, New York, and Los Angeles.

- **Same-day fulfillment.** Through a combination of store-based fulfillment and 38 regional distribution centers, Apex can deliver or make available for pickup approximately 92% of online orders within six hours of order placement.

Apex's primary strategic pressures come from three directions: price competition from Walmart and Amazon on commodity goods, margin compression across categories due to tariff and supply chain cost inflation, and generational shifts in retail consumption patterns that threaten traditional store-dependent revenue models.

### 1.2 · Scale and financial snapshot

As of the most recent fiscal year (FY2025 ending January 31, 2026):

- **Total revenue:** $108.4B
- **Gross profit:** $30.2B (27.9% gross margin)
- **Operating income:** $5.8B (5.3% operating margin)
- **Net income:** $4.1B
- **Total assets:** $58.2B
- **Market capitalization:** approximately $72B at current trading levels
- **Store count:** 1,976 domestic stores across all 50 states, plus 14 international pilot stores in Mexico
- **Team members:** approximately 452,000, including 387,000 hourly store team members, 41,000 distribution center team members, and 24,000 corporate and headquarters staff
- **E-commerce penetration:** 22% of total sales, having grown from 9% in 2019
- **Loyalty program members:** 127M enrolled across the Apex Circle and Apex Plus tiers, with approximately 88M active in the past 12 months
- **Store formats:** General merchandise stores (1,412), smaller-format neighborhood stores (412), specialty grocery-anchored stores (152), international pilot stores (14)

The company has committed to a $6.0B capital expenditure program across fiscal years 2026-2028, with approximately 45% allocated to technology modernization, 30% to store renovations and new formats, 15% to distribution and fulfillment infrastructure, and 10% to international expansion pilots.

### 1.3 · Category structure

Apex operates through eight merchandise categories, each headed by an SVP-level leader reporting into the Chief Merchandising Officer:

- **Apparel and Accessories** — approximately $24B in annual revenue, including in-house brands across women's, men's, and children's wear
- **Home and Decor** — approximately $19B, anchored by proprietary home brands and exclusive designer collaborations
- **Food and Beverage** — approximately $18B, including fresh, grocery, and beverage, growing rapidly through expansion of grocery-anchored formats
- **Essentials and Personal Care** — approximately $16B, covering paper goods, household, personal care, and baby essentials
- **Electronics and Entertainment** — approximately $11B, encompassing consumer electronics, gaming, books, music, and movies
- **Toys and Sporting Goods** — approximately $8B
- **Beauty** — approximately $7B, operating a mix of in-house beauty brands and exclusive retail partnerships (notably the "Beauty Studio" concept within larger format stores)
- **Seasonal and Occasion** — approximately $5B, spanning holiday, outdoor, patio, and specialty seasonal merchandise

### 1.4 · Operating geography

Apex's domestic store footprint is distributed across four operating regions, each headed by a Regional President:

- **East Region** — 512 stores, headquartered in Atlanta, GA (President Thomas Calderón)
- **Central Region** — 598 stores, headquartered in Chicago, IL (President Amelia Park)
- **South Region** — 478 stores, headquartered in Dallas, TX (President Marcus Washington)
- **West Region** — 388 stores, headquartered in Phoenix, AZ (President Lin Zhou)

The Chicago headquarters houses approximately 14,000 corporate team members across the Apex Center campus, which includes an executive office tower, technology campus, design studios, and a flagship innovation store used for concept testing.

### 1.5 · Recent corporate trajectory

The period from 2023 to early 2026 has been formative for Apex. Key events:

- **October 2023 · CEO transition.** Vincent Okafor succeeded longtime CEO Gerald Maresh, who retired after 18 years in the role. Okafor had joined Apex in 2021 as CFO and was widely seen as the internal heir apparent. His stated priorities at appointment: accelerate digital, defend margin, rebuild merchandise relevance.

- **Q2 2024 · Margin pressure event.** Q2 FY2024 earnings missed consensus expectations by 14 cents per share, driven by excess inventory in apparel and home categories following an over-forecast of discretionary spending. Stock dropped 19% in a single session. This event is still widely referenced internally as "the July surprise."

- **Q4 2024 · Strategic reset announcement.** Okafor announced a three-pillar strategic plan: "Decide Faster" (operating model reform), "Own More" (owned brand expansion), "Be Chosen" (customer experience investment). The plan was received positively by analysts. Implementation is ongoing.

- **Q2 2025 · CFO transition.** Daniel Kovač joined as CFO from a consumer packaged goods background, replacing interim CFO Patricia Hennig. Kovač has publicly emphasized working capital discipline and capital allocation rigor.

- **Q3 2025 · Mexico pilot launch.** 14 pilot stores opened in metropolitan Mexico markets as the first international expansion test in over a decade. Early results are mixed; the company is being deliberate about the pace of further expansion.

- **Q4 2025 · AI strategy announcement.** The company announced a $400M investment over three years in AI-enabled retail operations, spanning merchandising intelligence, supply chain optimization, customer personalization, and store operations. This announcement was made alongside FY2025 Q3 earnings and was received cautiously by the Street, with several analysts questioning the adoption curve and measurable returns.

- **January 2026 · Supply chain incident.** A significant supply disruption affected inbound flow to 12% of East Region stores for approximately three weeks due to a vendor bankruptcy combined with logistics partner capacity constraints. Recovery was effective but exposed concentration risk that leadership has committed to addressing.

- **February 2026 · Activist investor engagement.** A mid-cap activist fund disclosed a 3.4% stake in Apex and published a letter calling for accelerated owned brand monetization, more aggressive store fleet rationalization in underperforming markets, and board-level AI governance oversight. Management's response has been measured; no public concessions to date.

- **March 2026 · Analyst day.** Apex hosted a well-attended analyst day in Chicago. Okafor reaffirmed the three-pillar strategy and committed to specific 2027 targets including 27% owned brand penetration, 25% e-commerce penetration, and 5.8% operating margin. Kovač walked through capital allocation framework. Chief Information Officer Priya Sethi presented the AI strategy in detail for the first time publicly.

---

## Part 2 · Executive Leadership

The Apex executive committee comprises fourteen C-suite and SVP-level leaders reporting directly to CEO Vincent Okafor. Full profiles below in Part 4. This section provides the roster view.

### 2.1 · C-suite roster

- **Vincent Okafor** — Chief Executive Officer (since October 2023)
- **Rebecca Tanaka** — Chief Operating Officer (since January 2024, promoted from Chief Stores Officer)
- **Daniel Kovač** — Chief Financial Officer (since May 2025)
- **Maria Delgado** — Chief Supply Chain Officer (since March 2022)
- **Priya Sethi** — Chief Information Officer (since September 2023)
- **Jordan Alkaev** — Chief Merchandising Officer (since April 2024)
- **Evan Soriano** — Chief Digital Officer (since June 2023)
- **Jamila Hassan-Reyes** — Chief Human Resources Officer (since August 2022)
- **Karel Jensen** — Chief Marketing and Customer Officer (since February 2024)
- **Nadia Okonkwo** — Chief Growth and Strategy Officer (since November 2024)
- **Raymond Teller** — Chief Stores Officer (since January 2024, succeeded Tanaka)
- **Sofia Mendelsohn** — Chief Sustainability and Corporate Affairs Officer (since March 2023)
- **Harper Nakamura** — General Counsel and Chief Risk Officer (since July 2021)
- **Christopher Vale** — Chief Owned Brands Officer (since October 2024)

### 2.2 · Extended leadership · SVPs by function

Reporting into the C-suite, approximately 78 SVP-level executives lead divisions, categories, regions, and specialized functions. The most demo-relevant SVPs for Programs and Intelligence reasoning include those listed in Part 5.

### 2.3 · Board composition

The Apex Board of Directors has eleven members including Okafor. The non-executive chairman is Dr. Allison Weathers, former CEO of a major consumer products company, who has served on the board since 2018 and as chair since Okafor's appointment. Board committees include Audit (chaired by Ernesto Vargas), Compensation (chaired by Priscilla Chen), Governance and Nominating (chaired by Weathers directly), and the newly-formed Technology and Risk Committee established in late 2025 (chaired by Dr. Rohan Gopal, a former technology executive from an enterprise software company).

The Technology and Risk Committee is particularly relevant because it was the board's response to concerns about AI governance raised during the activist engagement, and it provides a governance lens on transformation Programs that AbarVa would operate under.

---

## Part 3 · Strategic Priorities · 2026

The three-pillar strategic plan announced in Q4 2024 remains the operating framework. Each pillar has specific 2026 priorities and measurable commitments.

### 3.1 · Pillar One · Decide Faster

Operating model reform focused on compressing decision cycles from weeks to days and aligning cross-functional decision rights across merchandising, planning, supply chain, and stores.

Named 2026 priorities under this pillar:

- **Planning cadence modernization** — moving from monthly to weekly demand and inventory decisions in apparel and home categories, with a target of biweekly in essentials and food by end of Q3
- **Organizational decision rights clarification** — a cross-functional initiative led by Chief Operating Officer Tanaka to redraw the RACI for twelve identified decision categories where ambiguity slows execution
- **Integrated planning technology platform** — selection and early implementation of a next-generation integrated planning platform to replace the current patchwork of category-specific forecasting tools, with RFP evaluation completed in Q2 2026 and phased implementation through 2027
- **AI decisioning layer** — the initiative that anchors the Phase 0 engagement with Maria Delgado, focused on reconciling tradeoffs between merchandising, planning, and supply chain decisions under existing misaligned KPIs

### 3.2 · Pillar Two · Own More

Owned brand expansion, targeting a lift from current 32% penetration to 27% in 2027 (note: the public target is lower than current because the company is rationalizing underperforming brands while investing in winners, with net penetration set to rise to 36% by 2028 once rationalization completes).

Named 2026 priorities:

- **Brand portfolio rationalization** — eliminating or reducing investment in 8 underperforming owned brands, reallocating capital to 5 flagship brands identified as growth accelerators
- **Three new brand launches** in Beauty, Home, and Food categories
- **Owned brand marketing platform** — a major cross-channel marketing investment to build awareness for owned brands as brands in their own right, not just store-brand equivalents
- **Owned brand wholesale pilot** — exploratory work on selling select owned brands through non-Apex channels (initially specialty retailers, eventually potentially direct e-commerce), a controversial strategic move championed by Christopher Vale

### 3.3 · Pillar Three · Be Chosen

Customer experience differentiation through personalization, store experience, and service innovation.

Named 2026 priorities:

- **Personalization platform rollout** — full deployment of next-generation personalization across mobile app, email, and in-store experiences, targeting measurable lifts in basket size and trip frequency
- **Apex Plus loyalty program evolution** — restructuring of the premium loyalty tier to emphasize experiential benefits over transactional rewards, following research showing the premium segment prefers exclusivity and service over points
- **Same-day expansion** — extending same-day fulfillment capability from the current 92% of online orders to 97%, including extension of the fulfillment window to serve suburban and exurban markets
- **Store format innovation** — piloting three new store formats in 2026: an urban neighborhood store (3,000 sq ft, targeting dense city markets), a curated beauty-focused store (6,000 sq ft), and a grocery-forward community store (45,000 sq ft in underserved suburban markets)

### 3.4 · Cross-cutting priorities

Three priorities cut across all three pillars:

- **AI enablement** — the $400M investment announced in Q4 2025, with AI applications spanning merchandising (assortment optimization, trend detection), supply chain (demand forecasting, supplier risk), stores (workforce scheduling, inventory accuracy), and customer (personalization, service). Leadership is under intense scrutiny to demonstrate measurable returns from this investment.

- **Margin defense** — a cost discipline program under CFO Daniel Kovač targeting $800M in annualized cost reduction by end of FY2027, with initiatives across procurement, store operations, and corporate functions.

- **Workforce modernization** — led by CHRO Jamila Hassan-Reyes, spanning store workforce scheduling and retention, corporate return-to-office adjustments, and leadership development programs. The initiative has faced friction internally due to its touchpoints with unionization activity in select distribution centers.

### 3.5 · Board-level commitments

From the March 2026 analyst day, Apex publicly committed to the following 2027 targets:

- 27% owned brand penetration (net of rationalization)
- 25% e-commerce penetration
- 5.8% operating margin
- $800M in cumulative cost reduction vs FY2024 baseline
- Completed rollout of integrated planning platform
- Three new store formats scaled beyond pilot to at least 12 stores each

Analyst consensus views the operating margin commitment as the most aggressive and most at-risk of the four financial commitments. The AI strategy and cost discipline program are the mechanisms by which leadership plans to achieve it.

---

## Part 4 · C-Suite Profiles · VIP Depth

Full VIP profiles for each executive. These are the profiles Nexus, Sentinel, Atlas, and Steward consume when reasoning about the Apex organization.

### 4.1 · Vincent Okafor · CEO

**Background.** Joined Apex in July 2021 as Chief Financial Officer after twelve years at a Fortune 100 consumer packaged goods company, where he rose from director of finance to Executive Vice President and Chief Financial Officer. Prior CPG roles included finance leadership positions across multiple operating segments. Undergraduate in accounting from Northwestern University; MBA from the University of Chicago Booth School of Business. Nigerian-American, 56 years old, divorced with two adult children.

**Appointed CEO** October 2023 succeeding Gerald Maresh, after an internally-run but formally-contested succession process. Okafor's selection was viewed as a shift toward financial rigor after the merchandise-first tenure of his predecessor.

**Strategic priorities.** Okafor has been unusually consistent in public messaging around the three pillars (Decide Faster, Own More, Be Chosen) since they were announced in Q4 2024. His internal language emphasizes "pace" — specifically the belief that Apex has not been operating at the decision velocity a company of its complexity requires. He references "decision latency" and "organizational metabolism" in internal and external communications.

**Communication style.** Prepared and deliberate. Reads extensively (well-known internally for requesting 20-30 page pre-read documents for significant decisions). Uncomfortable with ambiguity; tends to push for specific numbers and defined decision criteria. Less comfortable in unscripted settings than in prepared ones. Known to conduct full-day strategic sessions with his direct reports roughly quarterly, during which he challenges assumptions rigorously.

**Decision pattern.** Will hold decisions longer than most CEOs to gather more input, but once decided, commits fully and expects execution without re-litigation. Does not tolerate decisions being re-opened by parties who were present when the decision was made. Known internally as "Father Okafor" partly ironically and partly for real — the deliberate paternal posture is authentic.

**Known pain points.** Openly frustrated with:
- Cross-functional decision friction between merchandising, planning, and supply chain (the core issue anchoring the AI decisioning program)
- The margin compression trajectory and his belief that Apex's cost structure has not kept pace with the competitive environment
- Investor skepticism about the AI investment's measurability
- Activist pressure on owned brand monetization, which he views as premature

**Public statements worth referencing:**

*From March 2026 analyst day:*
> "We're building a company that can decide faster than our environment changes. Today we cannot. That gap is the center of every strategic priority we've committed to."

*From Q3 2025 earnings call:*
> "I am not going to stand here and promise you the AI investment pays out in six quarters. What I will promise is that we are measuring it in a way that lets us stop investing if it's not working. Most companies cannot say that honestly."

*From a January 2026 Harvard Business Review interview:*
> "The hardest thing about being CEO of a company this size is that the things you can see clearly are usually the things that do not matter, and the things that actually matter are so distant from the CEO desk that you only see them when they have already broken."

**VIP-enriched reasoning notes for agents.** When a Program touches Okafor directly, agents should:
- Prepare thoroughly; surface-level recommendations will not land
- Present tradeoffs explicitly rather than single recommendations
- Reference the three-pillar framework when positioning work
- Acknowledge margin pressure context
- Avoid framing that implies AI will solve problems on its own

### 4.2 · Rebecca Tanaka · COO

**Background.** Joined Apex in 1997 straight out of undergraduate studies (Stanford, economics) as a store manager trainee. Rose through operations roles over 27 years — store manager, district manager, regional vice president, SVP Store Operations, Chief Stores Officer (from 2018 to 2024), and Chief Operating Officer since January 2024. The longest-tenured member of the executive committee. Japanese-American, 48 years old, married to a college professor, two teenage children.

**Strategic priorities.** Tanaka owns the "Decide Faster" pillar directly. Her 2026 mandate includes decision rights clarification, planning cadence modernization, and the overall operating rhythm redesign. She is operationally obsessed and deeply respected by the store fleet and corporate operations teams; less well-known in merchandising and digital circles.

**Communication style.** Direct, unpolished, prefers face-to-face or walking conversations to structured meetings. Known for "store walks" where she visits 3-4 stores per week unannounced and reports back findings to the executive team. Uses concrete operational examples rather than abstractions. Famously said in an internal all-hands: "Strategy is what happens in a store between 2pm and 4pm on a Thursday when a regional VP is not watching."

**Decision pattern.** Fast, operationally-minded, sometimes criticized for moving before organizational alignment is established. Works well with Okafor because he compensates for her speed with deliberation and she compensates for his deliberation with execution.

**Known pain points.**
- The fragmentation of planning across merchandising, supply chain, and stores, which she views as the single biggest operational drag on the company
- The slow pace of the integrated planning platform selection, which she believes should have moved faster
- Turnover in middle management across store operations, which she tracks weekly
- Underinvestment in store technology relative to e-commerce technology

**Public statements worth referencing:**

*From a November 2025 retail industry conference:*
> "The companies that are winning this cycle are not the ones with the best algorithms. They are the ones where a planner, a buyer, and a store manager can make a decision together by Wednesday that would have taken three weeks last year."

**VIP-enriched reasoning notes for agents.** Tanaka is the operational sponsor most likely to champion decisioning-layer Programs and most likely to push for speed over perfect scoping. Agents should match her pace but protect against premature commitment.

### 4.3 · Daniel Kovač · CFO

**Background.** Joined Apex in May 2025 from a Fortune 200 consumer packaged goods company where he had been CFO for six years. Prior CFO experience at a global spirits company and a mid-cap food company. Undergraduate in economics from Wharton; CFA. Croatian-Canadian, 52 years old, married with three children. Commutes between Chicago and Toronto.

**Strategic priorities.** Kovač owns the margin defense program and the capital allocation framework. His stated priorities are working capital discipline, SG&A productivity, and disciplined CapEx with measurable returns. He has been visibly skeptical of initiatives that cannot produce a defensible NPV case, which has created tension with some of the more experimental digital and marketing programs.

**Communication style.** Precise, numerical, demands specificity. Has a reputation for asking the third-order question that exposes sloppy analysis. Does not enjoy ambiguity; responds well to structured decision memos with explicit trade-offs. Speaks English with a slight Croatian accent that becomes more pronounced under pressure. Reads financial statements the way other people read novels.

**Decision pattern.** Slow to commit, fast to kill. Will defer a decision across three or four cycles if the underlying analysis is insufficient; will kill a program decisively once it fails its own milestones. Respected and somewhat feared.

**Known pain points.**
- Working capital trapped in inventory across apparel and home, which he has targeted publicly as a $400M-$600M opportunity
- The measurability of the AI investment, which he is publicly supportive of but privately skeptical about
- The pace of store fleet rationalization in underperforming markets
- The complexity of owned brand P&L attribution, which obscures which brands are actually profitable

**Public statements worth referencing:**

*From Q4 2025 earnings call:*
> "We have identified approximately $400M to $600M in working capital opportunity across our inventory base. That is not a target; that is an observation of the current state. The target comes after we understand the trade-offs with service levels, which we are currently scoping."

*From March 2026 analyst day:*
> "Every dollar of CapEx in this plan has a measurable return expectation, a decision gate at which we can choose to stop spending, and a named executive accountable for delivery. That is not true of most capital plans I have ever seen."

**VIP-enriched reasoning notes for agents.** Kovač is the executive most likely to challenge soft claims. When a Program touches his scope (working capital, cost discipline, CapEx), agents should present rigorous NPV or unit economics and name decision gates explicitly.

### 4.4 · Maria Delgado · Chief Supply Chain Officer

**Background.** Joined Apex in 2013 as VP Supply Chain Strategy after a decade at a global logistics company in network design and operations roles. Promoted to SVP Supply Chain Planning in 2017, to EVP Supply Chain in 2020, and to Chief Supply Chain Officer in March 2022. Engineering undergraduate from MIT; MBA from Kellogg. Mexican-American, 47 years old, single, based in Chicago.

**Strategic priorities.** Delgado owns the supply chain side of the AI decisioning initiative currently in Phase 0 with AbarVa. Her stated priorities are demand responsiveness, supplier resilience, and inventory productivity. She is widely viewed as one of the sharpest operational minds on the executive committee and a likely successor candidate if Tanaka were to leave or retire.

**Communication style.** Analytical, comfortable with complexity, happy to let silence sit in a conversation. Listens more than she speaks in group settings; in one-on-one settings she is more direct. Uses systems thinking framings (feedback loops, unintended consequences, second-order effects) natively. Has a dry sense of humor that catches people off guard.

**Decision pattern.** Considered and collaborative. Will frequently loop in planning, merchandising, and stores before committing to supply chain decisions that touch them, sometimes to the frustration of faster-moving peers. Her view: decisions that land without cross-functional buy-in are cheaper in the decision moment but more expensive in the execution moment.

**Known pain points.**
- The January 2026 supply disruption exposed vendor concentration risk that she had flagged internally for 18 months before the event
- Cross-functional alignment challenges with merchandising (Alkaev) and planning, which is housed separately within Merchandising
- Working capital pressure from Kovač that collides with service level imperatives
- The pace of planning platform modernization, which she views as operationally critical but constrained by capital budget sequencing

**Public statements worth referencing:**

*From a December 2025 internal executive offsite (per reconstructed notes):*
> "We are not going to fix planning by putting better models on top of the same operating model. Every single failed planning transformation I have been near in my career made this mistake. The AI layer has to change how decisions get made, not just what inputs they get."

*From a September 2025 industry keynote:*
> "The boring answer is usually the right one in supply chain. Segmentation, discipline, and resilience. The interesting answer usually sells conferences, generates pilots, and disappoints in quarter three."

**VIP-enriched reasoning notes for agents.** Delgado is the current sponsor of the AI decisioning Phase 0 engagement. Her sophistication means AbarVa agents should match her analytical depth; her collaborative posture means agents should surface cross-functional implications explicitly; her pattern of preferring boring-and-right over interesting-and-risky means agents should lead with rigor rather than novelty.

### 4.5 · Priya Sethi · CIO

**Background.** Joined Apex in September 2023 as Chief Information Officer, replacing predecessor Elliot Bannister who retired after 11 years. Prior experience: Chief Technology Officer of a global hospitality company; VP of Engineering at a cloud infrastructure company; engineering leadership roles at a consumer internet company. Undergraduate in computer science from IIT Bombay; MS from Carnegie Mellon. Indian-American, 44 years old, married to a surgeon, two elementary-school-aged children.

**Strategic priorities.** Sethi owns the AI strategy presented at the March 2026 analyst day, the integrated planning platform selection, and the broader technology modernization agenda. Her 2026 deliverables include the AI platform architecture, decisions on build-versus-buy for key capabilities, and a technology debt reduction program alongside the AI investment.

**Communication style.** Clear, structured, comfortable with both technology and business audiences. Has done significant work on her executive presence since stepping into the CIO role (she described this openly in a podcast interview, which was received positively). Uses business language with technology leaders and technology language with business leaders, deliberately bridging.

**Decision pattern.** Moves at a measured but steady pace. Will make a decision and reverse it publicly if new information changes the picture — which is unusual in the CIO community and has built credibility internally. Works closely with Kovač on technology capital decisions.

**Known pain points.**
- Technology debt accumulated over many years, much of it invisible until the AI investment started exposing integration challenges
- Talent competition for AI-capable engineers
- Pressure to deliver AI outcomes on a timeline that the underlying data infrastructure may not support
- The political complexity of the integrated planning platform decision, which touches merchandising, planning, supply chain, and finance stakeholders simultaneously

**Public statements worth referencing:**

*From March 2026 analyst day:*
> "Our AI strategy is three things. First, it is a data strategy. If our data is not trustworthy, nothing downstream matters. Second, it is a workflow strategy. If the AI output does not show up where decisions get made, it is theater. Third, it is a people strategy. If our merchants and planners do not trust the output, they will not use it. The models are the easy part."

*From a February 2026 CIO Roundtable interview:*
> "I have become allergic to the phrase 'AI transformation.' We are not transforming with AI. We are using AI where it meaningfully improves specific decisions. Everything else is slideware."

**VIP-enriched reasoning notes for agents.** Sethi is a likely internal champion for AbarVa because the platform's positioning (decision-layer AI, evidence-chained, agent-augmented-not-agent-only) aligns with her stated philosophy. She is a sophisticated technology buyer; agents should not oversimplify. When a Program touches technology decisions, agents should reference her stated three-part framework (data, workflow, people).

### 4.6 · Jordan Alkaev · Chief Merchandising Officer

**Background.** Joined Apex as Chief Merchandising Officer in April 2024, recruited from a specialty retail company where they had been President of the Women's division and prior to that Chief Merchant. Earlier career: buyer and planner roles at multiple specialty and department store retailers over two decades. Undergraduate in fashion merchandising from FIT; no graduate degree. Non-binary (pronouns they/them), 51 years old, married, based in New York with extensive travel to Chicago.

**Strategic priorities.** Alkaev owns merchandising strategy across all eight categories and directly leads the owned brand growth agenda. Their 2026 priorities include the brand portfolio rationalization, the three new brand launches, and cross-category assortment rationalization intended to reduce SKU count by 8% without margin impact.

**Communication style.** Energetic, instinct-led, uncomfortable in numbers-heavy conversations. Works through storytelling and merchandising craft references. Creates strong loyalty among merchandising organization; less strong relationships with finance, operations, and technology. Known to "walk the floor" — meaning walk through stores thinking like a customer — weekly.

**Decision pattern.** Fast and instinct-driven in merchandising contexts; slower and more reluctant in operational and technology contexts. Has acknowledged openly that merchandising is a craft that blends art and science; their natural strength is the art.

**Known pain points.**
- Friction with supply chain (Delgado) over the fundamental trade-off between assortment breadth (merchandising) and inventory efficiency (supply chain)
- Pressure from Kovač for sharper merchandise profitability analytics
- The transition from instinct-led buying to data-augmented buying within the merchandising organization, which is a cultural as much as technological challenge
- Talent development in merchandising, particularly the pipeline of senior buyers

**Public statements worth referencing:**

*From an industry podcast, October 2025:*
> "I have never met a piece of software that can tell me whether a dress is going to be great in April. I have met a lot of software that can tell me whether the last dress worked in April. The first is merchandising. The second is reporting."

**VIP-enriched reasoning notes for agents.** Alkaev is the executive most likely to push back on AI-driven merchandise recommendations. Agents should respect merchandising craft explicitly, avoid framing AI as replacing merchandising judgment, and position AI applications as augmenting rather than replacing buyer intuition.

### 4.7 · Evan Soriano · Chief Digital Officer

**Background.** Joined Apex in June 2023 from a digitally-native apparel retailer where he had been Chief Product Officer. Prior experience: product leadership at a subscription commerce company; founding team of a venture-backed marketplace. Undergraduate in computer science from UC Berkeley. Latino-American, 41 years old, married with one young child, based in Chicago.

**Strategic priorities.** Soriano owns e-commerce, mobile app, digital customer experience, and the personalization platform. His 2026 deliverables include the personalization platform rollout, continued growth in digital penetration, and expansion of digital services (subscriptions, memberships, experiences).

**Communication style.** Product-manager archetype. Fast, agile, metrics-driven. Speaks in customer journeys and user experiences. Collaborates well with Karel Jensen (Marketing) and Priya Sethi (Technology); collaborates with friction with Jordan Alkaev (Merchandising) due to tension between digital's personalization agenda and merchandising's brand-curation agenda.

**Decision pattern.** Experimentalist. Believes in small bets learned fast. Uncomfortable with large bet-the-franchise decisions that cannot be tested iteratively.

**Known pain points.**
- Digital-physical integration, which remains imperfect in the checkout experience, loyalty attribution, and inventory visibility
- Cross-functional coordination between digital (his team), marketing (Jensen), and merchandising (Alkaev)
- The next-generation personalization platform timeline, which has slipped twice
- Capital competition with physical store investments

**VIP-enriched reasoning notes for agents.** Soriano champions iterative AI applications. When Programs touch digital, agents should propose experimental framings with clear success metrics and fast feedback loops.

### 4.8 · Jamila Hassan-Reyes · CHRO

**Background.** Joined Apex in August 2022 after five years as CHRO of a major hospitality company. Prior experience: HR leadership in financial services and consulting. Undergraduate in psychology from Howard University; MBA from the University of Virginia. Black American of Sudanese-Puerto Rican descent, 53 years old, married with adult children.

**Strategic priorities.** Hassan-Reyes owns workforce strategy, leadership development, DEI, and labor relations. Her 2026 priorities include the workforce modernization initiative (covering store scheduling, retention, and corporate return-to-office), leadership development pipeline building, and navigating increasingly active labor dynamics in distribution centers.

**Communication style.** Warm, intellectually rigorous, patient. Will challenge colleagues publicly on DEI and workforce topics where she feels conviction. Respected across the executive committee but has structural tension with some operations leaders who view HR initiatives as operational drag.

**Known pain points.**
- Active union organizing in three distribution centers (public knowledge)
- The tension between operational efficiency imperatives and workforce-centered policies
- Leadership pipeline depth below the C-suite in several functions

**VIP-enriched reasoning notes for agents.** Programs touching workforce implications should surface them explicitly and respect the complexity. Hassan-Reyes will push back hard on Programs that treat workforce as a cost lever rather than a capability investment.

### 4.9 · Karel Jensen · Chief Marketing and Customer Officer

**Background.** Joined Apex in February 2024 from a global CPG company. Prior experience: CMO of a beverage brand; marketing leadership at a luxury brand; earlier career in advertising agencies. Undergraduate from Uppsala University (Sweden); MBA from IESE (Spain). Swedish-Spanish dual citizen, 49 years old, divorced, two teenage children.

**Strategic priorities.** Jensen owns brand marketing, customer segmentation, loyalty program strategy, and customer analytics. Her 2026 priorities include the Apex Plus loyalty evolution, the owned brand marketing platform, and customer lifetime value optimization.

**Communication style.** Polished, strategic, comfortable in both creative and analytical registers. Multilingual (Swedish, Spanish, English, some French and German) and uses language facility as a relationship-building tool.

**Known pain points.**
- Loyalty program economics under scrutiny from Kovač
- Customer data infrastructure fragmentation limiting segmentation sophistication
- Brand differentiation pressure as competitors invest in loyalty

**VIP-enriched reasoning notes for agents.** Jensen is a strategic thinker. Programs touching customer dimensions should be positioned with commercial rigor and customer insight.

### 4.10 · Nadia Okonkwo · Chief Growth and Strategy Officer

**Background.** Joined Apex in November 2024 specifically to lead growth initiatives including international expansion, format innovation, and strategic M&A. Prior experience: VP Strategy at a Fortune 100 retailer; McKinsey partner before that (general retail and consumer practice). Undergraduate from Yale; MBA from Harvard. Nigerian-British, 46 years old, married, based in Chicago.

**Strategic priorities.** Okonkwo owns the Mexico pilot, new store format innovation, and strategic options exploration (including any potential M&A). Her 2026 priorities include evaluating the Mexico pilot for expansion or exit, scaling the three new store format pilots, and exploring select strategic partnerships.

**Communication style.** Former consultant polish combined with operator sharpness. Thinks in options and decision frameworks rather than commitments. Comfortable at the Board level.

**Known pain points.**
- Capital competition for new initiatives against core business investments
- The Mexico pilot evaluation question, which is genuinely open
- Organizational capacity to absorb new initiatives alongside the existing strategic plan

**VIP-enriched reasoning notes for agents.** Okonkwo is likely an ally for new strategic Programs given her background. She will also bring rigorous scrutiny.

### 4.11 · Raymond Teller · Chief Stores Officer

**Background.** Joined Apex in 2012 as a district manager in the West Region. Promoted through regional operations roles over 12 years to Chief Stores Officer in January 2024, succeeding Rebecca Tanaka. Undergraduate in business from Arizona State. Latino-American, 44 years old, married with three children, based in Phoenix with weekly Chicago travel.

**Strategic priorities.** Teller owns 1,976 stores, approximately 387,000 hourly team members, and store-level P&L. His 2026 priorities include the same-day fulfillment expansion (coordinating with supply chain and digital), store format innovation coordination with Okonkwo, and store workforce initiatives coordinating with Hassan-Reyes.

**Communication style.** Store operations archetype. Direct, concrete, impatient with abstractions. Builds deep loyalty within his organization. Sometimes perceived as resistant to change by digital and technology peers.

**Known pain points.**
- Store-level execution consistency across 1,976 stores
- Workforce turnover in hourly roles
- The cumulative operational complexity of multiple simultaneous strategic initiatives landing in stores

### 4.12 · Sofia Mendelsohn · Chief Sustainability and Corporate Affairs Officer

**Background.** Joined Apex in March 2023 as a newly-created role combining sustainability (previously reporting into supply chain) and corporate affairs (previously reporting into legal). Prior experience: Chief Sustainability Officer of a major food company; corporate affairs roles in pharmaceuticals; earlier career in government and non-profits. Undergraduate from Wesleyan; JD from NYU. Jewish-American, 48 years old, married, based in Chicago.

**Strategic priorities.** Mendelsohn owns sustainability commitments, corporate communications, government relations, and increasingly the corporate response to activist pressure. Her 2026 priorities include measurable progress on stated sustainability commitments (climate, packaging, supplier standards), communication strategy around the AI investment, and stakeholder management around store fleet decisions.

**Communication style.** Careful, lawyerly, thoughtful. Sees reputational and political dimensions that operational peers miss. Influential beyond her formal scope due to Okafor's trust in her judgment.

### 4.13 · Harper Nakamura · General Counsel and Chief Risk Officer

**Background.** Joined Apex in July 2021. Prior experience: Deputy General Counsel at a major technology company; law firm partner specializing in commercial litigation. Undergraduate from Williams; JD from Stanford Law. Japanese-American, 54 years old, divorced, based in Chicago.

**Strategic priorities.** Nakamura owns legal, compliance, risk management, cybersecurity policy, and increasingly AI governance in partnership with Sethi and the Board's Technology and Risk Committee. Her 2026 priorities include AI governance framework development, data privacy compliance evolution, and activist investor legal strategy.

**VIP-enriched reasoning notes for agents.** Nakamura is a gatekeeper on AI Programs. Programs must surface data handling, model governance, and audit implications early and thoroughly.

### 4.14 · Christopher Vale · Chief Owned Brands Officer

**Background.** Joined Apex in October 2024 in a newly-created executive role to consolidate ownership of the owned brand portfolio. Prior experience: Chief Merchandising Officer of a specialty retail company; head of brand development at a large CPG; brand manager at a luxury goods company. Undergraduate from Amherst; MBA from Stanford. Bi-racial American (Black and Japanese), 45 years old, single, based in Chicago.

**Strategic priorities.** Vale owns the owned brand portfolio, the owned brand marketing platform (shared with Jensen), the owned brand wholesale pilot, and brand portfolio capital allocation. The wholesale pilot is his most controversial initiative.

**Communication style.** Brand-builder archetype. Storytelling, emotional connection, long-term view. Less comfortable with quarterly financial rigor than with multi-year brand development timelines.

**Known pain points.**
- The brand portfolio rationalization, which requires him to shut down brands with internal advocates
- The wholesale pilot, which has internal opposition
- P&L attribution clarity, which Kovač has flagged as a priority

---

## Part 5 · Extended Leadership · SVPs by Function

Below the C-suite, the 78 SVP-level executives organized by function. Full named rosters below are representative; deeper data should be authored in the tenant over time.

### 5.1 · Merchandising SVPs (9 primary)

- **Amelia Rivers** — SVP Apparel and Accessories (reports to Alkaev)
- **David Quintero** — SVP Home and Decor
- **Fernanda López-Sheen** — SVP Food and Beverage
- **Michael Zhang** — SVP Essentials and Personal Care
- **Katherine Dubrovsky** — SVP Electronics and Entertainment
- **Brandon McCall** — SVP Toys and Sporting Goods
- **Priya Rao** — SVP Beauty
- **Thomas Weiland** — SVP Seasonal and Occasion
- **Elena Moravec** — SVP Merchandising Planning (horizontal across categories)

### 5.2 · Supply Chain SVPs (5 primary)

- **Jake Chen** — SVP Network Operations and Fulfillment (reports to Delgado). Note: referenced in existing Nexus conversation patterns as "Head of Contact Operations" — this title is being rationalized. Jake's actual role is Network Operations and Fulfillment; Contact Operations is a subset role under him.
- **Sebastian Reilly** — SVP Demand Planning and Forecasting
- **Chiamaka Adebayo** — SVP Supplier Strategy and Procurement
- **Reyansh Patel** — SVP Logistics and Transportation
- **Diane Molitor** — SVP Supply Chain Technology (dotted line to CIO)

### 5.3 · Stores SVPs (7 primary)

- **Thomas Calderón** — Regional President East (already in Part 1)
- **Amelia Park** — Regional President Central (already in Part 1)
- **Marcus Washington** — Regional President South (already in Part 1)
- **Lin Zhou** — Regional President West (already in Part 1)
- **Maria Torres** — SVP Store Operations (horizontal)
- **Gregory Brennan** — SVP Store Labor and Scheduling
- **Natalie Ohlund** — SVP Store Experience and Design

### 5.4 · Digital and Technology SVPs (8 primary)

- **Arjun Mehta** — SVP Engineering (reports to Sethi)
- **Laura Feldkamp** — SVP Data and Analytics (reports to Sethi)
- **Derek Hayworth** — SVP AI and Machine Learning (reports to Sethi, newly created role)
- **Mira Dabrowski** — SVP Security and Infrastructure (reports to Sethi)
- **Raja Sundaresan** — SVP Product Management (reports to Soriano)
- **Chloé Beauchamp** — SVP E-commerce Operations (reports to Soriano)
- **Tariq Anand** — SVP Mobile and App (reports to Soriano)
- **Samantha Dhar** — SVP Customer Data Platform (reports jointly to Soriano and Jensen)

### 5.5 · Finance SVPs (5 primary)

- **Patricia Hennig** — SVP Finance and Treasurer (had been interim CFO before Kovač; retained in current role)
- **William Oduya** — SVP FP&A
- **Ryan McIlroy** — SVP Investor Relations
- **Elena Krishevsky** — SVP Internal Audit
- **Joon-Ho Lee** — SVP Corporate Development

### 5.6 · HR, Marketing, and other leadership SVPs

Additional SVPs span marketing, HR business partner leads, legal, government affairs, sustainability, and corporate communications. These are populated in the seed data for completeness but are less central to the demo narrative unless specific Programs touch their scope.

---

## Part 6 · Active Initiatives and Transformation Landscape

Apex has 23 named major initiatives in-flight across the executive committee. The most Program-relevant and Intelligence-relevant are detailed below.

### 6.1 · AI Decisioning Layer (Phase 0 engagement with AbarVa · anchor)

Sponsor: Maria Delgado (Chief Supply Chain Officer)
Co-sponsors: Priya Sethi (CIO), Jordan Alkaev (CMO)
Scope: AI layer that reconciles tradeoffs across merchandising, planning, and supply chain decisions under existing misaligned KPIs
Current phase: Phase 0 charter approved (April 21, 2026) per the live test-drive conversation
Target: 10-12% inventory reduction in pilot scope with service levels maintained

This is the engagement that anchors the demo. The Phase 0 transcript from the April 21 test-drive is the foundational artifact; Phase 1 diagnostic work should build on that conversation.

### 6.2 · Integrated Planning Platform Selection and Implementation

Sponsor: Rebecca Tanaka (COO)
Partner sponsors: Priya Sethi (CIO), Maria Delgado (CSCO), Jordan Alkaev (CMO)
Scope: Selection and implementation of next-generation integrated planning platform to replace current patchwork
Current phase: Vendor evaluation, with shortlist of three vendors expected to be finalized Q2 2026
Target: phased implementation through 2027 with first-wave go-live in Q3 2027

### 6.3 · Owned Brand Portfolio Rationalization

Sponsor: Christopher Vale (Chief Owned Brands Officer)
Partner sponsors: Jordan Alkaev (CMO), Daniel Kovač (CFO)
Scope: Elimination of 8 underperforming owned brands, reinvestment in 5 flagship brands
Current phase: Decision memos drafted for 6 of 8 sunset candidates; Board presentation planned Q2 2026

### 6.4 · Margin Defense Program

Sponsor: Daniel Kovač (CFO)
Scope: $800M cumulative cost reduction by end FY2027
Current phase: Workstream leads appointed; initial 18-month work plan approved March 2026

### 6.5 · Same-Day Fulfillment Expansion

Sponsor: Raymond Teller (Chief Stores Officer) and Evan Soriano (CDO)
Scope: Extend same-day coverage from 92% to 97% of online orders
Current phase: Network design in progress; capability expansion pilots in 3 markets

### 6.6 · Apex Plus Loyalty Evolution

Sponsor: Karel Jensen (CMCO)
Scope: Restructure premium loyalty tier from transactional rewards to experiential benefits
Current phase: Customer research complete; concept design with early member testing

### 6.7 · Store Format Innovation (three concurrent pilots)

Sponsor: Nadia Okonkwo (CGSO)
Partner sponsor: Raymond Teller (CSO)
Scope: Urban neighborhood format, beauty-focused format, grocery-forward community format
Current phase: 3-5 pilot stores per format open or in fit-out

### 6.8 · Mexico Expansion Evaluation

Sponsor: Nadia Okonkwo (CGSO)
Scope: Evaluate 14 pilot stores and recommend expansion, hold, or exit
Current phase: 9-month performance data accumulation; evaluation recommendation to Board Q4 2026

### 6.9 · Workforce Modernization

Sponsor: Jamila Hassan-Reyes (CHRO)
Scope: Store scheduling, retention, corporate work model, leadership development
Current phase: Multiple concurrent workstreams at different maturities

### 6.10 · Sustainability Commitment Progression

Sponsor: Sofia Mendelsohn (CSCAO)
Scope: Climate commitments, packaging commitments, supplier standards
Current phase: On track for 2026 milestones; 2027 milestones require accelerated progress

### 6.11 · AI Governance Framework

Sponsor: Harper Nakamura (GC and CRO) with Priya Sethi
Scope: Policy, oversight, review mechanisms for AI Programs
Current phase: First draft complete; Board Technology and Risk Committee review planned Q2 2026

---

## Part 7 · Active Patterns Observable in Apex Data

These are the patterns Nexus and Sentinel should surface when engaging with the Apex tenant. Each is seeded as a first-class pattern in the pattern library and linked to supporting evidence in the data room.

### 7.1 · Pattern: Shadow AI Spend (the narrative anchor)

**Summary.** Apex has accumulated approximately $2.3M in annualized spending across 14 fragmented AI and AI-adjacent tools authorized by individual teams without central oversight, despite the existence of the central $400M AI investment program.

**Evidence components:**
- Procurement records showing 14 distinct vendor engagements under the $100K threshold that does not require CIO-level review
- Specific vendors including: Jasper, Abridge for Sales, Grammarly Business, Otter.ai, Fireflies, Writer, Copy.ai, Lavender, Reply.io, Drift Conversational AI, Intercom AI, Zoom AI Companion, Microsoft Copilot seats beyond initially-authorized allocation, Salesforce Einstein add-ons beyond original contract
- Team members using these tools span 23 identified functional teams across Merchandising, Digital, Marketing, HR, and Store Operations
- Contractual review status: 11 of 14 have auto-renewal clauses; 5 of 14 have data sharing terms that were not reviewed by Legal
- Financial impact: approximately $2.3M in annual spend visible in procurement data; indirect productivity impact unquantified

**Reasoning chain:**
- Procurement data aggregated across tool purchases below central review threshold
- Vendor categorization applied to identify AI-adjacent tools
- Team usage inferred from single-sign-on logs and expense reports
- Contract review status pulled from legal database gaps
- Contradiction detection: CDO memo from September 2025 claiming "AI adoption is centrally governed" reconciled against evidence of decentralized procurement

**Program implications.**
- Central AI investment is being undermined by decentralized spend
- Governance gap between AI strategy announcement (October 2025) and operational control
- Data sharing and security risk from unreviewed contracts
- Opportunity cost of fragmented tools vs centralized platform

**Recommended Nexus action.**
Program: AI governance and consolidation, scoped to rationalize the 14 tools, renegotiate contracts where valuable, sunset where not, and establish a lightweight central review process for below-threshold purchases that preserves team velocity while eliminating governance gaps.

**Severity.** High. Financial impact clear; governance implications serious; activist investor has publicly cited AI governance as a concern.

### 7.2 · Pattern: Decision Latency Across Merchandising-Planning-Supply

**Summary.** Decisions requiring cross-functional alignment between merchandising, planning, and supply chain take on average 17 business days from problem identification to decision execution, with specific bottleneck stages at the merchandising-to-planning handoff (6.2 days median) and the planning-to-supply execution (4.8 days median).

**Evidence components:**
- Meeting cadence data showing average 2.3 meetings required for cross-functional alignment
- Decision log data from the Integrated Planning initiative tracking time-to-decision across 47 decision categories
- Calendar analysis showing executive attention fragmentation across cross-functional initiatives
- Stakeholder interview synthesis from the Planning Modernization diagnostic

**Program implications.** Directly ties to the Decide Faster pillar. Supports the AI Decisioning Layer engagement.

### 7.3 · Pattern: Working Capital in Slow-Moving Inventory

**Summary.** Approximately $480M-$610M in working capital is tied up in inventory with turn velocity below category benchmarks, concentrated in the Apparel (approximately $210M) and Home (approximately $180M) categories.

**Evidence components:**
- Inventory turn analysis by category and sub-category against internal benchmarks
- Age of inventory (days-on-hand distribution)
- Comparison to peer benchmarks from industry data (see Part 10)
- Category-level P&L analysis showing margin erosion from markdown activity

**Program implications.** Directly supports Kovač's stated $400M-$600M opportunity. Links to AI Decisioning Layer's inventory efficiency target.

### 7.4 · Pattern: Vendor Concentration Risk in Logistics

**Summary.** 34% of inbound logistics volume flows through a single partner with a 24-month contract expiring in November 2026. The January 2026 supply disruption exposed downstream impact when this partner faced capacity constraints for 19 days.

**Evidence components:**
- Logistics partner volume distribution
- Contract terms and expiration dates
- Incident reconstruction from January 2026 disruption
- Alternative-partner capacity analysis

**Program implications.** Informs supplier resilience strategy. Relevant to both Delgado's supply chain priorities and Kovač's risk management framework.

### 7.5 · Pattern: Owned Brand Margin Outperformance

**Summary.** Owned brands deliver approximately 430 basis points of gross margin lift over national brands in comparable categories, but marketing investment in owned brands is 40% lower per dollar of revenue than for comparable categories.

**Program implications.** Supports the Own More pillar and directly relevant to Vale's brand portfolio strategy. Suggests under-investment in marketing drive for owned brands.

### 7.6 · Pattern: E-commerce Customer Acquisition Cost Rising

**Summary.** Customer acquisition cost through paid digital channels has risen 36% over 18 months while customer lifetime value has grown only 12%, compressing digital unit economics.

**Program implications.** Directly relevant to Jensen's loyalty evolution and Soriano's digital strategy.

### 7.7 · Pattern: Store Format Performance Divergence

**Summary.** Smaller-format neighborhood stores in dense markets are outperforming general merchandise stores in comparable markets on sales per square foot and four-wall margin, suggesting format-mix optimization opportunity.

**Program implications.** Directly supports Okonkwo's store format innovation and Teller's store operations strategy.

---

## Part 8 · Vendor and Technology Landscape

Apex operates a substantial technology stack. Key elements relevant to Programs and agent reasoning:

### 8.1 · Enterprise systems

- **ERP:** SAP S/4HANA (migration from ECC completed 2023)
- **Merchandise planning:** Multi-vendor patchwork (Oracle Retail, JDA/Blue Yonder, internal tools) — the initiative to replace this is the Integrated Planning Platform selection
- **E-commerce platform:** Custom internal platform built on modern microservices
- **Data platform:** Snowflake primary; Databricks for ML workloads
- **Customer data platform:** Building internal; currently patchwork
- **Identity and access:** Okta

### 8.2 · AI and analytics stack

- **Cloud:** Multi-cloud — AWS primary, Azure secondary, GCP for select ML workloads
- **LLM providers:** OpenAI (primary), Anthropic (secondary, growing), Google Vertex (limited)
- **Pipeline:** Airflow for orchestration, dbt for transformation, Great Expectations for data quality
- **ML platform:** Internal Kubeflow-based platform; SageMaker for select production workloads
- **Observability:** Datadog and internal tools

### 8.3 · AI vendor engagements

- **Central authorized:** OpenAI enterprise, Anthropic enterprise, Salesforce Einstein
- **Decentralized/shadow (the $2.3M pattern):** 14 tools listed in Part 7

### 8.4 · Prior failed AI initiatives

These are seeded into the data room for contextual awareness:

- **2021: Demand forecasting ML pilot.** Pilot with a major consulting firm produced models that beat legacy in lab tests but failed production adoption due to integration and trust gaps. Quietly decommissioned in 2022. Still cited internally as a cautionary tale.

- **2022: Customer service chatbot rollout.** Launched on the mobile app; user satisfaction scores dropped; pulled back to specific use cases only by Q3 2023.

- **2024: Merchandise assortment AI tool.** Pilot in Home category; produced recommendations that merchants overrode approximately 80% of the time; project paused for re-design. Current AI strategy is informed by this failure.

---

## Part 9 · Prior AbarVa Program History at Apex

Two prior Programs have been completed with Apex. These are seeded into the tenant so Nexus can reference history:

### 9.1 · Program: Pricing Transformation Diagnostic

**Sponsor:** Karel Jensen (CMCO) with Jordan Alkaev (CMO)
**Phases completed:** Phase 0 through Phase 4
**Duration:** October 2025 - January 2026
**Outcomes:**
- Pricing architecture modernization roadmap approved by Okafor
- $140M in annualized margin opportunity identified across 4 price-architecture levers
- Phase 4 verification found 60% of identified opportunity is execution-ready in 2026; 40% requires platform work aligned with Integrated Planning
- Behavioral shift: pricing committee meeting cadence reduced from biweekly to weekly with sharper decision memos

**Patterns surfaced during this Program:** Margin erosion from markdown discipline gaps, category cross-subsidy opacity, competitive price response latency

### 9.2 · Program: Digital Personalization Strategy

**Sponsor:** Evan Soriano (CDO) with Karel Jensen (CMCO)
**Phases completed:** Phase 0 through Phase 3 (Phase 4 in progress)
**Duration:** November 2025 - May 2026 (in progress)
**Outcomes:**
- Personalization platform vendor selected (between build vs buy decision, buy path selected with internal extension)
- Customer segmentation framework refined from 8 segments to 14
- Measurement methodology for personalization impact agreed by Kovač
- Program currently in Phase 3 execution

**Patterns surfaced during this Program:** Customer data fragmentation across channels, segmentation shallowness limiting targeting, measurement methodology gaps

---

## Part 10 · Benchmarks and Peer Data Layer

Apex's data room includes benchmark and peer data used by agents during reasoning. This is a key differentiator for AbarVa — most AI tools only know what the client tells them, while AbarVa layers in industry intelligence.

### 10.1 · Peer set definition

For Apex, the peer set is defined as the following publicly-traded retailers with comparable scale, channel mix, and category breadth:

**Primary peers (direct competitors):**
- Walmart (too large, but operational benchmark)
- Costco (warehouse model, but category adjacent)
- Kroger (grocery-forward)
- TJX Companies (off-price)
- Best Buy (electronics-focused)
- Macy's (apparel-forward, struggling)
- Kohl's (apparel-forward, struggling)
- Burlington (off-price)
- Dick's Sporting Goods (specialty)
- Dollar General (discount-forward)

**Extended peers (relevant scale):**
- Home Depot (home-adjacent)
- Lowe's (home-adjacent)
- Tractor Supply (specialty)
- Ross Stores (off-price)
- Five Below (discount specialty)
- Nordstrom (premium)

### 10.2 · Benchmark categories

Industry benchmarks the agents reference:

**Financial benchmarks:**
- Gross margin % by category
- Operating margin %
- Inventory turns by category
- Days sales outstanding
- Working capital as % of revenue
- Capital expenditure % of revenue
- E-commerce penetration by peer

**Operational benchmarks:**
- Sales per square foot by format
- Same-store sales growth
- E-commerce conversion rate
- Customer acquisition cost
- Customer retention rate
- Loyalty program penetration

**Workforce benchmarks:**
- Store manager retention
- Hourly worker turnover
- Distribution center productivity
- Corporate headcount ratios

**Technology and AI benchmarks:**
- IT spending as % of revenue (retail average approximately 2.1%; Apex at 2.3%; leaders at 2.8-3.2%)
- AI investment as % of IT spending
- Percentage of decisions AI-augmented

### 10.3 · Public data sources ingested

The Apex tenant is configured to pull or reference data from the following public sources for peer comparison:

- SEC filings (10-K, 10-Q, 8-K) for all peer companies
- Earnings call transcripts (quarterly, all peers)
- Analyst reports from major retail equity research teams (Morgan Stanley, Goldman, BofA, Jefferies, Evercore, UBS)
- Industry association data (NRF, RIS, Retail Dive)
- Government data (BLS employment data, Census retail trade data, import data from tariff filings)
- News and trade publications (Retail Dive, Modern Retail, Chain Store Age, Women's Wear Daily, Glossy)
- Patent filings (USPTO for peer company technology investments)
- Job posting data (indicating investment areas by peers)

Data is refreshed per the freshness policy specified in the data layer architecture.

### 10.4 · Key benchmark values for the demo

For Prat's demo, agents should be able to cite specific benchmark values:

- **Inventory turns · retail peer average:** 6.2 annually; Apex at 5.4; leaders at 7.8
- **E-commerce penetration · retail average:** 19%; Apex at 22%; leaders at 32-38%
- **Operating margin · retail average:** 4.1%; Apex at 5.3%; leaders at 6.8-8.0%
- **Customer acquisition cost trend · industry:** +28% over 18 months; Apex at +36%
- **AI investment · industry average:** 12% of IT spend; Apex at 21%; leaders at 25-30%
- **Loyalty program penetration · industry average:** 53% of revenue through loyalty; Apex at 71%

These benchmarks allow Nexus to make statements like "Your inventory turns are below peer average, and the gap is concentrated in apparel and home — peer leaders turn those categories 2.1x faster than you do" — specific, defensible, data-grounded.

---

## Part 11 · Data Room Inventory · What AbarVa Has Ingested

This is the inventory of datasets ingested into the Apex tenant. It is the foundation of the "Data Ground Truth" surface that Prat will experience during his demo.

### 11.1 · Client-private datasets (ingested from Apex)

**Organizational:**
- Org structure dataset (HRIS-synced + Maestro-augmented) — 4,200 corporate records + 1,200 directorate-and-above store records
- VIP profiles for top 14 executives + 78 SVPs
- Role taxonomy with 340 canonical role codes
- Reporting relationships (derived and cached)
- Change events dataset (last 24 months)

**Financial:**
- Financial statements (5 years quarterly)
- Category P&L detail (last 12 quarters)
- Store-level P&L summary (last 8 quarters)
- Capital allocation by initiative (current year plus prior)
- Budget vs actuals by function
- Margin decomposition by category (pricing, mix, markdown, cost)

**Operational:**
- Inventory position (refreshed weekly)
- Turn velocity by category and sub-category
- Store performance dashboard data
- Supply chain network flow data
- Vendor performance data (top 500 vendors)

**Customer:**
- Customer segmentation cohorts (14 segments)
- Loyalty program member data (aggregated/anonymized)
- Customer lifetime value calculations
- Channel attribution data

**Strategic:**
- Board materials (last 18 months)
- Executive committee meeting minutes
- Strategic plan documents
- Initiative charters for 23 active initiatives

**Technology:**
- Technology architecture documentation
- Application portfolio inventory
- Data catalog
- Integration map

### 11.2 · Client-contributed datasets (from Apex + similar retail clients, aggregated)

- Cross-client inventory turn benchmarks (n=4 retailers, aggregated only)
- Cross-client decision latency benchmarks (n=3 retailers, aggregated only)
- Cross-client AI initiative success/failure patterns (n=6 retailers)

### 11.3 · Platform-public datasets (available to all AbarVa clients)

- Peer set financial benchmarks (quarterly refresh)
- Industry trend analysis (monthly refresh)
- Analyst consensus data (weekly refresh)
- Public executive statements (continuous indexing from earnings, interviews, keynotes)
- Patent filings (monthly refresh)
- News and trade publication coverage (continuous indexing)
- Government retail data (BLS, Census, tariff filings)

### 11.4 · Dataset freshness status

- **Fresh (within 7 days):** 73% of datasets
- **Moderately fresh (8-30 days):** 19%
- **Stale (31-90 days):** 6%
- **Very stale (90+ days):** 2% (flagged for refresh)

### 11.5 · Classification summary

- **Confidential (3%):** Executive compensation, performance reviews, active M&A exploration
- **Restricted (15%):** Non-public financials, specific customer data, vendor contracts
- **Internal (68%):** Most operational and strategic data
- **Public (14%):** Peer benchmarks, industry data, public statements

### 11.6 · Known gaps

Datasets AbarVa has identified as missing or incomplete:

- Store-level workforce detail (partial)
- Vendor contract terms below $1M threshold (incomplete)
- Cross-channel customer journey data (fragmented)
- Granular margin attribution (in progress with Kovač's organization)
- Supplier risk scoring (beta)
- Competitive intelligence (partial; supplemented by public sources)

These gaps are surfaced proactively by agents when relevant to Program reasoning, so users know what AbarVa is inferring versus what it is working from directly.

---

## Part 12 · How This Data Flows to Agents

### 12.1 · Nexus consumption patterns

When a Nexus conversation begins (Programs surface), the orchestrator injects:
- Current user identity and role
- Current client tenant (Apex)
- Current engagement context if applicable
- Org structure for the engaged function
- Strategic priorities relevant to the engagement topic
- Active patterns observable in the data
- Prior Program history
- Benchmarks for the relevant category

Nexus uses this context to:
- Reference named individuals correctly
- Ground recommendations in Apex-specific initiatives
- Call out patterns with citation chains
- Compare Apex to peer benchmarks
- Avoid generic retail statements in favor of Apex-specific framings

### 12.2 · Sentinel consumption patterns

Sentinel (Intelligence surface) uses the same data plus public-tier research layer:
- Apex public statements and positions
- Peer company research (earnings calls, analyst reports)
- Industry trends and regulatory context
- Patent and technology signals

### 12.3 · Atlas consumption patterns

Atlas (Tower surface) uses aggregated cross-client data plus Apex-level rollups:
- Apex in context of peer cohort
- Apex transformation velocity vs cohort
- Apex pattern library vs cohort patterns
- Apex Program outcomes vs cohort outcomes

### 12.4 · Steward consumption patterns

Steward (Platform administration) uses full org data plus governance metadata:
- Full user directory
- Full dataset catalog
- Full access grant state
- Full audit trail

---

## Part 13 · What Prat Should Experience in the Demo

If this data is correctly ingested and agents are configured to consume it, Prat's demo experience should include:

**Scene 2 · Programs opening.** Nexus greets Prat by name, references the retail industry context, mentions the Apex walkthrough explicitly, and notes the Phase 0 Maria Delgado engagement as the current Program being explored.

**The personalized Nexus greeting.** Nexus says something like: "Prat — good to see you. I know you're running [reference to his company's context when we have it]. Today's Apex walkthrough is going to look familiar — a Fortune 30 multi-category retailer, comparable scale, navigating the same AI-in-retail challenges you see daily. Ready to dive in?"

**The Shadow AI reveal.** When Prat sees the $2.3M signal, he sees the specific 14 tools, the teams using them, the contract review gaps. Detail enough that he thinks "yes, that's exactly what happens in our company too."

**The Maria conversation.** Full Phase 0 transcript available, showing the quality of agent reasoning. Prat can see the countertakes, the contradictions, the charter playback.

**The org depth.** When Prat asks "who's the CFO at Apex?", Nexus says "Daniel Kovač, joined May 2025 from CPG, owns the margin defense program targeting $800M in cost reduction..."

**The peer benchmarks.** When Nexus makes a claim, it's grounded — "Apex inventory turns at 5.4 vs peer average 6.2, with leaders at 7.8." Specific, cited.

**The data transparency.** If Prat asks "what do you actually know about Apex?", Nexus surfaces the Data Ground Truth view — 47 datasets, classification breakdown, freshness, known gaps. Honest.

**The prior Program reference.** When relevant, Nexus cites the Pricing Transformation Program from last quarter — "When we did the pricing work with Karel last fall, we found a similar pattern where..."

This is what "A+ demo" looks like. This document specifies the data that enables it.

---

## Part 14 · Ingestion and Operational Notes

### 14.1 · Ingestion sequence

This data should be ingested into the Apex tenant in the following order to enable dependencies:

1. Role taxonomy (reference data)
2. Org units
3. People roster (depends on org units and taxonomy)
4. Reporting relationships (derived)
5. VIP profiles (depends on roster)
6. Strategic priorities
7. Active initiatives
8. Vendor landscape
9. Prior Program history (depends on roster and initiatives)
10. Active patterns
11. Benchmarks
12. Public data sources (continuous)

### 14.2 · Data maintenance

Once seeded, the Apex data set requires maintenance:

- Role taxonomy: stable, annual review
- Org roster: HRIS-sync weekly
- VIP profiles: Maestro-refresh quarterly, event-driven for major public statements
- Strategic priorities: annual refresh with quarterly updates
- Active initiatives: Maestro-refresh monthly
- Vendor landscape: event-driven (when significant changes occur)
- Patterns: continuous (agents detect new patterns as data evolves)
- Benchmarks: quarterly refresh tied to peer earnings
- Public data: continuous

### 14.3 · Consistency guardrails

Every statement in this document must remain internally consistent. If Maria Delgado's role changes, references throughout must update. A single canonical source of truth for Apex is maintained in the database; this document should be treated as the authoritative initial seed and updated over time as the live data evolves.

---

## Part 15 · Summary · What This Unlocks

Before this data: Nexus has excellent craft but generic content. Sentinel researches generically. Atlas aggregates thinly. Steward has no meaningful admin work to do.

After this data: Every agent interacts with Apex as a specific, known, deeply-characterized enterprise. Conversations reference real people, real initiatives, real financial stakes, real peer context. The demo moves from "smart AI" to "AI that knows my world."

For the Prat meeting, this is the difference between A-minus and A-plus.

**Total content weight in this seed:**
- 14 C-suite profiles (detailed)
- 34 additional SVPs (rostered, some profiled)
- 23 active initiatives (detailed)
- 7 active patterns (detailed)
- Prior Program history (2 detailed)
- Financial snapshot (comprehensive)
- Benchmarks across 6 categories
- Data room inventory (complete)
- Vendor and technology landscape
- Public data source configuration

**Companion specs needed:**
- Benchmarks & Industry Data Architecture Spec (next)
- Graph Intelligence Architecture Spec (after)
- Meridian Health System Seed (same template, healthcare scale)
- First Capital Financial Seed (same template, financial services scale)
- Data Ground Truth Surface Spec (CXO-facing data transparency page)

---

**END OF DOCUMENT · APEX RETAIL GROUP COMPREHENSIVE SEED DATA SPECIFICATION**
