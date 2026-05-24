import 'server-only';

import { renderBoardPack } from '@/lib/artifacts/render-engine';
import type { BoardPackRenderResult } from '@/lib/artifacts/types';
import type { TenantAiPolicy } from '@/lib/integrations/ai-egress';
import type { DecisionThreadDossier } from './auto-linker';

const INTERNAL_ONLY_POLICY: TenantAiPolicy = {
  allowExternalAI: false,
  allowClaude: false,
  allowGamma: false,
  kernelOnlyMode: true,
  maxDataClass: 'internal',
  requireRedaction: true,
  requireHumanApprovalForExports: true,
  promptResponseRetentionDays: 0,
};

export async function renderDossierBoardPack(
  dossier: DecisionThreadDossier,
  renderedBy: string,
  tenantPolicy: TenantAiPolicy = INTERNAL_ONLY_POLICY,
): Promise<BoardPackRenderResult> {
  const facts = dossier.links.map((link) => ({
    id: `${link.surface}-${link.id}`,
    label: `${link.surface} link`,
    value: `${link.artifact_ref} · ${link.link_reason ?? 'linked'}`,
    evidenceLedgerId: firstEvidenceIdOrPlaceholder(link.artifact_ref),
  }));

  return renderBoardPack({
    clientId: dossier.thread.client_id,
    sourceArtifactRef: dossier.thread.id,
    artifactType: 'dossier_board_pack',
    outputFormat: 'html',
    renderEngine: 'internal',
    renderedBy,
    title: `Decision Dossier · ${dossier.thread.title}`,
    tenantPolicy,
    facts,
    sections: [
      {
        id: 'intelligence-rationale',
        title: 'Intelligence rationale',
        claims: sectionClaims(dossier, 'intelligence'),
      },
      {
        id: 'moves-business-case',
        title: 'Moves business case',
        claims: sectionClaims(dossier, 'moves'),
      },
      {
        id: 'source-commercial-path',
        title: 'Source commercial path',
        claims: sectionClaims(dossier, 'source'),
      },
      {
        id: 'tower-measurement-plan',
        title: 'Tower measurement plan',
        claims: sectionClaims(dossier, 'tower'),
      },
      {
        id: 'evidence-summary',
        title: 'Evidence Ledger summary',
        claims: [
          `Total linked proof points: ${Object.values(dossier.proofPointCounts).reduce((sum, count) => sum + count, 0)} [${firstEvidenceIdOrPlaceholder(dossier.thread.id)}]`,
        ],
      },
    ],
  });
}

function sectionClaims(
  dossier: DecisionThreadDossier,
  surface: 'intelligence' | 'moves' | 'source' | 'tower',
): string[] {
  const links = dossier.links.filter((link) => link.surface === surface);
  if (links.length === 0) {
    return [`No ${surface} artifact is linked yet [${firstEvidenceIdOrPlaceholder(dossier.thread.id)}]`];
  }
  return links.map((link) => {
    const proofPoints = dossier.proofPointCounts[`${link.surface}:${link.artifact_ref}`] ?? 0;
    return `${surface} artifact ${link.artifact_ref} is linked with ${proofPoints} proof points [${firstEvidenceIdOrPlaceholder(link.artifact_ref)}]`;
  });
}

function firstEvidenceIdOrPlaceholder(seed: string): string {
  const normalized = seed.replace(/[^0-9a-f]/gi, '').padEnd(32, '0').slice(0, 32);
  return `${normalized.slice(0, 8)}-${normalized.slice(8, 12)}-${normalized.slice(12, 16)}-${normalized.slice(16, 20)}-${normalized.slice(20, 32)}`;
}
