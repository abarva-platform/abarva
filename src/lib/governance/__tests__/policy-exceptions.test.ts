import {
  validateExceptions,
  EXCEPTABLE_RULES,
  type PolicyException,
} from "../policy-exceptions";

function exception(over: Partial<PolicyException> = {}): PolicyException {
  return {
    id: "exc-1",
    rule: "missing_confidence",
    scope: "skyharbor-air",
    reason: "pilot backfill in progress",
    granted_by: "anand",
    granted_at: "2026-06-01",
    expires_at: "2026-06-30",
    ...over,
  };
}

function file(exceptions: PolicyException[]) {
  return { policy_version: "1.0.0", exceptions };
}

describe("validateExceptions", () => {
  it("accepts a valid, unexpired, narrowly-scoped exception", () => {
    const v = validateExceptions(file([exception()]), "2026-06-08");
    expect(v.ok).toBe(true);
    expect(v.active).toBe(1);
    expect(v.expired).toBe(0);
  });

  it("fails the build on an expired exception (CI-enforced expiry)", () => {
    const v = validateExceptions(
      file([exception({ expires_at: "2026-06-05" })]),
      "2026-06-08",
    );
    expect(v.ok).toBe(false);
    expect(v.expired).toBe(1);
    expect(v.errors.join(" ")).toMatch(/expired on 2026-06-05/);
  });

  it("fails on expiry-before-grant", () => {
    const v = validateExceptions(
      file([exception({ granted_at: "2026-06-10", expires_at: "2026-06-01" })]),
      "2026-06-08",
    );
    expect(v.ok).toBe(false);
    expect(v.errors.join(" ")).toMatch(/expires before it was granted/);
  });

  it("fails on duplicate ids", () => {
    const v = validateExceptions(
      file([exception(), exception()]),
      "2026-06-08",
    );
    expect(v.ok).toBe(false);
    expect(v.errors.join(" ")).toMatch(/duplicate exception id/);
  });

  it("fails on a non-canonical tenant scope", () => {
    const v = validateExceptions(
      file([exception({ scope: "morgan-street" as never })]),
      "2026-06-08",
    );
    expect(v.ok).toBe(false);
  });

  it("fails on an unknown rule", () => {
    const v = validateExceptions(
      file([exception({ rule: "make_it_ready" as never })]),
      "2026-06-08",
    );
    expect(v.ok).toBe(false);
  });

  it("warns (but passes) on a broad scope and a long window", () => {
    const v = validateExceptions(
      file([
        exception({
          scope: "all",
          granted_at: "2026-01-01",
          expires_at: "2026-12-31",
        }),
      ]),
      "2026-06-08",
    );
    expect(v.ok).toBe(true);
    expect(v.warnings.join(" ")).toMatch(/broad scope/);
    expect(v.warnings.join(" ")).toMatch(/exceeds 90 days/);
  });

  it("accepts an empty exceptions list (the default healthy state)", () => {
    const v = validateExceptions(file([]), "2026-06-08");
    expect(v.ok).toBe(true);
    expect(v.active).toBe(0);
  });

  it("exposes the canonical exceptable-rule set", () => {
    expect(EXCEPTABLE_RULES).toContain("agent_ready_without_cite_render");
    expect(EXCEPTABLE_RULES).toContain("sensitive_in_shared_corpus");
  });
});
