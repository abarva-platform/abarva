import { getRouteById, getRoutesBySurface } from "@/lib/routes/registry";
import fs from "node:fs";
import path from "node:path";

describe("Admin canonical route registry parity", () => {
  it("registers /admin as the canonical Admin operator entry", () => {
    const route = getRouteById("admin-index");

    expect(route).toBeDefined();
    expect(route!.pattern).toBe("/admin");
    expect(route!.label).toBe("Admin Portal");
    expect(route!.shellKind).toBe("admin");
    expect(route!.surface).toBe("admin");
    expect(route!.primaryAgent).toBe("Steward");
    expect(route!.requiresAuth).toBe(true);
    expect(route!.active).toBe(true);
    expect(route!.notes).toContain("/platform/admin");
  });

  it("registers /admin/setup as the native Admin Data Loads route", () => {
    const route = getRouteById("admin-setup-data-loads");

    expect(route).toBeDefined();
    expect(route!.pattern).toBe("/admin/setup");
    expect(route!.label).toBe("Admin Data Loads");
    expect(route!.shellKind).toBe("admin");
    expect(route!.surface).toBe("admin");
    expect(route!.primaryAgent).toBe("Steward");
    expect(route!.requiresAuth).toBe(true);
    expect(route!.active).toBe(true);
  });

  it("registers canonical W6 Admin governance routes under /admin/*", () => {
    const expected = [
      ["admin-policies", "/admin/policies", "Admin Policies"],
      ["admin-tenant", "/admin?tab=tenant", "Admin Tenant Profile"],
      ["admin-architecture", "/admin/architecture", "Admin Architecture"],
    ] as const;

    for (const [routeId, pattern, label] of expected) {
      const route = getRouteById(routeId);
      expect(route).toBeDefined();
      expect(route!.pattern).toBe(pattern);
      expect(route!.label).toBe(label);
      expect(route!.shellKind).toBe("admin");
      expect(route!.surface).toBe("admin");
      expect(route!.primaryAgent).toBe("Steward");
      expect(route!.requiresAuth).toBe(true);
      expect(route!.active).toBe(true);
    }
  });

  it("registers canonical connector, users, invite, and audit Admin routes under /admin/*", () => {
    const expected = [
      ["admin-connectors", "/admin/connectors", "Admin Connectors"],
      [
        "admin-connector-detail",
        "/admin/connectors/[connectorId]",
        "Admin Connector Detail",
      ],
      [
        "admin-connector-reconnect",
        "/admin/connectors/[connectorId]/reconnect",
        "Admin Connector Reconnect",
      ],
      ["admin-users", "/admin/users", "Admin Users"],
      ["admin-users-access", "/admin/users-access", "Admin Users Access"],
      ["admin-invite", "/admin/invite", "Admin Invite User"],
      ["admin-audit", "/admin/audit", "Admin Audit Log"],
    ] as const;

    for (const [routeId, pattern, label] of expected) {
      const route = getRouteById(routeId);
      expect(route).toBeDefined();
      expect(route!.pattern).toBe(pattern);
      expect(route!.label).toBe(label);
      expect(route!.shellKind).toBe("admin");
      expect(route!.surface).toBe("admin");
      expect(route!.primaryAgent).toBe("Steward");
      expect(route!.requiresAuth).toBe(true);
      expect(route!.active).toBe(true);
    }
  });

  it("keeps platform architecture as a legacy redirect bridge, not canonical registry pattern", () => {
    const architecture = getRouteById("admin-architecture");

    expect(architecture?.pattern).toBe("/admin/architecture");
    expect(architecture?.notes).toContain("/platform/admin/architecture");
    expect(
      getRoutesBySurface("admin").some(
        (route) => route.pattern === "/platform/admin/architecture",
      ),
    ).toBe(false);
  });

  it("does not add legacy platform Setup routes as canonical connector/users/audit patterns", () => {
    const adminRoutes = getRoutesBySurface("admin").map(
      (route) => route.pattern,
    );

    expect(adminRoutes).not.toContain("/platform/admin");
    expect(adminRoutes).not.toContain("/platform/admin/connectors");
    expect(adminRoutes).not.toContain("/platform/admin/users");
    expect(adminRoutes).not.toContain("/platform/admin/audit");
  });

  it("does not expose setup-era labels for canonical Admin routes", () => {
    const adminRoutes = getRoutesBySurface("admin");

    expect(adminRoutes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          routeId: "admin-index",
          label: "Admin Portal",
        }),
        expect.objectContaining({
          routeId: "admin-connectors",
          label: "Admin Connectors",
        }),
        expect.objectContaining({
          routeId: "admin-users-access",
          label: "Admin Users Access",
        }),
      ]),
    );
    expect(
      adminRoutes
        .map((route) => route.label)
        .filter((label) => label.startsWith("Setup ")),
    ).toEqual([]);
  });

  it("keeps /setup as a thin compatibility bridge while /admin/setup is native", () => {
    const setupPageSource = fs.readFileSync(
      path.join(process.cwd(), "src/app/setup/page.tsx"),
      "utf8",
    );
    const adminSetupPageSource = fs.readFileSync(
      path.join(process.cwd(), "src/app/(maestro)/admin/setup/page.tsx"),
      "utf8",
    );
    const proxySource = fs.readFileSync(
      path.join(process.cwd(), "src/proxy.ts"),
      "utf8",
    );

    expect(setupPageSource).toContain("redirect('/admin')");
    expect(setupPageSource).not.toContain("AdminCanonShellV2");
    expect(adminSetupPageSource).toContain("AdminSetupDataLoadCenterPage");
    expect(adminSetupPageSource).toContain("AdminCanonShellV2");
    expect(adminSetupPageSource).not.toContain("redirect('/admin')");
    expect(proxySource).toMatch(
      /request\.nextUrl\.pathname === ["']\/setup["']/,
    );
    expect(proxySource).toMatch(
      /request\.nextUrl\.pathname\.startsWith\(["']\/setup\/["']\)/,
    );
    expect(proxySource).toMatch(
      /NextResponse\.redirect\(new URL\(["']\/admin["'], request\.url\), 301\)/,
    );
    expect(proxySource).toContain('"/home/data-loads": "/admin/setup"');
    expect(proxySource).toContain('"/admin/data-loads": "/admin/setup"');
    expect(proxySource).toContain('"/admin/data-load": "/admin/setup"');
  });
});
