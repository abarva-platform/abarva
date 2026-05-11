import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import ExcelJS from 'exceljs';

import {
  ENTERPRISE_CONTEXT_COMMON_COLUMNS,
  ENTERPRISE_CONTEXT_TEMPLATE_TENANTS,
  ENTERPRISE_CONTEXT_TEMPLATE_WORKBOOKS,
  ENTERPRISE_CONTEXT_TEMPLATE_VERSION,
} from '../template-schema';

const root = path.join(process.cwd(), 'docs/enterprise-context/templates');

describe('enterprise context Day One templates', () => {
  it('defines the required 15 workbook families', () => {
    expect(ENTERPRISE_CONTEXT_TEMPLATE_WORKBOOKS.map((template) => template.key)).toEqual([
      'org_decision_rights',
      'facilities_business_units',
      'cmdb_applications_services',
      'ci_relationships_dependencies',
      'vendors_contract_inventory',
      'renewal_calendar',
      'spend_baseline',
      'policies_procedures',
      'incidents',
      'problems',
      'changes',
      'slas',
      'initiative_portfolio',
      'data_domains_stewardship',
      'risk_compliance_register',
    ]);
  });

  it('includes required provenance and stewardship columns in every template schema', () => {
    const commonKeys = ENTERPRISE_CONTEXT_COMMON_COLUMNS.map((column) => column.key);
    for (const template of ENTERPRISE_CONTEXT_TEMPLATE_WORKBOOKS) {
      const keys = template.columns.map((column) => column.key);
      for (const key of commonKeys) {
        expect(keys).toContain(key);
      }
    }
  });

  it('writes manifests and readable workbooks for all three clients', async () => {
    for (const tenant of ENTERPRISE_CONTEXT_TEMPLATE_TENANTS) {
      const manifestPath = path.join(root, tenant.tenantSlug, 'manifest.json');
      expect(existsSync(manifestPath)).toBe(true);

      const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as {
        tenantKey: string;
        version: string;
        workbookCount: number;
        workbooks: Array<{ path: string; columns: string[] }>;
      };
      expect(manifest.tenantKey).toBe(tenant.tenantKey);
      expect(manifest.version).toBe(ENTERPRISE_CONTEXT_TEMPLATE_VERSION);
      expect(manifest.workbookCount).toBe(15);
      expect(manifest.workbooks).toHaveLength(15);

      const sampleWorkbookPath = path.join(root, tenant.tenantSlug, manifest.workbooks[0].path);
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.readFile(sampleWorkbookPath);
      expect(workbook.getWorksheet('Instructions')).toBeTruthy();
      expect(workbook.getWorksheet('Data Dictionary')).toBeTruthy();

      const templateSheet = workbook.getWorksheet('Template');
      expect(templateSheet).toBeTruthy();
      const headerValues = templateSheet!.getRow(3).values as Array<string | undefined>;
      for (const column of manifest.workbooks[0].columns) {
        expect(headerValues).toContain(column);
      }
    }
  });
});
