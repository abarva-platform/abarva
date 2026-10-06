import type { PreparedRfxPackageVersion } from "@/lib/source/rfx-delivery/prepared-package-repository";

/**
 * What the workspace may honestly say about RFx release.
 *
 * The reader returns `registryAvailable: false` both when the store cannot be
 * read and when a row fails its integrity check. Either way the answer is "we
 * do not know", which is a different statement from "nothing was prepared" and
 * must render differently — a surface that reports an unread store as "none"
 * tells the operator a package was never prepared when one may well have been.
 */
export type ReleaseStateView =
  | { kind: "unread" }
  | { kind: "none" }
  | {
      kind: "prepared";
      version: number;
      recipientCount: number;
      artifactCount: number;
      approvedAt: string;
    };

export function describeReleaseState(input: {
  registryAvailable: boolean;
  versions: readonly PreparedRfxPackageVersion[];
}): ReleaseStateView {
  if (!input.registryAvailable) return { kind: "unread" };
  if (input.versions.length === 0) return { kind: "none" };

  // The query orders by version descending, but the current version is a
  // property of the data, not of the query that fetched it. Taking the first
  // row would make this correct only for as long as nobody changes that ORDER
  // BY, and a wrong "current version" is the kind of error that reads as true.
  const current = input.versions.reduce((latest, candidate) =>
    candidate.version > latest.version ? candidate : latest,
  );

  return {
    kind: "prepared",
    version: current.version,
    recipientCount: current.recipientCount,
    artifactCount: current.artifactCount,
    approvedAt: current.approvedAt,
  };
}

export function releaseStateLabel(view: ReleaseStateView): string {
  switch (view.kind) {
    case "unread":
      return "Not recorded";
    case "none":
      return "No package prepared";
    case "prepared":
      return `Version ${view.version} prepared · ${view.recipientCount} recipient${
        view.recipientCount === 1 ? "" : "s"
      } · ${view.artifactCount} artefact${view.artifactCount === 1 ? "" : "s"}`;
  }
}
