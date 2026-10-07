/**
 * A gate criterion must not be impossible to satisfy.
 *
 * `evaluateGate` settles most criteria by looking for a `deliverables_v2` row
 * whose `deliverable_type_key` is in a per-criterion alias list. A phase's
 * "Approve & Build" produces exactly the keys `phaseCanonicalKeysForRoute`
 * resolves, and those come from `DELIVERABLE_REGISTRY`. When a criterion's
 * alias list and the build set share no key, no amount of building or signing
 * can satisfy that criterion — it can only be met by the `complete_deliverable`
 * agent tool writing one of the alias spellings by hand, or not at all.
 *
 * Three P4→P5 criteria are in that state today and are deliberately `soft`, so
 * the Move still advances and the criterion reads as an unmet nice-to-have.
 * That is survivable. What is NOT survivable is the same shape at `hard`
 * severity: capture completes, every document builds and is signed, and the
 * gate still refuses with nothing on screen a user could act on. The phase
 * becomes un-exitable and the Move can never reach Tower.
 *
 * `phase-gate-deliverable-reachability.test.ts` pins the other direction —
 * that the document-only HARD criteria it enumerates are matched by something
 * the phase builds. This suite pins the complement, and is the one that fires
 * if a criterion in the unproducible set is ever promoted to `hard`, or if a
 * new criterion is added whose alias list nothing can build. The per-archetype
 * `gateRequirements` declarations already name several of these keys at `hard`
 * severity, so the promotion this guards against is a plausible next edit, not
 * a hypothetical one.
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { gateCriteriaForPhase } from "@/lib/programs/governance";
import {
  DELIVERABLE_REGISTRY,
  phaseCanonicalKeysForRoute,
} from "@/lib/programs/deliverable-registry";

const GOVERNANCE_SOURCE = readFileSync(
  path.join(process.cwd(), "src/lib/programs/governance.ts"),
  "utf8",
);

/**
 * Criteria the evaluator settles ONLY from deliverable rows whose alias list
 * contains nothing any phase builds. Written out as literals on purpose:
 * deriving them from `governance.ts` would let a rename or a new instance pass
 * unnoticed. Each entry is re-proved below against the real modules, so an
 * entry that stops being true fails rather than lingering as a stale excuse.
 */
const UNPRODUCIBLE_DOCUMENT_ONLY_CRITERIA = [
  {
    key: "funding_approval_recorded",
    fromPhase: 4,
    acceptedKeys: ["funding_approval", "capacity_approval", "approval_memo"],
    reason:
      "No registry entry declares a funding/capacity approval document, so the P4 build cannot produce one. Kept soft: the funding decision is recorded outside the Move today.",
  },
  {
    key: "sponsor_alignment_confirmed",
    fromPhase: 4,
    acceptedKeys: ["stakeholder_alignment", "sponsor_alignment"],
    reason:
      "The alignment record's only producer is the `complete_deliverable` agent tool, which advertises both spellings. No phase builds either, so it stays soft.",
  },
  {
    key: "tower_handoff_plan_accepted",
    fromPhase: 4,
    acceptedKeys: [
      "tower_handoff_plan",
      "execution_monitoring_plan",
      "control_tower_handoff",
    ],
    reason:
      "P4 builds `tower_metrics_plan` (read by the sibling `tower_metric_plan_drafted`) and P5 builds `handoff_package`; neither spelling here is built by any phase. Teaching this criterion to read one of those would duplicate a sibling or add a new refusal, which is a product decision about where the P4 bar sits.",
  },
] as const;

/**
 * Evaluator `case` keys that no gate rule declares, so `evaluateGate` never
 * reaches them. Each was superseded by a stricter sibling criterion that the
 * rule declares instead; the looser case was left behind. Listed rather than
 * deleted because removing an unreachable branch from `governance.ts` is a
 * change to a hot shared file, and because the list is the useful artifact: a
 * case that becomes reachable must bring a buildable document with it.
 */
const UNDECLARED_EVALUATOR_CASES = [
  {
    key: "charter_drafted",
    supersededBy: "charter_signed_off",
    reason:
      "P1→P2 declares only the signed-off form. The drafted form asks for a `charter` row with any non-null status, which a signed-off charter already satisfies.",
  },
  {
    key: "current_state_summary_drafted",
    supersededBy: "discovery_report_signed_off",
    reason:
      "P2→P3 declares the signed-off discovery report. This case accepts only summary/assessment spellings no phase builds, so declaring it would fail every evaluation.",
  },
  {
    key: "execution_plan_drafted",
    supersededBy: "execution_roadmap_approved",
    reason:
      "P4 declares the approved roadmap. This case accepts `execution_plan`/`mobilization_roadmap` spellings alongside the built `execution_roadmap`.",
  },
] as const;

/** Every deliverable type key any phase's build can actually produce. */
function producibleKeys(): Set<string> {
  const keys = new Set<string>();
  const routes = [
    null,
    { route: "technical_product", workflowChange: "material" },
    { route: "process_change", workflowChange: "material" },
    { route: "process_change", workflowChange: "limited" },
  ] as const;
  for (let phase = 0; phase <= 6; phase += 1) {
    for (const route of routes) {
      for (const key of phaseCanonicalKeysForRoute(
        phase,
        route as never,
      )) {
        keys.add(key);
      }
    }
  }
  return keys;
}

/** Alias lists the evaluator resolves, by the local const that holds the row. */
function aliasGroups(): Map<string, string[]> {
  const groups = new Map<string, string[]>();
  for (const match of GOVERNANCE_SOURCE.matchAll(
    /const (\w+) = findDeliverables?\(([^)]*)\)/g,
  )) {
    groups.set(
      match[1]!,
      [...match[2]!.matchAll(/"([^"]+)"/g)].map((m) => m[1]!),
    );
  }
  for (const match of GOVERNANCE_SOURCE.matchAll(
    /const (\w+) = deliverableRows\.find\(\s*\(d\) => d\.deliverable_type_key === "([^"]+)"/g,
  )) {
    groups.set(match[1]!, [match[2]!]);
  }
  return groups;
}

type EvaluatedCriterion = {
  key: string;
  acceptedKeys: string[];
  documentOnly: boolean;
};

/** Parse the evaluator's switch: which criteria read which deliverable keys. */
function evaluatedCriteria(): EvaluatedCriterion[] {
  const groups = aliasGroups();
  const switchBody = GOVERNANCE_SOURCE.slice(
    GOVERNANCE_SOURCE.indexOf("for (const c of rule.checks)"),
  );
  const out: EvaluatedCriterion[] = [];
  for (const match of switchBody.matchAll(
    /case "(\w+)":\s*(?:\{)?([\s\S]*?)break;/g,
  )) {
    const key = match[1]!;
    const body = match[2]!;
    const accepted: string[] = [];
    for (const ref of new Set(
      [...body.matchAll(/\b(\w+Rows?)\b/g)].map((m) => m[1]!),
    )) {
      const group = groups.get(ref);
      if (group) accepted.push(...group);
    }
    for (const inline of body.matchAll(/findDeliverables?\(([^)]*)\)/g)) {
      accepted.push(
        ...[...inline[1]!.matchAll(/"([^"]+)"/g)].map((m) => m[1]!),
      );
    }
    if (accepted.length === 0) continue;
    out.push({
      key,
      acceptedKeys: [...new Set(accepted)],
      // A `||` in the body means some non-document route can satisfy it.
      documentOnly: !body.includes("||"),
    });
  }
  return out;
}

/** Every criterion any gate rule declares, with its severity. */
function declaredCriteria(): Map<string, { severity: string; phases: number[] }> {
  const declared = new Map<string, { severity: string; phases: number[] }>();
  for (let phase = 0; phase <= 6; phase += 1) {
    for (const criterion of gateCriteriaForPhase(phase) ?? []) {
      const prior = declared.get(criterion.key);
      if (prior) {
        prior.phases.push(phase);
        // A criterion declared hard anywhere is treated as hard.
        if (criterion.severity === "hard") prior.severity = "hard";
        continue;
      }
      declared.set(criterion.key, {
        severity: criterion.severity,
        phases: [phase],
      });
    }
  }
  return declared;
}

describe("gate criteria are satisfiable by something a phase builds", () => {
  it("resolves at least one buildable document for every HARD document-only criterion", () => {
    const producible = producibleKeys();
    const declared = declaredCriteria();
    const unsatisfiable = evaluatedCriteria()
      .filter((criterion) => criterion.documentOnly)
      .filter((criterion) => declared.get(criterion.key)?.severity === "hard")
      .filter(
        (criterion) =>
          !criterion.acceptedKeys.some((key) => producible.has(key)),
      );

    expect(
      unsatisfiable.map(
        (criterion) =>
          `${criterion.key} accepts only [${criterion.acceptedKeys.join(", ")}], none of which any phase builds`,
      ),
    ).toEqual([]);
  });

  it("keeps every criterion no build can satisfy at soft severity", () => {
    const declared = declaredCriteria();
    for (const exception of UNPRODUCIBLE_DOCUMENT_ONLY_CRITERIA) {
      const entry = declared.get(exception.key);
      expect(entry).toBeDefined();
      // Promoting one of these to `hard` makes its phase un-exitable: the
      // document it demands cannot be built. Give it a buildable document
      // first, then delete it from the list above.
      expect({ key: exception.key, severity: entry?.severity }).toEqual({
        key: exception.key,
        severity: "soft",
      });
      expect(entry?.phases).toContain(exception.fromPhase);
    }
  });

  it("re-proves each listed exception is still unbuildable and still read", () => {
    const producible = producibleKeys();
    const registryKeys = new Set(
      DELIVERABLE_REGISTRY.map((spec) => spec.deliverableTypeKey),
    );
    for (const exception of UNPRODUCIBLE_DOCUMENT_ONLY_CRITERIA) {
      for (const key of exception.acceptedKeys) {
        // If a key here becomes buildable, the criterion is satisfiable and
        // this exception is stale — remove the entry rather than leaving a
        // written reason standing that is no longer true.
        expect({ key, producible: producible.has(key) }).toEqual({
          key,
          producible: false,
        });
        expect({ key, inRegistry: registryKeys.has(key) }).toEqual({
          key,
          inRegistry: false,
        });
        // The evaluator must still read the spelling the reason argues about.
        expect(GOVERNANCE_SOURCE).toContain(`"${key}"`);
      }
      expect(exception.reason.length).toBeGreaterThan(40);
    }
  });

  it("declares every criterion the evaluator can settle", () => {
    const declared = declaredCriteria();
    const undeclared = evaluatedCriteria()
      .map((criterion) => criterion.key)
      .filter((key) => !declared.has(key))
      .filter(
        (key) =>
          !UNDECLARED_EVALUATOR_CASES.some((entry) => entry.key === key),
      );

    // A new `case` no rule declares is dead code; a rule that declares a
    // criterion the evaluator cannot settle always fails it.
    expect(undeclared).toEqual([]);
  });

  it("keeps the listed undeclared cases undeclared", () => {
    const declared = declaredCriteria();
    for (const { key, reason } of UNDECLARED_EVALUATOR_CASES) {
      // Declaring this case makes it live. Its alias list has no buildable
      // document, so it would fail every evaluation until one exists.
      expect({ key, declared: declared.has(key) }).toEqual({
        key,
        declared: false,
      });
      expect(GOVERNANCE_SOURCE).toContain(`case "${key}":`);
      expect(reason.length).toBeGreaterThan(40);
    }
  });
});
