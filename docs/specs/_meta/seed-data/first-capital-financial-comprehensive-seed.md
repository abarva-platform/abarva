# First Capital Financial · Comprehensive Seed Data Specification

**A Truist/PNC-class composite diversified financial services company designed to populate the AbarVa platform with Fortune-200-scale financial services depth, spanning consumer banking, commercial banking, wealth management, and capital markets.**

First Capital Financial is a composite. It is sized and structured like a large diversified regional bank with national ambitions, comparable in scale to firms such as Truist Financial, PNC Financial Services, or Fifth Third Bancorp. The financials, named executives, and specific details in this document are composite representations built from real financial services transformation patterns. First Capital must always be described as "a composite organization built from real-world data" — never as a real institution.

This specification completes the financial services vertical in the three-composite demo library, alongside Apex Retail Group (retail) and Meridian Health System (healthcare).

Reads alongside:
- `docs/specs/_meta/seed-data/apex-retail-group-comprehensive-seed.md` — retail companion
- `docs/specs/_meta/seed-data/meridian-health-system-comprehensive-seed.md` — healthcare companion
- `docs/specs/platform/agent-architecture.md` — agent consumption patterns

---

## Part 1 · Company Profile

### 1.1 · Identity and positioning

First Capital Financial (FCF) is a publicly-traded diversified financial services holding company headquartered in Charlotte, North Carolina, trading on the New York Stock Exchange under the ticker FCF. Founded in 1932 as a state-chartered Carolinas bank that survived the Depression through conservative lending, the company grew through organic expansion in the Southeast during the mid-20th century and through a series of meaningful acquisitions between 1995 and 2019. First Capital today operates in 18 states across the Southeast, Mid-Atlantic, and selected Midwest and Southwest markets, with specialty commercial and capital markets capabilities extending nationally.

First Capital positions itself as "the connected financial services company" — referring to the integrated operating model across four business lines that serve customers from consumer checking through middle-market commercial lending, private wealth management, and capital markets. Management emphasizes cross-franchise relationships as a distinguishing feature versus pure-play competitors.

The company has built meaningful competitive positions in three areas:

- **Middle-market commercial banking.** First Capital is a top-10 middle-market commercial lender in the Southeast, with deep industry verticals in healthcare, technology, manufacturing, and commercial real estate.

- **Private wealth management.** The First Capital Wealth division manages approximately $420B in client assets across private bank, trust, and brokerage relationships, with notable strength in multi-generational Southeastern business family clients.

- **Commercial real estate capabilities.** First Capital is consistently ranked among the top commercial real estate lenders nationally, though this has been a meaningful source of scrutiny in recent years given broader market stress.

Principal competitive pressures include: large-bank scale advantages from JPMorgan, Bank of America, and Wells Fargo in technology and capital allocation; fintech pressure on consumer deposits and payments; regulatory evolution including Basel III finalization and CRA modernization; and cycle-late concerns about commercial real estate exposure.

### 1.2 · Scale and financial snapshot

As of the most recent fiscal year (FY2025 ending December 31, 2025):

- **Total assets:** $362B
- **Total deposits:** $284B
- **Total loans:** $238B
- **Wealth client assets under management and administration:** $420B
- **Total revenue:** $18.2B (net interest income $11.1B + non-interest income $7.1B)
- **Net income:** $4.1B
- **Return on tangible common equity (ROTCE):** 14.8%
- **Efficiency ratio:** 56.2% (industry-leading for this scale class)
- **Tier 1 common equity ratio:** 10.8%
- **Market capitalization:** approximately $48B
- **Employees:** approximately 46,000
- **Branches:** 2,810 across 18 states (down from 3,420 in 2019 through consolidation program)
- **ATMs:** approximately 4,800
- **Active retail customers:** approximately 9.4M
- **Commercial clients:** approximately 120,000
- **Wealth clients:** approximately 48,000 households
- **Digital active customers:** approximately 7.1M (75% of retail customer base)

First Capital has committed to a capital allocation framework emphasizing organic growth, disciplined technology investment, shareholder returns through dividends and share buybacks, and selected inorganic opportunities where strategic fit and valuation align.

### 1.3 · Business segment structure

First Capital operates four reportable business segments:

**Consumer Banking and Lending** — approximately $6.8B in revenue
- Retail checking, savings, and money market accounts
- Consumer lending (auto, credit cards, personal loans)
- Residential mortgage origination and servicing
- Small business banking (sub-$10M commercial relationships)
- Digital banking platform

**Commercial Banking** — approximately $5.4B in revenue
- Middle-market commercial lending and treasury
- Commercial real estate (office, multifamily, industrial, specialty)
- Specialty industry practices (healthcare, technology, manufacturing)
- Government banking
- International trade and foreign exchange services

**Wealth Management** — approximately $3.6B in revenue
- Private bank (high-net-worth lending and deposits)
- Trust and estate services
- Brokerage and advisory
- Institutional asset management
- Retirement services

**Capital Markets** — approximately $2.4B in revenue
- Fixed income sales and trading
- Foreign exchange
- Derivatives
- Middle-market investment banking (M&A advisory, capital raises)
- Equity sales and trading (limited)

### 1.4 · Geographic footprint and market position

First Capital's branch footprint is concentrated in the Southeast with extensions into Mid-Atlantic, Midwest, and selected Southwest markets:

- **Core markets (>50% branches):** North Carolina, South Carolina, Virginia, Georgia, Tennessee, Florida
- **Extended markets:** Alabama, Mississippi, Kentucky, Maryland, West Virginia, Indiana, Ohio, Texas, Missouri, Pennsylvania, Arkansas, Louisiana

Market share ranges from #1 position in home state North Carolina to #5-#8 positions in extended markets. Wealth and commercial banking reach extends beyond the branch footprint through specialty teams and relationships.

### 1.5 · Recent corporate trajectory

Significant events over the past 24 months:

- **Q1 2024 · CEO transition.** Robert "Bo" Hargrove III succeeded retiring CEO Catherine MacKenzie, who had led First Capital for 11 years and overseen transformation from regional bank to diversified financial services company. Hargrove was previously Chief Operating Officer and had been the internal heir apparent.

- **Q2 2024 · Strategic plan announcement.** Hargrove announced a three-pillar strategic plan: "Precision" (operational excellence and efficiency), "Proximity" (digital and branch experience integration), and "Partnership" (cross-franchise client relationships). Plan received cautiously positive Street response.

- **Q3 2024 · Commercial real estate repositioning.** First Capital proactively reduced commercial real estate office exposure by approximately $8B through secondary sales and run-off, responding to market stress. The move was contrarian to some peers who held; subsequent market performance validated the decision.

- **Q1 2025 · Wealth business acquisition.** First Capital acquired a $95B asset management and wealth platform from a struggling regional competitor, expanding wealth assets under management substantially and accelerating Pillar Three (Partnership) execution.

- **Q2 2025 · CFO transition.** Elaine Burakovsky-Park joined as CFO from a Big Four accounting background into financial services leadership. She replaced retiring CFO John Templemore.

- **Q3 2025 · Regulatory enforcement action.** First Capital entered a Consent Order with the Federal Reserve related to Bank Secrecy Act / Anti-Money Laundering program deficiencies. No civil monetary penalty at order entry; remediation work ongoing with required quarterly reporting to FRB.

- **Q4 2025 · AI strategy announcement.** Alongside Q3 earnings, Hargrove announced a $600M three-year commitment to AI capabilities spanning risk and fraud, customer experience, operational productivity, and commercial lending analytics. Investment framed explicitly as "disciplined and measurable" in response to Street concerns about AI ROI in banking.

- **January 2026 · Data governance restructuring.** In response to both AI strategy requirements and BSA/AML remediation needs, First Capital elevated its Chief Data Officer role to an executive committee member position and consolidated data governance across business lines.

- **February 2026 · Activist discussion.** A mid-cap activist fund privately engaged with First Capital advocating for accelerated branch rationalization, divestiture of the capital markets business, and more aggressive capital returns. Board and management are in dialogue with the activist; no public announcement yet.

- **March 2026 · Investor day.** First Capital held its biennial investor day in Charlotte, reaffirming the three-pillar strategy, committing to 60% efficiency ratio by 2028, reaffirming 14-15% ROTCE target range, and providing detailed AI strategy update including governance framework.

---

## Part 2 · Executive Leadership

The First Capital operating committee comprises seventeen leaders reporting to CEO Bo Hargrove.

### 2.1 · Executive roster

- **Robert "Bo" Hargrove III** — President and Chief Executive Officer (since January 2024)
- **Camila Restrepo-Wang** — Chief Operating Officer (promoted from Head of Consumer Banking in 2024)
- **Elaine Burakovsky-Park** — Chief Financial Officer (since May 2025)
- **Dr. Vikram Shah** — Chief Risk Officer (since 2020)
- **Douglas Okonjo** — Chief Credit Officer
- **Patricia Hess-McKinley** — Head of Consumer Banking and Lending (since 2024)
- **Thomas Chen-Worthy** — Head of Commercial Banking
- **Sarah Kolluri-Anderson** — President, First Capital Wealth
- **Michael Rosenmeyer** — Head of Capital Markets
- **Angela Okafor-Hill** — Chief Information Officer
- **Ravi Deshmukh** — Chief Data Officer (elevated to exec committee January 2026)
- **Jasmine Taylor-Vance** — Chief Digital Officer
- **Marcus Blythe** — Chief Compliance Officer (strengthened role post-Consent Order)
- **Diana Aguilar-Reyes** — General Counsel
- **Richard Sutherland** — Chief Human Resources Officer
- **Kevin Nakashima** — Chief Marketing Officer
- **Elena Feldstein-Olu** — Chief Sustainability and Corporate Responsibility Officer

### 2.2 · Board of Directors

First Capital's board comprises 13 members including Hargrove. Chair is William "Bill" Mercer, retired CEO of an adjacent financial services company. The board includes three former senior bank executives, three corporate CEOs from non-financial industries, two academics, and four additional independent directors with diverse professional backgrounds. Committees include Audit, Risk, Compensation, Governance and Nominating, Technology and Innovation (established 2023), and a specially-formed Regulatory Oversight Committee established 2025 to oversee BSA/AML remediation.

---

## Part 3 · Strategic Priorities · 2026

First Capital's three-pillar strategic plan (Precision, Proximity, Partnership) guides 2026 priorities.

### 3.1 · Pillar One · Precision (operational excellence)

Target: 60% efficiency ratio by 2028 (from 56.2% currently — lower is better).

Named 2026 priorities:

- **Branch network optimization** — continued rationalization with selective new-format openings, targeting net 80 branch reduction in 2026
- **Operations technology modernization** — core banking platform extension work and payments infrastructure modernization
- **AI-enabled productivity** — applying AI to back-office and customer service operations
- **BSA/AML remediation and infrastructure upgrade** — Consent Order response driving broader financial crimes compliance modernization

### 3.2 · Pillar Two · Proximity (customer experience integration)

Target: Deepen digital-physical integration and customer engagement metrics.

Named 2026 priorities:

- **Integrated digital banking platform** — next-generation mobile and online banking with personalization
- **Branch format evolution** — rolling out three new branch format concepts focused on wealth advisory, small business, and high-touch customer segments
- **Customer experience measurement** — improved closed-loop measurement and response across touchpoints
- **Digital sales growth** — increasing digital channel origination share for consumer products

### 3.3 · Pillar Three · Partnership (cross-franchise relationships)

Target: Increase cross-franchise relationships (customers with relationships in 2+ business segments).

Named 2026 priorities:

- **Wealth integration post-acquisition** — completing integration of Q1 2025 acquisition and driving referral flow from commercial and consumer channels
- **Commercial-wealth referral program** — systematic referral program from commercial banking into wealth, with specific targets
- **Consumer-wealth transition program** — program for consumer banking customers approaching high-net-worth thresholds to transition to wealth services
- **Enterprise relationship analytics** — single customer view across business segments for relationship management and cross-sell

### 3.4 · Cross-cutting priorities

- **AI and data** — the $600M investment executing across all four business segments
- **Regulatory remediation** — BSA/AML Consent Order; CCAR preparation; evolving regulatory environment
- **Capital management** — buybacks, dividends, organic capital formation balance
- **Talent strategy** — succession planning, key hires, culture work post-acquisition integration

### 3.5 · Board-level financial commitments

From the March 2026 investor day:

- 60% efficiency ratio by 2028
- 14-15% ROTCE sustained through cycle
- 10.5%-11.5% CET1 target operating range
- $2B+ annual buyback capacity
- Wealth AUM growth of 10%+ CAGR
- Commercial loan growth of 5-7% through cycle

---

## Part 4 · Executive Profiles · VIP Depth

### 4.1 · Robert "Bo" Hargrove III · CEO

**Background.** Fourth-generation Charlottean with deep community ties. Joined First Capital in 2003 as a commercial banker after four years at a national investment bank. Progressed through commercial banking roles — Regional Commercial Banking Executive 2010, Head of Commercial Banking 2015, Chief Operating Officer 2019, CEO January 2024. Undergraduate economics from University of North Carolina at Chapel Hill; MBA Darden. White American of British ancestry, 54 years old, married to a pediatrician, three children in elementary through high school.

**Strategic priorities.** Hargrove is the architect of the three-pillar strategy. Stated priorities in roughly declining order: complete BSA/AML remediation decisively, execute the Pillar One efficiency work, deliver on the wealth acquisition integration, advance the AI agenda with demonstrated discipline.

**Communication style.** Southern-polished, measured, comfortable in public settings. Strong board and investor communication. Known internally for detailed preparation before significant meetings. Less comfortable with ambiguity than with execution discipline.

**Decision pattern.** Deliberate, then decisive. Will consult across the executive committee before committing; once committed, expects execution velocity.

**Known pain points.**
- BSA/AML Consent Order and the reputational and operational overhang
- Commercial real estate portfolio monitoring (repositioning succeeded but tail risk remains)
- Activist engagement dynamics (private so far but publicly possible)
- The AI investment's measurable return timeline under Street scrutiny

**Public statements worth referencing:**

*From March 2026 investor day:*
> "We are not the largest bank. We are not the fastest-moving bank. We are building the most relationship-deep bank at our scale, and every capital decision flows from that anchor."

*From a February 2026 Charlotte Business Journal interview:*
> "The BSA/AML Consent Order is a disappointment and a focus. We are doing the work. We will be better for it. I do not want to be defensive about the fact that we are being held to a higher standard; I want to meet the standard and move past it."

### 4.2 · Camila Restrepo-Wang · COO

**Background.** Joined First Capital in 2012 as Head of Consumer Banking Strategy. Rose through consumer banking to Head of Consumer Banking in 2018, then promoted to Chief Operating Officer in early 2024 following Hargrove's elevation to CEO. Undergraduate Princeton; MBA Wharton; earlier career at a management consulting firm. Colombian-American, 49 years old, married to a technology executive, two teenage children.

**Strategic priorities.** Restrepo-Wang owns operational execution across all business segments, enterprise operations, and the Pillar One efficiency work. 2026 priorities include efficiency ratio progression, operations technology delivery, and enterprise productivity applications of AI.

**Communication style.** Direct, data-oriented, patient listener. Known for strong cross-functional collaboration and clear decision memos. Respected across business segment leaders for operational fairness.

**Known pain points.**
- Efficiency ratio progression under wage cost pressure
- Operations technology delivery risk across large modernization programs
- BSA/AML remediation cost containment
- Balance between central operations scale and business segment customization

### 4.3 · Elaine Burakovsky-Park · CFO

**Background.** Joined First Capital in May 2025 as CFO. Prior: partner at a Big Four accounting firm leading financial services practice for 11 years; earlier career in bank finance at a large money-center institution. CPA; undergraduate Yale; MBA Chicago Booth. Ukrainian-American, married to a Korean-American surgeon, three children.

**Strategic priorities.** Burakovsky-Park owns financial operations, capital management, investor relations, and financial infrastructure for regulatory and business reporting. 2026 priorities include CCAR preparation, capital allocation framework refinement, investor communication on the AI investment, and the activist engagement financial dimension.

**Communication style.** Technical, precise, exceptionally thorough. Background in audit shapes her approach — she expects rigorous support for financial claims. Less warm than Hargrove in public settings but effective in investor meetings where rigor is valued.

**Known pain points.**
- Efficiency ratio narrative under wage cost pressure
- CCAR preparation in evolving stress test environment
- Capital markets business profitability under activist scrutiny
- Balance between capital return commitments and organic growth capital needs

### 4.4 · Dr. Vikram Shah · Chief Risk Officer

**Background.** Joined First Capital in 2020 as CRO from a large international bank where he had been Deputy CRO. Prior experience: risk leadership roles in fixed income and FX; earlier career in quantitative finance. PhD in applied mathematics from MIT; CFA. Indian-American, 57 years old, married, adult children.

**Strategic priorities.** Shah owns enterprise risk management across credit, market, operational, compliance, and model risk. His 2026 priorities include BSA/AML program enhancement, model risk management expansion for AI deployment, commercial real estate portfolio monitoring, and enterprise stress testing.

**Communication style.** Academic, rigorous, comfortable with complexity. Strong board presence; respected by regulators. Operates with the "three lines of defense" framing natively.

**Known pain points.**
- BSA/AML remediation resource intensity
- AI model risk management as AI deployment accelerates
- Commercial real estate portfolio tail risk
- Cybersecurity threat environment

**VIP-enriched reasoning notes for agents.** Programs touching risk must engage Shah's organization early. He is a gatekeeper on model risk for AI initiatives and will require governance artifacts.

### 4.5 · Douglas Okonjo · Chief Credit Officer

**Background.** Joined First Capital in 2008 as a credit officer. Progressed through credit risk leadership to CCO in 2019. Undergraduate Howard; MBA Columbia. Nigerian-American, 53 years old, married with three children.

**Strategic priorities.** Okonjo owns credit risk across consumer, commercial, and wealth lending. 2026 priorities include credit quality monitoring through cycle-late environment, commercial real estate oversight, and AI applications in underwriting and credit monitoring.

### 4.6 · Patricia Hess-McKinley · Head of Consumer Banking and Lending

**Background.** Joined First Capital in 2024 in this role after a decade at a national consumer bank as Head of Consumer Products. Undergraduate Duke; MBA Harvard. White American, 51 years old, single, based in Charlotte.

**Strategic priorities.** Hess-McKinley owns consumer banking, retail deposits, consumer lending, residential mortgage, and small business banking. 2026 priorities include digital sales growth, branch format evolution, deposit gathering in the rate environment, and consumer AI applications.

**Known pain points.**
- Deposit gathering competition with fintechs and money market funds
- Branch network optimization politically sensitive
- Consumer credit quality in consumer card and auto portfolios
- Digital sales growth pace

### 4.7 · Thomas Chen-Worthy · Head of Commercial Banking

**Background.** Joined First Capital in 1998 as a commercial relationship manager. 27-year First Capital career through commercial banking leadership. Undergraduate Wake Forest; MBA University of Virginia. White-American of Chinese-Australian mixed heritage, 52 years old, married, two college-aged children.

**Strategic priorities.** Chen-Worthy owns middle-market commercial banking, commercial real estate, specialty industries, treasury management, and government banking. 2026 priorities include commercial loan growth, specialty industry expansion, cross-franchise referral to wealth, and AI in commercial underwriting.

### 4.8 · Sarah Kolluri-Anderson · President, First Capital Wealth

**Background.** Joined First Capital in Q1 2025 through the wealth acquisition, where she had been President of the acquired firm. Prior experience: wealth leadership at two other firms; earlier career at a major private bank. Undergraduate University of Michigan; MBA Kellogg. Indian-American of mixed heritage, 48 years old, married with school-aged children, based in Charlotte post-acquisition.

**Strategic priorities.** Kolluri-Anderson owns the Wealth Management business including the integrated assets post-acquisition. 2026 priorities include acquisition integration completion, cross-franchise referral flow development, and wealth AI applications particularly in investment analytics and client communication.

**Known pain points.**
- Integration complexity from the Q1 2025 acquisition (cultural, operational, technology)
- Advisor retention during integration
- Cross-franchise referral program effectiveness
- Wealth technology platform consolidation

### 4.9 · Michael Rosenmeyer · Head of Capital Markets

**Background.** Joined First Capital in 2010 as a fixed income trader from a global bank. Progressed through trading leadership to head the Capital Markets business in 2018. Undergraduate Princeton; no graduate degree. German-American, 47 years old, married with young children, based in New York (Capital Markets operation based there).

**Strategic priorities.** Rosenmeyer owns fixed income sales and trading, FX, derivatives, and middle-market investment banking. 2026 priorities include performance under rate and volatility conditions, activist engagement context (capital markets is a divestiture target under activist pressure), and capital efficiency.

**VIP-enriched reasoning notes for agents.** Capital Markets is structurally the business segment under most strategic scrutiny. Programs touching capital markets must be sensitive to the activist context.

### 4.10 · Angela Okafor-Hill · CIO

**Background.** Joined First Capital in 2022 as CIO. Prior: CTO of a national consumer bank; technology leadership at a global financial services technology company. Undergraduate Georgia Tech; MS Carnegie Mellon. Nigerian-American, 47 years old, married with one child.

**Strategic priorities.** Okafor-Hill owns technology infrastructure, core banking platforms, cybersecurity, and enterprise application architecture. 2026 priorities include core banking modernization, cybersecurity enhancement, technology cost management, and coordination with Ravi Deshmukh on data and AI infrastructure.

**Known pain points.**
- Core banking platform modernization complexity and cost
- Cybersecurity threat environment
- Technology spend pressure under efficiency ratio commitment
- Talent competition with technology firms

### 4.11 · Ravi Deshmukh · Chief Data Officer

**Background.** Joined First Capital in 2022 as Head of Data Strategy; elevated to CDO and executive committee in January 2026 alongside data governance restructuring. Prior: data leadership at a large bank; earlier career in analytics consulting. Undergraduate IIT Delhi; MS Stanford; MBA Wharton. Indian-American, 45 years old, married with two young children.

**Strategic priorities.** Deshmukh owns enterprise data strategy, data governance, analytics and AI infrastructure, and enterprise customer data capabilities. 2026 priorities include data governance rebuild in response to BSA/AML and AI strategy requirements, single customer view implementation, and AI platform architecture.

**VIP-enriched reasoning notes for agents.** Deshmukh is the newly-empowered data and AI leader. Programs that touch AI architecture, data governance, or enterprise analytics must engage him directly. Likely AbarVa champion.

### 4.12 · Jasmine Taylor-Vance · Chief Digital Officer

**Background.** Joined First Capital in 2021 from a direct-to-consumer financial services company. Prior: product leadership at a digital consumer bank; earlier at a consumer technology company. Undergraduate Stanford; no graduate degree. Black American, 42 years old, married with one child, based in Charlotte.

**Strategic priorities.** Taylor-Vance owns consumer digital products including mobile and online banking, digital consumer acquisition, and digital experience strategy. 2026 priorities include integrated digital banking platform rollout, digital sales channel growth, and personalization capabilities.

### 4.13 · Marcus Blythe · Chief Compliance Officer

**Background.** Joined First Capital in 2025 specifically to lead BSA/AML remediation and strengthen the compliance function. Prior: CCO at two different banks, including one that had successfully remediated a prior Consent Order. Undergraduate Howard; JD Georgetown. Black-American, 54 years old, married with adult children.

**Strategic priorities.** Blythe owns enterprise compliance, BSA/AML program, sanctions, and the Consent Order remediation. 2026 priorities are dominated by BSA/AML program rebuild and regulatory reporting.

### 4.14-4.17 · Abbreviated additional executive profiles

- **Diana Aguilar-Reyes** (GC) — joined 2019; priorities include regulatory matters, activist engagement legal strategy
- **Richard Sutherland** (CHRO) — joined 2020; priorities include talent strategy, succession planning, culture integration post-acquisition
- **Kevin Nakashima** (CMO) — joined 2023; priorities include brand evolution, customer acquisition, Pillar Two proximity narrative
- **Elena Feldstein-Olu** (CSCRO) — joined 2022; priorities include climate disclosure regulation, community reinvestment

---

## Part 5 · Active Initiatives · 2026

First Capital has 21 named major initiatives in-flight. Most demo-relevant:

### 5.1 · BSA/AML Remediation Program

Sponsor: Marcus Blythe (CCO) with Vikram Shah (CRO)
Scope: Consent Order remediation — transaction monitoring, customer risk rating, case management, governance
Current phase: Active remediation with quarterly FRB reporting; multi-year program

### 5.2 · AI Platform and Governance Build

Sponsor: Ravi Deshmukh (CDO) with Angela Okafor-Hill (CIO) and Vikram Shah (CRO)
Scope: Enterprise AI platform architecture and governance framework
Current phase: Architecture design; governance framework to Board Technology Committee Q2 2026

### 5.3 · Wealth Acquisition Integration

Sponsor: Sarah Kolluri-Anderson (President FCW)
Scope: Integration of Q1 2025 acquired wealth business
Current phase: Technology integration in progress; cultural integration ongoing

### 5.4 · Branch Network Optimization

Sponsor: Patricia Hess-McKinley (Head Consumer)
Scope: Ongoing branch rationalization and format evolution
Current phase: 2026 closure list approved; new format pilots in 8 markets

### 5.5 · Core Banking Platform Modernization

Sponsor: Angela Okafor-Hill (CIO) with Patricia Hess-McKinley (Consumer)
Scope: Multi-year core banking platform modernization
Current phase: Deposits domain in progress; lending domain in design

### 5.6 · Enterprise Customer Data Platform

Sponsor: Ravi Deshmukh (CDO) with business segment leads
Scope: Single customer view across business segments for relationship management
Current phase: Phase 1 consumer-wealth integration in production; Phase 2 commercial in build

### 5.7 · Cross-Franchise Referral Program

Sponsor: Camila Restrepo-Wang (COO) with business segment leads
Scope: Systematic program with specific targets and measurement for cross-franchise referrals
Current phase: Program design complete; measurement and incentive structures in implementation

### 5.8 · Commercial Lending Analytics Enhancement

Sponsor: Thomas Chen-Worthy (Head Commercial) with Douglas Okonjo (CCO)
Scope: AI applications in commercial underwriting, portfolio monitoring, industry specialization
Current phase: Underwriting pilot in healthcare vertical; scaling planned

### 5.9 · Capital Markets Strategic Review

Sponsor: Michael Rosenmeyer (Head Capital Markets) with Elaine Burakovsky-Park (CFO)
Scope: Strategic and financial review of the Capital Markets business given activist context
Current phase: Internal review; not publicly disclosed

### 5.10 · CCAR Preparation

Sponsor: Elaine Burakovsky-Park (CFO) with Vikram Shah (CRO)
Scope: 2027 CCAR submission preparation under evolving stress test framework
Current phase: Early work in progress

### 5.11 · Through 5.21 · Additional initiatives

Including payments modernization, commercial real estate portfolio management, retirement services growth, climate reporting infrastructure, government banking expansion, small business banking digital, mortgage platform modernization, treasury management enhancement, investment banking build-out, retail mortgage processing optimization, and enterprise workforce strategy.

---

## Part 6 · Active Patterns Observable in First Capital Data

### 6.1 · Pattern: Shadow AI Tool Proliferation in Compliance and Fraud Functions

**Summary.** BSA/AML analysts, fraud investigators, and compliance staff have adopted approximately 9 AI tools across the enterprise without central governance, including case summarization tools, document analysis AI, and narrative generation tools. Total annualized spending approximately $1.1M; governance risk is meaningful given the post-Consent-Order environment.

**Severity.** Critical. BSA/AML governance was specifically cited in the Consent Order; uncontrolled AI in compliance functions creates additional regulatory exposure.

### 6.2 · Pattern: Cross-Franchise Relationship Underperformance

**Summary.** Cross-franchise relationship rates (customers with relationships in 2+ segments) are 18% — below benchmarked peers at 24-28% despite First Capital's strategic Partnership pillar emphasis. Gap is concentrated in consumer-to-wealth transitions and commercial-to-wealth referrals.

**Program implications.** Direct support to Pillar Three Partnership and the cross-franchise referral program.

### 6.3 · Pattern: Digital-Physical Integration Gaps

**Summary.** Customer journeys that span digital and physical channels (e.g., starting a mortgage application online, completing in-branch) show systematic fall-off at the transition points, with approximately 22% of multi-channel journeys abandoning compared to 8% for single-channel journeys.

### 6.4 · Pattern: Middle-Market Commercial Lending Origination Efficiency Variation

**Summary.** Commercial loan origination efficiency varies 3x across markets, with top markets originating at $X cost per dollar funded and bottom markets at 3X. Drivers include team tenure, market size, specialty depth, and technology adoption.

### 6.5 · Pattern: Deposit Attrition Risk in Rising Rate Environment

**Summary.** Approximately $18B-$24B in deposits sit in categories with elevated attrition risk given rate competition, concentrated in consumer money market and commercial non-operating account types.

### 6.6 · Pattern: Wealth Advisor Productivity Distribution

**Summary.** Wealth advisor productivity (AUM per advisor) varies meaningfully. Top-quintile advisors manage 4x the AUM of bottom-quintile advisors. Drivers include tenure, territory, and client segmentation practices.

### 6.7 · Pattern: Capital Markets Business Performance Volatility

**Summary.** Capital markets segment performance has been volatile quarter-to-quarter, with return on allocated capital ranging from 8% to 22% across recent quarters. This volatility intersects with the activist engagement on capital markets divestiture.

---

## Part 7 · Vendor and Technology Landscape

### 7.1 · Core systems

- **Core banking:** Multi-vendor patchwork; modernization in progress
- **Loan origination (consumer):** nCino
- **Loan origination (commercial):** Internal + nCino combination
- **Wealth platform:** LPL Financial-equivalent setup plus internal tools; consolidation in progress post-acquisition
- **Trading platforms:** Bloomberg, various third-party fixed income systems
- **Data platform:** Snowflake primary; Databricks for ML
- **Customer data:** Building toward single view; fragmented historically

### 7.2 · AI and analytics stack

- **Cloud:** Multi-cloud — AWS primary, Azure secondary
- **LLM providers:** Anthropic (primary, growing), Microsoft OpenAI (secondary)
- **ML platform:** Internal platform; SageMaker selectively
- **Fraud/AML platforms:** Major third-party vendors (industry standard tools) plus internal enhancements
- **Credit decisioning:** Mix of vendor and internal models

### 7.3 · AI vendor engagements

- **Central authorized:** Anthropic enterprise, Microsoft OpenAI, fraud/AML vendor AI additions
- **Shadow/decentralized (the pattern):** 9 tools flagged in Part 6.1

---

## Part 8 · Prior AbarVa Programs at First Capital

### 8.1 · Program: Commercial Lending Analytics Strategy

**Sponsor:** Thomas Chen-Worthy (Head Commercial) with Douglas Okonjo (CCO)
**Phases:** 0-4 completed
**Duration:** August 2025 - January 2026
**Outcomes:**
- AI-augmented underwriting approach scoped for healthcare vertical pilot
- Governance framework for commercial lending AI defined
- Industry specialization investment priorities sharpened
- Pilot launched in healthcare vertical Q1 2026

### 8.2 · Program: Wealth Acquisition Integration Diagnostic

**Sponsor:** Sarah Kolluri-Anderson (President FCW)
**Phases:** 0-3 completed; Phase 4 in progress
**Duration:** February 2026 - in progress
**Outcomes:**
- Integration risk assessment across technology, culture, talent, and client
- Advisor retention strategy refined
- Technology consolidation roadmap approved

---

## Part 9 · Benchmarks and Peer Data Layer

### 9.1 · Peer set

**Direct regional bank peers:**
- Truist Financial
- PNC Financial Services
- US Bancorp
- Fifth Third Bancorp
- Regions Financial
- Citizens Financial
- KeyCorp
- M&T Bank
- Huntington Bancshares
- Comerica

**Money center reference:**
- JPMorgan Chase (scale benchmark)
- Bank of America
- Wells Fargo

**Wealth peers:**
- Northern Trust
- Bank of New York Mellon
- Charles Schwab

**Fintech competitive reference:**
- Various digital-first banks and fintechs as relevant

### 9.2 · Benchmark categories

**Financial:**
- Return on tangible common equity
- Return on assets
- Efficiency ratio
- Net interest margin
- Fee income diversification
- CET1 ratio
- Deposit cost trends

**Operational:**
- Cost per transaction
- Digital channel share
- Branch productivity
- Customer acquisition cost
- Advisor productivity (wealth)

**Credit:**
- Net charge-offs by portfolio
- Non-performing assets
- Allowance for credit losses coverage
- Reserve build/release trends

**Regulatory and compliance:**
- BSA/AML program maturity indicators
- Regulatory action rates
- Capital regulatory ratios

**Customer:**
- Primary customer share
- Cross-franchise relationship rates
- Net promoter score
- Customer retention

### 9.3 · Demo-relevant benchmarks

- **Efficiency ratio · regional bank peer average:** 58.8%; First Capital at 56.2%; peer leaders at 52-54%
- **ROTCE · regional bank peer average:** 13.2%; First Capital at 14.8%; peer leaders at 15-17%
- **Cross-franchise relationship rate · peer average:** 24%; First Capital at 18% (below); leaders at 28-32%
- **Digital active customer rate · peer average:** 68%; First Capital at 75%; leaders at 78-82%
- **BSA/AML remediation average duration:** 28 months; First Capital current trajectory targeted under 24 months

---

## Part 10 · Data Room Inventory

### 10.1 · Client-private datasets

Comprehensive: organizational (46,000 employees), financial, operational across four segments, credit portfolios, customer data (9.4M retail, 120K commercial, 48K wealth), regulatory data, AI initiative portfolio, board materials, strategic plan.

### 10.2 · Client-contributed cross-bank data

- Cross-bank efficiency ratio patterns (aggregated, n=5 regional banks)
- Cross-bank digital transformation patterns
- Cross-bank AI initiative patterns

### 10.3 · Platform-public datasets

- FDIC call reports (all US banks quarterly)
- Fed Y-9C data
- OCC/Fed enforcement actions
- Peer bank 10-Ks and investor materials
- Industry analyst coverage
- Regulatory research (FedViews, OFR)
- Patent filings
- Financial services publications

### 10.4 · Known gaps

- Granular customer-level wealth data from acquired firm (integration ongoing)
- Real-time commercial real estate portfolio analytics
- Specialty industry competitive intelligence

---

## Part 11 · How This Data Flows to Agents

Same pattern as Apex and Meridian. Agent-specific adaptations:

- **Multi-segment context** — agents recognize which of four business segments a Program touches and adjust framing accordingly
- **Regulatory context primacy** — agents flag regulatory implications proactively given the Consent Order environment
- **Capital allocation register** — agents reason in terms of capital efficiency and regulatory capital implications
- **Southern corporate culture** — tone calibration for First Capital reflects the Southern corporate culture (relationship-driven, measured communication, heritage-aware)

---

## Part 12 · Summary · Three-Composite Comparison

| Dimension | Apex Retail Group | Meridian Health | First Capital Financial |
|---|---|---|---|
| Vertical | Retail | Healthcare | Financial Services |
| Scale | $108B revenue | $14.8B revenue | $362B assets, $18.2B revenue |
| Geography | National (1,976 stores) | Regional Mountain West | Southeast + national reach |
| Business complexity | 8 merchandise categories | 14 clinical + 4 payer products | 4 business segments |
| Strategic pressure | Margin + AI + activist | Value-based care + workforce + AI gov | Efficiency + regulatory + activist |
| Regulatory intensity | Moderate | High (CMS, state DOIs) | Very high (multiple federal regulators) |
| Demo narrative anchor | Shadow AI $2.3M | Shadow clinical AI + VBC | Shadow AI in compliance + BSA/AML |
| Key tension | Merch ↔ Planning ↔ Supply | Provider ↔ Payer + FFS ↔ VBC | Cross-franchise ↔ segment autonomy |
| Culture | Chicago operational-commercial | Salt Lake mission-clinical | Charlotte Southern-relationship |
| Program opportunity | AI decisioning layer | Physician workforce + VBC progression | AI governance + efficiency |

All three composites now enable rich agent reasoning across the three verticals AbarVa targets. Demo flexibility is complete — the anchor composite is selected based on the prospect's industry.

---

**END OF DOCUMENT · FIRST CAPITAL FINANCIAL COMPREHENSIVE SEED DATA SPECIFICATION**
