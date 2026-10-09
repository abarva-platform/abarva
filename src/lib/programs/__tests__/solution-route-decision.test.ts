/**
 * Can the reviewer's "confirm" decision ever validate a solution route?
 *
 * `solution_route_validated` is `hard` in two consecutive gates (P2 -> P3 and
 * P3 -> P4) and its third conjunct is `confirmedSolutionRoute !== null`, with
 * no capture-text, module, milestone or deliverable fallback. So whether a
 * decision the capture form OFFERS can produce a route is not a cosmetic
 * question: an offered-but-incapable decision parks the Move against a hard
 * gate that no later capture can clear.
 *
 * `resolveConfirmedSolutionRoute` rejects `decision: "confirm"` whenever
 * `selectedRoute !== recommendation`, and `selectedRoute`'s type excludes
 * `"unresolved"` — so for an unresolved recommendation that inequality holds
 * for every storable value. The form offered "Confirm recommendation" anyway,
 * beside a displayed recommendation of "Not yet determined", and writing it
 * stored `selectedRoute: ""`, which `parseSolutionRouteValidation` rejects
 * outright. Nothing on the form said so and the gate named neither the cause
 * nor the exit.
 *
 * What each assertion is worth:
 *  - The enumeration walks the form's OWN three selects (5 outputs x 3 x 3) so
 *    the reachable-dead-end count is measured against what a reviewer can
 *    actually express, not against the type.
 *  - The resolver cases drive `resolveConfirmedSolutionRoute` rather than
 *    restating this module's rule, so the rule stays grounded in the function
 *    whose `null` is what the gate reads. Asserting the module against itself
 *    would pass even if the resolver's behaviour changed underneath it.
 *  - `"correct"` is asserted to still work on the same unresolved answer,
 *    because an exit that is merely named and not usable is not an exit.
 */
import {
  canConfirmSolutionRouteRecommendation,
  solutionRouteConfirmUnavailableReason,
  solutionRouteDecisionChoices,
} from "@/lib/programs/solution-route-decision";
import {
  recommendSolutionRoute,
  resolveConfirmedSolutionRoute,
  SOLUTION_OUTPUT_TYPES,
  SOLUTION_ROUTES,
  type SolutionOutputType,
  type SolutionRoute,
} from "@/lib/programs/solution-route-assessment";

/** The impact levels the capture form's two impact selects offer. */
const FORM_IMPACT_CHOICES = ["none", "limited", "material"] as const;

const EVIDENCE_ID = "evidence-p2-governed-baseline";

const P1_ASSESSMENT = {
  expectedWorkflowChange: "limited",
  expectedRoleAccountabilityChange: "limited",
  adoptionOwner: "Named business owner",
  adoptionResponsibility: "business",
  evidenceReference: EVIDENCE_ID,
  validatedBy: "reviewer@example.test",
} as const;

function routeValidation(overrides: Record<string, unknown>) {
  return JSON.stringify({
    businessChangeAssessmentSnapshot: P1_ASSESSMENT,
    evidenceReference: EVIDENCE_ID,
    validatedBy: "reviewer@example.test",
    correctionRationale: "",
    ...overrides,
  });
}

function resolve(overrides: Record<string, unknown>) {
  return resolveConfirmedSolutionRoute({
    businessChangeAssessment: JSON.stringify(P1_ASSESSMENT),
    routeValidation: routeValidation(overrides),
    approvedEvidenceReferences: [EVIDENCE_ID],
  });
}

/** Every answer the form's three route-impact selects can express. */
function formAnswerCombinations() {
  const out: Array<{
    solutionOutput: SolutionOutputType;
    workflowChange: (typeof FORM_IMPACT_CHOICES)[number];
    roleAccountabilityChange: (typeof FORM_IMPACT_CHOICES)[number];
  }> = [];
  for (const solutionOutput of SOLUTION_OUTPUT_TYPES) {
    for (const workflowChange of FORM_IMPACT_CHOICES) {
      for (const roleAccountabilityChange of FORM_IMPACT_CHOICES) {
        out.push({ solutionOutput, workflowChange, roleAccountabilityChange });
      }
    }
  }
  return out;
}

describe("solution-route decision availability", () => {
  it("offers confirm for every recommendation except the unresolved one", () => {
    for (const recommendation of SOLUTION_ROUTES) {
      expect(canConfirmSolutionRouteRecommendation(recommendation)).toBe(
        recommendation !== "unresolved",
      );
    }
  });

  it("drops confirm from the offered decisions only when unresolved, keeping correct always", () => {
    for (const recommendation of SOLUTION_ROUTES) {
      const values = solutionRouteDecisionChoices(recommendation).map(
        (choice) => choice.value,
      );
      expect(values).toContain("correct");
      if (recommendation === "unresolved") {
        expect(values).toEqual(["correct"]);
      } else {
        expect(values).toEqual(["confirm", "correct"]);
      }
    }
  });

  it("gives a reason only when confirm is unavailable, naming the cause and the exit", () => {
    for (const recommendation of SOLUTION_ROUTES) {
      const reason = solutionRouteConfirmUnavailableReason(recommendation);
      if (recommendation !== "unresolved") {
        expect(reason).toBeNull();
        continue;
      }
      expect(reason).not.toBeNull();
      // The cause: there is nothing to confirm.
      expect(reason).toMatch(/no recommendation to confirm/i);
      // The exit: the other decision, by the name the control uses.
      expect(reason).toMatch(/correct recommendation/i);
    }
  });

  it("labels each offered decision with the wording the capture control uses", () => {
    expect(solutionRouteDecisionChoices("technical_product")).toEqual([
      { value: "confirm", label: "Confirm recommendation" },
      { value: "correct", label: "Correct recommendation" },
    ]);
    expect(solutionRouteDecisionChoices("unresolved")).toEqual([
      { value: "correct", label: "Correct recommendation" },
    ]);
  });
});

describe("the rule matches what the gate's resolver actually does", () => {
  it("confirming an unresolved recommendation yields no route, for every route the reviewer could store", () => {
    const unresolving = {
      solutionOutput: "mixed",
      workflowChange: "limited",
      roleAccountabilityChange: "limited",
    } as const;
    expect(recommendSolutionRoute(unresolving)).toBe("unresolved");

    const storableRoutes = SOLUTION_ROUTES.filter(
      (route) => route !== "unresolved",
    );
    expect(storableRoutes.length).toBeGreaterThan(0);
    for (const selectedRoute of storableRoutes) {
      expect(
        resolve({ ...unresolving, decision: "confirm", selectedRoute }),
      ).toBeNull();
    }
    // And the empty string the form used to store is rejected too.
    expect(
      resolve({ ...unresolving, decision: "confirm", selectedRoute: "" }),
    ).toBeNull();
  });

  it("correcting the same unresolved answer does validate a route, so the exit is real", () => {
    const confirmed = resolve({
      solutionOutput: "mixed",
      workflowChange: "limited",
      roleAccountabilityChange: "limited",
      decision: "correct",
      selectedRoute: "process_change",
      correctionRationale:
        "Mixed outputs, but the measurable change is the intake workflow.",
    });
    expect(confirmed).not.toBeNull();
    expect(confirmed?.route).toBe("process_change");
    expect(confirmed?.decision).toBe("correct");
  });

  it("confirming a resolved recommendation still validates, so the rule withholds nothing else", () => {
    const resolving = {
      solutionOutput: "reports_dashboards",
      workflowChange: "limited",
      roleAccountabilityChange: "none",
    } as const;
    const recommendation = recommendSolutionRoute(resolving);
    expect(recommendation).toBe("technical_product");
    const confirmed = resolve({
      ...resolving,
      decision: "confirm",
      selectedRoute: recommendation,
    });
    expect(confirmed).not.toBeNull();
    expect(confirmed?.route).toBe("technical_product");
  });

  it("every form answer the module calls unconfirmable really is, and every other one is confirmable", () => {
    const combinations = formAnswerCombinations();
    expect(combinations).toHaveLength(45);

    const unconfirmable: string[] = [];
    for (const answer of combinations) {
      const recommendation: SolutionRoute = recommendSolutionRoute(answer);
      const moduleSaysConfirmable =
        canConfirmSolutionRouteRecommendation(recommendation);

      if (!moduleSaysConfirmable) {
        unconfirmable.push(
          `${answer.solutionOutput}/${answer.workflowChange}/${answer.roleAccountabilityChange}`,
        );
        // Confirming is incapable of producing a route here.
        expect(
          resolve({
            ...answer,
            decision: "confirm",
            selectedRoute: "process_change",
          }),
        ).toBeNull();
        continue;
      }

      // Where the module keeps confirm, confirming the recommendation works.
      expect(
        resolve({
          ...answer,
          decision: "confirm",
          selectedRoute: recommendation,
        }),
      ).not.toBeNull();
    }

    // Written out as literals: a change in the recommendation table should
    // move this list, not quietly re-derive it.
    expect(unconfirmable.sort()).toEqual([
      "mixed/limited/limited",
      "mixed/limited/none",
      "mixed/none/limited",
      "mixed/none/none",
    ]);
  });
});
