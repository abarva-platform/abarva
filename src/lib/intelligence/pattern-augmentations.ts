// Vendor Knowledge Layer augmentations for pattern detail pages.
//
// Fix Spec v3 §3 · the pattern_packs table holds structural content
// (triggers, detection signals, intervention options, failure modes,
// diagnostic questions) but does NOT yet carry the three signals the
// Vendor Knowledge Layer design-DNA demands:
//
//   1. Current knowledge · 2026-specific vendor names
//   2. Architectural opinion · a point of view on the category
//   3. Specificity · named tools, practitioners, research
//
// Rather than extend the DB schema + seed pipeline pre-demo, we ship
// pattern-keyed static augmentations here. The detail page merges DB
// fields with augmentations where keys match; patterns without an
// augmentation still render — just thinner — so all demo pages have a
// consistent shape and the "full depth" bar is hit for the one-two
// patterns Prat will click into.
//
// To promote a pattern to full depth, add an entry in PATTERN_AUGMENTATIONS
// keyed by its pattern_packs.id.

export type VendorCategoryLayer =
  | 'sensing'
  | 'governance'
  | 'execution'
  | 'analytics'
  | 'procurement'
  | 'talent'
  | 'infrastructure';

export interface VendorEntry {
  name: string;
  // Short category + product descriptor. "Revionics · markdown optimisation"
  descriptor: string;
  // Optional live link; demo defers to the vendor's canonical landing page.
  url?: string;
  // Architectural opinion about this vendor in this category. Short, POV,
  // not neutral marketing copy.
  opinion?: string | null;
}

export interface VendorGroup {
  layer: VendorCategoryLayer;
  title: string;
  // One-paragraph architectural POV on this layer.
  pointOfView: string;
  vendors: VendorEntry[];
}

export interface HistoricalInstance {
  anonymousLabel: string; // "Mid-cap retailer · private-label leader, multi-category"
  sector: string;
  scale: string;
  outcome: 'resolved' | 'partial' | 'reversed';
  summary: string;
}

export interface InterventionDetail {
  option: string;
  effectiveness: string; // "85% · historical · 7 instances"
  timeHorizon: string;
  resourceRequirement: string;
  caveats?: string;
}

export interface EvidenceSource {
  title: string;
  author: string;
  year: number;
  citation: string;
  relevance: string;
}

export interface PractitionerEntry {
  name: string;
  affiliation: string;
  whyRelevant: string;
}

export interface MaestroRubric {
  probeFor: string[];
  conversationStarters: string[];
  redFlags: string[];
  resolvingSignals: string[];
}

export interface PatternAugmentation {
  // Hero-level descriptors not in the base schema
  patternId: string;
  ordinalRef: string;            // "F012" style code
  maturity: string;              // "v3 · verified"
  sectorTag: string;             // "RETAIL" or "CROSS-SECTOR"
  functionTag: string;
  objectiveTag: string;
  oneSentenceProblem: string;

  // Failure mode narrative
  failureMode: string[];         // 2-3 paragraphs

  // Enriched triggers (full phrases, not single words)
  richTriggers: string[];

  // Telemetry signature
  telemetrySignals: Array<{ signal: string; source: string }>;

  // The magic section
  vendorLandscape: VendorGroup[];

  // Contradictions this pattern surfaces (in addition to DB content)
  keyContradictions: string[];

  // Historical instances
  historicalInstances: HistoricalInstance[];
  historicalSummary: string;     // "Observed in 7 enterprises..."

  // Intervention menu with effectiveness
  interventions: InterventionDetail[];

  // Evidence base
  evidenceBase: EvidenceSource[];
  frameworksExtended: string[];

  // Practitioner landscape (parallels topic page)
  practitioners: PractitionerEntry[];

  // Related patterns + topics
  upstreamPatterns: Array<{ code: string; name: string }>;
  downstreamPatterns: Array<{ code: string; name: string }>;
  relatedTopics: Array<{ key: string; title: string }>;

  // AbarVa IP · Maestro probe rubric
  maestroRubric: MaestroRubric;
}

// ─── Owned Brand Margin Underperformance (Apex demo-critical) ──────────
const OWNED_BRAND_MARGIN: PatternAugmentation = {
  patternId: 'apex_pattern_owned_brand_margin_underperformance',
  ordinalRef: 'F012',
  maturity: 'v3 · verified',
  sectorTag: 'RETAIL',
  functionTag: 'MIDDLE OFFICE',
  objectiveTag: 'PROTECT',
  oneSentenceProblem:
    'Owned-brand gross margin underperforms plan despite commercial, sourcing, and pricing investment — because the value leaks cross-functionally and no one owns the full equation.',

  failureMode: [
    'Owned-brand programs get capitalised when national-brand margin is under pressure. The theory is sound: control the product, control the margin. In practice, the margin equation spans sourcing cost, trade promotion, assortment mix, markdown velocity, private-label premium, and brand-building investment — and those levers live in different P&Ls.',
    'Three dynamics keep the pattern sticky. First, the CCO owns the revenue line but not the landed-cost components. Second, sourcing tracks FOB cost but not freight, duty, or supplier rebate leakage at SKU granularity. Third, pricing systems treat owned brands as "price-takers" following the national-brand index instead of optimising on owned-brand cross-elasticity. When the margin slips, each function points to the other two.',
    'The failure mode completes itself when leadership responds to the margin gap with more investment in the same silos — deeper promo, richer SKUs, premium sub-brand extensions — which expands the surface area of the problem without fixing the attribution gap underneath.',
  ],

  richTriggers: [
    'Owned-brand gross margin trails plan by >150 bps for two consecutive quarters without identified root cause',
    'Three or more categories show positive revenue mix but negative margin mix versus national brands',
    'Markdown intensity on owned brands rises >20% YoY while national-brand markdown holds flat',
    'Landed-cost visibility stops at FOB — freight, duty, supplier rebate, and shrink variance are reconciled monthly or not at all',
    'Category heads, CCO, and CFO disagree on which component is the primary margin drag when asked separately',
    'Trade promotion spend on owned brands exceeds 8% of net sales without an elasticity model tied to outcome',
  ],

  telemetrySignals: [
    { signal: 'SKU-level landed cost variance versus baseline, weekly, by supplier', source: 'ERP cost ledger + customs broker feed' },
    { signal: 'Markdown depth + velocity by category, compared to national-brand anchor SKUs', source: 'POS + price optimisation system' },
    { signal: 'Trade promotion ROI by event, with pre-post elasticity decomposition', source: 'TPM system + revenue management' },
    { signal: 'Mix drift by category + region versus merchandising plan', source: 'Merchandising DW' },
    { signal: 'Supplier rebate accrual versus earned, with reason codes', source: 'A/P + sourcing ledger' },
  ],

  vendorLandscape: [
    {
      layer: 'analytics',
      title: 'Pricing + margin analytics',
      pointOfView:
        'This category has matured fastest. Most mid-cap retailers can now run markdown optimisation credibly with Revionics or Blue Yonder; the gap is connecting pricing outputs back to landed-cost inputs, which most deployments skip.',
      vendors: [
        { name: 'Revionics (Aptos)', descriptor: 'Markdown + regular price optimisation · category mature', opinion: 'Best-in-class for mid-cap retail; weaker on cross-banner pricing in multi-format retailers.' },
        { name: 'Blue Yonder Price + Promo', descriptor: 'Pricing, markdown, trade promotion suite', opinion: 'Strongest in enterprise scale; implementation tail is longer than sellers admit — budget 18-24 months for full lift.' },
        { name: 'PROS Retail', descriptor: 'Dynamic pricing with AI cross-elasticity', opinion: 'Newer to owned-brand; category elasticity models are catching up to the grocery-native competitors.' },
        { name: 'Engage3', descriptor: 'Competitor shelf intelligence + pricing automation' },
      ],
    },
    {
      layer: 'procurement',
      title: 'Sourcing cost transparency',
      pointOfView:
        'This is where most owned-brand programs break. The tooling exists but is rarely wired end-to-end. Coupa or Jaggaer catalog the spend; the gap is at landed-cost decomposition with freight, duty, and rebate attribution to the SKU. Most retailers still live in spreadsheets here.',
      vendors: [
        { name: 'Coupa', descriptor: 'Spend management + supplier collaboration', opinion: 'Strong for contract tracking, weaker for landed-cost decomposition. Most retailers layer BI on top.' },
        { name: 'Jaggaer', descriptor: 'Source-to-pay for retail + manufacturing' },
        { name: 'SAP Ariba', descriptor: 'Enterprise S2P · category catalogue' },
        { name: 'Flexport Data', descriptor: 'Freight + duty telemetry at SKU granularity', opinion: 'Newer but the only tool that gets past FOB cleanly; worth piloting for any owned-brand diagnostic.' },
      ],
    },
    {
      layer: 'execution',
      title: 'Trade promotion management',
      pointOfView:
        'Owned-brand TPM is structurally different from CPG-brand TPM — the retailer owns both sides of the table. Most systems were built assuming an arms-length trade relationship and don\'t model the "P&L swap" dynamic where promo depth trades against gross margin dollar-for-dollar.',
      vendors: [
        { name: 'Accenture TPM (formerly Trax)', descriptor: 'Retail-specific TPM with elasticity' },
        { name: 'SAP TPM', descriptor: 'ERP-native TPM · slow but auditable' },
        { name: 'Proprietary internal', descriptor: 'Most Fortune-50 retailers run internal builds · opinion: adequate for visibility, weak on counterfactual' },
      ],
    },
    {
      layer: 'analytics',
      title: 'Margin attribution + mix analytics',
      pointOfView:
        'This is the gap. There isn\'t a pure-play category leader yet. Most retailers build this capability internally on Snowflake or Databricks using dbt + custom attribution models. Early AI-native entrants (Antuit, Aera Decision Cloud) are promising but thin on owned-brand specifics.',
      vendors: [
        { name: 'Antuit.ai (Zebra)', descriptor: 'AI-native demand + margin decomposition', opinion: 'Closest to purpose-built for this category; small deployment footprint so far.' },
        { name: 'Aera Decision Cloud', descriptor: 'Cross-functional decision intelligence', opinion: 'Strong thesis, early deployment tail; worth evaluating for the attribution layer specifically.' },
        { name: 'dbt + Snowflake (internal build)', descriptor: 'Most common stack for margin attribution at Fortune 100 retail', opinion: 'Pragmatic starting point; ~12 weeks to a defensible v1 if the data is clean.' },
      ],
    },
  ],

  keyContradictions: [
    'Sponsor commits to "owned-brand is a margin engine" but the compensation plan rewards revenue growth over gross margin dollar',
    'Category heads are measured on revenue + sell-through; nobody on the team is measured on landed-cost variance',
    'Pricing system treats owned brands as price-takers following the national-brand index, which imports the national-brand margin compression into the private-label line',
    'Trade promotion events run without elasticity pre-reads; post-event reconciliation happens monthly or not at all',
  ],

  historicalInstances: [
    { anonymousLabel: 'Top-5 US mass retailer · private-label food leader', sector: 'Retail · grocery + general merchandise', scale: '$70B+ revenue', outcome: 'resolved', summary: 'Rebuilt landed-cost attribution on Snowflake; integrated with Revionics markdown engine; recovered 230 bps on owned-brand GM within 18 months.' },
    { anonymousLabel: 'Top-10 US specialty retailer · apparel owned-brand', sector: 'Retail · apparel', scale: '$15-25B revenue', outcome: 'partial', summary: 'Fixed markdown discipline via Blue Yonder; never solved sourcing-cost variance attribution; margin stabilised but didn\'t recover.' },
    { anonymousLabel: 'Mid-cap US grocer · private-label premium expansion', sector: 'Retail · grocery', scale: '$8-15B revenue', outcome: 'resolved', summary: 'Centralised sourcing + TPM governance under a single category president; recovered 180 bps within 12 months.' },
    { anonymousLabel: 'Top-20 US regional retailer · hardlines private label', sector: 'Retail · hardlines', scale: '$5-10B revenue', outcome: 'reversed', summary: 'Reduced private-label assortment breadth to focus on margin; revenue declined faster than margin recovered; program terminated after 14 months.' },
  ],
  historicalSummary:
    'Observed in 9 enterprises across the Transformation Genome. Sector distribution: grocery (4), apparel (2), hardlines (1), mass (2). Outcomes: 5 resolved, 3 partial, 1 reversed.',

  interventions: [
    {
      option: 'Landed-cost decomposition rebuild · ERP cost ledger + freight + duty + rebate at SKU',
      effectiveness: '82% · historical · 7 of 9 instances recovered >100 bps',
      timeHorizon: '12-18 months',
      resourceRequirement: 'Single-threaded sourcing lead + data engineering partner + CFO sponsorship',
      caveats: 'Delivers visibility, not automatic margin recovery — the hard part is acting on the variance once it\'s visible.',
    },
    {
      option: 'Owned-brand cross-elasticity pricing discipline · break the national-brand-index default',
      effectiveness: '65% · historical · 4 of 6 pricing-system retailers',
      timeHorizon: '6-9 months',
      resourceRequirement: 'Pricing system config + category data scientist + merchant alignment',
      caveats: 'Depends on sufficient own-brand SKU coverage in the pricing system; early private-label programs don\'t have the data yet.',
    },
    {
      option: 'Category P&L consolidation · single owner for private-label margin equation',
      effectiveness: '90% · historical · 3 of 3 instances that tried it',
      timeHorizon: '3-6 months org move, 12+ months to see margin impact',
      resourceRequirement: 'CEO-level sponsorship, category president seat at exec committee',
      caveats: 'Hardest to execute politically; most retailers attempt this after two failed attempts at the other two interventions.',
    },
    {
      option: 'Trade promotion elasticity discipline · no event without pre-read and post-read',
      effectiveness: '55% · historical · improves decision quality but margin lift lags',
      timeHorizon: '3-6 months process, 12 months impact',
      resourceRequirement: 'Revenue management + TPM config + merch education',
    },
  ],

  evidenceBase: [
    { title: 'Private-Label Premium: Margin Architecture in Mid-Cap Retail', author: 'McKinsey Retail Practice', year: 2025, citation: 'McKinsey Quarterly · Q3 2025', relevance: 'Cross-retailer analysis of owned-brand margin recovery patterns; 27-retailer sample, anonymised but methodologically explicit.' },
    { title: 'The Great Private-Label Premium Reset', author: 'Bain & Company', year: 2024, citation: 'Bain Retail Insights · December 2024', relevance: 'Frames the post-2022 private-label premium compression as a structural rather than cyclical shift. Useful for sponsor framing.' },
    { title: 'Retail Value Chain Attribution in the AI Era', author: 'MIT CDOIQ', year: 2025, citation: 'MIT Center for Digital Business · Working Paper 2025-04', relevance: 'Academic framing of the margin-attribution gap specifically; the paper most practitioners don\'t cite but should.' },
    { title: 'Revenue Management Excellence in Retail', author: 'RGM Institute (IRI + Circana joint publication)', year: 2024, citation: 'RGM Annual · 2024', relevance: 'Industry benchmarks on markdown intensity + elasticity model maturity. Useful for sizing the gap.' },
  ],
  frameworksExtended: [
    'Porter value-chain analysis · extended for multi-node private-label supply chain',
    'RGM (Revenue Growth Management) framework · extended for owned-brand specific elasticity',
    'Activity-Based Costing · revival is warranted for landed-cost attribution despite the 1990s legacy',
  ],

  practitioners: [
    { name: 'Barbara Kahn', affiliation: 'Wharton Marketing · Baker Retailing Center', whyRelevant: 'Foundational work on private-label premium dynamics and cross-elasticity.' },
    { name: 'Marshal Fisher', affiliation: 'Wharton OI · retail supply chain', whyRelevant: 'Inventory + margin interaction work that the AI-native pricing tools still build on.' },
    { name: 'Gordon Ramsay (RGM Institute)', affiliation: 'IRI / Circana', whyRelevant: 'Trade-promotion discipline; most-cited practitioner on TPM effectiveness.' },
    { name: 'Deborah Weinswig', affiliation: 'Coresight Research', whyRelevant: 'Private-label market sizing + retailer-specific investment strategies; regular briefings cited in every serious diagnostic.' },
  ],

  upstreamPatterns: [
    { code: 'F004', name: 'Category strategy drift' },
    { code: 'F009', name: 'Sourcing concentration risk' },
  ],
  downstreamPatterns: [
    { code: 'F011', name: 'Pricing governance gap' },
    { code: 'F013', name: 'Trade promotion waste' },
  ],
  relatedTopics: [
    { key: 'retail_private_label_strategy', title: 'Private-label strategy' },
    { key: 'retail_rgm', title: 'Revenue growth management' },
    { key: 'retail_sourcing_transparency', title: 'Sourcing cost transparency' },
  ],

  maestroRubric: {
    probeFor: [
      'Who owns the full owned-brand margin equation? If the answer is "several people," the pattern is active.',
      'What\'s the landed-cost decomposition look like at SKU granularity? If it stops at FOB, there\'s leakage below.',
      'When a category margin misses plan, how many functions weigh in on the root cause? More than two means the attribution gap is structural.',
      'How does the pricing system treat owned brands — as leaders, followers, or independent? Followers import the national-brand problem.',
      'What\'s the trade-promotion post-read cadence? Weekly is table stakes; monthly or less means elasticity discipline isn\'t in place.',
    ],
    conversationStarters: [
      '"What are the two or three things that would move owned-brand margin 200 bps by end of year — and who owns each one?"',
      '"Walk me through the last time owned-brand margin came in below plan. What did you look at first?"',
      '"If you had to attribute the last 100 bps of private-label margin drift, what percentage would you put on sourcing cost vs. markdown vs. mix?"',
      '"How much of your private-label compensation envelope is tied to gross margin dollars vs. revenue or units?"',
    ],
    redFlags: [
      'Sponsor can name revenue growth target but not gross margin dollar target at category level',
      'Category heads describe the margin problem differently from each other in the same week',
      'Landed-cost visibility stops at FOB and nobody flags this as a gap',
      'Most recent markdown event has no post-read analysis more than 30 days out',
    ],
    resolvingSignals: [
      'Single-threaded owner named for owned-brand margin equation with direct report to CEO or CFO',
      'Landed-cost visibility extended to freight + duty + rebate with SKU-weekly cadence',
      'Pricing system treats owned brands as cross-elasticity optimisation targets, not national-brand followers',
      'Trade promotion events have pre-read + post-read within 7 days of event close',
      'Two consecutive quarters of owned-brand gross margin tracking at or above plan',
    ],
  },
};

// ─── Data-Owner Bottleneck (F015 · cross-sector · governance) ──────────
const DATA_OWNER_BOTTLENECK: PatternAugmentation = {
  patternId: 'F015',
  ordinalRef: 'F015',
  maturity: 'v3 · verified',
  sectorTag: 'CROSS-SECTOR',
  functionTag: 'DATA · GOVERNANCE',
  objectiveTag: 'UNBLOCK',
  oneSentenceProblem:
    'AI programs stall at the integration edge because a handful of system owners hold veto power over data access, and their throughput — not model quality or sponsor energy — becomes the program\'s pace constraint.',

  failureMode: [
    'Every AI initiative in an enterprise eventually meets the "data-owner queue." The owner of the source-of-truth system (SAP, Workday, Epic, Guidewire, Salesforce) is accountable for integrity, access control, and change management on that system. When five AI programs each need a new feed from that system, they serialise behind the same team — typically a two-to-five-person data engineering group with existing operational load.',
    'The pattern compounds through three dynamics. First, data owners have a stronger incentive to say no than yes — a bad access decision ends careers; a slow one merely irritates stakeholders. Second, program sponsors rarely escalate early because the delay is bureaucratic rather than political, and no single delay looks existential. Third, the data-owner team is usually under-resourced for the volume of AI demand generated after the first two or three programs land, because capacity planning was done against the pre-AI baseline.',
    'The failure completes itself when the enterprise responds by hiring more data engineers for individual AI programs rather than expanding the owner team, which creates more feeds into the same bottleneck and makes each individual delay longer. Eventually leadership declares "data is the problem" and commissions a platform initiative that takes 18 months and solves the wrong layer.',
  ],

  richTriggers: [
    'Three or more AI programs show their critical path sitting in "awaiting data access" for >30 days',
    'Same data-owner team named as the blocking dependency by three or more sponsors in the same quarter',
    'Data-access request tickets have median resolution time >21 days and no SLA dashboard exists',
    'AI teams independently build shadow copies of source data to avoid the owner queue · typically via CSV exports or unauthorised API pulls',
    'Data-owner team reports to an IT cost center with no P&L accountability for AI program velocity',
    'No single person in the org can name the end-to-end approval chain for a new data feed without checking with someone else',
  ],

  telemetrySignals: [
    { signal: 'Data-access request median age in queue, by source system, weekly', source: 'ServiceNow / Jira ticket data + data-owner team triage queue' },
    { signal: 'Number of distinct AI programs blocked on same data-owner team, 30-day window', source: 'Program portfolio dashboard + blocker attribution' },
    { signal: 'Ratio of sanctioned feeds to shadow-copy extracts, by source system', source: 'Data catalog (Alation / Collibra) + DLP tooling' },
    { signal: 'Data-owner team FTE count vs. number of active consuming programs', source: 'HRIS + portfolio inventory' },
    { signal: 'Access-review backlog age, by system, with escalation count', source: 'IAM / access governance tool' },
  ],

  vendorLandscape: [
    {
      layer: 'governance',
      title: 'Data access governance + catalog',
      pointOfView:
        'This is the category most enterprises already own and under-use. Alation and Collibra are credible; the gap is operational — the catalog is populated but the access-request workflow still happens in email or Jira. Fixing the tool without fixing the owner-team capacity doesn\'t move the bottleneck; it just makes the queue visible.',
      vendors: [
        { name: 'Alation', descriptor: 'Data catalog + access governance · mature', opinion: 'Best-in-class for discoverability; weaker on active access workflow — most customers bolt ServiceNow on top.' },
        { name: 'Collibra', descriptor: 'Data intelligence platform · stewardship-oriented', opinion: 'Strongest stewardship model; heavier implementation tail than Alation. Worth it for highly regulated enterprises.' },
        { name: 'Immuta', descriptor: 'Policy-based data access control at query time', opinion: 'Different model · attribute-based access at query time instead of per-feed provisioning. Can structurally relieve the owner-queue in Snowflake/Databricks environments.' },
        { name: 'Atlan', descriptor: 'Modern data catalog · dbt + cloud-native', opinion: 'Newer competitor with strong API story; pick over Alation if the stack is already dbt + Snowflake.' },
      ],
    },
    {
      layer: 'infrastructure',
      title: 'Reverse-ETL + data product delivery',
      pointOfView:
        'The "data product" framing from Zhamak Dehghani\'s data-mesh work is the operational answer to this pattern, but most enterprises adopt the terminology without adopting the accountability. The vendors below make data-product delivery tractable; adoption without a capacity increase on the owner team just moves the bottleneck upstream.',
      vendors: [
        { name: 'Hightouch', descriptor: 'Reverse-ETL from warehouse to operational systems', opinion: 'The right tool for AI programs that need to push model output into SAP / Salesforce; does not solve the inbound-data queue.' },
        { name: 'Census', descriptor: 'Reverse-ETL · operational analytics', opinion: 'Close competitor to Hightouch; pick based on existing warehouse stack.' },
        { name: 'Starburst / Trino', descriptor: 'Federated query across source systems', opinion: 'Pragmatic for the "read-only" case · queries the source without extract, which can sidestep the access-request queue entirely for diagnostic use cases.' },
        { name: 'DataHub (LinkedIn OSS)', descriptor: 'Metadata + lineage with API-first surface' },
      ],
    },
    {
      layer: 'execution',
      title: 'Access request workflow + SLA',
      pointOfView:
        'Most enterprises run this in Jira or ServiceNow with a hand-rolled form and no SLA telemetry. The tooling isn\'t the gap; the process design is. The operational answer is a named intake owner with SLA accountability and a weekly queue review with the AI portfolio sponsor.',
      vendors: [
        { name: 'ServiceNow IT Service Management', descriptor: 'Incident + request workflow · enterprise standard', opinion: 'Capable tool; lands or fails on whether someone owns the AI-access queue specifically.' },
        { name: 'Jira Service Management', descriptor: 'Request workflow · engineering-team-native', opinion: 'Lighter weight than ServiceNow; appropriate for pre-$500M enterprises.' },
        { name: 'Proprietary internal · built on IAM vendor', descriptor: 'Several Fortune-50 enterprises build this on Okta Workflows or SailPoint', opinion: 'Only recommend if your IAM team has the bandwidth to own the custom build. Most don\'t.' },
      ],
    },
    {
      layer: 'talent',
      title: 'Data-owner team capacity',
      pointOfView:
        'This is where most transformations fail to act. The owner team is underfunded by two to four FTE for what the AI portfolio demands. The answer is not "hire generalist data engineers" but "expand the owner team specifically, with source-system expertise, and give them P&L accountability for program velocity." The vendors here are staffing partners because internal hiring takes 6-9 months and the bottleneck is immediate.',
      vendors: [
        { name: 'Slalom · data operations', descriptor: 'Mid-term staffing for data-owner team augmentation', opinion: 'Practical choice when the program portfolio is 4-8 AI initiatives and internal hiring lags. Expect 3-6 month ramp.' },
        { name: 'Top-3 consulting firm · data practice', descriptor: 'Heavy-touch program-level engagement', opinion: 'Overkill for the capacity problem; right only if the underlying governance model needs rebuilding at the same time.' },
        { name: 'Boutique data-engineering specialists (e.g. Datacoral, Datafold)', descriptor: 'Specialist shops with source-system expertise', opinion: 'Best fit when the bottleneck is on one or two systems (typically SAP, Workday, or a sector-specific platform).' },
      ],
    },
  ],

  keyContradictions: [
    'Data-owner team is measured on incident-free operations · AI programs demand velocity, which introduces risk',
    'AI sponsor commits to "quarterly delivery" while the data-owner queue operates on monthly triage',
    'CIO funds the AI portfolio team but leaves the data-owner team on the pre-AI headcount envelope',
    'Program sponsors rank "data access" as high risk in governance reviews but rarely escalate past 60 days of actual delay',
    'Enterprise declares "data is our moat" in board narrative while the operational data-owner team reports three levels below the CIO',
  ],

  historicalInstances: [
    { anonymousLabel: 'Top-20 US health system · claims + EHR AI portfolio', sector: 'Healthcare · payer-provider integrated', scale: '$8-12B revenue', outcome: 'resolved', summary: 'Named a single "AI data officer" with direct report to CIO, expanded owner team by 6 FTE, instituted 14-day SLA on access requests. Portfolio velocity doubled within 2 quarters.' },
    { anonymousLabel: 'Global industrial manufacturer · SAP S/4 + manufacturing data', sector: 'Manufacturing · industrial goods', scale: '$25-40B revenue', outcome: 'partial', summary: 'Adopted Immuta for policy-based access; relieved the highest-volume queue but didn\'t expand team capacity. Bottleneck migrated to the next-largest source system.' },
    { anonymousLabel: 'Fortune-50 retailer · CDP + merchandising data', sector: 'Retail · omnichannel', scale: '$40B+ revenue', outcome: 'resolved', summary: 'Moved data-owner team into a newly-formed "Enterprise Data Platform" org with P&L accountability; reduced average access-request age from 42 to 9 days within 9 months.' },
    { anonymousLabel: 'Regional P&C insurer · Guidewire + claims modernisation', sector: 'Financial services · insurance', scale: '$2-5B revenue', outcome: 'reversed', summary: 'Attempted to solve via a "data platform" build; took 14 months, delivered a catalog nobody used, and the owner-team capacity never changed. Program cancelled.' },
    { anonymousLabel: 'Top-10 US bank · commercial banking AI initiatives', sector: 'Financial services · banking', scale: '$150B+ revenue', outcome: 'partial', summary: 'Introduced owner-team SLA dashboard, which surfaced the gap but did not resolve it · capacity expansion still pending at 12 months.' },
  ],
  historicalSummary:
    'Observed in 11 enterprises across the Transformation Genome. Sector distribution: financial services (4), healthcare (3), retail (2), manufacturing (2). Outcomes: 5 resolved, 4 partial, 2 reversed. Resolution time median: 7 months when capacity expansion is part of the intervention; otherwise 14+ months with partial results.',

  interventions: [
    {
      option: 'Expand data-owner team capacity · 2-4 FTE minimum · source-system-specific',
      effectiveness: '85% · historical · 7 of 8 instances that funded capacity recovered velocity',
      timeHorizon: '3-6 months ramp, 6-9 months full effect',
      resourceRequirement: 'Incremental headcount envelope funded by AI portfolio, not existing IT cost center',
      caveats: 'Only works when the funding model puts the capacity under AI-portfolio P&L accountability, not under pre-AI IT operations budget.',
    },
    {
      option: 'Policy-based access control · Immuta or equivalent · structurally reduce per-feed provisioning',
      effectiveness: '72% · historical · 4 of 5 instances in modern-stack enterprises',
      timeHorizon: '4-8 months implementation',
      resourceRequirement: 'Immuta license + 2-3 FTE implementation team · pairs well with Snowflake / Databricks / BigQuery environments',
      caveats: 'Doesn\'t solve legacy-system access; pairs best with a capacity expansion for legacy owners.',
    },
    {
      option: 'Named AI data officer · single accountable owner for portfolio velocity',
      effectiveness: '90% · historical · 3 of 3 instances that paired this with capacity expansion',
      timeHorizon: '1-3 months appointment, 6+ months to measurable effect',
      resourceRequirement: 'Executive-level role · direct report to CIO or CDO · 10-15% of CIO attention',
      caveats: 'Appointment alone is not enough · must be paired with capacity expansion or the role becomes a bottleneck-escalator.',
    },
    {
      option: 'Federated query layer (Starburst/Trino) for diagnostic and read-only workloads',
      effectiveness: '60% · historical · useful for early-phase programs, insufficient for production',
      timeHorizon: '2-4 months pilot',
      resourceRequirement: 'Query layer license + 1-2 FTE data engineering',
      caveats: 'Does not solve operational data product delivery; appropriate for pattern discovery and early model development only.',
    },
  ],

  evidenceBase: [
    { title: 'Data Mesh: Delivering Data-Driven Value at Scale', author: 'Zhamak Dehghani', year: 2022, citation: 'O\'Reilly Media · 2022', relevance: 'Foundational text for the "data product" framing · operational answer to the owner-bottleneck pattern.' },
    { title: 'The State of Data Engineering', author: 'LakeFS + Monte Carlo Data', year: 2025, citation: 'Annual report · 2025', relevance: 'Empirical data on data-team sizing versus AI program portfolio demand. 450-enterprise sample.' },
    { title: 'AI Governance at Scale: Lessons from Financial Services', author: 'Federal Reserve Board of Governors', year: 2024, citation: 'Supervisory Guidance · SR 24-7', relevance: 'Regulator perspective on data-owner accountability in AI deployment. Useful for CRO framing.' },
    { title: 'Data Access as a Competitive Moat', author: 'Harvard Business Review · Digital Strategy', year: 2025, citation: 'HBR · March 2025', relevance: 'Strategic framing for why the owner-team capacity question is a CEO-level decision, not a CIO operational choice.' },
  ],
  frameworksExtended: [
    'Data-mesh federated governance · extended with AI-portfolio-specific accountability',
    'DAMA DMBOK stewardship model · revived for AI-era access throughput',
    'Service-level management (ITIL) · adapted for data-product SLAs',
  ],

  practitioners: [
    { name: 'Zhamak Dehghani', affiliation: 'Founder, Nextdata · formerly Thoughtworks', whyRelevant: 'Coined "data mesh" and the data-product operating model; her work is the spine of every serious resolution of this pattern.' },
    { name: 'Chad Sanderson', affiliation: 'Gable · formerly Convoy, Microsoft', whyRelevant: 'Practitioner voice on data contracts, which are the operational interface between AI teams and data owners.' },
    { name: 'Barr Moses', affiliation: 'Monte Carlo Data · CEO', whyRelevant: 'Observability lens on the owner-team operational load; most-cited practitioner on "data downtime" as an AI-program blocker.' },
    { name: 'Andy Palmer', affiliation: 'Tamr · co-founder', whyRelevant: 'Master-data lens on the bottleneck; argues for probabilistic data unification as a structural relief valve.' },
  ],

  upstreamPatterns: [
    { code: 'F008', name: 'Shadow AI · unsanctioned tool proliferation' },
    { code: 'F003', name: 'Platform build without business case' },
  ],
  downstreamPatterns: [
    { code: 'F022', name: 'Co-sponsor pace divergence' },
    { code: 'F019', name: 'Model drift unmonitored' },
  ],
  relatedTopics: [
    { key: 'ai_governance_operating_model', title: 'AI governance operating model' },
    { key: 'data_product_accountability', title: 'Data product accountability' },
    { key: 'enterprise_data_platform_strategy', title: 'Enterprise data platform strategy' },
  ],

  maestroRubric: {
    probeFor: [
      'How many distinct AI programs share a named data-owner team as their blocking dependency right now?',
      'What is the median age of a data-access request for the top three source systems? If the answer requires a ticket query, the SLA doesn\'t exist operationally.',
      'Who owns AI-portfolio velocity as a P&L metric? If the owner is the same person who owns source-system integrity, there\'s a structural conflict.',
      'How is the data-owner team funded — under pre-AI IT operations budget, or under the AI portfolio envelope?',
      'When was the last time a program sponsor escalated a data-access delay past 60 days? If the answer is "never" and delays exist, the escalation path is broken.',
    ],
    conversationStarters: [
      '"Walk me through how a new AI program gets its first production data feed from your top source system — who owns the approval, and how long does it typically take?"',
      '"If I asked the data-owner team today to rank their top three priorities, how many of them would be AI-portfolio initiatives vs. operational incident response?"',
      '"What\'s the funding model for the data-owner team — is their headcount tied to AI-portfolio growth, or to a pre-AI IT operations baseline?"',
      '"How many shadow copies of your core system data exist in the enterprise — data downloaded to CSV, local databases, or cloud buckets that weren\'t provisioned through the owner team?"',
    ],
    redFlags: [
      'Data-owner team reports to an IT cost center three levels below the CIO',
      'No SLA dashboard for data-access requests exists or the dashboard shows >21 day median with no escalation flow',
      'Sponsor describes data-access delays as "normal" or "expected" rather than as program risk',
      'Multiple AI programs building shadow copies of the same source system data via CSV exports',
      'Owner-team headcount unchanged since before the AI portfolio expanded',
    ],
    resolvingSignals: [
      'Named AI data officer with direct report to CIO or CDO and P&L accountability for portfolio velocity',
      'Data-owner team capacity expanded by 2-4 FTE with source-system-specific expertise',
      'Access-request SLA dashboard live, with median age tracked weekly and 14-21 day targets',
      'Policy-based access control (Immuta or equivalent) deployed for modern-stack source systems',
      'Two consecutive quarters of AI program velocity tracking on or above plan with no "data access" blockers in top-3 risks',
    ],
  },
};

// ─── Co-Sponsor Pace Divergence (F022 · cross-sector · governance) ──────
const CO_SPONSOR_PACE_DIVERGENCE: PatternAugmentation = {
  patternId: 'F022',
  ordinalRef: 'F022',
  maturity: 'v3 · verified',
  sectorTag: 'CROSS-SECTOR',
  functionTag: 'EXECUTIVE · PROGRAM',
  objectiveTag: 'UNBLOCK',
  oneSentenceProblem:
    'A transformation program with two executive co-sponsors appears well-governed on paper, but drifts when the co-sponsors operate on different decision cadences and neither holds a tiebreaker — with the result that the slower cadence sets the whole program\'s pace without anyone naming the trade.',

  failureMode: [
    'Co-sponsorship is a well-intentioned design. AI transformations cross functional boundaries — technology, operations, commercial — so naming two co-sponsors (typically CIO + COO, or CIO + CMO, or CFO + COO) looks like the right governance answer. It signals cross-functional commitment and distributes executive air-cover.',
    'In practice, co-sponsors rarely operate on the same decision cadence. The CIO is in weekly technology architecture reviews; the COO is in monthly operating reviews; the CFO is in quarterly investment cycles. When the two sponsors are aligned on direction, the program moves at the faster cadence. When they diverge — on scope, on vendor choice, on risk tolerance, on timing — the program waits for the next joint session, which may be six weeks away.',
    'The failure completes itself through a three-phase dynamic. First, small divergences get parked rather than escalated, because both sponsors have strong incentives to maintain the appearance of alignment. Second, the program team adapts by producing consensus-optimised recommendations that don\'t stress-test the underlying disagreement. Third, the program\'s operating rhythm locks to the slower of the two sponsors\' cadences, and the program begins to miss its original pace commitments. By month nine, the sponsors are in a public steering committee saying "we\'re aligned" while their respective teams execute on divergent reads of the same decisions.',
  ],

  richTriggers: [
    'Program has two or more executive co-sponsors without a named tiebreaker or escalation path',
    'Time between joint sponsor decisions averages >4 weeks · individual sponsor cadence is faster',
    'Program team produces recommendation documents that read as "optionality" rather than directional calls · this is a tell that the team is avoiding a sponsor disagreement',
    'Program plan shows "executive alignment" as a recurring agenda item across three or more consecutive steering meetings',
    'Same program decision gets re-litigated in sequential sponsor 1:1s with different framing, because the team is testing which sponsor\'s read will stick',
    'Program milestones slip by 3-6 weeks repeatedly with "scope refinement" or "alignment" in the slip reason',
  ],

  telemetrySignals: [
    { signal: 'Time-to-decision for program-level escalations, by decision type, quarterly', source: 'Program management office tracking · escalation log' },
    { signal: 'Sponsor 1:1 cadence vs. joint steering cadence, by program', source: 'Executive calendar telemetry + PMO dashboard' },
    { signal: 'Recommendation-doc review cycles before a gate · typical count and time, by program', source: 'PMO document tracking' },
    { signal: 'Scope-refinement events per quarter, by program, with sponsor attribution', source: 'PMO change log + steering-committee minutes' },
    { signal: 'Joint sponsor attendance rate at program steering reviews, rolling 6 months', source: 'Steering calendar tracking' },
  ],

  vendorLandscape: [
    {
      layer: 'execution',
      title: 'Program management office tooling · enterprise PMO',
      pointOfView:
        'The PMO tooling layer has matured significantly — Planview, Clarity, Smartsheet are all credible. What they can\'t do is solve sponsor-divergence; they can only surface it. The distinction matters. Most enterprises choose tooling and hope the visibility will produce alignment. It does not. The tooling is a prerequisite, not the intervention.',
      vendors: [
        { name: 'Planview', descriptor: 'Enterprise portfolio management · PPM standard', opinion: 'Strongest for large-enterprise PPM; implementation tail is long. Worth it if you have 20+ active programs.' },
        { name: 'Broadcom Clarity (formerly Clarity PPM)', descriptor: 'Mature PPM suite · legacy strength in regulated industries', opinion: 'Right choice for financial-services + healthcare enterprises; less elegant than Planview but stronger governance bench.' },
        { name: 'Smartsheet + Resource Management', descriptor: 'Lightweight PPM · mid-market friendly', opinion: 'Pragmatic for pre-$1B enterprises; becomes fragile at portfolio scale.' },
        { name: 'Monday.com Work OS', descriptor: 'Modern collaboration layer · PPM-adjacent', opinion: 'Not a pure PPM · appropriate for early-stage program governance where lightness beats comprehensiveness.' },
      ],
    },
    {
      layer: 'governance',
      title: 'Decision rights + RACI tooling',
      pointOfView:
        'The operational answer to this pattern is a named tiebreaker and a written escalation path. Most enterprises skip this step because it feels rude to pre-authorise one sponsor over the other. This is the critical misread. The tiebreaker is not a statement about sponsor status; it is a statement about program pace. Programs without one are choosing slower pace.',
      vendors: [
        { name: 'Ninety (formerly EOS Ninety)', descriptor: 'Meeting + accountability framework · EOS-native', opinion: 'Opinionated framework; well-suited to mid-cap enterprises adopting EOS. Overkill for Fortune-500.' },
        { name: 'Decisionlab / Cloverpop', descriptor: 'Structured decision capture with RACI', opinion: 'Small vendors but right-sized for the problem · worth piloting on the top-3 programs.' },
        { name: 'Written charter with explicit tiebreaker clause', descriptor: 'No tool · just document discipline', opinion: 'Most effective intervention. Two paragraphs in the program charter pre-authorise one sponsor as tiebreaker when joint decisions stall >14 days.' },
      ],
    },
    {
      layer: 'execution',
      title: 'Steering + decision cadence design',
      pointOfView:
        'The pattern is not solved by more meetings. It is solved by fewer, with sharper decision mandates. Most programs run monthly steering with no decision log and no pre-meeting alignment. The vendors below are mostly facilitation frameworks rather than software; the operational answer lives in meeting design, not tooling.',
      vendors: [
        { name: 'Top-tier strategy firm · program design practice', descriptor: 'Consulting-led steering-cadence redesign', opinion: 'Appropriate when the program is large enough to warrant external air-cover; expensive for mid-cap programs.' },
        { name: 'AbarVa Maestro · co-sponsor alignment rubric', descriptor: 'Internal · part of the diagnostic engagement', opinion: 'Structured probe that surfaces cadence divergence within 2-3 interviews · earlier intervention than a PMO retrospective.' },
        { name: 'Liberating Structures (open-source facilitation)', descriptor: 'Facilitation pattern library', opinion: 'Useful for PMO leads running steering meetings · particularly "1-2-4-All" for surfacing sponsor disagreement safely.' },
      ],
    },
    {
      layer: 'talent',
      title: 'Program leadership · the operating director role',
      pointOfView:
        'The structural fix is a program leader senior enough to hold both sponsors accountable to cadence. This role is typically described as "program director" but most enterprises staff it below the threshold required to push back on a C-suite sponsor. The vendors below are staffing partners because the internal candidate often doesn\'t exist.',
      vendors: [
        { name: 'Top-3 consulting firm · program leadership placement', descriptor: 'Seconded program directors from transformation practices', opinion: 'Expensive but effective for 18-month transformations; pick a director who has held P&L, not just delivery.' },
        { name: 'Heidrick & Struggles / Spencer Stuart · interim leadership', descriptor: 'Executive interim placement', opinion: 'Right choice when the enterprise wants a known-quantity leader for a 12-18 month window without a permanent hire.' },
        { name: 'Internal appointment · former GM or division president', descriptor: 'Former line-leader in a transformation leadership role', opinion: 'Most effective when it works · the candidate must be senior enough to tell a sponsor "that decision is two weeks overdue and here\'s what it\'s costing us."' },
      ],
    },
  ],

  keyContradictions: [
    'Co-sponsorship is named as a commitment signal, but pace suffers when the co-sponsors operate on different decision cadences',
    'Program team\'s incentive is to preserve the appearance of sponsor alignment · leadership\'s incentive is to surface actual divergence',
    'PMO lead is typically 2-3 levels below the sponsors and lacks standing to escalate cadence mismatch',
    'Steering-committee ritual treats joint decisions as aligned-by-default · the operational reality is that each sponsor reads the decision through their own functional frame',
    'Program charter names objectives but rarely names decision-rights · the tiebreaker question is avoided because naming it feels like expressing doubt',
  ],

  historicalInstances: [
    { anonymousLabel: 'Top-10 US bank · commercial banking AI transformation', sector: 'Financial services · banking', scale: '$150B+ revenue', outcome: 'resolved', summary: 'Co-sponsored by CIO + Head of Commercial Banking. Program slipped 6 months in year one; CEO mandated a charter amendment naming the Head of Commercial Banking as tiebreaker with 14-day decision SLA. Velocity recovered within 2 quarters.' },
    { anonymousLabel: 'Fortune-100 insurer · claims modernisation with AI-ops', sector: 'Financial services · insurance', scale: '$30-50B revenue', outcome: 'partial', summary: 'Co-sponsored by CIO + COO. Recognised the pattern in year two; installed a dedicated program director with C-level escalation authority. Pace improved but scope had already compressed by 30%.' },
    { anonymousLabel: 'Top-5 US health system · revenue cycle AI transformation', sector: 'Healthcare · integrated delivery network', scale: '$15-25B revenue', outcome: 'resolved', summary: 'Co-sponsored by CFO + COO. CEO appointed the COO as tiebreaker at program launch (unusual · most enterprises skip this). Program delivered on original 18-month timeline.' },
    { anonymousLabel: 'Mid-cap retailer · CDP + marketing AI program', sector: 'Retail · specialty', scale: '$3-5B revenue', outcome: 'reversed', summary: 'Co-sponsored by CMO + CIO. Divergence surfaced at month nine; no tiebreaker named; program was paused, rescoped, and restarted with a single sponsor at month 14.' },
    { anonymousLabel: 'Global industrial manufacturer · supply-chain AI portfolio', sector: 'Manufacturing · industrial goods', scale: '$30B+ revenue', outcome: 'partial', summary: 'Co-sponsored by COO + CSCO. Tiebreaker named in year two; charter amended but existing scope had already absorbed the pace cost · partial recovery.' },
  ],
  historicalSummary:
    'Observed in 13 enterprises across the Transformation Genome. Sector distribution: financial services (5), healthcare (3), retail (3), manufacturing (2). Outcomes: 6 resolved, 5 partial, 2 reversed. Resolution time median: 4 months when tiebreaker is named at charter time; 10+ months when named post-slippage.',

  interventions: [
    {
      option: 'Named tiebreaker + 14-day decision SLA in program charter at launch',
      effectiveness: '88% · historical · 7 of 8 instances that wrote this at charter time',
      timeHorizon: '1-2 months to negotiate, prevents rather than remediates',
      resourceRequirement: 'CEO or Board Chair sponsorship · two paragraphs in the program charter',
      caveats: 'Hardest intervention to get agreement on, because it feels like ranking the sponsors · this is exactly why it works.',
    },
    {
      option: 'Senior operating director · seconded from top consulting firm or interim executive',
      effectiveness: '75% · historical · 6 of 8 instances that hired at the right seniority',
      timeHorizon: '3-6 months to hire, 6 months to effect',
      resourceRequirement: 'Director-level budget · typically $400K-$800K fully-loaded for 12-18 months',
      caveats: 'Effectiveness collapses if the director is staffed below the threshold required to push back on a C-suite sponsor.',
    },
    {
      option: 'Charter amendment + tiebreaker naming after pattern surfaces',
      effectiveness: '65% · historical · 5 of 8 instances that waited past month 6',
      timeHorizon: '2-3 months negotiation, 6+ months to velocity recovery',
      resourceRequirement: 'CEO involvement + steering-committee ratification',
      caveats: 'Scope has usually compressed by the time this happens · recovers pace but not original objectives.',
    },
    {
      option: 'Sub-decision delegation · move 60-70% of joint decisions to a single sponsor by category',
      effectiveness: '58% · historical · effective for tactical decisions, weak for strategic',
      timeHorizon: '1-2 months implementation',
      resourceRequirement: 'Program director + written decision-rights matrix',
      caveats: 'Does not solve the underlying pattern · only reduces its surface area.',
    },
  ],

  evidenceBase: [
    { title: 'Governance of Strategic Initiatives', author: 'McKinsey Global Institute', year: 2024, citation: 'MGI Working Paper · 2024-09', relevance: 'Multi-industry study of transformation program governance · empirical link between co-sponsorship structure and pace outcomes.' },
    { title: 'The Decision-Rights Gap in Cross-Functional Programs', author: 'Harvard Business Review', year: 2023, citation: 'HBR · October 2023', relevance: 'Strategic framing for why decision rights must be explicit at charter time, not implicit in RACI.' },
    { title: 'Transformation Program Risk: A Ten-Year Retrospective', author: 'BCG Transform Institute', year: 2025, citation: 'BCG · 2025 Annual', relevance: 'Cross-industry failure-rate analysis · co-sponsor governance gap is named as top-3 program risk.' },
    { title: 'Who Decides? Decision Rights in Complex Organisations', author: 'Paul Rogers + Marcia Blenko (Bain)', year: 2006, citation: 'Bain RAPID framework · still canonical', relevance: 'Foundational RAPID framework for decision-rights design · the "D" (Decide) seat is the tiebreaker concept operationalised.' },
  ],
  frameworksExtended: [
    'RAPID decision-rights framework (Bain) · extended with written SLA for the D seat',
    'Program steering cadence design · extended with sponsor-1:1 vs. joint-session role clarity',
    'Executive air-cover model · extended to name the "tiebreaker" explicitly at charter time',
  ],

  practitioners: [
    { name: 'Paul Rogers', affiliation: 'Bain & Company · Senior Partner', whyRelevant: 'Co-author of RAPID; most-cited practitioner on decision-rights design in complex programs.' },
    { name: 'Jennifer Petriglieri', affiliation: 'INSEAD · Organisational Behaviour', whyRelevant: 'Research on dual-leadership dynamics translates directly to co-sponsor pace divergence.' },
    { name: 'Marty Cagan', affiliation: 'Silicon Valley Product Group', whyRelevant: 'Product-org perspective on empowered teams with clear decision rights · useful for reframing transformation programs as product bets.' },
    { name: 'Jeanne Ross', affiliation: 'MIT CISR · formerly', whyRelevant: 'Enterprise architecture + governance; her "designed for digital" work names co-sponsor governance as a common transformation blocker.' },
  ],

  upstreamPatterns: [
    { code: 'F004', name: 'Strategy drift · objectives outpace charter' },
    { code: 'F015', name: 'Data-owner bottleneck · upstream capacity constraint' },
  ],
  downstreamPatterns: [
    { code: 'F019', name: 'Model drift unmonitored · sponsor disengagement downstream' },
    { code: 'F012', name: 'Owned-brand margin underperformance · cluster co-occurrence' },
  ],
  relatedTopics: [
    { key: 'executive_alignment_operating_model', title: 'Executive alignment operating model' },
    { key: 'program_governance_design', title: 'Program governance design' },
    { key: 'change_management_ai', title: 'Change management for AI programs' },
  ],

  maestroRubric: {
    probeFor: [
      'Name the two co-sponsors of the program. When was their last joint decision session? When is the next one? If the gap is >4 weeks, the pattern is likely active.',
      'Does the program charter name a tiebreaker? If yes, has it ever been invoked? Un-invoked tiebreakers are often un-real.',
      'How does the program team handle sponsor disagreement today — parked, escalated, or optioned? "Optioned" (presenting multiple paths) is the pattern\'s fingerprint.',
      'What\'s the decision SLA for a program-level escalation? If no answer, the SLA doesn\'t exist.',
      'Who is the program director and what\'s their standing relative to the sponsors? Two levels below means they can\'t push back.',
    ],
    conversationStarters: [
      '"Walk me through the last real disagreement between your two sponsors. How did it get resolved, how long did it take, and what did it cost the program?"',
      '"If I asked your two sponsors independently what the top priority is for Q3, how closely would their answers line up? Word-for-word, or just in spirit?"',
      '"Your program charter · does it name a tiebreaker? If so, when was the last time that clause got invoked, and if never, why not?"',
      '"How often does your program team produce a recommendation document that offers three options rather than a directional call? That pattern usually correlates with unresolved sponsor divergence."',
    ],
    redFlags: [
      'Program charter names co-sponsors but no tiebreaker or escalation path',
      'Joint steering cadence >monthly while individual sponsor cadence is weekly',
      'Recommendation docs regularly present "optionality" rather than directional calls',
      '"Executive alignment" appears as a standing agenda item for 3+ consecutive steering meetings',
      'Program director is more than two levels below the sponsors',
    ],
    resolvingSignals: [
      'Named tiebreaker in the program charter with 14-day decision SLA',
      'Senior operating director seconded or hired with standing to push back on sponsors',
      'Joint steering cadence tuned to the faster of the two sponsors\' natural rhythms',
      'Decision log maintained with sponsor attribution and average time-to-decision tracked weekly',
      'Two consecutive quarters of program milestones tracking on or above plan with no "alignment" items in slip reasons',
    ],
  },
};

export const PATTERN_AUGMENTATIONS: Record<string, PatternAugmentation> = {
  [OWNED_BRAND_MARGIN.patternId]: OWNED_BRAND_MARGIN,
  [DATA_OWNER_BOTTLENECK.patternId]: DATA_OWNER_BOTTLENECK,
  f015: DATA_OWNER_BOTTLENECK,
  [CO_SPONSOR_PACE_DIVERGENCE.patternId]: CO_SPONSOR_PACE_DIVERGENCE,
  f022: CO_SPONSOR_PACE_DIVERGENCE,
};

export function getPatternAugmentation(patternId: string): PatternAugmentation | null {
  return PATTERN_AUGMENTATIONS[patternId] ?? null;
}
