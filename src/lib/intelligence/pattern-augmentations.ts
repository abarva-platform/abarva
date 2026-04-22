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

export const PATTERN_AUGMENTATIONS: Record<string, PatternAugmentation> = {
  [OWNED_BRAND_MARGIN.patternId]: OWNED_BRAND_MARGIN,
};

export function getPatternAugmentation(patternId: string): PatternAugmentation | null {
  return PATTERN_AUGMENTATIONS[patternId] ?? null;
}
