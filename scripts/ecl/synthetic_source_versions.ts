/**
 * Declared identity of each synthetic enterprise source version, read from the
 * registry the Python generator, validator and adapter also read. A version
 * that is not listed is refused. Nothing is read from a dataset name, a folder
 * name or a file name.
 */

import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);
export const sourceVersionRegistryPath = path.join(
  root,
  "datasets/synthetic/source-versions.json",
);

export const GRAIN_ORIGINS = [
  "declared_in_definition",
  "generated_by_formula",
] as const;
export type GrainOrigin = (typeof GRAIN_ORIGINS)[number];

const identityFields = [
  "definition_path",
  "dataset_id",
  "assessment_id",
  "id_namespace",
  "adapter_contract_version",
  "source_system",
] as const;
// One version's value for these can never be another version's.
const exclusiveFields = [
  "definition_path",
  "dataset_id",
  "assessment_id",
  "id_namespace",
] as const;
const entryFields = [
  ...identityFields,
  "base_version",
  "application_grain_origin",
].sort();

export type SourceVersion = {
  /** The registry key the version was resolved by. */
  key: string;
  definition_path: string;
  base_version: string | null;
  dataset_id: string;
  assessment_id: string;
  /** First part of every persisted row id; changing it moves every id. */
  id_namespace: string;
  adapter_contract_version: string;
  source_system: string;
  /** How each application grain the version emits came to exist. */
  application_grain_origin: Record<string, GrainOrigin>;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function readSourceVersions(
  file: string = sourceVersionRegistryPath,
): Map<string, SourceVersion> {
  const document: unknown = JSON.parse(readFileSync(file, "utf8"));
  const declared = isRecord(document) ? document.source_versions : undefined;
  if (
    !isRecord(document) ||
    document.schema_version !== 1 ||
    !isRecord(declared) ||
    Object.keys(declared).length === 0
  ) {
    throw new Error(
      "Synthetic source-version registry is missing or has an unknown schema",
    );
  }
  const versions = new Map<string, SourceVersion>();
  for (const [key, entry] of Object.entries(declared)) {
    if (
      !isRecord(entry) ||
      JSON.stringify(Object.keys(entry).sort()) !== JSON.stringify(entryFields)
    ) {
      throw new Error(
        `Source version ${key} does not declare exactly the registered fields`,
      );
    }
    if (
      identityFields.some(
        (field) => typeof entry[field] !== "string" || !entry[field],
      )
    ) {
      throw new Error(`Source version ${key} has an empty identity field`);
    }
    const grains = entry.application_grain_origin;
    if (
      !isRecord(grains) ||
      Object.keys(grains).length === 0 ||
      Object.values(grains).some(
        (origin) => !(GRAIN_ORIGINS as readonly unknown[]).includes(origin),
      )
    ) {
      throw new Error(
        `Source version ${key} declares an unknown application grain origin`,
      );
    }
    versions.set(key, { ...(entry as Omit<SourceVersion, "key">), key });
  }
  for (const field of exclusiveFields) {
    const values = [...versions.values()].map((version) => version[field]);
    if (new Set(values).size !== values.length) {
      throw new Error(`Two source versions declare the same ${field}`);
    }
  }
  for (const key of versions.keys()) {
    const seen = [key];
    for (
      let base = versions.get(key)!.base_version;
      base !== null;
      base = versions.get(base)!.base_version
    ) {
      if (!versions.has(base) || seen.includes(base)) {
        throw new Error(
          `Source version ${key} has an unregistered or circular base version`,
        );
      }
      seen.push(base);
    }
  }
  return versions;
}

/** The one registered version with this key. An unknown key is refused. */
export function resolveSourceVersion(
  key: string,
  file: string = sourceVersionRegistryPath,
): SourceVersion {
  const version = readSourceVersions(file).get(key);
  if (!version) {
    throw new Error(`Unregistered synthetic source version: ${key}`);
  }
  return version;
}
