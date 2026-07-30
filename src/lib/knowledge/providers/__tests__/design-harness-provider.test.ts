import { CANONICAL_TENANT_KEYS } from "@/config/tenants/CANONICAL_TENANTS";
import {
  DesignHarnessNotAllowedError,
  assertDesignHarnessAllowed,
  createDesignHarnessProvider,
} from "@/lib/knowledge/providers/design-harness-provider";

describe("DesignHarnessProvider tenant guard", () => {
  it("rejects every canonical tenant, including airline-demo-new", () => {
    expect(CANONICAL_TENANT_KEYS.length).toBeGreaterThan(0);
    for (const tenantKey of CANONICAL_TENANT_KEYS) {
      expect(() => assertDesignHarnessAllowed(tenantKey)).toThrow(
        DesignHarnessNotAllowedError,
      );
    }
  });

  it("rejects airline-demo-new specifically even though its data is unreconciled", () => {
    // Illustrative fallback is not a valid response to "data isn't ready yet" --
    // that is exactly the case this guard exists to block.
    expect(() => assertDesignHarnessAllowed("airline-demo-new")).toThrow(
      DesignHarnessNotAllowedError,
    );
  });

  it("allows a non-canonical dev-only tenant key outside production", () => {
    const originalEnv = process.env.NODE_ENV;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (process.env as any).NODE_ENV = "test";
    expect(() =>
      assertDesignHarnessAllowed("__design-harness-dev-only__"),
    ).not.toThrow();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (process.env as any).NODE_ENV = originalEnv;
  });

  it("createDesignHarnessProvider still enforces the guard before doing anything else", () => {
    expect(() => createDesignHarnessProvider("airline-demo-new")).toThrow(
      DesignHarnessNotAllowedError,
    );
  });
});
