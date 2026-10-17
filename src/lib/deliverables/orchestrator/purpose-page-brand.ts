import "server-only";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const cached: Partial<
  Record<"light" | "dark", { png: Buffer; aspect: number }>
> = {};
export function purposeBrand(mode: "light" | "dark" = "light") {
  if (!cached[mode]) {
    // Print raster of the existing navbar SVG: its nested images are not portable across renderers.
    const png = readFileSync(
      join(
        process.cwd(),
        `public/brand/nexus/abarva-nexus-navbar-${mode}-print.png`,
      ),
    );
    cached[mode] = { png, aspect: png.readUInt32BE(16) / png.readUInt32BE(20) };
  }
  return cached[mode]!;
}

// Purpose-page reference palette. Kept local to the disabled export experiment.
export const PURPOSE_COLORS = {
  accent: "087F75",
  pale: "EFF4F3",
  ink: "1C2428",
  muted: "536267",
} as const;
