/** PPTX -> PDF -> one PNG per slide. The visual reviewer reads pixels, not XML. */
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const SOFFICE = process.env.SOFFICE ?? "/Applications/LibreOffice.app/Contents/MacOS/soffice";

export function renderSlidePngs(pptxPath: string, outDir: string, dpi = 90): string[] {
  fs.mkdirSync(outDir, { recursive: true });
  execFileSync(
    SOFFICE,
    ["--headless", "--convert-to", "pdf", "--outdir", outDir, pptxPath],
    { stdio: "pipe", timeout: 240_000 },
  );
  const pdf = path.join(outDir, `${path.basename(pptxPath, ".pptx")}.pdf`);
  if (!fs.existsSync(pdf)) throw new Error(`soffice produced no PDF for ${pptxPath}`);
  execFileSync("pdftoppm", ["-png", "-r", String(dpi), pdf, path.join(outDir, "slide")], {
    stdio: "pipe",
    timeout: 240_000,
  });
  return fs
    .readdirSync(outDir)
    .filter((f) => f.startsWith("slide-") && f.endsWith(".png"))
    .sort()
    .map((f) => path.join(outDir, f));
}
