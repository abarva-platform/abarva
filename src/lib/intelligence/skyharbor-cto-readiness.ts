import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

export type ClaimMaturity =
  | 'loaded_fact'
  | 'extracted_commercial_fact'
  | 'calculated'
  | 'relationship_inferred'
  | 'abarva_assessment'
  | 'assumption_led'
  | 'industry_context'
  | 'client_signoff_required'
  | 'missing_evidence';

export interface ClaimMaturityEntry {
  statement: string;
  maturity: ClaimMaturity;
  basis: string;
  confidence: 'high' | 'medium' | 'low';
  signoffRequired: boolean;
}

export interface BranchChoice {
  id: string;
  label: string;
  description: string;
}

export interface DecisionBranch {
  question: string;
  choices: BranchChoice[];
  customAllowed: boolean;
  rawBlock: string;
}

export interface SkyHarborCtoReadinessPacket {
  tenantKey: 'skyharbor-air';
  packetId: 'skyharbor-irops-cto-readiness-v1';
  decision: 'fund_readiness_before_autonomous_scale';
  valueMechanism: string;
  systems: V6Record[];
  dataAssets: V6Record[];
  aiInitiatives: V6Record[];
  programs: V6Record[];
  risksControls: V6Record[];
  spend: V6Record[];
  relationships: V6Record[];
  evidenceSources: V6Record[];
  metrics: V6Record[];
  industryPatterns: V6Record[];
  expertLenses: V6Record[];
  missingEvidenceChecklist: string[];
  planningAssumptions: string[];
  claimMaturity: ClaimMaturityEntry[];
  branch: DecisionBranch;
  sourceFiles: string[];
}

export type V6Record = Record<string, string>;

const REQUIRED_SOURCE_FILES = [
  'V6_02_business_functions.csv',
  'V6_03_org_ownership.csv',
  'V6_04_workforce_personas.csv',
  'V6_05_applications_systems.csv',
  'V6_06_data_assets_integrations.csv',
  'V6_08_spend_value.csv',
  'V6_09_programs_initiatives.csv',
  'V6_10_ai_initiatives.csv',
  'V6_11_operations_risk_controls.csv',
  'V6_12_relationships.csv',
  'V6_13_evidence_sources.csv',
  'V6_14_metric_definitions.csv',
  'V6_15_industry_corpus_patterns.csv',
  'V6_16_expert_lenses.csv',
] as const;

const BRANCH_MARKER = '[DECISION_BRANCH]';

export function buildSkyHarborCtoReadinessPacket(repoRoot = process.cwd()): SkyHarborCtoReadinessPacket {
  const datasetRoot = path.join(repoRoot, 'datasets', 'skyharbor-air-synthetic-v6', 'templates');
  const files = Object.fromEntries(REQUIRED_SOURCE_FILES.map((file) => [file, readV6File(datasetRoot, file)]));
  const systems = filterCto(files['V6_05_applications_systems.csv']);
  const dataAssets = filterCto(files['V6_06_data_assets_integrations.csv']);
  const aiInitiatives = filterCto(files['V6_10_ai_initiatives.csv']);
  const programs = filterCto(files['V6_09_programs_initiatives.csv']);
  const spend = filterCto(files['V6_08_spend_value.csv']);
  const risksControls = filterCto(files['V6_11_operations_risk_controls.csv']);
  const relationships = filterCto(files['V6_12_relationships.csv']);
  const evidenceSources = filterCto(files['V6_13_evidence_sources.csv']);
  const expertLenses = files['V6_16_expert_lenses.csv'].filter((row) => clean(row.expert_lens_name));
  const industryPatterns = files['V6_15_industry_corpus_patterns.csv'].filter((row) =>
    /irops|crew|recovery|autonomous|agentic/i.test(Object.values(row).join(' ')),
  ).slice(0, 10);
  const metrics = files['V6_14_metric_definitions.csv'].filter((row) =>
    /disruption recovery|completion factor|crew utilization|on-time|technical dispatch/i.test(Object.values(row).join(' ')),
  ).slice(0, 10);

  const missingEvidenceChecklist = [
    'Finance-approved disruption cost baseline by event category.',
    'Certified freshness SLA and actual freshness for crew legality, PNR, flight status, and operational event-store feeds.',
    'Model-risk tier approval and validation evidence for IROPS, crew, and passenger recovery AI.',
    'Human-in-loop approval workflow, override log, and accountable control owner.',
    'Contract-system linkage and support SLA for critical IROPS platform vendors.',
    'Measured adoption and realized-value evidence for each AI initiative.',
  ];

  const planningAssumptions = [
    'Use directional value only until Finance approves disruption-cost baseline.',
    'Treat AI readiness as AbarVa assessment until data/control owners sign off.',
    'Keep autonomous customer- or crew-impacting actions human-in-loop until model-risk and operational controls are approved.',
  ];

  const branch = defaultDecisionBranch();

  return {
    tenantKey: 'skyharbor-air',
    packetId: 'skyharbor-irops-cto-readiness-v1',
    decision: 'fund_readiness_before_autonomous_scale',
    valueMechanism: 'IROPS value comes from faster recovery decisions across aircraft, crew, passenger reaccommodation, airport turns, maintenance constraints, customer communications, and disruption-cost avoidance.',
    systems,
    dataAssets,
    aiInitiatives,
    programs,
    risksControls,
    spend,
    relationships,
    evidenceSources,
    metrics,
    industryPatterns,
    expertLenses,
    missingEvidenceChecklist,
    planningAssumptions,
    claimMaturity: buildClaimMaturity({ systems, dataAssets, aiInitiatives, programs, risksControls, spend, relationships, evidenceSources, industryPatterns }),
    branch,
    sourceFiles: [...REQUIRED_SOURCE_FILES],
  };
}

export function composeSkyHarborCtoAnswer(question: string, packet = buildSkyHarborCtoReadinessPacket()): string {
  const lower = question.toLowerCase();
  const boardGrade = /board-grade|board grade|board ready|board-ready/.test(lower);
  const boardGap = /evidence gap|evidence gaps|board decision|board guidance|before.*board|board.*before|board.*evidence/.test(lower);
  const fund = /fund|invest|investment|first/.test(lower);
  const systems = /system|depend/.test(lower);
  const data = /data|certif|freshness|lineage/.test(lower);
  const value = /value|finance|roi|claim/.test(lower);
  const controls = /control|model-risk|risk gate|gate/.test(lower);

  if (boardGrade || boardGap) {
    return composeSkyHarborBoardGapAnswer(packet);
  }

  let pointOfView = 'My point of view: SkyHarbor should fund IROPS readiness before autonomous scale.';
  if (fund) pointOfView = 'My point of view: the CTO should fund the IROPS data foundation, event backbone, and AI governance gate before broad autonomous recovery scale.';
  if (systems) pointOfView = 'My point of view: IROPS depends on a small set of operationally critical systems, and the weak spot is the certified data path across them.';
  if (data) pointOfView = 'My point of view: the data products to certify first are crew legality, flight status, PNR/reservation events, operational event store, and recovery decision history.';
  if (value) pointOfView = 'My point of view: SkyHarbor can claim a directional value story today, but Finance signoff is required before board use.';
  if (controls) pointOfView = 'My point of view: model-risk tiering, human-in-loop control, and operational evidence are the gates that block autonomous scale.';

  const known = [
    `${packet.systems.length} IROPS-critical systems`,
    `${packet.dataAssets.length} data assets/integrations`,
    `${packet.aiInitiatives.length} AI initiatives`,
    `${packet.programs.length} modernization programs`,
    `${packet.risksControls.length} risks/controls`,
  ].join(', ');

  return [
    pointOfView,
    `What this means: treat IROPS AI as a readiness-and-control decision, not just a model deployment. The packet has ${known}, all tied to V6 evidence rows.`,
    `Why it matters: ${packet.valueMechanism}`,
    `Known from loaded evidence: ${packet.systems.slice(0, 4).map((row) => row.system_name).join(', ')}; ${packet.dataAssets.slice(0, 4).map((row) => row.data_asset_name).join(', ')}; and ${packet.aiInitiatives.slice(0, 3).map((row) => row.use_case).join(', ')}.`,
    `Assumption-led or missing: ${packet.missingEvidenceChecklist.slice(0, 4).join(' ')}`,
    `What would make it board-grade: Finance signoff is required for disruption cost and value; client owners must also sign off on data freshness, model-risk tier, HITL control, vendor-system links, and realized value evidence.`,
    formatDecisionBranch(packet.branch),
  ].join('\n\n');
}

function composeSkyHarborBoardGapAnswer(packet: SkyHarborCtoReadinessPacket): string {
  const systems = namedList(packet.systems, 'system_name', 5);
  const programs = namedList(packet.programs, 'record_name', 8);
  const aiInitiatives = namedList(packet.aiInitiatives, 'use_case', 4);
  const risks = namedList(packet.risksControls, 'record_name', 4);

  return [
    'My point of view: the Airline Demo IROPS AI case is not board-ready yet; it is planning-grade and strong enough to fund readiness.',
    [
      '- Fund the readiness gate now: the strongest near-term decision is IROPS data/control readiness, not broad autonomous recovery scale.',
      '- Make Finance and control signoff the board threshold: disruption-cost baseline, realized value, data freshness, model risk, and HITL control need evidence.',
      '- Use the V6 packet as the story spine: systems, programs, AI initiatives, risks, and missing evidence are loaded, but value is not yet board-grade.',
    ].join('\n'),
    `Known from V6: the critical systems include ${systems}; the change programs include ${programs}; and the AI initiatives include ${aiInitiatives}.`,
    `The board gap is specific: ${packet.missingEvidenceChecklist.join(' ')}`,
    `Why this matters: ${packet.valueMechanism} Without certified inputs and controls, a polished IROPS demo can still fail in the operation.`,
    `Risks to name in the discussion: ${risks}. These are not abstract AI risks; they are operating gates that determine whether recommendations can be trusted during disruption.`,
    'What would make it board-ready: Finance signoff is required for disruption value, plus owner-signed freshness SLAs, model-risk tier approval, human-in-loop approval and override logs, vendor/system support linkage, and measured adoption or realized-value evidence.',
    formatDecisionBranch(packet.branch),
  ].join('\n\n');
}

export function parseDecisionBranch(text: string): { visibleText: string; branch: DecisionBranch | null } {
  const source = String(text ?? '');
  const markerIndex = source.indexOf(BRANCH_MARKER);
  if (markerIndex < 0) return { visibleText: source, branch: null };
  const visibleText = source.slice(0, markerIndex).replace(/\s+$/, '');
  const rawBlock = source.slice(markerIndex);
  const lines = rawBlock.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const questionLine = lines.find((line) => line.toLowerCase().startsWith('question:'));
  const customLine = lines.find((line) => line.toLowerCase().startsWith('custom_allowed:'));
  const choiceLines = lines.filter((line) => /^-\s*id:/.test(line));
  const choices = choiceLines.map((line) => {
    const id = line.match(/^-\s*id:\s*([^|]+?)\s*\|/)?.[1]?.trim() ?? 'choice';
    const label = line.match(/\|\s*label:\s*([^|]+?)(?:\s*\||$)/)?.[1]?.trim() ?? id;
    const description = line.match(/\|\s*description:\s*(.+)$/)?.[1]?.trim() ?? '';
    return { id, label, description };
  });
  return {
    visibleText,
    branch: {
      question: questionLine?.replace(/^question:\s*/i, '').trim() ?? 'Choose the next step.',
      choices,
      customAllowed: /true/i.test(customLine ?? ''),
      rawBlock,
    },
  };
}

export function formatDecisionBranch(branch: DecisionBranch): string {
  return [
    BRANCH_MARKER,
    `question: ${branch.question}`,
    ...branch.choices.map((choice) => `- id: ${choice.id} | label: ${choice.label} | description: ${choice.description}`),
    `custom_allowed: ${branch.customAllowed ? 'true' : 'false'}`,
  ].join('\n');
}

function defaultDecisionBranch(): DecisionBranch {
  const branch: DecisionBranch = {
    question: 'How should aVa make this IROPS readiness answer more precise?',
    choices: [
      {
        id: 'use_planning_assumptions',
        label: 'Use planning assumptions',
        description: 'Size and sequence the case directionally while labeling every value as assumption-led.',
      },
      {
        id: 'enter_missing_values',
        label: 'Enter missing values',
        description: 'Ask for disruption cost, event volume, implementation range, and owner-approved readiness values.',
      },
      {
        id: 'generate_evidence_checklist',
        label: 'Generate evidence checklist',
        description: 'Create the Finance, Ops, Data, and AI Governance evidence request needed for board-grade confidence.',
      },
      {
        id: 'continue_readiness_only',
        label: 'Continue readiness-only',
        description: 'Avoid financial sizing and focus on systems, data, controls, and next decisions.',
      },
      {
        id: 'ask_owner_for_evidence',
        label: 'Ask owner for evidence',
        description: 'Route missing evidence to the named owner where the V6 packet identifies one.',
      },
    ],
    customAllowed: true,
    rawBlock: '',
  };
  return { ...branch, rawBlock: formatDecisionBranch(branch) };
}

function buildClaimMaturity(inputs: {
  systems: V6Record[];
  dataAssets: V6Record[];
  aiInitiatives: V6Record[];
  programs: V6Record[];
  risksControls: V6Record[];
  spend: V6Record[];
  relationships: V6Record[];
  evidenceSources: V6Record[];
  industryPatterns: V6Record[];
}): ClaimMaturityEntry[] {
  return [
    {
      statement: 'SkyHarbor has a loaded IROPS-critical systems and data readiness packet.',
      maturity: 'loaded_fact',
      basis: `${inputs.systems.length} systems and ${inputs.dataAssets.length} data assets loaded from V6 rows.`,
      confidence: 'high',
      signoffRequired: false,
    },
    {
      statement: 'IROPS AI should fund readiness before autonomous scale.',
      maturity: 'abarva_assessment',
      basis: `${inputs.risksControls.length} risks/controls and ${inputs.aiInitiatives.length} AI initiatives show open readiness/control gates.`,
      confidence: 'medium',
      signoffRequired: true,
    },
    {
      statement: 'IROPS value sizing is planning-grade until Finance approves disruption cost and realized value.',
      maturity: 'client_signoff_required',
      basis: `${inputs.spend.length} planning-budget rows and no finance-approved realized value row.`,
      confidence: 'high',
      signoffRequired: true,
    },
    {
      statement: 'System/data dependencies are relationship-backed but still require owner validation before board use.',
      maturity: 'relationship_inferred',
      basis: `${inputs.relationships.length} typed relationships in the CTO packet.`,
      confidence: 'medium',
      signoffRequired: true,
    },
    {
      statement: 'Airlines commonly gate IROPS AI on data freshness, crew legality, DOT/customer obligations, and HITL auditability.',
      maturity: 'industry_context',
      basis: `${inputs.industryPatterns.length} industry-context pattern rows; not tenant fact.`,
      confidence: 'medium',
      signoffRequired: false,
    },
    {
      statement: 'Missing evidence should trigger branches, not fabricated precision.',
      maturity: 'missing_evidence',
      basis: 'Finance value, model risk, data freshness, and control signoff remain explicit checklist items.',
      confidence: 'high',
      signoffRequired: false,
    },
  ];
}

function filterCto(rows: V6Record[]): V6Record[] {
  return rows.filter((row) => /SHA-(SYS|DATA|AI|PROG|SPEND|RISK|REL|EVID)-CTO-/i.test(row.record_id ?? ''));
}

function readV6File(root: string, file: string): V6Record[] {
  const filePath = path.join(root, file);
  if (!existsSync(filePath)) throw new Error(`Missing SkyHarbor V6 file: ${filePath}`);
  return parseCsv(readFileSync(filePath, 'utf8'));
}

function parseCsv(text: string): V6Record[] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    const next = text[index + 1];
    if (character === '"' && quoted && next === '"') {
      field += '"';
      index += 1;
    } else if (character === '"') {
      quoted = !quoted;
    } else if (character === ',' && !quoted) {
      row.push(field);
      field = '';
    } else if ((character === '\n' || character === '\r') && !quoted) {
      if (character === '\r' && next === '\n') index += 1;
      row.push(field);
      if (row.some((value) => value.length > 0)) rows.push(row);
      row = [];
      field = '';
    } else {
      field += character;
    }
  }
  if (field.length || row.length) {
    row.push(field);
    if (row.some((value) => value.length > 0)) rows.push(row);
  }
  const headers = rows.shift() ?? [];
  return rows.map((values) => Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ''])));
}

function clean(value: unknown): string {
  const text = String(value ?? '').trim();
  if (!text || text.startsWith('data_thin:')) return '';
  return text;
}

function namedList(rows: V6Record[], key: string, limit: number): string {
  const values = rows
    .map((row) => clean(row[key]) || clean(row.record_name))
    .filter(Boolean)
    .slice(0, limit);
  return values.length > 0 ? values.join(', ') : 'no named items loaded';
}
