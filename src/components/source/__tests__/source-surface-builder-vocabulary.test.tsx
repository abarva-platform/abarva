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

import { ArtifactBlockerList } from "@/components/source/canvas/ArtifactBlockerList";
import { RenewalCockpitActionBar } from "@/components/source/RenewalCockpitActionBar";
import { SimpleStageFront } from "@/components/source/canvas/SimpleStageFront";
import { resolveSimpleStageScreen } from "@/lib/source/simple-front";
import { evidenceForStage } from "@/lib/source/canonical-specs/evidence-requirements";
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
