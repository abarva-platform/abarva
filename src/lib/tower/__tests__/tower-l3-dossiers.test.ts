import {
  buildTowerL3Dossiers,
  toTowerL3DossierWriteRows,
  type TowerL3Input,
  type TowerSourceRow,
} from '@/lib/tower/tower-l3-dossiers';

function row(sourceFile: string, rowNumber: number, values: Record<string, string>): TowerSourceRow {
  return { sourceFile, rowNumber, values };
}

function input(overrides: Partial<TowerL3Input> = {}): TowerL3Input {
  return {
    clientId: '00000000-0000-0000-0000-000000000001',
    tenantKey: 'lakeshore-holdings',
    dossierVersion: 'test-version',
    stage2Status: 'unavailable',
    forbiddenIdentifiers: ['Morgan Street', 'HAVI', 'Chicago'],
    portfolioCompanies: [
      row('portfolio_company_profile.csv', 2, {
        portfolio_company: 'Lakeshore Logistics',
        industry: 'Supply chain',
        revenue_usd: '3100000000',
        employees: '7500',
      }),
    ],
    budgetRows: [
      row('F12_it_budget_financials.csv', 2, {
        portfolio_company: 'Lakeshore Logistics',
        total_it_budget_usd: '62000000',
        opex_amount_usd: '52310000',
        capex_amount_usd: '9690000',
        run_amount_usd: '42935000',
        change_amount_usd: '19065000',
      }),
    ],
    vendorRows: [
      row('F11_vendors_contracts_licenses.csv', 2, {
        portfolio_company: 'Lakeshore Logistics',
        vendor: 'SAP',
        annual_spend_usd: '8200000',
      }),
    ],
    applicationRows: [
      row('F05_applications_systems.csv', 2, {
        portfolio_company: 'Lakeshore Logistics',
        application_id: 'APP-0001',
        application_name: 'SAP finance platform',
        business_capability: 'ERP',
        vendor: 'SAP',
      }),
    ],
    contractSystemRows: [
      row('F22_contract_system_service_map.csv', 2, {
        portfolio_company: 'Lakeshore Logistics',
        contract_id: 'CON-0001',
        vendor: 'SAP',
        application_id: 'APP-0001',
        application_name: 'SAP finance platform',
        support_type: 'supports',
        confidence: 'medium',
      }),
    ],
    initiativeRows: [
      row('T01_initiative_registry.csv', 2, {
        portfolio_company: 'Lakeshore Logistics',
        initiative_id: 'INIT-001',
        initiative_name: 'Treasury cash visibility standardization',
        business_function: 'treasury',
        owner: 'Treasurer',
      }),
    ],
    benefitRows: [
      row('T07_benefit_realization.csv', 2, {
        portfolio_company: 'Lakeshore Logistics',
        initiative_id: 'INIT-001',
        committed_value_usd: '6500000',
        realized_value_usd: '780000',
      }),
    ],
    spendRows: [
      row('T08_spend_contracts.csv', 2, {
        portfolio_company: 'Lakeshore Logistics',
        initiative_id: 'INIT-001',
        spend_amount_usd: '1800000',
      }),
    ],
    toolUsageRows: [
      row('T03_tool_usage_monthly.csv', 2, {
        portfolio_company: 'Lakeshore Logistics',
        eligible_users: '100',
        active_users: '45',
      }),
    ],
    riskRows: [
      row('T09_risk_governance.csv', 2, {
        portfolio_company: 'Lakeshore Logistics',
        risk_id: 'R-001',
        severity: 'high',
      }),
    ],
    ...overrides,
  };
}

describe('Tower L3 dossiers', () => {
  it('builds the Lakeshore L1 value-realization sample with governed metrics and branches', () => {
    const dossiers = buildTowerL3Dossiers(input());
    const sample = dossiers.find((d) => d.scopeKey === 'l1-consolidated' && d.viewKey === 'value_realization');
    expect(sample).toBeDefined();
    expect(sample?.metrics.map((m) => m.metricKey)).toEqual([
      'committed_value',
      'realized_value',
      'value_gap',
    ]);
    expect(sample?.metrics.every((m) => m.amountType !== 'unknown')).toBe(true);
    expect(sample?.branchOptions.length).toBeGreaterThan(0);
    expect(sample?.derivedInsights[0]?.supportingRefs.length).toBeGreaterThan(0);
    expect(sample?.coverage.verdict).toBe('SKELETON_COMPLETE');
    expect(sample?.validation.pass).toBe(true);
  });

  it('scrubs forbidden Gate B identifiers from business-facing text', () => {
    const dossiers = buildTowerL3Dossiers(input({
      portfolioCompanies: [
        row('portfolio_company_profile.csv', 2, {
          portfolio_company: 'Morgan Street',
          industry: 'Supply chain',
          revenue_usd: '1',
          employees: '1',
        }),
      ],
    }));
    expect(dossiers.every((d) => d.validation.pass)).toBe(true);
    expect(JSON.stringify(dossiers)).not.toMatch(/Morgan Street/);
  });

  it('labels each tenant from its canonical tenant key instead of hardcoding Lakeshore', () => {
    const dossiers = buildTowerL3Dossiers(input({ tenantKey: 'skyharbor-air' }));
    const sample = dossiers.find((d) => d.scopeKey === 'l1-consolidated' && d.viewKey === 'spend');
    expect(sample?.businessLabels.tenant).toBe('SkyHarbor Air');
    expect(sample?.businessBody.labels.tenant).toBe('SkyHarbor Air');
    expect(JSON.stringify(sample?.businessBody)).not.toMatch(/Lakeshore Holdings/);
  });

  it('marks thin scopes with explicit named gaps instead of confident empty claims', () => {
    const dossiers = buildTowerL3Dossiers(input({ benefitRows: [] }));
    const value = dossiers.find((d) => d.scopeKey === 'l1-consolidated' && d.viewKey === 'value_realization');
    expect(value?.coverage.verdict).toBe('EMPTY');
    expect(value?.gaps).toEqual(expect.arrayContaining([
      'committed value not loaded for L1 consolidated portfolio',
      'realized value not loaded for L1 consolidated portfolio',
    ]));
    expect(value?.validation.pass).toBe(true);
  });

  it('names expected structural gaps for spend and keeps prompt/render surface clean', () => {
    const dossiers = buildTowerL3Dossiers(input());
    const spend = dossiers.find((d) => d.scopeKey === 'l1-consolidated' && d.viewKey === 'spend');
    expect(spend?.gaps).toEqual(expect.arrayContaining([
      'OpEx/CapEx split not loaded at program and vendor line-item level',
      'vendor utilization not loaded at spend-line level',
    ]));
    expect(JSON.stringify(spend?.businessBody)).not.toMatch(/csv:|row-[0-9]|metric_[0-9a-f]|\.json|\.csv/);
    expect(spend?.validation.pass).toBe(true);
  });

  it('does not issue enriched verdicts without grounded Stage 2 insights', () => {
    const dossiers = buildTowerL3Dossiers(input());
    expect(dossiers.every((d) => !['DEEP', 'PARTIAL', 'THIN'].includes(d.coverage.verdict))).toBe(true);
  });

  it('maps dossiers into the versioned L3 store write contract', () => {
    const dossiers = buildTowerL3Dossiers(input());
    const rows = toTowerL3DossierWriteRows({
      clientId: '00000000-0000-0000-0000-000000000001',
      dossiers,
      sourceSet: ['lakeshore-reference-pack'],
    });
    const sample = rows.find((r) => r.scope_key === 'l1-consolidated' && r.view_key === 'value_realization');
    expect(sample).toMatchObject({
      tenant_key: 'lakeshore-holdings',
      scope_type: 'l1_consolidated',
      prompt_version: 'tower-l3-dossier-v2',
      stage1_status: 'built',
      stage2_status: 'unavailable',
      verdict: 'SKELETON_COMPLETE',
    });
    expect(sample?.dossier.metrics.length).toBeGreaterThan(0);
    expect(sample?.validation_result.pass).toBe(true);
  });
});
