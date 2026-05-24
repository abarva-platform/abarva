import 'server-only';

import { createHash } from 'node:crypto';

import {
  callModel,
  createMemoryAiEgressAuditSink,
  type AiModelAdapter,
} from '@/lib/integrations/ai-egress';

import { runArtifactConsistencyGuard } from './consistency-guard';
import type {
  BoardPackFact,
  BoardPackRenderInput,
  BoardPackRenderResult,
  BoardPackSection,
  GeneratedArtifactFormat,
} from './types';

const gammaInstructionAdapter: AiModelAdapter = async ({ prompt, model }) => ({
  model: model ?? 'gamma-render-planner-deterministic-adapter',
  response: [
    'Gamma render plan accepted.',
    'Use the supplied facts table verbatim.',
    'Do not alter financial values.',
    'Render every claim with its evidence_ledger_id.',
    prompt,
  ].join('\n'),
});

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function evidenceIdsForFacts(facts: BoardPackFact[]): string[] {
  return Array.from(new Set(facts.map((fact) => fact.evidenceLedgerId)));
}

function renderFactsTable(facts: BoardPackFact[]): string {
  if (facts.length === 0) {
    return '<p class="empty">No evidence-backed facts were supplied. Artifact is not publishable.</p>';
  }
  return [
    '<table>',
    '<thead><tr><th>Fact</th><th>Value</th><th>Evidence</th></tr></thead>',
    '<tbody>',
    ...facts.map((fact) => (
      `<tr><td>${escapeHtml(fact.label)}</td><td>${escapeHtml(fact.value)}</td><td><code>${escapeHtml(fact.evidenceLedgerId)}</code></td></tr>`
    )),
    '</tbody></table>',
  ].join('');
}

function renderSection(section: BoardPackSection): string {
  return [
    `<section data-section="${escapeHtml(section.id)}">`,
    `<h2>${escapeHtml(section.title)}</h2>`,
    '<ul>',
    ...section.claims.map((claim) => `<li>${escapeHtml(claim)}</li>`),
    '</ul>',
    '</section>',
  ].join('');
}

export function renderInternalBoardPackHtml(input: BoardPackRenderInput): string {
  const evidenceIds = evidenceIdsForFacts(input.facts);
  return [
    '<!doctype html><html><head><meta charset="utf-8" />',
    `<title>${escapeHtml(input.title)}</title>`,
    '<style>body{font-family:Arial,sans-serif;margin:32px;color:#111827;background:#f8f7f4}main{max-width:980px;margin:0 auto;background:#fff;border:1px solid #d7d2c6;border-radius:8px;padding:28px}h1,h2{font-family:Georgia,serif;font-weight:400}table{width:100%;border-collapse:collapse;margin:18px 0}td,th{border:1px solid #d7d2c6;padding:8px;text-align:left}code{font-size:12px}.empty{color:#7c2d12}</style>',
    '</head><body><main>',
    `<p>${escapeHtml(input.artifactType)} · ${escapeHtml(input.sourceArtifactRef)}</p>`,
    `<h1>${escapeHtml(input.title)}</h1>`,
    '<h2>Evidence-Locked Facts Table</h2>',
    renderFactsTable(input.facts),
    ...input.sections.map(renderSection),
    '<h2>Sources Cited</h2>',
    '<ul>',
    ...evidenceIds.map((id) => `<li><code>${escapeHtml(id)}</code></li>`),
    '</ul>',
    '</main></body></html>',
  ].join('');
}

function renderPrompt(input: BoardPackRenderInput): string {
  return JSON.stringify({
    instruction: 'Render a board-grade artifact from this locked facts table. Preserve every number and evidence_ledger_id.',
    artifactType: input.artifactType,
    sourceArtifactRef: input.sourceArtifactRef,
    title: input.title,
    facts: input.facts,
    sections: input.sections,
  });
}

function outputFormat(input: BoardPackRenderInput): GeneratedArtifactFormat {
  return input.outputFormat ?? 'html';
}

function qualityScore(input: BoardPackRenderInput, guardOk: boolean): number {
  const hasFacts = input.facts.length > 0;
  const hasSections = input.sections.length >= 3;
  const allClaimsMentionEvidence = input.sections.every((section) =>
    section.claims.every((claim) => input.facts.some((fact) => claim.includes(fact.evidenceLedgerId))),
  );
  const raw = (hasFacts ? 3 : 0) + (hasSections ? 3 : 0) + (allClaimsMentionEvidence ? 2 : 0) + (guardOk ? 2 : 0);
  return Math.min(10, raw);
}

export async function renderBoardPack(input: BoardPackRenderInput): Promise<BoardPackRenderResult> {
  const requestedEngine = input.renderEngine ?? 'gamma_with_internal_fallback';
  const evidenceLedgerIds = evidenceIdsForFacts(input.facts);
  let generationEgressAudit: string | null = null;
  let aiResult: BoardPackRenderResult['aiResult'];

  if (requestedEngine === 'gamma' || requestedEngine === 'gamma_with_internal_fallback') {
    aiResult = await callModel({
      tenantId: input.clientId,
      userId: input.userId,
      workflow: 'board-pack-render',
      provider: 'gamma',
      route: 'gamma-api',
      model: 'gamma-board-pack',
      prompt: renderPrompt(input),
      dataClass: 'confidential',
      artifactId: input.sourceArtifactRef,
      artifactType: input.artifactType,
      metadata: {
        factsOnly: true,
        evidenceLedgerIds,
      },
      policy: input.tenantPolicy,
      adapter: gammaInstructionAdapter,
      auditSink: createMemoryAiEgressAuditSink(),
    });
    generationEgressAudit = aiResult.auditId;
    if (!aiResult.ok && requestedEngine === 'gamma') {
      const html = renderInternalBoardPackHtml({
        ...input,
        sections: [
          {
            id: 'egress-refusal',
            title: 'Render Refused',
            claims: [aiResult.reason],
          },
          ...input.sections,
        ],
      });
      return finalize(input, html, 'gamma', outputFormat(input), evidenceLedgerIds, generationEgressAudit, aiResult);
    }
  }

  const html = renderInternalBoardPackHtml(input);
  return finalize(
    input,
    html,
    requestedEngine === 'gamma_with_internal_fallback' ? 'gamma_with_internal_fallback' : 'internal',
    outputFormat(input),
    evidenceLedgerIds,
    generationEgressAudit,
    aiResult,
  );
}

function finalize(
  input: BoardPackRenderInput,
  html: string,
  renderEngine: BoardPackRenderResult['renderEngine'],
  format: GeneratedArtifactFormat,
  evidenceLedgerIds: string[],
  generationEgressAudit: string | null,
  aiResult?: BoardPackRenderResult['aiResult'],
): BoardPackRenderResult {
  const guard = runArtifactConsistencyGuard({
    renderedText: html,
    facts: input.facts,
    evidenceLedgerIds,
  });
  const blobSha256 = sha256(html);
  return {
    artifactType: input.artifactType,
    sourceArtifactRef: input.sourceArtifactRef,
    renderEngine,
    outputFormat: format,
    html,
    blobUrl: `generated://artifacts/${input.clientId}/${input.artifactType}/${input.sourceArtifactRef}/${blobSha256}.${format}`,
    blobSha256,
    qualityScore: qualityScore(input, guard.ok),
    evidenceLedgerIds,
    generationEgressAudit,
    quarantined: !guard.ok,
    quarantineReason: guard.ok ? null : guard.findings.join('; '),
    aiResult,
  };
}

