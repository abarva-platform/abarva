import { readPreparedRfxPackagesForEvent } from "../../src/lib/source/rfx-delivery/prepared-package-repository";

async function main(): Promise<void> {
  const [clientKey, eventId, ...extra] = process.argv.slice(2);
  if (!clientKey || !eventId || extra.length > 0) {
    throw new Error("Usage: inspect-prepared-rfx-packages <tenant-key> <event-id>");
  }

  const result = await readPreparedRfxPackagesForEvent({ clientKey, eventId });
  process.stdout.write(JSON.stringify({
    registryAvailable: result.registryAvailable,
    versions: result.versions,
    issued: false,
    currentAuthorityVerified: false,
  }) + "\n");
  if (!result.registryAvailable) process.exitCode = 2;
}

main().catch(() => {
  process.stderr.write("Prepared RFx package readback could not be completed.\n");
  process.exitCode = 2;
});
