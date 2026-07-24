import fs from "node:fs";
import path from "node:path";

describe("project-tower-mart client resolver", () => {
  const source = fs.readFileSync(
    path.join(__dirname, "..", "project-tower-mart.ts"),
    "utf8",
  );

  it("uses live clients tenant_key/slug columns instead of the retired key column", () => {
    expect(source).toContain("FROM public.clients");
    expect(source).toContain("WHERE tenant_key = ANY($1::text[])");
    expect(source).toContain("OR slug = ANY($1::text[])");
    expect(source).not.toContain("WHERE key = ANY($1::text[])");
    expect(source).not.toContain("WHEN key = ANY($1::text[])");
  });

  it("does not collapse Lakeshore Industries into Lakeshore Holdings", () => {
    expect(source).toContain('if (normalized === "lakeshore-holdings")');
    expect(source).toContain('if (normalized === "lakeshore-industries")');
    expect(source).not.toContain('aliases.add("lakeshore-industries");');
  });
});
