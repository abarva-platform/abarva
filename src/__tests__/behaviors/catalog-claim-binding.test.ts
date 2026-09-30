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

type BehavioralTest = {
  status?: string;
  path?: string;
  provenCases?: string[];
  reason?: string;
};

type RequiredControl = {
  kind: string;
  behavioralTest?: BehavioralTest;
};

type Catalog = {
  controls: Array<{ id: string; path: string; requiredControls?: RequiredControl[] }>;
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

/**
 * Item C-409's subject: the one `covered` row of 22 whose joined control
 * declared `behavioralTest.status: "none"`. It is `deferred` on `main` now, and
 * the fixture below puts it back to `covered` to reproduce the defect.
 */
const UNPROVEN_KEY = "generated-ui|Tower|Pressure/action cards|confidence";
const UNPROVEN_SURFACE_ID = "tower-atlas-program-pressure-brief";

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
    //
    // C-409 moved one row the other way, and it is the first movement in that
    // direction: the Tower pressure-brief confidence row was covered against a
    // control declaring `behavioralTest.status: "none"`, so it is now deferred
    // and still bound by `surfaceId`. 22/14/1 to 21/14/2. Nothing left or
    // entered `deferredWithJoin`, which is the check that the correction was
    // bookkeeping on one row and not a re-join of anything.
    //
    // C-574 catalogued the Tower aVa dock with all five controls uncovered.
    // Its two chat-opener rows (citation, confidence) resolved to it, so each
    // swapped its `uncatalogued` join for the surfaceId and stayed deferred —
    // 21/14/2 to 21/12/4. `coveredWithSurfaceId` is unmoved: cataloguing an
    // uncovered control earns no credit.
    //
    // C-549 retracted a claim rather than joining it: the Tower synthesis
    // route's legal row said "Yes" to citations on the strength of a telemetry
    // count, and executing the route showed the response carries none. The
    // legal cell now reads "Partial", the gate no longer derives a claim from
    // it, and its `uncatalogued` coverage row left with it — 21/12/4 to
    // 21/11/4. Nothing else moved, which is the check that one row was
    // removed and none re-joined.
    //
    // C-549 retracted a second claim the same way: the Agent readiness
    // drill-down's legal row said "Yes" to a confidence disclosure on the
    // strength of a source caption and a generated date. Rendering the
    // component showed no confidence value or assumption, its own confidence
    // factor reading deferred, and nothing mounting it. The cell now reads
    // "Partial" and its `uncatalogued` coverage row left with it — 21/11/4 to
    // 21/10/4.
    //
    // C-549 then joined a claim that measured true: the Steward setup
    // guidance row's seeded/live disclosure renders beside the reconnect
    // guidance on a mounted route. The reconnect page was catalogued with that
    // one control, and its `uncatalogued` row became covered — 21/10/4 to
    // 22/9/4. `deferredWithSurfaceId` is unmoved because the legal row claims
    // no other kind on that surface.
    expect(tally).toEqual({
      coveredWithSurfaceId: 22,
      deferredWithJoin: 9,
      deferredWithSurfaceId: 4,
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

/**
 * Item C-409. `covered` is a claim about proof, and until this block existed
 * the gate never asked about proof at all.
 *
 * A `covered` row was validated for two things: that its `surfaceId` resolves
 * to a `controls[]` entry, and that the entry declares the row's
 * `controlKind`. `validateClaimJoin` (C-554) added the code-path identity
 * check. None of the three looks at `behavioralTest`, so a credit could be
 * claimed over a control that this same document records as having no
 * behavioral test — and the two halves of the contradiction sat about a
 * thousand lines apart in one file.
 *
 * Measured over all 22 `covered` rows on `main` `0b8aefd03d`, exactly one was
 * in that state: `generated-ui|Tower|Pressure/action cards|confidence` claimed
 * covered against `tower-atlas-program-pressure-brief` / `confidence`, whose
 * `behavioralTest.status` is `"none"` because nothing mounts
 * `ProgramPressureCards`. Not sampled — the join ran over all 22, one hit.
 * The legal catalog's covered count therefore overstated by one, and it
 * overstated on the single surface this file is most careful about.
 *
 * **The remedy is bookkeeping, not a mount test.** The row is now `deferred`
 * with a reason, which is the vocabulary this file already has for "no proven
 * control to name". Writing a render test for an unmounted component to
 * restore the credit is expressly not the fix; `U-506` / item 38 own the
 * mount-or-retire call that would later make `covered` true again.
 *
 * Both directions are checked, because a gate that refuses the shape is only
 * half of it: a `covered` credit over a control that really does name a path
 * and `provenCases` must still pass, and a `deferred` row over an unproven
 * control must be left alone — that second one is the live state of the very
 * row this item corrected, so if it were not exempt the repository would be
 * red right now.
 */
describe("a covered credit is a claim about proof", () => {
  /** Reads `behavioralTest` off the joined control without going through the gate. */
  function joinedControl(entry: ClaimCoverage, catalog: Catalog): RequiredControl | undefined {
    const surface = catalog.controls.find((candidate) => candidate.id === entry.surfaceId);
    return (surface?.requiredControls ?? []).find(
      (control) => control.kind === entry.controlKind,
    );
  }

  const coveredRows = live.catalogClaimCoverage.filter((entry) => entry.status === "covered");

  it("has no covered row in the live catalog bound to a control declaring no behavioral test", () => {
    // The standing invariant, measured over the whole set rather than over the
    // one row the item named. An implementation that moved more than that one
    // row would show up here as a different number, not as silence.
    const unproven = coveredRows
      .filter((entry) => joinedControl(entry, live)?.behavioralTest?.status === "none")
      .map((entry) => `${entry.key} -> ${entry.surfaceId}/${entry.controlKind}`);

    expect(unproven).toEqual([]);
  });

  it("counts a covered set that is not vacuously clean", () => {
    // Without this, deleting every covered row would satisfy the case above.
    // 22 rows carried the credit when C-409 was filed and 21 after, the one
    // removal being the row it corrected. C-549 added one back: the Steward
    // setup guidance row, joined to a control whose suite names its cases.
    expect(coveredRows).toHaveLength(22);
    const proven = coveredRows.filter((entry) => {
      const test = joinedControl(entry, live)?.behavioralTest;
      return Boolean(test?.path) && (test?.provenCases ?? []).length > 0;
    });
    expect(proven).toHaveLength(22);
  });

  it("goes red when a covered credit names a control declaring no behavioral test", () => {
    // Reconstructs the exact pre-fix state of the row C-409 corrected, rather
    // than inventing a shape. The precondition is asserted first: if that
    // control ever gains a behavioral test this fixture stops reproducing the
    // defect, and a guard that no longer reaches its branch has to say so
    // loudly instead of passing for the wrong reason.
    const control = joinedControl(
      { key: UNPROVEN_KEY, status: "covered", surfaceId: UNPROVEN_SURFACE_ID, controlKind: "confidence" },
      live,
    );
    expect(control?.behavioralTest?.status).toBe("none");

    const { code, output } = runAudit(
      writeFixture((catalog) => {
        const entry = entryByKey(catalog, UNPROVEN_KEY);
        entry.status = "covered";
        delete entry.reason;
      }),
    );

    expect(code).not.toBe(0);
    const finding = output.split("\n").find((line) => line.startsWith(`- ${UNPROVEN_KEY}`));
    // Which rule fired, and that the message carries the three things an owner
    // needs to act: the surface, the kind, and the control's own reason. The
    // reason is quoted from the control rather than restated by the gate, so
    // the sentence a reader is asked to reconcile is the one that goes stale.
    expect(finding).toContain("a covered credit needs a proven control");
    expect(finding).toContain(UNPROVEN_SURFACE_ID);
    expect(finding).toContain("confidence");
    // The whole live reason, read from the control rather than pinned as a
    // phrase: C-416 rewrote that reason to cite a measurement, and a pinned
    // phrase from the old prose went red for a sentence change, not a gate one.
    const reason = control?.behavioralTest?.reason ?? "";
    expect(reason.length).toBeGreaterThan(40);
    expect(finding).toContain(`The control's own reason: ${reason}`);
    // Exactly one row moves. The gate reports every problem it finds, so a
    // check that is too broad shows up here as extra findings.
    expect(output.split("\n").filter((line) => line.startsWith("- "))).toHaveLength(1);
  });

  it("leaves a deferred row over that same unproven control alone", () => {
    // The live state of the corrected row: deferred, joined by surfaceId to a
    // control at status "none". The gate passing on today's bytes is the proof,
    // and this case pins the join so the pass is not coming from the row having
    // quietly lost its surfaceId.
    const entry = entryByKey(live, UNPROVEN_KEY);
    expect(entry.status).toBe("deferred");
    expect(entry.surfaceId).toBe(UNPROVEN_SURFACE_ID);
    expect(joinedControl(entry, live)?.behavioralTest?.status).toBe("none");

    const { code } = runAudit(path.join(repoRoot, CATALOG_REL));
    expect(code).toBe(0);
  });

  it("keys the refusal on the control's status, not on one surface", () => {
    // A rule written against `tower-atlas-program-pressure-brief` by name would
    // pass every case above. So the same refusal is provoked on a different,
    // currently-proven control: take a covered row whose control names a path
    // and proven cases, replace that with status "none", and the credit must be
    // refused for the same reason.
    //
    // It is the credit finding that is asserted, not merely a red exit —
    // demoting a control also trips `validateBehavioralTest`, which is why the
    // line is matched by its own text rather than by the process status.
    const control = joinedControl(entryByKey(live, COVERED_KEY), live);
    expect(control?.behavioralTest?.path).toBeTruthy();
    expect((control?.behavioralTest?.provenCases ?? []).length).toBeGreaterThan(0);

    const { code, output } = runAudit(
      writeFixture((catalog) => {
        const entry = entryByKey(catalog, COVERED_KEY);
        const demoted = joinedControl(entry, catalog);
        if (!demoted) throw new Error(`${COVERED_KEY} no longer joins to a control`);
        demoted.behavioralTest = {
          status: "none",
          reason:
            "Demoted by a fixture so the covered-credit refusal can be provoked on a surface it does not name.",
        };
      }),
    );

    expect(code).not.toBe(0);
    const finding = output.split("\n").find((line) => line.startsWith(`- ${COVERED_KEY}`));
    expect(finding).toContain("a covered credit needs a proven control");
    expect(finding).toContain(String(entryByKey(live, COVERED_KEY).surfaceId));
  });

  it("does not fire on the live catalog, whose covered credits are all proven", () => {
    const { code, output } = runAudit(path.join(repoRoot, CATALOG_REL));
    expect(code).toBe(0);
    expect(output).not.toContain("a covered credit needs a proven control");
  });
});
