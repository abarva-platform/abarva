/** @jest-environment jsdom */

/**
 * Item U-400 / `N3`: no builder vocabulary on a Source surface a client reads.
 *
 * **This control is measured over what renders, not over what greps.** Every
 * assertion below renders a real mounted Source component, drives it the way an
 * operator would, and scans the text the DOM actually produced. That is the
 * method the item asks for, and it is the reason the control can see a term
 * assembled at runtime from parts — `criticalFields.slice(0, 4).join(", ")`
 * reaches a screen as a sentence no grep over the component would match.
 *
 * ## Why there is an adjudication table rather than a flat "zero occurrences"
 *
 * Not every identifier-shaped token on a Source screen is a defect. Some name
 * the columns a client's own extract must carry, and renaming those would make
 * the instruction wrong rather than kinder. U-400 says so directly: where the
 * correct client-facing term is a product decision rather than a rename,
 * surface it and leave it.
 *
 * So each surface declares the occurrences that were examined and left, **with
 * the reason**, and the control fails in **both** directions:
 *
 *   - a term that appears and is not adjudicated → a new defect shipped;
 *   - an adjudicated term that no longer appears → the entry is stale and must
 *     be deleted, so the table cannot outlive what it describes.
 *
 * The second direction is the one that is usually missing. A baseline that only
 * fails upward quietly accumulates entries for defects somebody already fixed,
 * and then nobody trusts it.
 */

import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";

// The canvas reads the router for its own navigation. Mocked because this suite
// audits rendered text, not routing — and an unmocked `useRouter` throws in
// jsdom, which would make the surface unauditable rather than clean.
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), refresh: jest.fn() }),
  usePathname: () => "/source/events/evt-1",
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({ eventId: "evt-1" }),
}));

import { ArtifactBlockerList } from "@/components/source/canvas/ArtifactBlockerList";
import { SourceAnalyticsCanvas } from "@/components/source/canvas/analytics/SourceAnalyticsCanvas";
import { StepInsightPanel } from "@/components/source/canvas/analytics/insights/StepInsightPanel";
import { RenewalCockpitActionBar } from "@/components/source/RenewalCockpitActionBar";
import { SimpleStageFront } from "@/components/source/canvas/SimpleStageFront";
import { resolveSimpleStageScreen } from "@/lib/source/simple-front";
import { SOURCE_ARTIFACT_SPECS } from "@/lib/source/canonical-specs/artifact-specs";
import { evidenceForStage } from "@/lib/source/canonical-specs/evidence-requirements";
import { SOURCE_STAGE_ORDER } from "@/lib/source/constants";
import { buildStepInsight } from "@/lib/source/facts/view/step-insight-builder";
import type { SourcingEventSummary } from "@/lib/source/types";
import {
  describeBuilderVocabulary,
  findBuilderVocabulary,
} from "@/testing/source-builder-vocabulary";
import { AUDITED_SURFACE_ROOTS } from "@/testing/source-builder-vocabulary-coverage";

/**
 * A surface under audit: how to put it on screen, how to drive it so the parts
 * an operator can reach are actually rendered, and what was adjudicated.
 */
interface SurfaceUnderAudit {
  readonly name: string;
  /**
   * The component file this surface mounts, repo-relative.
   *
   * Item U-405: the coverage this control has over shipped Source UI is
   * derived from these paths and committed to
   * `docs/architecture/source-builder-vocabulary-render-coverage.json`. Naming
   * the root here is what lets the coverage gate redden by surface name when a
   * surface is dropped, instead of a total quietly shrinking.
   */
  readonly rootPath: string;
  /** Renders the surface and returns the text of everything reachable on it. */
  readonly renderAndDrive: () => string;
  /**
   * Terms examined and deliberately left, term → why. Every entry must still
   * be present on the surface, or the control fails as stale. Use this for a
   * one-off; use `adjudicatedBy` when the exemption is a rule rather than a
   * list, so it cannot drift from the code it describes.
   */
  readonly adjudicated: Readonly<Record<string, string>>;
  /**
   * A derived exemption: given a rendered term, the reason it is allowed, or
   * `null`. This exists so an exemption whose membership is decidable from
   * code is not re-typed as a list that a later change silently invalidates —
   * the same reason tenants come from `CANONICAL_TENANT_KEYS` rather than from
   * a hand-maintained array. A derived rule is NOT staleness-checked: it has
   * no entries to go stale.
   */
  readonly adjudicatedBy?: (term: string) => string | null;
}

const cockpit = {
  clientKey: "tenant-a",
  contractId: "CONTRACT-1",
  vendorName: "Vendor One",
  product: "Platform subscription",
  generatedAt: "2026-09-18T00:00:00Z",
  currentAnnualSpendUsd: 1_000_000,
  timing: { summary: "The notice window closes in 30 days." },
  usage: {},
  shouldCost: {},
  leverage: {},
  alternatives: [],
  recommendedPosture: "decline_renewal",
  postureLabel: "Decline renewal",
  postureRationale: "Usage does not support the committed tier.",
} as never;

/** Every panel an operator can open from the renewal cockpit action bar. */
const COCKPIT_PANELS = [
  "Serve notice",
  "Assign owner",
  "Draft vendor email",
  "Create Source event / Move handoff",
  "Create Tower watch item",
] as const;

/**
 * Every critical field the canonical requirement set declares for the stage the
 * audit renders. Read from the spec, never typed out here.
 */
const STAGE_FRONT_CRITICAL_FIELDS: ReadonlySet<string> = new Set(
  evidenceForStage("scope").flatMap((requirement) => requirement.criticalFields),
);

/**
 * Item U-523 · the canvas walk.
 *
 * The canvas is one surface with five workspaces and two disclosures, and
 * reading it once audits the steps rail alone — the artifact register, the
 * lifecycle matrix and the audit metrics are all behind a click. Driving it the
 * way an operator does takes the audited text from 6 KB to 84 KB, which is the
 * difference between auditing a screen and auditing a tab.
 *
 * Declared by name rather than by "click every button" so that a renamed
 * control **reddens** instead of quietly auditing less; the walk asserts each
 * disclosure was reached at least once.
 */
const CANVAS_WORKSPACES = [
  "Files & deliverables",
  "Intelligence Explorer",
  "Approvals",
  "Guidebook",
] as const;

/** Disclosures that keep half a workspace off screen until they are opened. */
const CANVAS_DISCLOSURES = ["Show all 11 stages", "Show audit metrics"] as const;

/**
 * The event the canvas walk mounts. Shaped like the server projection, with no
 * stage view, so every stage falls back to its own scaffold — which is the
 * state a new event is actually in and the one that renders the whole artifact
 * register rather than one stage's slice.
 */
function canvasEvent(): SourcingEventSummary {
  return {
    id: "evt-1",
    code: "DEMO-AMS-2026",
    name: "Managed application services",
    accountName: "Demo Account",
    leadAgent: "Sentinel",
    archetype: "AMS",
    rigor: "standard",
    status: "active",
    statusLabel: "Active",
    priority: "high",
    currentStageKey: "scope",
    currentStageLabel: "Scope",
    openAlerts: 0,
    owner: "K. Oshima",
    agingDays: 4,
    blocker: null,
    nextAction: "Provide the volumetrics",
    isAtRisk: false,
    valueAtStakeUsd: 1_000_000,
    projectedValueUsd: 200_000,
    realizedValueUsd: 0,
    nextDecision: "Approve scope gate",
  } as SourcingEventSummary;
}

/**
 * Every canonical document code the artifact register can render, read from the
 * canonical spec set rather than typed out — a document added later is covered
 * without touching this file.
 */
const CANONICAL_ARTIFACT_CODES: readonly string[] = SOURCE_ARTIFACT_SPECS.map(
  (spec) => spec.code,
);

/**
 * The canonical document code inside a rendered token, or `null`.
 *
 * `container.textContent` concatenates adjacent text nodes with no separator,
 * so the register's mono sub-line reaches the detector as `Tieringd04_app_inv`
 * — the tail of the document's own name glued to its code. Matching a code as a
 * **suffix** is what recognizes that, and requiring the prefix to carry no
 * underscore is what stops the rule from waving through a second key that
 * happens to end in one.
 */
function canonicalArtifactCodeIn(term: string): string | null {
  for (const code of CANONICAL_ARTIFACT_CODES) {
    if (term === code) return code;
    if (!term.endsWith(code)) continue;
    const prefix = term.slice(0, term.length - code.length);
    if (!prefix.includes("_")) return code;
  }
  return null;
}

const SURFACES: readonly SurfaceUnderAudit[] = [
  {
    name: "renewal cockpit · action bar (all panels opened)",
    rootPath: "src/components/source/RenewalCockpitActionBar.tsx",
    renderAndDrive: () => {
      const { container } = render(<RenewalCockpitActionBar cockpit={cockpit} />);
      let text = container.textContent ?? "";
      // Open each panel in turn and accumulate. The panels are mutually
      // exclusive, so reading the surface once would audit one fifth of it.
      for (const panel of COCKPIT_PANELS) {
        fireEvent.click(screen.getByRole("button", { name: panel }));
        text += "\n" + (container.textContent ?? "");
        fireEvent.click(screen.getByRole("button", { name: panel }));
      }
      return text;
    },
    adjudicated: {},
  },
  {
    name: "stage front · working session guide",
    rootPath: "src/components/source/canvas/SimpleStageFront.tsx",
    renderAndDrive: () => {
      // The view is resolved by the product's own resolver from the canonical
      // requirement set, so the text audited here is the text a real event
      // produces — not copy invented for a fixture.
      const view = resolveSimpleStageScreen({}, "scope");
      const { container } = render(
        <SimpleStageFront
          eventId="evt-1"
          stage="scope"
          view={view}
          generating={false}
          registryArtifacts={[]}
          onGenerateArtifact={async () => ({ ok: true })}
          onAdvanceStage={() => {}}
          onRefresh={() => {}}
          advanced={<div>Advanced workspace</div>}
        />,
      );
      return container.textContent ?? "";
    },
    adjudicated: {},
    /**
     * The stage front's "Parse:" line lists the columns a client's own extract
     * has to carry. Those are field names by necessity — an operator preparing
     * a CMDB export needs `application_id`, not a paraphrase of it, and
     * replacing them with prose would make the instruction wrong rather than
     * kinder. U-400 names this case directly: where the correct client-facing
     * term is a product decision rather than a rename, surface it and leave it.
     *
     * Membership is decided against the canonical requirement set for the
     * stage, not against a copy of it. A field added to that set later is
     * covered without touching this file; a builder term that is NOT one of
     * those fields still fails, which is the whole value of deriving it.
     */
    adjudicatedBy: (term) =>
      STAGE_FRONT_CRITICAL_FIELDS.has(term)
        ? "names a column the client's own evidence extract must carry; " +
          "renaming it here would make the instruction wrong"
        : null,
  },
  {
    /**
     * Item U-523, rank 1 of the 34-surface worst-first ranking. The heaviest
     * Source surface there is, and the reason this slice paid: the walk rendered
     * ten distinct builder terms, five of them raw intake template codes on
     * three separate client-facing cells, now fixed.
     */
    name: "source canvas · every workspace and disclosure",
    rootPath:
      "src/components/source/canvas/analytics/SourceAnalyticsCanvas.tsx",
    renderAndDrive: () => {
      const { container } = render(
        <SourceAnalyticsCanvas
          event={canvasEvent()}
          viewStage="scope"
          tenantName="Demo Account"
          stageView={undefined}
        />,
      );
      let text = container.textContent ?? "";
      const disclosuresOpened = new Set<string>();
      for (const workspace of CANVAS_WORKSPACES) {
        fireEvent.click(screen.getByRole("button", { name: workspace }));
        text += "\n" + (container.textContent ?? "");
        for (const disclosure of CANVAS_DISCLOSURES) {
          const control = screen.queryByRole("button", { name: disclosure });
          if (!control) continue;
          fireEvent.click(control);
          disclosuresOpened.add(disclosure);
          text += "\n" + (container.textContent ?? "");
        }
      }
      // A disclosure that was renamed would silently halve this audit, so the
      // walk fails rather than passing over less surface.
      for (const disclosure of CANVAS_DISCLOSURES) {
        if (disclosuresOpened.has(disclosure)) continue;
        throw new Error(
          `The canvas walk never found the "${disclosure}" control, so the ` +
            `surface behind it was not audited. Update CANVAS_DISCLOSURES to ` +
            `the control's current name — do not delete the entry, which ` +
            `would drop the coverage instead of reporting it.`,
        );
      }
      return text;
    },
    adjudicated: {},
    /**
     * The artifact register renders each document's canonical code in a mono
     * 10px sub-line directly beneath the document's own published name — 33 of
     * them across the eleven stages once "Show all 11 stages" is open.
     *
     * Left, and not renamed, because this one really is the case U-400 carves
     * out. The code is not a paraphrasable label sitting where prose belongs:
     * it is a deliberate register handle, styled as one, and it is the same
     * string the generate, export and render routes take in their URLs. Whether
     * a client-facing document register shows its document code at all, and if
     * so whether as `d04_app_inv` or as a display form like `D04`, is a product
     * decision about the register — not a rename, which is the test U-400 sets.
     * Filed as a follow-on item rather than guessed at here.
     *
     * Membership is derived from `SOURCE_ARTIFACT_SPECS`, so a document added
     * later is covered and a term that is NOT a canonical document code still
     * fails on this surface. That second half is asserted below.
     */
    adjudicatedBy: (term) => {
      const code = canonicalArtifactCodeIn(term);
      return code
        ? `renders the canonical document code "${code}" as the artifact ` +
            `register's handle, beneath that document's own published name; ` +
            `whether the register shows a code, and in what form, is a ` +
            `product decision rather than a rename`
        : null;
    },
  },
  {
    /**
     * Item U-523, rank 5 of the ranking — and the entry that says most about
     * the prescreen. The syntax-aware pass counted 11 identifier-shaped tokens
     * in this file; every one is a `switch` discriminant and **none** of them
     * renders. Mounting it anyway surfaced six builder terms from its
     * CHILDREN: the Intelligence-tab notes named the fact key a client was
     * being asked to supply, and the transition-risk note joined
     * `missingEvidence` verbatim, so those keys were assembled at run time and
     * no pass over any file would have seen them. Both are fixed.
     *
     * So the per-file prescreen undercounts a dispatcher and cannot rank one:
     * the value of auditing a container is in what it mounts.
     *
     * Driven across every insight kind the product can build, from the
     * product's own builder — eleven stages, eleven kinds — rather than one
     * hand-written view, so the switch is covered rather than sampled.
     */
    name: "step insight panel · every insight kind",
    rootPath:
      "src/components/source/canvas/analytics/insights/StepInsightPanel.tsx",
    renderAndDrive: () => {
      let text = "";
      let kinds = 0;
      for (const stageKey of SOURCE_STAGE_ORDER) {
        const insight = buildStepInsight({
          stageKey,
          archetypeId: "AMS_MANAGED_SERVICES",
          // No facts and no citations: the state a new event is in, and the one
          // whose notes tell a client what to upload — which is where the
          // builder used to name the storage key.
          inputs: {},
          citations: {},
        });
        if (!insight) continue;
        kinds += 1;
        const { container } = render(<StepInsightPanel insight={insight} />);
        text += "\n" + (container.textContent ?? "");
      }
      // Guard the walk, not just the text: a builder that stopped returning
      // insights would leave this surface rendering nothing while the
      // non-empty check above still passed on another kind's output.
      if (kinds !== SOURCE_STAGE_ORDER.length) {
        throw new Error(
          `The insight walk built ${kinds} insights for ` +
            `${SOURCE_STAGE_ORDER.length} stages. Every Source stage maps to an ` +
            `insight kind today; if that changed deliberately, update this ` +
            `count with the reason rather than lowering it.`,
        );
      }
      return text;
    },
    adjudicated: {},
  },
  {
    name: "artifact blocker list",
    rootPath: "src/components/source/canvas/ArtifactBlockerList.tsx",
    renderAndDrive: () => {
      const { container } = render(
        <ArtifactBlockerList
          blockers={[
            { code: "not_accepted", detail: "Has not been accepted yet." },
            {
              code: "governance_stage_below_export_minimum",
              detail: "Below the required approval minimum.",
            },
          ]}
          testIdPrefix="export"
        />,
      );
      return container.textContent ?? "";
    },
    adjudicated: {},
  },
];

describe("Source surfaces · no builder vocabulary in rendered output", () => {
  it.each(SURFACES.map((s) => [s.name, s] as const))(
    "%s ships no unadjudicated builder vocabulary",
    (_name, surface) => {
      const rendered = surface.renderAndDrive();
      // Guard the guard: a surface that rendered nothing would pass vacuously.
      expect(rendered.trim().length).toBeGreaterThan(0);

      const found = findBuilderVocabulary(rendered);
      const unexpected = found.filter(
        (o) =>
          !(o.term in surface.adjudicated) &&
          (surface.adjudicatedBy?.(o.term) ?? null) === null,
      );

      expect(
        unexpected.length === 0
          ? ""
          : `Builder vocabulary rendered on "${surface.name}":\n` +
              describeBuilderVocabulary(unexpected) +
              "\nReplace it with the wording the rail already uses, or add it " +
              "to this surface's `adjudicated` table with the reason it has to stay.",
      ).toBe("");
    },
  );

  it.each(SURFACES.map((s) => [s.name, s] as const))(
    "%s has no stale adjudication entries",
    (_name, surface) => {
      const entries = Object.keys(surface.adjudicated);
      if (entries.length === 0) return;

      const rendered = surface.renderAndDrive();
      const present = new Set(findBuilderVocabulary(rendered).map((o) => o.term));
      const stale = entries.filter((term) => !present.has(term));

      expect(
        stale.length === 0
          ? ""
          : `These terms are adjudicated on "${surface.name}" but no longer render: ` +
              `${stale.join(", ")}. Delete the entries — an exemption that outlives ` +
              `its defect is how a baseline stops meaning anything.`,
      ).toBe("");
    },
  );
});

describe("the audited surface list and the declared coverage agree", () => {
  /**
   * Item U-405. The coverage number in
   * `docs/architecture/source-builder-vocabulary-render-coverage.json` is
   * derived from `AUDITED_SURFACE_ROOTS`, and this suite is what actually
   * mounts them. If the two drift, the artifact bills coverage for a screen
   * nothing renders — the exact shape of "a gate you cannot fail".
   *
   * Asserted per entry in both directions, never as a count: two entries
   * swapping leaves a total unmoved, and the failure has to say which one.
   */
  it.each(SURFACES.map((s) => [s.name, s] as const))(
    "%s is declared in AUDITED_SURFACE_ROOTS with the same root path",
    (_name, surface) => {
      const declared = AUDITED_SURFACE_ROOTS.find(
        (root) => root.surfaceName === surface.name,
      );
      expect(
        declared
          ? ""
          : `Surface "${surface.name}" is audited here but not declared in ` +
              `AUDITED_SURFACE_ROOTS, so the committed coverage number does ` +
              `not know about it.`,
      ).toBe("");
      expect(declared?.path).toBe(surface.rootPath);
    },
  );

  it.each(AUDITED_SURFACE_ROOTS.map((r) => [r.surfaceName, r] as const))(
    "%s is declared for coverage and is still audited here",
    (_name, root) => {
      const surface = SURFACES.find((s) => s.name === root.surfaceName);
      expect(
        surface
          ? ""
          : `AUDITED_SURFACE_ROOTS declares "${root.surfaceName}" ` +
              `(${root.path}) as audited, and this suite no longer mounts it. ` +
              `Restore the surface, or drop the declaration so the committed ` +
              `coverage number falls with it.`,
      ).toBe("");
      expect(surface?.rootPath).toBe(root.path);
    },
  );
});

describe("guarding the guard", () => {
  /**
   * Without this, the whole suite above passes vacuously the moment the
   * detector stops detecting: every surface is clean, so a blinded detector
   * and a clean product are indistinguishable from the outside. Measured, not
   * supposed — neutering the shape rule failed 6 of the detector's own cases
   * and 0 of the surface cases until this was added.
   *
   * So the suite renders one surface that is deliberately dirty and requires
   * the control to flag it.
   */
  function SeededSurface() {
    return (
      <p>
        The Tower portfolio reads <code>tower_watch</code> work items.
      </p>
    );
  }

  it("flags a surface that really does render a builder term", () => {
    const { container } = render(<SeededSurface />);
    const found = findBuilderVocabulary(container.textContent);
    expect(found.map((o) => o.term)).toEqual(["tower_watch"]);
  });

  it("flags a term that is NOT a canonical document code on the canvas", () => {
    // The canvas exemption is derived, so it has to be shown to be a rule and
    // not a blanket pass: a key the canonical spec set does not declare must
    // still fail on the surface that carries the exemption. Inverted — return
    // a reason unconditionally — and this case is the one that reddens.
    expect(canonicalArtifactCodeIn("tower_watch")).toBeNull();
    expect(canonicalArtifactCodeIn("d04_app_inv")).toBe("d04_app_inv");
    // The suffix rule recognizes the glued form the DOM actually produces...
    expect(canonicalArtifactCodeIn("Tieringd04_app_inv")).toBe("d04_app_inv");
    // ...and stops there: a second key in the prefix is not covered by it.
    expect(canonicalArtifactCodeIn("tower_watchd04_app_inv")).toBeNull();

    const canvas = SURFACES.find(
      (surface) => surface.name === "source canvas · every workspace and disclosure",
    );
    expect(canvas?.adjudicatedBy?.("tower_watch")).toBeNull();
    expect(canvas?.adjudicatedBy?.("d04_app_inv")).not.toBeNull();
  });

  it("flags a stage-front term that is NOT a canonical critical field", () => {
    // The derived exemption must be a rule, not a blanket pass. A term the
    // canonical requirement set does not declare has to fail even on the
    // surface that carries the exemption.
    expect(STAGE_FRONT_CRITICAL_FIELDS.has("tower_watch")).toBe(false);
    const stageFront = SURFACES.find((s) => s.adjudicatedBy);
    expect(stageFront?.adjudicatedBy?.("tower_watch")).toBeNull();
  });
});

describe("the control reads rendered text, not markup", () => {
  it("does not flag an internal code that reaches only a test id", () => {
    // `governance_stage_below_export_minimum` is in this component's
    // `data-testid`. That is not something a client reads, and a control that
    // failed on it would push people to rename their own test hooks.
    const { container } = render(
      <ArtifactBlockerList
        blockers={[
          {
            code: "governance_stage_below_export_minimum",
            detail: "Below the required approval minimum.",
          },
        ]}
        testIdPrefix="export"
      />,
    );

    expect(
      container.querySelector(
        '[data-testid="export-blocker-governance_stage_below_export_minimum"]',
      ),
    ).not.toBeNull();
    expect(findBuilderVocabulary(container.textContent)).toEqual([]);
  });
});
