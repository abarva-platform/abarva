#!/usr/bin/env node

/**
 * Remediates a tenant input package written in the "v3 governance envelope" shape into
 * the universal column contract.
 *
 * The envelope shape carries a generic record wrapper
 * (record_id / entity_id / business_name / context_item / dimension / evidence_id) plus
 * a handful of dimension-specific columns. It is readable, but it does not carry the
 * per-dimension business attributes the contract declares, so adapters keyed on the
 * contract find nothing. GATE-08 decided the contract is authoritative; this performs the
 * remediation that decision calls for.
 *
 * Two rules govern every value written here:
 *
 *   1. Additive. Contract columns are added; every original column is preserved. Nothing
 *      is dropped, so no information is lost and the change is reversible by deletion.
 *   2. Deterministic. A contract column is filled only by copying a named source column.
 *      Where no source column exists the cell is left empty and the field is emitted as
 *      an evidence request. Nothing is inferred, parsed out of prose, or generated.
 *
 * Output goes to the governed intake draft package, never to an active tenant root.
 * Promoting the result is a separate gated step.
 *
 * Usage:
 *   node scripts/data/remediate-v3-envelope-to-contract.mjs --tenant meridian-health
 *   node scripts/data/remediate-v3-envelope-to-contract.mjs --tenant meridian-health --out <dir>
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import Papa from 'papaparse';

const ROOT = process.cwd();
const REGISTRY = 'datasets/tenant-inputs/tenant-input-registry.json';
const TEMPLATE_DIR = 'datasets/tenant-inputs/templates/universal/standard-2026-07-v3';
const PACKAGE_ID = 'v2026-08-governed-intake';

/**
 * Contract column -> source column, per canonical dimension.
 *
 * An array means "first source column that carries a value wins". A contract column
 * absent from this table has no deterministic source in the envelope shape and is left
 * empty by design — see the evidence-request output.
 *
 * Every entry here is a same-meaning copy. Where a mapping required interpretation rather
 * than a rename, it was left out: an empty cell is honest, a guessed one is not.
 */
const MAPPINGS = {
  '00_enterprise_profile.csv': {
    entity_name: 'business_name',
    industry: 'industry',
    sub_industry: 'sub_industry',
    revenue_usd: 'revenue_usd',
    employee_count: 'employee_count',
    headquarters: 'headquarters',
    operating_regions: 'operating_regions',
    business_model: 'business_model',
    customer_segments: 'business_segments',
    mission: 'mission_statement',
    vision: 'vision_statement',
    strategic_priorities: 'strategic_priorities',
    leadership_team: 'leadership_roles',
    current_state_notes: 'summary',
    source_file: 'source_file',
    source_date: 'source_date',
    confidence: 'confidence',
  },
  '01_business_functions.csv': {
    function_name: 'business_name',
    executive_owner: 'owner_role',
    current_state_notes: 'operating_model',
    known_gaps: 'risk_or_gap',
    confidence: 'confidence',
  },
  '02_org_ownership.csv': {
    org_unit: 'business_name',
    leader_name_or_role: 'owner_role',
    owned_systems: 'systems',
    owned_data_domains: 'data_domain',
    known_gaps: 'risk_or_gap',
    confidence: 'confidence',
  },
  '03_workforce_roles.csv': {
    persona_or_role: 'business_name',
    pain_points: 'known_challenge',
    automation_opportunity: 'use_case',
    known_gaps: 'risk_or_gap',
    confidence: 'confidence',
  },
  '04_applications_systems.csv': {
    system_name: 'business_name',
    system_category: 'capability',
    lifecycle_state: 'lifecycle_status',
    criticality: 'criticality',
    business_owner: 'owner',
    vendor: 'vendor_id',
    data_domains: 'data_dependencies',
    known_gaps: 'risk_or_gap',
    confidence: 'confidence',
  },
  '05_data_assets_integrations.csv': {
    data_asset_name: 'business_name',
    data_domain: 'data_domain',
    source_system: 'systems',
    known_gaps: 'risk_or_gap',
    confidence: 'confidence',
  },
  '06_infrastructure_platforms.csv': {
    platform_name: 'business_name',
    platform_type: 'capability',
    operational_owner: 'owner',
    criticality: 'criticality',
    lifecycle_state: 'lifecycle_status',
    confidence: 'confidence',
  },
  '07_vendors_contracts.csv': {
    vendor_name: 'business_name',
    service_category: ['vendor_category', 'service'],
    business_owner: 'owning_function',
    annual_spend_usd: 'annual_contract_value_usd',
    commercial_model: 'pricing_basis',
    supported_systems: 'linked_systems',
    risk_rating: 'contract_risk',
    known_gaps: 'risk_or_gap',
    confidence: 'confidence',
  },
  '08_spend_value.csv': {
    spend_category: 'financial_fact_type',
    annual_spend_usd: ['amount_usd', 'budget_amount_usd', 'approved_budget_usd'],
    value_driver: 'value_hypothesis',
    calculation_basis: 'amount_basis',
    known_gaps: 'risk_or_gap',
    confidence: 'confidence',
  },
  '09_programs_initiatives.csv': {
    program_name: 'business_name',
    business_sponsor: 'executive_owner',
    objective: 'value_hypothesis',
    status: 'initiative_status',
    risks: 'risk_or_gap',
    budget_usd: 'approved_funding_usd',
    expected_value_usd: ['planned_value_usd', 'target_value_usd'],
    known_gaps: 'caveat',
    confidence: 'confidence',
  },
  '10_ai_automation_use_cases.csv': {
    use_case_name: ['business_name', 'use_case'],
    process_area: 'affected_process',
    ai_pattern: 'ai_spend_type',
    current_status: 'use_case_status',
    value_hypothesis: 'value_hypothesis',
    required_data: 'required_data_domains',
    required_systems: 'systems',
    risk_controls: 'risk_control_status',
    known_gaps: 'risk_or_gap',
    confidence: 'confidence',
  },
  '11_risks_controls.csv': {
    risk_or_control_name: 'business_name',
    systems_impacted: 'affected_systems',
    evidence_required: 'evidence_needed',
    known_gaps: 'risk_or_gap',
    confidence: 'confidence',
  },
  // 12_relationships.csv already conforms and is passed through untouched.
  '13_evidence_sources.csv': {
    source_file: 'evidence_location',
    source_owner: 'evidence_owner',
    confidentiality: 'evidence_boundary',
    domains_covered: 'data_domain',
    quality_notes: 'caveat',
    known_gaps: 'risk_or_gap',
  },
  '14_metrics_outcomes.csv': {
    metric_name: 'business_name',
    baseline_value: 'baseline_value',
    target_value: 'target_value',
    owner: 'measurement_owner',
    data_source: 'source_system',
    calculation_basis: 'amount_basis',
    known_gaps: 'risk_or_gap',
    confidence: 'confidence',
  },
  '15_industry_context_patterns.csv': {
    pattern_name: 'business_name',
    industry: 'industry',
    business_context: 'industry_context',
    applicability: 'module_next_actions',
    evidence_basis: 'signals',
    confidence: 'confidence',
  },
  '16_expert_lenses.csv': {
    lens_name: 'business_name',
    required_inputs: 'signals',
    decision_use: 'module_next_actions',
    confidence: 'confidence',
  },
  '17_service_scope_managed_services.csv': {
    service_tower: 'service_tower',
    service_name: ['service', 'business_name'],
    in_scope_functions: 'owning_function',
    in_scope_systems: 'linked_systems',
    current_provider: 'vendor_name',
    run_cost_usd: ['run_spend_usd', 'annual_contract_value_usd'],
    known_gaps: 'risk_or_gap',
    confidence: 'confidence',
  },
  '18_operational_process_evidence.csv': {
    process_name: 'business_name',
    systems_used: 'systems',
    pain_points: 'risk_or_gap',
    automation_candidate: 'use_case',
    confidence: 'confidence',
  },
};

// --------------------------------------------------------------------------------------

function parseArgs(argv) {
  const args = { tenant: '', out: '' };
  for (let index = 2; index < argv.length; index += 1) {
    if (argv[index] === '--tenant') {
      args.tenant = argv[index + 1];
      index += 1;
    } else if (argv[index] === '--out') {
      args.out = argv[index + 1];
      index += 1;
    } else if (argv[index] === '--help') {
      console.log('Usage: node scripts/data/remediate-v3-envelope-to-contract.mjs --tenant <key> [--out <dir>]');
      process.exit(0);
    }
  }
  if (!args.tenant) {
    console.error('--tenant is required. Tenancy is declared, never inferred.');
    process.exit(1);
  }
  return args;
}

const abs = (relative) => path.join(ROOT, relative);
const numericPrefix = (file) => /^(\d{2})_/.exec(path.basename(file))?.[1] ?? '';

function activeRootFor(tenant) {
  const registry = JSON.parse(fs.readFileSync(abs(REGISTRY), 'utf8'));
  const entry = (registry.activeTenants ?? []).find((candidate) => candidate.tenantKey === tenant);
  if (!entry) {
    throw new Error(`Tenant "${tenant}" is not in ${REGISTRY}. Identity is declared, never inferred.`);
  }
  return entry.canonicalInputRoot;
}

function firstValue(row, source) {
  const candidates = Array.isArray(source) ? source : [source];
  for (const column of candidates) {
    const value = row[column];
    if (value !== undefined && String(value).trim() !== '') return String(value);
  }
  return '';
}

function main() {
  const args = parseArgs(process.argv);
  const activeRoot = activeRootFor(args.tenant);
  const manifest = JSON.parse(fs.readFileSync(abs(`${TEMPLATE_DIR}/template-manifest.json`), 'utf8'));

  const outDir = args.out || `datasets/tenant-inputs/${args.tenant}/${PACKAGE_ID}/canonical-dimensions`;
  fs.mkdirSync(abs(outDir), { recursive: true });

  const sourceFiles = fs.readdirSync(abs(activeRoot)).filter((file) => file.endsWith('.csv'));
  const summary = [];
  const evidenceRequests = [];

  for (const template of manifest.templates) {
    const prefix = numericPrefix(template.file);
    const sourceName =
      sourceFiles.find((file) => file === template.file) ??
      sourceFiles.find((file) => numericPrefix(file) === prefix);
    if (!sourceName) continue;

    const parsed = Papa.parse(fs.readFileSync(abs(`${activeRoot}/${sourceName}`), 'utf8').trim(), {
      header: true,
      skipEmptyLines: true,
    });
    const rows = parsed.data;
    const sourceColumns = parsed.meta.fields ?? [];
    const mapping = MAPPINGS[template.file] ?? {};

    // Contract columns first, then every original column that is not already a contract
    // column. Additive: nothing from the source is dropped.
    const outputColumns = [
      ...template.columns,
      ...sourceColumns.filter((column) => !template.columns.includes(column)),
    ];

    const outputRows = rows.map((row) => {
      const out = {};
      for (const column of outputColumns) {
        if (template.columns.includes(column)) {
          // Already present in the source under the same name: carry it straight through.
          if (sourceColumns.includes(column)) {
            out[column] = row[column] ?? '';
            continue;
          }
          out[column] = mapping[column] ? firstValue(row, mapping[column]) : '';
          continue;
        }
        out[column] = row[column] ?? '';
      }
      return out;
    });

    // What did we actually achieve, per contract column?
    const populated = [];
    const empty = [];
    for (const column of template.columns) {
      const hasValue = outputRows.some((row) => String(row[column] ?? '').trim() !== '');
      (hasValue ? populated : empty).push(column);
    }

    for (const column of empty) {
      evidenceRequests.push({
        tenantKey: args.tenant,
        dimension: template.file,
        contractColumn: column,
        state: mapping[column] ? 'mapped-but-source-empty' : 'no-deterministic-source',
        mappedFrom: mapping[column] ? [mapping[column]].flat().join(' | ') : '',
        action:
          'Provide a source extract carrying this attribute, or accept the dimension without it. Not to be inferred or generated.',
      });
    }

    const csv = Papa.unparse({ fields: outputColumns, data: outputRows });
    fs.writeFileSync(abs(`${outDir}/${template.file}`), `${csv}\n`);

    summary.push({
      contractFile: template.file,
      sourceFile: sourceName,
      rows: outputRows.length,
      contractColumns: template.columns.length,
      populated: populated.length,
      empty: empty.length,
      preservedOriginalColumns: outputColumns.length - template.columns.length,
      sha256: crypto.createHash('sha256').update(fs.readFileSync(abs(`${outDir}/${template.file}`))).digest('hex'),
    });
  }

  const totalContract = summary.reduce((sum, row) => sum + row.contractColumns, 0);
  const totalPopulated = summary.reduce((sum, row) => sum + row.populated, 0);

  fs.writeFileSync(
    abs(`${outDir}/../remediation-summary.json`),
    `${JSON.stringify(
      {
        tenantKey: args.tenant,
        generatedBy: 'scripts/data/remediate-v3-envelope-to-contract.mjs',
        sourceRoot: activeRoot,
        outputRoot: outDir,
        status: 'draft_not_active_no_registry_no_load_no_product_use',
        rules: [
          'additive: every original column preserved',
          'deterministic: contract columns filled only by copying a named source column',
          'no inference, no parsing of prose, no generated values',
        ],
        contractColumnsTotal: totalContract,
        contractColumnsPopulated: totalPopulated,
        fillRate: `${Math.round((100 * totalPopulated) / Math.max(1, totalContract))}%`,
        dimensions: summary,
        evidenceRequestCount: evidenceRequests.length,
      },
      null,
      2,
    )}\n`,
  );

  const header = ['tenantKey', 'dimension', 'contractColumn', 'state', 'mappedFrom', 'action'];
  const csvEscape = (value) => (/[",\n]/.test(String(value)) ? `"${String(value).replace(/"/g, '""')}"` : String(value));
  fs.writeFileSync(
    abs(`${outDir}/../evidence-requests-from-remediation.csv`),
    `${[header.join(','), ...evidenceRequests.map((row) => header.map((key) => csvEscape(row[key])).join(','))].join('\n')}\n`,
  );

  console.log(`remediated ${summary.length} dimension(s) for ${args.tenant}`);
  console.log(`  contract columns populated: ${totalPopulated}/${totalContract} (${Math.round((100 * totalPopulated) / Math.max(1, totalContract))}%)`);
  console.log(`  evidence requests opened:   ${evidenceRequests.length}`);
  console.log(`  output: ${outDir}`);
}

main();
