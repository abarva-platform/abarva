/**
 * P0 origination submit must not answer a signed-in user with raw internal
 * error text.
 *
 * Both product clients of POST /api/programs/origination-submit render the
 * response's `message` field AHEAD of the machine `error` code
 * (`payload.message ?? payload.error ?? "Submit failed."` in
 * StrategicMoveOriginateClient; `body.message ?? ...` in
 * ProgramOriginationWorkspace), so `message` is what the user reads and it
 * outranks the code rather than supplementing it. Four failures used to put a
 * driver/database string there.
 *
 * These tests cover the sentences themselves, the route arm that catches every
 * unexpected failure, and -- following the convention this directory already
 * uses for the `server-only` submit module (see
 * `origination-submit-contract.test.ts`) -- the three typed throw sites inside
 * it.
 */

import fs from "node:fs";
import path from "node:path";

import {
  originationSubmitAccessSentence,
  originationSubmitFailureSentence,
  type OriginationSubmitFailureCode,
} from "../origination-submit-failure-text";

/** Every code whose sentence this module owns. */
const CODES: OriginationSubmitFailureCode[] = [
  "person_lookup_failed",
  "person_placeholder_failed",
  "engagement_insert_failed",
  "duplicate_check_failed",
  "origination_submit_failed",
];

/**
 * Text that means the sentence is carrying internals. These are the shapes a
 * Postgres/driver message actually arrives in from the data plane.
 */
const INTERNALS_MARKERS = [
  "violates",
  "constraint",
  "permission denied",
  "relation",
  "ECONNREFUSED",
  "null value in column",
  "duplicate key",
  "syntax error",
  "undefined",
  "null",
  "Error:",
  "stack",
];

describe("origination submit failure text · the sentences", () => {
  it("gives every owned code a sentence", () => {
    for (const code of CODES) {
      const sentence = originationSubmitFailureSentence(code);
      expect(typeof sentence).toBe("string");
      expect(sentence.length).toBeGreaterThan(40);
    }
  });

  it("gives each code its OWN sentence, so a cause is never described as another", () => {
    const sentences = CODES.map((c) => originationSubmitFailureSentence(c));
    expect(new Set(sentences).size).toBe(CODES.length);
  });

  it("never carries database or driver internals", () => {
    for (const code of CODES) {
      const sentence = originationSubmitFailureSentence(code);
      for (const marker of INTERNALS_MARKERS) {
        expect(sentence.toLowerCase()).not.toContain(marker.toLowerCase());
      }
    }
  });

  it("never tells a product user to read server logs", () => {
    // A product user cannot act on a log. Naming it is how a failure report
    // stops being useful to the person reading it.
    for (const code of CODES) {
      const sentence = originationSubmitFailureSentence(code).toLowerCase();
      expect(sentence).not.toContain("log");
      expect(sentence).not.toContain("console");
      expect(sentence).not.toContain("stderr");
    }
  });

  it("says nothing was saved, so the user is not left hunting a partial Move", () => {
    for (const code of CODES) {
      expect(originationSubmitFailureSentence(code).toLowerCase()).toContain(
        "nothing was saved",
      );
    }
  });

  it("tells the user what to do next", () => {
    for (const code of CODES) {
      expect(originationSubmitFailureSentence(code).toLowerCase()).toContain(
        "submit again",
      );
    }
  });

  it("answers an unrecognised code defensively rather than borrowing a named cause", () => {
    const unknown = originationSubmitFailureSentence(
      "some_code_added_later" as OriginationSubmitFailureCode,
    );
    expect(unknown.length).toBeGreaterThan(40);
    expect(unknown.toLowerCase()).toContain("nothing was saved");
    // It must not be any NAMED cause's sentence: a code added to the submit
    // path later must not silently inherit another cause's wording.
    for (const code of CODES) {
      expect(unknown).not.toBe(originationSubmitFailureSentence(code));
    }
  });

  it("does not answer a prototype-chain key as if it were a declared code", () => {
    // `code in SENTENCES` would be true for inherited keys if the lookup were
    // written against the prototype chain.
    const inherited = originationSubmitFailureSentence(
      "toString" as OriginationSubmitFailureCode,
    );
    expect(typeof inherited).toBe("string");
    expect(inherited.toLowerCase()).toContain("nothing was saved");
  });
});

describe("origination submit failure text · the access family", () => {
  const ACCESS_CODES = [
    "unauthenticated",
    "no_client",
    "forbidden",
    "tenant_lookup_unavailable",
  ] as const;

  it("gives each tenancy code its own sentence", () => {
    const sentences = ACCESS_CODES.map((c) =>
      originationSubmitAccessSentence(c),
    );
    expect(new Set(sentences).size).toBe(ACCESS_CODES.length);
    for (const sentence of sentences) {
      expect(sentence.length).toBeGreaterThan(40);
    }
  });

  it("never answers with the bare machine code", () => {
    for (const code of ACCESS_CODES) {
      expect(originationSubmitAccessSentence(code)).not.toBe(code);
      expect(originationSubmitAccessSentence(code)).not.toContain(code);
    }
  });

  it("says nothing was saved for every tenancy code", () => {
    for (const code of ACCESS_CODES) {
      expect(originationSubmitAccessSentence(code).toLowerCase()).toContain(
        "nothing was saved",
      );
    }
  });

  it("does not tell a signed-out user to just submit again", () => {
    // Resubmitting cannot fix a lapsed session; signing in can. This is why
    // the access family is separate from the write family.
    expect(
      originationSubmitAccessSentence("unauthenticated").toLowerCase(),
    ).toContain("sign in again");
  });

  it("does not describe an infrastructure failure as a permissions change", () => {
    const sentence = originationSubmitAccessSentence(
      "tenant_lookup_unavailable",
    ).toLowerCase();
    expect(sentence).toContain("not a change to your permissions");
  });

  it("answers an unrecognised tenancy code defensively", () => {
    const unknown = originationSubmitAccessSentence("some_new_code");
    expect(unknown.toLowerCase()).toContain("nothing was saved");
    for (const code of ACCESS_CODES) {
      expect(unknown).not.toBe(originationSubmitAccessSentence(code));
    }
  });

  it("does not answer a prototype-chain key as a declared code", () => {
    expect(
      originationSubmitAccessSentence("constructor").toLowerCase(),
    ).toContain("nothing was saved");
  });
});

describe("origination submit failure text · the four typed throw sites", () => {
  let source: string;

  beforeAll(() => {
    source = fs.readFileSync(
      path.join(process.cwd(), "src/lib/programs/origination-submit.ts"),
      "utf8",
    );
  });

  it.each([
    "person_lookup_failed",
    "person_placeholder_failed",
    "engagement_insert_failed",
    "duplicate_check_failed",
  ])("answers %s with the sentence helper, not a driver message", (code) => {
    // Anchored on the helper NAME, which survives a reformat of the call.
    expect(source).toContain(`originationSubmitFailureSentence("${code}")`);
  });

  it("no longer passes a raw driver message as the thrown message", () => {
    // The defect was the SECOND argument to OriginationSubmitError, not the
    // presence of `?.message` anywhere -- the operator logs legitimately read
    // the same expression. Assert on the throw arguments only.
    const throwArgs = [
      ...source.matchAll(/new OriginationSubmitError\(\s*([^)]*?)\s*\)/g),
    ].map((m) => m[1]);
    const rawish = throwArgs.filter((args) =>
      /\berror\.message\b|placeholderError\?\.message|insertError\?\.message/.test(
        args,
      ),
    );
    // One legitimate remaining use: the pattern-authority error, whose
    // `message` is an authored sentence ("The Programs pattern catalog could
    // not be checked."), not driver text.
    expect(rawish).toHaveLength(1);
    expect(rawish[0]).toContain("error.code");
  });

  it("never passes a bare machine code as the thrown message", () => {
    // `new OriginationSubmitError(err.code, err.code, ...)` showed a user the
    // literal token `unauthenticated`.
    expect(source).not.toContain("err.code,\n        err.code,");
    expect(source).toContain("originationSubmitAccessSentence(err.code)");
  });

  it("still logs the raw text for an operator at each site", () => {
    expect(source).toContain("[origination-submit] sponsor lookup failed");
    expect(source).toContain(
      "[origination-submit] sponsor placeholder insert failed",
    );
    expect(source).toContain("[origination-submit] engagement insert failed");
    expect(source).toContain("[origination-submit] re-submit check failed");
  });
});

describe("origination submit route · the unexpected-failure arm", () => {
  const RAW = 'permission denied for table "engagements" at 10.2.0.4:5432';

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  async function postWith(thrown: unknown) {
    jest.doMock("@/lib/programs/origination-submit", () => ({
      OriginationSubmitError: class OriginationSubmitError extends Error {
        code: string;
        status: number;
        constructor(code: string, message: string, status = 400) {
          super(message);
          this.code = code;
          this.status = status;
        }
      },
      submitOriginationBrief: jest.fn(async () => {
        throw thrown;
      }),
    }));
    const { POST } =
      await import("@/app/api/programs/origination-submit/route");
    const res = await POST(
      new Request("http://localhost/api/programs/origination-submit", {
        method: "POST",
        body: JSON.stringify({ programName: "x" }),
      }) as never,
    );
    return {
      status: (res as Response).status,
      body: (await (res as Response).json()) as {
        ok?: boolean;
        error?: string;
        message?: string;
      },
    };
  }

  it("does not put the raw driver text in the field the clients render", async () => {
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});
    const { status, body } = await postWith(new Error(RAW));
    expect(status).toBe(500);
    expect(body.message).not.toContain(RAW);
    expect(body.message).not.toContain("permission denied");
    expect(body.message).not.toContain("5432");
    // And it is the authored sentence, not an empty or missing field -- the
    // clients fall back to `error` only when `message` is absent, so dropping
    // the field would show the token instead.
    expect(body.message).toBe(
      originationSubmitFailureSentence("origination_submit_failed"),
    );
    spy.mockRestore();
  });

  it("keeps the machine code unchanged for anything keying on it", async () => {
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});
    const { body } = await postWith(new Error(RAW));
    expect(body.error).toBe("origination_submit_failed");
    expect(body.ok).toBe(false);
    spy.mockRestore();
  });

  it("still records the raw text for an operator", async () => {
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});
    await postWith(new Error(RAW));
    const logged = spy.mock.calls.map((c) => JSON.stringify(c)).join(" ");
    expect(logged).toContain("permission denied");
    spy.mockRestore();
  });

  it("answers a non-Error throw without leaking its stringification", async () => {
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});
    const { status, body } = await postWith(RAW);
    expect(status).toBe(500);
    expect(body.message).not.toContain("permission denied");
    expect(body.message).toBe(
      originationSubmitFailureSentence("origination_submit_failed"),
    );
    spy.mockRestore();
  });
});
