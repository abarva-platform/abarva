import { describeReleaseState, releaseStateLabel } from "./release-state-view";
import type { PreparedRfxPackageVersion } from "@/lib/source/rfx-delivery/prepared-package-repository";

const version = (
  n: number,
  over: Partial<PreparedRfxPackageVersion> = {},
): PreparedRfxPackageVersion => ({
  packageId: "pkg-1",
  packageVersionId: `pkg-1-v${n}`,
  version: n,
  snapshotSha256: "a".repeat(64),
  artifactCount: 3,
  recipientCount: 4,
  expiresAt: "2026-12-01T00:00:00Z",
  approvedAt: "2026-11-01T00:00:00Z",
  state: "prepared",
  ...over,
});

describe("describeReleaseState", () => {
  // The distinction the whole projection exists for.
  it("reports an unreadable store as unread, never as nothing prepared", () => {
    expect(describeReleaseState({ registryAvailable: false, versions: [] })).toEqual({
      kind: "unread",
    });
    expect(
      describeReleaseState({ registryAvailable: false, versions: [version(2)] }),
    ).toEqual({ kind: "unread" });
  });

  it("reports a readable store with no versions as none prepared", () => {
    expect(describeReleaseState({ registryAvailable: true, versions: [] })).toEqual({
      kind: "none",
    });
  });

  it("reports the prepared version with its recipient and artefact counts", () => {
    const view = describeReleaseState({
      registryAvailable: true,
      versions: [version(1, { recipientCount: 2, artifactCount: 7 })],
    });
    expect(view).toEqual({
      kind: "prepared",
      version: 1,
      recipientCount: 2,
      artifactCount: 7,
      approvedAt: "2026-11-01T00:00:00Z",
    });
  });

  // The negative control for the reduce: if it took the first row instead of
  // the highest version, every other case here would still pass.
  it("takes the highest version even when the rows arrive out of order", () => {
    const view = describeReleaseState({
      registryAvailable: true,
      versions: [version(1), version(3), version(2)],
    });
    expect(view.kind === "prepared" && view.version).toBe(3);
  });

  it("does not treat an expired or superseded row as unread", () => {
    const view = describeReleaseState({
      registryAvailable: true,
      versions: [version(4, { expiresAt: "2020-01-01T00:00:00Z" })],
    });
    expect(view.kind).toBe("prepared");
  });
});

describe("releaseStateLabel", () => {
  it("says Not recorded for an unread store", () => {
    expect(releaseStateLabel({ kind: "unread" })).toBe("Not recorded");
  });

  it("says No package prepared when the store is readable and empty", () => {
    expect(releaseStateLabel({ kind: "none" })).toBe("No package prepared");
  });

  it("singularises a lone recipient and artefact", () => {
    expect(
      releaseStateLabel({
        kind: "prepared",
        version: 2,
        recipientCount: 1,
        artifactCount: 1,
        approvedAt: "2026-11-01T00:00:00Z",
      }),
    ).toBe("Version 2 prepared · 1 recipient · 1 artefact");
  });

  it("pluralises more than one", () => {
    expect(
      releaseStateLabel({
        kind: "prepared",
        version: 2,
        recipientCount: 4,
        artifactCount: 3,
        approvedAt: "2026-11-01T00:00:00Z",
      }),
    ).toBe("Version 2 prepared · 4 recipients · 3 artefacts");
  });
});
