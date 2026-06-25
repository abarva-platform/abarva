import type { DossierAnswer, UniversalDimensionDossier } from './types';
import { ALL_CLIENTS, CLIENT_KEY_TO_DB_NAME, canonicalClientDisplayName } from '@/lib/client-config';

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
  if (primaryLoadedSections.length === 0) issues.push('composer_packet_missing_primary_dimension_context');
  if (adjacentLoadedSections.length === 0) issues.push('composer_packet_missing_adjacent_dimension_context');
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
  if (metrics.length === 0) return 'The loaded source context has enough support for a directional answer, but no deterministic metric rollup for this question yet.';
  return metrics.map((metric) => `${metric.label}: ${metric.value}${metric.unit && metric.unit !== 'count' ? ` ${metric.unit}` : ''}`).join('; ');
}

function relationshipPhrase(dossier: UniversalDimensionDossier): string {
  const paths = dossier.composerPacket.relationshipPaths.slice(0, 4);
  if (paths.length === 0) return 'Relationship paths are thin, so the safe answer should emphasize loaded facts and call out the missing joins.';
  return `The important relationship paths are ${paths.map((path) => path.label.toLowerCase()).join(', ')}.`;
}

function gapPhrase(dossier: UniversalDimensionDossier): string {
  if (dossier.gaps.length === 0) return 'The loaded sources do not show a specific gap for this question, though final operating choices still need client validation.';
  return `The main missing pieces are ${dossier.gaps.slice(0, 3).map((gap) => gap.label.toLowerCase()).join('; ')}.`;
}

function questionFocusPhrase(dossier: UniversalDimensionDossier): string {
  const q = dossier.route.question.toLowerCase();
  if (/\bdomain\b/.test(q)) {
    return 'For the domain view, use the table/chart outputs to compare where applications, platforms, or data products concentrate by business domain.';
  }
  if (/\bmission-critical|criticality|critical\b/.test(q)) {
    return 'For criticality, the safe read is to separate mission-critical assets from items where criticality, owner, or lifecycle fields still need confirmation.';
  }
  if (/\bunsupported|end of life|eol|near end|lifecycle\b/.test(q)) {
    return 'For unsupported or end-of-life applications, use lifecycle fields to identify applications with retirement, unsupported, N-1, or modernization risk signals, then tie them back to owners, domains, and affected capabilities.';
  }
  if (/\blifecycle|modernization|risk\b/.test(q)) {
    return 'For lifecycle and modernization risk, the useful read is which applications connect to risk/control context, lifecycle status, vendor dependency, and modernization ownership.';
  }
  if (/\bownership gap|owner gap|ownership gaps|lack.*owner|missing.*owner\b/.test(q)) {
    return 'For ownership gaps, focus on missing named owners, incomplete role-to-person mapping, and application-to-team joins rather than treating ownership as fully resolved.';
  }
  if (/\blineage|feed|feeds|source system|data product\b/.test(q)) {
    return 'For lineage, the graph should show source systems, integrations, data products, owning domains, and the missing joins that limit traceability.';
  }
  if (/\bintegration|interface|connected|most connected|relationship|dependency|dependencies\b/.test(q)) {
    return 'For connectivity, use the relationship graph to identify the most connected systems and show system-to-system, system-to-capability, vendor-to-system, and owner-to-application paths.';
  }
  if (/\bvendor|contract|supplier|renewal\b/.test(q)) {
    return 'For vendor and contract questions, connect suppliers to supported applications, capabilities, spend, renewal risk, owners, and operational dependency.';
  }
  if (/\bcybersecurity|cyber|security\b/.test(q) && /\bwho|lead|leader|budget|spend|cost\b/.test(q)) {
    return 'For cybersecurity leadership and budget, connect the CISO/security owner role to risk and control coverage, then separate loaded security-budget support from any missing named-person or portfolio-budget field.';
  }
  if (/\bbudget|spend|cost|finance|financial\b/.test(q)) {
    return 'For budget questions, connect spend to portfolios, owners, applications, vendors, and run/change funding where those fields are loaded.';
  }
  if (/\bai|automation|initiative|value evidence|benefit|roi\b/.test(q)) {
    return 'For AI and automation initiatives, separate the loaded footprint from value evidence, governance gates, adoption signals, and scale-readiness gaps.';
  }
  if (/\banalytics platform|analytics platforms|analytics tool|analytics tools|tools\b/.test(q)) {
    return 'For analytics platforms and tools, separate named platforms from data products, BI/warehouse capabilities, ownership, consumers, and maturity signals.';
  }
  if (/\bgap|missing|incomplete|coverage\b/.test(q)) {
    return 'For gap questions, name the exact source areas or fields to add next, not a generic “more data” request.';
  }
  return '';
}

function externalTenantMention(dossier: UniversalDimensionDossier): string | null {
  const question = dossier.route.question.toLowerCase();
  const currentLabel = tenantLabel(dossier.tenantKey);
  const currentKey = dossier.tenantKey.toLowerCase();
  const currentClient = ALL_CLIENTS.find((client) => {
    const aliases = [client.id, client.name, client.shortName, ...(CLIENT_KEY_TO_DB_NAME[client.id] ?? [])]
      .map((alias) => alias.toLowerCase())
      .filter(Boolean);
    return aliases.includes(currentKey) || aliases.includes(currentLabel.toLowerCase());
  });
  const currentAliases = currentClient
    ? [currentClient.id, currentClient.name, currentClient.shortName, ...(CLIENT_KEY_TO_DB_NAME[currentClient.id] ?? [])]
        .map((alias) => alias.toLowerCase())
        .filter(Boolean)
    : [currentKey, currentLabel.toLowerCase()];

  for (const client of ALL_CLIENTS) {
    const label = canonicalClientDisplayName({ key: client.id }) ?? client.name;
    const aliases = [client.id, client.name, client.shortName, ...(CLIENT_KEY_TO_DB_NAME[client.id] ?? [])]
      .map((alias) => alias.toLowerCase())
      .filter(Boolean);
    const isCurrent = aliases.some((alias) => currentAliases.includes(alias));
    if (isCurrent) continue;
    if (aliases.some((alias) => question.includes(alias))) return label;
  }
  return null;
}

function tenantBoundaryLead(dossier: UniversalDimensionDossier): string {
  const requestedTenant = externalTenantMention(dossier);
  if (!requestedTenant) return '';
  const label = tenantLabel(dossier.tenantKey);
  return `This signed-in Home workspace is scoped to ${label}, so aVa cannot expose another tenant's details here. Within ${possessive(label)} loaded context, `;
}

function isGapQuestion(dossier: UniversalDimensionDossier): boolean {
  return /\b(gap|gaps|missing|not loaded|thin|incomplete|coverage)\b/i.test(dossier.route.question);
}

function composeGapAnswer(dossier: UniversalDimensionDossier): string {
  const label = tenantLabel(dossier.tenantKey);
  const loadedSections = dossier.sections.filter((section) => section.recordCount > 0);
  const primarySections = loadedSections.filter((section) => section.dimensionFamily === dossier.route.primaryDimension);
  const adjacentSections = loadedSections.filter((section) => section.dimensionFamily !== dossier.route.primaryDimension);
  const gapText = dossier.gaps.slice(0, 4).map((gap) => gap.label.toLowerCase().replace(/[.]+$/g, ''));
  const gapLabels = dossier.gaps.length > 0
    ? gapText.join('; ')
    : 'the loaded sources do not show a specific named-source gap for this question';
  const primaryPhrase =
    primarySections.length > 0
      ? `${primarySections.length} primary ${dimensionLabel(dossier.route.primaryDimension)} source section${primarySections.length === 1 ? '' : 's'}`
      : `the primary ${dimensionLabel(dossier.route.primaryDimension)} source context is thin`;
  const adjacentPhrase =
    adjacentSections.length > 0
      ? `${adjacentSections.length} adjacent source section${adjacentSections.length === 1 ? '' : 's'}`
      : 'few adjacent source sections';

  return `${tenantBoundaryLead(dossier)}${possessive(label)} biggest Home context gaps are precision gaps, not a blank slate. The loaded sources include ${primaryPhrase} and ${adjacentPhrase}, so aVa can describe the current-state shape and supporting relationships while keeping names, ownership joins, freshness, and control status inside source-supported boundaries. The specific gaps to close are ${gapLabels}. That means the next enrichment pass should target those source areas directly instead of asking the model to infer them.`;
}

function composeGenericKnowAnswer(dossier: UniversalDimensionDossier): string {
  const label = tenantLabel(dossier.tenantKey);
  const dimension = dimensionLabel(dossier.route.primaryDimension);
  const boundaryLead = tenantBoundaryLead(dossier);
  const handoff =
    dossier.answerBoundary.handoffTarget && dossier.answerBoundary.handoffTarget !== 'home'
      ? ` Home can ground the facts and boundaries, but the investment or prioritization call should move to ${dossier.answerBoundary.handoffTarget}.`
      : '';

  const focus = questionFocusPhrase(dossier);
  return `${boundaryLead}${possessive(label)} ${dimension} context supports a current-state answer from the loaded source context. ${focus ? `${focus} ` : ''}${topMetricPhrase(dossier)}. Operationally, the useful signal is how this dimension connects to adjacent dimensions: ${relationshipPhrase(dossier)} ${gapPhrase(dossier)}${handoff}`;
}

function composeOrganizationAnswer(dossier: UniversalDimensionDossier): string {
  const label = tenantLabel(dossier.tenantKey);
  const namedCount = Number(dossier.rollups.namedLeadershipCount ?? 0);
  const teamCount = Number(dossier.rollups.itTeamCount ?? 0);
  const functionCount = Number(dossier.rollups.businessFunctionCount ?? 0);
  const appOwnershipCount = Number(dossier.rollups.applicationOwnershipCount ?? 0);
  const technologyLeadership = asList(dossier.rollups.technologyLeadership);

  const lead =
    `${tenantBoundaryLead(dossier)}${possessive(label)} loaded context supports a portfolio-led view of IT and business organization. ` +
    `Technology accountability is visible across business functions, IT domains, application ownership, and executive/role-level leadership, which supports an operating-model synthesis before any caveats.`;

  const named =
    namedCount > 0 && technologyLeadership.some((entry) => entry.includes('('))
      ? ` Named technology and executive leaders are loaded where the evidence provides them, including ${technologyLeadership
          .filter((entry) => entry.includes('('))
          .slice(0, 8)
          .join(', ')}.`
      : ' Missing field: named individual leadership / person-name mapping. The answer should stay at role/domain level until client-approved people data is added.';

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
    isGapQuestion(dossier)
      ? composeGapAnswer(dossier)
      : dossier.route.primaryDimension === 'organization_leadership'
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
