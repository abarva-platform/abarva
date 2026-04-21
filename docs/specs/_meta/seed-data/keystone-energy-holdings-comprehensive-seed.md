# Keystone Energy Holdings · Comprehensive Seed Data Specification

**An Exelon-class composite regulated utility enterprise designed to populate the AbarVa platform with genuine Fortune 200 depth for utility-sector demonstration, development, and pattern library seeding.**

This document defines the complete Keystone Energy Holdings tenant data set. Every dataset, person, initiative, vendor, regulatory filing, and financial metric specified here is to be ingested into the Keystone tenant and made available to Nexus, Sentinel, Atlas, and Steward as grounded context.

**IMPORTANT:** Keystone Energy Holdings is a composite. It is sized and structured like a Fortune 200 regulated transmission-and-distribution utility operating across the Midwest and Mid-Atlantic, comparable in scale to Exelon Corporation, but it is distinct from any real company. The financials, named executives, initiatives, operating subsidiaries, and specific details in this document are composite representations built from real regulated-utility transformation patterns and publicly available industry data as of April 2026. When demonstrating the platform, Keystone should always be described as "a composite organization built from real-world utility data" or "an Exelon-class composite built from public-sector utility evidence" — never as a real company.

This specification exists to extend AbarVa's composite tenant library into the regulated utility vertical, complementing the Apex Retail Group (retail), Meridian Health System (healthcare), and First Capital Financial (financial services) composites. Keystone represents the fourth beachhead vertical — regulated energy delivery — with its own distinctive operating logic: state-by-state public utility commission oversight, FERC and NERC regulatory jurisdiction, multi-year capital planning tied to rate base recovery, data center load surge economics, grid modernization imperatives, and the cross-functional tension between customer affordability, regulatory recovery, shareholder returns, and clean energy transition commitments.

Reads alongside:
- `docs/specs/_meta/seed-data/apex-retail-group-comprehensive-seed.md` — retail composite (structural template)
- `docs/specs/_meta/seed-data/meridian-health-system-comprehensive-seed.md` — healthcare composite
- `docs/specs/_meta/seed-data/first-capital-financial-comprehensive-seed.md` — financial services composite
- `docs/specs/platform/agent-architecture.md` — how agents consume composite data
- `docs/specs/platform/benchmarks-industry-data-architecture.md` — how utility peer benchmarks integrate
- `docs/specs/platform/graph-intelligence-architecture.md` — how composite graph entities render

---

## Part 1 · Company Profile

### 1.1 · Identity and positioning

Keystone Energy Holdings (NASDAQ: KEH, ticker "KEH") is a publicly-traded, Fortune 200 regulated transmission and distribution utility holding company headquartered in Cleveland, Ohio. The company operates six fully regulated electric and natural gas delivery subsidiaries across five states and the District of Columbia, serving approximately 10.4 million customer accounts. Keystone trades on the NASDAQ and is among the largest pure-play regulated utility holding companies in the United States by customer count.

Keystone positions itself as "the community-anchored grid of the Midwest and Mid-Atlantic" — distinct from the generation-and-retail hybrid positioning of integrated utilities, and distinct from the pure-infrastructure positioning of transmission-only competitors. Its brand promise centers on reliable, affordable, and increasingly clean energy delivery, anchored by deep regulatory relationships, long-term capital discipline, and explicit community investment in the metropolitan areas its subsidiaries serve.

The company was restructured into its current form in February 2022 through the corporate separation of its former generation business, which was spun off as an independent publicly-traded entity. Since separation, Keystone has operated as a pure-play regulated transmission and distribution company, earning regulated returns on approved infrastructure investment through state public utility commission rate cases.

Keystone's primary strategic pressures come from four directions: surging large-load interconnection demand from artificial intelligence data center development within its service territories (particularly in the Ohio, Pennsylvania, and Maryland footprints); grid reliability and resilience expectations in the face of more frequent extreme weather events; regulatory tension between accelerating capital investment and maintaining customer affordability; and the multi-state clean energy transition commitments that vary materially in ambition across its regulatory jurisdictions.

### 1.2 · Scale and financial snapshot

As of the most recent fiscal year (FY2025 ending December 31, 2025):

- **Total operating revenue:** $22.6B (5.8% YoY growth)
- **GAAP net income:** $2.8B
- **Adjusted operating earnings per share:** $2.71 (within guidance range of $2.64-$2.74)
- **Total rate base (end of year):** approximately $62B, targeting $70B by end of 2028
- **Rate base CAGR target through 2028:** 7.2%
- **Annual adjusted operating EPS growth target:** 5-7% through 2028
- **Capital investment plan (2025-2028):** $37B, a 9% increase over the prior four-year outlook
  - $12.2B electric transmission
  - $20.4B electric distribution and grid modernization
  - $3.1B natural gas distribution and safety modernization
  - $1.3B other (fleet, facilities, digital infrastructure)
- **Market capitalization:** approximately $41B at current trading levels
- **Total assets:** $78.4B
- **Customers served:** 10.4M total customer accounts
  - 9.2M electric customers across six subsidiaries
  - 1.2M natural gas customers (primarily in the Keystone Electric & Gas Maryland service territory)
- **Employees:** approximately 19,800 total, including 14,200 direct utility operations personnel, 3,100 technology and digital, 1,400 corporate, and 1,100 customer operations
- **Service territory:** approximately 75,000 square miles across 5 states + DC
- **Annual customer service interactions:** approximately 52 million (phone, digital, in-person)
- **Credit ratings:** A- (S&P), A3 (Moody's), A- (Fitch) at the holding company level

Keystone is in the top quartile of regulated utility peers on reliability metrics (System Average Interruption Duration Index and System Average Interruption Frequency Index) and is mid-pack on customer satisfaction (J.D. Power residential customer satisfaction surveys) with a stated strategic intention to move into top quartile on customer experience by 2028.

### 1.3 · Operating subsidiary structure

Keystone operates through six fully regulated delivery subsidiaries, each with its own President reporting to the Chief Operating Officer of Keystone Utilities Operations. Each subsidiary operates under the jurisdiction of its respective state public utility commission, with the District of Columbia operations regulated by the DC Public Service Commission:

- **Riverbend Electric Company (RBE)** — Illinois — 4.1M electric customers across the Chicago metropolitan area and northern Illinois · headquartered in Chicago · the largest subsidiary by customer count · operates under Illinois Commerce Commission jurisdiction

- **Keystone Electric & Gas (KEG)** — Maryland — 1.3M electric customers and 680K natural gas customers across central Maryland, including the City of Baltimore and nine surrounding counties · headquartered in Baltimore · the corporate flagship subsidiary given the CEO's career roots · operates under Maryland Public Service Commission jurisdiction

- **Commonwealth Power & Light (CPL)** — Pennsylvania — 1.8M electric customers across southeastern Pennsylvania, including Philadelphia and surrounding counties · headquartered in Philadelphia · operates under Pennsylvania Public Utility Commission jurisdiction

- **Potomac Energy Services (POE)** — Washington DC and Maryland — 920K electric customers across the District of Columbia and parts of Maryland · headquartered in Washington DC · operates under DC Public Service Commission and Maryland PSC jurisdictions

- **Atlantic Shore Electric (ASE)** — New Jersey — 580K electric customers across southern New Jersey · headquartered in Mays Landing, NJ · operates under New Jersey Board of Public Utilities jurisdiction

- **Delmarva Power Services (DPS)** — Delaware and Maryland's Eastern Shore — 540K electric customers and 140K natural gas customers · headquartered in Newark, Delaware · operates under Delaware Public Service Commission and Maryland PSC jurisdictions

All six subsidiaries operate within the PJM Interconnection Regional Transmission Organization footprint, subjecting them to PJM capacity market rules, transmission cost allocation, and the broader reliability and interconnection standards set by PJM and federally by the North American Electric Reliability Corporation (NERC) and Federal Energy Regulatory Commission (FERC).

### 1.4 · Regulatory jurisdiction footprint

Keystone's multi-jurisdictional regulatory environment is one of the defining complexity drivers of its business model. Each of the following regulators has material influence on capital recovery, rate design, service obligations, and operational standards:

- **Illinois Commerce Commission** (Illinois) — Riverbend Electric
- **Maryland Public Service Commission** (Maryland) — Keystone Electric & Gas, Potomac Energy Services (MD portion), Delmarva Power Services (MD portion)
- **Pennsylvania Public Utility Commission** (Pennsylvania) — Commonwealth Power & Light
- **New Jersey Board of Public Utilities** (New Jersey) — Atlantic Shore Electric
- **District of Columbia Public Service Commission** (DC) — Potomac Energy Services (DC portion)
- **Delaware Public Service Commission** (Delaware) — Delmarva Power Services (DE portion)
- **Federal Energy Regulatory Commission (FERC)** — transmission cost recovery under formula rate; interconnection rules; wholesale market oversight
- **North American Electric Reliability Corporation (NERC)** — reliability standards, large load interconnection guidance
- **PJM Interconnection** — RTO market rules, capacity auctions, transmission planning

As of April 2026, Keystone has active rate case proceedings in four of its six state jurisdictions, with regulatory decisions expected between Q2 2026 and Q4 2026. The combined capital recovery being sought across these four rate cases totals approximately $2.1B in annualized revenue requirement increases, making this the most significant multi-state regulatory cycle in the company's post-separation history.

### 1.5 · Recent corporate trajectory

Keystone's trajectory since the February 2022 spin-off of its generation business has been defined by four sequential strategic pivots:

**Phase 1 (2022-2023) — Stabilization as pure-play T&D.** Following the separation, the company focused on operational stabilization, completing the financial and technology separation from the former generation business, establishing standalone holding-company functions, and resetting capital allocation strategy around regulated transmission and distribution growth only.

**Phase 2 (2023-2024) — Grid modernization acceleration.** With the pure-play structure in place, Keystone accelerated its grid modernization capital program, increasing four-year capital plan investment from the $28B range to the $33B range, focused on distribution automation, Advanced Metering Infrastructure (AMI) upgrades, storm hardening, and transmission expansion in support of clean energy integration.

**Phase 3 (2024-2025) — Data center interconnection scaling.** Beginning in late 2024 and accelerating through 2025, Keystone's service territories experienced an unprecedented surge in large-load interconnection requests driven by artificial intelligence data center development. Pending interconnection requests across Keystone's footprint grew from approximately 14 gigawatts in early 2024 to 32 gigawatts by late 2025 — a 128% increase in eighteen months. This forced a rapid reorientation of capital planning, with the current $37B capital plan reflecting approximately $8B of new transmission investment specifically allocated to large-load integration.

**Phase 4 (2026 and forward) — Integrated customer and technology transformation.** With the early February 2026 appointment of a new EVP and Chief Customer and Technology Officer, Keystone initiated a newly-aligned organizational structure that unifies customer strategy, customer operations, enterprise technology, and digital under a single executive. This restructuring is explicitly designed to close the gap between customer expectations (shaped by digital-native consumer experiences) and the historically siloed customer and technology functions within regulated utilities.

This Phase 4 transformation is the strategic context in which AbarVa engagement at Keystone would occur.

---

## Part 2 · Executive Leadership

### 2.1 · Executive Committee composition

Keystone's Executive Committee consists of the following twelve members, who collectively set enterprise strategy, approve major capital deployments, and report to the Board of Directors:

- Marcus W. Kittrell — President and Chief Executive Officer
- Nicole Hargrave-Park — Executive Vice President and Chief Operating Officer, President of Utility Operations
- Elena Vosburgh — Executive Vice President and Chief Financial Officer
- Jonathan Aldridge — Executive Vice President and Chief Customer and Technology Officer
- Calvin Shenker — Executive Vice President, Chief Regulatory and Strategy Officer
- Anita Ramaswamy — Executive Vice President, Chief Legal Officer and Corporate Secretary
- Derek Braithwaite — Executive Vice President, Chief Human Resources Officer
- Priya Mehta — Executive Vice President, Chief Communications and External Affairs Officer
- Warren Okafor — Senior Vice President and Chief Sustainability Officer
- Samantha Chen-Pryce — Senior Vice President, Chief Audit and Risk Officer
- Rafael DeLeon — Senior Vice President, Chief Financial Planning Officer and Treasurer
- Melissa Strickland — Senior Vice President, Controller and Chief Accounting Officer

### 2.2 · Operating subsidiary leadership

Each of the six operating subsidiaries is led by a President, who reports to Nicole Hargrave-Park (EVP and COO):

- Gregory Lundquist — President, Riverbend Electric Company (Illinois)
- Reginald Chatmon — President, Keystone Electric & Gas (Maryland)
- Maria Cervantes-Ruiz — President, Commonwealth Power & Light (Pennsylvania)
- Natasha Feldbaum — President, Potomac Energy Services (DC/Maryland)
- Benjamin Harwell — President, Atlantic Shore Electric (New Jersey)
- Theo Carrington — President, Delmarva Power Services (Delaware/Maryland)

### 2.3 · Reporting structure summary

The Executive Committee members report to CEO Marcus Kittrell, with one key exception: Nicole Hargrave-Park (COO) has the operating subsidiary Presidents as her direct reports, creating a two-tier reporting structure that distinguishes corporate-level functions from utility operations.

Jonathan Aldridge's scope as EVP and Chief Customer and Technology Officer is explicitly cross-cutting — he works across all six operating subsidiaries through a combination of direct authority (enterprise IT, cybersecurity, data, digital, enterprise architecture) and dotted-line coordination (customer operations within each subsidiary's Customer Service organization).

This dotted-line structure is a known organizational tension and a key element of the Phase 4 transformation's design. The cross-subsidiary orchestration challenge that falls to Aldridge's role is precisely the kind of cross-functional decisioning problem that AbarVa is built to address.

---

## Part 3 · Strategic Priorities · 2026

Keystone's 2026 strategic architecture is anchored in six priorities. These were formally ratified by the Board of Directors in December 2025 and communicated to employees, investors, and regulators through the 2026 Strategic Plan released in January 2026.

### 3.1 · Grid Modernization and Transmission Expansion 2030

Target: deliver the $37B capital investment plan for 2025-2028 on time and within regulatory recovery parameters, with approximately $12.2B targeted toward electric transmission expansion and approximately $20.4B toward electric distribution modernization. This priority encompasses both traditional grid hardening (storm resilience, wood pole replacement, substation modernization) and the newer capital requirements driven by large-load interconnection.

Key measures:
- Capital deployment pace relative to plan (quarterly variance < 5%)
- Regulatory cost recovery approval rate across active rate cases
- Transmission project completion milestones
- System reliability improvement (SAIDI, SAIFI targets)

### 3.2 · Customer Experience Transformation

Target: move from mid-pack to top-quartile J.D. Power residential customer satisfaction scores by 2028 through unified customer operations, modernized digital self-service, redesigned billing experiences, and improved outage communication. This priority is the strategic mandate for Jonathan Aldridge's newly-created combined Customer and Technology function.

Key measures:
- J.D. Power residential customer satisfaction score (target: top quartile by 2028)
- Digital self-service adoption rate (target: 68% by end of 2027, from 47% current)
- First call resolution rate (target: 82% by end of 2027, from 71% current)
- Customer complaint rate per 1,000 customers
- Outage communication timeliness (% of affected customers notified within 15 minutes)

### 3.3 · Clean Energy Transition and Net Zero Commitments

Target: achieve Scope 1 and Scope 2 net zero by 2040, Scope 3 net zero by 2050, in alignment with the science-based targets framework and consistent with the clean energy transition goals of Keystone's regulatory jurisdictions. This priority intersects with grid modernization through the integration of distributed energy resources, customer-sited solar, battery storage, and transportation electrification load.

Key measures:
- Scope 1 and 2 GHG emissions (tracked annually)
- Distributed energy resource interconnection throughput (customer interconnect lead time)
- EV charging infrastructure deployment
- Methane detection and reduction on gas operations (KEG and DPS)

### 3.4 · Community Investment and Equity

Target: deliver $1.4B in community investment across the 2026-2028 period, with explicit commitments to workforce development, minority business enterprise spend, charitable giving, and equitable rate design. This priority is personally championed by CEO Marcus Kittrell and reflects the IMPACT values framework (Invest in communities, Measure continuous improvement, Prioritize equity, Advance affordability, Create thriving environment, Transform the industry).

Key measures:
- Total community investment spend (vs. $1.4B three-year target)
- Minority business enterprise procurement ($ and %)
- Workforce development program participant placement rate
- Energy burden reduction for low-income customers

### 3.5 · Operational Excellence and Reliability

Target: maintain top-quartile performance on system reliability metrics (SAIDI, SAIFI) while simultaneously executing the largest capital investment plan in company history. This priority explicitly frames the tension between "keep the grid running" and "transform the grid" as a core operational challenge.

Key measures:
- System Average Interruption Duration Index (SAIDI) — minutes per customer per year
- System Average Interruption Frequency Index (SAIFI) — outages per customer per year
- Customer Average Interruption Duration Index (CAIDI)
- Worker safety metrics (OSHA recordable incident rate, lost time incident rate)

### 3.6 · Regulatory Partnership and Constructive Outcomes

Target: maintain constructive regulatory relationships across the six jurisdictions, delivering rate case outcomes that enable capital recovery at weighted-average ROE of 9.7% or better while managing customer rate impact. This priority requires coordination across Regulatory Affairs, each subsidiary's regulatory team, Legal, Finance, and External Affairs.

Key measures:
- Weighted-average allowed ROE across active rate cases
- Rate case cycle time (filing to final order)
- Regulatory outcome rating (constructive/mixed/adverse categorization)
- Intervenor settlement rate

---

## Part 4 · C-Suite Profiles · VIP Depth

These profiles are canonical references. When an agent needs to reason about "who is the CFO at Keystone" or "what does the CCTO care about," it reasons from these profiles. Full data presence is essential so Nexus and Sentinel can surface rich context.

### 4.1 · Marcus W. Kittrell — President and Chief Executive Officer

**Tenure.** Joined Keystone (then under its pre-separation identity) in 2008. Appointed President and COO in 2019. Appointed President and CEO effective October 2022.

**Career trajectory.** Started his career at a mid-sized Illinois regional utility (CILCORP) in government affairs, legal, and strategy roles. Moved to a large-scale print, digital, and supply chain solutions company in senior leadership, then joined the Keystone predecessor company in 2008. Held progressively senior roles including Vice President of Governmental and Legislative Affairs at Riverbend Electric, Senior Vice President of Corporate Affairs at Keystone Electric & Gas, Chief Executive Officer of Keystone Electric & Gas (2014-2019), and President and Chief Operating Officer of Keystone (2019-2022).

**Education.** Bachelor of Science in Business Administration, Bradley University (Peoria, Illinois). Juris Doctor, Saint Louis University School of Law.

**Public positioning.** Articulated the "IMPACT" values framework as CEO, spanning Investing in communities, Measuring continuous improvement, Prioritizing equity, Advancing affordability, Creating thriving environments, and Transforming the industry. Publicly emphasizes community anchoring and equitable transformation alongside conventional utility priorities of reliability and affordability.

**External board roles.** Chair of Edison Electric Institute (EEI) Board of Directors. Chairman of a national youth sports foundation. Vice Chair of a major international education institute. Member of the Board of Governors for Argonne National Laboratory. Board member, Emerson Electric. Member, Economic Club of Chicago. Member, Civic Committee of the Commercial Club of Chicago.

**Ambitions and priorities as of April 2026.**
- Successfully execute the $37B capital plan through 2028
- Deliver the Phase 4 Integrated Customer and Technology Transformation (this is the strategic initiative that brought Jonathan Aldridge onboard)
- Sustain the 5-7% annual adjusted operating EPS growth target through 2028
- Navigate the large-load interconnection challenge as both opportunity and risk
- Strengthen constructive regulatory relationships across all six jurisdictions
- Build the utility workforce of the future as baby-boomer transmission engineers retire en masse

**Known tensions and active concerns.**
- Balancing the pace of capital deployment with customer rate impact and regulatory appetite
- Data center interconnection surge creating both growth opportunity and affordability backlash risk
- Workforce attrition in specialized grid operations (27% turnover in transmission engineering)
- Multi-state regulatory variation creating coordination complexity
- Cybersecurity threat level escalation against critical infrastructure
- ESG investor pressure for faster decarbonization vs. state regulatory ambition variance
- Post-2022 separation, holding company and opco coordination still not fully mature

**Communication style.** Thoughtful, community-oriented, deliberately paced. Speaks in terms of stakeholder impact rather than purely shareholder return. Willing to be publicly critical of industry peers on equity and community investment. Respectful but firm in regulatory settings. Privately known as a careful listener who expects preparation from his team.

### 4.2 · Nicole Hargrave-Park — EVP and Chief Operating Officer, President of Utility Operations

**Tenure.** Joined Keystone in 2011. Appointed EVP and COO effective January 2023, concurrently serving as President of Utility Operations.

**Career trajectory.** Started as an engineer at a major investor-owned utility in the Southeast. Held progressively senior operational roles at two Midwest utilities before joining Keystone. Within Keystone, served as VP of Distribution Operations at Keystone Electric & Gas, SVP of Electric Operations at Riverbend Electric, and President of Riverbend Electric (2020-2022) prior to her current role.

**Education.** Bachelor of Science in Electrical Engineering, University of Michigan. Master of Science in Engineering Management, Northwestern University.

**Scope.** Responsible for the operational performance of all six operating subsidiaries, with the six subsidiary Presidents reporting directly to her. Accountable for system reliability, worker safety, operational capital execution, field workforce management, storm response coordination, and day-to-day utility delivery performance.

**Ambitions and priorities as of April 2026.**
- Execute the operational capital plan without degrading reliability metrics
- Drive the storm response coordination transformation (pattern 7.3 below)
- Address transmission engineering workforce attrition
- Coordinate multi-subsidiary response to the large-load interconnection surge
- Deliver top-quartile reliability metrics across all six subsidiaries

**Known tensions.** Field workforce capacity strained against accelerating capital deployment. Storm response coordination fragmentation across subsidiaries creates cross-jurisdictional handoff risk during mutual assistance scenarios. Operational technology (OT) cybersecurity vulnerability growing as distribution systems become more connected.

### 4.3 · Elena Vosburgh — EVP and Chief Financial Officer

**Tenure.** Joined Keystone in 2020 as SVP of Financial Planning. Appointed EVP and CFO effective April 2023.

**Career trajectory.** Started at a Big Four accounting firm in audit, moved to a large integrated utility in corporate finance roles, served as Treasurer of a competitive energy generation company, and was Senior Vice President of Finance at a large regulated utility before joining Keystone.

**Education.** Bachelor of Science in Accounting, University of Virginia. MBA, Wharton School of the University of Pennsylvania. Certified Public Accountant.

**Scope.** Enterprise finance, including financial planning and analysis, treasury, tax, investor relations, financial controls, and the financial aspects of regulatory proceedings. Directly accountable for the $37B capital plan financing strategy and the continued execution of the company's equity and debt financing requirements.

**Ambitions and priorities as of April 2026.**
- Finance the $37B capital plan without degrading credit ratings
- Execute the 2026 equity issuance requirements (~$900M planned)
- Maintain investment-grade credit ratings through the accelerated capital cycle
- Deliver transparent investor communications on large-load opportunity and risk
- Partner with Calvin Shenker on rate case financial strategy

**Known tensions.** Capital plan acceleration puts pressure on financing needs. Credit rating discipline requires balance between debt and equity issuance timing. Rate case outcomes directly drive cash flow recovery, creating regulatory dependency for financial planning.

### 4.4 · Jonathan Aldridge — EVP and Chief Customer and Technology Officer (THE TIM-ANALOG ROLE)

**Tenure.** Joined Keystone effective February 2026. Two months into role as of April 2026. On Executive Committee. Reports directly to CEO Marcus Kittrell.

**Career trajectory.** Before joining Keystone, served as SVP, Chief Information Officer and Chief Technology Officer at a major investor-owned utility in the Upper Midwest (multi-state regulated utility serving nearly six million customers across eight states). Prior to that role, held CIO positions at a major healthcare services and benefits organization, a regional property and casualty insurance company, and a credit union financial services provider. More than two decades of experience leading large multi-function teams, complex initiatives, and company transformation efforts, including large-scale grid modernization and customer billing system upgrades.

**Education.** MBA from the University of Minnesota. Bachelor of Business Administration from the University of Wisconsin. Certified Information Systems Security Professional (CISSP).

**Scope.** Newly-aligned combined organization encompassing customer strategy and experience, enterprise technology, cyber, data, and digital. Mandate explicitly unifies functions that had previously been siloed. Direct reports include the VP Customer Operations, VP Enterprise IT, VP Cybersecurity, VP Data and Analytics, VP Digital and Customer Channels, and VP Enterprise Architecture.

**Ambitions and priorities as of April 2026.**
- Build the operating model that justifies the creation of the combined Customer + Technology role
- Execute the Phase 4 transformation that led to his hire
- Consolidate fragmented AI tool adoption into coherent enterprise platform (see pattern 7.1)
- Define what "customer experience transformation" means operationally across six subsidiaries
- Modernize customer-facing digital experience (self-service portal, outage communications, billing)
- Deliver cybersecurity program maturation in response to escalating critical infrastructure threat level
- Address the customer-vs-tech functional silo patterns he inherits from the prior organizational structure

**Known tensions and early observations.**
- Incumbent IT organization and Customer Service organization have distinct cultures, vendor portfolios, and performance metrics that must be reconciled
- Legacy customer billing systems across six subsidiaries have meaningful structural variation that constrains unified customer experience work
- Cybersecurity investment backlog inherited from prior decentralized posture
- Shadow AI tool adoption across operations teams (documented in pattern 7.1) has happened faster than governance frameworks
- Customer expectations shaped by digital-native experiences increasingly mismatched to utility operational reality

**Public positioning.** Publicly articulated his framing of the post-AI-deployment integration challenge facing CIOs in a widely-read LinkedIn post shortly after joining Keystone. The quote — paraphrased: *"The 'Chief Integration Officer' shouldn't just be a rebrand; it's time for a reset. After years of racing to deploy AI, CIOs now face the harder work of making it add up"* — captures his orientation to the current moment in enterprise technology leadership.

**Communication style.** Measured, systems-oriented, outcome-focused. Asks probing questions before offering his position. Respects people who come prepared with data. Known for candid feedback in private settings.

### 4.5 · Calvin Shenker — EVP, Chief Regulatory and Strategy Officer

**Tenure.** Joined Keystone in 2005 through an earlier acquisition. Appointed EVP, Chief Regulatory and Strategy Officer in 2021.

**Career trajectory.** Started at a major law firm in energy regulatory practice. Joined a regional utility as senior regulatory counsel. Rose through regulatory affairs roles at Keystone predecessors and at KEG before assuming enterprise Regulatory Affairs leadership.

**Education.** Bachelor of Arts in Economics, Yale University. Juris Doctor, Harvard Law School.

**Scope.** Enterprise regulatory strategy across six jurisdictions (Illinois, Maryland, Pennsylvania, New Jersey, DC, Delaware), federal regulatory engagement (FERC, NERC, DOE), enterprise strategy development, mergers and acquisitions, and competitive intelligence.

**Ambitions and priorities as of April 2026.**
- Deliver constructive outcomes in the four active rate cases
- Shape emerging federal rulemakings on large-load interconnection (FERC and DOE)
- Coordinate multi-state regulatory posture on data center interconnection
- Drive the 2026-2028 enterprise strategy refresh
- Manage regulatory response to clean energy transition ambition variance across states

**Known tensions.** Federal-state jurisdictional tension on large-load interconnection creating strategic uncertainty. Variance in regulatory approaches across six jurisdictions creating operational and financial complexity. Intervenor dynamics in rate cases requiring careful coalition management.

### 4.6 · Anita Ramaswamy — EVP, Chief Legal Officer and Corporate Secretary

**Tenure.** Joined Keystone in 2016. Appointed EVP, Chief Legal Officer and Corporate Secretary in 2022.

**Career trajectory.** Started at a major Washington DC law firm in regulatory and administrative law practice. Served as Associate General Counsel at a large investor-owned utility, then Vice President and Deputy General Counsel at Keystone before her current role.

**Education.** Bachelor of Arts in Government, Georgetown University. Juris Doctor, Columbia Law School.

**Scope.** Enterprise legal, corporate governance, ethics, compliance, securities law, litigation, and corporate secretary functions. Directly supports the Board of Directors.

**Ambitions and priorities as of April 2026.**
- Support the four active rate cases with appropriate legal strategy
- Strengthen enterprise compliance program in response to evolving cybersecurity regulatory expectations
- Drive ethics and governance maturation across all six subsidiaries
- Manage litigation portfolio (multiple active environmental and rate-related proceedings)

### 4.7 · Derek Braithwaite — EVP, Chief Human Resources Officer

**Tenure.** Joined Keystone in 2019. Appointed EVP, Chief Human Resources Officer in 2022.

**Career trajectory.** Senior HR roles at multiple Fortune 500 companies including a major manufacturer, a large integrated utility, and a telecommunications firm before joining Keystone.

**Education.** Bachelor of Arts in Industrial and Labor Relations, Cornell University. Master of Business Administration, Kellogg School of Management.

**Scope.** Enterprise human resources, including workforce planning, talent acquisition, leadership development, compensation, benefits, labor relations (Keystone has significant unionized workforce), diversity and equity, and workforce analytics.

**Ambitions and priorities as of April 2026.**
- Address transmission engineering workforce attrition (pattern 7.6)
- Execute labor relations strategy with IBEW and UWUA local unions across service territories
- Drive leadership development in support of the Phase 4 transformation
- Build workforce analytics capability in partnership with Jonathan Aldridge
- Execute the community workforce development commitments in the IMPACT framework

### 4.8 · Priya Mehta — EVP, Chief Communications and External Affairs Officer

**Tenure.** Joined Keystone in 2015. Appointed EVP, Chief Communications and External Affairs Officer in 2023.

**Career trajectory.** Public affairs at a Fortune 100 consumer packaged goods company, followed by senior communications roles at two major utilities before Keystone.

**Education.** Bachelor of Arts in Journalism, Northwestern University. Master of Science in Public Affairs, Harvard Kennedy School.

**Scope.** Enterprise communications, media relations, executive communications, employee communications, external affairs, government relations, community partnerships, and corporate brand.

### 4.9 · Warren Okafor — SVP and Chief Sustainability Officer

**Tenure.** Joined Keystone in 2020. Appointed SVP and Chief Sustainability Officer in 2024.

**Career trajectory.** Environmental policy roles at EPA and at a global environmental NGO, followed by senior sustainability leadership at a major integrated utility and at a renewable energy developer before Keystone.

**Scope.** Enterprise sustainability strategy, ESG reporting, climate target setting and tracking, sustainability-related regulatory engagement, renewable integration policy, and environmental justice programs.

### 4.10 · Samantha Chen-Pryce — SVP, Chief Audit and Risk Officer

**Tenure.** Joined Keystone in 2018. Appointed SVP, Chief Audit and Risk Officer in 2023.

**Career trajectory.** Big Four risk consulting practice, internal audit leadership at a Fortune 500 financial services firm, enterprise risk leadership at a large utility before Keystone.

**Scope.** Internal audit, enterprise risk management, insurance, and audit committee liaison. Operates with functional reporting line to the Audit Committee of the Board of Directors.

### 4.11 · Rafael DeLeon — SVP, Chief Financial Planning Officer and Treasurer

**Tenure.** Joined Keystone in 2019. Current role since 2023.

**Scope.** Treasury, financial planning and analysis, investor relations, rating agency relations. Reports to CFO Elena Vosburgh.

### 4.12 · Melissa Strickland — SVP, Controller and Chief Accounting Officer

**Tenure.** Joined Keystone in 2017. Current role since 2022.

**Scope.** Accounting, financial reporting, SOX compliance, internal controls. Reports to CFO Elena Vosburgh.

---

## Part 5 · Extended Leadership · SVPs by Function

Below the Executive Committee, Keystone's SVP-level leaders drive functional depth. These individuals are referenced when agents need to reason about operational specifics, mid-tier program ownership, or cross-functional initiative leadership.

### 5.1 · Customer and Technology organization (under Jonathan Aldridge)

- **Sophia Lindqvist** — SVP, Customer Operations · Enterprise customer service operations, contact center strategy, billing operations · direct reports include subsidiary Customer Service VPs across six opcos
- **Hideki Tanaka** — SVP, Enterprise Technology · IT infrastructure, enterprise architecture, application portfolio, cloud strategy
- **Rachel Navarro** — SVP, Cybersecurity and Critical Infrastructure Protection · enterprise cyber, OT/IT cybersecurity convergence, NERC CIP compliance, incident response
- **Daniel Whitlock** — SVP, Data, Analytics and AI · enterprise data platform, analytics capability, emerging AI governance, AMI data strategy
- **Aisha Prentiss** — SVP, Digital and Customer Experience · digital product management, customer-facing digital platforms, self-service portal, outage communications
- **Christopher Reede** — SVP, Program Management Office · enterprise program and portfolio governance, the cross-functional delivery function

### 5.2 · Utility Operations organization (under Nicole Hargrave-Park)

- **James Oppenheim** — SVP, Transmission and Substation Operations · bulk power system operations, substation engineering, transmission planning
- **Kavitha Subramaniam** — SVP, Distribution Engineering · distribution system planning, grid modernization engineering, distribution automation design
- **Luke Hollister** — SVP, Field Operations · field crew dispatch, work management, vehicle fleet, storm response operational coordination
- **Yolanda Pettigrew** — SVP, Safety, Environment and Training · worker safety, environmental compliance, operator training and certification

### 5.3 · Finance organization (under Elena Vosburgh)

- **Rafael DeLeon** (listed above as EVC member) — Treasurer
- **Melissa Strickland** (listed above as EVC member) — Controller
- **Vinod Krishnamurthy** — SVP, Financial Planning and Analysis · enterprise FP&A, capital planning, financial aspects of rate case strategy
- **Beatrice Armitage** — SVP, Investor Relations · investor communications, earnings process, rating agency communications

### 5.4 · Regulatory and Strategy organization (under Calvin Shenker)

- **Marcus Brantwell** — SVP, State Regulatory Affairs · consolidates the subsidiary-level regulatory affairs leaders
- **Angela Yamamoto** — SVP, Federal Regulatory Affairs · FERC, DOE, NERC, NARUC engagement
- **Sanjay Rameshkumar** — SVP, Enterprise Strategy and Competitive Intelligence · enterprise strategy refresh, scenario planning, M&A analysis
- **Danielle Westergaard** — SVP, Rate Case Strategy · dedicated SVP leading the four active rate cases

### 5.5 · Human Resources organization (under Derek Braithwaite)

- **Camille Thibodeaux** — SVP, Workforce Strategy and Talent Acquisition
- **Robert Faulkner** — SVP, Labor Relations and Employee Relations
- **Sarah Winterbourne** — SVP, Total Rewards and Benefits
- **Dwight Henderson** — SVP, Leadership Development and Culture

### 5.6 · Communications and External Affairs organization (under Priya Mehta)

- **Emma Gonzalez-Fitzpatrick** — SVP, Media Relations and Corporate Communications
- **David Cottrell** — SVP, Government Relations (federal and multi-state)
- **Keisha Marchant** — SVP, Community Partnerships and Corporate Citizenship

---

## Part 6 · Active Initiatives and Transformation Landscape

Twenty-two named initiatives comprise the active transformation portfolio at Keystone as of April 2026. These initiatives range from multi-billion-dollar multi-year capital programs to targeted modernization efforts.

### 6.1 · The Capital-Heavy Strategic Initiatives

**Initiative 6.1.1 · Grid Modernization 2030 (Phase 2)**
Owner: Kavitha Subramaniam (SVP Distribution Engineering)
Executive sponsor: Nicole Hargrave-Park
Scope: $20.4B distribution modernization across six subsidiaries, including distribution automation, AMI 2.0, storm hardening, undergrounding in select corridors, pole replacement programs
Timeline: 2025-2028
Current status: 22% of plan deployed through Q1 2026

**Initiative 6.1.2 · Transmission Expansion Program**
Owner: James Oppenheim (SVP Transmission and Substation Operations)
Executive sponsor: Nicole Hargrave-Park
Scope: $12.2B transmission capacity expansion, primarily driven by large-load interconnection requirements and clean energy integration
Timeline: 2025-2028 with projects extending through 2030
Current status: 14% of plan deployed; 36% in regulatory/permitting phase

**Initiative 6.1.3 · Data Center Load Integration Program**
Owner: Jonathan Aldridge (for orchestration), James Oppenheim (for engineering)
Executive sponsor: Marcus Kittrell (direct CEO sponsorship given strategic importance)
Scope: $8B of the transmission expansion plan specifically allocated to large-load interconnection, encompassing study-phase engineering, interconnection agreements, cost allocation frameworks, and tariff design for large loads
Timeline: 2025-2030
Current status: 32 GW in interconnection queue; active engagement on large-load tariff filings in four jurisdictions; working with PJM on co-location rules

### 6.2 · Customer and Technology initiatives

**Initiative 6.2.1 · Customer Self-Service Portal Transformation**
Owner: Aisha Prentiss
Executive sponsor: Jonathan Aldridge
Scope: Unified digital customer portal across six subsidiaries, replacing the current fragmented subsidiary-specific portals; including billing, outage tracking, service requests, energy usage insights, and program enrollment
Timeline: 18-month program launched March 2026
Current status: Vendor selection complete; architecture phase in progress

**Initiative 6.2.2 · AMI 2.0 Deployment**
Owner: Daniel Whitlock (for data strategy), Kavitha Subramaniam (for field deployment)
Executive sponsor: Jonathan Aldridge (for data side), Nicole Hargrave-Park (for operations side)
Scope: Next-generation advanced metering infrastructure replacing AMI 1.0 deployed in 2013-2016 period, enabling higher-frequency interval data, distributed energy resource integration, and grid edge intelligence
Timeline: 2024-2028
Current status: 41% of meters upgraded across the footprint

**Initiative 6.2.3 · Storm Response Coordination Platform**
Owner: Luke Hollister (field), Sophia Lindqvist (customer comms)
Executive sponsor: Nicole Hargrave-Park
Scope: Cross-subsidiary storm response coordination platform enabling unified view of events, crew deployment, mutual assistance coordination, and customer communications during major weather events
Timeline: 24-month program
Current status: Design phase; tied to Storm Response Coordination Fragmentation pattern (7.3)

**Initiative 6.2.4 · Cybersecurity Modernization Program**
Owner: Rachel Navarro
Executive sponsor: Jonathan Aldridge
Scope: Enterprise cybersecurity modernization, including OT/IT convergence, zero-trust architecture, identity and access management, NERC CIP compliance maturation, incident response capability expansion
Timeline: Three-year program
Current status: First phase (identity modernization) in execution; OT cyber assessment complete

**Initiative 6.2.5 · Cloud Migration and Platform Consolidation**
Owner: Hideki Tanaka
Executive sponsor: Jonathan Aldridge
Scope: Enterprise cloud migration from aging on-premise data centers; consolidation of application portfolio from 650+ applications to approximately 380; platform standardization on approved cloud-native architectures
Timeline: Multi-year program
Current status: 28% of applications migrated; platform consolidation in design

**Initiative 6.2.6 · AI Platform and Governance Program**
Owner: Daniel Whitlock
Executive sponsor: Jonathan Aldridge
Scope: Enterprise AI platform development, AI governance framework, shadow AI tool consolidation, AI ethics and safety framework, data foundations for AI workloads
Timeline: 18-month program (urgent given shadow AI pattern)
Current status: Ramping up; closely coupled to pattern 7.1

**Initiative 6.2.7 · Autonomous Drone Inspection Program**
Owner: Daniel Whitlock (AI/analytics) and James Oppenheim (operations)
Executive sponsor: Nicole Hargrave-Park
Scope: Deploy autonomous drone systems for transmission asset inspection, leveraging AI for defect detection, replacing or augmenting current helicopter-based inspection model
Timeline: Two-year program, pilot-to-production
Current status: Pilot complete on 340-mile transmission corridor; production deployment scoping

**Initiative 6.2.8 · Generative AI Storm Outage Prediction**
Owner: Daniel Whitlock (models), Luke Hollister (operational application)
Executive sponsor: Nicole Hargrave-Park
Scope: Generative AI models for storm impact prediction, crew staging optimization, and outage duration prediction to improve storm response and customer communication
Timeline: 18-month program
Current status: Model development; tied to Storm Response Coordination Platform initiative

### 6.3 · Grid Edge and DER Initiatives

**Initiative 6.3.1 · DERMS (Distributed Energy Resource Management System) Deployment**
Owner: Kavitha Subramaniam
Executive sponsor: Nicole Hargrave-Park
Scope: Enterprise DERMS platform enabling visibility and control of distributed solar, battery storage, EV charging, and flexible loads across six subsidiaries
Timeline: Multi-year program
Current status: Platform selection complete; phased deployment beginning in Q2 2026

**Initiative 6.3.2 · EV Charging Infrastructure Program**
Owner: Warren Okafor (strategy), Kavitha Subramaniam (engineering)
Executive sponsor: Marcus Kittrell (CEO strategic priority)
Scope: Deploy EV charging infrastructure including make-ready programs, fleet vehicle electrification at Keystone, and tariff designs supporting EV adoption
Timeline: Multi-year, state-by-state
Current status: Varies significantly by jurisdiction; Maryland and Illinois most advanced

**Initiative 6.3.3 · Renewable Interconnection Queue Management**
Owner: James Oppenheim (operations), Angela Yamamoto (federal/PJM coordination)
Executive sponsor: Calvin Shenker
Scope: Process modernization and platform deployment for managing the interconnection queue for distributed and grid-scale renewables, reducing interconnect lead times
Timeline: Multi-phase
Current status: Phase 1 complete; Phase 2 in execution

### 6.4 · Regulatory and Strategic Initiatives

**Initiative 6.4.1 · Rate Case Strategy Execution (Four Active Cases)**
Owner: Danielle Westergaard
Executive sponsor: Calvin Shenker, Elena Vosburgh
Scope: Active rate cases in Illinois (Riverbend), Maryland (KEG), New Jersey (ASE), and Delaware (DPS) · combined $2.1B in annualized revenue requirement being sought
Timeline: Expected orders between Q2 2026 and Q4 2026
Current status: All four cases in active proceedings; testimony phase or settlement discussions

**Initiative 6.4.2 · Large Load Tariff Filings**
Owner: Calvin Shenker, Danielle Westergaard (coordinator)
Executive sponsor: Marcus Kittrell
Scope: Coordinated multi-state large load tariff filings to shape cost allocation and service terms for the data center interconnection surge
Timeline: Filings in four jurisdictions during 2026
Current status: Illinois filing submitted March 2026; Maryland and Pennsylvania filings in preparation

### 6.5 · Workforce and Community Initiatives

**Initiative 6.5.1 · Workforce Modernization Initiative**
Owner: Camille Thibodeaux
Executive sponsor: Derek Braithwaite
Scope: Address transmission engineering workforce attrition; apprenticeship program expansion; mid-career re-skilling; leadership development for the hybrid operations/technology future
Timeline: Multi-year initiative
Current status: Apprenticeship expansion approved; re-skilling program in design

**Initiative 6.5.2 · Community Workforce Development Program**
Owner: Keisha Marchant
Executive sponsor: Priya Mehta (strategy), Derek Braithwaite (delivery)
Scope: Community-based workforce development programs tied to the IMPACT framework; partnerships with community colleges, historically Black colleges and universities, and community-based organizations in service territory communities
Timeline: Ongoing
Current status: Active programs in 14 communities; expansion planned

**Initiative 6.5.3 · Rural and Underserved Community Investment Program**
Owner: Warren Okafor (strategy), Keisha Marchant (community engagement)
Executive sponsor: Priya Mehta
Scope: Targeted infrastructure investment and community partnership in rural and underserved communities within service territory
Timeline: Multi-year
Current status: Active

### 6.6 · Financial Infrastructure Initiatives

**Initiative 6.6.1 · ESG Reporting Platform Unification**
Owner: Melissa Strickland (reporting), Warren Okafor (strategy)
Executive sponsor: Elena Vosburgh, Warren Okafor
Scope: Unified ESG reporting platform to support increasing regulatory and investor disclosure requirements; data integration across six subsidiaries
Timeline: 18-month program
Current status: Design phase

**Initiative 6.6.2 · Billing System Consolidation Assessment**
Owner: Sophia Lindqvist
Executive sponsor: Jonathan Aldridge
Scope: Assessment and initial architecture for consolidation of the six legacy billing systems inherited from subsidiary histories; aimed at enabling the Customer Self-Service Portal Transformation
Timeline: 12-month assessment; multi-year execution
Current status: Current-state analysis underway

---

## Part 7 · Active Patterns Observable in Keystone Data

These are the seven patterns that AbarVa's intelligence layer should surface when reasoning about Keystone. Each pattern is grounded in specific evidence and represents a cross-functional decisioning challenge where AbarVa's unique value proposition applies.

### 7.1 · Pattern: Shadow AI in Customer Operations and Grid Analytics

**Narrative.** Keystone has accumulated approximately $1.6M in annualized spending across 11 fragmented AI and AI-adjacent tools authorized by individual teams without central oversight, despite the stated enterprise AI Platform and Governance Program.

**Evidence.**
- Procurement records showing 11 distinct vendor engagements under the $150K threshold that does not require CIO-level review
- Specific vendors including: an AI customer-service summarization tool used by three subsidiaries' call center operations, a document analysis tool used by regulatory affairs, a code generation assistant used in portions of IT and data engineering, a generative AI writing tool used by communications and rate case support staff, a predictive maintenance analytics tool deployed in field operations, a transcription tool used in legal and executive meetings, a meeting assistant used by multiple executive assistants, a sales enablement tool adopted by the commercial accounts function, an outage communications draft tool piloted in one subsidiary's customer service, a general-purpose AI assistant seat allocation that has grown beyond central authorization, and a storm forecasting analytics tool piloted by two subsidiaries independently
- Team members using these tools span 17 identified functional teams across Customer Operations, Rate Case Support, Regulatory Affairs, Field Operations, IT, Data Engineering, Communications, Legal, and Executive Support
- Contractual review status: 7 of 11 have auto-renewal clauses; 4 of 11 have data sharing terms that were not reviewed by Legal for critical infrastructure data implications
- Financial impact: approximately $1.6M in annual spend visible in procurement data; indirect productivity impact unquantified; critical infrastructure data exposure risk unquantified

**Reasoning.**
- Procurement data aggregated across tool purchases below central review threshold
- Vendor categorization applied to identify AI-adjacent tools
- Team usage inferred from single-sign-on logs and expense reports
- Contract review status pulled from legal database gaps
- Contradiction detection: Jonathan Aldridge's first-month communications affirming enterprise AI governance reconciled against evidence of decentralized procurement continuing post-affirmation
- Central AI investment (forthcoming Enterprise AI Platform and Governance Program) being undermined by decentralized spend predating it
- Governance gap between AI strategy articulation (February 2026) and operational control
- Critical infrastructure data sharing and cybersecurity risk from unreviewed contracts (especially concerning given NERC CIP compliance implications)
- Opportunity cost of fragmented tools vs centralized platform
- Pattern has analog in Apex Retail Group (Shadow AI) and First Capital Financial (Shadow AI in Compliance), suggesting cross-industry decisioning challenge

### 7.2 · Pattern: Data Center Load Interconnection Queue Bottleneck

**Narrative.** Keystone's interconnection queue has grown from 14 GW in early 2024 to 32 GW by late 2025, with study-phase processing time averaging 18 months against a target of 9 months. Real economic opportunity cost from queue delay combined with customer rate impact concerns from accelerated capital requirements create cross-functional tension between Utility Operations (study throughput), Regulatory Affairs (tariff design), Finance (financing pace), and Customer Service (affordability communications).

**Evidence.**
- Interconnection queue data: 32 GW pending as of December 2025 (from 14 GW January 2024)
- Study-phase duration data: average 18 months, target 9 months
- Transmission engineering staff capacity data: 247 engineers for study phase work, need assessed at 390
- Large-load tariff filings: Illinois (submitted March 2026), Maryland (in preparation), Pennsylvania (in preparation), New Jersey (scoping)
- FERC engagement: active participation in PJM co-location rulemaking (FERC Order on PJM, December 2025)
- Financial impact: estimated $1.4B in delayed revenue opportunity; estimated $340M in accelerated transmission investment requiring rate recovery
- Customer rate impact modeling: projected residential rate increase of 4-6% over 2026-2028 if all allocated to general customer base without large-load cost allocation

**Reasoning.**
- Queue data from interconnection management system
- Capacity data from HR workforce systems
- Tariff data from regulatory affairs filing records
- FERC/PJM engagement from federal regulatory affairs logs
- Financial impact modeling from Finance strategy work
- Customer rate impact from rate case modeling
- Cross-functional decisioning required: Utility Operations cannot resolve unilaterally; Regulatory Affairs cannot resolve unilaterally; Finance cannot resolve unilaterally; the path forward requires coordinated action
- This is the single most consequential cross-functional decision facing Keystone in 2026

### 7.3 · Pattern: Storm Response Coordination Fragmentation

**Narrative.** Storm response coordination across Keystone's six operating subsidiaries shows measurable fragmentation. During the December 2024 cross-regional ice storm event, mutual assistance coordination between subsidiaries required 14 separate inter-company handoffs, with customer communication lag times averaging 34 minutes from event occurrence to customer notification. Post-event review identified 7 specific coordination failure modes recurring across multiple major weather events.

**Evidence.**
- December 2024 ice storm after-action report
- Specific coordination failures documented: crew dispatch miscommunication (3 incidents), conflicting customer communications from subsidiary customer service teams (2 incidents), mutual assistance onboarding delays (4 incidents), outage management system data synchronization lag (multiple instances), IVR script fragmentation across subsidiaries (systemic), social media response misalignment (2 incidents)
- Historical storm event data across 11 major weather events 2023-2025
- Customer satisfaction data: material CSAT degradation in post-storm survey periods
- Mutual assistance network performance data
- System integration map showing disparate outage management systems across subsidiaries (4 different OMS platforms)

**Reasoning.**
- After-action reports from multiple storm events
- Customer satisfaction survey data during and after storm events
- System integration assessment showing OMS fragmentation as root cause
- Cross-functional decisioning required: Field Operations cannot unilaterally resolve; Customer Service cannot unilaterally resolve; IT cannot unilaterally resolve; the Storm Response Coordination Platform initiative (6.2.3) is the direct response
- Pattern directly connects to climate change trend of more frequent extreme weather events
- Has downstream regulatory implications — state PUCs scrutinize major storm events and regulatory orders may mandate specific coordination capabilities

### 7.4 · Pattern: Grid Modernization Capital vs Rate Recovery Gap

**Narrative.** Keystone is deploying capital faster than the regulatory recovery cycle is approving it, creating a growing gap between deployed rate base and recognized rate base. As of end of 2025, approximately $1.8B of deployed capital investment is in regulatory lag status, awaiting approval in the current rate case cycle. Financing this gap has implications for the capital structure, credit ratings, and cost of capital.

**Evidence.**
- Deployed capital vs recognized rate base reconciliation: $62B deployed vs $60.2B recognized
- Regulatory lag data: average 14 months from deployment to approved recovery
- Financing cost analysis: approximately $92M annualized cost of carry on the capital in lag status
- Credit rating agency commentary: multiple agency reports noting the increasing capital deployment pace as a credit consideration
- Rate case cycle timing data: four active cases with expected approvals Q2-Q4 2026

**Reasoning.**
- Capital deployment data from financial systems
- Rate base data from regulatory accounting
- Financing cost from treasury analysis
- Credit agency reports
- Cross-functional decisioning: Finance drives capital deployment pace and financing strategy; Regulatory Affairs drives rate case filing timing and strategy; Operations drives actual deployment; the coordinated orchestration is precisely the kind of cross-function problem AbarVa addresses
- Pattern has tight coupling with Patterns 7.2 (data center load driving accelerated capital) and 7.7 (regulatory coordination gap)

### 7.5 · Pattern: AMI Data Underutilization

**Narrative.** Keystone's AMI 1.0 infrastructure (deployed 2013-2016) generates approximately 18 terabytes of interval meter data annually across the six subsidiaries. Analysis shows that less than 12% of this data is systematically used in business decisions, customer-facing features, or analytical models. The AMI 2.0 deployment will multiply the data volume by 4-6x while the underlying data utilization problem remains unaddressed.

**Evidence.**
- AMI data volume assessment: 18 TB annual from current infrastructure
- Data utilization audit: 12% systematic use in analytical models or customer-facing features
- Specific underutilization points: predictive outage analytics (capability exists, deployed in 2 of 6 subsidiaries), distribution loss analysis (capability exists, applied partially), energy usage customer insights (deployed, 23% customer adoption), demand response program optimization (deployed, limited analytical refresh), DER hosting capacity analysis (nascent)
- Use case inventory: 34 identified analytical use cases, 7 in production, 11 piloted, 16 unimplemented
- AMI 2.0 data volume projection: 68-108 TB annual post-deployment

**Reasoning.**
- Data volume measured at AMI head-end systems
- Utilization audit conducted by Daniel Whitlock's organization Q4 2025
- Use case inventory from enterprise analytics strategy work
- AMI 2.0 volume projections from deployment engineering
- Cross-functional decisioning: Data organization owns analytical platform; Customer Experience organization owns customer-facing features; Distribution Engineering owns grid analytics; all three need coordinated prioritization against limited analytics capacity
- Pattern connects to AI Platform initiative (6.2.6) — AI models depend on high-quality data foundations; AMI data underutilization is a foundational constraint

### 7.6 · Pattern: Workforce Attrition in Specialized Grid Operations

**Narrative.** Transmission engineering and substation engineering at Keystone show annualized turnover of 27%, against a target of 14% and a long-run historical average of 11%. The specific attrition is concentrated in the 8-15 years experience band — the engineers who have the institutional knowledge of the grid but are not yet at retirement age. This creates compounding risk: the capital program acceleration requires more engineering capacity precisely when experienced engineers are most available to leave.

**Evidence.**
- Turnover data from HR systems: 27% annualized transmission/substation engineering vs 14% target
- Tenure distribution of attrition: 8-15 year band shows 43% of departures
- Destination data on departing engineers: 58% moving to renewable developer or independent power producer companies, 22% moving to peer regulated utilities, 12% moving to transmission planning consulting, 8% other
- Compensation benchmark data: Keystone 25th-50th percentile vs industry
- Replacement cost data: average 18 months to fully productive capability
- Capital program impact: transmission engineering capacity constraint is a top-3 risk to capital plan execution

**Reasoning.**
- HR data on turnover, tenure, and exit interviews
- Compensation benchmarking from industry compensation surveys
- Destination company data from exit interviews
- Capital program risk registers from enterprise program management
- Cross-functional decisioning: HR drives compensation strategy; Operations drives engineering work assignment and career paths; Finance constrains compensation pool; coordinated strategy required to address the pattern
- Pattern connects to Workforce Modernization Initiative (6.5.1)
- Strategic implication: competitor renewable and IPP companies attracting Keystone talent is accelerating at exactly the moment Keystone needs to accelerate deployment

### 7.7 · Pattern: Cross-Jurisdictional Regulatory Coordination Gap

**Narrative.** Keystone operates across 5 state PUCs, plus DC PSC, plus FERC and NERC federal oversight. The filing cycles, regulatory philosophies, allowed ROE ranges, and substantive priorities of these 8 regulatory bodies vary materially. Keystone's current regulatory approach is subsidiary-by-subsidiary rather than coordinated, missing opportunities for consistency in strategy and creating risk when subsidiary regulators diverge.

**Evidence.**
- Rate case filing cycle data across six subsidiaries: no two subsidiaries have aligned rate case timing
- Allowed ROE variance: range of 9.25% (Maryland) to 10.10% (Pennsylvania) in current rate base
- Capital plan allocation variance: $ per customer allocated ranges 45% higher in some subsidiaries vs others
- Rate design variance: large load tariff approach varying significantly across jurisdictions
- Intervenor coalition overlap analysis: many intervenors active across multiple jurisdictions with aligned positions
- Regulatory affairs staffing: subsidiary-level teams with limited enterprise coordination infrastructure

**Reasoning.**
- Regulatory filing data from all six subsidiaries
- Historical rate case outcome data
- Intervenor position analysis across cases
- Enterprise regulatory affairs organizational assessment
- Cross-functional decisioning: Regulatory Affairs (at enterprise level), subsidiary Presidents (at operational level), CFO (financing implications), CEO (political relationships), coordinated approach required
- Pattern connects to Large Load Tariff filings (6.4.2) — the first real test of multi-state coordinated filing strategy
- Strategic implication: current subsidiary-by-subsidiary approach is mature but not optimal; the Phase 4 transformation opens an opportunity to rationalize regulatory coordination infrastructure

---

## Part 8 · Vendor and Technology Landscape

Keystone operates an enterprise technology estate typical of a large post-separation regulated utility, with significant legacy footprint combined with accelerating modern platform adoption.

### 8.1 · Core operational systems

- **Customer Information Systems.** Four distinct billing platforms across the six subsidiaries. Riverbend and Keystone Electric & Gas on legacy mainframe-based platforms (target for billing system consolidation assessment). Commonwealth Power & Light on a mid-generation vendor platform. Potomac Energy Services, Atlantic Shore Electric, and Delmarva Power Services share a fourth platform acquired through earlier utility M&A.
- **Outage Management Systems.** Four distinct OMS platforms across the six subsidiaries, contributing to storm response coordination fragmentation pattern (7.3).
- **Energy Management System.** Enterprise transmission operations EMS, single platform across all six subsidiaries.
- **Distribution Management System.** Modern DMS with ADMS (Advanced DMS) capability in three of six subsidiaries; legacy DMS in the other three.
- **Asset Management System.** Single enterprise platform (SAP-based) for asset records and maintenance management.
- **Work Management System.** Consolidated enterprise platform with subsidiary-specific configurations.
- **Geographic Information System.** Enterprise Esri ArcGIS footprint with utility-specific overlays.
- **AMI Head-End Systems.** Two vendor AMI platforms across the footprint (one covering 4 of 6 subsidiaries, one covering 2).
- **Historian and Data Platform.** AVEVA PI System for operational data, deployed enterprise-wide.

### 8.2 · Enterprise and corporate systems

- ERP: SAP S/4HANA (mid-migration from SAP ECC, approximately 60% complete)
- HCM: Workday
- CRM: Salesforce with utility vertical extensions
- Regulatory Filings Management: custom in-house platform integrated with state-specific commission filing portals
- Financial Planning: Oracle EPM
- Document Management: Microsoft SharePoint and Documentum (legacy, in-migration)

### 8.3 · Cloud and data platform

- Cloud providers: Microsoft Azure (primary) and AWS (secondary, selective workloads)
- Data platform: Azure Data Lake, Databricks for analytical workloads, Snowflake for selected customer data
- AI/ML platform: multi-vendor (part of the platform consolidation initiative)

### 8.4 · Digital and customer channels

- Customer portals: six subsidiary-specific portals in process of consolidation (initiative 6.2.1)
- Mobile apps: two mobile apps across the portfolio, to be consolidated
- IVR and contact center: modern IVR platform (cloud-based), contact center platform NICE CX
- Outage communications: multi-channel (SMS, email, push, voice) with known fragmentation issues across subsidiaries

### 8.5 · Cybersecurity

- SIEM: enterprise Splunk deployment
- Identity: Microsoft Entra ID with zero-trust architecture in-progress
- OT cyber: dedicated OT cybersecurity program; air-gapped OT networks with defined DMZ architecture
- NERC CIP compliance: dedicated program, audit cycle current

### 8.6 · Strategic vendor relationships

- Technology consulting: multiple tier-1 firms engaged, none with exclusive relationship
- Engineering consulting: established relationships with three major utility engineering firms
- Grid modernization: direct relationships with major OEMs (GE Vernova, Siemens Energy, Hitachi Energy, Schneider Electric)
- AI and ML vendors: selective engagements including OpenAI API usage (enterprise contract), Anthropic API (pilot contract), NVIDIA (infrastructure partnership)
- Strategic alliances: Argonne National Laboratory (research partnership), participation in EPRI (Electric Power Research Institute)

### 8.7 · Data center partnerships

- Hyperscale data center developers engaged in interconnection discussions across service territory
- Direct relationships being built with several major hyperscalers on co-location arrangements
- Power supply arrangement evaluation ongoing in three of the six subsidiaries

---

## Part 9 · Prior AbarVa Program History at Keystone

**Note for ingestion:** The following represents the notional prior engagement history that the AbarVa platform would reference. At time of Tim Peterson test drive, this is forward-state and can be ingested as seed data for agent context.

### 9.1 · Engagement zero — Phase 0 Intake (notional, for test drive)

**Status.** Pre-test-drive. In the notional engagement history that the Keystone tenant represents, no prior AbarVa engagement has completed. The first engagement is the Phase 0 discovery that begins when Tim's test drive starts.

### 9.2 · Forward state placeholder initiatives

Placeholder for future engagement history:
- Phase 0 Discovery — Large Load Interconnection Decisioning (scoped)
- Phase 0 Discovery — Cross-Subsidiary Customer Experience Coordination (scoped)
- Phase 0 Discovery — Shadow AI Platform Consolidation (scoped)

These placeholder entries signal to the agent that Keystone has been positioned for three initial engagement directions that align with patterns 7.1, 7.2, and cross-subsidiary coordination gaps.

---

## Part 10 · Benchmarks and Peer Data Layer

Keystone's peer benchmarking architecture leverages publicly-available data from peer regulated utility holding companies. The peer set is structured to enable meaningful comparison while respecting each peer's distinct business model nuances.

### 10.1 · Primary peer set

The Keystone peer benchmarking primary set comprises nine regulated utility holding companies, selected for scale similarity, business model similarity (T&D focus), and data availability:

- Exelon Corporation (EXC) — the closest structural peer; Chicago HQ; 10.7M customers; 5 states + DC; $23B revenue; $38B+ capital plan
- Xcel Energy (XEL) — 6M customers across 8 states; $14B revenue; $45B+ capital plan; integrated but largely regulated
- PPL Corporation (PPL) — Pennsylvania, Kentucky, Rhode Island; $8.5B revenue
- DTE Energy (DTE) — Michigan; $13B revenue; primarily regulated
- Ameren Corporation (AEE) — Missouri, Illinois; $7.6B revenue; primarily regulated
- Consolidated Edison (ED) — New York; $15B revenue; regulated
- Eversource Energy (ES) — New England states; $12.3B revenue; regulated
- NiSource (NI) — multi-state gas and electric; $5.5B revenue; regulated
- WEC Energy Group (WEC) — Wisconsin primary; $9.2B revenue; primarily regulated

### 10.2 · Extended peer set

For specific benchmarking dimensions, Keystone extends to a larger set of utilities for appropriate comparison:

- Grid modernization capital benchmarking: Duke Energy, Southern Company, Dominion Energy, American Electric Power
- Clean energy transition benchmarking: NextEra Energy, Edison International (SCE)
- Customer experience benchmarking: utilities in top-quartile J.D. Power scores regardless of geography
- Cybersecurity maturity benchmarking: all NERC CIP-obligated entities

### 10.3 · Primary benchmark categories

**Financial performance benchmarks.**
- Revenue growth rate (Keystone: 5.8% YoY, peer median: 4.2%)
- Rate base CAGR (Keystone: 7.2% target, peer median: 6.8%)
- Adjusted operating EPS growth (Keystone: 5-7% target, peer median: 5.2%)
- Allowed ROE weighted average (Keystone: 9.5%, peer median: 9.6%)
- Return on invested capital

**Operational reliability benchmarks.**
- System Average Interruption Duration Index (SAIDI) — Keystone top quartile; peer median benchmark
- System Average Interruption Frequency Index (SAIFI) — Keystone top quartile
- Customer Average Interruption Duration Index (CAIDI) — Keystone mid-pack
- Worker safety metrics (OSHA DART rate) — Keystone mid-pack

**Customer experience benchmarks.**
- J.D. Power residential customer satisfaction (Keystone mid-pack; improvement target)
- Digital self-service adoption rate
- First call resolution rate
- Customer complaint rate

**ESG and sustainability benchmarks.**
- Scope 1 and 2 GHG intensity
- Scope 3 measurement coverage
- ESG ratings from MSCI, Sustainalytics, ISS
- Workforce diversity metrics

**Capital efficiency benchmarks.**
- Capital deployed per customer
- Transmission capital deployed per MW of peak demand
- Distribution capital deployed per customer
- Operating expense per customer

**Regulatory performance benchmarks.**
- Rate case cycle time
- Allowed ROE achievement rate vs requested ROE
- Intervenor settlement rate

### 10.4 · Non-peer data sources seeded

In addition to peer utility data, Keystone's intelligence layer draws on:

- SEC EDGAR filings for all peer and broader utility universe
- Earnings call transcripts for peer set (quarterly)
- Analyst research (Wall Street utility sector coverage)
- EEI (Edison Electric Institute) industry data
- NERC reliability standards and reports
- FERC filings and rulemakings
- State PUC filings (across all six Keystone jurisdictions plus peer jurisdictions)
- PJM market data and auction results
- Industry trade publications (Utility Dive, RTO Insider, T&D World)
- Regulatory consulting firm reports
- Rating agency utility sector reports
- Department of Energy large load interconnection filings
- NARUC (National Association of Regulatory Utility Commissioners) reports
- EPRI (Electric Power Research Institute) research
- National lab research (Argonne, NREL, ORNL)

---

## Part 11 · Data Room Inventory · What AbarVa Has Ingested

The following inventory represents the data room composition for Keystone. This is what Sentinel, Nexus, Atlas, and Steward can draw upon when reasoning about Keystone.

### 11.1 · Corporate and financial data

- Public filings: 10-K (2022, 2023, 2024, 2025), 10-Q quarterly filings, 8-K material event filings, proxy statements
- Earnings materials: quarterly earnings releases, slides, call transcripts (last 12 quarters)
- Investor communications: annual investor day materials, sustainability reports, credit investor materials
- Rating agency reports: S&P, Moody's, Fitch utility sector and Keystone-specific
- Capital plan documentation: four-year capital investment plan 2025-2028, subsidiary-level capital budgets
- Financial planning data: three-year financial plan, annual budget, monthly actual vs plan
- Credit profile: debt schedules, rating history, financing history

### 11.2 · Regulatory data

- Rate case filings (active cases in Illinois, Maryland, New Jersey, Delaware)
- Historical rate case records (last ten years across all six jurisdictions)
- State PUC orders and docket records
- FERC filings (formula rate filings, interconnection filings, tariff filings)
- PJM market filings and participation records
- Large load tariff filings (Illinois submitted, others in preparation)
- NERC CIP compliance evidence
- Intervenor position analysis across multiple cases

### 11.3 · Operational data

- Reliability metrics: daily, monthly, annual SAIDI/SAIFI/CAIDI by subsidiary and enterprise
- Storm event data: major weather event reports (last 5 years)
- Customer service metrics: call volumes, handle times, first call resolution, CSAT by subsidiary
- Digital channel metrics: self-service adoption, digital transaction volume, mobile usage
- Outage data: outage events, duration, cause, restoration metrics
- AMI data: interval meter data (head-end and processed)
- Asset management data: substation data, transmission asset records, distribution asset records
- Field workforce data: crew deployment, work order completion, productivity metrics

### 11.4 · Strategic and planning data

- Enterprise strategy documents: 2026 Strategic Plan, refresh materials
- Initiative charters and business cases for major initiatives
- Integration documents from the 2022 corporate separation
- Benchmarking studies (internal and external)
- Scenario planning materials
- Competitive intelligence on peer utilities
- M&A evaluation records (historical)

### 11.5 · Organizational and workforce data

- Organizational charts (enterprise and by subsidiary)
- Workforce analytics: headcount, turnover, compensation benchmarking
- Leadership succession planning (executive level)
- Labor relations: IBEW and UWUA contract terms, grievance data, arbitration history
- Diversity and equity metrics
- Workforce development program data

### 11.6 · Customer and community data

- Customer demographic data (aggregate, compliant with privacy requirements)
- Rate impact modeling by customer class
- Community investment records
- Low-income program enrollment and energy burden data
- Service territory economic data

### 11.7 · Technology and system data

- Application inventory (650+ applications cataloged)
- System architecture diagrams
- Integration maps
- Vendor contracts (full contract inventory)
- Cybersecurity posture: vulnerability assessments, penetration testing, NERC CIP audits
- Incident response history (no disclosure-required incidents in last three years)
- Cloud deployment data (Azure, AWS utilization and spend)
- AI/ML use case inventory and deployment tracking

### 11.8 · Industry and external data

- Peer utility public filings and analyst reports
- Utility industry trade publications and subscription research
- FERC and NERC rulemakings and technical conferences
- DOE policy and technical publications
- National lab research outputs (Argonne, NREL, ORNL, PNNL)
- Climate and weather data (NOAA, NWS)
- Economic indicators by state
- PJM market data (locational marginal prices, capacity auctions)

---

## Part 12 · How This Data Flows to Agents

### 12.1 · Nexus (Programs / Maestro)

When Nexus initiates Phase 0 engagement with a Keystone stakeholder (e.g., Jonathan Aldridge, Calvin Shenker, Marcus Kittrell), the agent has available:
- Full identity and role context on the person being engaged
- Enterprise strategic priorities (Part 3)
- Current active initiatives relevant to that person's scope (Part 6)
- Patterns that are active and visible in the person's domain (Part 7)
- Financial and regulatory context relevant to decisioning
- Tone and communication style adjusted to the person's profile

Example: if Nexus is engaging Jonathan Aldridge specifically, it surfaces shadow AI pattern (7.1), his Phase 4 mandate, the three scoped engagement directions (9.2), and communicates in the measured, systems-oriented tone that matches his public voice.

### 12.2 · Sentinel (Intelligence)

Sentinel draws from the data room inventory (Part 11) and the pattern library (Part 7) to generate intelligence outputs. For Keystone, Sentinel's intelligence surfaces include:
- Situation Intelligence: grounded in Keystone's operational reality across six subsidiaries
- Portfolio Intelligence: how initiatives cross-connect, which are at risk of collision
- Pattern Intelligence: the seven active patterns surfaced with evidence chains
- Benchmark Intelligence: peer comparisons contextualized for Keystone
- Risk Intelligence: regulatory, operational, financial, cyber, workforce
- Opportunity Intelligence: the large-load interconnection surge as both opportunity and risk
- Evidence Intelligence: traceability from source data to conclusions

### 12.3 · Atlas (Portfolio / Tower)

Atlas reasons across the Keystone tenant's engagements (once they exist) and across the broader tenant portfolio (including Apex Retail Group, Meridian Health System, First Capital Financial). Cross-tenant pattern observations include:
- Shadow AI pattern visible in all four composites — industry-independent
- Cross-functional decisioning challenge in newly combined C-suite roles — Jonathan at Keystone, the Prat-analog at Apex, Tim-analog roles emerging across sectors
- Regulatory intensity variance as organizational design driver — Keystone (6+ regulators) higher than First Capital (handful) which is higher than Apex (few) which is lower than Meridian (few sector-specific regulators but less operational constraint)

### 12.4 · Steward (Platform Administration)

Steward administers the Keystone tenant, including org structure, user access, data governance, and platform configuration. Keystone tenant specifics:
- Tenant isolation: Keystone data must not be cross-exposed to other tenants, with cohort-level benchmarking as the only approved cross-tenant data flow
- Subsidiary role model: user permissions can be scoped to subsidiary level (e.g., a CPL Pennsylvania user seeing only CPL data vs. enterprise users seeing all subsidiaries)
- External advisor access: approval model for external advisor access (consultants, auditors, regulators in specific disclosure scenarios)
- Regulatory audit trail: change log and access log retention aligned with utility regulatory requirements

---

## Part 13 · What Tim Should Experience in the Demo

Tim Peterson — Keystone's analog executive to himself at Exelon — is the intended human receiving the Keystone-tenant demo. The demo experience should be structured to let Tim see what it feels like when an AI agent genuinely understands his world.

### 13.1 · The opening moment

Tim opens the Keystone tenant. Nexus initiates with a greeting that reflects genuine knowledge of his role: the combined Customer and Technology Officer mandate, the two-month role tenure, the Phase 4 transformation context. The greeting does NOT say "Hi Tim!" — it says something closer to "Jonathan — I've been reviewing what's on your plate. Two months into the combined role, four active rate cases in the background, the large-load interconnection queue, and the AI platform program ramping up. Want to start with the shadow AI pattern I surfaced, or go somewhere else?"

(Agent uses "Jonathan" here because Jonathan is the composite analog in the Keystone tenant. The demo framing that Tim sees is: "This is what it would feel like if you were Jonathan at Keystone. Observe what the agent knows.")

### 13.2 · The five scenes

**Scene 1 · Situation Awareness.** Agent surfaces the current state: the four active rate cases, the large-load interconnection queue data (32 GW), the capital deployment pace, the Phase 4 transformation operating tempo, the shadow AI observation. Tim should feel: *"the agent understands my actual situation, not a generic utility situation."*

**Scene 2 · Pattern Specificity.** Agent walks through the Shadow AI pattern (7.1) with specific tool names, specific subsidiary-level adoption patterns, specific contract risk points. Tim should feel: *"this is real operational detail, not analyst-consulting generalities."*

**Scene 3 · Cross-Functional Decisioning.** Agent demonstrates reasoning about the Large Load Interconnection pattern (7.2) across Operations, Regulatory, Finance, and Customer, showing how the decision requires coordinated action that single-function AI cannot provide. Tim should feel: *"this is the exact problem I articulated on LinkedIn — and the agent is addressing it, not avoiding it."*

**Scene 4 · Portfolio Perspective.** Agent surfaces the 22 active initiatives organized by strategic priority, identifies collisions, and highlights the Customer Experience Transformation mandate. Tim should feel: *"this gives me a perspective on my portfolio that my current tools don't give me."*

**Scene 5 · Phase 4 Strategic Input.** Agent offers a considered perspective on the Phase 4 transformation itself — the cross-subsidiary coordination challenge, the combined Customer + Tech operating model, the critical first decisions. Tim should feel: *"this is a thought partner that's worth my time."*

### 13.3 · The closing moment

Tim closes the session. Nexus offers a recap of what was surfaced, the scoped engagements available, and a direct ask for his critique. Tim should feel: *"this is something I can send a colleague to. This is something I want to send to Marcus at Keystone-analog. This is real."*

The goal is not that Tim commits to becoming a design partner in this session. The goal is that Tim walks away thinking: *"Anand has built something real. I want to help."*

---

## Part 14 · Ingestion and Operational Notes

### 14.1 · Parser alignment

This spec is structured to match the seed-wave parser established for the three prior composite seeds (Apex, Meridian, First Capital). The canonical heading structure (Part 1 through Part 15), field labeling conventions, and internal cross-reference style should be preserved during ingestion.

### 14.2 · Tenant naming in database

Following the caveat established in PR #22 for the first three composites, `clients.name` should use the short compatibility form "Keystone Energy Holdings" (not a longer variant) while the full legal name "Keystone Energy Holdings, Inc." is preserved in legal_name and spec content.

### 14.3 · Persons to register

All named C-suite executives (Part 4) should be registered as `persons` with full person records. Operating subsidiary Presidents (Part 2.2) should be registered. SVPs named in Part 5 should be registered. This produces approximately 42 distinct person records for the Keystone tenant.

### 14.4 · VIP profile for Jonathan Aldridge

Jonathan Aldridge is the primary VIP profile for the Keystone tenant, analogous to Maria Delgado for Apex. Full VIP profile depth as specified in the VIP Profile System should be applied.

### 14.5 · Initiative and pattern registration

All 22 initiatives (Part 6) should be registered as `engagements` or `initiatives` with appropriate sponsor linkages. All 7 patterns (Part 7) should be registered as `patterns` with complete evidence chains.

### 14.6 · Organizational structure registration

The organizational structure — holding company + 6 subsidiaries + corporate functions + SVP-level extended leadership — should be captured as `org_structure` and `org_hierarchy` records.

### 14.7 · Benchmark data

Peer set data (Part 10) should populate `benchmark_data` under `org_master_data` (per the First Capital caveat on `benchmark_history` schema cache).

### 14.8 · Industry and external data sources

Per Part 11.8, the knowledge_sources for industry and external data should be registered with appropriate source type categorization.

### 14.9 · No demo narrative dependencies

Per Anand's explicit scoping directive, this seed exists to populate the Keystone tenant as a data layer only. Demo narrative (5-scene arc, greeting scripts, scenario orchestration) is NOT part of this spec. Demo narrative for the Keystone tenant is a future artifact to be authored when the Tim Peterson test drive is scheduled.

### 14.10 · Smoke test targets

Upon ingestion, the following smoke tests should validate Keystone tenant readiness:

1. "Who is the CEO of Keystone?" → Marcus W. Kittrell
2. "Who is the Chief Customer and Technology Officer?" → Jonathan Aldridge
3. "What is Keystone's large load interconnection queue?" → 32 GW with appropriate context
4. "What is the capital investment plan?" → $37B through 2028 with allocation
5. "Tell me about Keystone's shadow AI pattern." → 11 tools, $1.6M, specific vendors, Jonathan Aldridge context
6. "How many operating subsidiaries does Keystone have?" → Six, named
7. "Who is the CEO of Keystone Electric & Gas?" → Reginald Chatmon
8. "What is Keystone's clean energy commitment?" → Scope 1/2 net zero by 2040, Scope 3 by 2050

---

## Part 15 · Summary · What This Unlocks

### 15.1 · Fourth vertical beachhead

Keystone extends AbarVa's composite tenant library into regulated utilities, alongside Apex Retail (retail), Meridian Health (healthcare), and First Capital (financial services). With four verticals at composite depth, AbarVa can demonstrate cross-sector relevance while meeting utility-specific operators on their own terms.

### 15.2 · Network cohort demo enablement

The Keystone tenant enables a Tim Peterson (Exelon EVP CCTO) test drive specifically tuned to his world. This composite is designed as a relationship-signaling artifact for a mentor-class relationship, where specificity to the operator's context is part of the message itself.

### 15.3 · Utility sector-specific pattern library

Keystone's seven patterns contribute to AbarVa's enterprise pattern library with genuinely utility-specific decisioning challenges: data center interconnection as cross-functional decision, storm response coordination fragmentation, grid modernization capital versus rate recovery gap, AMI data underutilization, regulatory coordination across multi-state jurisdictions. These patterns enrich the cross-tenant intelligence capability of Atlas.

### 15.4 · Cross-composite pattern resonance

Four of Keystone's seven patterns have analogs in other composites: Shadow AI (all four composites), Cross-Functional Decisioning (parallels Apex, First Capital, Meridian), Workforce Attrition in Specialized Roles (parallels Meridian physician attrition), Regulatory Coordination Gap (parallels First Capital's BSA/AML multi-regulator challenge). These cross-composite resonances demonstrate AbarVa's core thesis: decisioning challenges are structurally similar across industries, and a platform that reasons about cross-functional decisioning applies everywhere.

### 15.5 · Next steps

- Ingest via established Codex seed-wave pipeline
- Validate with smoke tests per Part 14.10
- Hold for demo narrative authoring at time of Tim Peterson meeting scheduling
- Utilize in any utility-sector conversation or demo surface as needed

---

**END OF KEYSTONE ENERGY HOLDINGS COMPREHENSIVE SEED DATA SPECIFICATION**

*Composite authored April 21, 2026, as the fourth entry in the AbarVa composite tenant library. Structured as data-only per Anand's scoping directive. Demo narrative deferred to future authoring.*
