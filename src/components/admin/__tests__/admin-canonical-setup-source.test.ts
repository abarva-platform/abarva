import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("canonical admin setup source contract", () => {
  const pageSource = readFileSync(
    join(process.cwd(), "src/app/(maestro)/admin/page.tsx"),
    "utf8",
  );
  const componentSource = readFileSync(
    join(process.cwd(), "src/components/admin/AdminSetupExperience.tsx"),
    "utf8",
  );
  const connectorSource = readFileSync(
    join(
      process.cwd(),
      "src/components/admin/context-layer/CsvUploadConnector.tsx",
    ),
    "utf8",
  );
  const proxySource = readFileSync(join(process.cwd(), "src/proxy.ts"), "utf8");

  it("makes /admin the single setup experience and routes old setup paths back to it", () => {
    expect(pageSource).toContain("AdminSetupExperience");
    expect(pageSource).toContain('surface="setup"');
    expect(proxySource).toContain(
      'request.nextUrl.pathname.startsWith("/admin/")',
    );
    expect(proxySource).toContain(
      'request.nextUrl.pathname !== "/admin/setup"',
    );
    expect(proxySource).toContain('request.nextUrl.pathname === "/setup"');
    expect(proxySource).toContain(
      'request.nextUrl.pathname.startsWith("/setup/")',
    );
    expect(proxySource).toContain(
      'NextResponse.redirect(new URL("/admin", request.url), 301)',
    );
  });

  it("uses one primary data action and compact workflow copy", () => {
    expect(componentSource).toContain('tab !== "data"');
    expect(componentSource).not.toContain("Upload file</PrimaryButton>");
    expect(componentSource).toContain("First-time load");
    expect(componentSource).toContain("Update one file");
    expect(componentSource).not.toContain("Package intake is review-first");
  });

  it("states the package-vs-single-file truth without claiming zip auto-load", () => {
    expect(connectorSource).toContain(
      "AbarVa will ask before committing structured rows",
    );
    expect(connectorSource).toContain(
      "Documents and workbooks go to review before facts commit",
    );
    expect(connectorSource).not.toContain("ZIP packages commit automatically");
  });
});
