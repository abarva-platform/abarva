import fs from 'node:fs';
import path from 'node:path';

import { buildUniversalDimensionDossier, composeDossierAnswer, routeDimensionQuestion } from '../index';
import type { DossierRecord } from '../types';

function parseCsv(text: string): DossierRecord[] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];
    if (char === '"' && quoted && next === '"') {
      field += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === ',' && !quoted) {
      row.push(field);
      field = '';
    } else if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && next === '\n') index += 1;
      row.push(field);
      if (row.some(Boolean)) rows.push(row);
      row = [];
      field = '';
    } else {
      field += char;
    }
  }
  if (field || row.length) {
    row.push(field);
    if (row.some(Boolean)) rows.push(row);
  }

  const headers = rows[0] ?? [];
  return rows.slice(1).map((values) =>
    Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ''])),
  );
}

function loadCsv(relPath: string): DossierRecord[] {
  return parseCsv(fs.readFileSync(path.resolve(relPath), 'utf8'));
}

describe('universal dimension dossiers', () => {
  const skyQuestion = 'how is our IT and business organized today? who are our technology leaders under our CIO?';

  it('routes broad org questions to organization dossier with related source families', () => {
    const route = routeDimensionQuestion(skyQuestion, 'home');

    expect(route.primaryDimension).toBe('organization_leadership');
    expect(route.requiredSources.map((source) => source.sourceKey)).toEqual(
      expect.arrayContaining([
        'F02_business_org_functions',
        'F03_it_org_ownership',
        'F18_leadership_org_chart',
        'F19_team_application_ownership',
      ]),
    );
    expect(route.artifactPlan).toEqual(expect.arrayContaining(['table', 'chart', 'graph']));
  });

  it('uses loaded SkyHarbor leadership evidence before stating gaps', () => {
    const sources = {
      F18_leadership_org_chart: loadCsv('datasets/skyharbor-air-synthetic-v4/family-8-semantic-enrichment/F18_leadership-org-chart.csv'),
      F19_team_application_ownership: loadCsv('datasets/skyharbor-air-synthetic-v4/family-8-semantic-enrichment/F19_team-application-ownership.csv'),
      F02_business_org_functions: loadCsv('datasets/skyharbor-air-synthetic-v4/family-1-enterprise-operating-model/F02_business-org-functions.csv'),
      F03_it_org_ownership: loadCsv('datasets/skyharbor-air-synthetic-v4/family-1-enterprise-operating-model/F03_it-org-ownership.csv'),
      F05_applications_systems: loadCsv('datasets/skyharbor-air-synthetic-v4/family-2-technology-estate/F05_applications-systems.csv'),
      F12_it_budget_financials: loadCsv('datasets/skyharbor-air-synthetic-v4/family-4-financial-commercial/F12_it-budget-financials.csv'),
    };

    const dossier = buildUniversalDimensionDossier({
      tenantKey: 'skyharbor-air',
      question: skyQuestion,
      requestedSurface: 'home',
      sources,
    });
    const answer = composeDossierAnswer(dossier);

    expect(dossier.rollups.namedLeadershipCount).toBeGreaterThan(0);
    expect(dossier.composerPacket).toEqual(
      expect.objectContaining({
        question: skyQuestion,
        tenantKey: 'skyharbor-air',
        primaryDimension: 'organization_leadership',
        relatedDimensions: expect.arrayContaining(['application_systems', 'budget_financials', 'operations_process', 'risk_compliance']),
        sections: expect.any(Array),
        rollups: expect.any(Object),
        relationshipPaths: expect.any(Array),
        metrics: expect.any(Array),
        gaps: expect.any(Array),
        citations: expect.any(Array),
        artifactPlan: expect.arrayContaining(['table', 'chart', 'graph']),
        answerBoundary: expect.objectContaining({
          canAnswer: expect.any(Array),
          cannotAnswer: expect.any(Array),
        }),
      }),
    );
    expect(dossier.composerPacket.sections.some((section) => section.dimensionFamily === 'application_systems' && section.recordCount > 0)).toBe(true);
    expect(dossier.composerPacket.relationshipPaths.map((path) => path.pathKey)).toEqual(expect.arrayContaining(['team_application_ownership']));
    expect(answer.directAnswer).toContain('Amala Rao (CIO)');
    expect(answer.directAnswer).toContain('Evan Kline (CTO)');
    expect(answer.directAnswer).toContain('Owen Mercer (CISO)');
    expect(answer.directAnswer).toMatch(/portfolio-led view of IT and business organization/);
    expect(answer.directAnswer).not.toMatch(/cannot be characterized|cannot be identified|missing source support|\brows\b|home_know|debug/i);
    expect(answer.quality).toEqual({ passed: true, issues: [] });
  });

  it('answers role-level organization questions without pretending the whole org is unknown', () => {
    const dossier = buildUniversalDimensionDossier({
      tenantKey: 'lakeshore-industries',
      question: skyQuestion,
      requestedSurface: 'home',
      sources: {
        F02_business_org_functions: loadCsv('datasets/lakeshore-industries-synthetic-v4/family-1-enterprise-operating-model/F02_business-org-functions.csv'),
        F03_it_org_ownership: loadCsv('datasets/lakeshore-industries-synthetic-v4/family-1-enterprise-operating-model/F03_it-org-ownership.csv'),
        F05_applications_systems: loadCsv('datasets/lakeshore-industries-synthetic-v4/family-2-technology-estate/F05_applications-systems.csv'),
        F19_team_application_ownership: loadCsv('datasets/lakeshore-industries-synthetic-v4/family-8-semantic-enrichment/F19_team-application-ownership.csv'),
      },
    });
    const answer = composeDossierAnswer(dossier);

    expect(answer.directAnswer).toMatch(/portfolio-led view of IT and business organization/);
    expect(answer.directAnswer).toMatch(/role\/domain level/);
    expect(answer.directAnswer).not.toMatch(/cannot be characterized|cannot be identified|missing source support|\brows\b|home_know|debug/i);
    expect(answer.quality.passed).toBe(true);
  });

  it('answers gap questions as precision gaps, not no-data failures', () => {
    const dossier = buildUniversalDimensionDossier({
      tenantKey: 'lakeshore',
      question: "What are Lakeshore's biggest context gaps?",
      requestedSurface: 'home',
      sources: {
        F02_business_org_functions: loadCsv('datasets/lakeshore-industries-synthetic-v4/family-1-enterprise-operating-model/F02_business-org-functions.csv'),
        F03_it_org_ownership: loadCsv('datasets/lakeshore-industries-synthetic-v4/family-1-enterprise-operating-model/F03_it-org-ownership.csv'),
        F05_applications_systems: loadCsv('datasets/lakeshore-industries-synthetic-v4/family-2-technology-estate/F05_applications-systems.csv'),
        F19_team_application_ownership: loadCsv('datasets/lakeshore-industries-synthetic-v4/family-8-semantic-enrichment/F19_team-application-ownership.csv'),
      },
    });
    const answer = composeDossierAnswer(dossier);

    expect(answer.directAnswer).toMatch(/precision gaps, not a blank slate/i);
    expect(answer.directAnswer).toMatch(/inside the evidence boundary/i);
    expect(answer.directAnswer).not.toMatch(/Here is what is loaded|I do not see that in the loaded data|cannot be characterized/i);
    expect(answer.quality.passed).toBe(true);
  });

  it('explains tenant boundary when a question names another loaded client', () => {
    const dossier = buildUniversalDimensionDossier({
      tenantKey: 'lakeshore',
      question: "Show me SkyHarbor's vendor contracts.",
      requestedSurface: 'home',
      sources: {
        F11_vendors_contracts_licenses: loadCsv('datasets/lakeshore-industries-synthetic-v4/family-4-financial-commercial/F11_vendors-contracts-licenses.csv'),
        F05_applications_systems: loadCsv('datasets/lakeshore-industries-synthetic-v4/family-2-technology-estate/F05_applications-systems.csv'),
        F10_integrations_interfaces: loadCsv('datasets/lakeshore-industries-synthetic-v4/family-3-data-connectivity/F10_integrations-interfaces.csv'),
        F22_contract_system_service_map: loadCsv('datasets/lakeshore-industries-synthetic-v4/family-8-semantic-enrichment/F22_contract-system-service-map.csv'),
      },
    });
    const answer = composeDossierAnswer(dossier);

    expect(answer.directAnswer).toMatch(/scoped to Lakeshore Holdings/i);
    expect(answer.directAnswer).toMatch(/cannot expose SkyHarbor Air tenant details/i);
    expect(answer.directAnswer).toMatch(/Within Lakeshore Holdings' loaded context/i);
    expect(answer.quality.passed).toBe(true);
  });

  it('builds full relevant binder for application questions instead of fragment retrieval', () => {
    const dossier = buildUniversalDimensionDossier({
      tenantKey: 'skyharbor-air',
      question: 'Which applications support operations and what depends on them?',
      requestedSurface: 'home',
      sources: {
        F05_applications_systems: loadCsv('datasets/skyharbor-air-synthetic-v4/family-2-technology-estate/F05_applications-systems.csv'),
        F04_capabilities_value_streams: loadCsv('datasets/skyharbor-air-synthetic-v4/family-1-enterprise-operating-model/F04_capabilities-value-streams.csv'),
        F06_system_function_mapping: loadCsv('datasets/skyharbor-air-synthetic-v4/family-2-technology-estate/F06_system-function-mapping.csv'),
        F10_integrations_interfaces: loadCsv('datasets/skyharbor-air-synthetic-v4/family-3-data-connectivity/F10_integrations-interfaces.csv'),
        F11_vendors_contracts_licenses: loadCsv('datasets/skyharbor-air-synthetic-v4/family-4-financial-commercial/F11_vendors-contracts-licenses.csv'),
        F14_operations_service_management: loadCsv('datasets/skyharbor-air-synthetic-v4/family-5-execution-operations/F14_operations-service-management.csv'),
        F19_team_application_ownership: loadCsv('datasets/skyharbor-air-synthetic-v4/family-8-semantic-enrichment/F19_team-application-ownership.csv'),
        F20_capability_system_dependency: loadCsv('datasets/skyharbor-air-synthetic-v4/family-8-semantic-enrichment/F20_capability-system-dependency.csv'),
        F22_contract_system_service_map: loadCsv('datasets/skyharbor-air-synthetic-v4/family-8-semantic-enrichment/F22_contract-system-service-map.csv'),
        F23_operational_service_map: loadCsv('datasets/skyharbor-air-synthetic-v4/family-8-semantic-enrichment/F23_operational-service-map.csv'),
      },
    });

    expect(dossier.route.primaryDimension).toBe('application_systems');
    expect(dossier.composerPacket.sections.map((section) => section.sectionKey)).toEqual(
      expect.arrayContaining([
        'F05_applications_systems',
        'F04_capabilities_value_streams',
        'F06_system_function_mapping',
        'F10_integrations_interfaces',
        'F11_vendors_contracts_licenses',
        'F19_team_application_ownership',
        'F20_capability_system_dependency',
        'F22_contract_system_service_map',
        'F23_operational_service_map',
      ]),
    );
    expect(dossier.composerPacket.relationshipPaths.map((path) => path.pathKey)).toEqual(
      expect.arrayContaining(['team_application_ownership', 'capability_system_dependency', 'vendor_system_dependency', 'service_owner_system_path']),
    );
    expect(dossier.composerPacket.metrics.map((metric) => metric.metricKey)).toEqual(
      expect.arrayContaining(['application_count', 'vendor_contract_count', 'integration_count', 'operations_signal_count']),
    );
    expect(dossier.composerPacket.answerBoundary.canAnswer.length).toBeGreaterThan(0);
  });
});
