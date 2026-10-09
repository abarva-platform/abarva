/**
 * The P0 submit's re-submit check must not create the Move it exists to
 * prevent.
 *
 * `submitOriginationBrief` is the only path that creates the `engagements`
 * row, and it is the first step of a Move. Before inserting, it looks for a
 * Move of the same name created by this client in the last five minutes and,
 * on a hit, returns that one instead -- so a double-submit or a retried POST
 * lands back on the Move the first submit created.
 *
 * That check read `{ data }` alone. `postgresCompat`'s builder catches
 * everything in `execute()` and resolves `{ data: null, error }` rather than
 * throwing, so a connection failure, a permission denial and a genuinely
 * absent Move all arrive as `data: null`. Dropping `error` therefore made a
 * failed check read as a clean first submit, and the submit created a SECOND
 * Move with the same name -- a write consequence drawn from a state nobody
 * had read, on the demo walk's first step, and one no product control can
 * undo. No unique index covers it: `idx_engagements_one_active` is on
 * `(client_id, solution)`, not on `name`.
 *
 * It now fails closed. A refusal the user can retry is recoverable; a
 * duplicate Move is not.
 */

const requireTenancyMock = jest.fn();
const loadAccessPolicyMock = jest.fn();
const getActiveClientRowMock = jest.fn();
const resolvePatternMock = jest.fn();

const CLIENT_ID = "client-1";
const CLIENT_NAME = "Example Organization";
const SPONSOR = "Dana Whitfield";
const MOVE_NAME = "Operating model reset";

type TableResult = { data: unknown; error: { message: string } | null };

/** Every builder the submit path opened, in order. */
type Issued = { table: string; op: string };

const issued: Issued[] = [];
/** `select` outcomes per table; the persons read resolves by await, the
 *  engagements read by `maybeSingle()`. Both go through the same builder. */
let selectResults: Record<string, TableResult> = {};

function builder(table: string) {
  const self: Record<string, unknown> = {};
  const chain = () => self as never;
  for (const method of [
    "select",
    "eq",
    "gte",
    "or",
    "order",
    "limit",
    "in",
    "neq",
    "is",
  ]) {
    self[method] = chain;
  }
  const settle = () =>
    Promise.resolve(
      selectResults[table] ?? ({ data: null, error: null } as TableResult),
    );
  self.maybeSingle = settle;
  self.single = settle;
  // The persons read is awaited directly, with no single-row terminator.
  self.then = (onFulfilled: (value: TableResult) => unknown) =>
    settle().then(onFulfilled);
  for (const op of ["insert", "update", "upsert", "delete"]) {
    self[op] = () => {
      issued.push({ table, op });
      return self as never;
    };
  }
  return self;
}

const fromMock = jest.fn((table: string) => {
  issued.push({ table, op: "open" });
  return builder(table);
});

jest.mock("@/app/api/v1/programs/_auth", () => ({
  requireTenancy: (...args: unknown[]) => requireTenancyMock(...args),
  TenancyError: class TenancyError extends Error {
    code = "unauthenticated";
  },
}));

jest.mock("@/lib/auth/program-access-policy", () => ({
  loadUserProgramAccessPolicy: (...args: unknown[]) =>
    loadAccessPolicyMock(...args),
}));

jest.mock("@/lib/active-client", () => ({
  getActiveClientRow: (...args: unknown[]) => getActiveClientRowMock(...args),
}));

jest.mock("@/lib/data-plane/postgresCompat", () => ({
  getAzureWriteFluentClient: () => ({ from: fromMock }),
  getAzureReadFluentClient: () => ({ from: fromMock }),
}));

jest.mock("../pattern-authority", () => ({
  programPatternLookupFromClient: () => jest.fn(),
  resolvePromotedProgramPatternKey: (...args: unknown[]) =>
    resolvePatternMock(...args),
  isProgramPatternAuthorityError: () => false,
}));

import { submitOriginationBrief } from "../origination-submit";
import { originationSubmitFailureSentence } from "../origination-submit-failure-text";

/** The driver text an operator needs and a product user must never read. */
const RAW = 'permission denied for table "engagements" at 10.2.0.4:5432';

function brief() {
  return {
    surface: "/strategic-moves/new",
    programName: MOVE_NAME,
    problemStatement:
      "The current operating model is not meeting its target outcomes.",
    sponsor: SPONSOR,
  } as never;
}

async function submitOutcome(): Promise<{
  code: string | null;
  message: string | null;
  status: number | null;
  result: { engagementId?: string } | null;
}> {
  try {
    const result = await submitOriginationBrief(brief());
    return { code: null, message: null, status: null, result };
  } catch (error) {
    const e = error as { code?: string; message?: string; status?: number };
    return {
      code: e.code ?? null,
      message: e.message ?? null,
      status: e.status ?? null,
      result: null,
    };
  }
}

/** Did the submit reach the write that creates the Move? */
function engagementInsertIssued(): boolean {
  return issued.some((i) => i.table === "engagements" && i.op === "insert");
}

let errorSpy: jest.SpyInstance;

beforeEach(() => {
  jest.clearAllMocks();
  issued.length = 0;
  errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  requireTenancyMock.mockResolvedValue({
    clientId: CLIENT_ID,
    clientKey: "tenant-a",
    userId: "user-1",
    role: "client_admin",
  });
  loadAccessPolicyMock.mockResolvedValue({ canCreatePrograms: true });
  getActiveClientRowMock.mockResolvedValue({
    id: CLIENT_ID,
    key: "tenant-a",
    name: CLIENT_NAME,
    industry_code: "general",
  });
  resolvePatternMock.mockImplementation(async (key: string | null) => key);
  selectResults = {
    // A real sponsor in this client's people records, so the submit reaches
    // the re-submit check rather than stopping on person resolution.
    persons: {
      data: [
        {
          id: "person-1",
          name: SPONSOR,
          role: "COO",
          organization: CLIENT_NAME,
          email: null,
        },
      ],
      error: null,
    },
    engagements: { data: null, error: null },
  };
});

afterEach(() => {
  errorSpy.mockRestore();
});

describe("P0 submit · the re-submit check reads its own error", () => {
  it("refuses rather than creating a second Move when the check cannot be read", async () => {
    selectResults.engagements = { data: null, error: { message: RAW } };

    const outcome = await submitOutcome();

    expect(outcome.code).toBe("duplicate_check_failed");
    // The decisive assertion: the Move was NOT created. This is the defect's
    // whole consequence -- the refusal is only how it is reported.
    expect(engagementInsertIssued()).toBe(false);
  });

  it("answers that refusal with a retryable status and the authored sentence", async () => {
    selectResults.engagements = { data: null, error: { message: RAW } };

    const outcome = await submitOutcome();

    expect(outcome.status).toBe(503);
    expect(outcome.message).toBe(
      originationSubmitFailureSentence("duplicate_check_failed"),
    );
  });

  it("does not hand the driver text to the field the clients render", async () => {
    // Both product clients render `message` AHEAD of `error`, so whatever
    // `message` carries is what a signed-in user reads.
    selectResults.engagements = { data: null, error: { message: RAW } };

    const outcome = await submitOutcome();

    expect(outcome.message).not.toContain(RAW);
    expect(outcome.message).not.toContain("permission denied");
    expect(outcome.message).not.toContain("5432");
  });

  it("still records the raw text for an operator", async () => {
    selectResults.engagements = { data: null, error: { message: RAW } };

    await submitOutcome();

    const logged = errorSpy.mock.calls.map((c) => JSON.stringify(c)).join(" ");
    expect(logged).toContain("permission denied");
    expect(logged).toContain("re-submit check failed");
  });

  it("tells the user to look before submitting again, because an earlier Move may exist", async () => {
    // This refusal's advice differs from the rest of the family on purpose:
    // the whole point is that whether the first submit landed is UNKNOWN, so
    // "submit again" alone would risk the duplicate the check prevents.
    const sentence = originationSubmitFailureSentence(
      "duplicate_check_failed",
    ).toLowerCase();

    expect(sentence).toContain("moves list");
    expect(sentence).toContain("submit again");
    expect(sentence).not.toBe(
      originationSubmitFailureSentence("engagement_insert_failed"),
    );
  });
});

describe("P0 submit · an absent Move is still an absent Move", () => {
  it("does not refuse when the check read cleanly and found nothing", async () => {
    // The guard must key on `error`, not on the missing row. Keying on the
    // row would refuse EVERY first submit -- the ordinary path.
    selectResults.engagements = { data: null, error: null };

    const outcome = await submitOutcome();

    expect(outcome.code).not.toBe("duplicate_check_failed");
    // And it got past the guard to the write that creates the Move.
    expect(engagementInsertIssued()).toBe(true);
  });

  it("still returns the earlier Move when the check read one", async () => {
    // The regression direction: a genuine double-submit must land back on the
    // Move the first one created, and must not create another.
    selectResults.engagements = {
      data: {
        id: "engagement-existing",
        name: MOVE_NAME,
        lifecycle_state: "submitted_for_approval",
        created_at: new Date().toISOString(),
      },
      error: null,
    };

    const outcome = await submitOutcome();

    expect(outcome.result?.engagementId).toBe("engagement-existing");
    expect(engagementInsertIssued()).toBe(false);
  });
});
