/** @jest-environment jsdom */

import { render, screen } from "@testing-library/react";

import { ContractPerformanceCards } from "../Contract360Economics";
import type {
  SourceCloudTagQualityRow,
  SourceContractSpendMonthlyRow,
} from "@/lib/source/data-model/types";
import type { SourceWorkspaceVM } from "../buildViewModel";

/**
 * Twelve monthly tag-quality observations were loaded and asserted as
 * canonical facts while nothing in the read model selected them. These pin the
 * two ways the meter could lie once it does: reporting a coverage nobody
 * recorded as zero, and presenting one month's figure as if it described all
 * twelve.
 */

const tagRow = (
  overrides: Partial<SourceCloudTagQualityRow> = {},
): SourceCloudTagQualityRow =>
  ({
    contract_id: "C1",
    period_start: "2026-01-01",
    period_end: "2026-01-31",
    tag_quality_id: "t1",
    total_spend_usd: 10_000,
    untagged_spend_usd: 2_600,
    owner_tag_coverage_pct: 74,
    application_tag_coverage_pct: 68,
    data_quality_state: "usable_with_gaps",
    ...overrides,
  }) as unknown as SourceCloudTagQualityRow;

const spend = (): readonly SourceContractSpendMonthlyRow[] =>
  [
    {
      contract_id: "C1",
      month: "2026-01",
      committed_amount: 100_000,
      actual_spend: 4_000,
    },
  ] as unknown as readonly SourceContractSpendMonthlyRow[];

const vmWith = (performanceRequired: boolean) =>
  ({
    contractEducation: {
      facetRequirements: {
        Performance: {
          state: performanceRequired ? "required" : "not_required",
          reason: "No service-credit regime on this archetype.",
        },
      },
    },
  }) as unknown as SourceWorkspaceVM;

describe("ContractPerformanceCards", () => {
  it("reads each meter from the latest loaded check", () => {
    const { container } = render(
      <ContractPerformanceCards
        spendMonths={spend()}
        tagQuality={[
          tagRow({ tag_quality_id: "t1", owner_tag_coverage_pct: 60 }),
          tagRow({ tag_quality_id: "t2", owner_tag_coverage_pct: 74 }),
        ]}
        vm={vmWith(false)}
      />,
    );

    expect(screen.getByText("Owner tag present")).toBeTruthy();
    expect(screen.getByText("74%")).toBeTruthy();
    // The earlier month must not also render as a current figure.
    expect(screen.queryByText("60%")).toBeNull();

    const fills = [...container.querySelectorAll(".sw-c3-meter-fill")];
    expect(fills.length).toBe(2);
    expect((fills[0] as HTMLElement).style.getPropertyValue("--sw-c3-share")).toBe(
      "74.0%",
    );
  });

  it("omits a meter for a column no check recorded, rather than showing zero", () => {
    const { container } = render(
      <ContractPerformanceCards
        spendMonths={spend()}
        tagQuality={[
          tagRow({ application_tag_coverage_pct: null }),
          tagRow({ tag_quality_id: "t2", application_tag_coverage_pct: null }),
        ]}
        vm={vmWith(false)}
      />,
    );

    // Owner coverage was recorded and renders; application coverage was not,
    // so it is absent rather than 0% — nobody looked is not nothing tagged.
    expect(screen.getByText("Owner tag present")).toBeTruthy();
    expect(screen.queryByText("Application tag present")).toBeNull();
    expect(screen.queryByText("0%")).toBeNull();
    expect(container.querySelectorAll(".sw-c3-meter-fill").length).toBe(1);
  });

  it("says a figure is unchanged only when every check agrees", () => {
    render(
      <ContractPerformanceCards
        spendMonths={spend()}
        tagQuality={[tagRow(), tagRow({ tag_quality_id: "t2" })]}
        vm={vmWith(false)}
      />,
    );

    expect(
      screen.getByText(/Unchanged across all 2 monthly checks/),
    ).toBeTruthy();
  });

  it("presents a moving figure as the latest check, not as unchanged", () => {
    render(
      <ContractPerformanceCards
        spendMonths={spend()}
        tagQuality={[
          tagRow({ owner_tag_coverage_pct: 60 }),
          tagRow({ tag_quality_id: "t2", owner_tag_coverage_pct: 74 }),
        ]}
        vm={vmWith(false)}
      />,
    );

    expect(screen.getByText(/Latest of 2 monthly checks/)).toBeTruthy();
    expect(screen.queryByText(/Unchanged across/)).toBeNull();
  });

  it("carries the archetype's own reason on the not-required card", () => {
    render(
      <ContractPerformanceCards
        spendMonths={spend()}
        tagQuality={[tagRow()]}
        vm={vmWith(false)}
      />,
    );

    expect(screen.getByText("Not required · this archetype")).toBeTruthy();
    expect(
      screen.getByText("No service-credit regime on this archetype."),
    ).toBeTruthy();
  });

  it("renders nothing when there are no tag rows and performance is required", () => {
    const { container } = render(
      <ContractPerformanceCards
        spendMonths={spend()}
        tagQuality={[]}
        vm={vmWith(true)}
      />,
    );

    // With service levels required and no attribution rows, the tab's own
    // performance table is the surface; this row would add only empty cards.
    expect(container.firstChild).toBeNull();
  });

  it("refuses a pace figure when no commitment is recorded", () => {
    render(
      <ContractPerformanceCards
        spendMonths={
          [
            {
              contract_id: "C1",
              month: "2026-01",
              committed_amount: null,
              actual_spend: 4_000,
            },
          ] as unknown as readonly SourceContractSpendMonthlyRow[]
        }
        tagQuality={[tagRow()]}
        vm={vmWith(false)}
      />,
    );

    expect(
      screen.getByText(
        "No committed amount is recorded, so pace cannot be computed.",
      ),
    ).toBeTruthy();
  });
});
