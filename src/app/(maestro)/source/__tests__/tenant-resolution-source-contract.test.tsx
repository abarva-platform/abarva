/**
 * @jest-environment jsdom
 */

/**
 * Source's route-level identity and composition contract, rendered.
 *
 * This file used to read the six route files with `readFileSync` and assert
 * substrings of their source. Two of those assertions had already stopped
 * describing the product: the loading-shell case required the sentence
 * `Preparing Source command center.`, which #7622 deliberately replaced with a
 * contract-aware pair of headings on 2026-09-11, and it had been red ever
 * since -- while the same case could have been made green again by typing the
 * old sentence into a comment. That is the defect, not the sentence.
 *
 * Every case below renders or imports the thing it judges:
 *
 *  - intake identity is proved by making the canonical resolver and the legacy
 *    active-client row disagree and checking which one reaches the surface;
 *  - the retired portfolio route is proved by the redirect it performs;
 *  - `/source` and `/source/360` are proved by module identity, which a
 *    comment containing `export default SourceWorkspacePage` cannot satisfy;
 *  - the loading shell is mounted, in both of its branches.
 *
 * Retired deliberately, not dropped: the executive-shell case that scanned
 * `WorkspaceExecutiveShell.tsx` for `PAGE_LABELS` and for the two navigation
 * `aria-label`s. All of it is already proved by rendering in
 * `preview/workspace/__tests__/WorkspaceClient.ecl-browser.test.tsx`, which
 * mounts the shell, asserts the `Source workspace navigation` landmark is
 * present and `Main application navigation` is absent, and clicks `Levers` and
 * `Coverage` and asserts the pages they open. Duplicating that here as a byte
 * match would add a second, weaker control over the same behaviour.
 */
import { render, screen } from "@testing-library/react";

jest.mock("server-only", () => ({}));

const resolveTenant = jest.fn();
jest.mock("@/lib/tenant/resolveTenant", () => ({
  resolveTenant: (...args: unknown[]) => resolveTenant(...args),
}));

const getActiveClientRow = jest.fn();
jest.mock("@/lib/active-client", () => ({
  getActiveClientRow: (...args: unknown[]) => getActiveClientRow(...args),
}));

/*
 * The workspace route reaches Clerk through the tenancy guards, which ship as
 * ESM that this project's Jest transform does not take. The guards are not the
 * subject of the module-identity case below -- what is being proved is that
 * `/source` and `/source/360` resolve to the *same* page function -- so they
 * are stubbed at the boundary rather than pulled in.
 */
jest.mock("@/lib/auth/tenancy", () => ({
  requireTenancy: jest.fn(),
  TenancyError: class TenancyError extends Error {},
}));
jest.mock("@/lib/auth/tenant-access", () => ({
  checkTenantAccessByKey: jest.fn(),
}));
jest.mock("../workspace/WorkspaceClientLoader", () => ({
  WorkspaceClientLoader: () => <div data-testid="workspace-client-loader" />,
}));

const listSourcingEvents = jest.fn();
jest.mock("@/lib/source/queries", () => ({
  listSourcingEvents: (...args: unknown[]) => listSourcingEvents(...args),
}));
const readSourceIntakeRequestQueue = jest.fn();
jest.mock("@/lib/source/intake/servicenow-sourcing-request-repository", () => ({
  readSourceIntakeRequestQueue: (...args: unknown[]) =>
    readSourceIntakeRequestQueue(...args),
}));

const redirect = jest.fn((href: string) => {
  throw new Error(`NEXT_REDIRECT:${href}`);
});
jest.mock("next/navigation", () => ({
  redirect: (href: string) => redirect(href),
  notFound: jest.fn(),
}));

/** The intake surfaces are stubs: the subject is which identity reaches them. */
let requestFirstProps: Record<string, unknown> = {};
jest.mock("@/components/source/new-workspace/SourceNewRequestFirstPage", () => ({
  SourceNewRequestFirstPage: (props: Record<string, unknown>) => {
    requestFirstProps = props;
    return <div data-testid="source-request-first">{String(props.clientName)}</div>;
  },
}));

let originateProps: Record<string, unknown> = {};
jest.mock("@/components/source/SourceOriginatePage", () => ({
  SourceOriginatePage: (props: Record<string, unknown>) => {
    originateProps = props;
    return <div data-testid="source-originate">{String(props.clientName)}</div>;
  },
}));

import SourceNewPage from "../new/page";
import SourcePortfolioRoute from "../portfolio/page";

async function renderIntake(
  searchParams: Record<string, string> = {},
): Promise<void> {
  requestFirstProps = {};
  originateProps = {};
  render(await SourceNewPage({ searchParams: Promise.resolve(searchParams) }));
}

/** Runs the redirect-only route and returns the href it redirected to. */
async function redirectHrefFor(
  searchParams: Record<string, string>,
): Promise<string> {
  try {
    await SourcePortfolioRoute({ searchParams: Promise.resolve(searchParams) });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.startsWith("NEXT_REDIRECT:")) {
      return message.slice("NEXT_REDIRECT:".length);
    }
    throw error;
  }
  throw new Error("the retired portfolio route returned without redirecting");
}

describe("Source tenant identity binding", () => {
  beforeEach(() => {
    listSourcingEvents.mockResolvedValue([]);
    readSourceIntakeRequestQueue.mockResolvedValue({
      registryAvailable: true,
      requests: [],
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("takes visible Source intake identity from the canonical resolver, not the legacy active-client row", async () => {
    // The two disagree on purpose. A page still reading `@/lib/active-client`
    // for identity renders "Northstar Logistics" and fails here; no assertion
    // about an import statement is needed, or possible to fake.
    resolveTenant.mockResolvedValue({
      appClientKey: "meridian",
      displayName: "Meridian Health",
    });
    getActiveClientRow.mockResolvedValue({
      key: "northstar",
      name: "Northstar Logistics",
    });

    await renderIntake();

    expect(screen.getByTestId("source-request-first").textContent).toBe(
      "Meridian Health",
    );
    expect(requestFirstProps.clientKey).toBe("meridian");
    expect(getActiveClientRow).not.toHaveBeenCalled();
  });

  it("shows the resolver's own display name for a tenant the canonicaliser does not rewrite", async () => {
    /*
     * The case above pins the *key*, not the name: `canonicalClientDisplayName`
     * maps `key === "meridian"` to its canonical name regardless of what name
     * it was handed, so replacing `tenant?.displayName` with any literal still
     * renders "Meridian Health" there. Measured, not assumed -- that exact
     * mutation escaped the first version of this suite. A key the canonicaliser
     * has no rule for falls through to `if (name) return name`, which is the
     * only arrangement in which the resolver's name is observable.
     */
    resolveTenant.mockResolvedValue({
      appClientKey: "tenant-under-test",
      displayName: "Harbor Point Logistics",
    });

    await renderIntake();

    expect(screen.getByTestId("source-request-first").textContent).toBe(
      "Harbor Point Logistics",
    );
  });

  it("reports an unresolved tenant as unauthorized rather than serving another account's queue", async () => {
    resolveTenant.mockResolvedValue(null);

    await renderIntake();

    expect(requestFirstProps.requestQueueStatus).toBe("unauthorized");
    expect(requestFirstProps.importedRequests).toEqual([]);
    expect(requestFirstProps.eventWorkspaces).toEqual([]);
    // The queue read must not be attempted at all without a tenant.
    expect(listSourcingEvents).not.toHaveBeenCalled();
    expect(readSourceIntakeRequestQueue).not.toHaveBeenCalled();
  });

  it("carries the resolved tenant into the intake surface too", async () => {
    resolveTenant.mockResolvedValue({
      appClientKey: "meridian",
      displayName: "Meridian Health",
    });

    await renderIntake({ mode: "intake" });

    expect(screen.getByTestId("source-originate").textContent).toBe(
      "Meridian Health",
    );
    expect(originateProps.clientKey).toBe("meridian");
  });

  it("archives the legacy portfolio route onto the governed workspace, forwarding only governed params", async () => {
    expect(
      await redirectHrefFor({
        client: "meridian",
        sourceProvider: "ecl_projection_db",
        contractId: "MER-CTR-SSO-BPO-001",
        contractTab: "Optimize",
      }),
    ).toBe(
      "/source?client=meridian&sourceProvider=ecl_projection_db&contractId=MER-CTR-SSO-BPO-001&contractTab=Optimize",
    );
  });

  it("redirects a bare legacy portfolio link to /source with no query at all", async () => {
    expect(await redirectHrefFor({})).toBe("/source");
    // An unknown param must not be forwarded: the retired book's own params
    // addressed a read model that no longer exists.
    expect(await redirectHrefFor({ book: "portfolio" })).toBe("/source");
  });

  it("mounts /source and /source/360 on the one governed workspace module", async () => {
    const workspace = await import("../workspace/page");
    const canonical = await import("../page");
    const source360 = await import("../360/page");

    // Identity, not a string: a route that re-declared its own page component
    // would fail here even if its source still read `export default
    // SourceWorkspacePage`.
    expect(canonical.default).toBe(workspace.default);
    expect(source360.default).toBe(workspace.default);
    expect(canonical.metadata.title).toBe("Source · AbarVa");
    expect(source360.metadata.title).toBe("Source 360 · AbarVa");
    expect(canonical.dynamic).toBe("force-dynamic");
    expect(source360.dynamic).toBe("force-dynamic");
  });
});

describe("Source workspace loading shell", () => {
  it("names the surface and opens on the live command-center navigation", async () => {
    const { SourceWorkspaceLoadingShell } = await import(
      "../workspace/SourceWorkspaceLoadingShell"
    );

    render(<SourceWorkspaceLoadingShell />);

    expect(
      screen.getByRole("region", { name: "Source 360 is preparing" }),
    ).toBeTruthy();
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Opening Source command center.",
      }),
    ).toBeTruthy();

    // `getAllByText`, not `getByText`: "Evidence" is also one of the three
    // skeleton cards below the tabs, so the nav label is not unique on screen.
    for (const label of ["Command", "Contracts", "Levers", "Evidence", "Coverage"]) {
      expect(screen.getAllByText(label).length).toBeGreaterThan(0);
    }
    // The retired tab set. A loading shell that paints the old navigation and
    // is replaced a beat later by the new one is a visible flicker, which is
    // what #7559 and #7622 were fixing.
    for (const retired of ["Verdict", "Vendors", "Optimize", "Contract graph"]) {
      expect(screen.queryByText(retired)).toBeNull();
    }
    // Two application navigations on one screen was the defect behind #7564.
    expect(
      screen.queryByRole("navigation", { name: "Main application navigation" }),
    ).toBeNull();
  });

  it("opens a deep link on the contract it was given, not on the portfolio", async () => {
    const { SourceWorkspaceLoadingShell } = await import(
      "../workspace/SourceWorkspaceLoadingShell"
    );

    render(<SourceWorkspaceLoadingShell contractId="MER-CTR-SSO-BPO-001" />);

    expect(
      screen.getByRole("heading", { level: 1, name: "Opening Contract 360." }),
    ).toBeTruthy();
    expect(
      screen.queryByRole("heading", {
        level: 1,
        name: "Opening Source command center.",
      }),
    ).toBeNull();
    // The contract being restored is named while it loads, so a slow deep link
    // does not look like the wrong page opening.
    expect(
      screen.getByText(/MER-CTR-SSO-BPO-001/),
    ).toBeTruthy();
  });

  it("treats a blank contract id as no deep link", async () => {
    const { SourceWorkspaceLoadingShell } = await import(
      "../workspace/SourceWorkspaceLoadingShell"
    );

    render(<SourceWorkspaceLoadingShell contractId="   " />);

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Opening Source command center.",
      }),
    ).toBeTruthy();
  });
});
