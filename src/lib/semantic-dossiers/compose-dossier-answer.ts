import type { DossierAnswer, UniversalDimensionDossier } from './types';
import { canonicalClientDisplayName } from '@/lib/client-config';

function asList(value: unknown): string[] {
  return Array.isArray(value) ? value.map(String).filter(Boolean) : [];
}

function tenantLabel(tenantKey: string): string {
  const canonical = canonicalClientDisplayName({ key: tenantKey });
  if (canonical) return canonical;
  return tenantKey
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function validateAnswer(answer: string, dossier: UniversalDimensionDossier): string[] {
  const issues: string[] = [];
  const lower = answer.toLowerCase();
  const namedLeadershipCount = Number(dossier.rollups.namedLeadershipCount ?? 0);
  const packet = dossier.composerPacket;
  const primaryLoadedSections = packet.sections.filter(
    (section) => section.dimensionFamily === packet.primaryDimension && section.recordCount > 0,
  );
  const adjacentLoadedSections = packet.sections.filter(
    (section) => packet.relatedDimensions.includes(section.dimensionFamily) && section.recordCount > 0,
  );

  if (namedLeadershipCount > 0 && /\bcannot be (characterized|identified)\b/.test(lower)) {
    issues.push('answer_contradicts_loaded_named_leadership');
  }
  if (packet.sections.length === 0) issues.push('composer_packet_missing_sections');
  if (primaryLoadedSections.length === 0) issues.push('composer_packet_missing_primary_dimension_binder');
  if (adjacentLoadedSections.length === 0) issues.push('composer_packet_missing_adjacent_dimension_binder');
  if (packet.citations.length === 0) issues.push('composer_packet_missing_citations');
  if (packet.artifactPlan.length === 0) issues.push('composer_packet_missing_artifact_plan');
  if (!packet.answerBoundary.canAnswer.length) issues.push('composer_packet_missing_answer_boundary');
  if (/missing source support/.test(lower)) issues.push('answer_leads_with_engine_gap_language');
  if (/\brows\b/.test(lower)) issues.push('answer_uses_row_count_language');
  if (/\braw id\b|semantic packet|\bpacket\b|home_know|debug\b/.test(lower)) issues.push('answer_leaks_internal_language');
  if (answer.length < 180) issues.push('answer_too_thin_for_consultant_grade_response');
  return issues;
}

function dimensionLabel(value: string): string {
  return value.replaceAll('_', ' ');
}

function possessive(label: string): string {
  return label.endsWith('s') ? `${label}'` : `${label}'s`;
}

function topMetricPhrase(dossier: UniversalDimensionDossier): string {
  const metrics = dossier.composerPacket.metrics.slice(0, 5);
  if (metrics.length === 0) return 'The assembled dossier has source-backed context, but no deterministic metric rollup for this question yet.';
  return metrics.map((metric) => `${metric.label}: ${metric.value}${metric.unit && metric.unit !== 'count' ? ` ${metric.unit}` : ''}`).join('; ');
}

function relationshipPhrase(dossier: UniversalDimensionDossier): string {
  const paths = dossier.composerPacket.relationshipPaths.slice(0, 4);
  if (paths.length === 0) return 'Relationship paths are thin, so the safe answer should emphasize loaded facts and call out the missing joins.';
  return `The important relationship paths are ${paths.map((path) => path.label.toLowerCase()).join(', ')}.`;
}

function gapPhrase(dossier: UniversalDimensionDossier): string {
  if (dossier.gaps.length === 0) return 'No blocking gap is visible in the assembled dossier, though final operating decisions still need client validation.';
  return `The main missing pieces are ${dossier.gaps.slice(0, 3).map((gap) => gap.label.toLowerCase()).join('; ')}.`;
}

function composeGenericKnowAnswer(dossier: UniversalDimensionDossier): string {
  const label = tenantLabel(dossier.tenantKey);
  const dimension = dimensionLabel(dossier.route.primaryDimension);
  const handoff =
    dossier.answerBoundary.handoffTarget && dossier.answerBoundary.handoffTarget !== 'home'
      ? ` Home can ground the facts and boundaries, but the investment or prioritization call should move to ${dossier.answerBoundary.handoffTarget}.`
      : '';

  return `${possessive(label)} loaded ${dimension} dossier gives a current-state view across the primary binder and adjacent context. ${topMetricPhrase(dossier)}. ${relationshipPhrase(dossier)} ${gapPhrase(dossier)}${handoff}`;
}

function composeOrganizationAnswer(dossier: UniversalDimensionDossier): string {
  const label = tenantLabel(dossier.tenantKey);
  const namedCount = Number(dossier.rollups.namedLeadershipCount ?? 0);
  const teamCount = Number(dossier.rollups.itTeamCount ?? 0);
  const functionCount = Number(dossier.rollups.businessFunctionCount ?? 0);
  const appOwnershipCount = Number(dossier.rollups.applicationOwnershipCount ?? 0);
  const technologyLeadership = asList(dossier.rollups.technologyLeadership);

  const lead =
    `${possessive(label)} loaded context supports a portfolio-led view of IT and business organization. ` +
    `Technology accountability is visible across business functions, IT domains, application ownership, and executive/role-level leadership, which supports an operating-model synthesis before any caveats.`;

  const named =
    namedCount > 0 && technologyLeadership.some((entry) => entry.includes('('))
      ? ` Named technology and executive leaders are loaded where the evidence provides them, including ${technologyLeadership
          .filter((entry) => entry.includes('('))
          .slice(0, 8)
          .join(', ')}.`
      : ' Named individual leaders are not fully loaded, so the answer should stay at role/domain level until client-approved people data is added.';

  const operatingModel =
    ` The operating model coverage includes ${functionCount} business-function areas, ${teamCount} IT/technology domains, and ${appOwnershipCount} application-to-team ownership links. ` +
    `That lets aVa explain who is accountable by domain, which portfolios the teams support, and where applications connect back to technology ownership.`;

  const gaps = dossier.gaps.length
    ? ` The main caveat is precision: ${dossier.gaps.map((gap) => gap.label).join(' ')}`
    : '';

  return `${lead}${named}${operatingModel}${gaps}`;
}

export function composeDossierAnswer(dossier: UniversalDimensionDossier): DossierAnswer {
  const directAnswer =
    dossier.route.primaryDimension === 'organization_leadership'
      ? composeOrganizationAnswer(dossier)
      : composeGenericKnowAnswer(dossier);

  const issues = validateAnswer(directAnswer, dossier);
  return {
    directAnswer,
    composerPacket: dossier.composerPacket,
    artifactPlan: dossier.route.artifactPlan,
    citations: dossier.citations,
    gaps: dossier.gaps,
    quality: {
      passed: issues.length === 0,
      issues,
    },
  };
}
