/** @jest-environment jsdom */

/**
 * Shell Layout Spec v2 — one chat entry point per surface, asserted by render.
 *
 * Replaces `src/__tests__/hygiene/shell-v2-mode-layout.test.ts` (item T-495,
 * claimable half), which asserted these rules over the BYTES of each surface
 * file. That suite could not fail in the direction that mattered:
 *
 *  - its "ProgramDetailPage imports AtlasDrawer" case passed on a code comment
 *    that names AtlasDrawer — the page renders it through AgentCanvas, and
 *    nothing checked that it still does;
 *  - it filtered its surface lists through `existsSync`, so a deleted surface
 *    (IntelligenceIndexPage) left the suite silently, with one fewer case;
 *  - it only knew AgentColumn and AskAnythingBar, so Tower's AgentDock — the
 *    chat most users see — was never counted.
 *
 * Here each surface mounted by a route is rendered with every chat-entry leaf
 * replaced by a sentinel, and the sentinels are counted. The leaves are the four
 * components that own a composer: AgentDock (AtlasChatPanel, StewardDockPane
 * and the Source docks all render it), AgentColumn (SentinelAgentColumn renders
 * it), AskAnythingBar, and AtlasDrawer. A new chat component that owns its own
 * composer would not be counted — add it to CHAT_ENTRY_LEAVES when it lands.
 *
 * The nav half of the old suite (Rule 5, NexusTopNav product nav default and
 * the product labels) is asserted by render in
 * `src/components/navigation/__tests__/NexusTopNav.test.tsx`, wired alongside
 * this change.
 */

import type { ComponentProps, ReactElement } from "react";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: jest.fn(), push: jest.fn(), replace: jest.fn() }),
  usePathname: () => "/programs/APX-01",
  useSearchParams: () => new URLSearchParams(),
}));

jest.mock("@/components/agent/AgentDock", () => ({
  ...jest.requireActual("@/components/agent/AgentDock"),
  AgentDock: () => <div data-chat-entry="AgentDock" />,
}));
jest.mock("@/components/shell/AgentColumn", () => ({
  ...jest.requireActual("@/components/shell/AgentColumn"),
  AgentColumn: () => <div data-chat-entry="AgentColumn" />,
}));
jest.mock("@/components/agent/AskAnythingBar", () => ({
  ...jest.requireActual("@/components/agent/AskAnythingBar"),
  AskAnythingBar: () => <div data-chat-entry="AskAnythingBar" />,
}));
jest.mock("@/components/shell/AtlasDrawer", () => ({
  ...jest.requireActual("@/components/shell/AtlasDrawer"),
  AtlasDrawer: ({ embedded }: { embedded?: boolean }) => (
    <div
      data-chat-entry={embedded ? "AtlasDrawer:embedded" : "AtlasDrawer:overlay"}
    />
  ),
}));
jest.mock("@/components/shell/RibbonSynthesis", () => ({
  RibbonSynthesis: () => <div data-testid="ribbon-synthesis" />,
}));
jest.mock("@/components/shell/AppRail", () => ({
  AppRail: () => <nav data-testid="legacy-app-rail" />,
}));
// Wrap, not replace: the real provider still supplies the Atlas context the
// surfaces read, and the wrapper makes each mount countable.
jest.mock("@/components/shell/AtlasPageStateProvider", () => {
  const actual = jest.requireActual<
    typeof import("@/components/shell/AtlasPageStateProvider")
  >("@/components/shell/AtlasPageStateProvider");
  return {
    ...actual,
    AtlasPageStateProvider: (
      props: ComponentProps<typeof actual.AtlasPageStateProvider>,
    ) => (
      <div data-atlas-page-state-provider="">
        <actual.AtlasPageStateProvider {...props} />
      </div>
    ),
  };
});
jest.mock("@/lib/admin/data/admin-audit-log-adapter", () => ({
  getAdminAuditEvents: jest.fn(async () => []),
}));

import { act, render, screen } from "@testing-library/react";
import { AppShell } from "@/components/shell/AppShell";
import { ToastProvider } from "@/components/shell/Toast";
import { ProgramDetailPage } from "@/components/programs/ProgramDetailPage";
import { ProgramsIndexPage } from "@/components/programs/ProgramsIndexPage";
import { SetupAuditPage } from "@/components/setup/SetupAuditPage";
import { SetupPoliciesPage } from "@/components/setup/SetupPoliciesPage";
import { TowerCommandCenterAvaShell } from "@/components/tower/command-center/TowerCommandCenterAvaShell";
import { buildProgramDetailView } from "@/lib/programs/programs-detail-view";
import { buildProgramsIndexView } from "@/lib/programs/programs-page-view";
import { designFixtureMart } from "@/lib/tower/command-center/__fixtures__/design-fixture";
import { buildTowerCommandCenterView } from "@/lib/tower/command-center/view-model";

function chatEntries(container: HTMLElement): string[] {
  return Array.from(container.querySelectorAll("[data-chat-entry]")).map(
    (node) => node.getAttribute("data-chat-entry") ?? "",
  );
}

function providerMounts(container: HTMLElement): number {
  return container.querySelectorAll("[data-atlas-page-state-provider]").length;
}

async function mount(element: ReactElement) {
  const result = render(element);
  // Surfaces fire background requests on mount; let them settle inside act.
  await act(async () => {});
  return result;
}

const originalFetch = global.fetch;

beforeEach(() => {
  global.fetch = jest.fn(async () => ({
    ok: true,
    status: 200,
    headers: new Headers(),
    json: async () => ({}),
    text: async () => "",
    body: {
      getReader: () => ({
        read: async () => ({ done: true, value: undefined }),
      }),
    },
  })) as unknown as typeof fetch;
});

afterEach(() => {
  global.fetch = originalFetch;
});

/**
 * Each surface a route mounts, with the chat entries it must render — exactly,
 * in order. An exact list refuses a second chat (Rule 1), the wrong kind of
 * chat for the mode (Rule 2), and a surface that lost its chat altogether.
 *
 * Not listed, deliberately: `SourceIndexPage`, which no route mounts (the old
 * suite guarded it anyway), and `IntelligenceIndexPage`, which is deleted.
 */
const SURFACES: Array<{
  name: string;
  route: string;
  mode: "A" | "B" | "admin";
  element: () => ReactElement | Promise<ReactElement>;
  chat: string[];
}> = [
  {
    name: "ProgramDetailPage",
    route: "/programs/[id]",
    mode: "B",
    element: () => (
      <ToastProvider>
        <ProgramDetailPage
          view={buildProgramDetailView("APX-01", 3)}
          initialNexusArtifacts={[]}
        />
      </ToastProvider>
    ),
    chat: ["AtlasDrawer:embedded"],
  },
  {
    name: "ProgramsIndexPage",
    route: "/programs",
    mode: "A",
    element: () => (
      <ToastProvider>
        <ProgramsIndexPage view={buildProgramsIndexView("meridian-health")} />
      </ToastProvider>
    ),
    chat: ["AtlasDrawer:embedded"],
  },
  {
    name: "TowerCommandCenterAvaShell",
    route: "/tower",
    mode: "A",
    element: () => (
      <TowerCommandCenterAvaShell
        view={
          buildTowerCommandCenterView(designFixtureMart(), {
            tenantName: "Meridian",
          })!
        }
        tenantName="Meridian"
        clientId="meridian"
        clientKey="meridian"
      />
    ),
    chat: ["AgentDock"],
  },
  {
    name: "SetupPoliciesPage",
    route: "/admin/policies",
    mode: "admin",
    element: () => <SetupPoliciesPage />,
    // Setup chat, where a route has one, belongs to AdminCanonShellV2 around
    // the page; the page itself must add none.
    chat: [],
  },
  {
    name: "SetupAuditPage",
    route: "/admin/audit",
    mode: "admin",
    element: async () =>
      await SetupAuditPage({ tenantSlug: "synthetic-tenant", filterSource: null }),
    chat: [],
  },
];

describe("Shell Layout Spec v2 — one chat entry point per surface (render)", () => {
  for (const surface of SURFACES) {
    it(`${surface.name} (${surface.route}) renders exactly ${JSON.stringify(surface.chat)}`, async () => {
      const { container } = await mount(await surface.element());
      expect(chatEntries(container)).toEqual(surface.chat);
    });

    it(`${surface.name} mounts at most one Atlas page-state provider`, async () => {
      const { container } = await mount(await surface.element());
      expect(providerMounts(container)).toBeLessThanOrEqual(1);
    });
  }

  it("no Mode A surface renders AskAnythingBar", async () => {
    for (const surface of SURFACES.filter((s) => s.mode === "A")) {
      const { container, unmount } = await mount(await surface.element());
      expect(chatEntries(container)).not.toContain("AskAnythingBar");
      unmount();
    }
  });
});

describe("Shell Layout Spec v2 — Mode B detail surface (render)", () => {
  it("ProgramDetailPage renders RibbonSynthesis and its chat embedded, not as an overlay", async () => {
    const { container } = await mount(
      <ToastProvider>
        <ProgramDetailPage
          view={buildProgramDetailView("APX-01", 3)}
          initialNexusArtifacts={[]}
        />
      </ToastProvider>,
    );

    expect(screen.getAllByTestId("ribbon-synthesis")).toHaveLength(1);
    expect(chatEntries(container)).toContain("AtlasDrawer:embedded");
    expect(chatEntries(container)).not.toContain("AtlasDrawer:overlay");
  });
});

describe("AppShell — owns the Atlas provider and keeps the legacy rail opt-in (render)", () => {
  it("mounts exactly one Atlas page-state provider around its children", async () => {
    const { container } = await mount(
      <AppShell surface="programs">
        <p>surface body</p>
      </AppShell>,
    );

    expect(providerMounts(container)).toBe(1);
    const provider = container.querySelector("[data-atlas-page-state-provider]");
    expect(provider?.textContent).toContain("surface body");
  });

  it("does not render the legacy AppRail by default", async () => {
    await mount(
      <AppShell surface="programs">
        <p>surface body</p>
      </AppShell>,
    );

    expect(screen.queryByTestId("legacy-app-rail")).toBeNull();
  });

  it("renders the legacy AppRail only when explicitly opted in", async () => {
    await mount(
      <AppShell surface="programs" showAppRail>
        <p>surface body</p>
      </AppShell>,
    );

    expect(screen.getAllByTestId("legacy-app-rail")).toHaveLength(1);
  });
});
