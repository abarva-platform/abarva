import path from "node:path";
import fs from "node:fs/promises";
import { readPack } from "./reconcile";
import { PACK_FILES, NOTICE } from "./scenario";
import { parseIngestionDocument } from "@/lib/ingestion/document-upload-parser";

// PDF.js uses a Node worker. This separate read process also avoids Jest VM
// dynamic-import constraints without mocking or substituting PDF text.
void readPack(path.resolve(process.argv[2]))
  .then(async (snapshot) => {
    const ingestion: Record<
      string,
      {
        method: string;
        chars: number;
        syntheticNotice: boolean;
        warnings: string[];
      }
    > = {};
    for (const file of PACK_FILES) {
      const parsed = await parseIngestionDocument({
        filename: file,
        bytes: await fs.readFile(path.resolve(process.argv[2], file)),
        cacheScope: "offline-synthetic-compatibility",
      });
      ingestion[file] = {
        method: parsed.parseMethod,
        chars: parsed.text.length,
        syntheticNotice: parsed.text.includes(NOTICE),
        warnings: parsed.warnings,
      };
    }
    process.stdout.write(JSON.stringify({ ...snapshot, ingestion }));
  })
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
