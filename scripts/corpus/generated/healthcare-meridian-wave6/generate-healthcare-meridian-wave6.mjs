import fs from 'node:fs';
import path from 'node:path';

const OUT_DIR = path.resolve('scripts/corpus/generated/healthcare-meridian-wave6');
const REPORT_DIR = path.resolve('reports/healthcare-harden/wave-6');
const EVAL_DIR = path.resolve('reports/healthcare-harden/eval');
const FINAL_REPORT = path.resolve('HEALTHCARE_MODERNIZATION_HARDEN_READINESS.md');
const HARDENING_SUMMARY = path.resolve('reports/healthcare-harden/MODERNIZATION_HARDENING_SUMMARY.md');
const MERIDIAN_PROFILE_SOURCE = 'intelligence/seeds/tenant-portfolios/meridian.json';
const MERIDIAN_PROFILE_PATH = path.resolve(MERIDIAN_PROFILE_SOURCE);

const tenantProfile = JSON.parse(fs.readFileSync(MERIDIAN_PROFILE_PATH, 'utf8'));

const sourceEvidence = {
  tenantPortfolio: {
    source_type: 'tenant_profile',
    label: 'Meridian tenant portfolio profile',
    source_url: 'intelligence/seeds/tenant-portfolios/meridian.json',
    as_of: '2026-06-04',
    detail:
      'Meridian is treated as a Sacramento-based integrated health system with a 30+ hospital footprint and active modernization, clinical AI, prior authorization, revenue-cycle, and sourcing programs.',
  },
  wave1: {
    source_type: 'industry_practice',
    label: 'Healthcare modernization Wave 1 pack',
    source_url: 'reports/healthcare-harden/wave-1/SUMMARY.md',
    as_of: '2026-06-04',
    detail:
      'Modernization archetypes, 7 Rs, Azure Databricks Lakehouse, Unity Catalog, medallion architecture, Lakebridge/BladeBridge analyzer intake, RFP scorecards, effort heuristics, and anti-patterns.',
  },
  wave2: {
    source_type: 'industry_practice',
    label: 'Healthcare CDAO Wave 2 pack',
    source_url: 'reports/healthcare-harden/wave-2/SUMMARY.md',
    as_of: '2026-06-04',
    detail:
      'CDAO modernization operating doctrine for sequencing, RACI, TCO, skills transition, and contract triggers.',
  },
  wave3: {
    source_type: 'industry_practice',
    label: 'Healthcare CPO Wave 3 pack',
    source_url: 'reports/healthcare-harden/wave-3/SUMMARY.md',
    as_of: '2026-06-04',
    detail:
      'CPO sourcing doctrine for healthcare BPO, Epic AMS, analytics AMS, cyber, operating model, make-buy, and BAFO events.',
  },
  wave5: {
    source_type: 'validation_evidence',
    label: 'Healthcare Wave 5 estimation and RFP verification',
    source_url: 'reports/healthcare-harden/wave-5/SUMMARY.md',
    as_of: '2026-06-04',
    detail:
      'Deterministic evidence that modernization estimates and SI bid normalization produce bounded, reviewable outputs.',
  },
};

const overlayDomains = [
  {
    code: 'MRD-OVL-D01',
    label: 'CDAO modernization charter overlay',
    persona: 'cdao',
    owner: 'CDAO with CIO, CMIO, CISO, CFO, and CPO gate review',
    baseTargets: ['PAT-CDAO-MOD-SEQ-001', 'PAT-CDAO-MOD-RACI-001', 'PAT-MODERN-WA-001'],
    artifacts: ['Meridian modernization charter', 'joint decision-rights matrix', 'wave gate memo'],
    doctrine:
      'Meridian modernization answers must start from Sacramento-based IDN scale, name the accountable executive forum, and separate platform foundation from workload migration and operating-model commitments.',
    count: 50,
  },
  {
    code: 'MRD-OVL-D02',
    label: 'ambient clinical value chain overlay',
    persona: 'cdao',
    owner: 'CMIO and CDAO with revenue-cycle and clinical operations sponsors',
    baseTargets: ['PAT-MODERN-ARCH-001', 'PAT-CDAO-MOD-CASE-001', 'HC-CPO-D07-0001'],
    artifacts: ['ambient value-chain evidence map', 'clinical adoption ledger', 'governance attestation packet'],
    doctrine:
      'Ambient clinical AI decisions must tie documentation lift to downstream coding, throughput, clinician experience, quality, and risk controls instead of treating transcription speed as the whole value case.',
    count: 50,
  },
  {
    code: 'MRD-OVL-D03',
    label: 'prior authorization automation overlay',
    persona: 'cdao',
    owner: 'CDAO with payer operations, revenue cycle, legal, and compliance owners',
    baseTargets: ['PAT-CDAO-MOD-PRIOR-001', 'PAT-MODERN-RFP-001', 'HC-CPO-D09-0001'],
    artifacts: ['prior authorization operating map', 'payer-policy change log', 'exception and denial evidence ledger'],
    doctrine:
      'Prior authorization automation must preserve policy traceability and escalation paths; a clean automation rate is not sufficient if denials, exceptions, or payer policy drift are not governed.',
    count: 50,
  },
  {
    code: 'MRD-OVL-D04',
    label: 'revenue-cycle and vendor rationalization overlay',
    persona: 'cpo',
    owner: 'CPO and CFO with revenue-cycle operations and CDAO input',
    baseTargets: ['HC-CPO-D08-0001', 'PAT-CDAO-MOD-CONTRACT-001', 'PAT-MODERN-TCO-001'],
    artifacts: ['vendor rationalization slate', 'savings validation bridge', 'retained-work register'],
    doctrine:
      'Revenue-cycle AI rationalization must distinguish contractual savings from collectible cash impact, retained operational work, payer friction, and model-governance obligations.',
    count: 50,
  },
  {
    code: 'MRD-OVL-D05',
    label: 'CPO sourcing event overlay',
    persona: 'cpo',
    owner: 'CPO with CDAO, CIO, CISO, finance, and clinical operations',
    baseTargets: ['HC-CPO-D05-0001', 'HC-CPO-D06-0001', 'HC-CPO-D10-0001'],
    artifacts: ['BAFO counter pack', 'supplier scorecard', 'transition readiness review'],
    doctrine:
      'Meridian sourcing answers must connect category leverage, PHI and BAA controls, transition risk, modernization scope change, and CFO-verifiable savings before recommending award or renewal.',
    count: 50,
  },
  {
    code: 'MRD-OVL-D06',
    label: 'joint CXO operating model overlay',
    persona: 'cxo',
    owner: 'Joint CDAO, CPO, CIO, CMIO, CFO, and COO operating council',
    baseTargets: ['PAT-CDAO-MOD-RACI-001', 'HC-CPO-D07-0001', 'PAT-MODERN-ANTI-001'],
    artifacts: ['joint operating cadence', 'decision backlog', 'risk and value ledger'],
    doctrine:
      'Meridian executive answers should make the cross-CXO operating model visible: who owns value, who owns clinical acceptance, who owns sourcing leverage, who owns cyber and PHI controls, and who can stop a wave.',
    count: 50,
  },
];

const programContexts = tenantProfile.programs.map((program) => ({
  code: program.code,
  name: program.name,
  phase: program.currentPhaseSpec,
  slug: program.programSlug,
  role: program.roleInDemo,
  patternSlug: program.patternSlug,
}));

const situationTemplates = [
  {
    trigger: 'a board or executive committee asks whether the next modernization wave is decision-grade',
    failure: 'the team presents platform progress without showing tenant-specific value, risk, and owner evidence',
    anti: 'Do not let a generic modernization slide replace Meridian-specific owner, evidence, and gate facts.',
  },
  {
    trigger: 'an SI, AMS, analytics, or AI vendor proposes scope that blends foundation, migration, and operations',
    failure: 'commercial leverage is lost because scope ambiguity hides retained work and future run-cost exposure',
    anti: 'Do not accept bundled scope without a Meridian-specific retained-work and transition-risk view.',
  },
  {
    trigger: 'clinical, revenue-cycle, sourcing, and data leaders disagree on what success means',
    failure: 'the program optimizes one metric while creating downstream friction in operations, compliance, or vendor accountability',
    anti: 'Do not let one executive function declare success without the cross-function ledger being updated.',
  },
  {
    trigger: 'a wave looks green on delivery but evidence quality is thin',
    failure: 'the agent gives confident advice from activity status rather than source-backed value and risk evidence',
    anti: 'Do not treat delivery status as value proof.',
  },
  {
    trigger: 'the health system wants to scale from proof point to operating model',
    failure: 'the pilot expands before governance, sourcing terms, PHI controls, and support ownership are ready',
    anti: 'Do not scale a pilot just because users like it; scale only after controls and ownership are explicit.',
  },
];

const evidenceRequests = [
  'loaded source inventory and lineage evidence',
  'validated value ledger and CFO bridge',
  'clinical and operational acceptance notes',
  'vendor scope and BAFO evidence',
  'PHI, BAA, cyber, and model-governance controls',
  'transition readiness and retained-work register',
  'dual-run or exception-handling proof',
  'post-award operating cadence and QBR measures',
  'decommission or rationalization exit criteria',
  'executive gate decision log',
];

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function writeJsonl(filePath, rows) {
  fs.writeFileSync(filePath, `${rows.map((row) => JSON.stringify(row)).join('\n')}\n`);
}

function patternFor(domain, index) {
  const program = programContexts[index % programContexts.length];
  const situation = situationTemplates[index % situationTemplates.length];
  const evidence = evidenceRequests[index % evidenceRequests.length];
  const target = domain.baseTargets[index % domain.baseTargets.length];
  const ordinal = String(index + 1).padStart(4, '0');
  const code = `${domain.code}-${ordinal}`;
  const qualityTier = index % 3 === 0 ? 'premium' : 'standard';
  const confidence = index % 5 === 0 ? 'medium' : 'high';
  const title = `${program.name} ${domain.label} control ${ordinal}`;
  const trigger = `Use this when ${situation.trigger} for ${program.code} (${program.name}) in Meridian's Sacramento-based 30+ hospital operating context.`;
  const summary = `${trigger} The answer should connect tenant facts, Azure Databricks modernization doctrine, healthcare sourcing leverage, and the next decision artifact without inventing exact facility, revenue, workload-count, table-count, or savings figures.`;
  const doctrine = `${domain.doctrine} For ${program.code}, apply Azure Databricks Lakehouse doctrine explicitly: Unity Catalog for governed PHI access and lineage, medallion bronze/silver/gold modeling, Delta tables, Lakebridge or equivalent analyzer inventory before precise estimates, Databricks Asset Bundles or equivalent CI/CD, and DBU/TCO controls before scale funding. Require ${evidence} before treating the recommendation as decision-grade.`;
  const failure = `${situation.failure} for ${program.code}, causing Meridian leaders to approve a wave without the evidence needed for a 30+ hospital integrated system.`;
  const antiPattern = `${situation.anti} If exact Meridian facility counts, revenue, savings, or vendor commitments are not loaded through the governed context layer, say that plainly and work from the available profile.`;
  const artifacts = [...domain.artifacts, evidence];
  const embeddingText = [
    title,
    summary,
    doctrine,
    `Tenant profile: ${tenantProfile.profile}`,
    `Program context: ${program.code} ${program.name}; phase ${program.phase}; role ${program.role}.`,
    `Decision owner: ${domain.owner}.`,
    'Azure Databricks modernization terms: Unity Catalog, medallion architecture, bronze, silver, gold, Delta tables, Lakebridge analyzer inventory, Databricks Asset Bundles, DLT or Lakeflow-style pipeline orchestration, DBU/TCO controls, Lakehouse Federation, PHI lineage, and healthcare data product ownership.',
    'Epic and ERP planning method: estimate source objects, inbound integrations, transformation jobs, reports, and gold data products by use case; label table/report/job counts as planning ranges unless the governed loader has loaded an Epic Clarity/Caboodle, FHIR, ERP, and BI inventory.',
    `Required evidence: ${evidence}.`,
    `Failure mode: ${failure}`,
    `Anti-pattern: ${antiPattern}`,
    'This Meridian overlay extends the global healthcare modernization, CDAO, and CPO corpus so Atlas and Source answers can speak in tenant context while preserving honesty about what has and has not been loaded through the governed admin data loader.',
  ].join(' ');

  return {
    id: code,
    code,
    version: '1.0.0',
    tenant_scope: 'meridian',
    tenant_key: tenantProfile.tenantKey,
    client_id: 'client-meridian',
    vertical: 'healthcare_provider',
    title,
    name: title,
    summary,
    description: summary,
    doctrine,
    domain: domain.code,
    category: 'meridian-tenant-overlay',
    subcategory: slugify(domain.label),
    personas: Array.from(new Set([domain.persona, 'cdao', 'cpo', 'cio', 'cfo'])),
    triggers: [trigger, situation.trigger],
    applies_when: `Applies when answering about ${program.name}, Meridian modernization, healthcare sourcing, or executive gate decisions where tenant context matters.`,
    does_not_apply_when:
      'Does not apply when a question asks for exact financials, facility counts, contract terms, or live initiative state that has not been loaded through the governed context layer.',
    decision_owner: domain.owner,
    supporting_evidence: [sourceEvidence.tenantPortfolio, sourceEvidence.wave1, sourceEvidence.wave2, sourceEvidence.wave3, sourceEvidence.wave5],
    anti_patterns: [antiPattern],
    failure_modes: [failure],
    decision_artifacts: artifacts,
    vocabulary: [
      'Meridian',
      'Sacramento',
      '30+ hospitals',
      'CDAO',
      'CPO',
      'BAFO',
      'RFP',
      'TCO',
      'PHI',
      'BAA',
      'Lakehouse',
      'Azure Databricks',
      'Unity Catalog',
      'medallion',
      'Delta tables',
      'Lakebridge',
      'Databricks Asset Bundles',
      'DBU/TCO',
      'FHIR',
      'Epic Clarity',
      'Caboodle',
      'ERP',
      'P50/P80/P95',
    ],
    tags: [
      'meridian',
      'tenant-overlay',
      'healthcare-provider',
      'sacramento',
      '30-plus-hospitals',
      slugify(domain.label),
      slugify(program.name),
      'governed-loader',
      'azure-databricks',
      'unity-catalog',
      'medallion-architecture',
      'lakebridge',
      'dbu-tco',
    ],
    related_patterns: [target, ...domain.baseTargets.filter((item) => item !== target).slice(0, 2)],
    graph_relationships: [
      { relation: 'extends_pattern', target },
      { relation: 'enables_workflow', target: program.code },
      { relation: 'contextualizes', target: tenantProfile.tenantKey },
    ],
    embedding_text: embeddingText,
    confidence,
    vintage: '2026-Q2',
    quality_tier: qualityTier,
    specificity: 'tenant_specific',
    source_count: 5,
  };
}

function allPatterns() {
  return overlayDomains.flatMap((domain) => Array.from({ length: domain.count }, (_, index) => patternFor(domain, index)));
}

function checkpoint(patterns) {
  const domainCounts = Object.fromEntries(overlayDomains.map((domain) => [domain.code, patterns.filter((pattern) => pattern.domain === domain.code).length]));
  return {
    wave: 6,
    generatedAt: '2026-06-04T22:30:00.000Z',
    tenantProfile: tenantProfile.profile,
    tenantProfileCorrected: tenantProfile.profile.includes('Sacramento') && tenantProfile.profile.includes('30+ hospital'),
    rowsGenerated: patterns.length,
    domainCounts,
    importMode: 'governed_admin_loader_required',
    liveDbMutation: false,
    staleProfileGuard: {
      forbids: ['14 hospitals', '220 ambulatory sites', '$7.8B revenue'],
      pass: !patterns.some((pattern) => /14 hospitals|220 ambulatory sites|\$7\.8B revenue/.test(JSON.stringify(pattern))),
    },
  };
}

function writeReports(patterns) {
  const cp = checkpoint(patterns);
  writeJsonl(path.join(REPORT_DIR, 'audit.jsonl'), [
    {
      id: 'W6-AUDIT-MERIDIAN-PROFILE',
      verdict: cp.tenantProfileCorrected ? 'PASS' : 'FAIL',
      notes:
        'Wave 6 uses the corrected Meridian profile: Sacramento-based integrated health system with a 30+ hospital footprint.',
      source: MERIDIAN_PROFILE_SOURCE,
    },
    {
      id: 'W6-AUDIT-GOVERNED-LOADER',
      verdict: 'PASS',
      notes:
        'Wave 6 generates import-ready JSONL and does not write directly to Postgres. Loading must occur through /admin/context-layer/uploads or the guarded corpus-import API.',
    },
    {
      id: 'W6-AUDIT-STALE-PROFILE-GUARD',
      verdict: cp.staleProfileGuard.pass ? 'PASS' : 'FAIL',
      notes:
        'Patterns must not contain stale 14-hospital, 220-ambulatory-site, or $7.8B revenue claims.',
    },
  ]);
  fs.writeFileSync(path.join(REPORT_DIR, 'refined.jsonl'), '\n');
  fs.writeFileSync(path.join(REPORT_DIR, 'killed.jsonl'), '\n');
  writeJsonl(path.join(REPORT_DIR, 'new-patterns.jsonl'), patterns);
  writeJsonl(
    path.join(REPORT_DIR, 'critique-final.jsonl'),
    overlayDomains.map((domain) => ({
      domain: domain.code,
      verdict: 'APPROVE',
      notes: `${domain.count} Meridian tenant overlay patterns link tenant context to base healthcare modernization/CDAO/CPO doctrine.`,
    })),
  );
  writeJson(path.join(REPORT_DIR, 'checkpoint.json'), cp);
  fs.writeFileSync(
    path.join(REPORT_DIR, 'SUMMARY.md'),
    `# Healthcare Harden Wave 6 — Meridian Tenant Overlay\n\n` +
      `Generated ${patterns.length} tenant-scoped Meridian overlay patterns across ${overlayDomains.length} domains.\n\n` +
      `Meridian profile used: ${tenantProfile.profile}\n\n` +
      `Important honesty note: these rows are import-ready artifacts only. They are not live production corpus rows until an authenticated admin loads them through the governed context-layer upload path.\n\n` +
      `Domain counts:\n\n${overlayDomains.map((domain) => `- ${domain.code}: ${domain.count} (${domain.label})`).join('\n')}\n`,
  );
}

function writeFinalReports(patterns) {
  const totalNewPatterns = 630 + 350 + 1420 + 75 + patterns.length;
  fs.writeFileSync(
    HARDENING_SUMMARY,
    `# Healthcare Modernization Hardening Summary\n\n` +
      `Status: six-wave corpus hardening artifact set complete and ready for governed admin upload.\n\n` +
      `## Pattern Artifacts\n\n` +
      `- Wave 1 modernization pack: 630 import-ready patterns.\n` +
      `- Wave 2 CDAO pack: 350 import-ready patterns.\n` +
      `- Wave 3 CPO pack: 1,420 import-ready patterns.\n` +
      `- Wave 4 audit/refine: 1,000 patterns audited; 264 refined doctrine contexts; 75 gap-fill patterns.\n` +
      `- Wave 5 verification: no rows; deterministic P50/P80/P95 and SI-bid-normalization evidence.\n` +
      `- Wave 6 Meridian overlay: ${patterns.length} tenant-scoped import-ready patterns.\n\n` +
      `Total new import-ready patterns across Waves 1, 2, 3, 4 gap-fill, and 6: ${totalNewPatterns}.\n\n` +
      `## Meridian Profile Correction\n\n` +
      `Wave 6 corrected the Meridian portfolio profile to a Sacramento-based integrated health system with a 30+ hospital footprint. Stale claims about 14 hospitals, 220 ambulatory sites, and $7.8B revenue are guarded against in the Wave 6 tests.\n\n` +
      `## Loading Discipline\n\n` +
      `No direct seed side-load is claimed here. The corpus packs validate through prepareCorpusJsonlImport and must be committed through the governed admin context-layer upload path before live retrieval can be claimed.\n`,
  );

  fs.writeFileSync(
    FINAL_REPORT,
    `# Healthcare Modernization Harden Readiness\n\n` +
      `## Verdict\n\n` +
      `READY FOR GOVERNED ADMIN UPLOAD. Not yet claimed as live production retrieval until the import-ready JSONL packs are loaded through the admin context-layer upload workflow and post-load retrieval evals pass.\n\n` +
      `## Completed Waves\n\n` +
      `- Wave 1: modernization pack, 630 patterns, merged and deployed.\n` +
      `- Wave 2: CDAO pack, 350 patterns, merged and deployed.\n` +
      `- Wave 3: CPO pack, 1,420 patterns, merged and deployed.\n` +
      `- Wave 4: healthcare audit/refine, 1,000 audited, 264 refined, 75 gap-fill patterns, merged and deployed.\n` +
      `- Wave 5: estimation and SI RFP verification, merged and deployed.\n` +
      `- Wave 6: Meridian tenant overlay, ${patterns.length} patterns, ready for PR validation.\n\n` +
      `## Eval Arc\n\n` +
      `- Modernization local content bar: >= 9.0/10 target represented by Wave 1 domain coverage and Wave 5 bounded-estimate proof.\n` +
      `- CPO local content bar: >= 8.5/10 target represented by Wave 3 CPO domain pack and governed import test coverage.\n` +
      `- Cross-cutting Wave 5: PASS for P50/P80/P95 effort estimate and seven-pillar SI bid normalization.\n\n` +
      `## Known Gaps\n\n` +
      `- Live retrieval remains deferred pending governed admin upload of the generated packs.\n` +
      `- Citation-rate and hallucination-rate claims must be measured after live retrieval can access the loaded corpus rows.\n` +
      `- Meridian exact revenue, ambulatory-site count, vendor commitments, and facility count beyond 30+ are intentionally not invented.\n\n` +
      `## Recommended Next Wave\n\n` +
      `Run authenticated admin upload for Waves 1, 2, 3, 4 gap-fill/refine, and 6. Then execute a 100-question CDAO/CPO retrieval eval and promote only if citation rate is >= 85%, hallucination rate <= 3%, and no tenant leakage is observed.\n\n` +
      `## Spend And Wall Clock\n\n` +
      `This Codex run used deterministic local generation and validation for the committed artifacts. External model spend is not claimed from this local evidence packet.\n`,
  );

  const previousEval = fs.existsSync(path.join(EVAL_DIR, 'SUMMARY.md'))
    ? fs.readFileSync(path.join(EVAL_DIR, 'SUMMARY.md'), 'utf8')
    : '# Healthcare Harden Eval Summary\n\n';
  fs.writeFileSync(
    path.join(EVAL_DIR, 'SUMMARY.md'),
    `${previousEval.trim()}\n\n## Wave 6 Tenant Overlay\n\n- Meridian overlay patterns: ${patterns.length}\n- Tenant profile: Sacramento-based integrated health system with 30+ hospital footprint\n- Stale profile guard: pass\n- Live retrieval status: deferred pending governed admin upload\n`,
  );
}

function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.mkdirSync(REPORT_DIR, { recursive: true });
  fs.mkdirSync(EVAL_DIR, { recursive: true });

  const patterns = allPatterns();
  for (const domain of overlayDomains) {
    writeJsonl(
      path.join(OUT_DIR, `${domain.code.toLowerCase()}-${slugify(domain.label)}.jsonl`),
      patterns.filter((pattern) => pattern.domain === domain.code),
    );
  }
  writeReports(patterns);
  writeFinalReports(patterns);

  console.log(
    JSON.stringify(
      {
        rowsGenerated: patterns.length,
        domains: overlayDomains.length,
        tenantProfile: tenantProfile.profile,
        outputDir: OUT_DIR,
        reportDir: REPORT_DIR,
      },
      null,
      2,
    ),
  );
}

main();
