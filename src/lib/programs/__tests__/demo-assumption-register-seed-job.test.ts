/**
 * The demo assumptions register seed job
 * (`scripts/moves/seed-demo-assumption-register-job.ts`), against an in-memory
 * register that applies the register's own domain model — the same
 * `validateNewAssumption` / `planTransition` rules the real store runs.
 *
 * What is pinned:
 *   - the committed seed: schema, area coverage, roles never names, confidence
 *     1/3/5 only, every cited file present, a planning assumption never
 *     confirmed, and each rule refused on its own;
 *   - the tenant fence: every canonical tenant but the demo tenant is refused
 *     (keys derived from code), and a Move whose client resolves elsewhere is
 *     refused before the register is read;
 *   - the Move is the one the committed discovery load approval declares,
 *     authenticated by its persisted archetype, never looked up by name;
 *   - dry run reads and plans, and writes nothing;
 *   - apply needs the manifest's named-person load approval, writes through
 *     the register port as an operator `person` with origin `team`, and a
 *     second run writes 0;
 *   - the proof bundle carries the job-rule contract, and the workflow's
 *     validator accepts it and refuses what it must;
 *   - the dispatch workflow is manual, hash- and key-bound, and deploys nothing.
 */
import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import yaml from "js-yaml";

import { CANONICAL_TENANT_KEYS } from "@/config/tenants/CANONICAL_TENANTS";
import {
  namesAPerson,
  resolveLoadApproval,
} from "@/lib/governance/dataset-manifest";
import {
  formatRegisterId,
  INITIAL_STATUS_BY_ORIGIN,
  nextRegisterSeq,
  planTransition,
  validateNewAssumption,
  type AssumptionRecord,
} from "@/lib/programs/assumption-register/model";
import { tenantAliasesFor } from "@/lib/tenant/aliases";
import {
  APPLY_CONFIRMATION,
  DATASET_ID,
  DEMO_PLANNING_ASSUMPTION,
  DEMO_TENANT_CANONICAL_KEY,
  IDEMPOTENCY_PREFIX,
  MANIFEST_DIR,
  OPERATOR_USER_PREFIX,
  PROOF_DIR_NAME,
  PROOF_EVENT,
  RELEASE_RECORD,
  SEED_OWNER_ROLES,
  SEED_PATH,
  TENANT_REGISTRY_PATH,
  assertMoveDeclaration,
  idempotencyKeyFor,
  parseSeedJobArgs,
  runSeedJob,
  naturalKey,
  operatorActor,
  planSeedWrites,
  validateReadback,
  validateSeedDefinition,
  type MoveRegistryRow,
  type SeedJobDeps,
  type SeedRegisterPort,
  type SeedJobSummary,
} from "../../../../scripts/moves/seed-demo-assumption-register-job";
import {
  validateDemoRegisterSeedProof,
  validateDemoRegisterSeedProofManifest,
} from "../../../../scripts/moves/validate-demo-assumption-register-seed-proof.mjs";

const REPO = path.resolve(__dirname, "../../../..");
const read = (repoPath: string) =>
  readFileSync(path.join(REPO, repoPath), "utf8");
const exists = (repoPath: string) => existsSync(path.join(REPO, repoPath));
const sha = (value: string) => createHash("sha256").update(value).digest("hex");

const SEED_TEXT = read(SEED_PATH);
const SEED_HASH = sha(SEED_TEXT);
const SEED = JSON.parse(SEED_TEXT);
const MOVE_ID: string = SEED.move.move_id;
const CLIENT_ID = "0f1e2d3c-4b5a-4968-8776-655443322110";
const SEED_MANIFEST_FILE = "moves-demo-assumption-register-seed-v1.json";
const WORKFLOW_PATH = ".github/workflows/moves-demo-register-seed-job.yml";

function committedManifests(): Array<Record<string, unknown>> {
  const dir = path.join(REPO, MANIFEST_DIR);
  return readdirSync(dir)
    .filter((name) => name.endsWith(".json"))
    .map((name) => JSON.parse(readFileSync(path.join(dir, name), "utf8")));
}

/** The committed manifests, with this seed's load approval as a person would add it. */
/**
 * The committed manifests with this dataset's load approval removed: the
 * refusal paths are tested against a manifest no person has approved, whatever
 * the committed manifest says today.
 */
function unapprovedManifests(): Array<Record<string, unknown>> {
  return committedManifests().map((manifest) =>
    manifest.dataset_id === "moves_demo_assumption_register_seed_v1"
      ? { ...manifest, load_approval: null }
      : manifest,
  );
}

function approvedManifests(
  approval: Record<string, unknown> = {},
): Array<Record<string, unknown>> {
  return committedManifests().map((manifest) =>
    manifest.dataset_id === DATASET_ID
      ? {
          ...manifest,
          load_approval: {
            approved_by: "Dana Whitfield",
            approved_at: "2026-10-10",
            assessment_id: MOVE_ID,
            source_set_hash: SEED_HASH,
            release_record: RELEASE_RECORD,
            move_id: MOVE_ID,
            ...approval,
          },
        }
      : manifest,
  );
}

const BASE_ENV: Record<string, string> = {
  MOVES_REGISTER_SEED_MODE: "dry_run",
  MOVES_REGISTER_SEED_TENANT_KEY: DEMO_TENANT_CANONICAL_KEY,
  MOVES_REGISTER_SEED_INPUT_SHA256: SEED_HASH,
  MOVES_REGISTER_SEED_IDEMPOTENCY_KEY: idempotencyKeyFor(MOVE_ID, SEED_HASH),
  MOVES_REGISTER_SEED_RUN_ID: "moves-demo-register-seed-1",
  MOVES_REGISTER_SEED_BUILD_VERSION: "a".repeat(40),
  MOVES_REGISTER_SEED_IMAGE_DIGEST: `sha256:${"b".repeat(64)}`,
  MOVES_REGISTER_SEED_OPERATOR: "octo-operator",
  MOVES_REGISTER_SEED_RUN_ATTEMPT: "1",
  DATABASE_URL:
    "postgres://seed-test@abarva-lab.postgres.database.azure.com/abarva",
};
const APPLY_ENV: Record<string, string> = {
  ...BASE_ENV,
  MOVES_REGISTER_SEED_MODE: "apply",
  MOVES_REGISTER_SEED_APPLY_APPROVED: "true",
  MOVES_REGISTER_SEED_CONFIRMATION: APPLY_CONFIRMATION,
  MOVES_REGISTER_SEED_APPROVAL_REFERENCE: "LOAD-APPROVAL-1",
  AZURE_STORAGE_ACCOUNT_NAME: "abarvaproof",
  ECL_SYNTHETIC_STORAGE_IDENTITY_CLIENT_ID:
    "11111111-2222-4333-8444-555555555555",
};

const DEMO_MOVE: MoveRegistryRow = {
  id: MOVE_ID,
  clientId: CLIENT_ID,
  deletedAt: null,
  charter: { classification: { archetype: "governed_data_foundation" } },
  clientTenantKey: DEMO_TENANT_CANONICAL_KEY,
  clientSlug: "meridian",
};

// ── An in-memory register that runs the real domain model ───────────────────

type PortCall = {
  op: string;
  actor?: { kind: string; userId: string };
  ctx: unknown;
};

function fakeRegister(
  options: { failCreateAt?: number; historyErrorAt?: number } = {},
) {
  const rows: AssumptionRecord[] = [];
  const events: Array<{
    type: string;
    assumptionId: string;
    actorKind: string;
  }> = [];
  const calls: PortCall[] = [];
  let counter = 0;
  let creates = 0;
  const visible = (ctx: { clientKey?: string }, programId: string) =>
    rows.filter(
      (row) =>
        row.programId === programId &&
        tenantAliasesFor(ctx.clientKey ?? "").includes(row.tenantKey),
    );
  const port: SeedRegisterPort = {
    async list(ctx, programId) {
      calls.push({ op: "list", ctx });
      return visible(ctx, programId).map((row) => ({ ...row }));
    },
    async create(ctx, programId, input, actor) {
      calls.push({ op: "create", actor, ctx });
      creates += 1;
      if (options.failCreateAt === creates) {
        return { ok: false, refusal: { code: "id_allocation_conflict" } };
      }
      const validation = validateNewAssumption(input, actor);
      if (!validation.ok) return validation;
      const seq = nextRegisterSeq(visible(ctx, programId), input.area);
      counter += 1;
      const record: AssumptionRecord = {
        id: `00000000-0000-4000-8000-${String(counter).padStart(12, "0")}`,
        tenantKey: ctx.clientKey!,
        programId,
        area: input.area,
        seq,
        registerId: formatRegisterId(input.area, seq),
        statement: input.statement.trim(),
        whyItMatters: input.whyItMatters ?? null,
        workingFigure: input.workingFigure ?? null,
        workingValue: input.workingValue ?? null,
        unit: input.unit ?? null,
        source: input.source.trim(),
        confidence: input.confidence,
        ownerRole: input.ownerRole.trim(),
        ownerName: null,
        ownerPersonId: null,
        status: INITIAL_STATUS_BY_ORIGIN[input.origin],
        origin: input.origin,
        answer: null,
        answerFigure: null,
        answerValue: null,
        answerSource: null,
        answeredByUserId: null,
        answeredAt: null,
        acceptedByUserId: null,
        acceptedAt: null,
        supersededBy: null,
        raisedPhase: null,
        raisedStepId: null,
        evidenceIds: [],
        charterSectionKey: null,
        charterValueRevision: null,
        revision: 1,
        createdByUserId: actor.userId,
        createdAt: "2026-10-10T00:00:00.000Z",
        updatedAt: "2026-10-10T00:00:00.000Z",
      };
      rows.push(record);
      if (options.historyErrorAt === creates) {
        const error = new Error("history not recorded");
        error.name = "RegisterHistoryWriteError";
        throw error;
      }
      events.push({
        type: "created",
        assumptionId: record.id,
        actorKind: actor.kind,
      });
      return { ok: true, record: { ...record } };
    },
    async transition(
      ctx,
      programId,
      assumptionId,
      expectedRevision,
      request,
      actor,
    ) {
      calls.push({ op: "transition", actor, ctx });
      const current = visible(ctx, programId).find(
        (row) => row.id === assumptionId,
      );
      if (!current)
        return { ok: false, refusal: { code: "unknown_assumption" } };
      if (current.revision !== expectedRevision) {
        return {
          ok: false,
          refusal: {
            code: "stale_revision",
            currentRevision: current.revision,
          },
        };
      }
      const planned = planTransition(
        current,
        request,
        actor,
        "2026-10-10T00:00:00.000Z",
      );
      if (!planned.ok) return planned;
      Object.assign(current, planned.patch, { revision: current.revision + 1 });
      events.push({ type: planned.to, assumptionId, actorKind: actor.kind });
      return { ok: true, record: { ...current } };
    },
  };
  return { port, rows, events, calls };
}

type Harness = {
  deps: SeedJobDeps;
  local: Record<string, unknown>;
  blobs: Record<string, string>;
  logs: string[];
  bundles: () => number;
  proofOpened: () => number;
};

function harness(
  register: SeedRegisterPort,
  overrides: Partial<SeedJobDeps> = {},
  manifests: Array<Record<string, unknown>> = unapprovedManifests(),
): Harness {
  const local: Record<string, unknown> = {};
  const blobs: Record<string, string> = {};
  const logs: string[] = [];
  let bundles = 0;
  let proofOpened = 0;
  const uri = (blobPath: string) =>
    `https://abarvaproof.blob.core.windows.net/ecl-synthetic-intake/${blobPath}`;
  const deps: SeedJobDeps = {
    readText: read,
    fileExists: exists,
    listManifests: () => manifests,
    readMoveRegistryRow: async () => ({ ...DEMO_MOVE }),
    register,
    async openProofStore() {
      proofOpened += 1;
      return {
        uriFor: uri,
        read: async () => Buffer.alloc(0),
        async writeOnce(blobPath: string, bytes: Buffer) {
          if (blobs[blobPath] !== undefined)
            return { uri: uri(blobPath), created: false };
          blobs[blobPath] = bytes.toString("utf8");
          return { uri: uri(blobPath), created: true };
        },
      };
    },
    writeLocal: (name, value) => {
      local[name] = value;
    },
    emitBundle: () => {
      bundles += 1;
    },
    log: (line) => logs.push(line),
    now: () => "2026-10-10T00:00:00.000Z",
    ...overrides,
  };
  return {
    deps,
    local,
    blobs,
    logs,
    bundles: () => bundles,
    proofOpened: () => proofOpened,
  };
}

const writeCalls = (calls: PortCall[]) =>
  calls.filter((call) => call.op === "create" || call.op === "transition");

function clone() {
  return JSON.parse(SEED_TEXT);
}

function refused(seed: unknown, fragment: string) {
  const result = validateSeedDefinition(seed, exists);
  expect(result.ok).toBe(false);
  expect(result.errors.join("\n")).toContain(fragment);
}

// ── The seed definition ──────────────────────────────────────────────────────

describe("the committed seed definition", () => {
  const result = validateSeedDefinition(SEED, exists);

  it("validates, and covers value, data, delivery and adoption in 12-16 rows", () => {
    expect(result.errors).toEqual([]);
    expect(result.ok).toBe(true);
    const rows = SEED.rows as Array<Record<string, unknown>>;
    expect(rows.length).toBeGreaterThanOrEqual(12);
    expect(rows.length).toBeLessThanOrEqual(16);
    expect(new Set(rows.map((row) => row.area))).toEqual(
      new Set(["value", "data", "delivery", "adoption"]),
    );
  });

  it("names owner ROLES, never people, with confidence 1, 3 or 5 only", () => {
    for (const role of SEED_OWNER_ROLES) expect(namesAPerson(role)).toBe(false);
    for (const row of SEED.rows) {
      expect(SEED_OWNER_ROLES).toContain(row.owner_role);
      expect(namesAPerson(row.owner_role)).toBe(false);
      expect([1, 3, 5]).toContain(row.confidence);
      expect(row).not.toHaveProperty("owner_name");
    }
  });

  it("confirms a few rows with an answer and a cited answer source, and leaves the rest open", () => {
    const confirmed = SEED.rows.filter(
      (row: { confirm: unknown }) => row.confirm,
    );
    expect(confirmed.length).toBeGreaterThanOrEqual(2);
    expect(confirmed.length).toBeLessThan(SEED.rows.length / 2);
    for (const row of confirmed) {
      expect(row.confirm.answer.length).toBeGreaterThan(0);
      expect(exists(row.confirm.answer_source_ref)).toBe(true);
      expect(row.confirm.answer_source).toContain(
        `[${row.confirm.answer_source_ref}]`,
      );
    }
  });

  it("cites a file that exists for every figure, or labels it a demo planning assumption", () => {
    for (const row of SEED.rows) {
      if (row.source_ref === null)
        expect(row.source).toBe(DEMO_PLANNING_ASSUMPTION);
      else expect(exists(row.source_ref)).toBe(true);
    }
    expect(
      SEED.rows.some((row: { source_ref: unknown }) => row.source_ref === null),
    ).toBe(true);
  });

  it("is synthetic, for the demo tenant, and names the Move the discovery load approval declares", () => {
    expect(SEED.synthetic).toBe(true);
    expect(SEED.client_attested).toBe(false);
    expect(SEED.tenant.canonical_tenant_key).toBe(DEMO_TENANT_CANONICAL_KEY);
    expect(() =>
      assertMoveDeclaration(result.seed!, committedManifests()),
    ).not.toThrow();
  });

  it("refuses each rule on its own", () => {
    let seed = clone();
    seed.rows[0].owner_role = "Dana Whitfield";
    refused(seed, "rows.0.owner_role");

    for (const confidence of [0, 2, 4]) {
      seed = clone();
      seed.rows[1].confidence = confidence;
      refused(seed, "rows.1.confidence");
    }

    seed = clone();
    seed.rows[2].owner_name = "Dana Whitfield";
    refused(seed, "rows.2");

    seed = clone();
    seed.rows[0].source_ref = null;
    refused(
      seed,
      `rows.0.source: an uncited source must be "${DEMO_PLANNING_ASSUMPTION}"`,
    );

    seed = clone();
    seed.rows[0].source = "Synthetic tenant intake, programs and initiatives";
    refused(seed, "rows.0.source: does not cite");

    seed = clone();
    seed.rows[0].source_ref = "datasets/does-not-exist.csv";
    seed.rows[0].source = "Missing [datasets/does-not-exist.csv]";
    refused(
      seed,
      "rows.0.source_ref: datasets/does-not-exist.csv does not exist",
    );

    for (const outside of [
      "src/lib/programs/types.db.ts",
      "datasets/../package.json",
    ]) {
      seed = clone();
      seed.rows[0].source_ref = outside;
      seed.rows[0].source = `Outside [${outside}]`;
      refused(seed, "rows.0.source_ref");
    }

    const planning = SEED.rows.findIndex(
      (row: { source_ref: unknown }) => row.source_ref === null,
    );
    const confirmed = SEED.rows.findIndex(
      (row: { confirm: unknown }) => row.confirm,
    );
    seed = clone();
    seed.rows[planning].confirm = seed.rows[confirmed].confirm;
    refused(
      seed,
      `rows.${planning}.confirm: a planning assumption cannot be confirmed`,
    );

    seed = clone();
    delete seed.rows[confirmed].confirm.answer_source;
    refused(seed, `rows.${confirmed}.confirm.answer_source`);

    seed = clone();
    seed.rows[confirmed].confirm.answer_source = "Assessment row, no citation";
    refused(seed, `rows.${confirmed}.confirm.answer_source: does not cite`);

    seed = clone();
    seed.rows[confirmed].confirm.answer_source_ref = "datasets/nope.csv";
    seed.rows[confirmed].confirm.answer_source = "Nope [datasets/nope.csv]";
    refused(
      seed,
      `rows.${confirmed}.confirm.answer_source_ref: datasets/nope.csv does not exist`,
    );

    seed = clone();
    seed.rows[1].seed_key = "value.duplicate_statement";
    seed.rows[1].statement = seed.rows[0].statement
      .toUpperCase()
      .replace(/ /g, "  ");
    refused(seed, "rows.1.statement: duplicates another row's natural key");

    seed = clone();
    seed.rows[1].seed_key = seed.rows[0].seed_key;
    refused(seed, `rows.1.seed_key: duplicate ${seed.rows[0].seed_key}`);

    seed = clone();
    seed.rows[0].seed_key = "data.program_budget";
    refused(seed, "rows.0.seed_key: prefix does not match area value");

    seed = clone();
    seed.tenant.canonical_tenant_key = "skyharbor-air";
    refused(seed, "tenant.canonical_tenant_key: not the synthetic demo tenant");

    seed = clone();
    seed.rows = seed.rows.filter(
      (row: { area: string }) => row.area !== "adoption",
    );
    refused(seed, "rows: no adoption row");

    seed = clone();
    for (const row of seed.rows) row.confirm = null;
    refused(seed, "rows: a seed must leave some rows open and confirm some");

    seed = clone();
    const answer = seed.rows[confirmed].confirm;
    for (const row of seed.rows) if (row.source_ref) row.confirm = answer;
    seed.rows = seed.rows.filter(
      (row: { source_ref: unknown }) => row.source_ref,
    );
    refused(seed, "rows: a seed must leave some rows open and confirm some");

    seed = clone();
    seed.rows[0].statement =
      "Ask the program owner at owner@example.org for the budget figure.";
    refused(seed, "rows.0: contains contact data or a link");
  });
});

// ── Arguments and the tenant fence ───────────────────────────────────────────

describe("the seed's size and binding", () => {
  it("refuses a seed of fewer than 12 rows", () => {
    const seed = clone();
    seed.rows = seed.rows.slice(0, 11);
    refused(seed, "rows: Too small");
  });

  it("binds the idempotency key to both the Move and the exact seed bytes", () => {
    expect(idempotencyKeyFor(MOVE_ID, SEED_HASH)).toBe(
      `${IDEMPOTENCY_PREFIX}:${sha(`${MOVE_ID}|${SEED_HASH}`)}`,
    );
    expect(idempotencyKeyFor(CLIENT_ID, SEED_HASH)).not.toBe(
      idempotencyKeyFor(MOVE_ID, SEED_HASH),
    );
  });
});

describe("the tenant fence", () => {
  it("refuses every canonical tenant except the synthetic demo tenant", () => {
    const others = CANONICAL_TENANT_KEYS.filter(
      (key) => key !== DEMO_TENANT_CANONICAL_KEY,
    );
    expect(others.length).toBeGreaterThan(0);
    for (const tenantKey of [...others, "not-a-tenant"]) {
      expect(() =>
        parseSeedJobArgs({
          ...BASE_ENV,
          MOVES_REGISTER_SEED_TENANT_KEY: tenantKey,
        }),
      ).toThrow("demo_tenant_only");
    }
  });

  it("accepts the demo tenant by its canonical key or its app alias", () => {
    for (const tenantKey of [DEMO_TENANT_CANONICAL_KEY, "meridian"]) {
      const args = parseSeedJobArgs({
        ...BASE_ENV,
        MOVES_REGISTER_SEED_TENANT_KEY: tenantKey,
      });
      expect(args.canonicalTenantKey).toBe(DEMO_TENANT_CANONICAL_KEY);
      expect(args.appClientKey).toBe("meridian");
    }
  });

  it("refuses a run whose Move's client resolves to another tenant, before reading the register", async () => {
    for (const client of [
      { clientTenantKey: "skyharbor-air", clientSlug: "skyharbor" },
      { clientTenantKey: DEMO_TENANT_CANONICAL_KEY, clientSlug: "apexretail" },
      { clientTenantKey: null, clientSlug: null },
    ]) {
      const register = fakeRegister();
      const h = harness(register.port, {
        readMoveRegistryRow: async () => ({ ...DEMO_MOVE, ...client }),
      });
      const summary = await runSeedJob(parseSeedJobArgs(BASE_ENV), h.deps);
      expect(summary.status).toBe("failed");
      expect(summary.error).toBe("move_tenant_mismatch");
      expect(register.calls).toEqual([]);
    }
  });

  it("refuses a tenant the registry does not declare synthetic-demo", async () => {
    const register = fakeRegister();
    const registry = JSON.parse(read(TENANT_REGISTRY_PATH));
    for (const tenant of registry.activeTenants) {
      for (const packet of tenant.packets)
        packet.classification = "client-provided";
    }
    const h = harness(register.port, {
      readText: (repoPath) =>
        repoPath === TENANT_REGISTRY_PATH
          ? JSON.stringify(registry)
          : read(repoPath),
    });
    const summary = await runSeedJob(parseSeedJobArgs(BASE_ENV), h.deps);
    expect(summary.error).toBe("tenant_not_declared_synthetic_demo");
    expect(register.calls).toEqual([]);
  });

  it("refuses a Move the discovery load approval does not declare, or one it cannot authenticate", async () => {
    const undeclared = committedManifests().map((manifest) =>
      manifest.dataset_id === SEED.move.declared_by.manifest_dataset_id
        ? {
            ...manifest,
            load_approval: {
              ...(manifest.load_approval as object),
              move_id: "99999999-9999-4999-8999-999999999999",
            },
          }
        : manifest,
    );
    const cases: Array<
      [Partial<SeedJobDeps>, Array<Record<string, unknown>>, string]
    > = [
      [{}, undeclared, "move_not_declared_by_manifest"],
      [
        {},
        committedManifests().filter(
          (manifest) =>
            manifest.dataset_id !== SEED.move.declared_by.manifest_dataset_id,
        ),
        "move_declaration_manifest_not_unique",
      ],
      [
        { readMoveRegistryRow: async () => null },
        committedManifests(),
        "move_not_found",
      ],
      [
        {
          readMoveRegistryRow: async () => ({
            ...DEMO_MOVE,
            deletedAt: "2026-10-01",
          }),
        },
        committedManifests(),
        "move_not_found",
      ],
      [
        { readMoveRegistryRow: async () => ({ ...DEMO_MOVE, id: CLIENT_ID }) },
        committedManifests(),
        "move_not_found",
      ],
      [
        {
          readMoveRegistryRow: async () => ({
            ...DEMO_MOVE,
            charter: { classification: { archetype: "other" } },
          }),
        },
        committedManifests(),
        "move_archetype_mismatch",
      ],
      [
        { readMoveRegistryRow: async () => ({ ...DEMO_MOVE, charter: null }) },
        committedManifests(),
        "move_archetype_mismatch",
      ],
    ];
    for (const [overrides, manifests, code] of cases) {
      const register = fakeRegister();
      const h = harness(register.port, overrides, manifests);
      const summary = await runSeedJob(parseSeedJobArgs(BASE_ENV), h.deps);
      expect(summary.error).toBe(code);
      expect(register.calls).toEqual([]);
    }
  });

  it("refuses unpinned, unauthorized or malformed job contracts", () => {
    const refusals: Array<[Record<string, string | undefined>, string]> = [
      [{ MOVES_REGISTER_SEED_MODE: "write" }, "invalid_job_mode"],
      [{ MOVES_REGISTER_SEED_INPUT_SHA256: "abc" }, "invalid_input_sha256"],
      [{ MOVES_REGISTER_SEED_RUN_ID: "run id" }, "invalid_run_id"],
      [
        { MOVES_REGISTER_SEED_BUILD_VERSION: "main" },
        "git_sha_build_version_required",
      ],
      [
        { MOVES_REGISTER_SEED_IMAGE_DIGEST: "lab-latest" },
        "digest_pinned_image_required",
      ],
      [{ MOVES_REGISTER_SEED_OPERATOR: "octo operator" }, "invalid_operator"],
      [{ MOVES_REGISTER_SEED_RUN_ATTEMPT: "0" }, "invalid_run_attempt"],
      [
        { DATABASE_URL: "postgres://seed-test@localhost/abarva" },
        "non_azure_database_refused",
      ],
      [{ DATABASE_URL: undefined }, "DATABASE_URL_required"],
      [
        { MOVES_REGISTER_SEED_IDEMPOTENCY_KEY: undefined },
        "MOVES_REGISTER_SEED_IDEMPOTENCY_KEY_required",
      ],
    ];
    for (const [patch, code] of refusals) {
      expect(() => parseSeedJobArgs({ ...BASE_ENV, ...patch })).toThrow(code);
    }
    const applyRefusals: Array<[Record<string, string | undefined>, string]> = [
      [{ MOVES_REGISTER_SEED_APPLY_APPROVED: "yes" }, "apply_not_authorized"],
      [{ MOVES_REGISTER_SEED_CONFIRMATION: "APPLY" }, "apply_not_authorized"],
      [
        { MOVES_REGISTER_SEED_APPROVAL_REFERENCE: undefined },
        "MOVES_REGISTER_SEED_APPROVAL_REFERENCE_required",
      ],
      [
        { AZURE_STORAGE_ACCOUNT_NAME: undefined },
        "AZURE_STORAGE_ACCOUNT_NAME_required",
      ],
      [
        { ECL_SYNTHETIC_STORAGE_IDENTITY_CLIENT_ID: undefined },
        "ECL_SYNTHETIC_STORAGE_IDENTITY_CLIENT_ID_required",
      ],
    ];
    for (const [patch, code] of applyRefusals) {
      expect(() => parseSeedJobArgs({ ...APPLY_ENV, ...patch })).toThrow(code);
    }
    const dryRun = parseSeedJobArgs({
      ...BASE_ENV,
      MOVES_REGISTER_SEED_MODE: undefined,
    });
    expect(dryRun.mode).toBe("dry_run");
    expect(dryRun.approvalReference).toBeNull();
    expect(dryRun.outDir.endsWith(PROOF_DIR_NAME)).toBe(true);
  });
});

// ── Dry run ──────────────────────────────────────────────────────────────────

describe("dry run", () => {
  it("authenticates the Move, reads the register, prints the planned writes, and writes nothing", async () => {
    const register = fakeRegister();
    const h = harness(register.port);
    const summary = await runSeedJob(parseSeedJobArgs(BASE_ENV), h.deps);
    expect(summary.status).toBe("succeeded");
    expect(summary.mode).toBe("dry_run");
    expect(register.calls.map((call) => call.op)).toEqual(["list"]);
    expect(writeCalls(register.calls)).toEqual([]);
    expect(register.rows).toEqual([]);
    expect(h.proofOpened()).toBe(0);
    expect(h.blobs).toEqual({});
    expect(summary.writes).toEqual({ created: 0, confirmed: 0, total: 0 });
    expect(summary.committed).toBe(false);
    expect(summary.plan.map((item) => item.action)).toEqual(
      SEED.rows.map(() => "create"),
    );
    const planned = h.logs.filter((line) =>
      line.includes("moves_demo_register_seed_planned_write"),
    );
    expect(planned).toHaveLength(SEED.rows.length);
    expect(summary.qualityGate).toMatchObject({
      passed: true,
      plannedWrites:
        SEED.rows.length +
        SEED.rows.filter((row: { confirm: unknown }) => row.confirm).length,
      readback: "not_run_for_dry_run",
    });
    expect(summary.loadApproval).toEqual({
      approved: false,
      reasons: ["manifest carries no load_approval"],
    });
    expect(summary.blobProofLocation).toBe("not_required_for_dry_run");
  });
});

// ── Apply ────────────────────────────────────────────────────────────────────

describe("apply", () => {
  const confirmCount = SEED.rows.filter(
    (row: { confirm: unknown }) => row.confirm,
  ).length;

  it("refuses to write without the manifest's named-person load approval", async () => {
    const register = fakeRegister();
    const h = harness(register.port);
    const summary = await runSeedJob(parseSeedJobArgs(APPLY_ENV), h.deps);
    expect(summary.status).toBe("failed");
    expect(summary.failedStage).toBe("load-approval");
    expect(summary.error).toContain(
      "load_approval_refused:manifest carries no load_approval",
    );
    expect(register.calls).toEqual([]);
    expect(summary.committed).toBe(false);
  });

  it("refuses an approval for another seed hash, another Move or another release record", async () => {
    const cases: Array<[Record<string, unknown>, string]> = [
      [
        { source_set_hash: "c".repeat(64) },
        "load_approval is for a different source-set hash",
      ],
      [{ move_id: CLIENT_ID }, "load_approval is not pinned to this Move"],
      [
        { release_record: "docs/releases/records/other.md" },
        "load_approval_release_record_mismatch",
      ],
    ];
    for (const [approval, fragment] of cases) {
      const register = fakeRegister();
      const h = harness(register.port, {}, approvedManifests(approval));
      const summary = await runSeedJob(parseSeedJobArgs(APPLY_ENV), h.deps);
      expect(summary.error).toContain(fragment);
      expect(writeCalls(register.calls)).toEqual([]);
    }
  });

  it("writes every row through the register port as an operator person with origin team", async () => {
    const register = fakeRegister();
    const h = harness(register.port, {}, approvedManifests());
    const summary = await runSeedJob(parseSeedJobArgs(APPLY_ENV), h.deps);
    expect(summary.error).toBeNull();
    expect(summary.status).toBe("succeeded");
    expect(summary.writes).toEqual({
      created: SEED.rows.length,
      confirmed: confirmCount,
      total: SEED.rows.length + confirmCount,
    });
    expect(summary.committed).toBe(true);
    expect(register.rows).toHaveLength(SEED.rows.length);
    expect(register.events).toHaveLength(SEED.rows.length + confirmCount);
    for (const call of writeCalls(register.calls)) {
      expect(call.actor).toEqual({
        kind: "person",
        userId: `${OPERATOR_USER_PREFIX}octo-operator`,
      });
      expect(call.ctx).toEqual({
        clientId: CLIENT_ID,
        clientKey: "meridian",
        userId: `${OPERATOR_USER_PREFIX}octo-operator`,
      });
    }
    expect(
      register.rows.every(
        (row) => row.origin === "team" && row.tenantKey === "meridian",
      ),
    ).toBe(true);
    expect(
      register.rows.filter((row) => row.status === "confirmed"),
    ).toHaveLength(confirmCount);
    expect(register.rows.filter((row) => row.status === "open")).toHaveLength(
      SEED.rows.length - confirmCount,
    );
    expect(register.rows.map((row) => row.registerId)).toEqual([
      "V1",
      "V2",
      "V3",
      "V4",
      "D1",
      "D2",
      "D3",
      "D4",
      "D5",
      "DL1",
      "DL2",
      "DL3",
      "DL4",
      "A1",
      "A2",
      "A3",
    ]);
    expect(summary.validation).toMatchObject({
      passed: true,
      seedRows: SEED.rows.length,
      rowsFound: SEED.rows.length,
      confirmedRows: confirmCount,
      agentContextRows: SEED.rows.length,
      generationFigures: SEED.rows.length,
      failures: [],
    });
    for (const row of register.rows.filter(
      (record) => record.status === "confirmed",
    )) {
      const seedRow = SEED.rows.find(
        (candidate: { statement: string }) =>
          candidate.statement === row.statement,
      );
      expect(row.answerSource).toBe(seedRow.confirm.answer_source);
      expect(row.answeredByUserId).toBe(`${OPERATOR_USER_PREFIX}octo-operator`);
    }
  });

  it("is idempotent: a second run writes 0 and the register and history are unchanged", async () => {
    const register = fakeRegister();
    await runSeedJob(
      parseSeedJobArgs(APPLY_ENV),
      harness(register.port, {}, approvedManifests()).deps,
    );
    const rowsBefore = JSON.stringify(register.rows);
    const eventsBefore = register.events.length;
    const writesBefore = writeCalls(register.calls).length;
    const second = await runSeedJob(
      parseSeedJobArgs({
        ...APPLY_ENV,
        MOVES_REGISTER_SEED_RUN_ID: "moves-demo-register-seed-2",
      }),
      harness(register.port, {}, approvedManifests()).deps,
    );
    expect(second.status).toBe("succeeded");
    expect(second.writes.total).toBe(0);
    expect(second.committed).toBe(false);
    expect(
      second.plan.every(
        (item) => item.action === "present" && item.writes === 0,
      ),
    ).toBe(true);
    expect(writeCalls(register.calls)).toHaveLength(writesBefore);
    expect(register.events).toHaveLength(eventsBefore);
    expect(JSON.stringify(register.rows)).toBe(rowsBefore);
    expect(second.validation?.passed).toBe(true);
  });

  it("finishes the confirm an interrupted run did not reach, and only that", async () => {
    const register = fakeRegister();
    const confirmed = SEED.rows.findIndex(
      (row: { confirm: unknown }) => row.confirm,
    );
    const row = SEED.rows[confirmed];
    await register.port.create(
      {
        clientId: CLIENT_ID,
        clientKey: "meridian",
        userId: "operator:earlier",
      },
      MOVE_ID,
      {
        area: row.area,
        statement: row.statement,
        source: row.source,
        confidence: row.confidence,
        ownerRole: row.owner_role,
        origin: "team",
      },
      { kind: "person", userId: "operator:earlier" },
    );
    const summary = await runSeedJob(
      parseSeedJobArgs(APPLY_ENV),
      harness(register.port, {}, approvedManifests()).deps,
    );
    expect(summary.status).toBe("succeeded");
    expect(summary.plan[confirmed]).toMatchObject({
      action: "confirm_existing",
      writes: 1,
    });
    expect(summary.writes).toEqual({
      created: SEED.rows.length - 1,
      confirmed: confirmCount,
      total: SEED.rows.length - 1 + confirmCount,
    });
    expect(register.rows).toHaveLength(SEED.rows.length);
    expect(summary.validation?.passed).toBe(true);
  });

  it("leaves a row a person has changed since, and writes nothing for it", async () => {
    const register = fakeRegister();
    await runSeedJob(
      parseSeedJobArgs(APPLY_ENV),
      harness(register.port, {}, approvedManifests()).deps,
    );
    const target = register.rows.find((row) => row.status === "confirmed")!;
    const corrected = await register.port.transition(
      { clientId: CLIENT_ID, clientKey: "meridian", userId: "user_person" },
      MOVE_ID,
      target.id,
      target.revision,
      {
        action: "correct",
        answer: "A person's correction",
        answerSource: "Workshop notes",
      },
      { kind: "person", userId: "user_person" },
    );
    expect(corrected.ok).toBe(true);
    const openTarget = register.rows.find((row) => row.status === "open")!;
    const personConfirmed = await register.port.transition(
      { clientId: CLIENT_ID, clientKey: "meridian", userId: "user_person" },
      MOVE_ID,
      openTarget.id,
      openTarget.revision,
      { action: "confirm", answerSource: "Workshop notes" },
      { kind: "person", userId: "user_person" },
    );
    expect(personConfirmed.ok).toBe(true);
    const writesBefore = writeCalls(register.calls).length;
    const summary = await runSeedJob(
      parseSeedJobArgs({
        ...APPLY_ENV,
        MOVES_REGISTER_SEED_RUN_ID: "moves-demo-register-seed-3",
      }),
      harness(register.port, {}, approvedManifests()).deps,
    );
    expect(summary.status).toBe("succeeded");
    expect(summary.writes.total).toBe(0);
    expect(
      summary.plan.filter((item) => item.action === "human_changed"),
    ).toHaveLength(2);
    expect(writeCalls(register.calls)).toHaveLength(writesBefore);
    expect(summary.validation).toMatchObject({
      passed: true,
      humanChangedRows: 2,
    });
  });

  it("does not confirm an open row a person created with the same statement", async () => {
    const register = fakeRegister();
    const confirmed = SEED.rows.findIndex(
      (row: { confirm: unknown }) => row.confirm,
    );
    const row = SEED.rows[confirmed];
    await register.port.create(
      { clientId: CLIENT_ID, clientKey: "meridian", userId: "user_person" },
      MOVE_ID,
      {
        area: row.area,
        statement: row.statement,
        source: "Workshop",
        confidence: 3,
        ownerRole: row.owner_role,
        origin: "team",
      },
      { kind: "person", userId: "user_person" },
    );
    const summary = await runSeedJob(
      parseSeedJobArgs(APPLY_ENV),
      harness(register.port, {}, approvedManifests()).deps,
    );
    expect(summary.plan[confirmed]).toMatchObject({
      action: "human_changed",
      writes: 0,
    });
    expect(
      register.rows.filter((record) => record.statement === row.statement),
    ).toHaveLength(1);
    expect(
      register.rows.find((record) => record.statement === row.statement)
        ?.status,
    ).toBe("open");
  });

  it("refuses a key or a seed that is not the one dispatched, before any register call", async () => {
    for (const [patch, code] of [
      [
        {
          MOVES_REGISTER_SEED_IDEMPOTENCY_KEY: `${IDEMPOTENCY_PREFIX}:${"d".repeat(64)}`,
        },
        "idempotency_key_mismatch",
      ],
      [
        { MOVES_REGISTER_SEED_INPUT_SHA256: "e".repeat(64) },
        "input_sha256_mismatch",
      ],
    ] as const) {
      const register = fakeRegister();
      const summary = await runSeedJob(
        parseSeedJobArgs({ ...APPLY_ENV, ...patch }),
        harness(register.port, {}, approvedManifests()).deps,
      );
      expect(summary.error).toBe(code);
      expect(register.calls).toEqual([]);
    }
  });

  it("stops on a store refusal, and says which writes landed", async () => {
    const register = fakeRegister({ failCreateAt: 3 });
    const summary = await runSeedJob(
      parseSeedJobArgs(APPLY_ENV),
      harness(register.port, {}, approvedManifests()).deps,
    );
    expect(summary.status).toBe("failed");
    expect(summary.failedStage).toBe("register-write");
    expect(summary.error).toBe("register_refused:id_allocation_conflict");
    expect(summary.committed).toBe(true);
    expect(summary.writes.created).toBe(2);
  });

  it("reports a change that landed without its history event as committed", async () => {
    const register = fakeRegister({ historyErrorAt: 1 });
    const summary = await runSeedJob(
      parseSeedJobArgs(APPLY_ENV),
      harness(register.port, {}, approvedManifests()).deps,
    );
    expect(summary.status).toBe("failed");
    expect(summary.writes.total).toBe(0);
    expect(summary.committed).toBe(true);
  });

  it("fails the run when the readback does not show the seed", async () => {
    const register = fakeRegister();
    const port: SeedRegisterPort = {
      ...register.port,
      list: async (ctx, programId) => {
        const rows = await register.port.list(ctx, programId);
        return register.calls.filter((call) => call.op === "list").length > 1
          ? rows.slice(1)
          : rows;
      },
    };
    const summary = await runSeedJob(
      parseSeedJobArgs(APPLY_ENV),
      harness(port, {}, approvedManifests()).deps,
    );
    expect(summary.status).toBe("failed");
    expect(summary.failedStage).toBe("readback");
    expect(summary.error).toContain(
      `readback_failed:${SEED.rows[0].seed_key}: 0 register rows`,
    );
  });

  it("treats two register rows under one natural key as changed by a person, and writes nothing for them", async () => {
    const register = fakeRegister();
    const ctx = {
      clientId: CLIENT_ID,
      clientKey: "meridian",
      userId: "operator:earlier",
    };
    const actor = { kind: "person" as const, userId: "operator:earlier" };
    const open = SEED.rows.findIndex(
      (row: { confirm: unknown }) => !row.confirm,
    );
    const confirmed = SEED.rows.findIndex(
      (row: { confirm: unknown }) => row.confirm,
    );
    for (const index of [open, open, confirmed, confirmed]) {
      const row = SEED.rows[index];
      await register.port.create(
        ctx,
        MOVE_ID,
        {
          area: row.area,
          statement: row.statement,
          workingFigure: row.working_figure,
          source: row.source,
          confidence: row.confidence,
          ownerRole: row.owner_role,
          origin: "team",
        },
        actor,
      );
    }
    const plan = planSeedWrites(
      SEED.rows,
      await register.port.list(ctx, MOVE_ID),
    );
    expect(plan[open]).toMatchObject({ action: "human_changed", writes: 0 });
    expect(plan[confirmed]).toMatchObject({
      action: "human_changed",
      writes: 0,
    });
  });
});

describe("the readback", () => {
  async function seeded() {
    const register = fakeRegister();
    const summary = await runSeedJob(
      parseSeedJobArgs(APPLY_ENV),
      harness(register.port, {}, approvedManifests()).deps,
    );
    return { register, plan: summary.plan };
  }
  const scope = {
    clientId: CLIENT_ID,
    appClientKey: "meridian",
    actor: operatorActor("octo-operator"),
  };

  it("names each way a seeded row can differ from the seed", async () => {
    const { register, plan } = await seeded();
    const at = (seedIndex: number) =>
      register.rows.find(
        (row) =>
          naturalKey(row.area, row.statement) ===
          naturalKey(SEED.rows[seedIndex].area, SEED.rows[seedIndex].statement),
      )!;
    const open = SEED.rows.findIndex(
      (row: { confirm: unknown }) => !row.confirm,
    );
    const confirmed = SEED.rows.findIndex(
      (row: { confirm: unknown }) => row.confirm,
    );
    const cases: Array<[(row: AssumptionRecord) => void, number, string]> = [
      [
        (row) => (row.status = "corrected"),
        open,
        "status corrected, expected open",
      ],
      [(row) => (row.origin = "ava_proposal"), open, "origin ava_proposal"],
      [(row) => (row.tenantKey = "apexretail"), open, "tenant key apexretail"],
      [
        (row) => (row.createdByUserId = "operator:someone-else"),
        open,
        "not created by this operator",
      ],
      [
        (row) => (row.answerSource = "Another source"),
        confirmed,
        "answer source differs",
      ],
      [
        (row) => (row.tenantKey = "not-a-tenant"),
        open,
        "1 seeded rows blocked from agent context",
      ],
      [
        (row) => (row.workingFigure = null),
        open,
        "1 seeded rows reach generation without a figure",
      ],
    ];
    for (const [tamper, index, message] of cases) {
      const rows = register.rows.map((row) => ({ ...row }));
      const target = rows.find((row) => row.id === at(index).id)!;
      tamper(target);
      const result = validateReadback(SEED.rows, plan, rows, scope);
      expect(result.passed).toBe(false);
      expect(result.failures.join("\n")).toContain(message);
    }
    const clean = validateReadback(SEED.rows, plan, register.rows, scope);
    expect(clean).toMatchObject({
      passed: true,
      failures: [],
      humanChangedRows: 0,
    });
  });

  it("refuses a seed row the register holds twice", async () => {
    const { register, plan } = await seeded();
    const duplicate = {
      ...register.rows[0],
      id: "00000000-0000-4000-8000-999999999999",
    };
    const result = validateReadback(
      SEED.rows,
      plan,
      [...register.rows, duplicate],
      scope,
    );
    expect(result.passed).toBe(false);
    expect(result.failures).toContain(
      `${SEED.rows[0].seed_key}: 2 register rows`,
    );
  });

  it("counts a row a person changed apart, and does not hold it to the seed", async () => {
    const { register, plan } = await seeded();
    const changed = plan.map((item, index) =>
      index === 0 ? { ...item, action: "human_changed" as const } : item,
    );
    const rows = register.rows.map((row) => ({ ...row }));
    rows.find((row) => row.registerId === "V1")!.status = "superseded";
    const result = validateReadback(SEED.rows, changed, rows, scope);
    expect(result).toMatchObject({
      passed: true,
      humanChangedRows: 1,
      rowsFound: SEED.rows.length,
      agentContextRows: SEED.rows.length - 1,
    });
  });
});

// ── Proof bundle ─────────────────────────────────────────────────────────────

const JOB_RULE_FIELDS = [
  "jobName",
  "runId",
  "tenantScope",
  "buildVersion",
  "inputSourceVersion",
  "idempotencyKey",
  "startedAt",
  "finishedAt",
  "operatorIdentity",
  "gitSha",
  "imageDigest",
  "retryCount",
  "timeoutSeconds",
  "releaseRecord",
];

function workflowContract(mode: "dry_run" | "apply", summary: SeedJobSummary) {
  return {
    mode,
    inputSha256: SEED_HASH,
    runId: summary.contract.runId,
    moveId: MOVE_ID,
    imageDigest: BASE_ENV.MOVES_REGISTER_SEED_IMAGE_DIGEST,
  };
}

describe("the proof bundle", () => {
  it("carries the job-rule contract, progress, validation and quality gate, locally and in Blob", async () => {
    const register = fakeRegister();
    const h = harness(register.port, {}, approvedManifests());
    const summary = await runSeedJob(parseSeedJobArgs(APPLY_ENV), h.deps);
    for (const field of JOB_RULE_FIELDS) {
      expect(summary.contract[field]).not.toBeUndefined();
      expect(summary.contract[field]).not.toBeNull();
    }
    expect(summary.contract).toMatchObject({
      tenantScope: DEMO_TENANT_CANONICAL_KEY,
      moveId: MOVE_ID,
      inputSourceVersion: SEED_HASH,
      releaseRecord: RELEASE_RECORD,
      operatorIdentity: `${OPERATOR_USER_PREFIX}octo-operator`,
      retryCount: 0,
    });
    expect(summary.event).toBe(PROOF_EVENT);
    expect(summary.progress.map((entry) => entry.checkpoint)).toEqual([
      "00-seed-and-job-contract-validated",
      "01-move-tenant-and-archetype-authenticated",
      "02-load-approval-verified",
      "03-register-read-and-plan-built",
      "04-register-writes-applied",
      "05-register-readback-validated",
    ]);
    const prefix =
      "moves-demo-assumption-register-seed/runs/moves-demo-register-seed-1";
    expect(Object.keys(h.blobs).sort()).toEqual(
      [
        ...summary.progress.map(
          (entry) => `${prefix}/progress/${entry.checkpoint}.json`,
        ),
        `${prefix}/validation.json`,
        `${prefix}/quality-gate.json`,
        `${prefix}/proof.json`,
      ].sort(),
    );
    expect(summary.blobProofLocation).toBe(
      `https://abarvaproof.blob.core.windows.net/ecl-synthetic-intake/${prefix}/proof.json`,
    );
    expect(summary.validationOutput).toMatch(
      /^https:\/\/.*\/validation\.json$/,
    );
    expect(summary.qualityGateOutput).toMatch(
      /^https:\/\/.*\/quality-gate\.json$/,
    );
    expect(JSON.parse(h.blobs[`${prefix}/proof.json`])).toEqual(summary);
    expect(Object.keys(h.local).sort()).toEqual(
      [
        "plan.json",
        "progress.json",
        "proof-manifest.json",
        "proof.json",
        "quality-gate.json",
        "validation.json",
        ...summary.progress.map((entry) => `progress/${entry.checkpoint}.json`),
      ].sort(),
    );
    expect(h.local["proof-manifest.json"]).toEqual(summary);
    expect(h.bundles()).toBe(1);
    expect(h.logs.at(-1)).toBe(
      `__MOVES_DEMO_REGISTER_SEED_PROOF_SUMMARY__${JSON.stringify(summary)}`,
    );
  });

  it("refuses to overwrite a proof blob an earlier run with the same id wrote", async () => {
    const register = fakeRegister();
    const h = harness(register.port, {}, approvedManifests());
    await runSeedJob(parseSeedJobArgs(APPLY_ENV), h.deps);
    const again = await runSeedJob(parseSeedJobArgs(APPLY_ENV), h.deps);
    expect(again.status).toBe("failed");
    expect(again.error).toBe("proof_blob_already_exists");
  });

  it("records a failure as a failed proof manifest and still emits the bundle", async () => {
    const register = fakeRegister();
    const h = harness(register.port);
    const summary = await runSeedJob(parseSeedJobArgs(APPLY_ENV), h.deps);
    expect(h.local["proof-manifest.json"]).toEqual(summary);
    expect(summary.status).toBe("failed");
    expect(h.bundles()).toBe(1);
    expect(Object.keys(h.blobs)).toContain(
      "moves-demo-assumption-register-seed/runs/moves-demo-register-seed-1/failure.json",
    );
    expect(h.logs.at(-1)).toContain('"status":"failed"');
  });

  it("passes the workflow validator for a dry run and an apply, and fails it for what it must refuse", async () => {
    const dry = await runSeedJob(
      parseSeedJobArgs(BASE_ENV),
      harness(fakeRegister().port).deps,
    );
    expect(
      validateDemoRegisterSeedProofManifest(
        workflowContract("dry_run", dry),
        dry,
      ),
    ).toBe(dry);
    const applied = await runSeedJob(
      parseSeedJobArgs(APPLY_ENV),
      harness(fakeRegister().port, {}, approvedManifests()).deps,
    );
    expect(
      validateDemoRegisterSeedProofManifest(
        workflowContract("apply", applied),
        applied,
      ),
    ).toBe(applied);

    const refusals: Array<
      ["dry_run" | "apply", SeedJobSummary, Record<string, unknown>, string]
    > = [
      ["dry_run", dry, { mode: "apply" }, "mode differs"],
      ["dry_run", dry, { status: "failed" }, "did not succeed"],
      ["dry_run", dry, { event: "other" }, "identity mismatch"],
      [
        "dry_run",
        dry,
        { contract: { ...dry.contract, tenantScope: "skyharbor-air" } },
        "not scoped to the demo tenant",
      ],
      [
        "dry_run",
        dry,
        { contract: { ...dry.contract, inputSourceVersion: "f".repeat(64) } },
        "input hash differs",
      ],
      [
        "dry_run",
        dry,
        { contract: { ...dry.contract, runId: "other" } },
        "run id differs",
      ],
      [
        "dry_run",
        dry,
        { contract: { ...dry.contract, moveId: CLIENT_ID } },
        "Move differs",
      ],
      [
        "dry_run",
        dry,
        { contract: { ...dry.contract, imageDigest: "sha256:0" } },
        "image digest differs",
      ],
      [
        "dry_run",
        dry,
        { plan: dry.plan.slice(1) },
        "does not cover every seed row",
      ],
      [
        "dry_run",
        dry,
        { qualityGate: { ...dry.qualityGate, passed: false } },
        "quality gate did not pass",
      ],
      [
        "dry_run",
        dry,
        { writes: { created: 1, confirmed: 0, total: 1 }, committed: true },
        "Dry run wrote",
      ],
      [
        "dry_run",
        dry,
        { writes: { created: 1, confirmed: 0, total: 0 } },
        "write counts are inconsistent",
      ],
      [
        "apply",
        applied,
        { writes: { created: 1, confirmed: 0, total: 1 } },
        "different number of rows",
      ],
      ["apply", applied, { committed: false }, "commit flag differs"],
      [
        "apply",
        applied,
        { loadApproval: { approved: false, reasons: [] } },
        "without a load approval",
      ],
      [
        "apply",
        applied,
        { validation: { ...applied.validation, passed: false } },
        "readback did not pass",
      ],
      [
        "apply",
        applied,
        { blobProofLocation: "not_required_for_dry_run" },
        "lacks a Blob proof location",
      ],
      [
        "dry_run",
        dry,
        { qualityGate: { ...dry.qualityGate, plannedWrites: 0 } },
        "quality gate did not pass",
      ],
      [
        "dry_run",
        dry,
        { seed: { ...dry.seed, rowCount: 0 }, plan: [] },
        "does not cover every seed row",
      ],
      ["dry_run", dry, { committed: true }, "Dry run wrote"],
      [
        "dry_run",
        dry,
        { writes: { created: 1, confirmed: 0, total: 1 }, committed: false },
        "Dry run wrote",
      ],
      [
        "dry_run",
        dry,
        { contract: { ...dry.contract, inputSha256: "f".repeat(64) } },
        "input hash differs",
      ],
    ];
    for (const [mode, base, patch, fragment] of refusals) {
      const manifest = { ...base, ...patch };
      expect(() =>
        validateDemoRegisterSeedProofManifest(
          workflowContract(mode, base),
          manifest,
        ),
      ).toThrow(fragment);
    }
  });

  it("reads the manifest from the extracted operator bundle, and refuses an unverified run", async () => {
    const dry = await runSeedJob(
      parseSeedJobArgs(BASE_ENV),
      harness(fakeRegister().port).deps,
    );
    const run = {
      status: "Succeeded",
      ok: true,
      restored: {
        restored: true,
        idleVerification: { idleVerified: true, problems: [] },
      },
      proof: { extracted: true, extractDir: "/tmp/proof" },
    };
    const reads: string[] = [];
    const readText = (file: string) => {
      reads.push(file);
      return JSON.stringify(dry);
    };
    expect(
      validateDemoRegisterSeedProof(
        workflowContract("dry_run", dry),
        run,
        readText,
      ),
    ).toEqual(dry);
    expect(reads).toEqual([
      path.join("/tmp/proof", PROOF_DIR_NAME, "proof-manifest.json"),
    ]);
    for (const [patch, fragment] of [
      [{ status: "Failed" }, "did not succeed"],
      [{ ok: false }, "did not succeed"],
      [
        {
          restored: {
            restored: true,
            idleVerification: { idleVerified: false, problems: [] },
          },
        },
        "idle restore",
      ],
      [
        {
          restored: {
            restored: true,
            idleVerification: {
              idleVerified: true,
              problems: ["job still running"],
            },
          },
        },
        "idle restore",
      ],
      [
        {
          restored: {
            restored: false,
            idleVerification: { idleVerified: true, problems: [] },
          },
        },
        "idle restore",
      ],
      [
        { proof: { extracted: false, extractDir: "/tmp/proof" } },
        "bundle is missing",
      ],
      [{ proof: { extracted: true } }, "bundle is missing"],
    ] as const) {
      expect(() =>
        validateDemoRegisterSeedProof(
          workflowContract("dry_run", dry),
          { ...run, ...patch },
          readText,
        ),
      ).toThrow(fragment);
    }
  });
});

// ── The dispatch workflow ────────────────────────────────────────────────────

describe("the dispatch workflow", () => {
  const text = read(WORKFLOW_PATH);
  const workflow = yaml.load(text) as {
    on: Record<string, { inputs: Record<string, { options?: string[] }> }>;
    permissions: Record<string, string>;
    jobs: Record<
      string,
      {
        env: Record<string, string>;
        steps: Array<{ name: string; id?: string; if?: string; run?: string }>;
      }
    >;
  };
  const job = workflow.jobs["register-seed"];
  const step = (name: string) =>
    job.steps.find((candidate) => candidate.name === name)!;

  it("is manual only, with a dry_run/apply choice, OIDC, and the committed seed", () => {
    expect(Object.keys(workflow.on)).toEqual(["workflow_dispatch"]);
    expect(workflow.on.workflow_dispatch.inputs.mode.options).toEqual([
      "dry_run",
      "apply",
    ]);
    expect(workflow.permissions).toEqual({
      contents: "read",
      "id-token": "write",
    });
    expect(job.env.SEED_PATH).toBe(SEED_PATH);
    expect(job.env.SEED_MANIFEST_PATH).toBe(
      `${MANIFEST_DIR}/${SEED_MANIFEST_FILE}`,
    );
    expect(job.env.DEMO_TENANT_KEY).toBe(DEMO_TENANT_CANONICAL_KEY);
    expect(
      job.steps.some((candidate) => candidate.name === "Azure login"),
    ).toBe(true);
  });

  it("binds the dispatch to the seed hash, the derived idempotency key, main, a confirmation and the load approval", () => {
    const scope = job.steps.find((candidate) => candidate.id === "scope")!.run!;
    expect(scope).toContain('actual="$(sha256sum "$SEED_PATH"');
    expect(scope).toContain('[[ "$actual" == "$INPUT_SHA256" ]]');
    expect(scope).toContain(
      `expected_key="${IDEMPOTENCY_PREFIX}:$(printf '%s' "\${move_id}|\${actual}"`,
    );
    expect(scope).toContain('[[ "$IDEMPOTENCY_KEY" == "$expected_key" ]]');
    expect(scope).toContain("[[ \"$GITHUB_REF\" == 'refs/heads/main' ]]");
    expect(scope).toContain(
      `[[ "$CONFIRM_APPLY" == '${APPLY_CONFIRMATION}' ]]`,
    );
    expect(scope).toContain('[[ -n "$APPROVAL_REFERENCE" ]]');
    expect(scope).toContain(
      ".load_approval.source_set_hash == $hash and .load_approval.move_id == $move",
    );
  });

  it("runs the seed job through the private operator in the deployed digest, and validates its proof", () => {
    const packageJson = JSON.parse(read("package.json"));
    const script: string =
      packageJson.scripts["moves:demo-assumption-register:seed-job"];
    expect(script).toContain(
      "scripts/moves/seed-demo-assumption-register-job.ts",
    );
    expect(script).toContain("_mock-server-only-preload.cjs");
    const dryRun = step("Run dry-run through private ACA operator");
    const apply = step(
      "Run separately approved apply through private ACA operator",
    );
    expect(dryRun.if).toBe("inputs.mode == 'dry_run'");
    expect(apply.if).toBe("inputs.mode == 'apply'");
    for (const run of [dryRun.run!, apply.run!]) {
      expect(run).toContain("npm run ops:aca-job --");
      expect(run).toContain(
        '--image "${{ steps.image.outputs.image }}" --script moves:demo-assumption-register:seed-job',
      );
      expect(run).toContain(
        "--secret-env DATABASE_URL=azure-postgres-control-database-url",
      );
      expect(run).toContain(
        '--env MOVES_REGISTER_SEED_TENANT_KEY="$DEMO_TENANT_KEY"',
      );
      expect(run).toContain(
        '--env MOVES_REGISTER_SEED_IMAGE_DIGEST="${{ steps.image.outputs.digest }}"',
      );
      expect(run).toContain('--out-dir "$EVIDENCE_DIR/$PROOF_OUTPUT_DIR"');
    }
    expect(dryRun.run).toContain("--env MOVES_REGISTER_SEED_MODE=dry_run");
    expect(dryRun.run).not.toContain("APPLY_APPROVED");
    expect(apply.run).toContain("--env MOVES_REGISTER_SEED_MODE=apply");
    expect(apply.run).toContain(
      "--env MOVES_REGISTER_SEED_APPLY_APPROVED=true",
    );
    expect(apply.run).toContain(
      `--env MOVES_REGISTER_SEED_CONFIRMATION=${APPLY_CONFIRMATION}`,
    );
    expect(step("Resolve current digest-pinned image").run).toContain(
      '[[ "$image" == *@sha256:* ]]',
    );
    expect(step("Validate operator proof").run).toContain(
      "scripts/moves/validate-demo-assumption-register-seed-proof.mjs",
    );
  });

  it("supplies every variable the job requires in apply mode, and the proof store only to the apply", () => {
    // The job refuses before starting when a required variable is unset, so a
    // name the job reads but the dispatch never passes fails only live.
    const source = read("scripts/moves/seed-demo-assumption-register-job.ts");
    const requiredNames = [
      ...source.matchAll(/required\(\s*env,\s*"([A-Z0-9_]+)"/g),
    ].map((match) => match[1]);
    expect(requiredNames).toEqual(
      expect.arrayContaining([
        "AZURE_STORAGE_ACCOUNT_NAME",
        "ECL_SYNTHETIC_STORAGE_IDENTITY_CLIENT_ID",
      ]),
    );
    const apply = step(
      "Run separately approved apply through private ACA operator",
    ).run!;
    for (const name of new Set(requiredNames)) {
      expect(
        apply.includes(`--env ${name}=`) ||
          apply.includes(`--secret-env ${name}=`),
      ).toBe(true);
    }
    const dryRun = step("Run dry-run through private ACA operator").run!;
    expect(dryRun).not.toContain("AZURE_STORAGE_ACCOUNT_NAME");
    expect(dryRun).not.toContain("ECL_SYNTHETIC_STORAGE_IDENTITY_CLIENT_ID");
    const scope = job.steps.find((candidate) => candidate.id === "scope")!.run!;
    expect(scope).toContain("Private Blob proof target is not configured");
  });

  it("deploys nothing", () => {
    for (const forbidden of [
      /az\s+containerapp\s+update/,
      /ingress\s+traffic\s+set/,
      /az\s+acr\s+build/,
      /docker\/build-push-action/,
      /aca-main-deploy/,
      /docker\s+push/,
    ]) {
      expect(text).not.toMatch(forbidden);
    }
  });
});

describe("the committed load approval", () => {
  it("is a named person's approval of exactly the committed seed", () => {
    const seedPath = path.join(
      process.cwd(),
      "datasets/tenant-inputs/meridian-health/moves/demo-assumption-register-seed.json",
    );
    const seedText = readFileSync(seedPath, "utf8");
    const seedHash = createHash("sha256").update(seedText).digest("hex");
    const seed = JSON.parse(seedText) as {
      move: { move_id: string };
      rows: unknown[];
    };
    const manifest = committedManifests().find(
      (m) => m.dataset_id === "moves_demo_assumption_register_seed_v1",
    ) as { client_key?: string } | undefined;
    const decision = resolveLoadApproval(committedManifests(), {
      dataset_id: "moves_demo_assumption_register_seed_v1",
      tenant_key: String(manifest?.client_key ?? ""),
      assessment_id: seed.move.move_id,
      source_set_hash: seedHash,
      object_count: seed.rows.length,
      ingestion_method: "operator_aca_job",
      move_id: seed.move.move_id,
    });
    // Editing the seed without a fresh approval fails here, not at apply time.
    expect(decision).toMatchObject({ approved: true });
  });
});
