export type OutputDisciplineAgent = 'nexus' | 'sentinel' | 'atlas' | 'source' | 'steward';

export type OutputShapePattern =
  | 'lead-bullets'
  | 'lead-table'
  | 'stat-stack'
  | 'sequential-steps'
  | 'brief-narrative';

export interface AgentOutputGoldenFixture {
  id: string;
  agent: OutputDisciplineAgent;
  surface: string;
  industry: 'retail' | 'healthcare' | 'financial_services' | 'cross_industry';
  pattern: OutputShapePattern;
  question: string;
  output: string;
  requiredPhrases: string[];
}

function sources(...refs: Array<{ ref: string; reliability: 'HIGH' | 'MEDIUM' | 'LOW' }>): string {
  return `<abv-sources>${refs.map((source) => `<abv-source ref="${source.ref}" reliability="${source.reliability}"/>`).join('')}</abv-sources>`;
}

function leadBullets(input: {
  lead: string;
  bullets: string[];
  sourceRef: string;
  reliability?: 'HIGH' | 'MEDIUM' | 'LOW';
}): string {
  return [
    `<p>${input.lead}</p>`,
    `<ul>${input.bullets.map((bullet) => `<li>${bullet}</li>`).join('')}</ul>`,
    sources({ ref: input.sourceRef, reliability: input.reliability ?? 'HIGH' }),
  ].join('\n');
}

function leadTable(input: {
  lead: string;
  headers: string[];
  rows: string[][];
  synthesis: string;
  sourceRef: string;
  reliability?: 'HIGH' | 'MEDIUM' | 'LOW';
}): string {
  return [
    `<p>${input.lead}</p>`,
    '<table>',
    `<thead><tr>${input.headers.map((header) => `<th>${header}</th>`).join('')}</tr></thead>`,
    `<tbody>${input.rows.map((row) => `<tr>${row.map((cell) => `<td>${cell}</td>`).join('')}</tr>`).join('')}</tbody>`,
    '</table>',
    `<p>${input.synthesis}</p>`,
    sources({ ref: input.sourceRef, reliability: input.reliability ?? 'HIGH' }),
  ].join('\n');
}

function statStack(input: {
  lead: string;
  stats: string[];
  sourceRef: string;
  reliability?: 'HIGH' | 'MEDIUM' | 'LOW';
}): string {
  return [
    `<p>${input.lead}</p>`,
    `<ul data-variant="stat-stack">${input.stats.map((stat) => `<li>${stat}</li>`).join('')}</ul>`,
    sources({ ref: input.sourceRef, reliability: input.reliability ?? 'HIGH' }),
  ].join('\n');
}

function sequentialSteps(input: {
  lead: string;
  steps: string[];
  outcome: string;
  sourceRef: string;
  reliability?: 'HIGH' | 'MEDIUM' | 'LOW';
}): string {
  return [
    `<p>${input.lead}</p>`,
    `<ol>${input.steps.map((step) => `<li>${step}</li>`).join('')}</ol>`,
    `<p>${input.outcome}</p>`,
    sources({ ref: input.sourceRef, reliability: input.reliability ?? 'HIGH' }),
  ].join('\n');
}

function briefNarrative(input: {
  paragraphs: string[];
  sourceRef: string;
  reliability?: 'HIGH' | 'MEDIUM' | 'LOW';
}): string {
  return [
    ...input.paragraphs.map((paragraph) => `<p>${paragraph}</p>`),
    sources({ ref: input.sourceRef, reliability: input.reliability ?? 'HIGH' }),
  ].join('\n');
}

const nexusFixtures: AgentOutputGoldenFixture[] = [
  {
    id: 'nexus-retail-merch-value',
    agent: 'nexus',
    surface: '/strategic-moves/new',
    industry: 'retail',
    pattern: 'lead-bullets',
    question: 'For Apex Retail, where is the biggest AI value in merchandising based on KPIs and systems?',
    output: leadBullets({
      lead: 'Demand forecasting is still the strongest Move candidate because it touches revenue leakage, inventory productivity, and planner trust at once.',
      bullets: [
        'Forecast quality is tied to <abv-usecase id="UC-RTL-MID-001">demand sensing modernization</abv-usecase>, which is the cleanest path from signal to operating action.',
        'Inventory turns and markdown pressure point to <abv-pattern id="P-RTL-INV-004">forecast-to-allocation control</abv-pattern> rather than a pure personalization bet.',
        'The Move should stay scoped to one category cluster until KPI ownership and exception workflow are explicit.',
      ],
      sourceRef: 'Apex merchandising KPI snapshot',
    }),
    requiredPhrases: ['Demand forecasting', 'one category cluster'],
  },
  {
    id: 'nexus-healthcare-sponsor',
    agent: 'nexus',
    surface: '/strategic-moves/new',
    industry: 'healthcare',
    pattern: 'lead-bullets',
    question: 'Who should sponsor an ambient documentation Move?',
    output: leadBullets({
      lead: 'The sponsor should be a clinical-operating dyad, not the CIO alone.',
      bullets: [
        '<abv-pattern id="P-HC-005">CMIO sponsorship pattern</abv-pattern> should anchor the charter because adoption depends on physician workflow credibility.',
        'The CIO should own platform, privacy, and integration readiness, but not clinical behavior change alone.',
        'The first gate should require a named physician champion, target specialty, and baseline documentation burden.',
      ],
      sourceRef: 'Healthcare agentic AI pattern pack',
    }),
    requiredPhrases: ['clinical-operating dyad', 'physician champion'],
  },
  {
    id: 'nexus-fs-kyc-move',
    agent: 'nexus',
    surface: '/strategic-moves/new',
    industry: 'financial_services',
    pattern: 'sequential-steps',
    question: 'How should we shape a KYC automation Move without creating compliance risk?',
    output: sequentialSteps({
      lead: 'Shape the KYC Move as supervised decision acceleration, not autonomous approval.',
      steps: [
        'Baseline current queue age, exception rate, analyst touch time, and audit finding frequency.',
        'Design the agent workflow around evidence gathering, entity resolution, and analyst review.',
        'Gate the pilot on explainability, model-risk signoff, and adverse-action escalation rules.',
      ],
      outcome: 'The result should be faster case preparation with human-owned compliance judgment.',
      sourceRef: 'Financial services compliance pattern pack',
    }),
    requiredPhrases: ['supervised decision acceleration', 'human-owned compliance judgment'],
  },
  {
    id: 'nexus-retail-compare-moves',
    agent: 'nexus',
    surface: '/strategic-moves/new',
    industry: 'retail',
    pattern: 'lead-table',
    question: 'Compare demand forecasting, markdown optimization, and retail media as Move candidates.',
    output: leadTable({
      lead: 'Demand forecasting is the best first Move; markdown optimization is the best second Move.',
      headers: ['Move', 'Strength', 'Risk', 'Fit'],
      rows: [
        ['Demand forecasting', 'Direct KPI line to turns and stockouts', 'Needs trusted item-location data', 'Best first'],
        ['Markdown optimization', 'Margin recovery is visible', 'Needs SKU margin governance', 'Best second'],
        ['Retail media', 'Revenue upside is real', 'Less tied to current pain', 'Later wave'],
      ],
      synthesis: 'Start where the operational pain and data readiness overlap.',
      sourceRef: 'Apex retail strategy and KPI profile',
    }),
    requiredPhrases: ['Best first', 'operational pain'],
  },
  {
    id: 'nexus-cross-failure-mode',
    agent: 'nexus',
    surface: '/strategic-moves/new',
    industry: 'cross_industry',
    pattern: 'lead-bullets',
    question: 'What failure mode should I watch before promoting this Move?',
    output: leadBullets({
      lead: 'The main failure mode is promoting a plausible AI idea before the operating owner and measurement method are real.',
      bullets: [
        '<abv-pattern id="P-XI-FM-002">sponsor ambiguity failure mode</abv-pattern> shows up when the executive sponsor cannot change the workflow.',
        '<abv-pattern id="P-XI-FM-004">value-baseline gap</abv-pattern> shows up when the team names a benefit but not the baseline.',
        'Hold the gate until owner, KPI, baseline, and first workflow decision are explicit.',
      ],
      sourceRef: 'Cross-industry AI program failure-mode library',
    }),
    requiredPhrases: ['operating owner', 'Hold the gate'],
  },
  {
    id: 'nexus-healthcare-background',
    agent: 'nexus',
    surface: '/strategic-moves/new',
    industry: 'healthcare',
    pattern: 'brief-narrative',
    question: 'Why is prior authorization now a strategic move instead of an operations improvement?',
    output: briefNarrative({
      paragraphs: [
        'Prior authorization has become strategic because it now affects access, margin, clinician capacity, and member experience at the same time. Treating it as a back-office workflow misses the enterprise value at stake.',
        'The better Move frame is decision orchestration: clean evidence, agent-assisted packet assembly, and human review for exceptions. That keeps speed gains tied to compliance control.',
      ],
      sourceRef: 'Healthcare payer operations pattern pack',
    }),
    requiredPhrases: ['decision orchestration', 'human review'],
  },
  {
    id: 'nexus-retail-missing-data',
    agent: 'nexus',
    surface: '/strategic-moves/new',
    industry: 'retail',
    pattern: 'lead-bullets',
    question: 'Can we approve the markdown AI Move today?',
    output: leadBullets({
      lead: 'Not yet. The Move is promising, but the value case is not gate-ready until SKU margin and markdown ownership are visible.',
      bullets: [
        'Known: sell-through and markdown pressure make <abv-usecase id="UC-RTL-MID-004">markdown optimization</abv-usecase> a credible opportunity.',
        'Missing: SKU contribution margin, promotion lift, and current markdown decision cadence.',
        'Next: promote only after the category owner accepts the baseline and exception workflow.',
      ],
      sourceRef: 'Apex retail merchandising evidence profile',
    }),
    requiredPhrases: ['Not yet', 'SKU contribution margin'],
  },
  {
    id: 'nexus-fs-benchmark',
    agent: 'nexus',
    surface: '/strategic-moves/new',
    industry: 'financial_services',
    pattern: 'stat-stack',
    question: 'What does the data say about where AML investigation AI creates value?',
    output: statStack({
      lead: 'The strongest value signal is analyst productivity, not autonomous case closure.',
      stats: [
        'Queue aging and false-positive rate are the first two baselines to capture.',
        'Alert enrichment and narrative drafting are safer than auto-disposition in early phases.',
        '<abv-pattern id="P-FS-RISK-006">human-owned disposition pattern</abv-pattern> should stay binding through pilot.',
      ],
      sourceRef: 'Financial services AML workflow pattern pack',
    }),
    requiredPhrases: ['analyst productivity', 'auto-disposition'],
  },
  {
    id: 'nexus-source-handoff',
    agent: 'nexus',
    surface: '/strategic-moves/new',
    industry: 'cross_industry',
    pattern: 'lead-bullets',
    question: 'Which vendor should we pick for this Move?',
    output: leadBullets({
      lead: 'I can shape the Move and vendor criteria, but final vendor comparison belongs in Source.',
      bullets: [
        'For Nexus, the decision is whether the Move has sponsor, scope, KPI, and evidence readiness.',
        'For Source, the decision is vendor fit, commercial risk, implementation partner, and BAFO structure.',
        'Next: I can hand this to Source with the required capabilities and gate evidence.',
      ],
      sourceRef: 'AbarVa agent lane discipline',
    }),
    requiredPhrases: ['belongs in Source', 'required capabilities'],
  },
  {
    id: 'nexus-retail-steps-p0-p1',
    agent: 'nexus',
    surface: '/strategic-moves/new',
    industry: 'retail',
    pattern: 'sequential-steps',
    question: 'Walk me from P0 Originate to P1 Charter for merchandising AI.',
    output: sequentialSteps({
      lead: 'Move from idea to charter by proving the bet, sponsor, scope, and evidence path.',
      steps: [
        'Name the bet in business terms: forecast accuracy improves margin and availability.',
        'Confirm the sponsor who can change merchandising workflow and data ownership.',
        'Define the charter boundary by category, channel, KPI, and pilot timebox.',
      ],
      outcome: 'P1 should start with a bounded program, not an open-ended AI exploration.',
      sourceRef: 'Strategic Moves phase pack P0-P1',
    }),
    requiredPhrases: ['business terms', 'bounded program'],
  },
  {
    id: 'nexus-healthcare-pattern-fit',
    agent: 'nexus',
    surface: '/strategic-moves/new',
    industry: 'healthcare',
    pattern: 'lead-bullets',
    question: 'Does the CMIO sponsorship pattern apply to revenue cycle AI?',
    output: leadBullets({
      lead: 'Partly. CMIO sponsorship matters when clinician behavior changes; revenue cycle also needs CFO and operations ownership.',
      bullets: [
        '<abv-pattern id="P-HC-005">CMIO sponsorship pattern</abv-pattern> applies if documentation workflow changes.',
        '<abv-pattern id="P-HC-RCM-003">revenue-cycle operating owner pattern</abv-pattern> applies if the main workflow is coding, denial, or collection.',
        'Use a triad sponsor model when clinical documentation and financial realization both matter.',
      ],
      sourceRef: 'Healthcare revenue cycle pattern pack',
    }),
    requiredPhrases: ['Partly', 'triad sponsor'],
  },
  {
    id: 'nexus-cross-one-line',
    agent: 'nexus',
    surface: '/strategic-moves/new',
    industry: 'cross_industry',
    pattern: 'brief-narrative',
    question: 'Is this a Move or just a task?',
    output: briefNarrative({
      paragraphs: [
        'It is a Move if it changes a business outcome, crosses functions, and needs executive sponsorship. It is a task if one team can finish it without changing workflow, budget, or governance.',
        'My read: keep it as a task until the KPI owner and cross-functional dependency are named.',
      ],
      sourceRef: 'Strategic Moves classification guidance',
    }),
    requiredPhrases: ['changes a business outcome', 'keep it as a task'],
  },
];

const sentinelFixtures: AgentOutputGoldenFixture[] = [
  {
    id: 'sentinel-retail-usecase-landscape',
    agent: 'sentinel',
    surface: '/intelligence',
    industry: 'retail',
    pattern: 'lead-table',
    question: 'What retail AI bets should we consider beyond merchandising?',
    output: leadTable({
      lead: 'The strongest retail AI landscape has three lanes: merchandising, customer engagement, and store operations.',
      headers: ['Lane', 'Best use case', 'Primary KPI', 'Risk'],
      rows: [
        ['Merchandising', '<abv-usecase id="UC-RTL-MID-001">demand sensing</abv-usecase>', 'MAPE and turns', 'Data trust'],
        ['Customer', '<abv-usecase id="UC-RTL-FRONT-003">next-best-action</abv-usecase>', 'conversion', 'Consent'],
        ['Stores', '<abv-usecase id="UC-RTL-MID-009">labor scheduling AI</abv-usecase>', 'coverage', 'Adoption'],
      ],
      synthesis: 'Start with the lane where KPI pain and source-system readiness are both visible.',
      sourceRef: 'Retail AI use-case coverage matrix',
    }),
    requiredPhrases: ['three lanes', 'source-system readiness'],
  },
  {
    id: 'sentinel-healthcare-ambient-pattern',
    agent: 'sentinel',
    surface: '/intelligence',
    industry: 'healthcare',
    pattern: 'lead-bullets',
    question: 'What is the success pattern for ambient clinical documentation?',
    output: leadBullets({
      lead: 'Ambient documentation succeeds when clinical sponsorship, specialty scoping, and privacy workflow move together.',
      bullets: [
        '<abv-pattern id="P-HC-005">CMIO sponsorship pattern</abv-pattern> anchors trust and adoption.',
        '<abv-pattern id="P-HC-007">primary-care-first pilot pattern</abv-pattern> keeps the first scope measurable.',
        '<abv-usecase id="REG-US-005">HIPAA BAA readiness</abv-usecase> should start before vendor downselect.',
      ],
      sourceRef: 'Healthcare front-office AI pattern pack',
    }),
    requiredPhrases: ['clinical sponsorship', 'vendor downselect'],
  },
  {
    id: 'sentinel-fs-regulatory',
    agent: 'sentinel',
    surface: '/intelligence',
    industry: 'financial_services',
    pattern: 'lead-bullets',
    question: 'What is our exposure if we use GenAI in loan underwriting?',
    output: leadBullets({
      lead: 'The exposure is highest where GenAI influences credit decisioning, adverse action, or protected-class fairness.',
      bullets: [
        '<abv-pattern id="P-FS-MRM-002">model-risk governance pattern</abv-pattern> requires inventory, validation, and monitoring.',
        'Use GenAI for document extraction and analyst support before recommendation or decision generation.',
        'Require human-owned final decision and explainability evidence before pilot expansion.',
      ],
      sourceRef: 'Financial services model-risk pattern pack',
    }),
    requiredPhrases: ['credit decisioning', 'human-owned final decision'],
  },
  {
    id: 'sentinel-retail-score-profile',
    agent: 'sentinel',
    surface: '/intelligence',
    industry: 'retail',
    pattern: 'stat-stack',
    question: 'Score Apex Retail readiness for demand sensing patterns.',
    output: statStack({
      lead: 'Apex is medium-ready for demand sensing: KPI pain is clear, but data ownership is not fully proven.',
      stats: [
        'Strong signal: forecast accuracy, turns, stockout, and markdown KPIs are relevant.',
        'Weak signal: SKU margin and promotion-level forecast accuracy are not yet visible.',
        'Required pattern: <abv-pattern id="P-RTL-INV-004">forecast-to-allocation control</abv-pattern>.',
      ],
      sourceRef: 'Apex Retail tenant intelligence profile',
    }),
    requiredPhrases: ['medium-ready', 'SKU margin'],
  },
  {
    id: 'sentinel-healthcare-i-dont-know',
    agent: 'sentinel',
    surface: '/intelligence',
    industry: 'healthcare',
    pattern: 'brief-narrative',
    question: 'Which Epic module is underperforming at the client?',
    output: briefNarrative({
      paragraphs: [
        'I do not have evidence for a specific underperforming Epic module in the retrieved client context. I can discuss common pattern risks, but I should not name a module as a fact without tenant evidence.',
        'The next useful step is to retrieve application telemetry, ticket history, revenue-cycle denial data, or clinical workflow feedback tied to the module in question.',
      ],
      sourceRef: 'Tenant evidence availability policy',
      reliability: 'HIGH',
    }),
    requiredPhrases: ['do not have evidence', 'should not name'],
  },
  {
    id: 'sentinel-source-handoff',
    agent: 'sentinel',
    surface: '/intelligence',
    industry: 'cross_industry',
    pattern: 'lead-bullets',
    question: 'Which vendor should we include in the RFP?',
    output: leadBullets({
      lead: 'Sentinel can identify the pattern and capability requirements; Source should own the vendor longlist.',
      bullets: [
        'Pattern fit: define workflow, data domains, guardrails, and evidence requirements first.',
        'Vendor fit: Source should compare capability, implementation risk, commercial terms, and proof points.',
        'Next: send Source the pattern family and must-have capabilities.',
      ],
      sourceRef: 'AbarVa agent lane discipline',
    }),
    requiredPhrases: ['Source should own', 'must-have capabilities'],
  },
  {
    id: 'sentinel-retail-pattern-detail',
    agent: 'sentinel',
    surface: '/intelligence',
    industry: 'retail',
    pattern: 'lead-bullets',
    question: 'What pattern prevents merchandising AI from becoming shelfware?',
    output: leadBullets({
      lead: 'The pattern is planner-in-the-loop decisioning, not model-only forecasting.',
      bullets: [
        '<abv-pattern id="P-RTL-MERCH-006">planner override governance pattern</abv-pattern> defines when humans accept, override, or escalate model recommendations.',
        '<abv-pattern id="P-RTL-DATA-002">SKU-store data quality pattern</abv-pattern> prevents bad signals from eroding trust.',
        'Measure accepted recommendation rate and override reason codes during pilot.',
      ],
      sourceRef: 'Retail merchandising AI pattern pack',
    }),
    requiredPhrases: ['planner-in-the-loop', 'override reason codes'],
  },
  {
    id: 'sentinel-healthcare-pop-health',
    agent: 'sentinel',
    surface: '/intelligence',
    industry: 'healthcare',
    pattern: 'lead-table',
    question: 'Compare care navigation, risk adjustment, and prior auth as healthcare AI bets.',
    output: leadTable({
      lead: 'Prior authorization is the operationally sharpest bet; care navigation is the experience bet.',
      headers: ['Bet', 'Value lever', 'Data need', 'Best owner'],
      rows: [
        ['Care navigation', 'Experience', 'Access and referral data', 'COO'],
        ['Risk adjustment', 'Revenue quality', 'Clinical documentation', 'CFO'],
        ['Prior auth', 'Speed and cost', 'Policy and claims evidence', 'COO/CIO'],
      ],
      synthesis: 'Pick prior auth first if workflow speed is the board-level pain.',
      sourceRef: 'Healthcare middle-office AI coverage matrix',
    }),
    requiredPhrases: ['Prior authorization', 'board-level pain'],
  },
  {
    id: 'sentinel-fs-aml-pattern',
    agent: 'sentinel',
    surface: '/intelligence',
    industry: 'financial_services',
    pattern: 'lead-bullets',
    question: 'What pattern should guide an AML agentic workflow?',
    output: leadBullets({
      lead: 'Use an evidence-assembly pattern, not autonomous AML disposition.',
      bullets: [
        '<abv-pattern id="P-FS-AML-003">case evidence assembly pattern</abv-pattern> lets agents gather, summarize, and cite evidence.',
        '<abv-pattern id="P-FS-RISK-006">human-owned disposition pattern</abv-pattern> keeps final judgment with analysts.',
        'Escalation rules should trigger on sanctions exposure, identity ambiguity, and high-value transfers.',
      ],
      sourceRef: 'Financial services AML pattern pack',
    }),
    requiredPhrases: ['evidence-assembly', 'human-owned disposition'],
  },
  {
    id: 'sentinel-cross-long-question',
    agent: 'sentinel',
    surface: '/intelligence',
    industry: 'cross_industry',
    pattern: 'brief-narrative',
    question: 'Long setup: we have many AI ideas, many executives, and no clear model. What should Sentinel do first?',
    output: briefNarrative({
      paragraphs: [
        'Sentinel should first classify the ideas into pattern families and failure modes. That turns a noisy idea list into a map of what is proven, what is risky, and what evidence is missing.',
        'The next step is not ranking everything. The next step is separating ideas with reusable pattern support from ideas that are still unsupported hypotheses.',
      ],
      sourceRef: 'AbarVa intelligence operating model',
    }),
    requiredPhrases: ['pattern families', 'unsupported hypotheses'],
  },
  {
    id: 'sentinel-retail-current-affairs',
    agent: 'sentinel',
    surface: '/intelligence',
    industry: 'retail',
    pattern: 'lead-bullets',
    question: 'How is AI reshaping retail now?',
    output: leadBullets({
      lead: 'AI is reshaping retail around decision velocity: demand, customer relevance, labor, and content operations.',
      bullets: [
        '<abv-usecase id="UC-RTL-MID-001">demand sensing modernization</abv-usecase> shortens the buy-plan feedback loop.',
        '<abv-usecase id="UC-RTL-FRONT-003">next-best-action personalization</abv-usecase> connects loyalty data to offers and service.',
        '<abv-usecase id="UC-RTL-BACK-006">product content automation</abv-usecase> reduces cycle time for digital commerce.',
      ],
      sourceRef: 'Retail AI coverage matrix',
    }),
    requiredPhrases: ['decision velocity', 'digital commerce'],
  },
  {
    id: 'sentinel-healthcare-safety',
    agent: 'sentinel',
    surface: '/intelligence',
    industry: 'healthcare',
    pattern: 'lead-bullets',
    question: 'What guardrail matters most for patient-facing agents?',
    output: leadBullets({
      lead: 'The first guardrail is escalation clarity: the agent must know when not to answer.',
      bullets: [
        '<abv-pattern id="P-HC-RAI-002">clinical escalation boundary pattern</abv-pattern> separates education from medical advice.',
        'Patient identity, consent, and care-team routing must be verified before personalized guidance.',
        'Every response should disclose uncertainty when evidence is incomplete.',
      ],
      sourceRef: 'Healthcare responsible AI pattern pack',
    }),
    requiredPhrases: ['when not to answer', 'disclose uncertainty'],
  },
];

const atlasFixtures: AgentOutputGoldenFixture[] = [
  {
    id: 'atlas-retail-value-risk',
    agent: 'atlas',
    surface: '/tower',
    industry: 'retail',
    pattern: 'lead-bullets',
    question: 'Which Apex AI initiative is most likely to miss value this quarter?',
    output: leadBullets({
      lead: 'APX-04 is the highest value-risk item because baseline ownership and gate evidence are both weak.',
      bullets: [
        'Value confidence is low until the benefit owner accepts the KPI baseline.',
        'Delivery risk is concentrated in unresolved platform dependency and sponsor ambiguity.',
        'Decision: pause new scope until gate evidence is complete.',
      ],
      sourceRef: 'Apex Tower portfolio state',
    }),
    requiredPhrases: ['APX-04', 'pause new scope'],
  },
  {
    id: 'atlas-healthcare-value-separation',
    agent: 'atlas',
    surface: '/tower',
    industry: 'healthcare',
    pattern: 'lead-bullets',
    question: 'Separate projected, tracked, and verified value for the ambient AI portfolio.',
    output: leadBullets({
      lead: 'Projected value can stay in the business case, but tracked and verified value must be separated before the next review.',
      bullets: [
        'Projected: expected documentation-time reduction from <abv-usecase id="UC-HC-FRONT-001">ambient AI clinical documentation</abv-usecase>.',
        'Tracked: weekly adoption, edit rate, and clinician satisfaction in the pilot cohort.',
        'Verified: finance-approved productivity or access improvement after baseline comparison.',
      ],
      sourceRef: 'Atlas value-grounding policy',
    }),
    requiredPhrases: ['Projected', 'Verified'],
  },
  {
    id: 'atlas-fs-risk-table',
    agent: 'atlas',
    surface: '/tower',
    industry: 'financial_services',
    pattern: 'lead-table',
    question: 'Compare portfolio risk across AML, KYC, and advisor copilot initiatives.',
    output: leadTable({
      lead: 'AML is the highest control risk; advisor copilot is the highest adoption risk.',
      headers: ['Initiative', 'Primary risk', 'Confidence', 'Decision'],
      rows: [
        ['AML agent', 'Compliance control', 'Medium', 'Require model-risk review'],
        ['KYC automation', 'Data quality', 'Medium', 'Pilot with analyst review'],
        ['Advisor copilot', 'Adoption', 'Low', 'Tighten enablement plan'],
      ],
      synthesis: 'Treat risk as different by workflow; do not use one generic AI governance gate.',
      sourceRef: 'Financial services portfolio risk view',
    }),
    requiredPhrases: ['highest control risk', 'model-risk review'],
  },
  {
    id: 'atlas-retail-data-says',
    agent: 'atlas',
    surface: '/tower',
    industry: 'retail',
    pattern: 'stat-stack',
    question: 'What does the portfolio data say about Apex merchandising AI?',
    output: statStack({
      lead: 'The data says merchandising AI value is real but not fully baselined.',
      stats: [
        'Forecast accuracy, inventory turns, markdown rate, and stockout rate are the key KPI chain.',
        'The baseline gap is SKU margin and promotion-level forecast accuracy.',
        'The portfolio decision should be confidence-gated, not enthusiasm-gated.',
      ],
      sourceRef: 'Apex Tower KPI and initiative snapshot',
    }),
    requiredPhrases: ['not fully baselined', 'confidence-gated'],
  },
  {
    id: 'atlas-cross-board-summary',
    agent: 'atlas',
    surface: '/tower',
    industry: 'cross_industry',
    pattern: 'brief-narrative',
    question: 'Give me the board-level read on the AI portfolio.',
    output: briefNarrative({
      paragraphs: [
        'The portfolio is directionally right but unevenly governed. The strongest programs connect AI to a named KPI and a decision workflow; the weakest ones still read like technology experiments.',
        'The board decision is whether to fund breadth or confidence. My recommendation is to protect the few programs with baselines and slow anything that lacks an accountable owner.',
      ],
      sourceRef: 'Atlas portfolio synthesis policy',
    }),
    requiredPhrases: ['directionally right', 'protect the few programs'],
  },
  {
    id: 'atlas-retail-next-review',
    agent: 'atlas',
    surface: '/tower',
    industry: 'retail',
    pattern: 'sequential-steps',
    question: 'Walk me through the next portfolio review.',
    output: sequentialSteps({
      lead: 'Run the review as a value-confidence meeting, not a status meeting.',
      steps: [
        'Start with initiatives that changed KPI confidence since the last review.',
        'Separate value into projected, tracked, and verified categories.',
        'Close with decisions: accelerate, hold, narrow scope, or stop.',
      ],
      outcome: 'The outcome should be fewer ambiguous programs and clearer funding choices.',
      sourceRef: 'Atlas governance review playbook',
    }),
    requiredPhrases: ['value-confidence meeting', 'accelerate'],
  },
  {
    id: 'atlas-healthcare-claims',
    agent: 'atlas',
    surface: '/tower',
    industry: 'healthcare',
    pattern: 'lead-bullets',
    question: 'Where is the value in claims AI?',
    output: leadBullets({
      lead: 'Claims AI value is strongest in evidence assembly, routing, and exception reduction, not black-box adjudication.',
      bullets: [
        '<abv-usecase id="UC-HC-MID-006">claims evidence orchestration</abv-usecase> reduces manual packet assembly.',
        'Baseline cycle time, rework rate, and denial overturn rate before estimating savings.',
        'Keep human review for medical necessity and contested decisions.',
      ],
      sourceRef: 'Healthcare payer middle-office pattern pack',
    }),
    requiredPhrases: ['not black-box', 'denial overturn'],
  },
  {
    id: 'atlas-fs-unknown',
    agent: 'atlas',
    surface: '/tower',
    industry: 'financial_services',
    pattern: 'brief-narrative',
    question: 'What is the verified ROI of our advisor copilot?',
    output: briefNarrative({
      paragraphs: [
        'I do not see verified ROI in the retrieved portfolio context. I can discuss projected value or tracked adoption, but verified ROI requires finance-approved measurement after baseline comparison.',
        'The next step is to separate usage, productivity proxy, and validated business value before presenting this to the investment committee.',
      ],
      sourceRef: 'Atlas value-grounding policy',
    }),
    requiredPhrases: ['do not see verified ROI', 'finance-approved'],
  },
  {
    id: 'atlas-retail-source-handoff',
    agent: 'atlas',
    surface: '/tower',
    industry: 'retail',
    pattern: 'lead-bullets',
    question: 'Which implementation partner should we use?',
    output: leadBullets({
      lead: 'Atlas can tell you where partner risk sits in the portfolio; Source should own the partner comparison.',
      bullets: [
        'Portfolio lens: identify which initiatives depend on partner delivery or vendor integration.',
        'Source lens: compare implementation capability, commercial exposure, and proof points.',
        'Next: send Source the initiatives with partner dependency and value-at-risk.',
      ],
      sourceRef: 'AbarVa agent lane discipline',
    }),
    requiredPhrases: ['Source should own', 'value-at-risk'],
  },
  {
    id: 'atlas-cross-value-levers',
    agent: 'atlas',
    surface: '/tower',
    industry: 'cross_industry',
    pattern: 'lead-table',
    question: 'Compare revenue, cost, risk, and experience value levers in the AI portfolio.',
    output: leadTable({
      lead: 'The portfolio should not treat all value levers as equally measurable at the same time.',
      headers: ['Lever', 'Best proof', 'Common trap', 'Review action'],
      rows: [
        ['Revenue', 'Conversion or retention', 'Attribution optimism', 'Require baseline'],
        ['Cost', 'Cycle-time reduction', 'Double counting', 'Validate with finance'],
        ['Risk', 'Incident reduction', 'Avoided-cost inflation', 'Track controls'],
        ['Experience', 'NPS or CSAT', 'Survey noise', 'Pair with behavior'],
      ],
      synthesis: 'Use different evidence standards by value lever.',
      sourceRef: 'Atlas value realization framework',
    }),
    requiredPhrases: ['evidence standards', 'Validate with finance'],
  },
  {
    id: 'atlas-healthcare-steps',
    agent: 'atlas',
    surface: '/tower',
    industry: 'healthcare',
    pattern: 'sequential-steps',
    question: 'How do we verify value for care navigation AI?',
    output: sequentialSteps({
      lead: 'Verify care navigation value by connecting access, utilization, and experience metrics.',
      steps: [
        'Set baseline for appointment conversion, leakage, and call deflection.',
        'Track cohort usage and routing accuracy during pilot.',
        'Verify value only after finance and operations accept the measurement method.',
      ],
      outcome: 'The answer should distinguish tracked value from verified value.',
      sourceRef: 'Healthcare value measurement pattern pack',
    }),
    requiredPhrases: ['appointment conversion', 'verified value'],
  },
  {
    id: 'atlas-retail-scope-creep',
    agent: 'atlas',
    surface: '/tower',
    industry: 'retail',
    pattern: 'lead-bullets',
    question: 'Which portfolio program is at risk from scope creep?',
    output: leadBullets({
      lead: 'The program with the most scope-creep risk is the one adding channels before the first category pilot is measured.',
      bullets: [
        '<abv-pattern id="P-XI-FM-008">scope expansion before evidence pattern</abv-pattern> predicts delayed value realization.',
        'Hold expansion until category KPI movement and planner adoption are visible.',
        'Decision: preserve the pilot boundary and defer enterprise rollout claims.',
      ],
      sourceRef: 'Cross-industry AI failure-mode library',
    }),
    requiredPhrases: ['scope-creep risk', 'defer enterprise rollout'],
  },
];

const sourceFixtures: AgentOutputGoldenFixture[] = [
  {
    id: 'source-retail-bafo',
    agent: 'source',
    surface: '/source',
    industry: 'retail',
    pattern: 'lead-bullets',
    question: 'How should I shape BAFO for a retail AI merchandising platform?',
    output: leadBullets({
      lead: 'Make BAFO prove integration, adoption, and run cost rather than demo polish.',
      bullets: [
        'Require SKU-location history ingestion, POS integration, allocation integration, and exception handling proof.',
        'Ask vendors to show planner workflow fit against <abv-pattern id="P-RTL-MERCH-006">planner override governance pattern</abv-pattern>.',
        'Gate award on a working category pilot and named operating owner.',
      ],
      sourceRef: 'Retail AI sourcing pattern pack',
    }),
    requiredPhrases: ['demo polish', 'category pilot'],
  },
  {
    id: 'source-healthcare-vendor-table',
    agent: 'source',
    surface: '/source',
    industry: 'healthcare',
    pattern: 'lead-table',
    question: 'Compare ambient documentation vendors for a health system pilot.',
    output: leadTable({
      lead: 'Compare vendors on workflow fit and clinical risk controls before price.',
      headers: ['Vendor type', 'Strength', 'Watch-out', 'Proof needed'],
      rows: [
        ['Incumbent', 'EHR integration', 'Roadmap lock-in', 'Specialty pilot'],
        ['Challenger', 'User experience', 'Integration depth', 'BAA and FHIR proof'],
        ['Emerging', 'Speed', 'Support maturity', 'Reference checks'],
      ],
      synthesis: 'Shortlist only vendors that can support clinical governance and measurable adoption.',
      sourceRef: 'Healthcare vendor evaluation pattern pack',
    }),
    requiredPhrases: ['workflow fit', 'BAA'],
  },
  {
    id: 'source-fs-rfp',
    agent: 'source',
    surface: '/source',
    industry: 'financial_services',
    pattern: 'sequential-steps',
    question: 'How should we construct an RFP for AML agentic AI?',
    output: sequentialSteps({
      lead: 'Build the RFP around controlled evidence assembly, not autonomous AML decisions.',
      steps: [
        'Define workflows: alert enrichment, case narrative, entity resolution, and analyst review.',
        'Require model-risk, audit trail, data lineage, and sanctions escalation evidence.',
        'Score vendors through a case-pack exercise using anonymized historical alerts.',
      ],
      outcome: 'The RFP should prove control and analyst productivity together.',
      sourceRef: 'Financial services sourcing pattern pack',
    }),
    requiredPhrases: ['controlled evidence assembly', 'case-pack exercise'],
  },
  {
    id: 'source-retail-longlist',
    agent: 'source',
    surface: '/source',
    industry: 'retail',
    pattern: 'lead-table',
    question: 'Build a longlist for retail demand forecasting AI.',
    output: leadTable({
      lead: 'The longlist should cover platform incumbents, retail specialists, and data-science challengers.',
      headers: ['Segment', 'Why include', 'Screening test', 'Risk'],
      rows: [
        ['Incumbent', 'ERP and planning proximity', 'SAP/Retalix integration', 'Shelfware'],
        ['Specialist', 'Merchandising depth', 'SKU-store forecasting proof', 'Scale'],
        ['Challenger', 'Model agility', 'Pilot speed', 'Support maturity'],
      ],
      synthesis: 'Keep the first pass segment-based until evidence narrows the field.',
      sourceRef: 'Retail vendor landscape pattern pack',
    }),
    requiredPhrases: ['segment-based', 'SKU-store'],
  },
  {
    id: 'source-cross-ambiguous-status',
    agent: 'source',
    surface: '/source',
    industry: 'cross_industry',
    pattern: 'brief-narrative',
    question: 'Is this vendor approved?',
    output: briefNarrative({
      paragraphs: [
        'I do not see approval status in the retrieved sourcing context. I can treat the vendor as a candidate, but I should not call it approved without procurement or governance evidence.',
        'The next step is to check stage status, required artifacts, commercial risk review, and decision authority before using approved language.',
      ],
      sourceRef: 'Source event governance policy',
    }),
    requiredPhrases: ['do not see approval status', 'decision authority'],
  },
  {
    id: 'source-healthcare-health-signal',
    agent: 'source',
    surface: '/source',
    industry: 'healthcare',
    pattern: 'stat-stack',
    question: 'What vendor health signals matter for a patient access platform?',
    output: statStack({
      lead: 'Vendor health should be judged on implementation reliability, support capacity, and integration proof.',
      stats: [
        'Reference implementation age matters more than demo maturity.',
        'Support model and escalation SLA should be tested before award.',
        'FHIR, identity, scheduling, and contact-center integrations are critical dependencies.',
      ],
      sourceRef: 'Healthcare patient access sourcing pattern pack',
    }),
    requiredPhrases: ['implementation reliability', 'FHIR'],
  },
  {
    id: 'source-retail-commercial-risk',
    agent: 'source',
    surface: '/source',
    industry: 'retail',
    pattern: 'lead-bullets',
    question: 'What commercial traps should we avoid in merchandising AI contracts?',
    output: leadBullets({
      lead: 'Avoid pricing models that scale before adoption and value are proven.',
      bullets: [
        'Do not buy enterprise SKU volume until one category pilot proves usage and value.',
        'Tie expansion to data ingestion, planner adoption, and KPI movement.',
        'Require exit rights if integration or data-quality dependencies fail.',
      ],
      sourceRef: 'Retail AI commercial risk pattern pack',
    }),
    requiredPhrases: ['pricing models', 'exit rights'],
  },
  {
    id: 'source-fs-vendor-risk',
    agent: 'source',
    surface: '/source',
    industry: 'financial_services',
    pattern: 'lead-bullets',
    question: 'What vendor risk matters most for a credit AI vendor?',
    output: leadBullets({
      lead: 'The biggest vendor risk is explainability under model-risk and fair-lending review.',
      bullets: [
        'Require evidence for feature lineage, monitoring, and adverse-action support.',
        'Use <abv-pattern id="P-FS-MRM-002">model-risk governance pattern</abv-pattern> as a non-negotiable screen.',
        'Do not advance vendors that cannot support audit-ready decision trails.',
      ],
      sourceRef: 'Financial services vendor risk pattern pack',
    }),
    requiredPhrases: ['fair-lending', 'audit-ready'],
  },
  {
    id: 'source-cross-handoff-nexus',
    agent: 'source',
    surface: '/source',
    industry: 'cross_industry',
    pattern: 'lead-bullets',
    question: 'Should we turn this sourcing event into a Strategic Move?',
    output: leadBullets({
      lead: 'Source can identify the sourcing signal, but Nexus should decide whether it becomes a Strategic Move.',
      bullets: [
        'Source evidence: vendor market, commercial risk, implementation options, and BAFO terms.',
        'Nexus evidence: business bet, sponsor, phase gate, KPI baseline, and change scope.',
        'Next: hand off the sourcing signal to Moves with the business outcome and decision needed.',
      ],
      sourceRef: 'AbarVa agent lane discipline',
    }),
    requiredPhrases: ['Nexus should decide', 'business outcome'],
  },
  {
    id: 'source-healthcare-steps-bafo',
    agent: 'source',
    surface: '/source',
    industry: 'healthcare',
    pattern: 'sequential-steps',
    question: 'Walk me through BAFO for prior authorization AI.',
    output: sequentialSteps({
      lead: 'BAFO should force proof of policy logic, evidence handling, and exception workflow.',
      steps: [
        'Require a test packet using de-identified prior authorization cases.',
        'Score evidence extraction, policy matching, escalation handling, and audit trail.',
        'Negotiate pricing around verified throughput and exception reduction.',
      ],
      outcome: 'The award should favor controlled workflow proof over generic automation claims.',
      sourceRef: 'Healthcare payer sourcing playbook',
    }),
    requiredPhrases: ['test packet', 'controlled workflow proof'],
  },
  {
    id: 'source-retail-systems',
    agent: 'source',
    surface: '/source',
    industry: 'retail',
    pattern: 'stat-stack',
    question: 'What system dependencies should vendors prove for Apex Retail?',
    output: statStack({
      lead: 'The vendor proof should focus on merchandising systems, not generic data-platform claims.',
      stats: [
        'POS, inventory, allocation, promotion, and product hierarchy data are required.',
        'SAP and Retalix integration should be demonstrated with sample data flows.',
        'Data-quality exception handling should be visible inside planner workflow.',
      ],
      sourceRef: 'Apex retail system landscape',
    }),
    requiredPhrases: ['merchandising systems', 'sample data flows'],
  },
  {
    id: 'source-fs-narrative',
    agent: 'source',
    surface: '/source',
    industry: 'financial_services',
    pattern: 'brief-narrative',
    question: 'Why is the vendor market confusing for AI governance tools?',
    output: briefNarrative({
      paragraphs: [
        'The market is confusing because governance, observability, model-risk, security, and workflow vendors all claim the same control plane. Most are strong in one layer and thin in the others.',
        'A good sourcing motion separates policy management, evidence capture, runtime monitoring, and audit reporting before comparing products.',
      ],
      sourceRef: 'AI governance vendor landscape pattern pack',
    }),
    requiredPhrases: ['same control plane', 'audit reporting'],
  },
];

const stewardFixtures: AgentOutputGoldenFixture[] = [
  {
    id: 'steward-retail-readiness',
    agent: 'steward',
    surface: '/admin/setup',
    industry: 'retail',
    pattern: 'lead-bullets',
    question: 'Are Apex data connections ready for C-level testing?',
    output: leadBullets({
      lead: 'Apex setup is usable for scripted CXO testing, but not yet fully confidence-grade.',
      bullets: [
        'Ready: tenant identity, portfolio context, and core retail KPI labels.',
        'Gap: KPI ownership, source freshness, and evidence-upload status need confirmation.',
        'Next: fix ownership fields before live testing with executives.',
      ],
      sourceRef: 'Apex setup readiness profile',
    }),
    requiredPhrases: ['usable for scripted', 'ownership fields'],
  },
  {
    id: 'steward-healthcare-connectors',
    agent: 'steward',
    surface: '/admin/setup',
    industry: 'healthcare',
    pattern: 'lead-table',
    question: 'Compare readiness across EHR, claims, and HR connectors.',
    output: leadTable({
      lead: 'EHR readiness matters most for clinical AI; claims readiness matters most for payer operations.',
      headers: ['Connector', 'Use', 'Readiness check', 'Risk'],
      rows: [
        ['EHR', 'Clinical workflow', 'Identity and encounter mapping', 'Privacy'],
        ['Claims', 'Prior auth and RCM', 'Policy and status history', 'Lag'],
        ['HR', 'Workforce analysis', 'Role and location mapping', 'Access'],
      ],
      synthesis: 'Prioritize the connector tied to the first executive test case.',
      sourceRef: 'Healthcare setup connector guide',
    }),
    requiredPhrases: ['EHR readiness', 'first executive test case'],
  },
  {
    id: 'steward-fs-data-trust',
    agent: 'steward',
    surface: '/admin/setup',
    industry: 'financial_services',
    pattern: 'sequential-steps',
    question: 'How do we prepare data trust for a KYC AI pilot?',
    output: sequentialSteps({
      lead: 'Prepare data trust by proving lineage, access, and owner acceptance before pilot.',
      steps: [
        'Map customer, entity, document, case, and analyst-action data domains.',
        'Confirm access policy, retention, and model-risk review ownership.',
        'Record freshness, quality caveats, and missing fields in the setup profile.',
      ],
      outcome: 'The pilot should start with known evidence limits, not hidden data assumptions.',
      sourceRef: 'Financial services setup readiness guide',
    }),
    requiredPhrases: ['lineage', 'hidden data assumptions'],
  },
  {
    id: 'steward-cross-role-mapping',
    agent: 'steward',
    surface: '/admin/setup',
    industry: 'cross_industry',
    pattern: 'stat-stack',
    question: 'What setup facts are required before agents can answer CXO questions?',
    output: statStack({
      lead: 'The minimum setup facts are tenant, industry, role, KPI dictionary, source freshness, and access scope.',
      stats: [
        'Without tenant and industry, pattern retrieval loses relevance.',
        'Without KPI dictionary, value answers become generic.',
        'Without access scope, agents may overstate what they can see.',
      ],
      sourceRef: 'AbarVa setup governance policy',
    }),
    requiredPhrases: ['minimum setup facts', 'overstate'],
  },
  {
    id: 'steward-retail-unknown',
    agent: 'steward',
    surface: '/admin/setup',
    industry: 'retail',
    pattern: 'brief-narrative',
    question: 'Is Apex SKU margin data connected?',
    output: briefNarrative({
      paragraphs: [
        'I do not see confirmed SKU margin connectivity in the current setup context. I can see merchandising KPI labels, but that is not the same as validated margin-level data access.',
        'Before Nexus ranks markdown value with confidence, setup should confirm the source system, owner, freshness, and access scope for SKU margin data.',
      ],
      sourceRef: 'Apex setup readiness profile',
    }),
    requiredPhrases: ['do not see confirmed', 'not the same'],
  },
  {
    id: 'steward-healthcare-privacy',
    agent: 'steward',
    surface: '/admin/setup',
    industry: 'healthcare',
    pattern: 'lead-bullets',
    question: 'What privacy setup is needed for patient-facing AI?',
    output: leadBullets({
      lead: 'Patient-facing AI needs identity, consent, PHI access, and escalation boundaries configured before testing.',
      bullets: [
        'Confirm which users and agents can access protected health information.',
        'Map consent and care-team routing before personalized guidance is enabled.',
        'Document escalation rules from <abv-pattern id="P-HC-RAI-002">clinical escalation boundary pattern</abv-pattern>.',
      ],
      sourceRef: 'Healthcare setup governance guide',
    }),
    requiredPhrases: ['PHI access', 'escalation rules'],
  },
  {
    id: 'steward-fs-permissions',
    agent: 'steward',
    surface: '/admin/setup',
    industry: 'financial_services',
    pattern: 'lead-bullets',
    question: 'Can every executive see AML investigation details?',
    output: leadBullets({
      lead: 'No. AML investigation details should follow role and need-to-know access, not broad executive visibility.',
      bullets: [
        'Executives can see portfolio risk and aggregate controls when permitted.',
        'Case-level details need compliance-approved access scope.',
        'Setup should log the access boundary before agent testing.',
      ],
      sourceRef: 'Financial services access governance policy',
    }),
    requiredPhrases: ['No', 'Case-level details'],
  },
  {
    id: 'steward-retail-training-path',
    agent: 'steward',
    surface: '/admin/setup',
    industry: 'retail',
    pattern: 'sequential-steps',
    question: 'Walk me through setup before Carlos tests Nexus.',
    output: sequentialSteps({
      lead: 'Prepare Carlos by validating identity, Apex context, and response grounding.',
      steps: [
        'Confirm Clerk persona, active tenant, and role permissions.',
        'Verify Apex KPI dictionary, financial context, systems, and active Moves.',
        'Run golden prompts for Nexus and Atlas before the live walkthrough.',
      ],
      outcome: 'The test should feel grounded in Apex Retail, not a generic demo.',
      sourceRef: 'Apex CXO test readiness runbook',
    }),
    requiredPhrases: ['Clerk persona', 'Apex Retail'],
  },
  {
    id: 'steward-cross-compare-agents',
    agent: 'steward',
    surface: '/admin/setup',
    industry: 'cross_industry',
    pattern: 'lead-table',
    question: 'Compare what setup each agent needs.',
    output: leadTable({
      lead: 'Each agent needs the same tenant identity but different evidence depth.',
      headers: ['Agent', 'Needs most', 'Risk if missing', 'Setup action'],
      rows: [
        ['Nexus', 'Moves and KPIs', 'Generic advice', 'Load phase context'],
        ['Sentinel', 'Corpus and profile', 'Weak pattern fit', 'Index patterns'],
        ['Atlas', 'Portfolio values', 'Bad prioritization', 'Validate baselines'],
        ['Source', 'Vendor event data', 'Bad comparisons', 'Load sourcing artifacts'],
      ],
      synthesis: 'Setup should validate the evidence lane before each agent is tested.',
      sourceRef: 'AbarVa setup governance policy',
    }),
    requiredPhrases: ['same tenant identity', 'evidence lane'],
  },
  {
    id: 'steward-healthcare-sources',
    agent: 'steward',
    surface: '/admin/setup',
    industry: 'healthcare',
    pattern: 'stat-stack',
    question: 'What sources prove healthcare agent readiness?',
    output: statStack({
      lead: 'Healthcare readiness needs source proof for identity, clinical workflow, privacy, and evidence freshness.',
      stats: [
        'EHR and identity mapping prove clinical context.',
        'Policy and consent configuration prove safe personalization.',
        'Uploaded evidence and source timestamps prove recency.',
      ],
      sourceRef: 'Healthcare setup readiness guide',
    }),
    requiredPhrases: ['identity mapping', 'source timestamps'],
  },
  {
    id: 'steward-retail-data-owner',
    agent: 'steward',
    surface: '/admin/setup',
    industry: 'retail',
    pattern: 'lead-bullets',
    question: 'Who owns Apex merchandising KPI quality?',
    output: leadBullets({
      lead: 'I do not see a confirmed merchandising KPI quality owner in setup.',
      bullets: [
        'Known: the KPI labels are present enough for scripted CXO testing.',
        'Missing: accountable owner, source freshness, and dispute process.',
        'Next: assign the merchandising analytics owner before value-ranking prompts.',
      ],
      sourceRef: 'Apex setup readiness profile',
    }),
    requiredPhrases: ['do not see', 'assign'],
  },
  {
    id: 'steward-cross-narrative',
    agent: 'steward',
    surface: '/admin/setup',
    industry: 'cross_industry',
    pattern: 'brief-narrative',
    question: 'Why do setup issues make agents sound dumb?',
    output: briefNarrative({
      paragraphs: [
        'Agents sound generic when setup does not prove who the tenant is, what evidence is current, and which facts they are allowed to use. The model can reason, but it cannot responsibly invent missing enterprise context.',
        'The fix is not just a smarter prompt. The fix is tenant identity, evidence freshness, access scope, and corpus retrieval all arriving before synthesis.',
      ],
      sourceRef: 'AbarVa setup governance policy',
    }),
    requiredPhrases: ['generic', 'before synthesis'],
  },
];

export const AGENT_OUTPUT_GOLDEN_FIXTURES: AgentOutputGoldenFixture[] = [
  ...nexusFixtures,
  ...sentinelFixtures,
  ...atlasFixtures,
  ...sourceFixtures,
  ...stewardFixtures,
];

