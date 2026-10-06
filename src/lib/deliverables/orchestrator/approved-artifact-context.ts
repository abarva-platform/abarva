type DeliverableVersionPointer = {
  id: string;
  status: string;
  signed_off_version: number | null;
};

type DeliverableVersionLink = {
  deliverable_id: string;
  version: number;
  structured_data: unknown;
};

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

/** Resolve only generated artifacts linked to the exact human-signed version. */
export function approvedGeneratedArtifactIds(args: {
  deliverables: readonly DeliverableVersionPointer[];
  versions: readonly DeliverableVersionLink[];
}): string[] {
  const signedVersionByDeliverable = new Map(
    args.deliverables
      .filter(
        (deliverable) =>
          !["superseded", "rejected"].includes(
            deliverable.status.toLowerCase(),
          ) &&
          typeof deliverable.signed_off_version === "number" &&
          Number.isInteger(deliverable.signed_off_version),
      )
      .map((deliverable) => [deliverable.id, deliverable.signed_off_version]),
  );
  const ids = new Set<string>();

  for (const version of args.versions) {
    if (
      signedVersionByDeliverable.get(version.deliverable_id) !== version.version
    ) {
      continue;
    }
    const artifactId = record(version.structured_data).generated_artifact_id;
    if (typeof artifactId === "string" && artifactId.trim()) {
      ids.add(artifactId.trim());
    }
  }
  return [...ids];
}
