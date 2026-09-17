interface ContractOwnership {
  contract_id: string;
  role: "canonical_writer" | "evidence_only";
  canonical_writer_dataset_version?: string;
  evidence_only_dataset_versions?: string[];
}

interface PackageOwnership {
  tenant_key: string;
  dataset_version: string;
  contracts: ContractOwnership[];
}

interface OwnershipManifest {
  schema_version: number;
  packages: PackageOwnership[];
}

export interface EvidenceOnlyPair {
  tenantKey: string;
  contractId: string;
  evidenceDatasetVersion: string;
  writerDatasetVersion: string;
}

export function evidenceOnlyPairs(value: unknown): EvidenceOnlyPair[] {
  const manifest = value as OwnershipManifest;
  if (manifest?.schema_version !== 1 || !Array.isArray(manifest.packages)) {
    throw new Error("Invalid opportunity ownership manifest");
  }
  const pairs: EvidenceOnlyPair[] = [];
  const seen = new Set<string>();
  for (const entry of manifest.packages) {
    if (!entry?.tenant_key || !entry.dataset_version || !Array.isArray(entry.contracts)) {
      throw new Error("Incomplete opportunity ownership package");
    }
    for (const contract of entry.contracts) {
      if (contract.role !== "evidence_only") continue;
      const writerVersion = contract.canonical_writer_dataset_version;
      if (!contract.contract_id || !writerVersion) {
        throw new Error("Incomplete evidence-only ownership declaration");
      }
      const writers = manifest.packages.filter((candidate) =>
        candidate.tenant_key === entry.tenant_key &&
        candidate.dataset_version === writerVersion &&
        candidate.contracts?.some((writer) =>
          writer.contract_id === contract.contract_id &&
          writer.role === "canonical_writer" &&
          writer.evidence_only_dataset_versions?.includes(entry.dataset_version),
        ),
      );
      if (writers.length !== 1) throw new Error("Evidence-only contract has no unique canonical writer");
      const key = JSON.stringify([entry.tenant_key, entry.dataset_version, contract.contract_id]);
      if (seen.has(key)) throw new Error("Duplicate evidence-only ownership declaration");
      seen.add(key);
      pairs.push({
        tenantKey: entry.tenant_key,
        contractId: contract.contract_id,
        evidenceDatasetVersion: entry.dataset_version,
        writerDatasetVersion: writerVersion,
      });
    }
  }
  return pairs;
}

export function selectedEvidenceOnlyPairs(
  manifest: unknown,
  tenantKey: string,
  datasetVersion: string,
): EvidenceOnlyPair[] {
  evidenceOnlyPairs(manifest);
  const parsed = manifest as OwnershipManifest;
  const selected = parsed.packages.find((entry) =>
    entry.tenant_key === tenantKey && entry.dataset_version === datasetVersion,
  );
  if (!selected) return [];
  const pairs = evidenceOnlyPairs(manifest).filter((pair) =>
    pair.tenantKey === tenantKey && pair.evidenceDatasetVersion === datasetVersion,
  );
  if (pairs.length > 0 && pairs.length !== selected.contracts.length) {
    throw new Error("Mixed opportunity ownership package needs separate count expectations");
  }
  return pairs;
}

function sqlLiteral(value: string): string {
  return `'${value.replaceAll("'", "''")}'`;
}

export function sourcingExclusionSql(pairs: readonly EvidenceOnlyPair[]): string {
  if (pairs.length === 0) return "";
  const contracts = new Map<string, EvidenceOnlyPair>();
  for (const pair of pairs) {
    contracts.set(JSON.stringify([pair.tenantKey, pair.contractId]), pair);
  }
  const predicates = [...contracts.values()].map((pair) =>
    `(sourcing.tenant_key = ${sqlLiteral(pair.tenantKey)} AND sourcing.contract_id = ${sqlLiteral(pair.contractId)})`,
  ).join(" OR ");
  return `AND NOT EXISTS (
      SELECT 1 WHERE ${predicates}
    )`;
}

export async function canonicalWriterOpportunityCount(
  selectedPairs: readonly EvidenceOnlyPair[],
  readCount: (pair: EvidenceOnlyPair) => Promise<number>,
): Promise<number | null> {
  if (selectedPairs.length === 0) return null;
  let total = 0;
  for (const pair of selectedPairs) {
    const count = await readCount(pair);
    if (!Number.isInteger(count) || count <= 0) {
      throw new Error("Canonical writer opportunity rows are missing");
    }
    total += count;
  }
  return total;
}

export function expectedOpportunityCounts(
  layer3: Record<string, number>,
  layer4: Record<string, number>,
  selectedPairs: readonly EvidenceOnlyPair[],
  canonicalWriterCount: number | null,
): { layer3: Record<string, number>; layer4: Record<string, number> } {
  if (selectedPairs.length === 0) return { layer3, layer4 };
  if (canonicalWriterCount !== null && (!Number.isInteger(canonicalWriterCount) || canonicalWriterCount <= 0)) {
    throw new Error("Canonical writer opportunity rows are missing");
  }
  const projected = canonicalWriterCount === null ? layer4 : {
    ...layer4,
    consumption_sourcing_opportunity_v1_package: canonicalWriterCount,
    source_contract_action_candidate_v1_package: canonicalWriterCount,
    source_contract_claim_card_v1_package: canonicalWriterCount,
    source_ava_grounding_bundle_v1_rows: canonicalWriterCount,
  };
  return {
    layer3: { ...layer3, source_optimization_opportunity: 0, opportunities_not_finance_confirmed: 0 },
    layer4: projected,
  };
}
