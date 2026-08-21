import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { CsvSourceAdapter } from "../../src/lib/enterprise-data/source-adapters/csv-source-adapter";
import type { SourceAdapterInput } from "../../src/lib/enterprise-data/contracts/source-adapter";

/**
 * The firewall asserted where it actually has to hold: on the real ingestion paths, not on the
 * contract library in isolation.
 *
 * Both routes take the same file. Neither may turn a reserved enrichment column into a canonical
 * attribute, and neither may report it in a way that reads as "add a mapping rule".
 */

async function writeCsv(body: string): Promise<string> {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "firewall-"));
  const file = path.join(dir, "04_applications_systems.csv");
  await fs.writeFile(file, body, "utf8");
  return file;
}

function adapterInput(sourcePath: string): SourceAdapterInput {
  return {
    tenantKey: "meridian-health",
    packetId: "pkt-1",
    packetVersion: "v1",
    sourcePath,
    sourceProfile: "applications-systems-v3",
    parserVersion: "csv-adapter/v1",
    mappingProfile: "applications-systems-v3/v1",
    packetFile: {
      path: sourcePath,
      sourceClass: "applications_systems",
      sourceProfile: "applications-systems-v3",
      mappingProfile: "applications-systems-v3/v1",
      adapterKey: "csv",
      evidenceBasis: "source_file",
      required: true,
      expectedDomains: [],
    },
  } as SourceAdapterInput;
}

const HEADER = "tenant_key,system_name,system_category,drv__architecture_role";
const ROW = "meridian-health,Revenue Cycle Mart,SQL Server database/mart,data_mart";

describe("recorded adapter route", () => {
  it("refuses a reserved enrichment column instead of reporting it as unmapped", async () => {
    const file = await writeCsv(`${HEADER}\n${ROW}\n`);
    const result = await new CsvSourceAdapter().parse(adapterInput(file));

    const firewall = result.findings.filter((f) => f.code === "enrichment_column_in_recorded_path");
    expect(firewall).toHaveLength(1);
    expect(firewall[0].severity).toBe("error");
    // "unmapped" would read as an instruction to add the one mapping rule that must never exist.
    expect(result.findings.some((f) => f.sourceField === "drv__architecture_role" && f.code === "source_field_unmapped")).toBe(false);
  });

  it("does not carry the reserved column into any canonical record", async () => {
    const file = await writeCsv(`${HEADER}\n${ROW}\n`);
    const result = await new CsvSourceAdapter().parse(adapterInput(file));

    for (const record of result.records) {
      const keys = Object.keys(record.attributes ?? {});
      expect(keys.some((k) => /architectureRole|drv__/i.test(k))).toBe(false);
    }
  });

  it("does not count the reserved column against mapping coverage", async () => {
    // It is not supposed to have a rule, so treating it as a gap pushes an operator to add one.
    const withCol = await writeCsv(`${HEADER}\n${ROW}\n`);
    const withoutCol = await writeCsv(
      `tenant_key,system_name,system_category\nmeridian-health,Revenue Cycle Mart,SQL Server database/mart\n`,
    );
    const adapter = new CsvSourceAdapter();
    const a = await adapter.parse(adapterInput(withCol));
    const b = await adapter.parse(adapterInput(withoutCol));
    expect(a.mappingCoveragePercent).toBe(b.mappingCoveragePercent);
  });
});
