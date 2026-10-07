import fs from "node:fs";
import path from "node:path";
import { originateProspectiveSupplier } from "@/lib/source/candidate-suppliers/originate-prospective-supplier";

/**
 * A supplier a sourcing team wants to approach had nowhere to exist.
 *
 * Every writer of `source.vendor` is a loader, so a supplier only entered the
 * platform by import — yet a supplier is created in the ERP when it starts
 * invoicing, which is after an award. Until then it still needs somewhere to be
 * qualified, sign an NDA and compete.
 *
 * This writes that supplier as `potential`: qualifiable, NDA-capable, and not
 * payable. Not payable is structural, not a flag.
 */

const read = (file: string) =>
  fs.readFileSync(path.join(process.cwd(), file), "utf8");

const migrationRaw = read(
  "supabase/migrations/20261007003000_source_vendor_origination.sql",
);
const migration = migrationRaw.replace(/\s+/g, " ");
/**
 * The DDL with its own prose removed.
 *
 * The migration's comments explain why the table carries no banking column, so
 * asserting the absence of "bank" against the whole file matched the
 * explanation rather than the schema — the residue was the check's own
 * reasoning. Strip `--` lines first and the assertion measures what is
 * declared.
 */
const migrationDdl = migrationRaw
  .split("\n")
  .filter((line) => !line.trim().startsWith("--"))
  .join("\n")
  .replace(/\s+/g, " ");
const vendorTable = read(
  "supabase/migrations/20260803160000_source_sourcing_context_depth_contract.sql",
);
const writer = read(
  "src/lib/source/candidate-suppliers/originate-prospective-supplier.ts",
);

type Call = { sql: string; params: unknown[] };

function harness(clash: unknown[] = [], inserted: unknown[] = [{ vendor_id: "x" }]) {
  const calls: Call[] = [];
  const tx = async <T>(
    fn: (run: (sql: string, params?: unknown[]) => Promise<unknown[]>) => Promise<T>,
  ): Promise<T> =>
    fn(async (sql, params = []) => {
      calls.push({ sql, params });
      if (sql.includes("SELECT vendor_id")) return clash;
      if (sql.includes("INSERT INTO source.vendor")) return inserted;
      return [];
    });
  return {
    calls,
    inserts: () => calls.filter((c) => c.sql.includes("INSERT INTO")),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    tx: tx as any,
  };
}

const input = {
  clientKey: "tenant-alpha",
  legalName: "Westhaven Infrastructure Operations",
  originatedByUserId: "person-1",
  originationEvidence: "Market intelligence scan for service-desk capability.",
};

const clock = () => "2026-10-07T09:00:00.000Z";

describe("a supplier can be originated in Source", () => {
  it("writes it as potential, with a named originator and a reason", async () => {
    const h = harness();
    const result = await originateProspectiveSupplier(input, h.tx, clock);

    expect(result).toMatchObject({ ok: true, created: true });
    expect(result.ok && result.vendorId).toMatch(/^PSP-[0-9A-F]{12}$/);

    const insert = h.inserts()[0];
    expect(insert.sql).toContain("'potential'");
    expect(insert.params).toContain("person-1");
    expect(insert.params).toContain("Market intelligence scan for service-desk capability.");
  });

  // The point of the whole slice. A potential supplier cannot be paid because
  // the record cannot express how to pay it.
  it("writes no banking detail, because the table has none to write", () => {
    const insert = writer.slice(writer.indexOf("INSERT INTO source.vendor"));
    for (const banking of ["bank", "iban", "account_number", "remit", "swift", "routing"]) {
      expect(insert.toLowerCase()).not.toContain(banking);
    }
    // Control: `source.vendor` itself declares no banking column, so this is a
    // structural property of the table and not a habit of this one writer.
    const table = vendorTable.slice(
      vendorTable.indexOf("CREATE TABLE IF NOT EXISTS source.vendor"),
      vendorTable.indexOf("CREATE TABLE IF NOT EXISTS source.contract"),
    );
    expect(table).toContain("legal_name");
    for (const banking of ["bank", "iban", "account_number", "remit", "swift", "routing"]) {
      expect(table.toLowerCase()).not.toContain(banking);
    }
  });

  it("returns the same supplier when the same name is originated twice", async () => {
    const first = await originateProspectiveSupplier(input, harness().tx, clock);
    // No row returned from the insert means the name was already originated.
    const second = await originateProspectiveSupplier(input, harness([], []).tx, clock);

    expect(first.ok && second.ok).toBe(true);
    expect(first.ok && second.ok && first.vendorId).toBe(second.ok ? second.vendorId : "");
    expect(second).toMatchObject({ created: false });
  });

  it("treats case and spacing as not being identity", async () => {
    const a = await originateProspectiveSupplier(input, harness().tx, clock);
    const b = await originateProspectiveSupplier(
      { ...input, legalName: "  westhaven   infrastructure OPERATIONS " },
      harness().tx,
      clock,
    );
    expect(a.ok && b.ok && a.vendorId).toBe(b.ok ? b.vendorId : "");
  });

  it("refuses to adopt a loaded supplier that already holds the name", async () => {
    const h = harness([{ vendor_id: "VEN-001", supplier_population: "known" }]);
    const result = await originateProspectiveSupplier(input, h.tx, clock);

    expect(result).toEqual({ ok: false, code: "name_taken_by_loaded_supplier" });
    expect(h.inserts()).toHaveLength(0);
  });

  // The crosswalk's duplicate check belongs at award, where a named person
  // confirms it. Blocking origination on a general name match would stop a
  // buyer approaching a supplier because something similar was once imported.
  it("does not block on a merely similar loaded name", async () => {
    const h = harness();
    const result = await originateProspectiveSupplier(input, h.tx, clock);
    expect(result.ok).toBe(true);
    const lookup = h.calls.find((c) => c.sql.includes("SELECT vendor_id"));
    expect(lookup?.sql).toContain("lower(btrim(legal_name)) = lower(btrim($2))");
    expect(lookup?.sql).toContain("supplier_population = 'known'");
  });

  it("refuses a nameless, unattributed or unexplained origination", async () => {
    for (const field of ["clientKey", "legalName", "originatedByUserId"] as const) {
      const h = harness();
      const result = await originateProspectiveSupplier({ ...input, [field]: "  " }, h.tx, clock);
      expect(result).toEqual({ ok: false, code: "invalid_record" });
      expect(h.calls).toHaveLength(0);
    }
    const h = harness();
    expect(
      await originateProspectiveSupplier({ ...input, originationEvidence: "scan" }, h.tx, clock),
    ).toEqual({ ok: false, code: "invalid_record" });
    expect(h.calls).toHaveLength(0);

    // Control: the same harness accepts the unmodified input.
    expect((await originateProspectiveSupplier(input, harness().tx, clock)).ok).toBe(true);
  });

  it("scopes every statement to the originating tenant", async () => {
    const h = harness();
    await originateProspectiveSupplier(input, h.tx, clock);
    expect(h.calls[0].sql).toContain("set_config('app.tenant_key'");
    expect(h.calls[0].params).toEqual(["tenant-alpha"]);
    for (const call of h.calls.slice(1)) expect(call.params).toContain("tenant-alpha");
  });

  it("reports an unreachable data plane as a refusal, not a success", async () => {
    const failing = (async () => {
      throw new Error("connection refused");
    }) as unknown as Parameters<typeof originateProspectiveSupplier>[1];
    expect(await originateProspectiveSupplier(input, failing, clock)).toEqual({
      ok: false,
      code: "origination_unavailable",
    });
  });
});

describe("the schema keeps the two populations apart", () => {
  it("defaults every existing supplier to the loaded population", () => {
    expect(migration).toContain("supplier_population TEXT NOT NULL DEFAULT 'known'");
    expect(migration).toContain("CHECK (supplier_population IN ('known', 'potential'))");
  });

  it("requires an originated supplier to name who, when and why", () => {
    expect(migration).toContain("source_vendor_origination_check");
    expect(migration).toContain("NULLIF(BTRIM(originated_by_user_id), '') IS NOT NULL");
    expect(migration).toContain("NULLIF(BTRIM(origination_evidence), '') IS NOT NULL");
  });

  // Without this a loader could set the origination fields on a loaded row and
  // the two populations would stop being distinguishable by anything but intent.
  it("forbids a loaded supplier from claiming it was originated here", () => {
    // Asserted as the constraint that is ADDED, not merely as a name that
    // appears. The name also occurs in the `conname` guard above the statement,
    // so a rename of the constraint itself left a bare name check passing while
    // the constraint was gone.
    expect(migration).toContain(
      "ADD CONSTRAINT source_vendor_known_not_originated_check CHECK",
    );
    expect(migration).toContain("supplier_population <> 'known'");
    expect(migration).toContain("originated_by_user_id IS NULL");
  });

  it("adds no banking column", () => {
    for (const banking of ["bank", "iban", "account_number", "remit", "swift", "routing"]) {
      expect(migrationDdl.toLowerCase()).not.toContain(banking);
    }
    // Control: the stripped DDL still carries the statements, so the absences
    // above are measured against the schema rather than against an empty
    // string left behind by the stripping.
    expect(migrationDdl).toContain("ADD COLUMN IF NOT EXISTS supplier_population");
    expect(migrationDdl).toContain("source_vendor_population_check");
    // And the prose that defeated the first version of this check is still
    // there, so the strip is doing the work rather than the file having changed.
    expect(migration.toLowerCase()).toContain("banking column");
  });
});
