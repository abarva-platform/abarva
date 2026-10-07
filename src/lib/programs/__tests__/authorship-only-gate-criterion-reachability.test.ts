/**
 * Can a gate criterion whose ONLY producer is deliberate authorship ever pass?
 *
 * `phase-gate-deliverable-reachability.test.ts` pins the complementary half:
 * HARD, deliverable-only criteria, checked against what a phase's generation
 * set actually builds. It cannot see the criteria pinned here, because they are
 * `soft` and because no phase generation set produces any key they accept.
 *
 * For those, reachability is a different join. Capture text cannot satisfy them
 * (they have no free-text fallback), and `phase-capture/route.ts` deliberately
 * no longer writes `deliverables_v2` rows at all, so the only producer left is
 * deliberate authorship — `complete_deliverable` / `complete_deliverables`,
 * gated by `ALLOWED_PROGRAM_DELIVERABLE_TYPES`. That makes the live question
 * "does the authorship tool offer a spelling the criterion accepts?", and
 * nothing proved it: the allow-list and the criterion alias lists sit in
 * different files, neither mentions the other, and the tool DESCRIPTIONS offer
 * the model a choice between spellings ("P5 alignment = stakeholder_alignment
 * or sponsor_alignment") with no guarantee both are read.
 *
 * They were not. `sponsor_alignment` — the spelling that matches the criterion
 * key `sponsor_alignment_confirmed`, allowed by the tool and advertised by it —
 * appeared nowhere in `governance.ts`. An authorized user could accept and sign
 * off a real alignment record and have the criterion named after it stay unmet,
 * with the outcome decided by which of two interchangeable keys the agent
 * happened to pick. Soft criteria do not block advancement, so this failed
 * quietly: a permanently unmeetable row in the P4 gate panel.
 *
 * What each assertion is worth:
 *  - The alias lists are written out as LITERALS on purpose. Reading them off
 *    `governance.ts` would let a rename pass.
 *  - The source-text probe is used only in the sound direction. A key that does
 *    NOT appear as a quoted literal in `governance.ts` definitely cannot be
 *    read by any criterion there; a key that does appear is only PLAUSIBLY read
 *    (it may occur somewhere unrelated). So the probe can prove darkness, never
 *    wiring — which is why the behavioural case below drives `evaluateGate`.
 */
import { readFileSync } from "node:fs";
import path from "node:path";

import { ALLOWED_PROGRAM_DELIVERABLE_TYPES } from "@/lib/agent/tools/program/completeDeliverable";
import {
  PHASE_CANONICAL_KEYS,
  phaseCanonicalKeysForRoute,
} from "@/lib/programs/deliverable-registry";
import { evaluateGate, gateCriteriaForPhase } from "@/lib/programs/governance";

jest.mock("@/lib/programs/queries", () => ({
  getProgramById: jest.fn(async () => ({
    id: "move-1",
    currentPhase: 4,
    charter: null,
    archetype: null,
  })),
}));

const GOVERNANCE_SOURCE = readFileSync(
  path.join(process.cwd(), "src/lib/programs/governance.ts"),
  "utf8",
);

/**
 * The P4 exit criteria that are `soft`, read ONLY a `deliverables_v2` row, and
 * have no capture-text, module, or milestone fallback — so a signed-off,
 * deliberately authored row of one of these types is the single thing that can
 * make them pass.
 */
const AUTHORSHIP_ONLY_SOFT_CRITERIA: ReadonlyArray<{
  fromPhase: number;
  criterion: string;
  aliases: readonly string[];
}> = [
  {
    fromPhase: 4,
    criterion: "funding_approval_recorded",
    aliases: ["funding_approval", "capacity_approval", "approval_memo"],
  },
  {
    fromPhase: 4,
    criterion: "sponsor_alignment_confirmed",
    aliases: ["stakeholder_alignment", "sponsor_alignment"],
  },
  {
    fromPhase: 4,
    criterion: "tower_handoff_plan_accepted",
    aliases: [
      "tower_handoff_plan",
      "execution_monitoring_plan",
      "control_tower_handoff",
    ],
  },
];

/**
 * Authorship keys that NO gate criterion reads, each deliberately so. These are
 * working artifacts: real things a Move produces and a client reads, which no
 * phase-exit criterion is defined in terms of. Adding a key here is a claim
 * that nothing should gate on it — not a place to park an unwired one.
 */
const NOT_READ_BY_ANY_GATE: Readonly<Record<string, string>> = {
  approval_packet:
    "Assembly of other artifacts; the funding criterion reads approval_memo.",
  outcome_report:
    "Post-handoff reporting owned by Tower, after the last Moves gate.",
  risk_register:
    "Working risk log; p5_open_risks_recorded reads the handoff package.",
  stakeholder_map:
    "Working map; the P2 stakeholder criterion reads discovery-report text.",
  synthesis_options_memo:
    "P2 options analysis feeding the Discovery Report, not gated on its own.",
  workshop_facilitator_guide:
    "Facilitation aid for a session; no gate turns on a guide existing.",
};

/** Every key any phase's generation set can build, on every route it varies by. */
function generatedKeys(): Set<string> {
  const keys = new Set<string>();
  const routeShapes = [
    null,
    {
      route: "technical_product" as const,
      workflowChange: "none" as const,
      roleAccountabilityChange: "none" as const,
    },
    {
      route: "process_change" as const,
      workflowChange: "limited" as const,
      roleAccountabilityChange: "limited" as const,
    },
    {
      route: "process_change" as const,
      workflowChange: "material" as const,
      roleAccountabilityChange: "material" as const,
    },
  ];
  for (const phase of Object.keys(PHASE_CANONICAL_KEYS).map(Number)) {
    for (const shape of routeShapes) {
      for (const key of phaseCanonicalKeysForRoute(
        phase,
        shape as Parameters<typeof phaseCanonicalKeysForRoute>[1],
      )) {
        keys.add(key);
      }
    }
  }
  return keys;
}

/** Minimal fluent stub over the five tables `evaluateGate` reads. */
function supabaseWith(
  deliverables: ReadonlyArray<Record<string, unknown>>,
): Parameters<typeof evaluateGate>[4] extends { supabase?: infer S }
  ? S
  : never {
  const tables: Record<string, unknown[]> = {
    deliverables_v2: [...deliverables],
    program_modules: [],
    engagement_participants: [],
    program_approval_requests: [],
    program_milestones: [],
  };
  const builder = (table: string) => {
    const result = { data: tables[table] ?? [], error: null };
    const chain: Record<string, unknown> = {
      then: (resolve: (value: typeof result) => unknown) => resolve(result),
    };
    for (const method of ["select", "eq", "in", "order", "limit"]) {
      chain[method] = () => chain;
    }
    return chain;
  };
  return { from: builder } as never;
}

const CTX = { clientId: "client-1", userId: "user-1" } as Parameters<
  typeof evaluateGate
>[0];

/** A hand-authored, signed-off row: no linked artifact, no generated marker. */
function authoredRow(key: string, status = "signed_off") {
  return {
    id: `deliverable-${key}`,
    deliverable_type_key: key,
    status,
    approved_artifact_id: null,
    structured_data: { source: "complete_deliverable" },
  };
}

async function failedChecksFor(
  deliverables: ReadonlyArray<Record<string, unknown>>,
): Promise<string[]> {
  const result = await evaluateGate(CTX, "move-1", 4, 5, {
    supabase: supabaseWith(deliverables),
  });
  return result.failedChecks.map((check) => check.check);
}

describe("authorship-only gate criterion reachability", () => {
  it("still declares every pinned criterion as a soft exit criterion of its phase", () => {
    for (const entry of AUTHORSHIP_ONLY_SOFT_CRITERIA) {
      const match = gateCriteriaForPhase(entry.fromPhase)?.find(
        (criterion) => criterion.key === entry.criterion,
      );
      expect({
        criterion: entry.criterion,
        severity: match?.severity ?? "ABSENT",
      }).toEqual({ criterion: entry.criterion, severity: "soft" });
    }
  });

  it("keeps every pinned alias spelled the same way in the gate evaluator", () => {
    for (const entry of AUTHORSHIP_ONLY_SOFT_CRITERIA) {
      for (const alias of entry.aliases) {
        expect({
          criterion: entry.criterion,
          alias,
          presentInGovernance: GOVERNANCE_SOURCE.includes(`"${alias}"`),
        }).toEqual({
          criterion: entry.criterion,
          alias,
          presentInGovernance: true,
        });
      }
    }
  });

  it("confirms no phase generation set builds any of these, so authorship is the only producer", () => {
    // The premise of this whole suite. If a registry entry ever starts
    // producing one of these keys, the sibling generation-reachability join
    // applies to it as well and this entry belongs over there too.
    const built = generatedKeys();
    const generated: string[] = [];
    for (const entry of AUTHORSHIP_ONLY_SOFT_CRITERIA) {
      for (const alias of entry.aliases) {
        if (built.has(alias)) generated.push(`${entry.criterion}: ${alias}`);
      }
    }
    expect(generated).toEqual([]);
  });

  it("lets the sole producer write every spelling the criterion accepts", () => {
    const rejected: string[] = [];
    for (const entry of AUTHORSHIP_ONLY_SOFT_CRITERIA) {
      for (const alias of entry.aliases) {
        if (!ALLOWED_PROGRAM_DELIVERABLE_TYPES.has(alias)) {
          rejected.push(`${entry.criterion}: ${alias}`);
        }
      }
    }
    expect(rejected).toEqual([]);
  });

  it("accounts for every key the authorship tool allows, as read by a gate or deliberately not", () => {
    // The guard that was missing. A spelling the tool will accept and sign off
    // must either reach a criterion or be a named working artifact; otherwise
    // it is a signed-off row that nothing in the product can ever read.
    const unaccounted: string[] = [];
    for (const key of [...ALLOWED_PROGRAM_DELIVERABLE_TYPES].sort()) {
      if (GOVERNANCE_SOURCE.includes(`"${key}"`)) continue;
      if (key in NOT_READ_BY_ANY_GATE) continue;
      unaccounted.push(key);
    }
    expect(unaccounted).toEqual([]);
  });

  it("does not justify as unread any key a gate criterion actually reads", () => {
    // Keeps the list above from drifting into a blanket exemption.
    const contradicted = Object.keys(NOT_READ_BY_ANY_GATE).filter((key) =>
      GOVERNANCE_SOURCE.includes(`"${key}"`),
    );
    expect(contradicted).toEqual([]);
  });

  it("passes sponsor alignment on either spelling the authorship tool offers", async () => {
    for (const alias of ["stakeholder_alignment", "sponsor_alignment"]) {
      const failed = await failedChecksFor([authoredRow(alias)]);
      expect({ alias, unmet: failed.includes("sponsor_alignment_confirmed") }).toEqual(
        { alias, unmet: false },
      );
    }
  });

  it("still reports sponsor alignment unmet with no record, or with one not signed off", async () => {
    expect(await failedChecksFor([])).toContain("sponsor_alignment_confirmed");
    expect(
      await failedChecksFor([authoredRow("sponsor_alignment", "in_review")]),
    ).toContain("sponsor_alignment_confirmed");
  });

  it("passes the other two authorship-only criteria from a signed authored record", async () => {
    // Pins that these criteria are reachable at all, so a future alias change
    // cannot quietly make one of them unmeetable the way sponsor alignment was.
    for (const entry of AUTHORSHIP_ONLY_SOFT_CRITERIA) {
      if (entry.criterion === "sponsor_alignment_confirmed") continue;
      for (const alias of entry.aliases) {
        const failed = await failedChecksFor([authoredRow(alias)]);
        expect({
          criterion: entry.criterion,
          alias,
          unmet: failed.includes(entry.criterion),
        }).toEqual({ criterion: entry.criterion, alias, unmet: false });
      }
    }
  });
});
