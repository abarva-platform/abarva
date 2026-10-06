import { readFile } from "node:fs/promises";
import { previewRfxReleaseAgainstAuthority } from "../../src/lib/source/rfx-delivery/source-backed-preview";
import type { RfxReleaseSnapshotInput } from "../../src/lib/source/rfx-delivery/release-snapshot";

// Read-only operator preview. Input is a proposed package, not authority or approval evidence.
async function main(): Promise<void> {
  const inputPath = process.argv[2];
  if (!inputPath || process.argv.length !== 3) {
    throw new Error("Usage: preview-rfx-release-preparation <input.json>");
  }

  const input = JSON.parse(await readFile(inputPath, "utf8")) as RfxReleaseSnapshotInput;
  if (!input?.release?.package?.tenantKey || !input.release.package.eventId ||
    !Array.isArray(input.recipientAuthorities)) {
    throw new Error("Input lacks package identity or recipient authorities");
  }
  const result = await previewRfxReleaseAgainstAuthority(input);
  process.stdout.write(JSON.stringify(result) + "\n");
  if (!result.sourceAuthoritiesConsistent) process.exitCode = 2;
}

main().catch(() => {
  process.stderr.write("RFx preparation preview could not verify its input or contact authority.\n");
  process.exitCode = 2;
});
