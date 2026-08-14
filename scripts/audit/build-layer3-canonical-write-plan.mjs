#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import Papa from 'papaparse';

const LEGACY_COMPATIBILITY_MAPPING_PROFILES = new Set([
  'applications-systems-estate/v1',
  'enterprise-profile-foundation/v1',
  'enterprise-profile-minimal/v1',
  'evidence-registry-minimal/v1',
]);

function parseArgs(argv) {
  const args = new Map();
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (!arg.startsWith('--')) continue;
    const [key, inlineValue] = arg.slice(2).split('=', 2);
    const value = inlineValue ?? argv[index + 1];
    args.set(key, value);
    if (inlineValue === undefined) index += 1;
  }
  return args;
}

function requireArg(args, name) {
  const value = args.get(name);
  if (!value) throw new Error(`Missing required --${name}`);
  return value;
}

function readCsv(filePath) {
  const parsed = Papa.parse(fs.readFileSync(filePath, 'utf8'), {
    header: true,
    skipEmptyLines: true,
  });
  if (parsed.errors.length > 0) {
    throw new Error(`CSV parse failed for ${filePath}: ${parsed.errors[0].message}`);
  }
  return parsed.data;
}

function countSourceRows(sourceFile) {
  if (!sourceFile || sourceFile === 'none') return 0;
  const parsed = Papa.parse(fs.readFileSync(sourceFile, 'utf8'), {
    header: true,
    skipEmptyLines: true,
  });
  if (parsed.errors.length > 0) {
    throw new Error(`CSV parse failed for ${sourceFile}: ${parsed.errors[0].message}`);
  }
  return parsed.data.length;
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function writeMarkdown(filePath, report) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const lines = [
    '# Layer 3 Canonical Write Plan',
    '',
    `Source SHA: \`${report.sourceSha}\``,
    '',
    'This is a sanitized, report-only canonical write plan. Tenant identifiers are anonymized. No canonical store, registry, graph table, data plane, product projection, or runtime surface is written or activated.',
    '',
    '## Totals',
    '',
    `- Tenants planned: ${report.summary.tenantsPlanned}`,
    `- Layer 2 profile dry-run rows: ${report.summary.layer2ProfileDryRunRows}`,
    `- Profile dry-run rows that would run: ${report.summary.profileRowsWouldRun}`,
    `- Estimated canonical object records that would be written: ${report.summary.wouldWriteCanonicalObjects}`,
    `- Estimated fact values that would be evaluated: ${report.summary.wouldEvaluateFactValues}`,
    `- Canonical objects written: ${report.summary.canonicalObjectsWritten}`,
    `- Canonical store write ready without hard gates: ${report.summary.canonicalStoreWriteReadyWithoutHardGates}`,
    '',
    '## Object Plan',
    '',
    '| Object type | Family | Source rows | Would write | Identity |',
    '| --- | --- | ---: | ---: | --- |',
    ...report.objectPlan.map(
      (row) =>
        `| \`${row.objectType}\` | \`${row.objectFamily}\` | ${row.sourceRows} | ${row.wouldWriteRecords} | \`${row.identityAttributes.join('; ')}\` |`,
    ),
    '',
    '## Fact Plan',
    '',
    '| Fact key | Object type | Value type | Would evaluate | Use policy |',
    '| --- | --- | --- | ---: | --- |',
    ...report.factPlan.map(
      (row) =>
        `| \`${row.factKey}\` | \`${row.objectType}\` | \`${row.valueType}\` | ${row.wouldEvaluateRows} | \`${row.usePolicy}\` |`,
    ),
    '',
    '## Tenant Aliases',
    '',
    '| Tenant | Profiles | Would run | Source rows | Would write objects | Would evaluate facts |',
    '| --- | ---: | ---: | ---: | ---: | ---: |',
    ...report.perTenant.map(
      (row) =>
        `| ${row.tenant} | ${row.profileDryRunRows} | ${row.profileWouldRunRows} | ${row.sourceRows} | ${row.wouldWriteCanonicalObjects} | ${row.wouldEvaluateFactValues} |`,
    ),
    '',
    '## Gates Left Closed',
    '',
    ...report.gatesLeftClosed.map((gate) => `- ${gate}`),
    '',
  ];
  fs.writeFileSync(filePath, lines.join('\n'));
}

function anonymizeTenants(tenantKeys) {
  return new Map(tenantKeys.map((tenantKey, index) => [tenantKey, `tenant-${String(index + 1).padStart(2, '0')}`]));
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function addCount(map, key, value) {
  map.set(key, (map.get(key) ?? 0) + value);
}

function sortByKey(rows, key) {
  return rows.sort((a, b) => String(a[key]).localeCompare(String(b[key])));
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const layerDir = requireArg(args, 'layer-dir');
  const outDir = requireArg(args, 'out-dir');
  const sourceSha = requireArg(args, 'source-sha');

  const [{ BUILT_IN_MAPPING_PROFILES }, layer3] = await Promise.all([
    import('../../src/lib/enterprise-data/source-adapters/mapping-profiles.ts'),
    import('../../src/lib/enterprise-data/contracts/layer3-validation.ts'),
  ]);

  const activeProfiles = BUILT_IN_MAPPING_PROFILES.filter(
    (profile) => !LEGACY_COMPATIBILITY_MAPPING_PROFILES.has(profile.mappingProfile),
  );
  const profilesById = new Map(activeProfiles.map((profile) => [profile.mappingProfile, profile]));
  const dryRunRows = readCsv(path.join(layerDir, 'layer2-adapter-dry-run.csv'));
  const scaffold = JSON.parse(fs.readFileSync(path.join(layerDir, 'layer3-validation-scaffold.json'), 'utf8'));
  const tenantAliases = anonymizeTenants(unique(dryRunRows.map((row) => row.tenantKey)));

  const sourceRowsByFile = new Map();
  const tenantStats = new Map();
  const objectCounts = new Map();
  const factCounts = new Map();
  const profilePlans = [];
  const registryGaps = [];
  const factGaps = [];

  for (const row of dryRunRows) {
    const tenantAlias = tenantAliases.get(row.tenantKey);
    const stats = tenantStats.get(row.tenantKey) ?? {
      tenant: tenantAlias,
      profileDryRunRows: 0,
      profileWouldRunRows: 0,
      sourceRows: 0,
      wouldWriteCanonicalObjects: 0,
      wouldEvaluateFactValues: 0,
    };
    stats.profileDryRunRows += 1;

    const profile = profilesById.get(row.mappingProfile);
    const sourceRows =
      row.bestMatchingSourceFile && row.bestMatchingSourceFile !== 'none'
        ? sourceRowsByFile.get(row.bestMatchingSourceFile) ??
          countSourceRows(row.bestMatchingSourceFile)
        : 0;
    if (row.bestMatchingSourceFile && row.bestMatchingSourceFile !== 'none') {
      sourceRowsByFile.set(row.bestMatchingSourceFile, sourceRows);
    }

    if (row.dryRunResult !== 'would-run' || !profile) {
      tenantStats.set(row.tenantKey, stats);
      continue;
    }

    const targetObjectTypes = unique(profile.rules.map((rule) => rule.targetObjectType)).sort();
    const factAuthorityKeys = unique(
      profile.rules
        .map((rule) => (rule.targetAttribute ? `${rule.targetObjectType}.${rule.targetAttribute}` : ''))
        .filter((factKey) => layer3.getFactAuthorityDefinition(factKey)),
    ).sort();

    for (const objectType of targetObjectTypes) {
      if (!layer3.getCanonicalObjectDefinition(objectType)) registryGaps.push(objectType);
      addCount(objectCounts, objectType, sourceRows);
    }
    for (const factKey of factAuthorityKeys) {
      if (!layer3.getFactAuthorityDefinition(factKey)) factGaps.push(factKey);
      addCount(factCounts, factKey, sourceRows);
    }

    const wouldWriteCanonicalObjects = sourceRows * targetObjectTypes.length;
    const wouldEvaluateFactValues = sourceRows * factAuthorityKeys.length;
    stats.profileWouldRunRows += 1;
    stats.sourceRows += sourceRows;
    stats.wouldWriteCanonicalObjects += wouldWriteCanonicalObjects;
    stats.wouldEvaluateFactValues += wouldEvaluateFactValues;
    tenantStats.set(row.tenantKey, stats);

    profilePlans.push({
      tenant: tenantAlias,
      mappingProfile: profile.mappingProfile,
      sourceClass: profile.sourceClass,
      profileVersion: profile.version ?? '',
      sourceRows,
      targetObjectTypes,
      factAuthorityKeys,
      wouldWriteCanonicalObjects,
      wouldEvaluateFactValues,
      canonicalObjectsWritten: 0,
      status: 'would_plan_no_write',
    });
  }

  const objectPlan = sortByKey(
    [...objectCounts.entries()].map(([objectType, sourceRows]) => {
      const definition = layer3.getCanonicalObjectDefinition(objectType);
      return {
        objectType,
        objectFamily: definition?.objectFamily ?? 'missing_registry_definition',
        canonicalDomain: definition?.canonicalDomain ?? 'missing_registry_definition',
        sourceRows,
        wouldWriteRecords: sourceRows,
        identityAttributes: definition?.identityAttributes ?? [],
        evidenceRequired: definition?.evidenceRequired ?? 'missing_registry_definition',
        canonicalObjectsWritten: 0,
      };
    }),
    'objectType',
  );

  const factPlan = sortByKey(
    [...factCounts.entries()].map(([factKey, sourceRows]) => {
      const definition = layer3.getFactAuthorityDefinition(factKey);
      return {
        factKey,
        objectType: definition?.objectType ?? 'missing_fact_authority',
        attribute: definition?.attribute ?? 'missing_fact_authority',
        valueType: definition?.valueType ?? 'unknown',
        authorityKind: definition?.authorityKind ?? 'missing_fact_authority',
        deterministic: definition?.deterministic ?? false,
        usePolicy: definition?.usePolicy ?? 'must_not_be_model_invented',
        wouldEvaluateRows: sourceRows,
        factsWritten: 0,
      };
    }),
    'factKey',
  );

  const report = {
    generatedAt: new Date().toISOString(),
    generatedBy: 'scripts/audit/build-layer3-canonical-write-plan.mjs',
    sourceSha,
    mode: 'report_only_no_canonical_write_no_registry_activation_no_data_plane_load_no_projection_refresh',
    publicDisclosure:
      'Tenant identifiers are anonymized. Source paths, row-level object names, and source values are intentionally omitted.',
    evidence: {
      layerRefresh: `node scripts/audit/tenant-layer-refresh.mjs --tenant all --out ${layerDir} --no-package`,
      layer3WritePlan: `npm run audit:layer3-canonical-write-plan -- --layer-dir ${layerDir} --out-dir ${outDir} --source-sha ${sourceSha}`,
    },
    summary: {
      tenantsPlanned: tenantAliases.size,
      activeMappingProfiles: activeProfiles.length,
      layer2ProfileDryRunRows: dryRunRows.length,
      profileRowsWouldRun: dryRunRows.filter((row) => row.dryRunResult === 'would-run').length,
      canonicalObjectTypesPlanned: objectPlan.length,
      factAuthorityKeysPlanned: factPlan.length,
      wouldWriteCanonicalObjects: objectPlan.reduce((total, row) => total + row.wouldWriteRecords, 0),
      wouldEvaluateFactValues: factPlan.reduce((total, row) => total + row.wouldEvaluateRows, 0),
      canonicalObjectsWritten: 0,
      factsWritten: 0,
      canonicalStoreWriteReadyWithoutHardGates: false,
    },
    scaffold: {
      canonicalObjectDefinitions: scaffold.canonicalObjectDefinitions,
      factAuthorityDefinitions: scaffold.factAuthorityDefinitions,
      relationshipDictionaryEntries: scaffold.relationshipDictionaryEntries,
      objectRegistryGaps: scaffold.objectRegistryGaps,
      factAuthorityGaps: scaffold.factAuthorityGaps,
      relationshipDictionaryGaps: scaffold.relationshipDictionaryGaps,
      mode: scaffold.mode,
    },
    acceptance: {
      allLayer2ProfileRowsWouldRun: dryRunRows.every((row) => row.dryRunResult === 'would-run'),
      everyPlannedObjectHasRegistryDefinition: registryGaps.length === 0,
      everyPlannedFactHasAuthorityDefinition: factGaps.length === 0,
      canonicalObjectsWrittenRemainZero: true,
      dataPlaneWritesPerformed: false,
      registryActivationPerformed: false,
      projectionRefreshPerformed: false,
    },
    perTenant: [...tenantStats.values()].sort((a, b) => a.tenant.localeCompare(b.tenant)),
    objectPlan,
    factPlan,
    profilePlans: profilePlans.sort((a, b) => a.tenant.localeCompare(b.tenant) || a.mappingProfile.localeCompare(b.mappingProfile)),
    gatesLeftClosed: [
      'No tenant data mutation, move, deletion, or generated prose.',
      'No Azure/Postgres write or data-plane load.',
      'No registry/canonical store activation.',
      'No semantic identity alias activation.',
      'No graph dictionary/object-registry activation.',
      'No graph table materialization.',
      'No Layer 4 projection or product runtime refresh.',
      'No live-client truth claim.',
    ],
  };

  writeJson(path.join(outDir, 'layer3-canonical-write-plan.json'), report);
  writeMarkdown(path.join(outDir, 'layer3-canonical-write-plan.md'), report);
  console.log(
    `layer3-canonical-write-plan: ${report.summary.wouldWriteCanonicalObjects} would-write object record(s), ${report.summary.wouldEvaluateFactValues} fact value(s), 0 written`,
  );
  console.log(`  report: ${outDir}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
