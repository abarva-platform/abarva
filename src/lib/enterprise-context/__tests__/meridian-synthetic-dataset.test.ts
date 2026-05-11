import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import ExcelJS from 'exceljs';
import Papa from 'papaparse';

type CsvRow = Record<string, string>;

const root = path.join(process.cwd(), 'docs/enterprise-context/synthetic/meridian');

function readCsv(fileName: string): CsvRow[] {
  const parsed = Papa.parse<CsvRow>(readFileSync(path.join(root, fileName), 'utf8'), {
    header: true,
    skipEmptyLines: true,
  });
  if (parsed.errors.length) {
    throw new Error(parsed.errors.map((error) => error.message).join('; '));
  }
  return parsed.data;
}

describe('Meridian synthetic enterprise context dataset', () => {
  it('meets the requested row-count ranges and marks the data fictional/non-PHI', () => {
    const manifest = JSON.parse(readFileSync(path.join(root, 'manifest.json'), 'utf8')) as {
      tenantKey: string;
      fictional: boolean;
      noPhi: boolean;
      totalRows: number;
      validation: { unresolvedReferences: number };
      datasets: Array<{ key: string; csv: string; xlsx: string; rows: number }>;
    };

    expect(manifest.tenantKey).toBe('meridian');
    expect(manifest.fictional).toBe(true);
    expect(manifest.noPhi).toBe(true);
    expect(manifest.validation.unresolvedReferences).toBe(0);
    expect(manifest.totalRows).toBe(1030);

    const counts = Object.fromEntries(manifest.datasets.map((dataset) => [dataset.key, dataset.rows]));
    expect(counts.cmdb_applications_services).toBeGreaterThanOrEqual(50);
    expect(counts.cmdb_applications_services).toBeLessThanOrEqual(100);
    expect(counts.ci_relationships_dependencies).toBeGreaterThanOrEqual(150);
    expect(counts.ci_relationships_dependencies).toBeLessThanOrEqual(300);
    expect(counts.vendors_contract_inventory).toBeGreaterThanOrEqual(20);
    expect(counts.vendors_contract_inventory).toBeLessThanOrEqual(40);
    expect(counts.renewal_calendar).toBeGreaterThanOrEqual(12);
    expect(counts.renewal_calendar).toBeLessThanOrEqual(24);
    expect(counts.spend_baseline).toBeGreaterThanOrEqual(12);
    expect(counts.incidents).toBeGreaterThanOrEqual(100);
    expect(counts.incidents).toBeLessThanOrEqual(300);
    expect(counts.problems).toBeGreaterThanOrEqual(20);
    expect(counts.problems).toBeLessThanOrEqual(50);
    expect(counts.changes).toBeGreaterThanOrEqual(50);
    expect(counts.changes).toBeLessThanOrEqual(150);
    expect(counts.initiative_portfolio).toBeGreaterThanOrEqual(20);
    expect(counts.initiative_portfolio).toBeLessThanOrEqual(40);
    expect(counts.policies_procedures).toBeGreaterThanOrEqual(20);
    expect(counts.policies_procedures).toBeLessThanOrEqual(40);
    expect(counts.data_domains_stewardship).toBeGreaterThanOrEqual(20);
    expect(counts.data_domains_stewardship).toBeLessThanOrEqual(40);
    expect(counts.risk_compliance_register).toBeGreaterThanOrEqual(20);
    expect(counts.risk_compliance_register).toBeLessThanOrEqual(40);

    for (const dataset of manifest.datasets) {
      expect(existsSync(path.join(root, dataset.csv))).toBe(true);
      expect(existsSync(path.join(root, dataset.xlsx))).toBe(true);
      expect(readCsv(dataset.csv)).toHaveLength(dataset.rows);
    }
  });

  it('resolves cross-template references across CMDB, vendors, contracts, policies, and initiatives', () => {
    const systems = new Set(readCsv('03-cmdb-applications-services.csv').map((row) => row.ci_id));
    const contracts = new Set(readCsv('05-vendors-contract-inventory.csv').map((row) => row.contract_id));
    const vendors = new Set(readCsv('05-vendors-contract-inventory.csv').map((row) => row.vendor_id));
    const policies = new Set(readCsv('08-policies-procedures.csv').map((row) => row.policy_id));

    for (const relationship of readCsv('04-ci-relationships-dependencies.csv')) {
      expect(systems.has(relationship.from_ci_id)).toBe(true);
      expect(systems.has(relationship.to_ci_id)).toBe(true);
    }

    for (const renewal of readCsv('06-renewal-calendar.csv')) {
      expect(vendors.has(renewal.vendor_id)).toBe(true);
      expect(contracts.has(renewal.contract_id)).toBe(true);
    }

    for (const incident of readCsv('09-incidents.csv')) {
      expect(systems.has(incident.ci_id)).toBe(true);
    }
    for (const problem of readCsv('10-problems.csv')) {
      expect(systems.has(problem.ci_id)).toBe(true);
    }
    for (const change of readCsv('11-changes.csv')) {
      expect(systems.has(change.ci_id)).toBe(true);
    }

    for (const initiative of readCsv('13-initiative-portfolio.csv')) {
      for (const ciId of initiative.dependent_ci_ids.split('|')) {
        expect(systems.has(ciId)).toBe(true);
      }
      for (const contractId of initiative.dependent_contract_ids.split('|')) {
        expect(contracts.has(contractId)).toBe(true);
      }
      for (const policyId of initiative.policy_constraints.split('|')) {
        expect(policies.has(policyId)).toBe(true);
      }
    }
  });

  it('contains no obvious patient identifiers and opens a populated workbook', async () => {
    const combinedCsv = [
      '09-incidents.csv',
      '10-problems.csv',
      '11-changes.csv',
      '14-data-domains-stewardship.csv',
    ].map((file) => readFileSync(path.join(root, file), 'utf8')).join('\n');

    expect(combinedCsv).not.toMatch(/\bMRN\b/i);
    expect(combinedCsv).not.toMatch(/\bSSN\b/i);
    expect(combinedCsv).not.toMatch(/\bDOB\b/i);
    expect(combinedCsv).not.toMatch(/\b\d{3}-\d{2}-\d{4}\b/);

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(path.join(root, '03-cmdb-applications-services.xlsx'));
    const dataSheet = workbook.getWorksheet('Data');
    expect(dataSheet).toBeTruthy();
    expect(dataSheet!.rowCount).toBeGreaterThan(80);
  });
});
