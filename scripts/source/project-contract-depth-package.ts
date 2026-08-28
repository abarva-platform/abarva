import fs from 'node:fs';
import path from 'node:path';

import { adaptContractDepthPackage } from '../../src/lib/source/contract-depth-package/adapter';
import { projectContractDepthPackage } from '../../src/lib/source/contract-depth-package/projection';

type CsvRecord = Record<string, string>;

const DEFAULT_PACKAGE_DIR = '/Users/anand/Downloads/meridian-source-contract-depth-package-20260828';

function argValue(name: string, fallback: string): string {
  const prefix = `--${name}=`;
  return process.argv.find((arg) => arg.startsWith(prefix))?.slice(prefix.length) ?? fallback;
}

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    const next = text[i + 1];
    if (quoted) {
      if (ch === '"' && next === '"') {
        cell += '"';
        i += 1;
      } else if (ch === '"') {
        quoted = false;
      } else {
        cell += ch;
      }
      continue;
    }
    if (ch === '"') {
      quoted = true;
    } else if (ch === ',') {
      row.push(cell);
      cell = '';
    } else if (ch === '\n') {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = '';
    } else if (ch !== '\r') {
      cell += ch;
    }
  }
  if (cell.length || row.length) {
    row.push(cell);
    rows.push(row);
  }
  return rows.filter((candidate) => candidate.some((value) => value.length > 0));
}

function readCsv(filePath: string): CsvRecord[] {
  const parsed = parseCsv(fs.readFileSync(filePath, 'utf8'));
  const headers = parsed[0] ?? [];
  return parsed.slice(1).map((values) => {
    const row: CsvRecord = {};
    headers.forEach((header, index) => {
      row[header] = values[index] ?? '';
    });
    return row;
  });
}

function writeJson(filePath: string, value: unknown): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function main(): void {
  const packageDir = argValue('package-dir', DEFAULT_PACKAGE_DIR);
  const outDir = argValue('out-dir', path.join(packageDir, 'qa', 'layer-projection-preview'));
  const adapterOutDir = argValue('adapter-out-dir', path.join(packageDir, 'qa', 'layer-2-adapter-preview'));
  const sourceDir = path.join(packageDir, 'source-files');

  const sourceFiles = {
    contracts: readCsv(path.join(sourceDir, 'contracts.csv')),
    applications: readCsv(path.join(sourceDir, 'cmdb_applications.csv')),
    applicationScope: readCsv(path.join(sourceDir, 'cmdb_application_scope.csv')),
    monthlySpend: readCsv(path.join(sourceDir, 'monthly_spend.csv')),
    saasUsage: readCsv(path.join(sourceDir, 'saas_usage.csv')),
    slaPerformance: readCsv(path.join(sourceDir, 'sla_performance.csv')),
    ticketVolumetrics: readCsv(path.join(sourceDir, 'ticket_volumetrics.csv')),
    contractClauses: readCsv(path.join(sourceDir, 'contract_clauses.csv')),
    evidenceManifest: readCsv(path.join(sourceDir, 'evidence_manifest.csv')),
    optimizationOpportunities: readCsv(path.join(sourceDir, 'optimization_opportunities.csv')),
  };

  const adapted = adaptContractDepthPackage(sourceFiles);
  writeJson(path.join(adapterOutDir, 'contract_register_adapter.json'), adapted.contractRegisterAdapter);
  writeJson(path.join(adapterOutDir, 'contract_clause_adapter.json'), adapted.contractClauseAdapter);
  writeJson(path.join(adapterOutDir, 'cmdb_application_adapter.json'), adapted.cmdbApplicationAdapter);
  writeJson(path.join(adapterOutDir, 'contract_scope_adapter.json'), adapted.contractScopeAdapter);
  writeJson(path.join(adapterOutDir, 'contract_consumption_adapter.json'), adapted.spendAdapter);
  writeJson(path.join(adapterOutDir, 'usage_entitlement_adapter.json'), adapted.usageAdapter);
  writeJson(path.join(adapterOutDir, 'ticket_volumetrics_adapter.json'), adapted.ticketVolumeAdapter);
  writeJson(path.join(adapterOutDir, 'contract_performance_adapter.json'), adapted.performanceAdapter);
  writeJson(path.join(adapterOutDir, 'optimization_opportunity_adapter.json'), adapted.optimizationAdapter);
  writeJson(path.join(adapterOutDir, 'evidence_document_adapter.json'), adapted.evidenceDocumentAdapter);
  writeJson(path.join(adapterOutDir, 'adapter-quality-gate.json'), adapted.qualityGate);

  const projection = projectContractDepthPackage(sourceFiles);

  writeJson(path.join(outDir, 'source.contract_360.json'), projection.contract360);
  writeJson(path.join(outDir, 'source.contract_vendor_360.json'), projection.contractVendor360);
  writeJson(path.join(outDir, 'source.vendor_contract_portfolio.json'), projection.vendorContractPortfolio);
  writeJson(path.join(outDir, 'source.contract_application_scope.json'), projection.contractApplicationScope);
  writeJson(path.join(outDir, 'source.contract_financial_exposure.json'), projection.contractFinancialExposure);
  writeJson(path.join(outDir, 'source.contract_operational_performance.json'), projection.contractOperationalPerformance);
  writeJson(path.join(outDir, 'source.contract_pdf_document_inventory.json'), projection.contractPdfDocumentInventory);
  writeJson(path.join(outDir, 'source.contract_pdf_clause_extractions.json'), projection.contractPdfClauseExtractions);
  writeJson(path.join(outDir, 'source.optimization_opportunity.json'), projection.optimizationOpportunities);
  writeJson(path.join(outDir, 'projection-quality-gate.json'), projection.qualityGate);

  console.log(
    JSON.stringify(
      {
        event: 'source_contract_depth_projection_preview',
        packageDir,
        adapterOutDir,
        outDir,
        adapterQualityGate: adapted.qualityGate,
        qualityGate: projection.qualityGate,
      },
      null,
      2,
    ),
  );

  if (adapted.qualityGate.status !== 'PASS' || projection.qualityGate.status !== 'PASS') {
    process.exitCode = 1;
  }
}

main();
