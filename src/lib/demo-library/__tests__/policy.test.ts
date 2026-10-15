import {
  isDemoRequestOriginAllowed,
  evaluateDemoAccess,
  isDemoVisitorRoute,
  parseVideoRange,
} from "../policy";

const now = new Date("2026-10-15T12:00:00Z");
const grant = {
  enabled: true,
  email: "viewer@example.com",
  expiresAt: "2026-10-22T12:00:00Z",
  grantedAt: "2026-10-15T10:00:00Z",
  grantedBy: "user_admin",
  videoIds: ["executive", "full"],
};
const viewer = {
  id: "user_viewer",
  primaryEmailAddressId: "email_1",
  emailAddresses: [
    {
      id: "email_1",
      emailAddress: "viewer@example.com",
      verification: { status: "verified" },
    },
  ],
  publicMetadata: { role: "external" },
  privateMetadata: { nexusDemoAccess: grant },
};

describe("private demo access", () => {
  it("accepts the exact app origin behind ACA without trusting forwarded-host input", () => {
    expect(
      isDemoRequestOriginAllowed(
        new Request("http://internal:3000/api/auth/demo-viewer", {
          headers: { origin: "https://app.abarva.ai" },
        }),
      ),
    ).toBe(true);
    expect(
      isDemoRequestOriginAllowed(
        new Request("http://localhost:3127/api/auth/demo-viewer", {
          headers: { origin: "http://localhost:3127" },
        }),
      ),
    ).toBe(true);
  });
  it("rejects missing, lookalike and attacker origins even with forged forwarded-host headers", () => {
    for (const origin of [
      "",
      "null",
      "https://app.abarva.ai.attacker.example",
      "https://attacker.example",
    ]) {
      expect(
        isDemoRequestOriginAllowed(
          new Request("http://internal:3000/api/auth/demo-viewer", {
            headers: { origin, "x-forwarded-host": "attacker.example" },
          }),
        ),
      ).toBe(false);
    }
  });
  it("does not confuse an authenticated identity with an access grant", () => {
    expect(evaluateDemoAccess(null, now).allowed).toBe(false);
    expect(
      evaluateDemoAccess({ ...viewer, privateMetadata: {} }, now).allowed,
    ).toBe(false);
  });
  it("requires a verified primary email and a current, email-bound private grant", () => {
    expect(evaluateDemoAccess(viewer, now)).toMatchObject({
      allowed: true,
      videoIds: ["executive", "full"],
      admin: false,
    });
    expect(
      evaluateDemoAccess(
        {
          ...viewer,
          emailAddresses: [
            {
              ...viewer.emailAddresses[0],
              verification: { status: "unverified" },
            },
          ],
        },
        now,
      ).allowed,
    ).toBe(false);
    for (const change of [
      { enabled: false },
      { expiresAt: now.toISOString() },
      { expiresAt: "invalid" },
      { email: "someone-else@example.com" },
      { grantedBy: "" },
      { videoIds: ["unknown"] },
    ]) {
      expect(
        evaluateDemoAccess(
          {
            ...viewer,
            privateMetadata: { nexusDemoAccess: { ...grant, ...change } },
          },
          now,
        ).allowed,
      ).toBe(false);
    }
  });
  it("ignores grants placed in public or unsafe metadata", () => {
    expect(
      evaluateDemoAccess(
        {
          ...viewer,
          privateMetadata: {},
          publicMetadata: { nexusDemoAccess: grant },
          unsafeMetadata: { nexusDemoAccess: grant },
        },
        now,
      ).allowed,
    ).toBe(false);
  });
  it("does not accept a verified secondary address as the approved primary address", () => {
    expect(
      evaluateDemoAccess(
        {
          ...viewer,
          primaryEmailAddressId: "email_other",
          emailAddresses: [
            ...viewer.emailAddresses,
            {
              id: "email_other",
              emailAddress: "other@example.com",
              verification: { status: "verified" },
            },
          ],
        },
        now,
      ).allowed,
    ).toBe(false);
  });
  it("allows verified platform admins, not merely signed-in clients", () => {
    expect(
      evaluateDemoAccess(
        { ...viewer, privateMetadata: {}, publicMetadata: { role: "admin" } },
        now,
      ),
    ).toMatchObject({ allowed: true, admin: true });
    expect(
      evaluateDemoAccess(
        { ...viewer, privateMetadata: {}, publicMetadata: { role: "client" } },
        now,
      ).allowed,
    ).toBe(false);
  });
  it("retains video-specific approvals", () => {
    expect(
      evaluateDemoAccess(
        {
          ...viewer,
          privateMetadata: {
            nexusDemoAccess: { ...grant, videoIds: ["executive"] },
          },
        },
        now,
      ).videoIds,
    ).toEqual(["executive"]);
  });
  it("limits external viewers to the demo and authentication, never product routes", () => {
    for (const path of [
      "/",
      "/demo",
      "/sign-in",
      "/sign-in/factor-one",
      "/auth-redirect",
      "/signed-out",
      "/api/auth/demo-viewer",
      "/api/demo-video/full",
      "/api/demo-video/executive",
    ])
      expect(isDemoVisitorRoute(path)).toBe(true);
    for (const path of [
      "/home",
      "/tower",
      "/intelligence",
      "/source/360",
      "/demo/explore",
      "/api/context/demo",
      "/api/admin/demo-access",
      "/api/auth/launch-user",
      "/api/demo-video/../context",
      "/api/demo-video/full/extra",
    ])
      expect(isDemoVisitorRoute(path)).toBe(false);
  });
});

describe("video byte ranges", () => {
  it("supports bounded, open-ended and suffix requests", () => {
    expect(parseVideoRange("bytes=0-99", 1000)).toEqual({ start: 0, end: 99 });
    expect(parseVideoRange("bytes=900-", 1000)).toEqual({
      start: 900,
      end: 999,
    });
    expect(parseVideoRange("bytes=-100", 1000)).toEqual({
      start: 900,
      end: 999,
    });
    expect(parseVideoRange("bytes=900-9999", 1000)).toEqual({
      start: 900,
      end: 999,
    });
    expect(parseVideoRange("bytes=-9999", 1000)).toEqual({
      start: 0,
      end: 999,
    });
    expect(parseVideoRange(null, 1000)).toBeNull();
  });
  it("rejects invalid, multiple, unsatisfiable and unsafe integer ranges", () => {
    for (const range of [
      "bytes=1000-",
      "bytes=9-1",
      "bytes=-0",
      "bytes=0-1,4-5",
      "items=1-2",
      "bytes=-",
      "bytes=abc-",
      "bytes=9007199254740992-",
    ])
      expect(() => parseVideoRange(range, 1000)).toThrow();
    expect(() => parseVideoRange("bytes=0-", 0)).toThrow();
  });
});
