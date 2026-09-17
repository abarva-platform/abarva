import fs from "node:fs";
import path from "node:path";

const DEFAULT_MANIFEST = "datasets/source/opportunity-ownership-manifest.json";

function requiredString(value, label) {
  if (typeof value !== "string" || value.trim() !== value || value.length === 0) {
    throw new Error(`Invalid opportunity ownership ${label}`);
  }
  return value;
}

function unique(values, label) {
  if (new Set(values).size !== values.length) {
    throw new Error(`Duplicate opportunity ownership ${label}`);
  }
}

export function readOpportunityOwnershipManifest(mode, overridePath) {
  if (overridePath && mode !== "plan") {
    throw new Error("Opportunity ownership manifest override is permitted only in plan mode");
  }
  const filePath = overridePath ?? path.resolve(process.cwd(), DEFAULT_MANIFEST);
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

export function resolveOpportunityOwnership(manifest, args, contractIds, opportunityContractIds) {
  if (manifest?.schema_version !== 1 || !Array.isArray(manifest.packages) || manifest.packages.length === 0) {
    throw new Error("Missing or invalid opportunity ownership manifest");
  }
  const packageKeys = [];
  const assignments = new Map();
  for (const entry of manifest.packages) {
    const tenantKey = requiredString(entry?.tenant_key, "tenant_key");
    const datasetVersion = requiredString(entry?.dataset_version, "dataset_version");
    const packageDir = requiredString(entry?.package_dir, "package_dir");
    if (path.isAbsolute(packageDir) || packageDir.split(/[\\/]/).includes("..")) {
      throw new Error("Opportunity ownership package_dir must be repository-relative");
    }
    const packageKey = `${tenantKey}\0${datasetVersion}`;
    packageKeys.push(packageKey);
    if (!Array.isArray(entry.contracts) || entry.contracts.length === 0) {
      throw new Error("Missing opportunity ownership contract declarations");
    }
    unique(entry.contracts.map((contract) => requiredString(contract?.contract_id, "contract_id")), "contract_id");
    for (const contract of entry.contracts) {
      if (contract.role !== "canonical_writer" && contract.role !== "evidence_only") {
        throw new Error("Invalid opportunity ownership role");
      }
      if (contract.role === "canonical_writer") {
        if (!Array.isArray(contract.evidence_only_dataset_versions) || contract.evidence_only_dataset_versions.length === 0) {
          throw new Error("Canonical writer must declare its evidence-only contributors");
        }
        unique(contract.evidence_only_dataset_versions.map((version) => requiredString(version, "evidence_only_dataset_version")), "evidence_only_dataset_version");
      } else {
        requiredString(contract.canonical_writer_dataset_version, "canonical_writer_dataset_version");
      }
      const key = `${tenantKey}\0${contract.contract_id}`;
      const group = assignments.get(key) ?? [];
      group.push({ datasetVersion, packageDir, contract });
      assignments.set(key, group);
    }
  }
  unique(packageKeys, "package identity");

  for (const group of assignments.values()) {
    const writers = group.filter((entry) => entry.contract.role === "canonical_writer");
    if (writers.length !== 1) throw new Error("Opportunity ownership requires exactly one canonical writer");
    const writer = writers[0];
    const contributors = group.filter((entry) => entry.contract.role === "evidence_only");
    const declared = writer.contract.evidence_only_dataset_versions;
    if (declared.length !== contributors.length || contributors.some((entry) =>
      entry.contract.canonical_writer_dataset_version !== writer.datasetVersion || !declared.includes(entry.datasetVersion)
    )) {
      throw new Error("Conflicting opportunity ownership declarations");
    }
  }

  unique(contractIds, "package contract_id");
  const contractSet = new Set(contractIds);
  if (opportunityContractIds.some((contractId) => !contractSet.has(contractId))) {
    throw new Error("Opportunity references a contract outside its package");
  }
  const selected = manifest.packages.find((entry) =>
    entry.tenant_key === args.tenantKey && entry.dataset_version === args.datasetVersion
  );
  if (!selected) {
    if (contractIds.some((contractId) => assignments.has(`${args.tenantKey}\0${contractId}`))) {
      throw new Error("Missing opportunity ownership declaration for package contract");
    }
    return { canonical_contract_ids: contractIds, evidence_only_contract_ids: [] };
  }
  if (path.resolve(process.cwd(), selected.package_dir) !== path.resolve(args.packageDir)) {
    throw new Error("Opportunity ownership package directory mismatch");
  }
  const declaredContracts = new Set(selected.contracts.map((contract) => contract.contract_id));
  if (declaredContracts.size !== contractSet.size || contractIds.some((contractId) => !declaredContracts.has(contractId))) {
    throw new Error("Missing opportunity ownership declaration for package contract");
  }
  return {
    canonical_contract_ids: selected.contracts.filter((contract) => contract.role === "canonical_writer").map((contract) => contract.contract_id),
    evidence_only_contract_ids: selected.contracts.filter((contract) => contract.role === "evidence_only").map((contract) => contract.contract_id),
  };
}
