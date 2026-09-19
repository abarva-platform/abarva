import { createHash } from "crypto";
import { readFile } from "fs/promises";
import path from "path";

import type {
  SourceOperationalPackage,
  SourceOperationalProvider,
  SourceOperationalProviderIdentity,
  SourceOperationalRelease,
  SourceOperationalReleaseManifest,
  SourceOperationalValidationSummary,
} from "@/lib/source/operational/types";
import {
  AIRLINE_SOURCE_OPERATIONAL_EVENT_ID,
  AIRLINE_SOURCE_OPERATIONAL_RELEASE_HASH_SHA256,
  AIRLINE_SOURCE_OPERATIONAL_RELEASE_ID,
} from "@/lib/source/operational/types";

export const AIRLINE_SOURCE_OPERATIONAL_RELEASE_DIR = path.join(
  process.cwd(),
  "clients",
  "airline-demo-new",
  "23-source-operational-demo",
  AIRLINE_SOURCE_OPERATIONAL_RELEASE_ID,
);

interface FileSourceOperationalProviderOptions {
  releaseDir?: string;
}

export class FileSourceOperationalProvider implements SourceOperationalProvider {
  private packagePromise: Promise<SourceOperationalPackage> | null = null;

  constructor(
    private readonly options: FileSourceOperationalProviderOptions = {},
  ) {}

  get identity(): SourceOperationalProviderIdentity {
    return {
      provider: "SourceOperationalProvider",
      mode: "file_release_package",
      releaseId: AIRLINE_SOURCE_OPERATIONAL_RELEASE_ID,
      releaseHashSha256: AIRLINE_SOURCE_OPERATIONAL_RELEASE_HASH_SHA256,
      tenantKey: "airline-demo-new",
      eventId: AIRLINE_SOURCE_OPERATIONAL_EVENT_ID,
    };
  }

  async getRelease(): Promise<SourceOperationalPackage> {
    this.packagePromise ??= readOperationalReleasePackage(
      this.options.releaseDir ?? AIRLINE_SOURCE_OPERATIONAL_RELEASE_DIR,
    );
    return this.packagePromise;
  }
}

export function createFileSourceOperationalProvider(
  options: FileSourceOperationalProviderOptions = {},
): SourceOperationalProvider {
  return new FileSourceOperationalProvider(options);
}

export async function readOperationalReleasePackage(
  releaseDir = AIRLINE_SOURCE_OPERATIONAL_RELEASE_DIR,
): Promise<SourceOperationalPackage> {
  const [releaseRaw, manifestRaw, validationRaw] = await Promise.all([
    readFile(path.join(releaseDir, "release.json"), "utf8"),
    readFile(path.join(releaseDir, "release-manifest.json"), "utf8"),
    readFile(path.join(releaseDir, "validation-summary.json"), "utf8"),
  ]);

  const release = JSON.parse(releaseRaw) as SourceOperationalRelease;
  const manifest = JSON.parse(manifestRaw) as SourceOperationalReleaseManifest;
  const validation = JSON.parse(
    validationRaw,
  ) as SourceOperationalValidationSummary;

  const releaseHashSha256 = sha256(JSON.stringify(canonicalize(release)));

  if (releaseHashSha256 !== manifest.releaseHashSha256) {
    throw new Error(
      `Source operational release hash mismatch: manifest=${manifest.releaseHashSha256} actual=${releaseHashSha256}`,
    );
  }
  if (manifest.releaseId !== release.event.releaseId) {
    throw new Error(
      `Source operational release id mismatch: manifest=${manifest.releaseId} event=${release.event.releaseId}`,
    );
  }
  if (manifest.tenantKey !== release.event.tenantKey) {
    throw new Error(
      `Source operational tenant mismatch: manifest=${manifest.tenantKey} event=${release.event.tenantKey}`,
    );
  }
  if (validation.releaseId !== manifest.releaseId || validation.ok !== true) {
    throw new Error(
      `Source operational validation is not approved for ${manifest.releaseId}`,
    );
  }

  return { release, manifest, validation };
}

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.entries(value)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, nested]) => [key, canonicalize(nested)]),
  );
}
