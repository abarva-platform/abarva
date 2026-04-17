// IT-specific intelligence data per client — tech stack, infrastructure, budget, initiatives, volumetrics

export interface AppRecord {
  name: string; vendor: string; category: string
  users: string; status: 'active' | 'pilot' | 'retiring' | 'planned'
  notes: string
}

export interface InfraItem {
  label: string; detail: string; spec: string
}

export interface BudgetLine {
  category: string; amount: string; pct: number
}

export interface Initiative {
  name: string; phase: string; owner: string
  timeline: string; budget: string
  status: 'on-track' | 'at-risk' | 'delayed' | 'planning'
  risk: string
}

export interface Volumetric {
  metric: string; value: string; benchmark: string; gap: string; criticalFor: string
}

export interface ArchNode {
  layer: string; systems: string[]; note: string
}

export interface ClientITData {
  totalApps: number; cloudPct: number; itSpend: string; aiSpend: string
  architecture: { summary: string; type: string; integration: string; data: string; cloud: string; risk: string; layers: ArchNode[] }
  techStack: AppRecord[]
  infrastructure: { datacenters: InfraItem[]; network: InfraItem[]; cloud: InfraItem[]; storage: InfraItem[] }
  budget: { total: string; fiscal: string; lines: BudgetLine[] }
  initiatives: Initiative[]
  volumetrics: Volumetric[]
}

const MERIDIAN_IT: ClientITData = {
  totalApps: 312, cloudPct: 28, itSpend: '$184M', aiSpend: '$42M',
  architecture: {
    summary: 'Federated hub-and-spoke across 47 facilities. Epic EHR migration (Q3 2026) is the defining constraint — three legacy clinical systems retiring simultaneously. No unified data platform. Hybrid cloud at 28% cloud workloads versus 65% peer median.',
    type: 'Federated Hub-and-Spoke',
    integration: 'Mirth Connect HL7 FHIR hub · 23 active interfaces · Epic integration engine (pre-go-live)',
    data: 'No unified platform · 5 siloed analytics environments · CDO vacant 9 months',
    cloud: 'Hybrid · AWS us-east-1 primary · 72% on-prem · 340 EC2 instances',
    risk: 'Epic migration consuming 80% CTO bandwidth · No CDO governance · 3 legacy EHRs retiring simultaneously',
    layers: [
      { layer: 'End Users & Clinicians', systems: ['Epic Hyperspace (go-live Q3 2026)', 'Nuance DAX ambient AI (pilot)', 'Salesforce Health Cloud', 'UKG Workforce Scheduling'], note: '28,000 staff across 47 facilities' },
      { layer: 'Revenue Cycle', systems: ['Ensemble RCM (SLA breached)', 'Epic Revenue Cycle Module', 'Waystar clearinghouse', 'Change Healthcare (backup)'], note: '$48M/yr Ensemble contract · 18.2% denial rate' },
      { layer: 'Clinical Systems (Retiring)', systems: ['Cerner EHR (8,400 users)', 'Allscripts (3 facilities)', 'Meditech (2 facilities)'], note: 'All retiring Q3 2026 · Go-live risk window open' },
      { layer: 'Integration & Data', systems: ['Mirth Connect hub', 'Azure Data Factory', 'SQL Server data warehouse (fragmented)', 'Tableau BI (42% license utilization)'], note: 'No unified data platform · 5 siloed environments' },
      { layer: 'Infrastructure', systems: ['AWS us-east-1 (340 EC2)', 'Chicago DC (owned, 400 racks)', 'Columbus DR site (hot standby)', 'Equinix CH2 colo (40 cabinets)'], note: '2.4 PB total storage · MPLS across 47 sites' },
    ],
  },
  techStack: [
    { name: 'Cerner EHR', vendor: 'Oracle Health', category: 'Clinical (retiring)', users: '8,400', status: 'retiring', notes: 'Retiring Q3 2026 · Primary risk' },
    { name: 'Epic EHR', vendor: 'Epic Systems', category: 'Clinical', users: '8,400', status: 'planned', notes: 'Go-live Q3 2026 · $68M capex' },
    { name: 'Allscripts', vendor: 'Veradigm', category: 'Clinical (retiring)', users: '1,800', status: 'retiring', notes: '3 facilities · Retiring Q3 2026' },
    { name: 'Meditech', vendor: 'Meditech', category: 'Clinical (retiring)', users: '1,200', status: 'retiring', notes: '2 facilities · Retiring Q3 2026' },
    { name: 'Ensemble RCM', vendor: 'Ensemble Health Partners', category: 'Revenue Cycle', users: '1,200', status: 'active', notes: 'SLA breached · Denial rate 18.2%' },
    { name: 'Waystar', vendor: 'Waystar', category: 'Claims Clearinghouse', users: 'N/A', status: 'active', notes: '84,000 claims/month' },
    { name: 'Nuance DAX', vendor: 'Microsoft', category: 'Clinical AI', users: '340', status: 'pilot', notes: 'Ambient documentation · 340-physician pilot' },
    { name: 'Mirth Connect', vendor: 'NextGen', category: 'Integration Engine', users: 'N/A', status: 'active', notes: '23 active HL7 interfaces' },
    { name: 'Salesforce Health Cloud', vendor: 'Salesforce', category: 'Patient CRM', users: '420', status: 'active', notes: 'Patient engagement · Partially adopted' },
    { name: 'Workday', vendor: 'Workday', category: 'HR / Finance', users: '4,200', status: 'active', notes: '3 years post-deployment' },
    { name: 'UKG Pro Scheduling', vendor: 'UKG', category: 'Workforce', users: '4,800', status: 'active', notes: 'Manual scheduling still dominant' },
    { name: 'Tableau', vendor: 'Salesforce', category: 'BI / Analytics', users: '890', status: 'active', notes: '42% license utilization — redundancy risk' },
    { name: 'ServiceNow', vendor: 'ServiceNow', category: 'ITSM', users: '650', status: 'active', notes: 'IT service management' },
    { name: 'Azure OpenAI', vendor: 'Microsoft', category: 'AI Platform', users: '45', status: 'pilot', notes: '3 disconnected pilot projects' },
    { name: 'Infor SCM', vendor: 'Infor', category: 'Supply Chain', users: '380', status: 'active', notes: 'Medical supply chain' },
  ],
  infrastructure: {
    datacenters: [
      { label: 'Chicago Main DC', detail: 'Owned · Tier 3', spec: '400 racks · 18MW · Primary production' },
      { label: 'Columbus DR Site', detail: 'Leased · Hot standby', spec: 'Full replication · 4hr RTO · 1hr RPO' },
      { label: 'Equinix CH2 Colo', detail: 'Colocation · Chicago', spec: '40 cabinets · Tier 4 facility' },
      { label: 'Clinical Edge Sites (×3)', detail: 'Hospital campuses', spec: 'Local compute for low-latency clinical apps' },
    ],
    network: [
      { label: 'WAN / MPLS', detail: 'AT&T MPLS', spec: '47 sites · 10Gbps core · 1Gbps access rings' },
      { label: 'Internet', detail: 'Dual-carrier', spec: 'CenturyLink + Comcast · BGP failover' },
      { label: 'Clinical Wi-Fi', detail: '802.11ax (Wi-Fi 6)', spec: '47 facilities · 8,400+ clinical devices' },
      { label: 'SD-WAN overlay', detail: 'In deployment', spec: '60% facilities migrated · Q4 2026 complete' },
    ],
    cloud: [
      { label: 'AWS us-east-1', detail: 'Primary cloud', spec: '340 EC2 instances · 18TB RDS · 280TB S3' },
      { label: 'Azure', detail: 'Microsoft workloads', spec: 'M365 · Teams · Azure AD · OpenAI pilot' },
      { label: 'Cloud coverage', detail: '28% of workloads', spec: 'Peer median 65% · 37-point gap' },
    ],
    storage: [
      { label: 'Total storage', detail: '2.4 PB', spec: '1.8 PB on-prem · 600 TB cloud (AWS S3 + Azure)' },
      { label: 'Clinical imaging (PACS)', detail: '820 TB', spec: 'On-prem NetApp · Growing 22% annually' },
      { label: 'Backup & archive', detail: '480 TB', spec: 'Commvault · 90-day on-prem · 7-year tape archive' },
    ],
  },
  budget: {
    total: '$184M', fiscal: 'FY2025',
    lines: [
      { category: 'Infrastructure & Operations', amount: '$72M', pct: 39 },
      { category: 'Applications & Licensing', amount: '$58M', pct: 32 },
      { category: 'AI & Innovation Initiatives', amount: '$42M', pct: 23 },
      { category: 'Security & Compliance', amount: '$12M', pct: 7 },
    ],
  },
  initiatives: [
    { name: 'Epic EHR Go-Live', phase: 'Build', owner: 'CTO Mark Rivera', timeline: 'Q3 2026', budget: '$68M capex', status: 'at-risk', risk: 'Integration testing 60 days behind · Revenue cycle understaffed · CDO vacant' },
    { name: 'AI Denial Prevention Model', phase: 'Deploy', owner: 'CIO James Park', timeline: 'M1–M8', budget: '$8.2M', status: 'on-track', risk: 'Payer contract data gap limiting model accuracy' },
    { name: 'Prior Auth Automation', phase: 'Pilot', owner: 'CMO Sarah Chen', timeline: 'Q4 2026', budget: '$6.1M', status: 'delayed', risk: 'Epic integration dependency · 6-week delay' },
    { name: 'Nuance DAX Expansion', phase: 'Pilot → Scale', owner: 'CMO', timeline: 'Q1 2027', budget: '$4.8M', status: 'on-track', risk: 'Physician adoption · Change management underway' },
    { name: 'Cloud Migration Phase 2', phase: 'Design', owner: 'IT Dept', timeline: 'Q1 2027', budget: '$12M', status: 'planning', risk: 'Dependent on Epic go-live completion' },
    { name: 'Shadow IT Rationalisation', phase: 'Assess', owner: 'CISO', timeline: 'Q2 2026', budget: '$0.8M', status: 'on-track', risk: '42% of 312 apps flagged redundant' },
    { name: 'Unified Data Platform', phase: 'Design', owner: 'CIO', timeline: 'Q2 2027', budget: '$15M', status: 'planning', risk: 'CDO vacancy blocks governance decisions' },
    { name: 'Zero Trust Security', phase: 'Deploy (40%)', owner: 'CISO', timeline: 'Q4 2026', budget: '$6M', status: 'on-track', risk: 'Scope expanding with Epic go-live' },
  ],
  volumetrics: [
    { metric: 'Total applications', value: '312', benchmark: '<150 (top quartile)', gap: '+162 apps', criticalFor: 'Rationalization roadmap' },
    { metric: 'Redundant / low-use systems', value: '42% flagged', benchmark: '<15%', gap: '-27pp', criticalFor: 'Migration simplification' },
    { metric: 'HL7 interfaces active', value: '23', benchmark: '—', gap: '—', criticalFor: 'Epic integration scope' },
    { metric: 'Clinical encounters / day', value: '12,400', benchmark: '—', gap: '—', criticalFor: 'Load/capacity planning' },
    { metric: 'Claims submitted / month', value: '84,000', benchmark: '—', gap: '—', criticalFor: 'RCM system sizing' },
    { metric: 'Claim denial rate', value: '18.2%', benchmark: '11.4%', gap: '6.8pp above', criticalFor: 'Primary AI intervention KPI' },
    { metric: 'Prior auth cycle time', value: '14 days avg', benchmark: '2 days (AI-enabled)', gap: '12 days', criticalFor: 'PA automation ROI' },
    { metric: 'Cloud workload coverage', value: '28%', benchmark: '65% peer', gap: '-37pp', criticalFor: 'Modernization target' },
    { metric: 'Storage total (PB)', value: '2.4 PB', benchmark: '—', gap: '—', criticalFor: 'Migration volume' },
    { metric: 'IT FTEs', value: '847', benchmark: '—', gap: '—', criticalFor: 'Capacity & change management' },
    { metric: 'Helpdesk tickets / month', value: '14,200', benchmark: '—', gap: '—', criticalFor: 'ITSM baseline for automation' },
    { metric: 'Epic go-live window remaining', value: '~90 days', benchmark: '—', gap: '—', criticalFor: 'CRITICAL TIMELINE CONSTRAINT' },
  ],
}

const ARCTURUS_IT: ClientITData = {
  totalApps: 240, cloudPct: 44, itSpend: '$62M', aiSpend: '$94M',
  architecture: {
    summary: 'Multi-system advisory platform with no integration layer. Bloomberg AIM, Aladdin risk, and Salesforce CRM operate as isolated silos. Advisors manually re-enter data across 3 platforms daily. Tech stack modernization is in RFP (9 months, no decision).',
    type: 'Siloed Point-to-Point',
    integration: 'No API integration layer · Manual data re-entry across 3 core platforms · Bloomberg terminal only integration',
    data: 'Snowflake licenced but not deployed as platform · Reporting in Excel and disconnected BI tools',
    cloud: 'AWS primary · 44% cloud workloads · Moving to cloud-first for new initiatives',
    risk: 'RFP stalled 9 months · No integration architecture defined · CDO vacant 11 months',
    layers: [
      { layer: 'Advisor & Client Facing', systems: ['Salesforce CRM (Classic — legacy)', 'Client web portal (static, pull-only)', 'Zoom/Teams', 'AI pilot tools (2 competing vendors)'], note: '180 advisors · 87% client retention vs 94% peer' },
      { layer: 'Investment & Portfolio', systems: ['Advent Geneva (portfolio management)', 'Aladdin risk system (BlackRock)', 'FactSet market data', 'Bloomberg AIM ($8.4M/yr)'], note: 'No integration between Advent + Aladdin + Salesforce' },
      { layer: 'Compliance & Risk', systems: ['Actimize (legacy compliance surveillance)', 'Compliance 17a-4 archive', 'Manual audit processes'], note: 'SEC exam cycle begins Q3 2026 · Surveillance at 12% coverage' },
      { layer: 'Data & Analytics', systems: ['Snowflake (licenced, undeployed)', 'Power BI (4 disconnected instances)', 'Excel-based reporting (dominant)', 'Bloomberg data terminal'], note: 'Snowflake roadmap: 6–9 months to production' },
      { layer: 'Infrastructure', systems: ['AWS us-east-1', 'Azure (M365/Teams)', 'On-prem Boston DC (legacy, 60 racks)'], note: '44% cloud · Moving cloud-first · Legacy DC exit planned Q4 2027' },
    ],
  },
  techStack: [
    { name: 'Advent Geneva', vendor: 'SS&C', category: 'Portfolio Management', users: '95', status: 'active', notes: 'Core portfolio system · No API layer' },
    { name: 'Aladdin', vendor: 'BlackRock', category: 'Risk System', users: '45', status: 'active', notes: 'Risk & compliance · Not integrated with Advent' },
    { name: 'Bloomberg AIM', vendor: 'Bloomberg', category: 'Order Management', users: '62', status: 'active', notes: '$8.4M/yr vs $5.1M peer · SLA credits $1.4M unclaimed' },
    { name: 'Salesforce CRM Classic', vendor: 'Salesforce', category: 'CRM', users: '180', status: 'active', notes: 'Legacy Classic — not Salesforce FSC · Migration planned' },
    { name: 'FactSet', vendor: 'FactSet', category: 'Market Data', users: '95', status: 'active', notes: 'Research and analytics' },
    { name: 'Actimize', vendor: 'NICE', category: 'Compliance Surveillance', users: '15', status: 'active', notes: '12% communication coverage · Manual review dominant' },
    { name: 'Snowflake', vendor: 'Snowflake', category: 'Data Platform', users: 'N/A', status: 'planned', notes: 'Licensed · Not yet deployed as enterprise platform' },
    { name: 'Power BI', vendor: 'Microsoft', category: 'BI / Analytics', users: '180', status: 'active', notes: '4 disconnected instances · Excel still dominant' },
    { name: 'Tableau', vendor: 'Salesforce', category: 'BI / Analytics (overlap)', users: '40', status: 'active', notes: 'Duplicate BI capability — rationalisation candidate' },
    { name: 'Microsoft 365', vendor: 'Microsoft', category: 'Productivity', users: '1,200', status: 'active', notes: 'Teams, Exchange, SharePoint' },
    { name: 'Adepa (legacy)', vendor: 'Adepa', category: 'Client Reporting (retiring)', users: '30', status: 'retiring', notes: 'Being replaced — no timeline set' },
    { name: 'AI Co-pilot Vendor A', vendor: 'Undisclosed', category: 'AI Advisory (pilot)', users: '45', status: 'pilot', notes: 'Pilot 1 — 60-day adoption dropped off' },
    { name: 'AI Co-pilot Vendor B', vendor: 'Undisclosed', category: 'AI Advisory (pilot)', users: '38', status: 'pilot', notes: 'Pilot 2 — competing with Vendor A · No decision' },
  ],
  infrastructure: {
    datacenters: [
      { label: 'Boston Main DC', detail: 'Owned · Legacy · 60 racks', spec: 'Exit planned Q4 2027 · Moving to cloud-first' },
      { label: 'AWS us-east-1', detail: 'Primary cloud · Growing', spec: '180 EC2 instances · 8TB RDS · 120TB S3' },
      { label: 'Azure', detail: 'Microsoft workloads', spec: 'M365, Teams, Azure AD' },
    ],
    network: [
      { label: 'Corporate WAN', detail: 'MPLS + internet failover', spec: 'Boston HQ + 3 satellite offices' },
      { label: 'Bloomberg connectivity', detail: 'Dedicated leased line', spec: 'Bloomberg B-PIPE data feeds' },
      { label: 'Advisor remote', detail: 'Cisco VPN + Zscaler ZPA', spec: '180 advisor laptops + BYOD' },
    ],
    cloud: [
      { label: 'AWS us-east-1', detail: 'Primary', spec: '180 EC2 · 8TB RDS · 120TB S3' },
      { label: 'Azure', detail: 'Microsoft ecosystem', spec: 'M365 · Azure AD · Purview compliance' },
      { label: 'Cloud coverage', detail: '44% of workloads', spec: 'On track to 70% by Q4 2026 per IT roadmap' },
    ],
    storage: [
      { label: 'Total storage', detail: '380 TB', spec: '210 TB on-prem · 170 TB cloud' },
      { label: 'Client records', detail: '120 TB', spec: 'SEC 17a-4 compliant archive · 7-year retention' },
      { label: 'Backup', detail: 'Veeam + AWS Glacier', spec: 'Daily backup · 4hr RTO · 1hr RPO' },
    ],
  },
  budget: {
    total: '$62M', fiscal: 'FY2025',
    lines: [
      { category: 'Market Data & Platforms (Bloomberg, FactSet)', amount: '$24M', pct: 39 },
      { category: 'Applications & Software Licensing', amount: '$18M', pct: 29 },
      { category: 'Infrastructure & Cloud', amount: '$12M', pct: 19 },
      { category: 'AI & Innovation (28 initiatives)', amount: '$8M', pct: 13 },
    ],
  },
  initiatives: [
    { name: 'Tech Stack Modernization RFP', phase: 'Vendor Selection', owner: 'CTO David Chen', timeline: 'Q2 2026 (stalled 9mo)', budget: '$28M', status: 'at-risk', risk: 'No integration architecture defined · 6 vendors competing on features not interoperability' },
    { name: 'Snowflake Data Platform', phase: 'Design', owner: 'CIO Raj Malhotra', timeline: 'Q4 2026', budget: '$4M', status: 'on-track', risk: 'CDO vacancy slowing governance decisions' },
    { name: 'AI Advisor Co-pilot', phase: 'Dual Pilot', owner: 'CEO / CIO', timeline: 'Q2 2026 decision', budget: '$3.2M', status: 'at-risk', risk: 'Two vendors in parallel · No adoption metrics · No change management' },
    { name: 'Compliance Surveillance Upgrade', phase: 'RFP', owner: 'CCO Aurelio Ferreira', timeline: 'Q3 2026 (SEC exam deadline)', budget: '$2.8M', status: 'at-risk', risk: 'SEC exam cycle begins Q3 2026 · Current 12% coverage insufficient' },
    { name: 'Client Portal Rebuild', phase: 'Design', owner: 'CRO Marcus Johanssen', timeline: 'Q1 2027', budget: '$4.4M', status: 'planning', risk: 'Planned as pull-only portal — low engagement architecture' },
    { name: 'Bloomberg Renegotiation', phase: 'Negotiation', owner: 'CFO Sarah Okonkwo', timeline: 'Oct 2026 renewal', budget: 'Savings: $3.3M/yr', status: 'on-track', risk: 'SLA credit claim ($1.4M) builds leverage for renewal' },
    { name: 'BI Tool Rationalisation', phase: 'Assess', owner: 'IT Dept', timeline: 'Q3 2026', budget: '$0.4M', status: 'on-track', risk: 'Tableau + Power BI overlap · 4 Power BI instances · Excel dominance' },
  ],
  volumetrics: [
    { metric: 'Total applications', value: '240', benchmark: '—', gap: '—', criticalFor: 'Rationalization scope' },
    { metric: 'BI tools (overlapping)', value: '4 tools', benchmark: '1–2 integrated', gap: '+2–3 redundant', criticalFor: 'Data consolidation' },
    { metric: 'Advisor communication coverage', value: '12% sampled', benchmark: '100%', gap: '-88%', criticalFor: 'SEC compliance · CRITICAL' },
    { metric: 'AI initiatives tracked', value: '28', benchmark: '—', gap: '—', criticalFor: 'Portfolio governance' },
    { metric: 'AI initiatives with ROI baseline', value: '0 of 28', benchmark: 'All', gap: '-28', criticalFor: 'Accountability programme' },
    { metric: 'Bloomberg cost vs peer', value: '$8.4M/yr', benchmark: '$5.1M/yr', gap: '+$3.3M overpay', criticalFor: 'Vendor renegotiation ROI' },
    { metric: 'Cloud workload coverage', value: '44%', benchmark: '70% (IT target)', gap: '-26pp', criticalFor: 'Modernization roadmap' },
    { metric: 'Advisor data re-entry (daily)', value: '~45 min/advisor', benchmark: '0 (integrated)', gap: '~45 min', criticalFor: 'AI co-pilot ROI baseline' },
    { metric: 'Client portal monthly active use', value: '~12% MAU (est.)', benchmark: '60%+ (push-enabled)', gap: '-48pp', criticalFor: 'Engagement architecture' },
    { metric: 'Systems with no API layer', value: '3 of 4 core', benchmark: '0', gap: '3 systems', criticalFor: 'Integration prerequisite for AI' },
    { metric: 'SEC exam readiness timeline', value: 'Q3 2026', benchmark: '—', gap: '—', criticalFor: 'CRITICAL COMPLIANCE DEADLINE' },
  ],
}

const APEX_IT: ClientITData = {
  totalApps: 185, cloudPct: 52, itSpend: '$88M', aiSpend: '$28M',
  architecture: {
    summary: 'Omnichannel retail architecture with a critical gap: OMS and WMS are separate legacy systems with no real-time inventory sync across 380 stores. BOPIS unfulfillable rate is 34%. eCommerce replatforming is 4 months behind plan.',
    type: 'Omnichannel (incomplete)',
    integration: 'No real-time OMS-WMS sync · BOPIS 34% unfulfillable · Batch inventory updates (24hr lag)',
    data: 'Snowflake data lake (deployed) · Batch POS feeds (24hr) · Real-time streaming not implemented',
    cloud: 'AWS primary · 52% cloud workloads · eCommerce fully cloud-hosted',
    risk: 'OMS-WMS gap is root cause of $42M stockout losses · eComm replatform 4 months behind',
    layers: [
      { layer: 'Customer & Digital', systems: ['eCommerce platform (Salesforce Commerce Cloud)', 'Mobile app (iOS + Android)', 'Loyalty platform (22M members)', 'AI Personalization engine (batch, 24hr lag)'], note: 'eComm 18% of revenue vs 32% peer · Conversion 2.1% vs 3.4%' },
      { layer: 'Store Operations', systems: ['POS — NCR Counterpoint (380 stores)', 'Store associate app (iPad)', 'In-store Wi-Fi + IoT sensors (footfall)', 'Loss prevention CCTV (Avigilon)'], note: '380 stores · 22,000 employees' },
      { layer: 'Merchandising & Supply Chain', systems: ['OMS — Manhattan Associates', 'WMS — Blue Yonder (separate system, no real-time sync)', 'Demand forecasting — JDA (legacy, 61% SKU accuracy)', 'EDI with 400+ vendors'], note: 'No OMS-WMS real-time sync · Root cause of $180M markdowns' },
      { layer: 'Data & Analytics', systems: ['Snowflake (deployed, batch feeds)', 'Tableau (store analytics)', 'Salesforce Einstein Analytics', 'Excel (dominant for buying decisions)'], note: 'Batch data (24hr lag) · Real-time streaming: not implemented' },
      { layer: 'Infrastructure', systems: ['AWS us-east-1 (primary)', 'AWS us-west-2 (DR)', '7 Distribution Centers (on-prem compute)', 'Azure (M365)'], note: '52% cloud · 380 store edge compute for POS' },
    ],
  },
  techStack: [
    { name: 'NCR Counterpoint POS', vendor: 'NCR', category: 'Point of Sale', users: '380 stores', status: 'active', notes: '2008 vintage · Upgrade planned FY2027' },
    { name: 'Manhattan OMS', vendor: 'Manhattan Associates', category: 'Order Management', users: '120', status: 'active', notes: 'No real-time sync with WMS · BOPIS 34% fail rate' },
    { name: 'Blue Yonder WMS', vendor: 'Blue Yonder', category: 'Warehouse Management', users: '280', status: 'active', notes: 'Separate system from OMS · Batch sync only' },
    { name: 'JDA Forecasting', vendor: 'Blue Yonder (legacy)', category: 'Demand Forecasting', users: '45', status: 'active', notes: '61% SKU-level accuracy · Root cause of $180M markdowns' },
    { name: 'Salesforce Commerce Cloud', vendor: 'Salesforce', category: 'eCommerce Platform', users: 'N/A', status: 'active', notes: 'Replatforming underway · 4 months behind' },
    { name: 'Salesforce CRM', vendor: 'Salesforce', category: 'CRM / Loyalty', users: '280', status: 'active', notes: '22M loyalty members · 34% active' },
    { name: 'Salesforce Einstein', vendor: 'Salesforce', category: 'AI / Personalization', users: '45', status: 'active', notes: 'Batch processing · 24hr data latency · Not real-time' },
    { name: 'Snowflake', vendor: 'Snowflake', category: 'Data Platform', users: 'N/A', status: 'active', notes: 'Deployed · Batch feeds only · Streaming not live' },
    { name: 'Tableau', vendor: 'Salesforce', category: 'BI / Store Analytics', users: '340', status: 'active', notes: 'Store and district manager dashboards' },
    { name: 'Avigilon CCTV', vendor: 'Motorola', category: 'Loss Prevention', users: '380 stores', status: 'active', notes: 'Video surveillance · No AI layer yet' },
    { name: 'UKG Ready', vendor: 'UKG', category: 'Workforce / Scheduling', users: '22,000', status: 'active', notes: 'Manual store scheduling still dominant' },
    { name: 'SAP Ariba', vendor: 'SAP', category: 'Procurement / AP', users: '85', status: 'active', notes: '$380K invoices/yr · 15% straight-through rate' },
    { name: 'CDP (in evaluation)', vendor: 'TBD', category: 'Customer Data Platform', users: 'N/A', status: 'planned', notes: 'RFP stage · Required for real-time personalization' },
    { name: 'MS Teams / M365', vendor: 'Microsoft', category: 'Productivity', users: '22,000', status: 'active', notes: 'Corporate + store managers' },
  ],
  infrastructure: {
    datacenters: [
      { label: 'AWS us-east-1', detail: 'Primary cloud', spec: '420 EC2 instances · 28TB RDS · 480TB S3' },
      { label: 'AWS us-west-2', detail: 'Disaster recovery', spec: 'Warm standby · 2hr RTO' },
      { label: '7 Distribution Centers', detail: 'On-prem compute', spec: 'WMS servers · EDI processing · Conveyor control systems' },
      { label: '380 Store Edge', detail: 'POS + local server', spec: 'NCR POS · Local inventory cache · Store Wi-Fi controller' },
    ],
    network: [
      { label: 'Store WAN', detail: 'Comcast Business', spec: '380 stores · 100Mbps / 20Mbps · LTE failover' },
      { label: 'DC / HQ WAN', detail: 'AT&T MPLS', spec: 'HQ + 7 DCs · 10Gbps' },
      { label: 'In-store Wi-Fi', detail: '802.11ax', spec: '380 stores · Associates + POS + IoT sensors' },
      { label: 'CDN', detail: 'Cloudflare', spec: 'eCommerce + mobile app · Global POPs' },
    ],
    cloud: [
      { label: 'AWS us-east-1', detail: 'Primary', spec: '420 EC2 · eCommerce + data platform + analytics' },
      { label: 'AWS us-west-2', detail: 'DR', spec: 'Warm standby · Automated failover' },
      { label: 'Cloud coverage', detail: '52% of workloads', spec: 'Target 70% by Q4 2026 · Stores remain edge' },
    ],
    storage: [
      { label: 'Total storage', detail: '820 TB', spec: '320 TB on-prem (DCs) · 500 TB cloud (S3 + RDS)' },
      { label: 'Transaction / POS history', detail: '7 years', spec: '7TB/year growing · Used for demand forecasting' },
      { label: 'Loyalty / customer data', detail: '22M profiles', spec: 'Salesforce + Snowflake · GDPR/CCPA scoped' },
    ],
  },
  budget: {
    total: '$88M', fiscal: 'FY2025',
    lines: [
      { category: 'Store Technology (POS, Wi-Fi, CCTV)', amount: '$28M', pct: 32 },
      { category: 'eCommerce & Digital Platforms', amount: '$22M', pct: 25 },
      { category: 'Supply Chain Systems (OMS, WMS, Forecasting)', amount: '$18M', pct: 20 },
      { category: 'AI & Data Platform', amount: '$12M', pct: 14 },
      { category: 'Infrastructure & Security', amount: '$8M', pct: 9 },
    ],
  },
  initiatives: [
    { name: 'eCommerce Replatform', phase: 'Build', owner: 'CTO David Abara', timeline: 'Q4 2026 (4 months behind)', budget: '$14M', status: 'delayed', risk: '4 months behind plan · Conversion rate 2.1% vs 3.4% peer' },
    { name: 'OMS-WMS Real-Time Integration', phase: 'Design', owner: 'CTO', timeline: 'Q2 2027', budget: '$8M', status: 'planning', risk: 'Root cause of $42M stockout losses and 34% BOPIS fail rate' },
    { name: 'AI Demand Forecasting (SKU-level)', phase: 'Pilot', owner: 'COO Priya Nakamura', timeline: 'Q3 2026', budget: '$6M', status: 'on-track', risk: 'Training data quality at SKU-store level · 7yr history available' },
    { name: 'Customer Data Platform (CDP)', phase: 'RFP', owner: 'CMO Juliana Reyes', timeline: 'Q1 2027', budget: '$4.8M', status: 'at-risk', risk: 'Required for real-time personalization · CDP vendor selection stalled' },
    { name: 'Real-Time Personalization Engine', phase: 'Design', owner: 'CMO / CTO', timeline: 'Q1 2027', budget: '$5.2M', status: 'planning', risk: 'Blocked by CDP · Current batch engine 24hr lag' },
    { name: 'AI Workforce Scheduling', phase: 'Pilot (6 stores)', owner: 'COO', timeline: 'Q3 2026', budget: '$2.4M', status: 'on-track', risk: 'Store manager adoption · Manual scheduling culture' },
    { name: 'Loss Prevention AI (Computer Vision)', phase: 'Pilot (12 stores)', owner: 'CSO', timeline: 'Q4 2026', budget: '$3.2M', status: 'on-track', risk: 'Privacy compliance review in progress' },
    { name: 'AP Automation (SAP Ariba + AI)', phase: 'Deploy', owner: 'CFO', timeline: 'Q3 2026', budget: '$1.2M', status: 'on-track', risk: 'Vendor onboarding to e-invoicing portal' },
  ],
  volumetrics: [
    { metric: 'Total applications', value: '185', benchmark: '—', gap: '—', criticalFor: 'Portfolio scope' },
    { metric: 'BOPIS unfulfillable rate', value: '34%', benchmark: '<5%', gap: '+29pp', criticalFor: 'OMS-WMS integration · CRITICAL' },
    { metric: 'Demand forecast accuracy (SKU)', value: '61%', benchmark: '85%+', gap: '-24pp', criticalFor: 'Root cause of $180M markdowns' },
    { metric: 'Inventory data latency', value: '24hr batch', benchmark: 'Real-time', gap: '24hr', criticalFor: 'Omnichannel fulfillment' },
    { metric: 'eComm conversion rate', value: '2.1%', benchmark: '3.4%', gap: '-1.3pp', criticalFor: '$58M revenue gap' },
    { metric: 'eComm revenue share', value: '18%', benchmark: '32%', gap: '-14pp', criticalFor: 'Primary growth KPI' },
    { metric: 'Loyalty members', value: '22M total', benchmark: '—', gap: '—', criticalFor: 'Personalization scope' },
    { metric: 'Active loyalty members', value: '34% (7.5M)', benchmark: '60%+', gap: '-26pp', criticalFor: 'Engagement architecture' },
    { metric: 'Personalization data latency', value: '24–48hr (batch)', benchmark: 'Real-time', gap: '24hr+', criticalFor: 'CDP requirement' },
    { metric: 'Stores with footfall sensors', value: '380 (all)', benchmark: '—', gap: '—', criticalFor: 'Scheduling + merchandising AI' },
    { metric: 'AP straight-through rate', value: '15%', benchmark: '85%+', gap: '-70pp', criticalFor: 'AP automation ROI' },
    { metric: 'Cloud workload coverage', value: '52%', benchmark: '70% (target)', gap: '-18pp', criticalFor: 'Modernization roadmap' },
  ],
}

export const CLIENT_IT_DATA: Record<string, ClientITData> = {
  meridian:   MERIDIAN_IT,
  arcturus:   ARCTURUS_IT,
  apexretail: APEX_IT,
}
