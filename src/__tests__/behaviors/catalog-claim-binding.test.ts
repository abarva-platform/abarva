import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

/**
 * A legal-catalog claim is bound to a surface by `surfaceId`. For `covered`
 * rows that has always been enforced. For `deferred` rows it was not enforced
 * at all, and every one of them omitted it — 18 of 18 covered carried the
 * field, 0 of 19 deferred did. The field was present on exactly the rows that
 * did not need it.
 *
 * That is the exemption-outliving-its-defect shape in the file that is meant
 * to be the machine-readable answer. A validator walking `surfaceId` to join a
 * claim to its surface silently skipped every deferral, and a deferral is
 * precisely the row that should be re-checked. Several `reason` strings say
 * the deferral exists because a component *was retired* and the surface *needs
 * re-cataloguing* — so the moment a replacement surface is pinned, nothing
 * connects it back to the row waiting for it.
 *
 * The repair is not simply "give each deferred row a surfaceId". Measured
 * against `controls[]` on `7f0056d1e`, **zero** of the 19 resolve to exactly
 * one control, so a two-state resolved-or-retired split would have been a
 * fiction. Resolving each row's declared code paths against `controls[]` and
 * against the tree gives three states, and the third is the one the two-state
 * reading would have buried:
 *
 * - `retired`      — no declared code path is in the tree (4 rows)
 * - `uncatalogued` — a declared code path IS in the tree, and no `controls[]`
 *                    entry names it (13 rows when this suite was written, 8
 *                    now — C-544 catalogued the Intelligence pattern promotion
 *                    brief panel and C-547 the Moves Nexus current-state
 *                    briefing panel, and five rows left this state between
 *                    them). The surface is live; nobody catalogued it. That is
 *                    work, not history.
 * - `ambiguous`    — more than one `controls[]` entry names the row's code
 *                    paths (2 rows), so naming one would be false precision.
 *
 * The declared state is checked against the repository on every run, so the
 * exemption asserts its own defect still exists: restore
 * `AvaReasoningCards.tsx` and `retired` goes red. The second half of that
 * sentence has since been collected: cataloguing
 * `NexusCurrentStateBriefingPanel.tsx` in `controls[]` (C-547) did turn its two
 * rows red naming the `surfaceId` they had to carry, which is why they now
 * carry it.
 *
 * The resolver is not invented for the deferrals. Run over the 18 covered rows
 * it reproduces all 18 hand-written joins, 18 agree / 0 disagree / 0 unmatched,
 * which is why it is trusted to judge the other 19.
 */

const repoRoot = path.resolve(__dirname, "../../..");
const CATALOG_REL = "docs/security/ai-surface-control-catalog.json";
const SCRIPT = path.join(repoRoot, "scripts/audit/ai-surface-control-catalog.mjs");

type SurfaceJoin = {
  state?: string;
  candidateSurfaceIds?: string[];
};

type ClaimCoverage = {
  key: string;
  status: "covered" | "deferred";
  controlKind?: string;
  surfaceId?: string;
  reason?: string;
  surfaceJoin?: SurfaceJoin;
};

type Catalog = {
  controls: Array<{ id: string; path: string }>;
  catalogClaimCoverage: ClaimCoverage[];
};

const LEGAL_CATALOGS = [
  {
    id: "consequential",
    path: "docs/legal/AI_CONSEQUENTIAL_ACTION_CATALOG.md",
    header:
      "| Module | Surface / action | Code path | Current control | Required / next control |",
  },
  {
    id: "generated-ui",
    path: "docs/legal/AI_GENERATED_UI_CATALOG.md",
    header:
      "| Module | Surface / element | Code path | AI label present? | Citations / evidence present? | Confidence / assumption disclosure present? | Required / next control |",
  },
] as const;

function readCatalog(): Catalog {
  return JSON.parse(readFileSync(path.join(repoRoot, CATALOG_REL), "utf8")) as Catalog;
}

function tableColumns(line: string): string[] {
  const trimmed = line.trim();
  if (!trimmed.startsWith("|")) return [];
  return trimmed
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((column) => column.trim());
}

/**
 * Written here rather than imported from the gate on purpose: a declared state
 * checked by the same code that wrote it proves nothing. This walks the legal
 * catalog markdown, `controls[]` and the tree independently and must reach the
 * same answer the gate does.
 */
function codePathsByModuleSurface(): Map<string, string[]> {
  const index = new Map<string, string[]>();
  for (const catalog of LEGAL_CATALOGS) {
    const expected = tableColumns(catalog.header);
    const lines = readFileSync(path.join(repoRoot, catalog.path), "utf8").split(/\r?\n/);
    let inTable = false;
    for (const line of lines) {
      const columns = tableColumns(line);
      if (!inTable) {
        if (columns.join("|") === expected.join("|")) inTable = true;
        continue;
      }
      if (columns.length === 0) break;
      if (columns.every((column) => /^:?-{3,}:?$/.test(column))) continue;
      const [module, surface, codePath] = columns;
      const paths = (codePath.match(/`([^`]+)`/g) ?? []).map((token) => token.replace(/`/g, ""));
      index.set(`${catalog.id}|${module}|${surface}`, paths);
    }
  }
  return index;
}

function measureJoin(entry: ClaimCoverage, catalog: Catalog, paths: Map<string, string[]>) {
  const [catalogId, module, surface] = entry.key.split("|");
  const codePaths = paths.get(`${catalogId}|${module}|${surface}`) ?? [];
  const matched = [
    ...new Set(
      codePaths.flatMap((codePath) =>
        catalog.controls.filter((control) => control.path === codePath).map((control) => control.id),
      ),
    ),
  ].sort();
  if (matched.length === 1) return { state: "resolved", matched, codePaths };
  if (matched.length > 1) return { state: "ambiguous", matched, codePaths };
  const inTree = codePaths.filter((codePath) => existsSync(path.join(repoRoot, codePath)));
  return { state: inTree.length === 0 ? "retired" : "uncatalogued", matched, codePaths };
}

function runAudit(catalogPath: string): { code: number; output: string } {
  try {
    const output = execFileSync(process.execPath, [SCRIPT], {
      cwd: repoRoot,
      encoding: "utf8",
      env: { ...process.env, AI_SURFACE_CONTROL_CATALOG_PATH: catalogPath },
      stdio: ["ignore", "pipe", "pipe"],
    });
    return { code: 0, output };
  } catch (error) {
    const err = error as { status?: number; stdout?: string; stderr?: string };
    return { code: err.status ?? 1, output: `${err.stdout ?? ""}${err.stderr ?? ""}` };
  }
}

function writeFixture(mutate: (catalog: Catalog) => void): string {
  const catalog = readCatalog();
  mutate(catalog);
  const file = path.join(mkdtempSync(path.join(tmpdir(), "catalog-claim-binding-")), "catalog.json");
  writeFileSync(file, JSON.stringify(catalog, null, 2));
  return file;
}

function entryByKey(catalog: Catalog, key: string): ClaimCoverage {
  const entry = catalog.catalogClaimCoverage.find((candidate) => candidate.key === key);
  if (!entry) throw new Error(`${key} is no longer in catalogClaimCoverage`);
  return entry;
}

const live = readCatalog();
const livePaths = codePathsByModuleSurface();

/**
 * The subject of the two `uncatalogued` directions below.
 *
 * It was a live deferral until C-547 catalogued this surface, so on `main` the
 * row is `covered` and the state those two cases are about is no longer in the
 * live catalog. They **reconstruct** it in the fixture rather than being
 * repointed at whichever row happens to be uncatalogued today, for two reasons
 * that pull the same way. Fixing a defect must not retire the guard that proved
 * it — deleting these cases because the row improved is how a direction stops
 * being checked. And a fixture pinned to a live uncatalogued row goes stale the
 * next time one is catalogued, and once the last of the eight is catalogued it
 * inverts into a case that can only be set up while the repository is still
 * broken.
 */
const UNCATALOGUED_KEY = "generated-ui|Moves|Nexus current-state briefing panel|citation";
const UNCATALOGUED_SURFACE_ID = "moves-nexus-current-state-briefing-panel";

/**
 * Put the row and its surface back in the pre-C-547 state: the declared code
 * path is in the tree and no `controls[]` entry names it, so the repository
 * measures `uncatalogued`.
 */
function decatalogue(catalog: Catalog): ClaimCoverage {
  catalog.controls = catalog.controls.filter((surface) => surface.id !== UNCATALOGUED_SURFACE_ID);
  const entry = entryByKey(catalog, UNCATALOGUED_KEY);
  delete entry.surfaceId;
  entry.status = "deferred";
  entry.surfaceJoin = { state: "uncatalogued" };
  return entry;
}
/** A deferral whose every declared code path is gone. `uncatalogued` must be false of it. */
const RETIRED_KEY = "generated-ui|Intelligence|aVa reasoning cards|citation";
/** A deferral whose code paths name two controls at once. */
const AMBIGUOUS_KEY = "generated-ui|Moves|Phase advance / gate approval UI|citation";
/** A covered row, used for the two directions that were already enforceable. */
const COVERED_KEY =
  "consequential|Intelligence|Gate waiver / approval|human-approval-gate";

describe("legal catalog claims bind only when coverage is real", () => {
  it("requires every covered claim to name the exact catalog surface", () => {
    const unboundCovered = live.catalogClaimCoverage.filter(
      (entry) => entry.status === "covered" && !entry.surfaceId,
    );

    expect(unboundCovered).toEqual([]);
  });

  it("binds the consequential gate-waiver claim to its own handler", () => {
    expect(entryByKey(live, COVERED_KEY)).toEqual(
      expect.objectContaining({ status: "covered", surfaceId: "intelligence-gate-waiver-route" }),
    );
  });

  /**
   * This replaces "permits an unbound legal claim only while it remains
   * explicitly deferred", which was the permission that let 19 rows omit the
   * join indefinitely. Deferral is still allowed; omitting the join is not.
   */
  it.each(live.catalogClaimCoverage.map((entry) => [entry.key] as const))(
    "%s names a join — a surfaceId in controls[] or an explicit surfaceJoin",
    (key) => {
      const entry = entryByKey(live, key);
      const named = entry.surfaceId
        ? live.controls.some((control) => control.id === entry.surfaceId)
        : Boolean(entry.surfaceJoin?.state);

      expect({ key, named }).toEqual({ key, named: true });
    },
  );

  it.each(
    live.catalogClaimCoverage
      .filter((entry) => !entry.surfaceId)
      .map((entry) => [entry.key] as const),
  )("%s declares the join state the repository actually has", (key) => {
    const entry = entryByKey(live, key);
    const measured = measureJoin(entry, live, livePaths);

    expect({ key, state: entry.surfaceJoin?.state }).toEqual({ key, state: measured.state });
  });

  it.each(
    live.catalogClaimCoverage
      .filter((entry) => entry.surfaceJoin?.state === "ambiguous")
      .map((entry) => [entry.key] as const),
  )("%s lists exactly the controls its code paths name", (key) => {
    const entry = entryByKey(live, key);
    const measured = measureJoin(entry, live, livePaths);

    expect({ key, ids: [...(entry.surfaceJoin?.candidateSurfaceIds ?? [])].sort() }).toEqual({
      key,
      ids: measured.matched,
    });
  });

  /**
   * A count, recorded so a later split is visible as a change rather than as a
   * number nobody measured. The per-row assertions above are the real gate —
   * this one cannot tell which row moved.
   */
  /*
   * A fourth bucket, added by C-544 rather than folded into an existing one.
   *
   * Cataloguing a surface resolves EVERY claim row that names its code path,
   * including rows for a control kind the new `controls[]` entry does not
   * declare. Such a row may no longer carry a `surfaceJoin` — the resolver says
   * `resolved` and the gate demands the `surfaceId` — but it is not `covered`
   * either, because the control is not on the surface. It is deferred against a
   * named surface, which is strictly more than the `uncatalogued` it replaced.
   *
   * The three-bucket tally counted that row as `unbound`, and `unbound` reads as
   * "nobody bound it". Keeping the name honest is the whole reason the bucket
   * exists: `unbound: 0` still has to mean no row is missing a join.
   */
  it("records the split the repair was measured against, per bucket", () => {
    const tally = {
      coveredWithSurfaceId: 0,
      deferredWithJoin: 0,
      deferredWithSurfaceId: 0,
      unbound: 0,
    };
    for (const entry of live.catalogClaimCoverage) {
      if (entry.status === "covered" && entry.surfaceId) tally.coveredWithSurfaceId += 1;
      else if (entry.status === "deferred" && entry.surfaceJoin?.state) tally.deferredWithJoin += 1;
      else if (entry.status === "deferred" && entry.surfaceId) tally.deferredWithSurfaceId += 1;
      else tally.unbound += 1;
    }

    // 18/19/0/0 when C-537 wrote this. C-544 catalogued one surface: two of its
    // three rows became covered, the third is deferred against that surface.
    // C-547 catalogued a second, whose two rows both became covered — 20/16 to
    // 22/14, with `deferredWithSurfaceId` unmoved because that surface declares
    // every control kind its legal rows claim.
    expect(tally).toEqual({
      coveredWithSurfaceId: 22,
      deferredWithJoin: 14,
      deferredWithSurfaceId: 1,
      unbound: 0,
    });
  });

  it("resolves all 18 hand-written covered joins from the code paths alone", () => {
    // The resolver judging the 19 deferrals is the same one. If it could not
    // reproduce the joins a human already wrote, its verdict on the rest would
    // be worth nothing.
    const disagreements = live.catalogClaimCoverage
      .filter((entry) => entry.status === "covered")
      .filter((entry) => !measureJoin(entry, live, livePaths).matched.includes(entry.surfaceId ?? ""))
      .map((entry) => entry.key);

    expect(disagreements).toEqual([]);
  });
});

describe("the catalog claim join gate fails in both directions", () => {
  it("passes on the real catalog", () => {
    const { code, output } = runAudit(path.join(repoRoot, CATALOG_REL));

    expect(output).toContain("AI surface control catalog passed");
    expect(code).toBe(0);
  });

  it("goes red when a covered row's surfaceId is dropped, naming the row's key", () => {
    const { code, output } = runAudit(
      writeFixture((catalog) => {
        delete entryByKey(catalog, COVERED_KEY).surfaceId;
      }),
    );

    expect(code).not.toBe(0);
    const finding = output.split("\n").find((line) => line.startsWith(`- ${COVERED_KEY}`));
    expect(finding).toContain("covered claim references unknown surfaceId");
  });

  it("goes red when a surfaceId names a surface that is not in controls[]", () => {
    const { code, output } = runAudit(
      writeFixture((catalog) => {
        entryByKey(catalog, COVERED_KEY).surfaceId = "a-surface-that-is-not-catalogued";
      }),
    );

    expect(code).not.toBe(0);
    const finding = output.split("\n").find((line) => line.startsWith(`- ${COVERED_KEY}`));
    expect(finding).toContain("a-surface-that-is-not-catalogued");
  });

  it("goes red when a deferred row names no join at all", () => {
    const { code, output } = runAudit(
      writeFixture((catalog) => {
        delete decatalogue(catalog).surfaceJoin;
      }),
    );

    expect(code).not.toBe(0);
    const finding = output.split("\n").find((line) => line.startsWith(`- ${UNCATALOGUED_KEY}`));
    expect(finding).toContain("names no join");
  });

  it("goes red when a row claims retired and its code path is in the tree", () => {
    // The premise, read rather than assumed: this row's code path exists.
    const codePaths = livePaths.get(UNCATALOGUED_KEY.split("|").slice(0, 3).join("|")) ?? [];
    expect(codePaths.some((codePath) => existsSync(path.join(repoRoot, codePath)))).toBe(true);

    const { code, output } = runAudit(
      writeFixture((catalog) => {
        decatalogue(catalog).surfaceJoin = { state: "retired" };
      }),
    );

    expect(code).not.toBe(0);
    const finding = output.split("\n").find((line) => line.startsWith(`- ${UNCATALOGUED_KEY}`));
    expect(finding).toContain("surfaceJoin.state says retired; the repository says uncatalogued");
  });

  it("goes red when a row claims uncatalogued and every code path is gone", () => {
    // The premise, read rather than assumed: this row's code paths are gone.
    const codePaths = livePaths.get(RETIRED_KEY.split("|").slice(0, 3).join("|")) ?? [];
    expect(codePaths.length).toBeGreaterThan(0);
    expect(codePaths.every((codePath) => !existsSync(path.join(repoRoot, codePath)))).toBe(true);

    const { code, output } = runAudit(
      writeFixture((catalog) => {
        entryByKey(catalog, RETIRED_KEY).surfaceJoin = { state: "uncatalogued" };
      }),
    );

    expect(code).not.toBe(0);
    const finding = output.split("\n").find((line) => line.startsWith(`- ${RETIRED_KEY}`));
    expect(finding).toContain("surfaceJoin.state says uncatalogued; the repository says retired");
  });

  it("goes red when an ambiguous row's candidate list is not what its code paths name", () => {
    const { code, output } = runAudit(
      writeFixture((catalog) => {
        entryByKey(catalog, AMBIGUOUS_KEY).surfaceJoin = {
          state: "ambiguous",
          candidateSurfaceIds: ["moves-phase-advance-button"],
        };
      }),
    );

    expect(code).not.toBe(0);
    const finding = output.split("\n").find((line) => line.startsWith(`- ${AMBIGUOUS_KEY}`));
    expect(finding).toContain("candidateSurfaceIds must be exactly");
    expect(finding).toContain("program-gate-approval");
  });

  it("goes red when a row defers a join that resolves to exactly one control, naming that control", () => {
    // The ambiguous row is ambiguous only because two controls name its code
    // paths. Remove one and the deferral becomes resolvable, which is the
    // transition the whole repair exists to force — so it is proven rather
    // than asserted. Nothing else references `program-gate-approval`, so its
    // removal introduces no other finding.
    expect(
      live.catalogClaimCoverage.filter((entry) => entry.surfaceId === "program-gate-approval"),
    ).toEqual([]);

    const { code, output } = runAudit(
      writeFixture((catalog) => {
        catalog.controls = catalog.controls.filter(
          (control) => control.id !== "program-gate-approval",
        );
      }),
    );

    expect(code).not.toBe(0);
    // Which finding fired, not merely that one did. A generic state-mismatch
    // message also names the surviving control in its evidence clause, so
    // asserting only the id let a gate that never recognises `resolved` pass
    // this case — it did, under mutation, until this assertion named the rule.
    const finding = output.split("\n").find((line) => line.startsWith(`- ${AMBIGUOUS_KEY}`));
    expect(finding).toContain("resolves to exactly one catalogued surface");
    expect(finding).toContain("moves-phase-advance-button");
    expect(finding).toContain("replace surfaceJoin with that surfaceId");
  });

  it("goes red when a non-ambiguous join carries a candidate list", () => {
    // Added because the rule survived mutation: nothing proved it, so the
    // field could go stale on a retired row and say nothing.
    const { code, output } = runAudit(
      writeFixture((catalog) => {
        entryByKey(catalog, RETIRED_KEY).surfaceJoin = {
          state: "retired",
          candidateSurfaceIds: ["moves-phase-advance-button"],
        };
      }),
    );

    expect(code).not.toBe(0);
    const finding = output.split("\n").find((line) => line.startsWith(`- ${RETIRED_KEY}`));
    expect(finding).toContain("belongs only on an ambiguous join");
  });

  it("goes red when a row carries both a surfaceId and a surfaceJoin", () => {
    const { code, output } = runAudit(
      writeFixture((catalog) => {
        entryByKey(catalog, COVERED_KEY).surfaceJoin = { state: "retired" };
      }),
    );

    expect(code).not.toBe(0);
    const finding = output.split("\n").find((line) => line.startsWith(`- ${COVERED_KEY}`));
    expect(finding).toContain("names both a surfaceId and a surfaceJoin");
  });
});
