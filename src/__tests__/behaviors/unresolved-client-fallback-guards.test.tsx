/**
 * @jest-environment jsdom
 */

/**
 * U-512 · surfaces that must not name an account they have not resolved.
 *
 * `canonicalClientDisplayName` ends by resolving anything it does not
 * recognise through `getClientOption`, which answers the DEFAULT_CLIENT_KEY
 * option rather than `undefined`. So it never returns `null`, and every
 * `canonicalClientDisplayName(...) ?? <fallback>` in the tree is dead. There
 * are 40 such call sites across 36 files; the classification of all of them is
 * `docs/governance/unresolved-client-fallback-classification.md`.
 *
 * Most are surfaces the reader is already inside, where the default account is
 * the established answer and the dead `??` is only noise. These four are not:
 * each one either refuses, guards, or tells a reader (or a model) which tenant
 * it is talking about, and each one already carries a neutral literal saying
 * what its author meant to happen when nothing resolves. This suite renders
 * them with the tenant unresolved, because the defect was never visible in the
 * call site -- only in what reached the reader.
 *
 * The fourth repaired surface is `/api/chat/agent`, which is not rendered and
 * cannot load under jsdom; it has its own node-environment case in
 * `agent-turn-unresolved-tenant-name.test.ts`.
 */
import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";

jest.mock("server-only", () => ({}));

/**
 * What every one of these surfaces renders today when nothing resolves: the
 * display name of the DEFAULT_CLIENT_KEY option. Imported rather than typed so
 * the case keeps meaning if the default account is ever changed.
 */
import {
  DEFAULT_CLIENT_KEY,
  getClientOption,
} from "@/lib/client-config";

const DEFAULT_ACCOUNT_NAME = getClientOption(DEFAULT_CLIENT_KEY).name;

/** A key that reads successfully and resolves to no registered client. */
const UNREGISTERED_KEY = "not-a-registered-tenant";

// ---------------------------------------------------------------------------
// 1 · Home's record-not-served surface
// ---------------------------------------------------------------------------

import { HomeRecordNotServed } from "@/components/home/v4/HomeRecordNotServed";

describe("Home · governed record not served", () => {
  it("names no account when the tenant key resolves to nothing", () => {
    render(<HomeRecordNotServed tenantKey={UNREGISTERED_KEY} />);

    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading.textContent).toContain("this client");
    expect(heading.textContent).not.toContain(DEFAULT_ACCOUNT_NAME);
  });

  it("names no account when the tenant key is empty", () => {
    render(<HomeRecordNotServed tenantKey="" />);

    expect(screen.getByRole("heading", { level: 1 }).textContent).not.toContain(
      DEFAULT_ACCOUNT_NAME,
    );
  });

  it("still names a registered client, so the repair is not a blanket mute", () => {
    render(<HomeRecordNotServed tenantKey="meridian" />);

    expect(screen.getByRole("heading", { level: 1 }).textContent).toContain(
      "Meridian Health",
    );
  });
});

// ---------------------------------------------------------------------------
// 2 · /admin/cross-program-signals
// ---------------------------------------------------------------------------

const getActiveClientKey = jest.fn();
jest.mock("@/lib/active-client", () => ({
  getActiveClientKey: (...args: unknown[]) => getActiveClientKey(...args),
  getActiveClientRow: (...args: unknown[]) => getActiveClientRow(...args),
}));

jest.mock("@/lib/agent/tools/intelligence/_shared", () => ({
  clientKeyToInventorySubstrateKey: (key: string) => key,
}));
jest.mock("@/lib/admin/setup-data-broker", () => ({
  getCrossProgramSignals: async () => [],
}));
jest.mock("@/lib/admin/setup-acts-registry", () => ({
  resolveSegmentRef: () => undefined,
}));

let adminShellProps: Record<string, unknown> = {};
jest.mock("@/components/admin/AdminCanonShellV2", () => ({
  AdminCanonShellV2: ({
    children,
    ...rest
  }: {
    children: ReactNode;
  }) => {
    adminShellProps = rest as Record<string, unknown>;
    return <div>{children}</div>;
  },
}));
jest.mock("@/components/admin/AgentRail", () => ({
  AgentRail: () => <div />,
}));

let signalsPanelProps: Record<string, unknown> = {};
jest.mock("@/components/admin/setup/CrossProgramSignalsPanel", () => ({
  CrossProgramSignalsPanel: (props: Record<string, unknown>) => {
    signalsPanelProps = props;
    return <div data-testid="signals-panel" />;
  },
}));

import CrossProgramSignalsPage from "@/app/(maestro)/admin/cross-program-signals/page";

describe("Admin · cross-program signals", () => {
  beforeEach(() => {
    adminShellProps = {};
    signalsPanelProps = {};
    jest.clearAllMocks();
  });

  it("names no tenant when the resolved key is not a registered client", async () => {
    // The page's outer ternary already handles a *failed* read. This is the
    // case it cannot see: a read that succeeds and returns a key naming no
    // registered client. `getActiveClientKey` is declared to return a
    // `ClientKey`, so today that is a type the runtime does not enforce --
    // which is exactly why the neutral literal below has to be reachable.
    getActiveClientKey.mockResolvedValue(UNREGISTERED_KEY);

    render(await CrossProgramSignalsPage());

    expect(adminShellProps.tenantName).toBe("Your tenant");
    expect(signalsPanelProps.tenantDisplayName).toBe("Your tenant");
  });

  it("still names a registered client", async () => {
    getActiveClientKey.mockResolvedValue("meridian");

    render(await CrossProgramSignalsPage());

    expect(adminShellProps.tenantName).toBe("Meridian Health");
  });

  it("keeps naming no tenant when the key read fails outright", async () => {
    getActiveClientKey.mockRejectedValue(new Error("tenant read failed"));

    render(await CrossProgramSignalsPage());

    expect(adminShellProps.tenantName).toBe("Your tenant");
  });
});

// ---------------------------------------------------------------------------
// 3 · Source Setup configuration
// ---------------------------------------------------------------------------

const getActiveClientRow = jest.fn();

jest.mock("@/lib/features/is-feature-enabled", () => ({
  isFeatureEnabled: () => true,
}));

let setupConfigProps: Record<string, unknown> = {};
jest.mock("@/components/source/setup/SourceSetupConfigPage", () => ({
  SourceSetupConfigPage: (props: Record<string, unknown>) => {
    setupConfigProps = props;
    return <div data-testid="source-setup-config" />;
  },
}));
jest.mock("@/components/shell/AppShell", () => ({
  AppShell: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));
jest.mock("@/components/source/SourceSubNav", () => ({
  SourceSubNav: () => <div />,
}));
// The flag-OFF branch of the Setup route imports the Source query layer, which
// pulls Clerk's ESM build into a CommonJS jest run. The branch under test is
// the flag-ON one; the module is stubbed so the import graph stays loadable.
jest.mock("@/lib/source", () => ({
  SOURCE_STAGE_ORDER: [],
  listSourceArtifactOperations: () => [],
  summarizeSourceArtifactOperations: () => ({}),
}));

import SourceSetupPage from "@/app/(maestro)/source/setup/page";

describe("Source Setup · configuration surface", () => {
  beforeEach(() => {
    setupConfigProps = {};
    jest.clearAllMocks();
  });

  it("names no tenant when the client row cannot be read", async () => {
    // The sentence this feeds reads "…who can approve gates for {tenantName}."
    // Naming the default account there tells a reader they are configuring
    // approvals for a tenant the request never resolved.
    getActiveClientRow.mockRejectedValue(new Error("tenant read failed"));

    render(await SourceSetupPage());

    expect(setupConfigProps.tenantName).toBe("your tenant");
  });

  it("names no tenant when the row carries an unregistered key and no name", async () => {
    getActiveClientRow.mockResolvedValue({ key: UNREGISTERED_KEY });

    render(await SourceSetupPage());

    expect(setupConfigProps.tenantName).toBe("your tenant");
  });

  it("still names a registered client", async () => {
    getActiveClientRow.mockResolvedValue({
      key: "meridian",
      name: "Meridian Health",
    });

    render(await SourceSetupPage());

    expect(setupConfigProps.tenantName).toBe("Meridian Health");
  });
});
