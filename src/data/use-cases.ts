export type Severity = 'critical' | 'high' | 'medium'

export interface UseCase {
  severity: Severity
  title: string
  metric: string
  impact: string
  responseKey: string
}

export type ClientId = 'meridian' | 'firstcapital' | 'apexretail'
export type RoleId = 'CIO' | 'CFO' | 'COO' | 'CMIO' | 'CMO' | 'CEO'

export const USE_CASES: Record<ClientId, Partial<Record<RoleId, UseCase[]>>> = {

  meridian: {
    CIO: [
      {
        severity: 'critical',
        title: 'Epic optimization stuck at 58/100',
        metric: 'Epic score 58/100 after 7 years — 34% of documentation in workarounds',
        impact: '$18M/yr in labor waste from workarounds and rework',
        responseKey: 'epic-optimization-gap',
      },
      {
        severity: 'critical',
        title: 'Ensemble SLA breach — RCM denial rate 18.2%',
        metric: 'Denial rate 18.2% vs 12.1% benchmark — 6.1 points above contract SLA',
        impact: '$94M in annual write-offs, $1.4M SLA penalty clause activating Q3',
        responseKey: 'rcm-denial-rate',
      },
      {
        severity: 'high',
        title: 'Blue Ridge Cerner migration 8 months overdue',
        metric: '412 interfaces unresolved — go-live slipped from June to Q4',
        impact: '$8.4M sunk cost, $3.2M monthly operational drag from dual systems',
        responseKey: 'blue-ridge-migration',
      },
      {
        severity: 'high',
        title: 'Prior auth taking 4.2 days — peers do it in 1.8',
        metric: '4.2 day average vs 1.8 day peer median — 133% slower',
        impact: '$12M in delayed and denied revenue; 6% of surgical cases rescheduled',
        responseKey: 'prior-auth-delay',
      },
      {
        severity: 'medium',
        title: 'Azure spend $62M — 34% underutilized',
        metric: '$21M in idle Azure capacity — no FinOps function in place',
        impact: 'Immediate $8-12M savings available with rightsizing',
        responseKey: 'azure-waste',
      },
    ],
    CFO: [
      {
        severity: 'critical',
        title: 'Operating margin 1.8% — board target 4%',
        metric: '$94M gap vs board target — third consecutive year of miss',
        impact: 'Board patience exhausted — covenant risk if margin falls below 1.5%',
        responseKey: 'operating-margin',
      },
      {
        severity: 'critical',
        title: 'RCM denial write-offs $94M annually',
        metric: 'Denial rate 18.2% — 6 points above benchmark — $94M written off',
        impact: '43% of the board margin gap is recoverable through denial prevention',
        responseKey: 'rcm-write-offs',
      },
      {
        severity: 'high',
        title: 'Travel nurse spend $142M — 31% of nursing labor',
        metric: '$142M travel nurse contracts — $58M above peer median spend',
        impact: 'Every 10% reduction = $14M drop to operating income',
        responseKey: 'travel-nurse-cost',
      },
      {
        severity: 'high',
        title: 'Net collection rate 87.1% vs reported 94.2%',
        metric: 'Finance reports 94.2% — actual net collection is 87.1% — $31M gap',
        impact: '$31M in under-reported revenue leakage not visible to board',
        responseKey: 'collection-rate-gap',
      },
      {
        severity: 'medium',
        title: '$504M IT budget — ROI undefined on 68% of spend',
        metric: '68% of IT spend has no documented business outcome',
        impact: 'CFO cannot defend budget to board — rationalization opportunity $40-60M',
        responseKey: 'it-budget-roi',
      },
    ],
    COO: [
      {
        severity: 'critical',
        title: 'Travel nurse dependency — $142M and rising',
        metric: '23% of all nursing positions are travel nurses — up from 14% in 2022',
        impact: '$58M above market rate — permanent staff pipeline broken',
        responseKey: 'travel-nurse-dependency',
      },
      {
        severity: 'critical',
        title: 'Readmission rate 16.8% — CMS penalty threshold',
        metric: 'Readmission rate 16.8% vs 14.2% benchmark — CMS penalty activating',
        impact: '$8.2M CMS penalty risk in FY2026 if rate not reduced by Q3',
        responseKey: 'readmission-rate',
      },
      {
        severity: 'high',
        title: 'Blue Ridge integration failure — 412 interfaces unresolved',
        metric: '8 months overdue — clinical workflows split across two systems',
        impact: '14 adverse event near-misses attributed to dual system confusion',
        responseKey: 'blue-ridge-operations',
      },
      {
        severity: 'high',
        title: 'OR utilization 61% — 23 rooms averaging under 50%',
        metric: '61% OR utilization vs 78% benchmark — 17 points below',
        impact: '$28M in recoverable surgical revenue with scheduling optimization',
        responseKey: 'or-utilization',
      },
      {
        severity: 'medium',
        title: 'Length of stay 5.2 days vs 4.1 day benchmark',
        metric: '1.1 day excess LOS across 4,200 annual discharges',
        impact: '$18M in excess staffing and capacity cost annually',
        responseKey: 'length-of-stay',
      },
    ],
    CMIO: [
      {
        severity: 'critical',
        title: 'Epic at 58/100 after 7 years — physicians burning out',
        metric: '34% of clinical documentation in workarounds — physician burnout 72nd percentile',
        impact: 'Turnover cost $42K per physician — 18 vacancies currently open',
        responseKey: 'epic-physician-burnout',
      },
      {
        severity: 'critical',
        title: 'Sepsis AI pilot — 4 years, still 2 floors',
        metric: 'Sepsis AI proven in 2 ICU floors — 23% reduction in sepsis mortality',
        impact: 'Scale to all 847 beds saves est. 34 additional lives/year, $12M cost',
        responseKey: 'sepsis-ai-scale',
      },
      {
        severity: 'high',
        title: 'MA Star Rating 3.5 — Stars bonus at risk',
        metric: 'Stars 3.5 vs 4.0 threshold for bonus — $22M in CMS bonus payments at stake',
        impact: 'HEDIS gap closure could move to 4.0 Stars within 18 months',
        responseKey: 'ma-stars',
      },
      {
        severity: 'high',
        title: 'Prior auth 4.2 days — clinical burden on attending physicians',
        metric: 'Physicians spending 4.8 hrs/week on prior auth — highest complaint category',
        impact: 'AI prior auth reduces physician burden by 3.2 hrs/week per physician',
        responseKey: 'prior-auth-clinical',
      },
      {
        severity: 'medium',
        title: 'Readmission rate 16.8% — CMIO accountability',
        metric: 'Heart failure readmissions at 22.1% — highest risk category',
        impact: 'Predictive discharge planning reduces readmission 18-24% at peers',
        responseKey: 'readmission-clinical',
      },
    ],
    CEO: [
      {
        severity: 'critical',
        title: 'Operating margin 1.8% — board covenant risk',
        metric: '1.8% vs 4% board target — third miss — covenant triggers at 1.5%',
        impact: 'Board credibility exhausted — two board members privately escalated to chair',
        responseKey: 'operating-margin',
      },
      {
        severity: 'critical',
        title: '$94M written off — every competitor is recovering it',
        metric: 'Denial rate 6 points above industry benchmark — $94M annual write-off',
        impact: 'Peers recovering equivalent leakage with AI in 90-day deployments',
        responseKey: 'competitive-gap',
      },
      {
        severity: 'high',
        title: 'Board AI strategy question — no defensible answer',
        metric: '4 AI pilots in 4 years — zero scaled deployments — $12M spent',
        impact: 'Board will ask "where is our AI roadmap?" at April meeting',
        responseKey: 'ai-strategy-board',
      },
      {
        severity: 'high',
        title: 'CMS penalty risk — $8.2M in FY2026',
        metric: 'Readmission rate above CMS threshold — penalty activates Q3 FY2026',
        impact: 'Combined with margin pressure — newsworthy if CMS publishes rating',
        responseKey: 'cms-penalty-risk',
      },
      {
        severity: 'medium',
        title: 'MA Stars at 3.5 — $22M bonus unrealized',
        metric: '$22M in CMS Stars bonus payments contingent on reaching 4.0 Stars',
        impact: 'HEDIS improvement plan would take 18 months — start now or miss FY2027',
        responseKey: 'ma-stars',
      },
    ],
  },

  firstcapital: {
    CIO: [
      {
        severity: 'critical',
        title: 'FIS HORIZON 22 years old — FedNow blocked',
        metric: 'Core banking 22 years old — FedNow integration blocked by API layer missing',
        impact: 'Three commercial clients issued 90-day ultimatum — $340M deposit risk',
        responseKey: 'fednow-urgency',
      },
      {
        severity: 'critical',
        title: 'SQL Server 2017 EOS — October deadline',
        metric: 'SQL Server 2017 extended support ends October 2025 — 11 production databases',
        impact: 'Compliance gap — OCC examiner flag risk if not remediated',
        responseKey: 'sql-server-eos',
      },
      {
        severity: 'high',
        title: 'Mobile app rating 2.8 — customers avoiding download',
        metric: '2.8 app store rating vs 4.4 peer average — below 3.8 avoidance threshold',
        impact: 'Digital adoption stuck at 41% — every point below 3.8 costs 4% in acquisition',
        responseKey: 'mobile-app-rating',
      },
      {
        severity: 'high',
        title: 'T+1 balance data — real-time demanded',
        metric: '18M digital customers seeing yesterday balances — real-time data not available',
        impact: 'Root cause of 2.8 app rating — digital-native competitors offer real-time',
        responseKey: 'realtime-balances',
      },
      {
        severity: 'medium',
        title: 'Shadow IT $12M — 34 unmanaged SaaS apps',
        metric: '34 departmental SaaS subscriptions — none in procurement — $12M annual spend',
        impact: 'SOC 2 compliance risk — OCC examiner identified this in last exam',
        responseKey: 'shadow-it',
      },
    ],
    CFO: [
      {
        severity: 'critical',
        title: 'Cost-to-income ratio 68% vs 55% target',
        metric: '68% cost-to-income vs 55% target — 13 point gap — $84M in excess cost',
        impact: 'Peer median 58% — First Capital paying $64M more per year in structural cost',
        responseKey: 'cost-to-income',
      },
      {
        severity: 'critical',
        title: '$340M commercial deposit risk — FedNow ultimatum',
        metric: 'Three commercial clients: 90-day ultimatum, FedNow required',
        impact: '$340M in deposits — $3.4M in annual fee income — irreplaceable clients',
        responseKey: 'fednow-urgency',
      },
      {
        severity: 'high',
        title: 'Fraud losses $3.8M above benchmark',
        metric: 'Fraud write-offs $9.2M vs $5.4M peer benchmark — $3.8M excess',
        impact: 'AI fraud detection peers achieving 40-60% reduction in losses',
        responseKey: 'fraud-losses',
      },
      {
        severity: 'high',
        title: 'Manual AML — 6 FTE reviewing every alert',
        metric: 'AML alert disposition: 6 FTE, 92% false positive rate',
        impact: 'Automation reduces FTE to 2, saves $480K/yr, reduces false positives to 40%',
        responseKey: 'aml-automation',
      },
      {
        severity: 'medium',
        title: 'Core banking modernization ROI unclear',
        metric: '$180M modernization estimate — 36-month runway — no phased option modeled',
        impact: 'API-first approach reduces upfront to $28M with same FedNow outcome',
        responseKey: 'core-banking-roi',
      },
    ],
    COO: [
      {
        severity: 'critical',
        title: 'Account opening abandonment 64%',
        metric: '64% of digital account opens abandoned — industry benchmark 38%',
        impact: '$18M/yr in lost fee income — 4,200 accounts/month disappearing at step 3',
        responseKey: 'account-opening-abandonment',
      },
      {
        severity: 'critical',
        title: 'Every tech project over budget and late',
        metric: 'Last 8 technology projects: 100% over budget, avg 6.2 months late',
        impact: 'Board confidence in tech delivery at 2/10 — project approval frozen',
        responseKey: 'project-delivery',
      },
      {
        severity: 'high',
        title: 'AML false positive rate 92% — analyst exhaustion',
        metric: '92% false positives — analysts reviewing 840 alerts/day to find 67 real ones',
        impact: 'Staff turnover in compliance 38% — knowledge loss and regulatory risk',
        responseKey: 'aml-automation',
      },
      {
        severity: 'high',
        title: 'Commercial relationship profitability unknown',
        metric: 'No single view of commercial client profitability — product P&L not available',
        impact: 'Pricing decisions made without cost visibility — likely subsidizing unprofitable clients',
        responseKey: 'commercial-profitability',
      },
      {
        severity: 'medium',
        title: 'Branch transaction volume declining 18%/yr',
        metric: '18% annual decline in branch transactions — branch footprint unchanged',
        impact: '12 branches below cost threshold — $4.2M annual cost with no offsetting revenue',
        responseKey: 'branch-optimization',
      },
    ],
    CMO: [
      {
        severity: 'critical',
        title: 'Digital adoption 41% vs 67% peer benchmark',
        metric: '41% digital adoption — declining MoM for 3 consecutive months',
        impact: 'Digital-native competitors acquiring First Capital\'s target demographic (25-40)',
        responseKey: 'digital-adoption',
      },
      {
        severity: 'critical',
        title: 'Mobile app rating 2.8 — customers not downloading',
        metric: '2.8 vs 4.4 peer average — T+1 balance data is root cause',
        impact: 'Every 0.5 star improvement = 12% increase in digital acquisition rate',
        responseKey: 'mobile-app-rating',
      },
      {
        severity: 'high',
        title: '18M digital customers with stale data',
        metric: 'T+1 balances — customers checking accounts to find yesterday\'s numbers',
        impact: 'Top complaint in app reviews — fix this before any marketing investment',
        responseKey: 'realtime-balances',
      },
      {
        severity: 'high',
        title: 'Net Promoter Score 28 vs 54 peer average',
        metric: 'NPS 28 — lowest in peer group — digital experience is cited reason 61%',
        impact: 'NPS below 30 correlates with 3x higher churn probability',
        responseKey: 'nps-gap',
      },
      {
        severity: 'medium',
        title: 'Cross-sell rate 1.6 products per customer vs 2.8 benchmark',
        metric: '1.6 products/customer — $42M in unrealized cross-sell revenue annually',
        impact: 'Next-best-offer AI achieves 2.4+ products/customer at comparable banks',
        responseKey: 'cross-sell',
      },
    ],
    CEO: [
      {
        severity: 'critical',
        title: 'FedNow ultimatum — $340M at risk in 90 days',
        metric: 'Three commercial clients issued written ultimatum — FedNow or leave',
        impact: '$340M deposits, $3.4M fee income — losing any one is newsworthy',
        responseKey: 'fednow-urgency',
      },
      {
        severity: 'critical',
        title: '3 open OCC MRAs — examiner returning Q2',
        metric: '3 Matters Requiring Attention from last OCC exam — all open',
        impact: 'Formal enforcement action risk if MRAs not closed before Q2 exam',
        responseKey: 'occ-mras',
      },
      {
        severity: 'high',
        title: 'Cost-to-income 68% — structural cost problem',
        metric: '$84M in excess cost vs peer median — not a revenue problem',
        impact: 'Cannot achieve peer ROE without structural cost reduction — investor pressure rising',
        responseKey: 'cost-to-income',
      },
      {
        severity: 'high',
        title: 'Digital adoption 41% — competitors accelerating',
        metric: 'Digital-native competitors growing 3x faster in target demographic',
        impact: 'Without digital fix, branch-dependent model becomes structurally unviable by 2028',
        responseKey: 'digital-strategy',
      },
      {
        severity: 'medium',
        title: 'Core banking decision cannot wait another year',
        metric: '$180M estimate paralyzing decision — API-first alternative is $28M',
        impact: 'Every year of delay adds 18 months of technical debt and competitive disadvantage',
        responseKey: 'core-banking-roi',
      },
    ],
  },

  apexretail: {
    CIO: [
      {
        severity: 'critical',
        title: 'SAP ECC support ends 2027 — decision overdue',
        metric: 'SAP ECC mainstream support ended 2027 — migration budget not approved',
        impact: '$8M/yr in extended support fees — every year of delay adds migration risk',
        responseKey: 'sap-migration-decision',
      },
      {
        severity: 'critical',
        title: 'Segment CDP — 340K duplicate profiles blocking Einstein',
        metric: '340,000 duplicate customer profiles in Salesforce Segment CDP',
        impact: '$248M in Einstein AI value completely blocked — root cause is CDP data quality',
        responseKey: 'einstein-activation',
      },
      {
        severity: 'high',
        title: 'o9 demand planning 40% implemented — stalled',
        metric: '$18M spent on o9 — 40% implemented — 18 months behind schedule',
        impact: 'Demand forecasting accuracy still at 61% — $800M inventory overstock persisting',
        responseKey: 'o9-stalled',
      },
      {
        severity: 'high',
        title: 'IBM Sterling OMS 3 versions behind',
        metric: 'IBM Sterling Order Management 3 major versions behind — no vendor support',
        impact: 'BOPIS fulfillment failures 8.4% — peers at 1.2% with current OMS version',
        responseKey: 'oms-upgrade',
      },
      {
        severity: 'medium',
        title: 'Inventory accuracy 84% — omnichannel impossible',
        metric: 'Store inventory accuracy 84% vs 98% benchmark — RFID not deployed',
        impact: 'BOPIS fulfillment failure root cause — $124M in customer satisfaction cost',
        responseKey: 'inventory-accuracy',
      },
    ],
    CFO: [
      {
        severity: 'critical',
        title: 'Operating margin 3.8% vs 6.5% target',
        metric: '$338M gap between 3.8% actual and 6.5% board target on $12.4B revenue',
        impact: 'Investor pressure — three activist letters in 18 months — board accountability',
        responseKey: 'operating-margin',
      },
      {
        severity: 'critical',
        title: '$800M excess inventory — demand forecasting broken',
        metric: 'Inventory turns 4.2x vs 6.8x benchmark — 87 days on hand vs 52 benchmark',
        impact: '$800M in tied-up capital — carrying cost $48M/yr — margin drag 0.4%',
        responseKey: 'inventory-optimization',
      },
      {
        severity: 'high',
        title: '$248M Einstein value sitting idle — $18M spent on Deloitte activation',
        metric: 'Einstein AI personalization contracted, deployed, never activated',
        impact: '$248M projected revenue uplift blocked by CDP data quality — fixable in 90 days',
        responseKey: 'einstein-activation',
      },
      {
        severity: 'high',
        title: 'SAP migration — $180M estimate vs real options',
        metric: '$180M S/4HANA quote from SAP — Microsoft Dynamics at $85M, Tier-2 at $42M',
        impact: 'Decision paralysis costing $8M/yr in extended support while alternatives cheaper',
        responseKey: 'sap-migration-decision',
      },
      {
        severity: 'medium',
        title: 'Shrinkage 2.8% — industry benchmark 1.4%',
        metric: '$347M in annual shrinkage vs $173M if at benchmark',
        impact: '$174M of recoverable shrinkage with RFID and AI loss prevention',
        responseKey: 'shrinkage-loss',
      },
    ],
    COO: [
      {
        severity: 'critical',
        title: 'Inventory turns 4.2x — $800M trapped in overstock',
        metric: '87 days on hand vs 52-day benchmark — demand forecasting at 61% accuracy',
        impact: '$800M in excess inventory, $48M carrying cost — DC space crisis looming',
        responseKey: 'inventory-optimization',
      },
      {
        severity: 'critical',
        title: 'Store staff turnover 68% annually — 12,000 FTE churning',
        metric: '68% annual turnover rate — cost to replace each associate $4,200',
        impact: '$50M/yr in turnover cost — AI scheduling reduces turnover 15-20% at peers',
        responseKey: 'workforce-turnover',
      },
      {
        severity: 'high',
        title: 'BOPIS fulfillment failure 8.4% — online orders unfulfillable',
        metric: '8.4% BOPIS failure rate vs 1.2% benchmark — inventory accuracy root cause',
        impact: '$124M in customer satisfaction impact — NPS 10 points below pre-BOPIS launch',
        responseKey: 'bopis-failure',
      },
      {
        severity: 'high',
        title: 'China sourcing 48% — concentration risk unhedged',
        metric: '48% of merchandise from China — no diversification plan in place',
        impact: 'Tariff scenario: 25% tariff = $149M annual cost increase on current mix',
        responseKey: 'supply-chain-risk',
      },
      {
        severity: 'medium',
        title: 'DC automation: manual pick rates 40% below peers',
        metric: 'Manual pick operations — 420 picks/hr vs 700 automated benchmark',
        impact: '$28M in efficiency gap — automation ROI 2.4x over 3 years',
        responseKey: 'dc-automation',
      },
    ],
    CMO: [
      {
        severity: 'critical',
        title: 'Einstein personalization — $248M idle — customers getting generic',
        metric: '$248M AI personalization value blocked by CDP data quality — 340K duplicates',
        impact: 'Loyalty members receiving irrelevant promotions — 42% active vs 68% benchmark',
        responseKey: 'einstein-activation',
      },
      {
        severity: 'critical',
        title: 'Loyalty active rate 42% vs 68% benchmark',
        metric: '18M members — only 7.6M active — $840M in dormant customer value',
        impact: 'Reactivation campaign: every 10 points of active rate = $168M in revenue',
        responseKey: 'loyalty-activation',
      },
      {
        severity: 'high',
        title: 'Cart abandonment 72% — $840M in lost revenue',
        metric: '72% cart abandonment vs 65% benchmark — mobile conversion 1.1% vs 2.8%',
        impact: 'Personalized recovery email + checkout redesign = 8-12% abandonment reduction',
        responseKey: 'cart-abandonment',
      },
      {
        severity: 'high',
        title: 'Mobile conversion 1.1% — half of benchmark',
        metric: 'Mobile conversion 1.1% vs 2.8% benchmark — mobile = 62% of traffic',
        impact: '$124M in mobile revenue gap — UX and performance issues root cause',
        responseKey: 'mobile-conversion',
      },
      {
        severity: 'medium',
        title: 'Email open rate 14% — segment intelligence not used',
        metric: '14% open rate vs 22% benchmark — all 18M members get same cadence',
        impact: 'Segment-aware cadence with Einstein increases open rate to 24%+ at peers',
        responseKey: 'email-personalization',
      },
    ],
    CEO: [
      {
        severity: 'critical',
        title: 'SAP ECC 2027 deadline — board decision required now',
        metric: 'Every year of inaction = $8M extended support + growing migration risk',
        impact: 'Board must decide SAP path — Q2 board meeting is the last strategic window',
        responseKey: 'sap-migration-decision',
      },
      {
        severity: 'critical',
        title: 'Operating margin 3.8% — activist pressure increasing',
        metric: '$338M gap to board target — three activist letters — proxy fight risk',
        impact: 'Margin recovery plan with AI investments: $350M+ over 36 months',
        responseKey: 'operating-margin',
      },
      {
        severity: 'high',
        title: '$248M Einstein value — paid for but never turned on',
        metric: 'Salesforce Einstein contract: $34M/yr — activation blocked 18 months',
        impact: 'Fix CDP data quality in 90 days — $248M in revenue uplift available',
        responseKey: 'einstein-activation',
      },
      {
        severity: 'high',
        title: 'Amazon taking 4% share — digital strategy gap',
        metric: 'E-commerce mix 21% vs 35% target — conversion 2.3% vs 4.1% competitor',
        impact: 'Without digital acceleration, Amazon captures another 4-6 points in 24 months',
        responseKey: 'digital-strategy',
      },
      {
        severity: 'medium',
        title: '$800M inventory — supply chain AI is the fix',
        metric: 'Demand forecasting 61% accuracy — $800M tied up — peers at 84%',
        impact: 'AI demand forecasting at peers reduces inventory 18-22% in 12 months',
        responseKey: 'inventory-optimization',
      },
    ],
  },
}

export function getUseCases(clientId: ClientId, role: RoleId): UseCase[] {
  return USE_CASES[clientId]?.[role] ?? []
}

export function severityColor(s: Severity): string {
  if (s === 'critical') return '#DC2626'
  if (s === 'high') return '#D97706'
  return '#059669'
}

export function severityEmoji(s: Severity): string {
  if (s === 'critical') return '🔴'
  if (s === 'high') return '🟡'
  return '🟢'
}
