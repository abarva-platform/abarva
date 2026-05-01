jest.mock('server-only', () => ({}));

import {
  formatTenantTechnologySource,
  isTenantTechnologyQuestion,
  selectTenantTechnologyRecords,
} from '@/lib/knowledge/tenant-technology-context';
import type { TenantRecord } from '@/lib/knowledge/tenant-data/types';

function systemRecord(
  recordId: string,
  title: string,
  payload: Record<string, unknown>,
): TenantRecord {
  return {
    tenantKey: 'apex-retail',
    segmentId: 'it_landscape',
    recordKind: 'systems_inventory',
    recordId,
    title,
    sourceBasis: 'tenant_admin_upload',
    classification: 'confidential',
    confidence: 0.91,
    payload,
  };
}

describe('tenant technology context', () => {
  it('detects current-state analytics technology questions', () => {
    expect(isTenantTechnologyQuestion('what do we have today for data analytics- what technologies?')).toBe(true);
    expect(isTenantTechnologyQuestion('which phase gate is blocked?')).toBe(false);
  });

  it('selects analytics stack records from it_landscape', () => {
    const records = [
      systemRecord('it_landscape:sys:apex:sap-s4', 'SAP S/4HANA', {
        vendor: 'SAP',
        category: 'ERP',
        domain: 'Finance + Inventory',
        business_criticality: 'Critical',
      }),
      systemRecord('it_landscape:sys:apex:snowflake', 'Snowflake Data Cloud', {
        system_id: 'sys:apex:snowflake',
        vendor: 'Snowflake',
        category: 'Data Warehouse',
        domain: 'Data',
        annual_cost_usd: 1320000,
        renewal_date: '2026-11-30',
        business_criticality: 'Critical',
        notes: 'Key foundation for CDP program',
      }),
      systemRecord('it_landscape:sys:apex:databricks', 'Databricks', {
        system_id: 'sys:apex:databricks',
        vendor: 'Databricks',
        category: 'Lakehouse / ML Platform',
        domain: 'Data',
        annual_cost_usd: 680000,
        notes: 'Used for data engineering and ML',
      }),
      systemRecord('it_landscape:sys:apex:tableau', 'Tableau', {
        system_id: 'sys:apex:tableau',
        vendor: 'Tableau',
        category: 'BI',
        domain: 'Analytics',
        annual_cost_usd: 420000,
      }),
      systemRecord('it_landscape:sys:apex:powerbi', 'Microsoft Power BI', {
        system_id: 'sys:apex:powerbi',
        vendor: 'Microsoft',
        category: 'BI',
        domain: 'Analytics',
        annual_cost_usd: 180000,
      }),
    ];

    const selected = selectTenantTechnologyRecords(
      records,
      'what technologies do we have today for data analytics?',
      4,
    );

    expect(selected.map((record) => record.title)).toEqual(
      expect.arrayContaining([
        'Snowflake Data Cloud',
        'Databricks',
        'Tableau',
        'Microsoft Power BI',
      ]),
    );
    expect(selected.map((record) => record.title)).not.toContain('SAP S/4HANA');
  });

  it('formats system ids and commercial metadata for citation-ready prompt context', () => {
    const source = formatTenantTechnologySource(
      systemRecord('it_landscape:sys:apex:snowflake', 'Snowflake Data Cloud', {
        system_id: 'sys:apex:snowflake',
        vendor: 'Snowflake',
        category: 'Data Warehouse',
        domain: 'Data',
        annual_cost_usd: 1320000,
        renewal_date: '2026-11-30',
        business_criticality: 'Critical',
        owner_id: 'person:apex:james-wright',
        business_owner: 'person:apex:lynne-stratham',
      }),
    );

    expect(source.type).toBe('TENANT');
    expect(source.id).toBe('sys:apex:snowflake');
    expect(source.detail).toContain('annual cost $1,320,000');
    expect(source.detail).toContain('business owner person:apex:lynne-stratham');
  });
});
