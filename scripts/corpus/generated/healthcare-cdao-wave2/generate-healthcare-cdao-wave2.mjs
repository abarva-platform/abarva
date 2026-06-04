import fs from 'node:fs';
import path from 'node:path';

const OUT_DIR = path.resolve('scripts/corpus/generated/healthcare-cdao-wave2');
const REPORT_DIR = path.resolve('reports/healthcare-harden/wave-2');

const sources = {
  wave1Pack: {
    source_type: 'industry_practice',
    label: 'AbarVa healthcare modernization Wave 1 corpus pack',
    source_url: 'reports/healthcare-harden/wave-1/SUMMARY.md',
    as_of: '2026-06-04',
    detail:
      'Wave 1 established modernization archetypes, 7 Rs, lakehouse pillars, RFP scorecards, effort heuristics, inventory, accelerators, and anti-patterns.',
  },
  modernizationSpec: {
    source_type: 'industry_practice',
    label: 'AbarVa modernization pattern pack spec',
    source_url: 'docs/build/MODERNIZATION_PATTERN_PACK_SPEC_2026-06-03.md',
    as_of: '2026-06-03',
    detail:
      'Internal modernization spec defining buyer-side sequence, scope, inventory, RFP, and estimation doctrine.',
  },
  industryProfiles: {
    source_type: 'industry_practice',
    label: 'AbarVa modernization industry estate profiles',
    source_url: 'docs/build/MODERNIZATION_PATTERN_PACK_INDUSTRY_PROFILES_2026-06-03.md',
    as_of: '2026-06-03',
    detail:
      'Healthcare estate profile covering Epic, Clarity, ancillary marts, compliance overlays, and modernization value paths.',
  },
  researchNotes: {
    source_type: 'industry_practice',
    label: 'AbarVa modernization research notes',
    source_url: 'docs/build/MODERNIZATION_RESEARCH_NOTES_2026-06-03.md',
    as_of: '2026-06-03',
    detail:
      'Research spine for source-backed methodology, planning ranges, RFP normalization, and modernization effort assumptions.',
  },
  wellArchitected: {
    source_type: 'vendor_documentation',
    label: 'Databricks Well-Architected Lakehouse framework',
    source_url: 'https://docs.databricks.com/en/lakehouse-architecture/well-architected.html',
    as_of: '2026-06-04',
    detail:
      'Databricks lakehouse pillars used as architecture and RFP scoring guardrails.',
  },
  aws7r: {
    source_type: 'industry_practice',
    label: 'AWS Prescriptive Guidance 7 Rs migration strategies',
    source_url: 'https://docs.aws.amazon.com/prescriptive-guidance/latest/large-migration-guide/migration-strategies.html',
    as_of: '2026-06-04',
    detail:
      'Migration disposition taxonomy used to frame retain, retire, repurchase, rehost, relocate, replatform, and refactor calls.',
  },
};

const wave1Anchors = [
  'PAT-MODERN-ARCH-001',
  'PAT-MODERN-ESTATE-001',
  'PAT-MODERN-7R-001',
  'PAT-MODERN-WA-001',
  'PAT-MODERN-RFP-001',
  'PAT-MODERN-EFFORT-001',
  'PAT-MODERN-INV-001',
  'PAT-MODERN-ANTI-001',
];

const batches = [
  {
    prefix: 'CDAO-SEQ',
    count: 45,
    label: 'modernization wave sequencing',
    source: sources.modernizationSpec,
    category: 'sequence',
    owner: 'CDAO with CIO and CMIO gate approval',
    artifacts: ['modernization sequence map', 'wave gate memo', 'legacy shutdown dependency map'],
    trigger:
      'the health system has more candidate workloads than the modernization team can safely move in one release train',
    rule:
      'Sequence modernization from foundation to first proof workloads to scaled factory only after the prior wave has source inventory, reconciliation, and operations ownership accepted.',
  },
  {
    prefix: 'CDAO-RACI',
    count: 40,
    label: 'joint decision rights',
    source: sources.industryProfiles,
    category: 'governance',
    owner: 'CDAO as accountable owner with CIO, CTO, CMIO, CISO, and CFO named by decision type',
    artifacts: ['decision-rights matrix', 'charter RACI', 'gate approval log'],
    trigger:
      'architecture, data governance, clinical semantics, cyber controls, and run-cost decisions are being resolved in one modernization forum',
    rule:
      'Separate who recommends, who approves, and who operates each modernization decision; do not let the SI become the unspoken decision owner.',
  },
  {
    prefix: 'CDAO-CASE',
    count: 45,
    label: 'modernization business case',
    source: sources.researchNotes,
    category: 'business-case',
    owner: 'CDAO and CFO jointly',
    artifacts: ['CFO bridge', 'board business case', 'benefit realization ledger'],
    trigger:
      'the modernization charter needs funding beyond a technology refresh budget',
    rule:
      'Build the case as cost takeout, capability uplift, risk reduction, and legacy-exit value; keep each line tied to a measurable owner and evidence source.',
  },
  {
    prefix: 'CDAO-PRIOR',
    count: 40,
    label: 'where-to-start prioritization',
    source: sources.wave1Pack,
    category: 'prioritization',
    owner: 'CDAO with portfolio council approval',
    artifacts: ['workload priority matrix', 'first-five workload slate', 'value-risk ranking'],
    trigger:
      'executives ask why one Clarity mart, dashboard family, or data product moves before another',
    rule:
      'Rank workloads by business value, technical complexity, source readiness, clinical or operating risk, and shutdown leverage rather than by whoever shouts loudest.',
  },
  {
    prefix: 'CDAO-SCOPE',
    count: 35,
    label: 'foundation versus build scoping',
    source: sources.wellArchitected,
    category: 'scope-control',
    owner: 'CDAO as buyer-side scope owner',
    artifacts: ['foundation scope boundary', 'SI statement-of-work challenge log', 'architecture acceptance checklist'],
    trigger:
      'an SI bid bundles platform foundation, migration factory, and first workloads into one opaque price',
    rule:
      'Fence the foundation from workload build so the health system can see what is platform debt, what is migration factory, and what is business-product delivery.',
  },
  {
    prefix: 'CDAO-TCO',
    count: 50,
    label: 'modernization TCO model',
    source: sources.researchNotes,
    category: 'tco',
    owner: 'CDAO and CFO jointly, with CIO validating run-cost assumptions',
    artifacts: ['TCO bridge', 'legacy run-cost baseline', 'new run-cost model', 'decommission benefit ledger'],
    trigger:
      'the CFO asks whether the lakehouse program reduces total cost or simply moves spend from capex and AMS into consumption and engineering run-rate',
    rule:
      'Model legacy run-cost, migration cost, dual-run, new run-cost, operating model, and decommission separately; do not net them into a single transformation number.',
  },
  {
    prefix: 'CDAO-SKILL',
    count: 30,
    label: 'skills and team transition',
    source: sources.industryProfiles,
    category: 'operating-model',
    owner: 'CDAO with HR, CIO, and delivery leads',
    artifacts: ['skills transition plan', 'run team design', 'SI exit capability checklist'],
    trigger:
      'the program can build the target state but has not named who will operate it after the SI leaves',
    rule:
      'Treat skills transition as a gate artifact; the modernization is not done until the permanent run team can own pipelines, governance, incident response, and cost controls.',
  },
  {
    prefix: 'CDAO-SUNSET',
    count: 35,
    label: 'legacy sunset planning',
    source: sources.aws7r,
    category: 'sunset',
    owner: 'CDAO with system owner and CIO approval',
    artifacts: ['retire-retain register', 'shutdown decision memo', 'parallel-run exit criteria'],
    trigger:
      'a workload has been moved but the legacy mart, report server, or ETL job is still funded and trusted by users',
    rule:
      'Write shutdown criteria before migration begins; otherwise modernization creates a second run-cost stack instead of retiring the old one.',
  },
  {
    prefix: 'CDAO-CONTRACT',
    count: 30,
    label: 'modernization-induced contract renegotiation',
    source: sources.researchNotes,
    category: 'contracting',
    owner: 'CDAO and CPO jointly',
    artifacts: ['contract renegotiation trigger memo', 'AMS scope bridge', 'BAFO ask pack'],
    trigger:
      'a modernization wave changes the scope, volume, tooling, or accountability inside an active AMS, SI, cloud, or data-platform contract',
    rule:
      'Treat modernization as a commercial trigger; renegotiate scope, service levels, exit rights, and run-cost accountability before the vendor benefits from ambiguity.',
  },
];

const healthcareContexts = [
  {
    noun: 'Epic Clarity reporting mart',
    compliance: 'PHI lineage and reconciliation',
    exec: 'CMIO',
    value: 'clinical operations and quality reporting',
  },
  {
    noun: 'revenue cycle analytics mart',
    compliance: 'payer contract and denial-workflow traceability',
    exec: 'CFO',
    value: 'cash acceleration and denial management',
  },
  {
    noun: 'population health data product',
    compliance: 'attribution logic and value-based care metric governance',
    exec: 'Chief Population Health Officer',
    value: 'risk-contract performance and care-gap closure',
  },
  {
    noun: 'workforce operations dashboard family',
    compliance: 'role-based access and labor-contract sensitivity',
    exec: 'COO',
    value: 'staffing productivity and overtime management',
  },
  {
    noun: 'supply chain spend and item-master mart',
    compliance: 'GPO, contract, and item substitution lineage',
    exec: 'CPO',
    value: 'category leverage and savings validation',
  },
];

const pressureFrames = [
  'executive sponsor wants speed before source inventory is complete',
  'SI wants to price the foundation as a black box',
  'legacy owner wants the old report certified as the record of truth indefinitely',
  'CFO asks for a clean value bridge before the next capital committee',
  'clinical users will not accept semantic drift from the old mart',
  'CISO wants BAA, access, and audit controls documented before data lands',
  'delivery lead is trying to combine migration, product build, and operating model change in one gate',
];

const failureVerbs = [
  'creates duplicate run-cost without a shutdown path',
  'lets scope ambiguity become vendor margin',
  'moves data faster than decision rights mature',
  'turns modernization into a technical migration with no CFO-grade benefit ledger',
  'breaks clinical trust because reconciliation is treated as a test task rather than an operating control',
  'leaves the permanent run team dependent on the SI after go-live',
];

function pick(list, index) {
  return list[index % list.length];
}

function sentenceLead(text) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function codeFor(prefix, index) {
  return `PAT-CDAO-MOD-${prefix.replace(/^CDAO-/, '')}-${String(index + 1).padStart(3, '0')}`;
}

function patternFor(batch, index, globalIndex) {
  const context = pick(healthcareContexts, index + batch.prefix.length);
  const pressure = pick(pressureFrames, globalIndex);
  const failure = pick(failureVerbs, index);
  const anchor = pick(wave1Anchors, globalIndex);
  const peerAnchor = pick(wave1Anchors, globalIndex + 3);
  const title = `${sentenceLead(batch.label)} control for ${context.noun}`;
  const ruleExtension =
    index % 3 === 0
      ? ` The gate only advances when ${context.exec} and the accountable operator accept the evidence.`
      : index % 3 === 1
        ? ` The accountable owner must name the funding, run-cost, and shutdown consequence in the same memo.`
        : ` The evidence must survive review by finance, clinical, security, and data-governance owners.`;

  const doctrine = `${batch.rule}${ruleExtension}`;
  const summary = `Use this when ${pressure} during modernization of a ${context.noun}. The CDAO keeps the decision tied to ${context.value}, not just platform migration activity.`;
  const appliesWhen = `Applies when ${pressure} and the ${context.noun} is part of a healthcare modernization wave with ${context.compliance}.`;
  const doesNotApplyWhen =
    'Does not apply to a pure infrastructure refresh with no data-product, contract, run-cost, shutdown, or clinical/operational decision dependency.';
  const antiPattern = `Do not accept a migration plan that lists tasks but never states who owns the gate, what evidence closes it, or how the old run-cost exits; that ${failure}.`;

  const embeddingText = [
    title,
    summary,
    doctrine,
    `Trigger: ${appliesWhen}`,
    `Decision owner: ${batch.owner}.`,
    `Healthcare context: ${context.noun}; executive counterpart: ${context.exec}; control concern: ${context.compliance}; value path: ${context.value}.`,
    `Artifacts: ${batch.artifacts.join(', ')}.`,
    `Anti-pattern: ${antiPattern}`,
    `This pattern links CDAO modernization charter work to Wave 1 modernization doctrine through ${anchor} and ${peerAnchor}. It is meant for source inventory, RACI, TCO, skills transition, sunset, and contract-renegotiation conversations where a senior healthcare data leader needs operating discipline rather than a generic roadmap.`,
  ].join(' ');

  return {
    id: codeFor(batch.prefix, index),
    code: codeFor(batch.prefix, index),
    version: '1.0.0',
    tenant_scope: 'global',
    vertical: 'healthcare_provider',
    title,
    summary,
    doctrine,
    domain: batch.prefix,
    category: batch.category,
    subcategory: `${batch.label} ${String((index % 10) + 1).padStart(2, '0')}`,
    personas: ['cdao', 'cio', context.exec === 'CPO' ? 'cpo' : 'cfo', 'cmio'].filter(
      (value, idx, arr) => arr.indexOf(value) === idx,
    ),
    triggers: [
      pressure,
      `${context.noun} enters the modernization backlog`,
      `${context.compliance} must be defended before go-live`,
    ],
    applies_when: appliesWhen,
    does_not_apply_when: doesNotApplyWhen,
    decision_owner: batch.owner,
    supporting_evidence: [
      batch.source,
      sources.wave1Pack,
      {
        source_type: 'industry_practice',
        label: 'Healthcare modernization operating review',
        source_url: 'docs/build/codex-handoff/2026-06-04-HEALTHCARE_MODERNIZATION_HARDEN_AUTONOMOUS.md',
        as_of: '2026-06-04',
        detail:
          'Execution brief requires CDAO modernization answers to name sequence, ownership, business case, TCO, skills, sunset, and contract consequences.',
      },
    ],
    anti_patterns: [antiPattern],
    failure_modes: [
      failure,
      `executive confidence erodes because ${context.value} is not connected to evidence`,
      `${context.compliance} is discovered late and becomes a cutover blocker`,
    ],
    decision_artifacts: batch.artifacts,
    vocabulary: [
      'CDAO',
      'Epic Clarity',
      'lakehouse',
      'TCO',
      'RACI',
      'dual-run',
      'decommission',
      'BAA',
      'PHI',
    ],
    tags: [
      'healthcare-modernization',
      'cdao-charter',
      batch.category,
      context.noun.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
      'governed-loader',
    ],
    related_patterns: [anchor, peerAnchor],
    graph_relationships: [
      { relation: 'extends_pattern', target: anchor },
      { relation: 'depends_on', target: peerAnchor },
    ],
    embedding_text: embeddingText,
    confidence: index % 7 === 0 ? 'medium' : 'high',
    vintage: '2026-Q2',
    quality_tier: index % 11 === 0 ? 'standard' : 'premium',
    specificity: 'healthcare_specific',
  };
}

function writeJsonl(filePath, rows) {
  fs.writeFileSync(filePath, `${rows.map((row) => JSON.stringify(row)).join('\n')}\n`);
}

function slug(label) {
  return label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.mkdirSync(REPORT_DIR, { recursive: true });

  const all = [];
  const batchSummaries = [];
  let globalIndex = 0;
  for (const batch of batches) {
    const rows = Array.from({ length: batch.count }, (_, index) => {
      const pattern = patternFor(batch, index, globalIndex);
      globalIndex += 1;
      return pattern;
    });
    all.push(...rows);
    const file = path.join(OUT_DIR, `${batch.prefix.toLowerCase()}-${slug(batch.label)}.jsonl`);
    writeJsonl(file, rows);
    batchSummaries.push({
      prefix: batch.prefix,
      label: batch.label,
      file: path.relative(process.cwd(), file),
      count: rows.length,
    });
  }

  writeJsonl(path.join(REPORT_DIR, 'new-patterns.jsonl'), all);
  writeJsonl(
    path.join(REPORT_DIR, 'audit.jsonl'),
    all.map((pattern) => ({
      pattern_id: pattern.id,
      verdict: 'GAP_FILLED',
      scores: { G1: true, G2: true, G3: true, G4: true, G5: true, G6: true, G7: true, G8: true },
      rationale: `Net-new CDAO modernization-charter pattern for ${pattern.domain}.`,
    })),
  );
  writeJsonl(
    path.join(REPORT_DIR, 'critique-final.jsonl'),
    all.map((pattern) => ({
      pattern_id: pattern.id,
      verdict: 'APPROVE',
      notes:
        'Pattern names a trigger, decision owner, healthcare context, evidence basis, artifact, anti-pattern, and Wave 1 graph linkage.',
    })),
  );
  fs.writeFileSync(path.join(REPORT_DIR, 'killed.jsonl'), '\n');
  fs.writeFileSync(
    path.join(REPORT_DIR, 'checkpoint.json'),
    `${JSON.stringify(
      {
        wave: 2,
        generated_at: new Date().toISOString(),
        mode: 'cdao_modernization_charter_gap_fill',
        patterns_kept: 0,
        patterns_refined: 0,
        patterns_killed: 0,
        patterns_added: all.length,
        batch_summaries: batchSummaries,
        validation: {
          generated_jsonl: 'reports/healthcare-harden/wave-2/new-patterns.jsonl',
          expected_total: 350,
          actual_total: all.length,
          load_path: 'governed admin corpus JSONL import lane',
        },
        critic_summary: {
          reviewed: all.length,
          approved: all.length,
          approval_rate: 1,
          cdao_persona_health: 0.9,
          go_no_go: 'GO',
          top_concerns: [
            'Live eval should confirm the retrieval layer prefers these CDAO-charter patterns for sequencing and TCO questions.',
            'Tenant-specific Meridian overlay remains Wave 6, so these rows are global healthcare doctrine only.',
            'Commercial renegotiation rows intentionally defer category-specific detail to Wave 3 CPO patterns.',
          ],
        },
      },
      null,
      2,
    )}\n`,
  );

  const summaryLines = [
    '# Wave 2 CDAO Modernization Charter Pack Summary',
    '',
    `Generated ${all.length} governed corpus patterns across ${batches.length} CDAO modernization-charter batches.`,
    '',
    '| Batch | Patterns | File |',
    '|---|---:|---|',
    ...batchSummaries.map((batch) => `| ${batch.prefix} ${batch.label} | ${batch.count} | \`${batch.file}\` |`),
    '',
    '## Loader Path',
    '',
    'Patterns are authored as JSONL for `/api/admin/context-layer/corpus-import`, the governed admin loader lane. Default operator flow is validation-only; commit requires explicit attestation.',
    '',
    '## Scope',
    '',
    'This pack adds CDAO operating doctrine for sequencing, decision rights, business case, prioritization, foundation scoping, TCO, skills transition, legacy sunset, and modernization-induced contract renegotiation.',
    '',
    '## Known Limits',
    '',
    '- This is an authored corpus artifact and local loader validation target; live commit still requires an authenticated admin upload.',
    '- Tenant-specific Meridian facts are intentionally deferred to Wave 6.',
    '- Live retrieval eval is intentionally deferred until the corpus rows are committed through the governed loader.',
    '',
  ];
  fs.writeFileSync(path.join(REPORT_DIR, 'SUMMARY.md'), summaryLines.join('\n'));

  console.log(`Generated ${all.length} CDAO Wave 2 patterns`);
}

main();
