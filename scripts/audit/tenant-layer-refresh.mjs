#!/usr/bin/env node

/**
 * Tenant Layer 1-4 refresh preparation.
 *
 * Classifies every tenant context artifact by architecture layer and truth eligibility,
 * derives conflicts mechanically rather than by assertion, prepares the Layer 1 governed
 * intake draft package, and records what cannot be done without an explicit human gate.
 *
 * Everything it writes is either a report or a draft package under
 * `datasets/tenant-inputs/<tenant>/v2026-08-governed-intake/`. It never writes an active
 * tenant root, the registry, the data plane, retrieval, or any runtime surface, and it
 * never reads one tenant's files to fill a gap in another.
 *
 * Usage:
 *   node scripts/audit/tenant-layer-refresh.mjs
 *   node scripts/audit/tenant-layer-refresh.mjs --tenant meridian-health --tenant skyharbor-air
 *   node scripts/audit/tenant-layer-refresh.mjs --out reports/<dir> --no-package
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import Papa from 'papaparse';

const ROOT = process.cwd();
const DEFAULT_TENANTS = ['meridian-health', 'skyharbor-air'];
const DEFAULT_OUT = 'reports/tenant-layer-refresh-2026-08-12';
const REGISTRY = 'datasets/tenant-inputs/tenant-input-registry.json';
const TEMPLATE_DIR = 'datasets/tenant-inputs/templates/universal/standard-2026-07-v3';
const LINEAGE_JSON = 'reports/tower-fact-lineage/lineage.json';
const PACKAGE_ID = 'v2026-08-governed-intake';

const NOT_ACTIVE =
  'draft_local_offline_only_not_active_truth_no_registry_no_load_no_retrieval_no_product_use';

// --------------------------------------------------------------------------------------
// args + io helpers
// --------------------------------------------------------------------------------------

function parseArgs(argv) {
  const args = { tenants: [], out: DEFAULT_OUT, writePackage: true };
  for (let index = 2; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === '--tenant') {
      args.tenants.push(argv[index + 1]);
      index += 1;
    } else if (value === '--out') {
      args.out = argv[index + 1];
      index += 1;
    } else if (value === '--no-package') {
      args.writePackage = false;
    } else if (value === '--help') {
      console.log(
        [
          'Usage:',
          '  node scripts/audit/tenant-layer-refresh.mjs [--tenant <key>]... [--out <dir>] [--no-package]',
        ].join('\n'),
      );
      process.exit(0);
    }
  }
  if (args.tenants.length === 0) args.tenants = [...DEFAULT_TENANTS];
  args.tenants = [...new Set(args.tenants.filter(Boolean))];
  return args;
}

const abs = (relativePath) => path.resolve(ROOT, relativePath);
const exists = (relativePath) => fs.existsSync(abs(relativePath));
const sha256 = (relativePath) =>
  crypto.createHash('sha256').update(fs.readFileSync(abs(relativePath))).digest('hex');

const csvCell = (value) => {
  const text = value === null || value === undefined ? '' : String(value);
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

function writeCsv(filePath, headers, rows) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const body = [
    headers.join(','),
    ...rows.map((row) => headers.map((header) => csvCell(row[header])).join(',')),
  ].join('\n');
  fs.writeFileSync(filePath, `${body}\n`);
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function writeText(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, value.endsWith('\n') ? value : `${value}\n`);
}

function walk(relativeDir) {
  const out = [];
  const stack = [relativeDir];
  while (stack.length) {
    const current = stack.pop();
    let entries;
    try {
      entries = fs.readdirSync(abs(current), { withFileTypes: true });
    } catch {
      continue;
    }
    for (const entry of entries) {
      const next = path.posix.join(current, entry.name);
      if (entry.isDirectory()) stack.push(next);
      else if (entry.isFile()) out.push(next);
    }
  }
  return out.sort();
}

/** Row/column shape of a CSV without loading assumptions about its schema. */
function csvShape(relativePath) {
  try {
    const text = fs.readFileSync(abs(relativePath), 'utf8');
    const parsed = Papa.parse(text.trim(), { header: true, skipEmptyLines: true });
    return {
      rows: parsed.data.length,
      columns: parsed.meta.fields ?? [],
      parseErrors: parsed.errors.length,
    };
  } catch {
    return { rows: 0, columns: [], parseErrors: -1 };
  }
}

const mappingProfileDomainAliases = {
  'evidence-registry-minimal/v1': ['evidence_sources'],
  'organization-business-functions/v1': ['business_functions'],
  'organization-ownership/v1': ['org_ownership'],
  'organization-workforce-roles/v1': ['workforce_roles'],
  'vendor-contracts/v1': ['vendors_contracts'],
  'spend-value/v1': ['spend_value'],
  'managed-services-scope/v1': ['service_scope_managed_services'],
  'metrics-outcomes/v1': ['metrics_outcomes'],
  'data-assets-integrations/v1': ['data_assets_integrations'],
  'infrastructure-platforms/v1': ['infrastructure_platforms'],
  'programs-initiatives/v1': ['programs_initiatives'],
  'ai-automation-use-cases/v1': ['ai_automation_use_cases'],
  'risks-controls/v1': ['risks_controls'],
  'relationships/v1': ['relationships'],
  'operational-process-evidence/v1': ['operational_process_evidence'],
  'enterprise-profile-v3/v1': ['enterprise_profile'],
  'applications-systems-v3/v1': ['applications_systems'],
  'evidence-sources-v3/v1': ['evidence_sources'],
  'industry-context-patterns/v1': ['industry_context_patterns'],
  'expert-lenses/v1': ['expert_lenses'],
};

const legacyCompatibilityMappingProfiles = new Set([
  'applications-systems-estate/v1',
  'enterprise-profile-foundation/v1',
  'enterprise-profile-minimal/v1',
  'evidence-registry-minimal/v1',
]);

function activeLayer2MappingProfiles(profiles) {
  return (profiles ?? []).filter((profile) => !legacyCompatibilityMappingProfiles.has(profile.mappingProfile));
}

const adapterFamilySourceClassCoverage = {
  'strategy-and-operating-model': ['enterprise_profile', 'industry_context_patterns'],
  'organization-and-workforce': ['organization_functions', 'relationships'],
  'application-cmdb-and-architecture': [
    'applications_systems',
    'infrastructure_platforms',
    'evidence_registry',
    'relationships',
  ],
  'vendor-clm-and-procurement': ['vendors_contracts', 'service_scope_managed_services', 'relationships'],
  'finance-ap-gl-and-fpa': ['spend_value', 'metrics_outcomes', 'vendors_contracts'],
  'data-catalog-integration-and-lineage': [
    'data_assets_integrations',
    'infrastructure_platforms',
    'ai_automation_use_cases',
    'relationships',
  ],
  'pmo-portfolio-and-benefits': [
    'programs_priorities',
    'ai_automation_use_cases',
    'metrics_outcomes',
    'risks_controls',
    'relationships',
  ],
  'grc-security-and-service-management': [
    'applications_systems',
    'risks_controls',
    'metrics_outcomes',
    'operational_process_evidence',
    'evidence_registry',
  ],
  'kpi-and-operational-telemetry': [
    'operational_process_evidence',
    'metrics_outcomes',
    'service_scope_managed_services',
    'organization_functions',
    'relationships',
  ],
  'interview-governance-and-evidence-requests': ['evidence_registry', 'expert_lenses', 'relationships'],
};

const domainFromContractFile = (file) => path.basename(file, '.csv').replace(/^\d{2}_/, '');
const explicitlyMappedDomains = new Set(Object.values(mappingProfileDomainAliases).flat());

function profileAppliesToDomain(profile, domain) {
  const explicitDomains = mappingProfileDomainAliases[profile.mappingProfile];
  if (explicitDomains) return explicitDomains.includes(domain);
  if (explicitlyMappedDomains.has(domain)) return false;
  return profile.sourceClass === domain;
}

function profilesForContractFile(contractFile, profiles) {
  const domain = domainFromContractFile(contractFile);
  return (profiles ?? []).filter((profile) => profileAppliesToDomain(profile, domain));
}

function profilesForWorkstream(workstream, profiles) {
  const family = workstream.sourceAdapterFamily ?? '';
  const supportedSourceClasses = adapterFamilySourceClassCoverage[family] ?? [];
  if (supportedSourceClasses.length > 0) {
    const matched = new Map();
    for (const target of workstream.canonicalTargets ?? []) {
      for (const profile of profilesForContractFile(target, profiles)) {
        if (supportedSourceClasses.includes(profile.sourceClass)) {
          matched.set(profile.mappingProfile, profile);
        }
      }
    }
    return [...matched.values()];
  }
  if (family) return [];

  const targets = workstream.canonicalTargets ?? [];
  const matched = new Map();
  for (const target of targets) {
    for (const profile of profilesForContractFile(target, profiles)) {
      matched.set(profile.mappingProfile, profile);
    }
  }
  return [...matched.values()];
}

// --------------------------------------------------------------------------------------
// layer model
// --------------------------------------------------------------------------------------

/**
 * Layer roots are declared by convention, then confirmed on disk. Nothing here infers
 * tenancy from a directory name — the active root always comes from the registry.
 */
function layerRootsFor(tenant, activeRoot) {
  return [
    {
      layer: 'Layer 1 — Client Intake',
      role: 'registry-declared active input package',
      relativePath: activeRoot,
      truthEligibility: 'active-declared-source-package',
      refreshLocally: 'no — active root is a hard gate',
      gate: 'active-root-replacement',
    },
    {
      layer: 'Layer 1 — Client Intake',
      role: 'adjacent standard pack (parallel copy of the same dimensions)',
      relativePath: `datasets/tenant-inputs/${tenant}/standard-2026-07-v3`,
      truthEligibility: 'duplicate-truth-candidate',
      refreshLocally: 'no — classify and reconcile first',
      gate: 'retirement-manifest',
    },
    {
      layer: 'Layer 1 — Client Intake',
      role: 'governed intake draft package',
      relativePath: `datasets/tenant-inputs/${tenant}/${PACKAGE_ID}`,
      truthEligibility: 'draft-not-active',
      refreshLocally: 'yes',
      gate: 'none for drafts; registry activation is gated',
    },
    {
      layer: 'Layer 1 — Client Intake',
      role: 'interview and questionnaire discovery channel',
      relativePath: `datasets/tenant-inputs/${tenant}/interviews`,
      truthEligibility: 'source-signal-not-deterministic-truth',
      refreshLocally: 'yes — as draft copies inside the governed package',
      gate: 'none for drafts',
    },
    {
      layer: 'Layer 1 — Client Intake',
      role: 'candidate pack',
      relativePath: `datasets/tenant-inputs/candidates/${tenant}`,
      truthEligibility: 'not-active',
      refreshLocally: 'no — classify only',
      gate: 'retirement-manifest',
    },
    {
      layer: 'Layer 2 — Source Adapters',
      role: 'generated adapter output',
      relativePath: `datasets/tenant-inputs/generated/${tenant}`,
      truthEligibility: 'disposable-build-output',
      refreshLocally: 'yes — dry-run only, no active write',
      gate: 'none for dry-run',
    },
    {
      layer: 'Layer 3 — Canonical Model',
      role: 'derived canonical context artifacts',
      relativePath: `datasets/tenant-inputs/${tenant}/derived`,
      truthEligibility: 'derived-output-rebuildable',
      refreshLocally: 'yes — as draft summaries only',
      gate: 'canonical-store-write',
    },
    {
      layer: 'Layer 4 — Products',
      role: 'approved narrative/product content',
      relativePath: `datasets/tenant-inputs/${tenant}/approved-content`,
      truthEligibility: 'product-projection',
      refreshLocally: 'no — readiness reporting only',
      gate: 'product-projection-refresh',
    },
  ];
}

function readRegistry() {
  const registry = JSON.parse(fs.readFileSync(abs(REGISTRY), 'utf8'));
  const activeByTenant = new Map();
  for (const tenant of registry.activeTenants ?? []) {
    activeByTenant.set(tenant.tenantKey, tenant.canonicalInputRoot);
  }
  return { registry, activeByTenant };
}

function readManifestContract() {
  const manifest = JSON.parse(fs.readFileSync(abs(`${TEMPLATE_DIR}/template-manifest.json`), 'utf8'));
  const workstreams = JSON.parse(
    fs.readFileSync(abs(`${TEMPLATE_DIR}/client-intake-workstreams.json`), 'utf8'),
  );
  const byFile = new Map(manifest.templates.map((template) => [template.file, template.columns]));
  return { manifest, workstreams, byFile };
}

/**
 * Reads the real Layer 2 mapping contract rather than a copy of it, so the gap register
 * cannot drift from what the adapter actually requires.
 */
async function readMappingProfiles() {
  try {
    const mappingModule = await import('../../src/lib/enterprise-data/source-adapters/mapping-profiles.ts');
    return mappingModule.BUILT_IN_MAPPING_PROFILES ?? [];
  } catch (error) {
    console.warn(`  warning: could not load mapping profiles (${error.message}); adapter gaps reported as unknown`);
    return null;
  }
}

async function buildLayer3ValidationScaffold(profiles) {
  if (!profiles) return null;
  try {
    const layer3Module = await import('../../src/lib/enterprise-data/contracts/layer3-validation.ts');
    return {
      ...layer3Module.buildLayer3ValidationScaffoldReport(activeLayer2MappingProfiles(profiles)),
      canonicalObjectDefinitions: layer3Module.CANONICAL_OBJECT_REGISTRY.length,
      factAuthorityDefinitions: layer3Module.FACT_AUTHORITY_REGISTRY.length,
      relationshipDictionaryEntries: layer3Module.RELATIONSHIP_TYPE_DICTIONARY.length,
      mode: 'scaffold-only-no-canonical-write-no-graph-materialization',
    };
  } catch (error) {
    console.warn(`  warning: could not load Layer 3 validation scaffold (${error.message})`);
    return null;
  }
}

function readLineage() {
  if (!exists(LINEAGE_JSON)) return [];
  try {
    return JSON.parse(fs.readFileSync(abs(LINEAGE_JSON), 'utf8'));
  } catch {
    return [];
  }
}

// --------------------------------------------------------------------------------------
// per-tenant analysis
// --------------------------------------------------------------------------------------

function analyseTenant(tenant, activeRoot, contract, lineage) {
  const roots = layerRootsFor(tenant, activeRoot).map((root) => {
    const present = exists(root.relativePath);
    const files = present ? walk(root.relativePath) : [];
    return { ...root, present, files };
  });

  // ---- canonical dimension coverage against the declared contract -------------------
  const activeFiles = roots.find((root) => root.truthEligibility === 'active-declared-source-package')?.files ?? [];
  const activeBasenames = new Set(activeFiles.map((file) => path.basename(file)));

  const contractFiles = [...contract.byFile.keys()];
  const contractPrefix = new Map(
    contractFiles.map((file) => [/^(\d{2})_/.exec(file)?.[1] ?? file, file]),
  );

  const dimensionRows = [];
  for (const contractFile of contractFiles) {
    const prefix = /^(\d{2})_/.exec(contractFile)?.[1] ?? '';
    const matchByName = activeBasenames.has(contractFile) ? contractFile : '';
    const matchByPrefix = [...activeBasenames].find(
      (name) => name.endsWith('.csv') && /^(\d{2})_/.exec(name)?.[1] === prefix,
    );
    const resolved = matchByName || matchByPrefix || '';
    const relative = resolved ? `${activeRoot}/${resolved}` : '';
    const shape = relative ? csvShape(relative) : { rows: 0, columns: [], parseErrors: 0 };
    const declared = contract.byFile.get(contractFile) ?? [];
    const missingColumns = declared.filter((column) => !shape.columns.includes(column));

    dimensionRows.push({
      contractFile,
      resolvedFile: resolved,
      nameMatchesContract: resolved === contractFile ? 'yes' : resolved ? 'no' : 'absent',
      dataRows: shape.rows,
      declaredColumns: declared.length,
      missingDeclaredColumns: missingColumns.length,
      missingColumnNames: missingColumns.join('; '),
      extraColumns: shape.columns.filter((column) => !declared.includes(column)).length,
    });
  }

  const unregisteredActiveFiles = activeFiles
    .map((file) => path.basename(file))
    .filter((name) => {
      if (!name.endsWith('.csv')) return true; // non-CSV inside a CSV intake root
      if (contract.byFile.has(name)) return false;
      const prefix = /^(\d{2})_/.exec(name)?.[1];
      if (prefix && contractPrefix.has(prefix)) return false; // renamed but contract-mapped
      return true;
    });

  // ---- duplicate truth candidates ---------------------------------------------------
  const byBasename = new Map();
  for (const root of roots) {
    for (const file of root.files) {
      const name = path.basename(file);
      if (!name.endsWith('.csv')) continue;
      if (!byBasename.has(name)) byBasename.set(name, []);
      byBasename.get(name).push({ file, root });
    }
  }

  const duplicates = [];
  for (const [name, entries] of byBasename) {
    if (entries.length < 2) continue;
    const detail = entries.map((entry) => {
      const shape = csvShape(entry.file);
      return {
        path: entry.file,
        rootRole: entry.root.role,
        layer: entry.root.layer,
        eligibility: entry.root.truthEligibility,
        sha256: sha256(entry.file),
        rows: shape.rows,
        columns: shape.columns.length,
      };
    });
    const hashes = new Set(detail.map((entry) => entry.sha256));
    duplicates.push({ name, detail, identical: hashes.size === 1 });
  }

  // ---- workstream coverage ----------------------------------------------------------
  const dimensionByContractFile = new Map(dimensionRows.map((row) => [row.contractFile, row]));
  const workstreamRows = contract.workstreams.clientFacingWorkstreams.map((workstream) => {
    const targets = workstream.canonicalTargets ?? [];
    const resolved = targets.map((target) => dimensionByContractFile.get(target)).filter(Boolean);
    const present = resolved.filter((row) => row.resolvedFile);
    const populated = present.filter((row) => row.dataRows > 0);
    const totalRows = present.reduce((sum, row) => sum + row.dataRows, 0);

    // Coverage is not just "a file exists with rows in it". A dimension whose columns do
    // not match the declared contract carries no usable evidence for the attributes the
    // adapters and products expect, so it counts as partial rather than covered.
    const schemaClean = populated.filter((row) => row.missingDeclaredColumns === 0);

    let coverage = 'missing';
    if (schemaClean.length === targets.length) coverage = 'covered';
    else if (populated.length > 0) coverage = 'partial';

    return {
      tenantKey: tenant,
      workstreamId: workstream.workstreamId,
      workstreamName: workstream.workstreamName,
      typicalOwners: (workstream.typicalOwners ?? []).join('; '),
      canonicalTargets: targets.join('; '),
      targetsPresentInActiveRoot: present.length,
      targetsPopulated: populated.length,
      targetsSchemaConformant: schemaClean.length,
      targetsDeclared: targets.length,
      dataRowsAcrossTargets: totalRows,
      coverageState: coverage,
      schemaConformance:
        schemaClean.length === present.length ? 'conformant' : `${present.length - schemaClean.length} target(s) off-contract`,
      missingTargets: resolved
        .filter((row) => !row.resolvedFile || row.dataRows === 0)
        .map((row) => row.contractFile)
        .join('; '),
      offContractTargets: resolved
        .filter((row) => row.resolvedFile && row.missingDeclaredColumns > 0)
        .map((row) => `${row.resolvedFile} (-${row.missingDeclaredColumns} cols)`)
        .join('; '),
      smeValidationFocus: workstream.smeValidationFocus ?? '',
      smeValidationStatus: 'not_reviewed',
      allowedUse: 'internal_audit_and_gap_analysis_only',
    };
  });

  // ---- fact lineage for this tenant --------------------------------------------------
  const lineageForTenant = lineage.filter((entry) => entry.tenant === tenant);

  return {
    tenant,
    activeRoot,
    roots,
    dimensionRows,
    unregisteredActiveFiles,
    duplicates,
    workstreamRows,
    lineageForTenant,
  };
}

// --------------------------------------------------------------------------------------
// derived matrices
// --------------------------------------------------------------------------------------

function layerMatrixRows(analysis) {
  const rows = [];
  for (const root of analysis.roots) {
    const csvFiles = root.files.filter((file) => file.endsWith('.csv'));
    const dataRows = csvFiles.reduce((sum, file) => sum + csvShape(file).rows, 0);
    rows.push({
      tenantKey: analysis.tenant,
      layer: root.layer,
      artifactGroup: root.role,
      path: root.relativePath,
      present: root.present ? 'yes' : 'no',
      fileCount: root.files.length,
      csvFileCount: csvFiles.length,
      dataRowCount: dataRows,
      truthEligibility: root.truthEligibility,
      refreshableLocally: root.refreshLocally,
      requiredGate: root.gate,
      smeValidationRequired:
        root.truthEligibility === 'active-declared-source-package' ||
        root.truthEligibility === 'draft-not-active' ||
        root.truthEligibility === 'source-signal-not-deterministic-truth'
          ? 'yes'
          : 'not-before-reconciliation',
      status: NOT_ACTIVE,
    });
  }
  return rows;
}

function claimRows(analysis) {
  const rows = [];
  const tenant = analysis.tenant;
  let sequence = 0;
  const nextId = (kind) => {
    sequence += 1;
    return `${tenant.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 3)}-${kind}-${String(sequence).padStart(3, '0')}`;
  };

  for (const duplicate of analysis.duplicates) {
    const asserting = duplicate.detail.map((entry) => entry.path).join('; ');
    const values = duplicate.detail.map((entry) => `${path.basename(entry.path)}=${entry.rows} rows`).join('; ');
    rows.push({
      claimId: nextId('DUP'),
      tenantKey: tenant,
      claimType: 'duplicate-truth-candidate',
      claim: `Canonical dimension ${duplicate.name} exists in ${duplicate.detail.length} roots`,
      valueAsserted: values,
      assertingFiles: asserting,
      conflictState: duplicate.identical ? 'IDENTICAL_COPY' : 'DIVERGENT_COPY',
      authoritativeCandidate: `${analysis.activeRoot}/${duplicate.name}`,
      allowedUse: duplicate.identical
        ? 'Either copy may be read; retire the non-registry copy through the retirement manifest.'
        : 'Do not quote either copy until reconciled; the non-active copy asserts different content.',
      blockedNarrative: duplicate.identical
        ? ''
        : 'Do not present figures from this dimension until the divergence is reconciled.',
      recommendedNextEvidence: 'declare a source-of-record root, then regenerate the other copy or retire it',
      smeReviewer: '',
      status: 'open',
    });
  }

  for (const dimension of analysis.dimensionRows) {
    if (dimension.nameMatchesContract === 'absent') {
      rows.push({
        claimId: nextId('GAP'),
        tenantKey: tenant,
        claimType: 'contract-coverage-gap',
        claim: `Canonical contract file ${dimension.contractFile} is absent from the active root`,
        valueAsserted: 'absent',
        assertingFiles: analysis.activeRoot,
        conflictState: 'ABSENT',
        authoritativeCandidate: '',
        allowedUse: 'Treat this dimension as not evidenced for this tenant.',
        blockedNarrative: `Do not state any fact that requires ${dimension.contractFile} for this tenant.`,
        recommendedNextEvidence: 'client extract or document for this dimension',
        smeReviewer: '',
        status: 'open',
      });
    } else if (dimension.nameMatchesContract === 'no') {
      rows.push({
        claimId: nextId('DRIFT'),
        tenantKey: tenant,
        claimType: 'contract-naming-drift',
        claim: `Contract file ${dimension.contractFile} is carried as ${dimension.resolvedFile} in the active root`,
        valueAsserted: dimension.resolvedFile,
        assertingFiles: `${analysis.activeRoot}/${dimension.resolvedFile}`,
        conflictState: 'NAME_DRIFT',
        authoritativeCandidate: dimension.contractFile,
        allowedUse: 'Readable, but loaders keyed on the contract filename will miss it.',
        blockedNarrative: '',
        recommendedNextEvidence: 'decide whether the contract or the tenant file name is authoritative',
        smeReviewer: '',
        status: 'open',
      });
    }
    if (dimension.resolvedFile && dimension.missingDeclaredColumns > 0) {
      rows.push({
        claimId: nextId('SCHEMA'),
        tenantKey: tenant,
        claimType: 'contract-column-gap',
        claim: `${dimension.resolvedFile} is missing ${dimension.missingDeclaredColumns} declared column(s)`,
        valueAsserted: dimension.missingColumnNames,
        assertingFiles: `${analysis.activeRoot}/${dimension.resolvedFile}`,
        conflictState: 'SCHEMA_GAP',
        authoritativeCandidate: `${TEMPLATE_DIR}/template-manifest.json`,
        allowedUse: 'Rows are readable; the missing columns carry no evidence for this tenant.',
        blockedNarrative: 'Do not report the missing attributes as zero or as known.',
        recommendedNextEvidence: 'source extract that carries the missing columns',
        smeReviewer: '',
        status: 'open',
      });
    }
  }

  for (const name of analysis.unregisteredActiveFiles) {
    rows.push({
      claimId: nextId('UNREG'),
      tenantKey: tenant,
      claimType: 'unregistered-artifact-in-active-root',
      claim: `${name} sits in the active input root but is not in the template contract`,
      valueAsserted: name,
      assertingFiles: `${analysis.activeRoot}/${name}`,
      conflictState: 'UNREGISTERED',
      authoritativeCandidate: `${TEMPLATE_DIR}/template-manifest.json`,
      allowedUse: 'Do not treat as a canonical dimension.',
      blockedNarrative: 'Do not load or project this file as canonical content.',
      recommendedNextEvidence: 'declare it in the template contract or move it out of the active root',
      smeReviewer: '',
      status: 'open',
    });
  }

  for (const entry of analysis.lineageForTenant) {
    if (entry.status !== 'CONFLICT' && entry.status !== 'ONE_SOURCE') continue;
    rows.push({
      claimId: nextId(entry.status === 'CONFLICT' ? 'FACT' : 'SOLO'),
      tenantKey: tenant,
      claimType: 'cross-source-fact-lineage',
      claim: `${entry.label} (${entry.metric})`,
      valueAsserted: (entry.asserted ?? [])
        .map((claim) => `${claim.tree}/${path.basename(claim.rel)}·${claim.col}=${claim.value}`)
        .join('; '),
      assertingFiles: (entry.asserted ?? []).map((claim) => `${claim.tree}/${claim.rel}`).join('; '),
      conflictState: entry.status,
      authoritativeCandidate: '',
      allowedUse:
        entry.status === 'CONFLICT'
          ? 'None. Sources materially disagree.'
          : 'Quotable only if stated as uncorroborated single-source.',
      blockedNarrative:
        entry.status === 'CONFLICT'
          ? 'Do not quote this figure at all until a source of record is declared.'
          : 'Do not present as corroborated fact.',
      recommendedNextEvidence: 'declare the source of record for this metric and regenerate the other assertion',
      smeReviewer: '',
      status: 'open',
    });
  }

  return rows;
}

// --------------------------------------------------------------------------------------
// Layer 2 — adapter dry-run against the real mapping contract
// --------------------------------------------------------------------------------------

/**
 * A dry-run in the only sense that is safe here: for every implemented mapping profile,
 * can this tenant's own intake files actually satisfy the required source fields? Nothing
 * is transformed and nothing is written.
 */
function layer2Rows(analysis, contract, profiles) {
  const tenant = analysis.tenant;
  const activeProfiles = activeLayer2MappingProfiles(profiles);
  const activeRoot = analysis.activeRoot;
  const activeCsvs = (analysis.roots.find((root) => root.relativePath === activeRoot)?.files ?? []).filter(
    (file) => file.endsWith('.csv'),
  );
  const columnsByFile = new Map(activeCsvs.map((file) => [file, csvShape(file).columns]));

  const implementedFamilies = new Set(
    activeProfiles.map((profile) => profile.sourceClass).filter(Boolean),
  );

  // Declared adapter family per workstream vs what is actually implemented.
  const familyRows = contract.workstreams.clientFacingWorkstreams.map((workstream) => {
    const family = workstream.sourceAdapterFamily ?? '';
    const targets = workstream.canonicalTargets ?? [];
    const sourceFiles = targets
      .map((target) => analysis.dimensionRows.find((row) => row.contractFile === target))
      .filter((row) => row && row.resolvedFile)
      .map((row) => `${activeRoot}/${row.resolvedFile}`);

    // The profile registry is keyed by canonical source class, while workstreams
    // declare client-facing adapter families. Match through the canonical target
    // files so family coverage is auditable instead of guessed from display text.
    const matchedProfiles = profilesForWorkstream(workstream, activeProfiles);

    return {
      tenantKey: tenant,
      workstreamId: workstream.workstreamId,
      workstreamName: workstream.workstreamName,
      declaredAdapterFamily: family,
      implementedMappingProfiles: matchedProfiles.map((profile) => profile.mappingProfile).join('; '),
      adapterState: matchedProfiles.length ? 'partially-implemented' : 'no-implemented-adapter',
      sourceFilesAvailable: sourceFiles.join('; '),
      sourceFileCount: sourceFiles.length,
      outputsProduced: 'none — dry-run only, no adapter was executed',
      gapNote: matchedProfiles.length
        ? 'Mapping profile exists; field satisfaction is reported per profile in the dry-run rows.'
        : `No mapping profile implements the ${family} family. Do not invent one — this is an adapter gap.`,
    };
  });

  // Field-level satisfaction per implemented profile against this tenant's own files.
  const dryRunRows = [];
  for (const profile of activeProfiles) {
    const required = profile.rules.filter((rule) => rule.required).map((rule) => rule.sourceField);
    const optional = profile.rules.filter((rule) => !rule.required).map((rule) => rule.sourceField);
    const candidateFiles = activeCsvs.filter((file) => profileAppliesToDomain(profile, domainFromContractFile(file)));

    // "Best" only means anything once at least one required field is present; otherwise
    // reporting a filename would imply a match that does not exist.
    let best = { file: '', satisfied: 0, missing: required };
    for (const file of candidateFiles) {
      const columns = columnsByFile.get(file) ?? [];
      const satisfied = required.filter((field) => columns.includes(field));
      if (satisfied.length > best.satisfied) {
        best = { file, satisfied: satisfied.length, missing: required.filter((field) => !columns.includes(field)) };
      }
    }

    const optionalHit = best.file
      ? optional.filter((field) => (columnsByFile.get(best.file) ?? []).includes(field)).length
      : 0;

    dryRunRows.push({
      tenantKey: tenant,
      mappingProfile: profile.mappingProfile,
      sourceClass: profile.sourceClass,
      profileVersion: profile.version ?? '',
      requiredFields: required.length,
      bestMatchingSourceFile: best.file || 'none',
      requiredFieldsSatisfied: Math.max(best.satisfied, 0),
      requiredFieldsMissing: best.missing.length,
      missingFieldNames: best.missing.join('; '),
      optionalFieldsSatisfied: optionalHit,
      dryRunResult:
        best.satisfied === required.length && required.length > 0
          ? 'would-run'
          : best.satisfied > 0
            ? 'would-fail-on-required-fields'
            : 'no-source-file-matches-this-profile',
      executed: 'no — field-satisfaction check only, no transform, no write',
    });
  }

  const workstreamsByTarget = new Map();
  for (const workstream of contract.workstreams.clientFacingWorkstreams) {
    for (const target of workstream.canonicalTargets ?? []) {
      if (!workstreamsByTarget.has(target)) workstreamsByTarget.set(target, []);
      workstreamsByTarget.get(target).push(workstream);
    }
  }

  const dimensionRows = analysis.dimensionRows.map((dimension) => {
    const workstreams = workstreamsByTarget.get(dimension.contractFile) ?? [];
    const matchedProfiles = profilesForContractFile(dimension.contractFile, activeProfiles);
    const requiredFields = [
      ...new Set(matchedProfiles.flatMap((profile) => profile.rules.filter((rule) => rule.required).map((rule) => rule.sourceField))),
    ];
    const sourceFile = dimension.resolvedFile ? `${activeRoot}/${dimension.resolvedFile}` : '';
    const sourceColumns = sourceFile ? (columnsByFile.get(sourceFile) ?? []) : [];
    const missingRequiredFields = requiredFields.filter((field) => !sourceColumns.includes(field));
    const adapterState =
      matchedProfiles.length === 0
        ? 'no-implemented-adapter'
        : !sourceFile
          ? 'source-file-absent'
          : missingRequiredFields.length === 0
            ? 'would-run'
            : 'would-fail-on-required-fields';

    return {
      tenantKey: tenant,
      contractFile: dimension.contractFile,
      resolvedFile: dimension.resolvedFile || 'absent',
      adapterFamilies: [...new Set(workstreams.map((workstream) => workstream.sourceAdapterFamily ?? ''))]
        .filter(Boolean)
        .join('; '),
      workstreamIds: workstreams.map((workstream) => workstream.workstreamId).join('; '),
      implementedMappingProfiles: matchedProfiles.map((profile) => profile.mappingProfile).join('; '),
      adapterState,
      dataRows: dimension.dataRows,
      sourceColumns: sourceColumns.length,
      requiredFields: requiredFields.length,
      requiredFieldsSatisfied: requiredFields.length - missingRequiredFields.length,
      requiredFieldsMissing: missingRequiredFields.length,
      missingFieldNames: missingRequiredFields.join('; '),
      executed: 'no — reconciliation only, no transform, no write',
    };
  });

  return {
    familyRows,
    dryRunRows,
    dimensionRows,
    implementedFamilies: [...implementedFamilies],
    profileCount: activeProfiles.length,
    legacyCompatibilityProfileCount: profiles ? profiles.length - activeProfiles.length : 'unknown',
  };
}

function adapterFamilyCoverageRegistry(contract, profiles) {
  const profileList = profiles ?? [];
  const activeProfiles = activeLayer2MappingProfiles(profileList);
  const workstreams = contract.workstreams.clientFacingWorkstreams.map((workstream) => {
    const matchedProfiles = profilesForWorkstream(workstream, activeProfiles);
    return {
      workstreamId: workstream.workstreamId,
      workstreamName: workstream.workstreamName,
      declaredAdapterFamily: workstream.sourceAdapterFamily ?? '',
      canonicalTargets: workstream.canonicalTargets ?? [],
      implementedMappingProfiles: matchedProfiles.map((profile) => ({
        mappingProfile: profile.mappingProfile,
        sourceClass: profile.sourceClass,
        version: profile.version ?? '',
        requiredFields: profile.rules.filter((rule) => rule.required).map((rule) => rule.sourceField),
        optionalFields: profile.rules.filter((rule) => !rule.required).map((rule) => rule.sourceField),
      })),
      adapterState: matchedProfiles.length ? 'partially-implemented' : 'no-implemented-adapter',
    };
  });

  return {
    templateSetId: contract.manifest.templateSetId,
    declaredWorkstreamAdapterFamilies: workstreams.length,
    activeMappingProfiles: activeProfiles.length,
    legacyCompatibilityMappingProfiles: profileList.length - activeProfiles.length,
    implementedMappingProfiles: profileList.length,
    activeSourceClasses: [...new Set(activeProfiles.map((profile) => profile.sourceClass))].sort(),
    implementedSourceClasses: [...new Set(profileList.map((profile) => profile.sourceClass))].sort(),
    workstreams,
  };
}

function layer2DryRunFailureReport(generatedAt, tenants, allAdapterFamilyRows, allAdapterDryRunRows, allAdapterDimensionRows) {
  const familyFailures = allAdapterFamilyRows
    .filter((row) => row.adapterState === 'no-implemented-adapter')
    .map((row) => ({
      failureType: 'adapter-family-missing',
      tenantKey: row.tenantKey,
      workstreamId: row.workstreamId,
      declaredAdapterFamily: row.declaredAdapterFamily,
      message: row.gapNote,
    }));

  const profileFailures = allAdapterDryRunRows
    .filter((row) => row.dryRunResult !== 'would-run')
    .map((row) => ({
      failureType: 'mapping-profile-required-fields-unsatisfied',
      tenantKey: row.tenantKey,
      mappingProfile: row.mappingProfile,
      sourceClass: row.sourceClass,
      bestMatchingSourceFile: row.bestMatchingSourceFile,
      requiredFields: Number(row.requiredFields),
      requiredFieldsSatisfied: Number(row.requiredFieldsSatisfied),
      requiredFieldsMissing: Number(row.requiredFieldsMissing),
      missingFieldNames: row.missingFieldNames,
      dryRunResult: row.dryRunResult,
    }));

  const dimensionFailures = allAdapterDimensionRows
    .filter((row) => row.adapterState !== 'would-run')
    .map((row) => ({
      failureType:
        row.adapterState === 'no-implemented-adapter'
          ? 'canonical-dimension-has-no-mapping-profile'
          : row.adapterState,
      tenantKey: row.tenantKey,
      contractFile: row.contractFile,
      resolvedFile: row.resolvedFile,
      adapterFamilies: row.adapterFamilies,
      workstreamIds: row.workstreamIds,
      implementedMappingProfiles: row.implementedMappingProfiles,
      requiredFields: Number(row.requiredFields),
      requiredFieldsSatisfied: Number(row.requiredFieldsSatisfied),
      requiredFieldsMissing: Number(row.requiredFieldsMissing),
      missingFieldNames: row.missingFieldNames,
    }));

  return {
    generatedAt,
    generatedBy: 'scripts/audit/tenant-layer-refresh.mjs',
    tenants,
    mode: 'layer2-dry-run-only',
    truthSplit: {
      productionTenantDataWritten: false,
      activeTenantAccessLayerUpdated: false,
      moduleRuntimeBehaviorChanged: false,
      adaptersExecuted: false,
      canonicalObjectsWritten: false,
    },
    summary: {
      familyFailures: familyFailures.length,
      profileFailures: profileFailures.length,
      dimensionFailures: dimensionFailures.length,
      totalFailures: familyFailures.length + profileFailures.length + dimensionFailures.length,
    },
    familyFailures,
    profileFailures,
    dimensionFailures,
  };
}

const sourceClassFileAliases = {
  spend_value: ['08_it_budget_spend_value.csv'],
  service_scope_managed_services: ['17_managed_services_scope.csv'],
};

const sourceFieldResolutionCatalog = {
  source_file: [
    {
      resolutionType: 'derived_source_path',
      actionClass: 'mapping_alias_code_only_fix',
      candidate: '__source_path',
      rationale: 'Adapter already receives sourcePath; lineage can be derived without changing Layer 1 data.',
    },
    {
      resolutionType: 'field_alias',
      actionClass: 'mapping_alias_code_only_fix',
      candidate: 'evidence_location',
      rationale: 'Existing intake lineage field can be treated as a source-file alias when present.',
    },
  ],
  entity_name: [
    {
      resolutionType: 'field_alias',
      actionClass: 'mapping_alias_code_only_fix',
      candidate: 'business_name',
      rationale: 'Legacy packet uses business_name for enterprise identity.',
    },
  ],
  service_name: [
    {
      resolutionType: 'field_alias',
      actionClass: 'mapping_alias_code_only_fix',
      candidate: 'service',
      rationale: 'Managed-services packet declares service as the service label.',
    },
  ],
  use_case_name: [
    {
      resolutionType: 'field_alias',
      actionClass: 'mapping_alias_code_only_fix',
      candidate: 'use_case',
      rationale: 'Legacy packet uses use_case for the use-case label.',
    },
  ],
  risk_or_control_name: [
    {
      resolutionType: 'field_alias',
      actionClass: 'mapping_alias_code_only_fix',
      candidate: 'risk_or_gap',
      rationale: 'Legacy packet records the risk/control label in risk_or_gap.',
    },
  ],
  function_name: [
    {
      resolutionType: 'semantic_alias_candidate',
      actionClass: 'hard_gate_decision',
      candidate: 'business_name',
      rationale: 'Could be a business-function label, but identity semantics must be approved before mapping.',
    },
    {
      resolutionType: 'semantic_alias_candidate',
      actionClass: 'hard_gate_decision',
      candidate: 'context_item',
      rationale: 'Could identify the function row, but this would define canonical identity from generic context.',
    },
  ],
  org_unit: [
    {
      resolutionType: 'semantic_alias_candidate',
      actionClass: 'hard_gate_decision',
      candidate: 'business_name',
      rationale: 'Could be an org-unit label, but requires approval before canonical ownership identity mapping.',
    },
    {
      resolutionType: 'semantic_alias_candidate',
      actionClass: 'hard_gate_decision',
      candidate: 'owner_role',
      rationale: 'Owner role is available, but role and org unit are not equivalent without a mapping decision.',
    },
  ],
  persona_or_role: [
    {
      resolutionType: 'semantic_alias_candidate',
      actionClass: 'hard_gate_decision',
      candidate: 'interview_group',
      rationale: 'Could represent a persona segment, but must not be promoted as canonical role identity automatically.',
    },
    {
      resolutionType: 'semantic_alias_candidate',
      actionClass: 'hard_gate_decision',
      candidate: 'priority_theme',
      rationale: 'Theme is available but is not safely equivalent to a persona or role.',
    },
  ],
  vendor_name: [
    {
      resolutionType: 'semantic_alias_candidate',
      actionClass: 'hard_gate_decision',
      candidate: 'vendor_id',
      rationale: 'Vendor ID exists, but ID and display name are different canonical attributes.',
    },
    {
      resolutionType: 'semantic_alias_candidate',
      actionClass: 'hard_gate_decision',
      candidate: 'business_name',
      rationale: 'Could be a display label in legacy rows, but vendor identity needs explicit approval.',
    },
  ],
  system_name: [
    {
      resolutionType: 'semantic_alias_candidate',
      actionClass: 'hard_gate_decision',
      candidate: 'systems',
      rationale: 'Systems may contain one or more system labels; cardinality must be approved before canonical identity mapping.',
    },
    {
      resolutionType: 'semantic_alias_candidate',
      actionClass: 'hard_gate_decision',
      candidate: 'business_name',
      rationale: 'Could be a display label in legacy rows, but system identity needs explicit approval.',
    },
    {
      resolutionType: 'semantic_alias_candidate',
      actionClass: 'hard_gate_decision',
      candidate: 'capability',
      rationale: 'Capability is related context, not a declared system name.',
    },
  ],
  spend_category: [
    {
      resolutionType: 'semantic_alias_candidate',
      actionClass: 'hard_gate_decision',
      candidate: 'financial_fact_type',
      rationale: 'Financial fact type may classify spend, but category semantics need approval.',
    },
    {
      resolutionType: 'semantic_alias_candidate',
      actionClass: 'hard_gate_decision',
      candidate: 'ai_spend_category',
      rationale: 'AI spend category exists for a subset of rows and cannot silently stand in for all spend.',
    },
  ],
  metric_name: [
    {
      resolutionType: 'semantic_alias_candidate',
      actionClass: 'hard_gate_decision',
      candidate: 'business_name',
      rationale: 'Could label the row, but metric identity must be declared explicitly.',
    },
    {
      resolutionType: 'semantic_alias_candidate',
      actionClass: 'hard_gate_decision',
      candidate: 'benefit_id',
      rationale: 'Benefit IDs and metric names are different identifiers.',
    },
  ],
  data_asset_name: [
    {
      resolutionType: 'semantic_alias_candidate',
      actionClass: 'hard_gate_decision',
      candidate: 'data_domain',
      rationale: 'Data domain is available but is broader than an asset name.',
    },
    {
      resolutionType: 'semantic_alias_candidate',
      actionClass: 'hard_gate_decision',
      candidate: 'systems',
      rationale: 'Systems may reference assets but are not the declared data-asset identity.',
    },
  ],
  platform_name: [
    {
      resolutionType: 'semantic_alias_candidate',
      actionClass: 'hard_gate_decision',
      candidate: 'capability',
      rationale: 'Capability is available but is not safely equivalent to platform identity.',
    },
    {
      resolutionType: 'semantic_alias_candidate',
      actionClass: 'hard_gate_decision',
      candidate: 'vendor_id',
      rationale: 'Vendor IDs do not declare platform names.',
    },
  ],
  program_name: [
    {
      resolutionType: 'semantic_alias_candidate',
      actionClass: 'hard_gate_decision',
      candidate: 'program_code',
      rationale: 'Program code is available but name/code mapping is a canonical identity decision.',
    },
    {
      resolutionType: 'semantic_alias_candidate',
      actionClass: 'hard_gate_decision',
      candidate: 'initiative_id',
      rationale: 'Initiative identity must not be silently promoted to program identity.',
    },
  ],
  process_name: [
    {
      resolutionType: 'semantic_alias_candidate',
      actionClass: 'hard_gate_decision',
      candidate: 'business_name',
      rationale: 'Could label a process row, but process identity needs explicit mapping approval.',
    },
    {
      resolutionType: 'semantic_alias_candidate',
      actionClass: 'hard_gate_decision',
      candidate: 'use_case',
      rationale: 'Use case and operational process are distinct canonical objects.',
    },
  ],
  pattern_name: [
    {
      resolutionType: 'semantic_alias_candidate',
      actionClass: 'hard_gate_decision',
      candidate: 'industry_context',
      rationale: 'Industry context may describe a pattern but does not declare a pattern name.',
    },
    {
      resolutionType: 'semantic_alias_candidate',
      actionClass: 'hard_gate_decision',
      candidate: 'signals',
      rationale: 'Signals are evidence/context, not pattern identity.',
    },
  ],
  lens_name: [
    {
      resolutionType: 'semantic_alias_candidate',
      actionClass: 'hard_gate_decision',
      candidate: 'industry_context',
      rationale: 'Industry context is not a declared expert lens identity.',
    },
    {
      resolutionType: 'semantic_alias_candidate',
      actionClass: 'hard_gate_decision',
      candidate: 'module_next_actions',
      rationale: 'Next actions are not a lens name.',
    },
  ],
};

function dominantActionClass(fieldResolutions) {
  const actionClasses = new Set(fieldResolutions.map((resolution) => resolution.recommendedAction));
  if (actionClasses.has('hard_gate_decision')) return 'hard_gate_decision';
  if (actionClasses.has('source_data_gated_fix')) return 'source_data_gated_fix';
  return 'mapping_alias_code_only_fix';
}

function sourceFileContextForFailure(failure, analyses) {
  const tenantAnalysis = analyses.get(failure.tenantKey);
  if (!tenantAnalysis) return null;
  const activeRoot = tenantAnalysis.activeRoot;
  const activeFiles = (tenantAnalysis.roots.find((root) => root.relativePath === activeRoot)?.files ?? []).filter(
    (file) => file.endsWith('.csv'),
  );

  if (failure.bestMatchingSourceFile && failure.bestMatchingSourceFile !== 'none') {
    const file = failure.bestMatchingSourceFile;
    return {
      matchType: 'reported_best_match',
      sourceFile: file,
      sourceColumns: csvShape(file).columns,
    };
  }

  const aliases = sourceClassFileAliases[failure.sourceClass] ?? [];
  for (const alias of aliases) {
    const matched = activeFiles.find((file) => path.basename(file) === alias);
    if (matched) {
      return {
        matchType: 'source_file_alias_candidate',
        sourceFile: matched,
        sourceColumns: csvShape(matched).columns,
      };
    }
  }

  return {
    matchType: 'no_source_file_candidate',
    sourceFile: 'none',
    sourceColumns: [],
  };
}

function resolutionForMissingField(field, sourceColumns) {
  if (sourceColumns.includes(field)) {
    return {
      field,
      recommendedAction: 'mapping_alias_code_only_fix',
      candidates: [
        {
          resolutionType: 'direct_source_field_available_after_file_alias',
          actionClass: 'mapping_alias_code_only_fix',
          candidate: field,
          rationale: 'The field is present once the alternate source-file/domain alias is selected.',
        },
      ],
      rationale: 'The field is present once the alternate source-file/domain alias is selected.',
    };
  }

  const catalog = sourceFieldResolutionCatalog[field] ?? [];
  const candidates = catalog.filter(
    (candidate) => candidate.resolutionType === 'derived_source_path' || sourceColumns.includes(candidate.candidate),
  );
  if (candidates.length === 0) {
    return {
      field,
      recommendedAction: 'source_data_gated_fix',
      candidates: [],
      rationale: 'No declared source field or catalogued alias is present; resolving this requires source packet correction or a new approved mapping.',
    };
  }

  return {
    field,
    recommendedAction: dominantActionClass(candidates.map((candidate) => ({ recommendedAction: candidate.actionClass }))),
    candidates,
    rationale: candidates.map((candidate) => candidate.rationale).join(' '),
  };
}

function layer2FailureClassificationReport(generatedAt, layer2Failures, analyses) {
  const analysesByTenant = analyses instanceof Map
    ? analyses
    : new Map(analyses.map((analysis) => [analysis.tenant, analysis]));
  const classifications = layer2Failures.profileFailures.map((failure) => {
    const sourceContext = sourceFileContextForFailure(failure, analysesByTenant);
    const sourceColumns = sourceContext?.sourceColumns ?? [];
    const missingFields = failure.missingFieldNames
      .split(';')
      .map((field) => field.trim())
      .filter(Boolean)
      .map((field) => resolutionForMissingField(field, sourceColumns));
    const recommendedAction = sourceContext?.matchType === 'no_source_file_candidate'
      ? 'source_data_gated_fix'
      : dominantActionClass(missingFields);
    const issueTypes = [
      sourceContext?.matchType === 'source_file_alias_candidate' ? 'source-file-domain-alias' : null,
      ...missingFields.map((field) =>
        field.recommendedAction === 'mapping_alias_code_only_fix'
          ? 'field-alias-or-lineage-fallback'
          : field.recommendedAction === 'hard_gate_decision'
            ? 'semantic-identity-alias-decision'
            : 'source-data-required-field-gap',
      ),
    ].filter(Boolean);

    return {
      tenantKey: failure.tenantKey,
      mappingProfile: failure.mappingProfile,
      sourceClass: failure.sourceClass,
      dryRunResult: failure.dryRunResult,
      reportedBestMatchingSourceFile: failure.bestMatchingSourceFile,
      selectedSourceFile: sourceContext?.sourceFile ?? 'none',
      sourceFileMatchType: sourceContext?.matchType ?? 'unknown',
      missingFields,
      issueTypes: [...new Set(issueTypes)],
      recommendedAction,
      approvalRequiredBeforeFix:
        recommendedAction === 'hard_gate_decision'
          ? 'Approve the semantic alias before changing adapter/profile behavior.'
          : recommendedAction === 'source_data_gated_fix'
            ? 'Approve tenant source-data correction or package promotion before mutating Layer 1.'
            : 'No hard gate for report-only or code-only alias support; merge/deploy still requires normal approval.',
    };
  });

  const byRecommendedAction = classifications.reduce((counts, item) => {
    counts[item.recommendedAction] = (counts[item.recommendedAction] ?? 0) + 1;
    return counts;
  }, {});

  return {
    generatedAt,
    generatedBy: 'scripts/audit/tenant-layer-refresh.mjs',
    mode: 'layer2-dry-run-failure-classification',
    truthSplit: {
      productionTenantDataWritten: false,
      activeTenantAccessLayerUpdated: false,
      moduleRuntimeBehaviorChanged: false,
      adaptersExecuted: false,
      canonicalObjectsWritten: false,
    },
    summary: {
      uniqueProfileFailuresClassified: classifications.length,
      mirroredDimensionFailures: layer2Failures.dimensionFailures.length,
      byRecommendedAction,
    },
    classifications,
    nextPrSizedSafeCodeSlice: {
      title: 'Emit and test Layer 2 dry-run failure classification',
      scope: 'Report-only classifier for adapter/profile failures; no alias resolution and no tenant CSV mutation.',
      expectedOutput: 'layer2-dry-run-failure-classification.json',
      hardGatesBeforeActivation: [
        'tenant CSV mutation',
        'registry activation',
        'data-plane load/write',
        'runtime routing or deploy',
        'semantic identity alias activation',
      ],
    },
  };
}

function layer2CodeOnlyAliasImpactReport(generatedAt, layer2FailureClassification) {
  const classifications = layer2FailureClassification.classifications ?? [];
  const codeOnlyCandidates = classifications.filter(
    (item) => item.recommendedAction === 'mapping_alias_code_only_fix',
  );
  const gatedDecisions = classifications.filter(
    (item) => item.recommendedAction === 'hard_gate_decision',
  );
  const sourceDataGated = classifications.filter(
    (item) => item.recommendedAction === 'source_data_gated_fix',
  );

  const candidateProfiles = codeOnlyCandidates.map((item) => ({
    tenantKey: item.tenantKey,
    mappingProfile: item.mappingProfile,
    sourceClass: item.sourceClass,
    selectedSourceFile: item.selectedSourceFile,
    sourceFileMatchType: item.sourceFileMatchType,
    wouldClearDryRunFailure: true,
    activationState: 'not_activated_report_only',
    fieldResolutions: item.missingFields.map((field) => ({
      field: field.field,
      resolutionType: field.candidates[0]?.resolutionType ?? 'unknown',
      candidate: field.candidates[0]?.candidate ?? '',
      allCandidates: field.candidates.map((candidate) => ({
        resolutionType: candidate.resolutionType,
        candidate: candidate.candidate,
      })),
    })),
  }));

  return {
    generatedAt,
    generatedBy: 'scripts/audit/tenant-layer-refresh.mjs',
    mode: 'layer2-code-only-alias-impact-report-only',
    truthSplit: {
      productionTenantDataWritten: false,
      activeTenantAccessLayerUpdated: false,
      moduleRuntimeBehaviorChanged: false,
      adaptersExecuted: false,
      aliasesActivated: false,
      canonicalObjectsWritten: false,
    },
    summary: {
      profileFailuresEvaluated: classifications.length,
      codeOnlyAliasCandidates: codeOnlyCandidates.length,
      wouldClearProfileFailuresIfActivated: candidateProfiles.filter((item) => item.wouldClearDryRunFailure).length,
      remainingHardGateDecisions: gatedDecisions.length,
      remainingSourceDataGatedFixes: sourceDataGated.length,
    },
    candidateProfiles,
    gatedProfiles: gatedDecisions.map((item) => ({
      tenantKey: item.tenantKey,
      mappingProfile: item.mappingProfile,
      sourceClass: item.sourceClass,
      requiredApproval: item.approvalRequiredBeforeFix,
      missingFields: item.missingFields.map((field) => field.field),
    })),
    sourceDataGatedProfiles: sourceDataGated.map((item) => ({
      tenantKey: item.tenantKey,
      mappingProfile: item.mappingProfile,
      sourceClass: item.sourceClass,
      requiredApproval: item.approvalRequiredBeforeFix,
      missingFields: item.missingFields.map((field) => field.field),
    })),
    nextPrSizedSafeCodeSlice: {
      title: 'Activate mechanically safe Layer 2 aliases behind adapter tests',
      scope:
        'Code-only alias activation for candidates whose missing fields are direct source fields, derived source path lineage, or non-semantic field aliases.',
      blockedBeforeActivation: [
        'semantic identity alias activation',
        'tenant CSV mutation',
        'registry activation',
        'data-plane load/write',
      ],
    },
  };
}

function layer2SemanticDecisionLedgerReport(generatedAt, layer2FailureClassification) {
  const classifications = layer2FailureClassification.classifications ?? [];
  const gatedProfiles = classifications.filter(
    (item) => item.recommendedAction === 'hard_gate_decision',
  );

  const decisions = gatedProfiles.map((item) => {
    const semanticFields = item.missingFields
      .map((field) => ({
        field: field.field,
        candidates: field.candidates
          .filter((candidate) => candidate.actionClass === 'hard_gate_decision')
          .map((candidate) => ({
            resolutionType: candidate.resolutionType,
            candidate: candidate.candidate,
            rationale: candidate.rationale,
          })),
      }))
      .filter((field) => field.candidates.length > 0);

    return {
      tenantKey: item.tenantKey,
      mappingProfile: item.mappingProfile,
      sourceClass: item.sourceClass,
      selectedSourceFile: item.selectedSourceFile,
      sourceFileMatchType: item.sourceFileMatchType,
      decisionState: 'requires_explicit_approval',
      approvalGate: 'semantic identity alias activation',
      approvalRequiredBeforeFix: item.approvalRequiredBeforeFix,
      semanticFields,
      mechanicallySafeFields: item.missingFields
        .filter((field) => field.recommendedAction === 'mapping_alias_code_only_fix')
        .map((field) => ({
          field: field.field,
          candidates: field.candidates.map((candidate) => ({
            resolutionType: candidate.resolutionType,
            candidate: candidate.candidate,
          })),
        })),
      blockedActions: [
        'adapter/profile semantic alias activation',
        'registry activation',
        'tenant CSV mutation',
        'data-plane load/write',
        'canonical object write',
        'runtime/product routing change',
      ],
    };
  });

  return {
    generatedAt,
    generatedBy: 'scripts/audit/tenant-layer-refresh.mjs',
    mode: 'layer2-semantic-decision-ledger-report-only',
    truthSplit: {
      productionTenantDataWritten: false,
      activeTenantAccessLayerUpdated: false,
      moduleRuntimeBehaviorChanged: false,
      adaptersExecuted: false,
      aliasesActivated: false,
      registryActivated: false,
      canonicalObjectsWritten: false,
    },
    summary: {
      profileFailuresEvaluated: classifications.length,
      semanticDecisionProfiles: decisions.length,
      semanticDecisionFields: decisions.reduce((total, item) => total + item.semanticFields.length, 0),
      sourceDataGatedProfiles: classifications.filter((item) => item.recommendedAction === 'source_data_gated_fix').length,
      activationReadyProfiles: 0,
    },
    decisions,
    nextApprovalPacket: {
      title: 'Approve or reject semantic identity aliases per mapping profile',
      scope:
        'For each decision entry, approve the candidate source field that may define canonical identity or reject alias activation and require source-data correction.',
      blockedUntilApproved: [
        'semantic identity alias activation',
        'registry activation',
        'data-plane load/write',
        'runtime/product routing change',
      ],
    },
    nextPrSizedSafeCodeSlice: {
      title: 'Add test-backed semantic alias decisions after approval',
      scope:
        'Only after explicit approval, encode approved semantic identity aliases behind adapter/profile tests without mutating tenant CSVs.',
      blockedBeforeActivation: [
        'semantic identity alias approval',
        'registry activation approval',
        'data-plane load/write approval',
      ],
    },
  };
}

function evidenceRequestRows(analysis) {
  const rows = [];
  let sequence = 0;
  for (const workstream of analysis.workstreamRows) {
    if (workstream.coverageState === 'covered') continue;
    sequence += 1;
    rows.push({
      requestId: `${analysis.tenant}-ER-${String(sequence).padStart(3, '0')}`,
      tenantKey: analysis.tenant,
      workstreamId: workstream.workstreamId,
      workstreamName: workstream.workstreamName,
      requestedFrom: workstream.typicalOwners,
      whatIsMissing: workstream.missingTargets || 'partial population',
      whyItMatters: workstream.smeValidationFocus,
      coverageState: workstream.coverageState,
      requestStatus: 'open',
      dateRequested: '',
      dateReceived: '',
      notes: '',
    });
  }
  return rows;
}

function hardGateRows(tenants, analyses) {
  const gates = [
    {
      gateId: 'GATE-01',
      action: 'Activate the governed intake package as the registry active root',
      layer: 'Layer 1',
      artefact: REGISTRY,
      command: 'manual edit of tenant-input-registry.json + validation run',
      expectedOutput: 'registry canonicalInputRoot repointed to the governed package',
      rollback: 'restore prior registry commit; prior active root is untouched on disk',
      approvalRequired: 'Anand/Codex, per tenant',
    },
    {
      gateId: 'GATE-02',
      action: 'Replace or alias the active tenant input root',
      layer: 'Layer 1',
      artefact: 'datasets/tenant-inputs/active/<tenant>/current',
      command: 'package promotion step (not implemented in this script)',
      expectedOutput: 'active root serves the governed package contents',
      rollback: 'prior root retained until retirement manifest passes',
      approvalRequired: 'Anand/Codex, per tenant',
    },
    {
      gateId: 'GATE-03',
      action: 'Load canonical data into Azure/Postgres',
      layer: 'Layer 3',
      artefact: 'intelligence_v6.* / canonical stores',
      command: 'ACA data-build job per docs/ops/aca-data-build-job-rule.md',
      expectedOutput: 'job run id, tenant scope, build version, Blob proof bundle, quality gate',
      rollback: 'documented job rollback + readback',
      approvalRequired: 'Anand/Codex + data-build job contract',
    },
    {
      gateId: 'GATE-04',
      action: 'Rebuild retrieval indexes',
      layer: 'Layer 3/4',
      artefact: 'Azure AI Search / fts indexes',
      command: 'indexing job',
      expectedOutput: 'indexed counts + cite-render verification',
      rollback: 'prior index retained until swap',
      approvalRequired: 'Anand/Codex',
    },
    {
      gateId: 'GATE-05',
      action: 'Enable aVa / product context use for the refreshed package',
      layer: 'Layer 4',
      artefact: 'agent context bundle + product projections',
      command: 'flag/config change',
      expectedOutput: 'signed-in proof per affected tenant',
      rollback: 'flag off',
      approvalRequired: 'Anand/Codex',
    },
    {
      gateId: 'GATE-06',
      action: 'Change signed-in runtime routes',
      layer: 'Layer 4',
      artefact: 'app routes',
      command: 'ACA main deploy workflow',
      expectedOutput: 'digest-pinned revision + live route proof',
      rollback: 'traffic shift to prior revision',
      approvalRequired: 'Anand/Codex',
    },
    {
      gateId: 'GATE-07',
      action: 'Retire, move, or delete legacy tenant files',
      layer: 'Layer 1-4',
      artefact: 'adjacent standard packs, candidate packs, generated packs',
      command: 'retirement manifest apply step',
      expectedOutput: 'retire-in-place first, deletion only after rollback window',
      rollback: 'files retained in place',
      approvalRequired: 'Anand/Codex',
    },
    {
      gateId: 'GATE-08',
      action: 'Change canonical CSV column contracts',
      layer: 'Layer 1',
      artefact: `${TEMPLATE_DIR}/template-manifest.json`,
      command: 'contract amendment + loader/adapter update',
      expectedOutput: 'documented reason, migration, and re-validation',
      rollback: 'revert contract commit',
      approvalRequired: 'Anand/Codex, with written justification',
    },
  ];

  const rows = [];
  for (const gate of gates) {
    for (const tenant of tenants) {
      const analysis = analyses.get(tenant);
      let scope = '';
      if (gate.gateId === 'GATE-01') scope = `active root today: ${analysis.activeRoot}`;
      else if (gate.gateId === 'GATE-02')
        scope = `${analysis.roots.find((root) => root.relativePath === analysis.activeRoot)?.files.length ?? 0} files in the active root`;
      else if (gate.gateId === 'GATE-07')
        scope = `${analysis.roots
          .filter((root) => ['duplicate-truth-candidate', 'not-active'].includes(root.truthEligibility))
          .reduce((sum, root) => sum + root.files.length, 0)} files across adjacent/candidate packs`;
      else if (gate.gateId === 'GATE-08')
        scope = `${analysis.dimensionRows.filter((row) => row.nameMatchesContract === 'no').length} naming drift(s), ${analysis.dimensionRows.filter((row) => row.missingDeclaredColumns > 0).length} column gap(s)`;
      else scope = 'scope determined at apply time';

      rows.push({
        gateId: gate.gateId,
        tenantKey: tenant,
        action: gate.action,
        layer: gate.layer,
        artefactOrPath: gate.artefact,
        scopeToday: scope,
        commandToRun: gate.command,
        expectedOutput: gate.expectedOutput,
        rollbackReadbackProof: gate.rollback,
        approvalRequired: gate.approvalRequired,
        executedInThisRun: 'no',
      });
    }
  }
  return rows;
}

// --------------------------------------------------------------------------------------
// Layer 1 governed intake draft package
// --------------------------------------------------------------------------------------

function writeGovernedPackage(analysis, contract, claims, generatedAt) {
  const tenant = analysis.tenant;
  const packageRoot = `datasets/tenant-inputs/${tenant}/${PACKAGE_ID}`;

  // source register: every Layer 1 file this tenant has today, with provenance state
  const sourceRegister = [];
  for (const root of analysis.roots) {
    if (!root.layer.startsWith('Layer 1')) continue;
    if (root.relativePath === packageRoot) continue;
    for (const file of root.files) {
      const shape = file.endsWith('.csv') ? csvShape(file) : { rows: '', columns: [] };
      sourceRegister.push({
        tenantKey: tenant,
        path: file,
        rootRole: root.role,
        truthEligibility: root.truthEligibility,
        fileType: path.extname(file).replace('.', '') || 'none',
        dataRows: shape.rows,
        columnCount: Array.isArray(shape.columns) ? shape.columns.length : '',
        sha256: sha256(file),
        sourceSystemDeclared: 'not_declared_in_file',
        sourceOwnerDeclared: 'not_declared_in_file',
        extractDateDeclared: 'not_declared_in_file',
        certificationState: 'not_attested',
        classification: 'synthetic_demo_planning_grade',
        approvedForLoading: 'no',
      });
    }
  }

  const smeMatrix = analysis.workstreamRows.map((row) => ({
    tenantKey: tenant,
    workstreamId: row.workstreamId,
    workstreamName: row.workstreamName,
    questionForSme: row.smeValidationFocus,
    coverageState: row.coverageState,
    dataRowsAvailable: row.dataRowsAcrossTargets,
    reviewStatus: 'not_started',
    disposition: '',
    reviewerName: '',
    reviewerRole: '',
    reviewDate: '',
    reviewerNotes: '',
    allowedModuleUsage: 'internal_audit_and_gap_analysis_only',
  }));

  const blockedClaims = claims
    .filter((claim) =>
      ['CONFLICT', 'DIVERGENT_COPY', 'UNREGISTERED', 'ABSENT', 'SCHEMA_GAP'].includes(claim.conflictState),
    )
    .map((claim) => ({
      tenantKey: tenant,
      claimId: claim.claimId,
      claimType: claim.claimType,
      claim: claim.claim,
      conflictState: claim.conflictState,
      blockedNarrative: claim.blockedNarrative,
      unblockCondition: claim.recommendedNextEvidence,
      status: claim.status,
    }));

  writeJson(`${abs(packageRoot)}/00_manifest/package_manifest.json`, {
    tenantKey: tenant,
    packageId: PACKAGE_ID,
    generatedAt,
    generatedBy: 'scripts/audit/tenant-layer-refresh.mjs',
    templateSetId: contract.manifest.templateSetId,
    clientIntakeWorkstreams: `${TEMPLATE_DIR}/client-intake-workstreams.json`,
    registryActiveRootAtGeneration: analysis.activeRoot,
    registryActivated: false,
    status: NOT_ACTIVE,
    contents: {
      '00_manifest/source_register.csv': 'every Layer 1 file this tenant has today, with provenance state',
      '00_manifest/sme_validation_matrix.csv': 'one row per client-facing workstream, awaiting SME disposition',
      '00_manifest/evidence_request_log.csv': 'open evidence requests derived from coverage gaps',
      '00_manifest/blocked_claims.csv': 'claims that may not be quoted until reconciled',
      'mapping/workstream_coverage_matrix.csv': 'workstream to canonical target coverage',
    },
    closedGates: [
      'registry activation',
      'active root replacement',
      'Azure/Postgres load',
      'retrieval indexing',
      'aVa and product context use',
      'runtime route change',
      'file retirement or deletion',
    ],
  });

  writeCsv(
    `${abs(packageRoot)}/00_manifest/source_register.csv`,
    Object.keys(sourceRegister[0] ?? { tenantKey: '', path: '' }),
    sourceRegister,
  );
  writeCsv(`${abs(packageRoot)}/00_manifest/sme_validation_matrix.csv`, Object.keys(smeMatrix[0]), smeMatrix);

  const evidenceRequests = evidenceRequestRows(analysis);
  writeCsv(
    `${abs(packageRoot)}/00_manifest/evidence_request_log.csv`,
    [
      'requestId',
      'tenantKey',
      'workstreamId',
      'workstreamName',
      'requestedFrom',
      'whatIsMissing',
      'whyItMatters',
      'coverageState',
      'requestStatus',
      'dateRequested',
      'dateReceived',
      'notes',
    ],
    evidenceRequests,
  );

  writeCsv(
    `${abs(packageRoot)}/00_manifest/blocked_claims.csv`,
    ['tenantKey', 'claimId', 'claimType', 'claim', 'conflictState', 'blockedNarrative', 'unblockCondition', 'status'],
    blockedClaims,
  );

  writeCsv(
    `${abs(packageRoot)}/mapping/workstream_coverage_matrix.csv`,
    Object.keys(analysis.workstreamRows[0]),
    analysis.workstreamRows,
  );

  return { packageRoot, sourceRegister, smeMatrix, evidenceRequests, blockedClaims };
}

// --------------------------------------------------------------------------------------
// per-tenant layer summaries
// --------------------------------------------------------------------------------------

function writeLayer3Summary(outDir, analysis, claims) {
  const tenant = analysis.tenant;
  const identityOk = analysis.dimensionRows.filter((row) => row.resolvedFile && row.dataRows > 0);
  const conflicts = claims.filter((claim) =>
    ['CONFLICT', 'DIVERGENT_COPY'].includes(claim.conflictState),
  );
  const relationships = analysis.dimensionRows.find((row) => row.contractFile === '12_relationships.csv');
  const evidence = analysis.dimensionRows.find((row) => row.contractFile === '13_evidence_sources.csv');

  const checks = [
    {
      check: 'Every canonical object has declared identity',
      result: analysis.unregisteredActiveFiles.length === 0 ? 'PASS' : 'FAIL',
      detail:
        analysis.unregisteredActiveFiles.length === 0
          ? 'All active-root files map to a declared contract dimension.'
          : `${analysis.unregisteredActiveFiles.length} file(s) in the active root are not declared in the template contract: ${analysis.unregisteredActiveFiles.join('; ')}`,
    },
    {
      check: 'Every fact carries source file / source row / evidence id where available',
      result: evidence && evidence.dataRows > 0 ? 'PARTIAL' : 'FAIL',
      detail: evidence
        ? `13_evidence_sources carries ${evidence.dataRows} row(s); per-row evidence linkage is not verified by this script.`
        : 'No evidence-sources dimension resolved.',
    },
    {
      check: 'Relationship rows use canonical relationship types',
      result: relationships && relationships.dataRows > 0 ? 'NOT_VERIFIED' : 'FAIL',
      detail: relationships
        ? `12_relationships carries ${relationships.dataRows} row(s); the canonical relationship dictionary lives in intelligence_v6.relationship_types and was not read (no data-plane access in this lane).`
        : 'No relationships dimension resolved.',
    },
    {
      check: 'Planning-grade and interview-only facts remain marked',
      result: 'PARTIAL',
      detail: 'Classification is carried in the package manifest as synthetic_demo_planning_grade; per-row attestation is not present.',
    },
    {
      check: 'Money, counts, and metrics are deterministic and not model-invented',
      result: conflicts.length === 0 ? 'PASS' : 'FAIL',
      detail:
        conflicts.length === 0
          ? 'No cross-source conflicts detected for this tenant.'
          : `${conflicts.length} conflicting or divergent claim(s); see claim-reconciliation-matrix.csv.`,
    },
    {
      check: 'Duplicate/conflicting claims are blocked pending reconciliation',
      result: 'PASS',
      detail: `${conflicts.length} claim(s) recorded as blocked in the governed package blocked_claims.csv.`,
    },
  ];

  const json = {
    tenantKey: tenant,
    layer: 'Layer 3 — Canonical Enterprise Model',
    mode: 'draft-preparation-only',
    canonicalStoreWritten: false,
    activeRootAtGeneration: analysis.activeRoot,
    dimensionsResolved: identityOk.length,
    dimensionsDeclared: analysis.dimensionRows.length,
    dimensionsAbsent: analysis.dimensionRows.filter((row) => row.nameMatchesContract === 'absent').length,
    dimensionsWithNamingDrift: analysis.dimensionRows.filter((row) => row.nameMatchesContract === 'no').length,
    dimensionsWithColumnGaps: analysis.dimensionRows.filter((row) => row.missingDeclaredColumns > 0).length,
    unregisteredActiveFiles: analysis.unregisteredActiveFiles,
    checks,
    status: NOT_ACTIVE,
  };

  writeJson(path.join(outDir, tenant, 'layer3-canonical-refresh-summary.json'), json);
  writeText(
    path.join(outDir, tenant, 'layer3-canonical-refresh-summary.md'),
    [
      `# Layer 3 canonical refresh — ${tenant}`,
      '',
      `Mode: draft preparation only. No production canonical store was written.`,
      `Active root at generation: \`${analysis.activeRoot}\``,
      '',
      '## Dimension coverage',
      '',
      '| Metric | Value |',
      '| --- | ---: |',
      `| Contract dimensions declared | ${json.dimensionsDeclared} |`,
      `| Resolved with data | ${json.dimensionsResolved} |`,
      `| Absent | ${json.dimensionsAbsent} |`,
      `| Naming drift vs contract | ${json.dimensionsWithNamingDrift} |`,
      `| Missing declared columns | ${json.dimensionsWithColumnGaps} |`,
      `| Unregistered files in active root | ${json.unregisteredActiveFiles.length} |`,
      '',
      '## Required checks',
      '',
      '| Check | Result | Detail |',
      '| --- | --- | --- |',
      ...checks.map((check) => `| ${check.check} | \`${check.result}\` | ${check.detail} |`),
      '',
      '## Per-dimension detail',
      '',
      '| Contract file | Resolved as | Name matches | Data rows | Missing declared columns |',
      '| --- | --- | --- | ---: | ---: |',
      ...analysis.dimensionRows.map(
        (row) =>
          `| \`${row.contractFile}\` | ${row.resolvedFile ? `\`${row.resolvedFile}\`` : '—'} | ${row.nameMatchesContract} | ${row.dataRows} | ${row.missingDeclaredColumns} |`,
      ),
      '',
      `Status: \`${NOT_ACTIVE}\``,
      '',
    ].join('\n'),
  );

  return json;
}

function writeLayer4Summary(outDir, analysis, inventoryRows) {
  const tenant = analysis.tenant;
  const lineageConflicts = analysis.lineageForTenant.filter((entry) => entry.status === 'CONFLICT');
  const lineageSingle = analysis.lineageForTenant.filter((entry) => entry.status === 'ONE_SOURCE');
  const approved = analysis.roots.find((root) => root.role.includes('approved narrative'));
  const derived = analysis.roots.find((root) => root.layer.startsWith('Layer 3'));

  const surfaces = [
    {
      surface: 'Home context and architecture projections',
      localArtefact: `datasets/tenant-inputs/${tenant}/derived/home-context-view.json`,
      present: exists(`datasets/tenant-inputs/${tenant}/derived/home-context-view.json`),
    },
    {
      surface: 'Intelligence / aVa context bundle',
      localArtefact: `datasets/tenant-inputs/${tenant}/derived/canonical-facts.json`,
      present: exists(`datasets/tenant-inputs/${tenant}/derived/canonical-facts.json`),
    },
    {
      surface: 'Moves context package',
      localArtefact: `datasets/tenant-inputs/${tenant}/derived/moves-context-view.json`,
      present: exists(`datasets/tenant-inputs/${tenant}/derived/moves-context-view.json`),
    },
    {
      surface: 'Source read model / package',
      localArtefact: `datasets/tenant-inputs/${tenant}/derived/evidence-registry.json`,
      present: exists(`datasets/tenant-inputs/${tenant}/derived/evidence-registry.json`),
    },
    {
      surface: 'Tower deterministic mart / cube',
      localArtefact: `datasets/tenant-inputs/${tenant}/derived/tower-dashboard-view.json`,
      present: exists(`datasets/tenant-inputs/${tenant}/derived/tower-dashboard-view.json`),
    },
  ].map((surface) => ({
    ...surface,
    readiness: surface.present ? 'local-artefact-present-not-refreshed' : 'no-local-artefact',
    refreshedInThisRun: false,
    blockedBy:
      lineageConflicts.length > 0
        ? 'Layer 3 fact conflicts unresolved'
        : 'Layer 1 SME validation not complete',
  }));

  const json = {
    tenantKey: tenant,
    layer: 'Layer 4 — Products',
    mode: 'readiness-report-only',
    runtimeOrDatabaseProjectionRefreshed: false,
    approvedContentFiles: approved?.files.length ?? 0,
    derivedContextFiles: derived?.files.length ?? 0,
    reportArtefacts: inventoryRows.filter(
      (row) => row.tenantKey === tenant && row.artifactFamily === 'report-artifact',
    ).length,
    factLineage: {
      source: LINEAGE_JSON,
      conflictMetrics: lineageConflicts.map((entry) => entry.metric),
      singleSourceMetrics: lineageSingle.map((entry) => entry.metric),
      quotableFigures:
        lineageConflicts.length === 0 && lineageSingle.length === 0
          ? 'all corroborated'
          : 'none without an explicit status caveat',
    },
    surfaces,
    status: NOT_ACTIVE,
  };

  writeJson(path.join(outDir, tenant, 'layer4-projection-refresh-summary.json'), json);
  writeText(
    path.join(outDir, tenant, 'layer4-projection-refresh-summary.md'),
    [
      `# Layer 4 projection refresh — ${tenant}`,
      '',
      'Mode: readiness report only. No runtime surface, database projection, or product cube was refreshed.',
      '',
      '## Fact lineage before quoting any figure',
      '',
      `Source: \`${LINEAGE_JSON}\``,
      '',
      lineageConflicts.length
        ? `**${lineageConflicts.length} metric(s) are \`CONFLICT\` for this tenant and must not be quoted at all:** ${lineageConflicts
            .map((entry) => `\`${entry.metric}\``)
            .join(', ')}.`
        : 'No `CONFLICT` metrics for this tenant.',
      '',
      lineageSingle.length
        ? `${lineageSingle.length} metric(s) are \`ONE_SOURCE\` and may only be quoted with that caveat stated: ${lineageSingle
            .map((entry) => `\`${entry.metric}\``)
            .join(', ')}.`
        : 'No `ONE_SOURCE` metrics for this tenant.',
      '',
      '## Surface readiness',
      '',
      '| Surface | Local artefact | Readiness | Refreshed | Blocked by |',
      '| --- | --- | --- | --- | --- |',
      ...surfaces.map(
        (surface) =>
          `| ${surface.surface} | \`${surface.localArtefact}\` | ${surface.readiness} | no | ${surface.blockedBy} |`,
      ),
      '',
      `Status: \`${NOT_ACTIVE}\``,
      '',
    ].join('\n'),
  );

  return json;
}

// --------------------------------------------------------------------------------------
// main
// --------------------------------------------------------------------------------------

function readInventory(outDir) {
  const inventoryPath = path.join(outDir, 'inventory', 'truth-inventory.csv');
  if (!fs.existsSync(inventoryPath)) return [];
  const parsed = Papa.parse(fs.readFileSync(inventoryPath, 'utf8').trim(), {
    header: true,
    skipEmptyLines: true,
  });
  return parsed.data;
}

async function main() {
  const args = parseArgs(process.argv);
  const generatedAt = new Date().toISOString();
  const outDir = abs(args.out);
  fs.mkdirSync(outDir, { recursive: true });

  const { registry, activeByTenant } = readRegistry();
  if (args.tenants.includes('all')) {
    args.tenants = registry.activeTenants.map((tenant) => tenant.tenantKey);
  }
  const contract = readManifestContract();
  const lineage = readLineage();
  const profiles = await readMappingProfiles();
  const layer3ValidationScaffold = await buildLayer3ValidationScaffold(profiles);
  const inventoryRows = readInventory(outDir);

  const analyses = new Map();
  const allLayerRows = [];
  const allClaimRows = [];
  const allAdapterFamilyRows = [];
  const allAdapterDryRunRows = [];
  const allAdapterDimensionRows = [];
  const packages = new Map();
  const layer2 = new Map();
  const layer3 = new Map();
  const layer4 = new Map();

  for (const tenant of args.tenants) {
    const activeRoot = activeByTenant.get(tenant);
    if (!activeRoot) {
      throw new Error(
        `Tenant "${tenant}" has no registry-declared active root. Identity is declared, never inferred — add it to ${REGISTRY} first.`,
      );
    }
    const analysis = analyseTenant(tenant, activeRoot, contract, lineage);
    analyses.set(tenant, analysis);

    const layers = layerMatrixRows(analysis);
    const claims = claimRows(analysis);
    allLayerRows.push(...layers);
    allClaimRows.push(...claims);

    const adapters = layer2Rows(analysis, contract, profiles);
    allAdapterFamilyRows.push(...adapters.familyRows);
    allAdapterDryRunRows.push(...adapters.dryRunRows);
    allAdapterDimensionRows.push(...adapters.dimensionRows);
    layer2.set(tenant, adapters);
    writeCsv(
      path.join(outDir, tenant, 'layer2-adapter-reconciliation.csv'),
      Object.keys(adapters.dimensionRows[0] ?? { tenantKey: '', contractFile: '' }),
      adapters.dimensionRows,
    );

    if (args.writePackage) {
      packages.set(tenant, writeGovernedPackage(analysis, contract, claims, generatedAt));
    }
    layer3.set(tenant, writeLayer3Summary(outDir, analysis, claims));
    layer4.set(tenant, writeLayer4Summary(outDir, analysis, inventoryRows));
  }

  writeCsv(path.join(outDir, 'layer-refresh-matrix.csv'), Object.keys(allLayerRows[0]), allLayerRows);
  writeCsv(
    path.join(outDir, 'claim-reconciliation-matrix.csv'),
    [
      'claimId',
      'tenantKey',
      'claimType',
      'claim',
      'valueAsserted',
      'assertingFiles',
      'conflictState',
      'authoritativeCandidate',
      'allowedUse',
      'blockedNarrative',
      'recommendedNextEvidence',
      'smeReviewer',
      'status',
    ],
    allClaimRows,
  );

  writeCsv(
    path.join(outDir, 'adapter-gap-register.csv'),
    Object.keys(allAdapterFamilyRows[0]),
    allAdapterFamilyRows,
  );
  writeCsv(
    path.join(outDir, 'layer2-adapter-dry-run.csv'),
    Object.keys(allAdapterDryRunRows[0] ?? { tenantKey: '', mappingProfile: '' }),
    allAdapterDryRunRows,
  );
  writeCsv(
    path.join(outDir, 'layer2-adapter-reconciliation.csv'),
    Object.keys(allAdapterDimensionRows[0] ?? { tenantKey: '', contractFile: '' }),
    allAdapterDimensionRows,
  );
  writeJson(
    path.join(outDir, 'layer2-adapter-family-coverage-registry.json'),
    adapterFamilyCoverageRegistry(contract, profiles),
  );
  const layer2Failures = layer2DryRunFailureReport(
    generatedAt,
    args.tenants,
    allAdapterFamilyRows,
    allAdapterDryRunRows,
    allAdapterDimensionRows,
  );
  writeJson(path.join(outDir, 'layer2-adapter-dry-run-failures.json'), layer2Failures);
  const layer2FailureClassification = layer2FailureClassificationReport(generatedAt, layer2Failures, analyses);
  writeJson(
    path.join(outDir, 'layer2-dry-run-failure-classification.json'),
    layer2FailureClassification,
  );
  const layer2CodeOnlyAliasImpact = layer2CodeOnlyAliasImpactReport(generatedAt, layer2FailureClassification);
  writeJson(
    path.join(outDir, 'layer2-code-only-alias-impact.json'),
    layer2CodeOnlyAliasImpact,
  );
  const layer2SemanticDecisionLedger = layer2SemanticDecisionLedgerReport(generatedAt, layer2FailureClassification);
  writeJson(
    path.join(outDir, 'layer2-semantic-decision-ledger.json'),
    layer2SemanticDecisionLedger,
  );
  if (layer3ValidationScaffold) {
    writeJson(path.join(outDir, 'layer3-validation-scaffold.json'), layer3ValidationScaffold);
  }

  const gateRows = hardGateRows(args.tenants, analyses);
  writeCsv(path.join(outDir, 'hard-gate-register.csv'), Object.keys(gateRows[0]), gateRows);

  const summary = {
    generatedAt,
    generatedBy: 'scripts/audit/tenant-layer-refresh.mjs',
    tenants: args.tenants,
    mode: 'local-offline-refresh-preparation',
    status: NOT_ACTIVE,
    factLineageSource: LINEAGE_JSON,
    layer2DryRunFailures: layer2Failures.summary,
    layer2SemanticDecisionLedger: layer2SemanticDecisionLedger.summary,
    layer3ValidationScaffold: layer3ValidationScaffold
      ? {
          canonicalObjectDefinitions: layer3ValidationScaffold.canonicalObjectDefinitions,
          factAuthorityDefinitions: layer3ValidationScaffold.factAuthorityDefinitions,
          relationshipDictionaryEntries: layer3ValidationScaffold.relationshipDictionaryEntries,
          objectRegistryGaps: layer3ValidationScaffold.objectRegistryGaps.length,
          factAuthorityGaps: layer3ValidationScaffold.factAuthorityGaps.length,
          relationshipDictionaryGaps: layer3ValidationScaffold.relationshipDictionaryGaps.length,
        }
      : 'not available',
    perTenant: Object.fromEntries(
      args.tenants.map((tenant) => {
        const analysis = analyses.get(tenant);
        const claims = allClaimRows.filter((claim) => claim.tenantKey === tenant);
        return [
          tenant,
          {
            activeRoot: analysis.activeRoot,
            layerRoots: analysis.roots.map((root) => ({
              layer: root.layer,
              path: root.relativePath,
              present: root.present,
              files: root.files.length,
              truthEligibility: root.truthEligibility,
            })),
            claims: {
              total: claims.length,
              byState: claims.reduce((counts, claim) => {
                counts[claim.conflictState] = (counts[claim.conflictState] ?? 0) + 1;
                return counts;
              }, {}),
            },
            workstreamCoverage: analysis.workstreamRows.reduce((counts, row) => {
              counts[row.coverageState] = (counts[row.coverageState] ?? 0) + 1;
              return counts;
            }, {}),
            governedPackage: packages.get(tenant)?.packageRoot ?? 'not written',
            layer2: {
              mappingProfilesImplemented: layer2.get(tenant).profileCount,
              workstreamsWithNoImplementedAdapter: layer2
                .get(tenant)
                .familyRows.filter((row) => row.adapterState === 'no-implemented-adapter').length,
              profilesThatWouldRun: layer2
                .get(tenant)
                .dryRunRows.filter((row) => row.dryRunResult === 'would-run').length,
              dimensionsThatWouldRun: layer2
                .get(tenant)
                .dimensionRows.filter((row) => row.adapterState === 'would-run').length,
              dimensionFailures: layer2
                .get(tenant)
                .dimensionRows.filter((row) => row.adapterState !== 'would-run').length,
              adaptersExecuted: 0,
            },
            layer3: layer3.get(tenant),
            layer4: layer4.get(tenant),
          },
        ];
      }),
    ),
    closedGates: gateRows.filter((row) => row.executedInThisRun === 'no').length,
  };
  writeJson(path.join(outDir, 'summary.json'), summary);

  const md = [
    '# Layer 1-4 refresh preparation',
    '',
    `Generated: ${generatedAt}`,
    `Tenants: ${args.tenants.map((tenant) => `\`${tenant}\``).join(', ')}`,
    `Mode: local/offline refresh preparation. Status: \`${NOT_ACTIVE}\``,
    '',
    'Evidence for each tenant is derived only from that tenant\'s own files. No tenant\'s facts were used to fill another\'s gaps.',
    '',
    '## Layer roots per tenant',
    '',
    '| Tenant | Layer | Artifact group | Path | Files | Truth eligibility | Refresh locally |',
    '| --- | --- | --- | --- | ---: | --- | --- |',
    ...allLayerRows.map(
      (row) =>
        `| ${row.tenantKey} | ${row.layer} | ${row.artifactGroup} | \`${row.path}\` | ${row.present === 'yes' ? row.fileCount : '—'} | ${row.truthEligibility} | ${row.refreshableLocally} |`,
    ),
    '',
    '## Claim reconciliation',
    '',
    '| Tenant | Conflict state | Claims |',
    '| --- | --- | ---: |',
    ...args.tenants.flatMap((tenant) => {
      const byState = summary.perTenant[tenant].claims.byState;
      return Object.entries(byState)
        .sort()
        .map(([state, count]) => `| ${tenant} | \`${state}\` | ${count} |`);
    }),
    '',
    '## Workstream coverage',
    '',
    'A workstream counts as covered only when every canonical target resolves, carries rows, and matches the declared column contract.',
    '',
    '| Tenant | Covered | Partial | Missing |',
    '| --- | ---: | ---: | ---: |',
    ...args.tenants.map((tenant) => {
      const coverage = summary.perTenant[tenant].workstreamCoverage;
      return `| ${tenant} | ${coverage.covered ?? 0} | ${coverage.partial ?? 0} | ${coverage.missing ?? 0} |`;
    }),
    '',
    '## Layer 2 adapters',
    '',
    `Implemented mapping profiles in \`src/lib/enterprise-data/source-adapters/mapping-profiles.ts\`: **${
      profiles ? profiles.length : 'unknown'
    }**, covering source classes ${
      profiles ? [...new Set(profiles.map((profile) => `\`${profile.sourceClass}\``))].join(', ') : 'unknown'
    }, against ${contract.workstreams.clientFacingWorkstreams.length} declared workstream adapter families.`,
    '',
    '| Tenant | Workstreams with no implemented adapter | Profiles that would run on this tenant | Adapters executed |',
    '| --- | ---: | ---: | ---: |',
    ...args.tenants.map((tenant) => {
      const detail = summary.perTenant[tenant].layer2;
      return `| ${tenant} | ${detail.workstreamsWithNoImplementedAdapter} | ${detail.profilesThatWouldRun} | ${detail.adaptersExecuted} |`;
    }),
    '',
    `Machine-readable Layer 2 dry-run failures: **${layer2Failures.summary.totalFailures}** total (${layer2Failures.summary.familyFailures} family, ${layer2Failures.summary.profileFailures} profile, ${layer2Failures.summary.dimensionFailures} dimension).`,
    `Layer 2 failure classifications: **${layer2FailureClassification.summary.uniqueProfileFailuresClassified}** unique profile failures (${Object.entries(layer2FailureClassification.summary.byRecommendedAction)
      .map(([action, count]) => `${count} ${action}`)
      .join(', ') || '0 classified'}).`,
    `Code-only alias impact, if activated in a future change: **${layer2CodeOnlyAliasImpact.summary.wouldClearProfileFailuresIfActivated}** profile failures would clear; **${layer2CodeOnlyAliasImpact.summary.remainingHardGateDecisions}** remain hard-gated.`,
    `Semantic decision ledger: **${layer2SemanticDecisionLedger.summary.semanticDecisionProfiles}** profiles require explicit semantic alias approval; **${layer2SemanticDecisionLedger.summary.activationReadyProfiles}** are activation-ready from this report.`,
    '',
    'Adapter gaps are recorded, not filled. No adapter was invented and none was executed.',
    '',
    '## Outputs',
    '',
    '- `layer-refresh-matrix.csv` — every layer root per tenant with eligibility and gate.',
    '- `claim-reconciliation-matrix.csv` — derived conflicts, duplicates, coverage gaps, and fact-lineage status.',
    '- `adapter-gap-register.csv` — declared adapter family per workstream vs what is implemented.',
    '- `layer2-adapter-dry-run.csv` — required-field satisfaction per mapping profile per tenant.',
    '- `layer2-adapter-reconciliation.csv` — canonical dimension to adapter-family reconciliation for all tenants.',
    '- `layer2-adapter-family-coverage-registry.json` — declared families and implemented mapping profiles.',
    '- `layer2-adapter-dry-run-failures.json` — machine-readable dry-run failures.',
    '- `layer2-dry-run-failure-classification.json` — machine-readable action classification for dry-run failures.',
    '- `layer2-code-only-alias-impact.json` — report-only estimate of mechanically safe alias candidates.',
    '- `layer2-semantic-decision-ledger.json` — report-only ledger of semantic alias approvals still required.',
    '- `<tenant>/layer2-adapter-reconciliation.csv`',
    '- `hard-gate-register.csv` — actions that require explicit approval; none were executed.',
    '- `<tenant>/layer3-canonical-refresh-summary.{md,json}`',
    '- `<tenant>/layer4-projection-refresh-summary.{md,json}`',
    ...(args.writePackage
      ? args.tenants.map(
          (tenant) => `- \`datasets/tenant-inputs/${tenant}/${PACKAGE_ID}/\` — Layer 1 governed intake draft package.`,
        )
      : []),
    '',
    '## What was not done',
    '',
    '- The registry was not changed.',
    '- No active tenant input root was written.',
    '- No loader, data-plane write, or retrieval index ran.',
    '- No product or runtime surface was changed.',
    '- No file was retired, moved, or deleted.',
    '',
  ].join('\n');
  writeText(path.join(outDir, 'summary.md'), md);

  console.log(`tenant-layer-refresh: ${args.tenants.join(', ')}`);
  console.log(`  layer rows: ${allLayerRows.length}  claims: ${allClaimRows.length}  gates: ${gateRows.length}`);
  console.log(`  report: ${args.out}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
