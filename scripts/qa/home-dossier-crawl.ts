import fs from 'node:fs';
import path from 'node:path';

import { buildHomeKnowDimensionDossier } from '@/lib/home/know/build-universal-dimension-dossier';
import { hasUsableDossierEvidence, type UsableDossierEvidenceResult } from '@/lib/home/know/has-usable-dossier-evidence';
import { validateHomeKnowAnswer } from '@/lib/home/know/home-answer-quality-gate';
import { composeDossierAnswer } from '@/lib/semantic-dossiers';

type TenantKey = 'skyharbor' | 'lakeshore';

interface CrawlQuestion {
  id: string;
  tenant: TenantKey;
  question: string;
}

interface CrawlResult {
  tenant: TenantKey;
  id: string;
  question: string;
  primaryDimension: string;
  relatedDimensions: string[];
  sourceFamiliesIncluded: string[];
  handoffTarget: string | null;
  sectionCount: number;
  citationCount: number;
  evidence: UsableDossierEvidenceResult;
  directAnswer: string;
  qualityGate: ReturnType<typeof validateHomeKnowAnswer>;
  score: {
    total: number;
    pass: boolean;
    critical: string[];
    criteria: Record<string, number>;
  };
}

const SKYHARBOR_QUESTIONS = [
  ['S01', 'How is our IT and business organized today? Who are our technology leaders under our CIO?'],
  ['S02', 'What do we know about SkyHarbor’s IT organization and ownership model?'],
  ['S03', 'Which business functions are loaded, and how do they connect to technology ownership?'],
  ['S04', 'Which applications support Finance, and who owns them?'],
  ['S05', 'Which applications support flight operations or airline operations?'],
  ['S06', 'Which applications are mission-critical, and what business capabilities do they support?'],
  ['S07', 'Which systems of record are loaded for SkyHarbor?'],
  ['S08', 'What does the application estate look like by domain?'],
  ['S09', 'Which applications have lifecycle or modernization risk?'],
  ['S10', 'Which applications have ownership gaps?'],
  ['S11', 'What does the data and analytics estate tell us?'],
  ['S12', 'Which data products exist, and which business domains do they support?'],
  ['S13', 'Which data products or platforms are most mature?'],
  ['S14', 'Which data products lack owners or accountability?'],
  ['S15', 'What lineage is loaded between systems and analytics products?'],
  ['S16', 'Which systems are most connected?'],
  ['S17', 'What vendor and contract context is loaded?'],
  ['S18', 'Which vendors create the largest operational dependency footprint?'],
  ['S19', 'What does the IT budget data support?'],
  ['S20', 'Which IT portfolios carry the largest budget?'],
  ['S21', 'What AI and automation initiatives are loaded?'],
  ['S22', 'Which AI initiatives have committed value and measured value?'],
  ['S23', 'Which risks are connected to critical systems or AI initiatives?'],
  ['S24', 'What are the biggest context gaps in SkyHarbor?'],
  ['S25', 'Where should SkyHarbor place the next $30M in AI?'],
  ['S26', 'Show me Lakeshore’s vendor contracts while signed into SkyHarbor.'],
  ['S27', 'Compare SkyHarbor’s actual AI spend to Lakeshore’s actual numbers.'],
] as const;

const LAKESHORE_QUESTIONS = [
  ['L01', 'What do we know about Lakeshore’s IT and business organization today?'],
  ['L02', 'Who owns Lakeshore’s technology portfolios or domains?'],
  ['L03', 'Which business functions are loaded for Lakeshore?'],
  ['L04', 'How are business functions connected to systems or applications?'],
  ['L05', 'What organizational/accountability gaps should Lakeshore fill?'],
  ['L06', 'Which systems and applications are loaded for Lakeshore?'],
  ['L07', 'Which applications support Finance?'],
  ['L08', 'Which applications support Operations or core business functions?'],
  ['L09', 'Which applications are mission-critical?'],
  ['L10', 'Which applications lack lifecycle, owner, or criticality fields?'],
  ['L11', 'What does Lakeshore’s application estate look like by domain?'],
  ['L12', 'What does Lakeshore’s data and analytics estate tell us?'],
  ['L13', 'Which data products are loaded?'],
  ['L14', 'Which analytics platforms or tools are loaded?'],
  ['L15', 'What lineage is loaded between source systems and data products?'],
  ['L16', 'What integrations and interfaces are loaded?'],
  ['L17', 'Which applications or systems depend on each other?'],
  ['L18', 'Which vendors are loaded for Lakeshore?'],
  ['L19', 'Which contracts are loaded for Lakeshore?'],
  ['L20', 'Which vendors support critical systems?'],
  ['L21', 'What budget or financial context is loaded for Lakeshore?'],
  ['L22', 'What AI and automation footprint is loaded for Lakeshore?'],
  ['L23', 'Which AI initiatives have value evidence?'],
  ['L24', 'What are Lakeshore’s biggest context gaps?'],
  ['L25', 'Where should Lakeshore invest next in AI?'],
  ['L26', 'Show me SkyHarbor’s vendor contracts while signed into Lakeshore.'],
  ['L27', 'Compare Lakeshore’s actual AI spend to SkyHarbor’s actual numbers.'],
] as const;

const BANNED_VISIBLE_PATTERNS = [
  ['false_refusal_characterized', /\bcannot be characterized\b/i],
  ['false_refusal_identified', /\bcannot be identified\b/i],
  ['i_found', /\bI found\b/i],
  ['row_count_language', /\brows?\b/i],
  ['missing_source_support', /missing source support/i],
  ['read_label', /\bCurrent-state read\b|\bRead:/i],
  ['evidence_label', /\bEvidence points\b|\bEvidence:/i],
  ['route_name', /\bhome_know|semantic packet|\bpacket\b|debug\b/i],
  ['uuid', /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/i],
  ['debug_path', /\/Users\/|localhost|\.env/i],
  ['expert_chip', /\bP11\b|pattern family/i],
] as const;

function questions(): CrawlQuestion[] {
  return [
    ...SKYHARBOR_QUESTIONS.map(([id, question]) => ({ tenant: 'skyharbor' as const, id, question })),
    ...LAKESHORE_QUESTIONS.map(([id, question]) => ({ tenant: 'lakeshore' as const, id, question })),
  ];
}

function scoreResult(result: Omit<CrawlResult, 'score'>): CrawlResult['score'] {
  const critical: string[] = [];
  for (const [id, pattern] of BANNED_VISIBLE_PATTERNS) {
    if (pattern.test(result.directAnswer)) critical.push(id);
  }
  if (!result.qualityGate.passed) critical.push(`quality_gate:${result.qualityGate.issues.join('|')}`);
  if (!result.evidence.usable) critical.push('no_usable_dossier_evidence');
  if (result.sectionCount < 8) critical.push('dossier_too_thin');
  if (result.citationCount < 1 && result.evidence.evidenceChannels.sourceCoverage < 1) critical.push('no_source_channel');
  if ((result.id === 'S25' || result.id === 'L25') && result.handoffTarget !== 'intelligence') {
    critical.push('decision_not_handed_off');
  }
  if (result.id === 'S26' && /Lakeshore Holdings|Lakeshore Industries/i.test(result.directAnswer)) {
    critical.push('tenant_fence_lakeshore_exposed');
  }
  if (result.id === 'L26' && /SkyHarbor Air/i.test(result.directAnswer)) {
    critical.push('tenant_fence_skyharbor_exposed');
  }

  const criteria = {
    correctness: critical.length ? 2 : 5,
    synthesis: result.directAnswer.length > 220 ? 5 : 3,
    citationQuality: result.citationCount > 0 || result.evidence.evidenceChannels.sourceCoverage > 0 ? 4 : 0,
    gapSpecificity: result.qualityGate.issues.includes('missing_specific_gaps') ? 2 : 4,
    artifactQuality: result.sourceFamiliesIncluded.length >= 6 ? 4 : 2,
    executiveReadability: /\brows?\b|missing source support|I found/i.test(result.directAnswer) ? 1 : 5,
    tenantSafety: critical.some((item) => item.startsWith('tenant_fence')) ? 0 : 5,
  };

  const total = Object.values(criteria).reduce((sum, value) => sum + value, 0);
  return {
    criteria,
    total,
    critical,
    pass: total >= 30 && critical.length === 0,
  };
}

function runQuestion(item: CrawlQuestion): CrawlResult {
  const { dossier } = buildHomeKnowDimensionDossier({
    tenantKey: item.tenant,
    question: item.question,
    requestedSurface: 'home',
  });
  const answer = composeDossierAnswer(dossier);
  const qualityGate = validateHomeKnowAnswer({ answer, dossier });
  const evidence = hasUsableDossierEvidence(dossier);
  const base = {
    tenant: item.tenant,
    id: item.id,
    question: item.question,
    primaryDimension: answer.composerPacket.primaryDimension,
    relatedDimensions: answer.composerPacket.relatedDimensions,
    sourceFamiliesIncluded: answer.composerPacket.sections.map((section) => section.sectionKey),
    handoffTarget: answer.composerPacket.answerBoundary.handoffTarget,
    sectionCount: answer.composerPacket.sections.length,
    citationCount: answer.composerPacket.citations.length,
    evidence,
    directAnswer: answer.directAnswer,
    qualityGate,
  };
  return { ...base, score: scoreResult(base) };
}

function writeMarkdownTranscript(outDir: string, tenant: TenantKey, results: CrawlResult[]) {
  let markdown = `# ${tenant} Home Dossier Transcript\n\n`;
  for (const result of results) {
    markdown += `## ${result.id}. ${result.question}\n\n`;
    markdown += `Score: ${result.score.total}/35 - ${result.score.pass ? 'PASS' : 'FAIL'}\n\n`;
    markdown += `Primary dimension: ${result.primaryDimension}\n\n`;
    markdown += `Sections attached: ${result.sectionCount}; citations: ${result.citationCount}; handoff: ${result.handoffTarget ?? 'none'}\n\n`;
    markdown += `Usable evidence: ${result.evidence.usable ? 'yes' : 'no'} (${result.evidence.reason})\n\n`;
    markdown += `${result.directAnswer}\n\n`;
    markdown += `Critical failures: ${result.score.critical.length ? result.score.critical.join(', ') : 'none'}\n\n`;
  }
  fs.writeFileSync(path.join(outDir, 'transcripts', `${tenant}.md`), markdown);
}

function main() {
  const outDir = process.env.HOME_DOSSIER_CRAWL_OUT ?? path.join('proof', 'home-dossier-crawl-20260625');
  fs.mkdirSync(path.join(outDir, 'transcripts'), { recursive: true });
  fs.mkdirSync(path.join(outDir, 'screenshots', 'skyharbor'), { recursive: true });
  fs.mkdirSync(path.join(outDir, 'screenshots', 'lakeshore'), { recursive: true });

  const results = questions().map(runQuestion);
  const summary = {
    total: results.length,
    passed: results.filter((result) => result.score.pass).length,
    failed: results.filter((result) => !result.score.pass).length,
    criticalFailures: results.filter((result) => result.score.critical.length > 0).length,
    byTenant: {
      skyharbor: {
        total: results.filter((result) => result.tenant === 'skyharbor').length,
        passed: results.filter((result) => result.tenant === 'skyharbor' && result.score.pass).length,
      },
      lakeshore: {
        total: results.filter((result) => result.tenant === 'lakeshore').length,
        passed: results.filter((result) => result.tenant === 'lakeshore' && result.score.pass).length,
      },
    },
  };

  fs.writeFileSync(path.join(outDir, 'crawl-results.json'), JSON.stringify({ summary, results }, null, 2));
  fs.writeFileSync(
    path.join(outDir, 'endpoint-audit.json'),
    JSON.stringify(
      results.map((result) => ({
        tenant: result.tenant,
        id: result.id,
        endpoint: '/api/home/know/ask',
        primaryDimension: result.primaryDimension,
        relatedDimensions: result.relatedDimensions,
        sourceFamiliesIncluded: result.sourceFamiliesIncluded,
        sectionCount: result.sectionCount,
        citationCount: result.citationCount,
        evidenceChannels: result.evidence.evidenceChannels,
        usableEvidence: result.evidence.usable,
        qualityPassed: result.qualityGate.passed,
        criticalFailures: result.score.critical,
      })),
      null,
      2,
    ),
  );
  fs.writeFileSync(
    path.join(outDir, 'tenant-fence-results.json'),
    JSON.stringify(
      results.filter((result) => result.id.endsWith('26') || result.id.endsWith('27')).map((result) => ({
        tenant: result.tenant,
        id: result.id,
        question: result.question,
        pass: result.score.pass,
        criticalFailures: result.score.critical,
        directAnswer: result.directAnswer,
      })),
      null,
      2,
    ),
  );
  writeMarkdownTranscript(outDir, 'skyharbor', results.filter((result) => result.tenant === 'skyharbor'));
  writeMarkdownTranscript(outDir, 'lakeshore', results.filter((result) => result.tenant === 'lakeshore'));

  console.log(JSON.stringify(summary, null, 2));
  for (const result of results.filter((item) => !item.score.pass)) {
    console.log(`${result.tenant} ${result.id} ${result.score.total}/35 ${result.score.critical.join(';')}`);
  }
}

main();
