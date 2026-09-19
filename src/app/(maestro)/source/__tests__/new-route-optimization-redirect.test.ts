import { readFileSync } from "node:fs";
import path from "node:path";
import { isValidElement } from "react";
import Page from "../new/page";
import { redirect } from "next/navigation";
import { resolveTenant } from "@/lib/tenant/resolveTenant";
import { listSourcingEvents } from "@/lib/source/queries";
import { SourceOriginatePage } from "@/components/source/SourceOriginatePage";
import { SourceNewRequestFirstPage } from "@/components/source/new-workspace/SourceNewRequestFirstPage";

const source = readFileSync(
  path.join(__dirname, "..", "new", "page.tsx"),
  "utf8",
);

jest.mock("next/navigation", () => ({
  redirect: jest.fn((href: string) => {
    throw new Error(`redirect:${href}`);
  }),
}));

jest.mock("@/lib/tenant/resolveTenant", () => ({ resolveTenant: jest.fn() }));
jest.mock("@/lib/source/queries", () => ({ listSourcingEvents: jest.fn() }));
jest.mock("@/components/source/SourceOriginatePage", () => ({
  SourceOriginatePage: () => "legacy-intake",
}));
jest.mock(
  "@/components/source/new-workspace/SourceNewRequestFirstPage",
  () => ({
    SourceNewRequestFirstPage: () => "request-first",
  }),
);

describe("Source new-event route optimization redirect", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(resolveTenant).mockResolvedValue({
      appClientKey: "meridian",
      displayName: "Example client",
    } as never);
    jest.mocked(listSourcingEvents).mockResolvedValue([]);
  });

  it("keeps contract optimization out of the New Event intake", () => {
    expect(source).toContain('params.intent === "contract-optimization"');
    expect(source).toContain(
      "redirect(buildSourceOptimizeContractHref(params))",
    );
    expect(source).toContain("@/lib/source/optimize-routing");
    expect(source).not.toContain("contractOptimizationRedirect");
  });

  it("renders the request-first destination by default", async () => {
    const result = await Page({ searchParams: Promise.resolve({}) });
    expect(isValidElement(result)).toBe(true);
    expect(isValidElement(result) ? result.type : null).toBe(
      SourceNewRequestFirstPage,
    );
    expect(listSourcingEvents).toHaveBeenCalled();
  });

  it("keeps the existing create intake behind an explicit route mode", async () => {
    const result = await Page({
      searchParams: Promise.resolve({ mode: "intake" }),
    });
    expect(isValidElement(result)).toBe(true);
    expect(isValidElement(result) ? result.type : null).toBe(
      SourceOriginatePage,
    );
    expect(listSourcingEvents).not.toHaveBeenCalled();
  });

  it("keeps intent-shaped intake routes on the existing intake surface", async () => {
    const result = await Page({
      searchParams: Promise.resolve({ intent: "renewal" }),
    });
    expect(isValidElement(result)).toBe(true);
    expect(isValidElement(result) ? result.type : null).toBe(
      SourceOriginatePage,
    );
    expect(listSourcingEvents).not.toHaveBeenCalled();
  });

  it("still redirects contract optimization before request queue loading", async () => {
    await expect(
      Page({
        searchParams: Promise.resolve({
          intent: "contract-optimization",
          contractId: "CTR-090",
        }),
      }),
    ).rejects.toThrow("redirect:/source/optimize?contractId=CTR-090");
    expect(redirect).toHaveBeenCalledWith(
      "/source/optimize?contractId=CTR-090",
    );
    expect(listSourcingEvents).not.toHaveBeenCalled();
  });
});
