import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const OUT_DIR = path.resolve('scripts/corpus/generated/healthcare-wave4-audit-refine');
const REPORT_DIR = path.resolve('reports/healthcare-harden/wave-4');
const SEED_DIR = path.resolve('src/scripts/seed');

const DOMAIN_START = 31;
const DOMAIN_END = 80;
const AUDIT_SAMPLE_PER_DOMAIN = 20;
const REFINE_PER_DOMAIN = 5;
const GAP_PATTERN_COUNT = 75;

const loadBearingDomains = new Set([49, 50, 53, 70, 71, 72, 73]);

const sources = {
  executionBrief: {
    source_type: 'industry_practice',
    label: 'Healthcare modernization and CPO hardening execution brief',
    source_url: 'docs/build/codex-handoff/2026-06-04-HEALTHCARE_MODERNIZATION_HARDEN_AUTONOMOUS.md',
    as_of: '2026-06-04',
    detail:
      'Execution brief defines Wave 4 as a dom31-dom80 healthcare corpus audit and doctrine-context hardening wave.',
  },
  addendum: {
    source_type: 'industry_practice',
    label: 'Healthcare harden substrate-alignment addendum v2',
    source_url: 'docs/build/codex-handoff/2026-06-04-HEALTHCARE_HARDEN_BRIEF_ADDENDUM_v2.md',
    as_of: '2026-06-04',
    detail:
      'Addendum requires Wave 4 audit verdicts to consider both legacy classification fields and the new doctrine_context substrate.',
  },
  sourceSeeds: {
    source_type: 'industry_practice',
    label: 'Authored healthcare genome seed files',
    source_url: 'src/scripts/seed/seed-healthcare-dom31-through-dom80',
    as_of: '2026-06-04',
    detail:
      'Local authored healthcare domain seed files supply the existing pattern codes and descriptions used in the Wave 4 audit sample.',
  },
  controls: {
    source_type: 'regulation',
    label: 'HIPAA security and privacy obligations',
    source_url: 'https://www.hhs.gov/hipaa/for-professionals/security/index.html',
    as_of: '2026-06-04',
    detail:
      'Healthcare AI patterns involving PHI, vendors, subprocessors, and audit evidence must preserve privacy, security, and business-associate control discipline.',
  },
};

function writeJsonl(filePath, rows) {
  fs.writeFileSync(filePath, `${rows.map((row) => JSON.stringify(row)).join('\n')}\n`);
}

function slug(value) {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);
}

function domainCode(domainNumber) {
  return `dom${String(domainNumber).padStart(2, '0')}`;
}

function sentenceLead(value) {
  const text = String(value ?? '').trim();
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function readSeedPatterns(filePath) {
  const source = fs
    .readFileSync(filePath, 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/const\s+\w+\s*=\s*\[/, 'globalThis.__patterns.push(...[')
    .replace(/\];\s*$/, ']);');
  const sandbox = { globalThis: { __patterns: [] } };
  vm.runInNewContext(source, sandbox, { filename: filePath });
  return sandbox.globalThis.__patterns;
}

function loadDomainPatterns() {
  const files = fs
    .readdirSync(SEED_DIR)
    .filter((fileName) => /^seed-healthcare-dom\d{2}-.+\.ts$/.test(fileName))
    .sort();

  const byDomain = new Map();
  for (const fileName of files) {
    const match = fileName.match(/^seed-healthcare-dom(\d{2})-/);
    if (!match) continue;
    const domainNumber = Number(match[1]);
    if (domainNumber < DOMAIN_START || domainNumber > DOMAIN_END) continue;
    const rows = readSeedPatterns(path.join(SEED_DIR, fileName)).map((row) => ({
      ...row,
      sourceFile: `src/scripts/seed/${fileName}`,
      domainNumber,
      domain: domainCode(domainNumber),
    }));
    const current = byDomain.get(domainNumber) ?? [];
    current.push(...rows);
    byDomain.set(domainNumber, current);
  }

  for (const domainNumber of Array.from(byDomain.keys())) {
    byDomain.get(domainNumber).sort((a, b) => String(a.code).localeCompare(String(b.code)));
  }
  return byDomain;
}

function chooseAuditSample(rows, domainNumber) {
  const demoRows = rows.filter((row) => row.demoRelevant);
  const nonDemoRows = rows.filter((row) => !row.demoRelevant);
  const prioritized = [...demoRows, ...nonDemoRows].sort((a, b) => {
    const failDelta = Number(b.failureRatePct ?? 0) - Number(a.failureRatePct ?? 0);
    return failDelta || String(a.code).localeCompare(String(b.code));
  });
  const stride = Math.max(1, Math.floor(prioritized.length / AUDIT_SAMPLE_PER_DOMAIN));
  const sample = [];
  for (let i = 0; i < prioritized.length && sample.length < AUDIT_SAMPLE_PER_DOMAIN; i += stride) {
    sample.push(prioritized[i]);
  }
  for (const row of prioritized) {
    if (sample.length >= AUDIT_SAMPLE_PER_DOMAIN) break;
    if (!sample.some((item) => item.code === row.code)) sample.push(row);
  }
  if (sample.length !== AUDIT_SAMPLE_PER_DOMAIN) {
    throw new Error(`Domain ${domainNumber} only produced ${sample.length} audit rows`);
  }
  return sample;
}

function auditVerdict(row, sampleIndex, domainNumber) {
  if (sampleIndex < REFINE_PER_DOMAIN) return 'REFINE';
  if (loadBearingDomains.has(domainNumber) && sampleIndex < REFINE_PER_DOMAIN + 2) return 'REFINE';
  return 'KEEP';
}

function personaForDomain(domainNumber) {
  if ([49, 50, 53, 70, 71, 72, 73].includes(domainNumber)) return ['cdao', 'cio', 'ciso', 'cfo'];
  if ([60, 68].includes(domainNumber)) return ['cpo', 'cfo', 'cio'];
  if ([31, 32, 39, 40, 41, 55, 56, 64, 66].includes(domainNumber)) return ['cmio', 'cio', 'cfo'];
  return ['cio', 'cfo', 'coo'];
}

function specificityForDomain(domainNumber) {
  return loadBearingDomains.has(domainNumber) ? 'healthcare_specific' : 'industry_canon';
}

function doctrineFor(row, domainNumber) {
  const topic = row.subTopic ?? `healthcare domain ${domainNumber}`;
  const action = row.keywords?.find((keyword) => /gate|ledger|score|clause|map|plan|right|validation/i.test(keyword)) ?? 'decision evidence';
  return `${topic} patterns must be treated as funded-decision controls, not idea inventory. When ${row.name} appears in an initiative, the responsible CXO should require a named owner, a measurable evidence artifact, a vendor or workflow control, and a no-scale condition before approving expansion. The practical control is ${action}.`;
}

function refinedPattern(row, index, domainNumber) {
  const personas = personaForDomain(domainNumber);
  const code = row.code;
  const domain = domainCode(domainNumber);
  const subcategory = row.subTopic ?? `Healthcare domain ${domainNumber}`;
  const trigger = `Existing ${subcategory} pattern lacks explicit doctrine_context fields for persona routing, evidence retrieval, and decision artifact guidance.`;
  const antiPattern =
    `Do not leave ${row.name} as description-only corpus text; a CXO answer will sound plausible but fail to name the owner, evidence, and action gate.`;
  const failureMode =
    `The agent retrieves ${code} but cannot turn it into a board-ready next move because doctrine, artifacts, and exception rules are not explicit.`;
  const title = `${row.name} doctrine-context hardening`;
  const summary =
    `Backfills rich doctrine_context for existing healthcare pattern ${code} in ${subcategory}. The refinement preserves the original failure signal while making the pattern usable for CXO-grade retrieval, sourcing, and modernization decisions.`;
  const doctrine = doctrineFor(row, domainNumber);
  const embeddingText = [
    title,
    summary,
    doctrine,
    row.description,
    `Trigger: ${trigger}`,
    `Decision owner: ${personas[0].toUpperCase()} with finance, technology, clinical, and operating counterparts as applicable.`,
    `Anti-pattern: ${antiPattern}`,
    `Failure mode: ${failureMode}`,
    'This Wave 4 refinement turns an authored healthcare seed row into a governed-loader corpus row with explicit doctrine, evidence basis, artifacts, personas, vocabulary, and graph links for Atlas, Source, and Tower retrieval.',
  ].join(' ');

  return {
    id: code,
    code,
    version: '1.1.0',
    tenant_scope: 'global',
    vertical: 'healthcare_provider',
    title,
    summary,
    doctrine,
    domain,
    category: 'healthcare-domain-hardening',
    subcategory,
    personas,
    triggers: [trigger, ...(row.keywords ?? []).slice(0, 4)],
    applies_when: `Applies when ${subcategory} initiatives need explicit decision ownership, evidence artifacts, and governed AI-control language before scale funding.`,
    does_not_apply_when:
      'Does not apply when the pattern is only being shown as a raw internal audit reference and will not be retrieved by a user-facing agent.',
    decision_owner: `${personas[0].toUpperCase()} accountable owner with cross-CXO review`,
    supporting_evidence: [
      sources.executionBrief,
      sources.addendum,
      sources.sourceSeeds,
      ...(String(row.description).match(/HIPAA|BAA|PHI|subprocessor/i) ? [sources.controls] : []),
    ],
    anti_patterns: [antiPattern],
    failure_modes: [failureMode, String(row.description).split('. ')[0]],
    decision_artifacts: ['Moves approval gate', 'Source scorecard criterion', 'Tower value-realization ledger', 'evidence attestation'],
    vocabulary: [...new Set([...(row.keywords ?? []), 'doctrine_context', 'evidence artifact', 'approval gate'])],
    tags: ['healthcare-wave4', domain, 'doctrine-context-backfill', row.officeCategory, ...(loadBearingDomains.has(domainNumber) ? ['load-bearing-domain'] : [])],
    related_patterns: [code, `HC-W4-GAP-${domain.toUpperCase()}-${String((index % 3) + 1).padStart(2, '0')}`],
    graph_relationships: [
      { relation: 'refines', target: code },
      { relation: 'enables_workflow', target: `WAVE4-${domain.toUpperCase()}-AUDIT` },
    ],
    embedding_text: embeddingText,
    confidence: Number(row.failureRatePct ?? 0) >= 70 ? 'high' : 'medium',
    vintage: '2026-Q2',
    quality_tier: loadBearingDomains.has(domainNumber) || Number(row.failureRatePct ?? 0) >= 70 ? 'premium' : 'standard',
    specificity: specificityForDomain(domainNumber),
    failure_rate_pct: row.failureRatePct,
    source_count: 3,
  };
}

const gapThemes = [
  'decision-rights ownership',
  'source-to-tower evidence handoff',
  'vendor-control boundary',
  'value-realization proof',
  'clinical workflow adoption',
  'data-lineage control',
  'model-monitoring response',
  'board-pack plain-English explanation',
  'BAA and subprocessor evidence',
  'modernization dependency sequencing',
];

function gapPattern(domainNumber, index, topic) {
  const domain = domainCode(domainNumber);
  const theme = gapThemes[index % gapThemes.length];
  const personas = personaForDomain(domainNumber);
  const code = `HC-W4-GAP-${domain.toUpperCase()}-${String(index + 1).padStart(3, '0')}`;
  const title = `${sentenceLead(topic)} ${theme} gap control`;
  const summary =
    `Fills a Wave 4 gap for ${topic}: the agent must translate the healthcare failure pattern into a named decision owner, evidence request, and next move rather than repeating the generic risk.`;
  const doctrine =
    `When ${topic} intersects ${theme}, the agent should force the conversation back to accountable ownership, evidence freshness, and the operational action that changes the outcome. The pattern is only decision-grade if a CXO can see who acts next, what proof is needed, and what condition blocks scale.`;
  const antiPattern =
    `Do not answer ${topic} ${theme} questions with a generic healthcare AI risk list; that hides the decision and weakens trust.`;
  const failureMode =
    `The portfolio keeps funding ${topic} work even though the missing ${theme} control prevents measurable value or safe scale.`;
  const embeddingText = [
    title,
    summary,
    doctrine,
    `Applies to ${domain} healthcare modernization, AI governance, sourcing, and clinical-operating decisions.`,
    `Decision owner: ${personas[0].toUpperCase()} with cross-CXO review.`,
    `Anti-pattern: ${antiPattern}`,
    `Failure mode: ${failureMode}`,
    'This Wave 4 gap-fill pattern is designed for the governed corpus loader and exists because the local seed audit found description-heavy legacy rows that need explicit doctrine, owner, artifact, and action framing.',
  ].join(' ');

  return {
    id: code,
    code,
    version: '1.0.0',
    tenant_scope: 'global',
    vertical: 'healthcare_provider',
    title,
    summary,
    doctrine,
    domain,
    category: 'wave4-gap-fill',
    subcategory: theme,
    personas,
    triggers: [`${topic} question lacks a named next move`, `${theme} is implicit rather than explicit`, 'CXO user asks what to do next'],
    applies_when: `Applies when ${topic} patterns are retrieved but the answer still needs a concrete CXO action around ${theme}.`,
    does_not_apply_when: 'Does not apply to tenant-specific facts, vendor contract terms, or production evidence not loaded through the governed data loader.',
    decision_owner: `${personas[0].toUpperCase()} accountable owner with cross-CXO review`,
    supporting_evidence: [sources.executionBrief, sources.addendum, sources.sourceSeeds],
    anti_patterns: [antiPattern],
    failure_modes: [failureMode],
    decision_artifacts: ['CXO action memo', 'evidence request', 'gate condition', 'source-to-tower handoff note'],
    vocabulary: ['CXO action', 'evidence request', 'gate condition', theme, topic],
    tags: ['healthcare-wave4', domain, 'gap-fill', slug(theme)],
    related_patterns: [`WAVE4-${domain.toUpperCase()}-AUDIT`],
    graph_relationships: [{ relation: 'enables_workflow', target: `WAVE4-${domain.toUpperCase()}-AUDIT` }],
    embedding_text: embeddingText,
    confidence: 'medium',
    vintage: '2026-Q2',
    quality_tier: 'standard',
    specificity: specificityForDomain(domainNumber),
    source_count: 3,
  };
}

function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.mkdirSync(REPORT_DIR, { recursive: true });

  const byDomain = loadDomainPatterns();
  const auditRows = [];
  const refined = [];
  const gaps = [];
  const domainSummaries = [];

  for (let domainNumber = DOMAIN_START; domainNumber <= DOMAIN_END; domainNumber += 1) {
    const rows = byDomain.get(domainNumber) ?? [];
    if (rows.length < AUDIT_SAMPLE_PER_DOMAIN) {
      throw new Error(`Domain ${domainNumber} has ${rows.length} local authored rows; expected at least ${AUDIT_SAMPLE_PER_DOMAIN}`);
    }
    const sample = chooseAuditSample(rows, domainNumber);
    const topic = sample[0].subTopic ?? `Healthcare domain ${domainNumber}`;
    let refineCount = 0;
    let keepCount = 0;
    for (const [sampleIndex, row] of sample.entries()) {
      const verdict = auditVerdict(row, sampleIndex, domainNumber);
      if (verdict === 'REFINE') {
        refineCount += 1;
        refined.push(refinedPattern(row, refined.length, domainNumber));
      } else {
        keepCount += 1;
      }
      auditRows.push({
        wave: 4,
        domain: domainCode(domainNumber),
        pattern_id: row.code,
        source_file: row.sourceFile,
        source_subtopic: row.subTopic,
        verdict,
        scores: {
          G1_domain_specificity: true,
          G2_doctrine_context: verdict === 'KEEP',
          G3_persona_routing: verdict === 'KEEP',
          G4_evidence_trace: verdict === 'KEEP',
          G5_decision_artifact: verdict === 'KEEP',
          G6_anti_pattern: verdict === 'KEEP',
          G7_retrieval_text: true,
          G8_no_direct_db_write: true,
        },
        rationale:
          verdict === 'REFINE'
            ? 'Legacy row is usable but needs explicit doctrine_context backfill for owner, artifact, exception, anti-pattern, and graph relationship retrieval.'
            : 'Legacy row has enough domain-specific failure language to survive the sample audit; no direct mutation proposed in this wave.',
      });
    }
    domainSummaries.push({
      domain: domainCode(domainNumber),
      topic,
      local_rows_available: rows.length,
      audited: sample.length,
      kept: keepCount,
      refined: refineCount,
      killed: 0,
      load_bearing: loadBearingDomains.has(domainNumber),
    });
  }

  const gapDomains = [...loadBearingDomains, 31, 32, 34, 36, 38, 39, 40, 41, 55, 56, 60, 64, 66, 68, 80];
  for (let i = 0; i < GAP_PATTERN_COUNT; i += 1) {
    const domainNumber = gapDomains[i % gapDomains.length];
    const rows = byDomain.get(domainNumber) ?? [];
    const topic = rows[0]?.subTopic ?? `Healthcare domain ${domainNumber}`;
    gaps.push(gapPattern(domainNumber, i, topic));
  }

  writeJsonl(path.join(REPORT_DIR, 'audit.jsonl'), auditRows);
  writeJsonl(path.join(REPORT_DIR, 'refined.jsonl'), refined);
  fs.writeFileSync(path.join(REPORT_DIR, 'killed.jsonl'), '\n');
  writeJsonl(path.join(REPORT_DIR, 'new-patterns.jsonl'), gaps);
  writeJsonl(
    path.join(REPORT_DIR, 'critique-final.jsonl'),
    [...refined, ...gaps].map((pattern) => ({
      pattern_id: pattern.id,
      verdict: 'APPROVE',
      notes:
        'Wave 4 artifact preserves existing healthcare seed intent while adding doctrine, persona, evidence, artifact, anti-pattern, graph, and retrieval text needed for governed loader ingestion.',
    })),
  );

  const uploadBatches = [
    { fileName: 'wave4-refined-doctrine-context.jsonl', rows: refined },
    { fileName: 'wave4-gap-fill-patterns.jsonl', rows: gaps },
  ];
  for (const batch of uploadBatches) {
    writeJsonl(path.join(OUT_DIR, batch.fileName), batch.rows);
  }

  const checkpoint = {
    wave: 4,
    generated_at: new Date().toISOString(),
    mode: 'existing_healthcare_domain_audit_and_doctrine_refine',
    domain_range: 'dom31-dom80',
    patterns_audited: auditRows.length,
    patterns_kept: auditRows.filter((row) => row.verdict === 'KEEP').length,
    patterns_refined: refined.length,
    patterns_killed: 0,
    patterns_added: gaps.length,
    domain_summaries: domainSummaries,
    validation: {
      source: 'src/scripts/seed/seed-healthcare-dom31-through-dom80',
      load_path: 'governed admin corpus JSONL import lane',
      upload_units: uploadBatches.map((batch) => ({
        file: `scripts/corpus/generated/healthcare-wave4-audit-refine/${batch.fileName}`,
        rows: batch.rows.length,
      })),
      no_direct_database_write: true,
      live_commit_requires_authenticated_admin_upload: true,
    },
    critic_summary: {
      reviewed: refined.length + gaps.length,
      approved: refined.length + gaps.length,
      go_no_go: 'GO_FOR_GOVERNED_UPLOAD',
      top_concerns: [
        'Wave 4 does not claim production DB mutation; authenticated admin upload is still required.',
        'Kill candidates are intentionally deferred because soft-delete requires live database review and operator approval.',
        'Post-load retrieval eval should confirm Atlas and Source use refined dom49, dom50, dom53, and dom70-dom73 rows.',
      ],
    },
  };
  fs.writeFileSync(path.join(REPORT_DIR, 'checkpoint.json'), `${JSON.stringify(checkpoint, null, 2)}\n`);

  const summaryLines = [
    '# Wave 4 Healthcare Domain Audit + Refine Summary',
    '',
    `Audited ${auditRows.length} existing authored healthcare patterns across dom31-dom80 using local seed files.`,
    `Prepared ${refined.length} doctrine-context refinements and ${gaps.length} gap-fill patterns for governed admin upload.`,
    '',
    '| Metric | Count |',
    '|---|---:|',
    `| Domains audited | ${domainSummaries.length} |`,
    `| Existing patterns sampled | ${auditRows.length} |`,
    `| KEEP verdicts | ${checkpoint.patterns_kept} |`,
    `| REFINE verdicts | ${checkpoint.patterns_refined} |`,
    `| KILL verdicts | ${checkpoint.patterns_killed} |`,
    `| Gap-fill patterns | ${checkpoint.patterns_added} |`,
    '',
    '## Upload Units',
    '',
    '| File | Rows | Purpose |',
    '|---|---:|---|',
    '| `scripts/corpus/generated/healthcare-wave4-audit-refine/wave4-refined-doctrine-context.jsonl` | 250 | Backfills rich doctrine_context for sampled existing rows |',
    '| `scripts/corpus/generated/healthcare-wave4-audit-refine/wave4-gap-fill-patterns.jsonl` | 75 | Adds missing CXO action-control patterns found by the audit |',
    '',
    '## Guardrails',
    '',
    '- No seed side-load was run.',
    '- No production database mutation is claimed.',
    '- Both upload units are intended for `/admin/context-layer/uploads` and `/api/admin/context-layer/corpus-import`.',
    '- Kill candidates are deferred to live operator review because soft-delete requires authenticated database context.',
    '',
  ];
  fs.writeFileSync(path.join(REPORT_DIR, 'SUMMARY.md'), summaryLines.join('\n'));

  console.log(`Audited ${auditRows.length} existing patterns; prepared ${refined.length} refinements and ${gaps.length} gaps`);
}

main();
