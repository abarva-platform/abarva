/**
 * @jest-environment jsdom
 */

// Visual harness — NOT an assertion suite.
//
// Renders every tab and sub-view of the Command Center against the design
// fixture and writes standalone HTML files, so the transcription can be opened
// in a browser side-by-side with
// `docs/design/tower/command-center-2026-07-23/tower-command-center-design.html`.
//
// This is how the pixel contract gets checked without a database or a signed-in
// session: the page renders from the fixture through the real view-model, so
// what you see is the shipped component tree, not a mock of it.
//
// Output goes to `TCC_HARNESS_OUT` (default: a scratch dir). It writes nothing
// into `proof/` — that directory is reserved for live signed-in evidence.
//
// Run: TCC_HARNESS_OUT=/some/dir npx jest render-harness

import fs from "node:fs";
import path from "node:path";

import { fireEvent, render, screen } from "@testing-library/react";

import { designFixtureMart } from "@/lib/tower/command-center/__fixtures__/design-fixture";
import { buildTowerCommandCenterView } from "@/lib/tower/command-center/view-model";

import { TowerCommandCenter } from "../TowerCommandCenter";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace: () => undefined }),
  usePathname: () => "/tower/command",
  useSearchParams: () => new URLSearchParams(),
}));

// jsdom reports 0x0, so ResponsiveContainer would render nothing. Fix a size
// approximating the real flex slot — in the shipped page the container fills
// its parent, so exact chart height in these snapshots is a harness artifact.
jest.mock("recharts", () => {
  const actual = jest.requireActual("recharts");
  return {
    ...actual,
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
      <actual.ResponsiveContainer width={900} height={230}>
        {children}
      </actual.ResponsiveContainer>
    ),
  };
});

const OUT_DIR = process.env.TCC_HARNESS_OUT ?? "";
const COMPONENT_DIR = path.join(
  process.cwd(),
  "src/components/tower/command-center",
);
const TOKENS = path.join(
  process.cwd(),
  "docs/design/strategic-moves/tokens.css",
);
const MODULE_CSS = path.join(COMPONENT_DIR, "TowerCommandCenter.module.css");

/**
 * Under next/jest, `styles.foo` resolves to the literal string "foo", so the
 * module CSS can be inlined unchanged and its selectors match the rendered
 * markup exactly.
 */
function page(title: string, body: string): string {
  const tokens = fs.readFileSync(TOKENS, "utf8");
  const moduleCss = fs.readFileSync(MODULE_CSS, "utf8");
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>${title}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;600;700&display=swap" rel="stylesheet">
<style>${tokens}</style>
<style>
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  html,body{height:100%}
  body{font-family:var(--abarva-sans);overflow:hidden}
  /* Stands in for AppShell: a fixed-viewport flex column. The page itself
     never asserts 100vh — that is the whole point of the shell contract. */
  #shell{height:100vh;display:flex;flex-direction:column;overflow:hidden}
</style>
<style>${moduleCss}</style>
</head><body><div id="shell">${body}</div></body></html>`;
}

const view = buildTowerCommandCenterView(designFixtureMart(), {
  tenantName: "Fixture Tenant",
});

function dump(name: string) {
  if (!OUT_DIR) return;
  const root = document.querySelector('[data-testid="tower-command-center"]');
  if (!root) throw new Error(`no root for ${name}`);
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(
    path.join(OUT_DIR, `${name}.html`),
    page(name, root.outerHTML),
    "utf8",
  );
}

describe("Command Center render harness", () => {
  beforeEach(() => {
    render(
      <TowerCommandCenter
        view={view}
        tenantName="Fixture Tenant"
        refreshedOn="2026-07-23"
      />,
    );
  });

  it("writes every tab and sub-view", () => {
    dump("01-command-center");

    fireEvent.click(screen.getByRole("tab", { name: /Value Proof/ }));
    dump("02-value-proof");

    fireEvent.click(screen.getByRole("tab", { name: /Decision Lanes/ }));
    dump("03-decision-lanes-overview");
    fireEvent.click(screen.getByRole("radio", { name: "Program table" }));
    dump("03b-decision-lanes-table");
    fireEvent.click(screen.getByRole("radio", { name: "Kanban lanes" }));
    dump("03c-decision-lanes-kanban");
    fireEvent.click(screen.getByRole("radio", { name: "Portfolio heatmap" }));
    dump("03d-decision-lanes-heatmap");

    fireEvent.click(screen.getByRole("tab", { name: /AI Portfolio/ }));
    dump("04-ai-integrated");
    fireEvent.click(screen.getByRole("radio", { name: "Usage & Value Proof" }));
    dump("04b-ai-bubble");
    fireEvent.click(screen.getByRole("radio", { name: "Spend Attribution" }));
    dump("04c-ai-lens");
    fireEvent.click(screen.getByRole("radio", { name: "Candidate Pipeline" }));
    dump("04d-ai-table");
    fireEvent.click(
      screen.getByRole("radio", { name: "Capability inventory" }),
    );
    dump("04e-ai-capability-inventory");

    fireEvent.click(screen.getByRole("tab", { name: /Evidence/ }));
    dump("05-evidence");

    fireEvent.click(screen.getByRole("tab", { name: /Recommended Actions/ }));
    dump("06-recommended-actions");

    expect(true).toBe(true);
  });

  it("writes every drawer", () => {
    fireEvent.click(screen.getByRole("tab", { name: /Decision Lanes/ }));
    fireEvent.click(screen.getByRole("radio", { name: "Program table" }));
    fireEvent.click(screen.getAllByRole("button", { name: /^Open / })[0]);
    dump("07-drawer-program");
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });

    // The AI drawer opens from the numbered initiative list under
    // "Usage & Value Proof"; "Candidate Pipeline" lists unfunded candidates,
    // which are not openable.
    fireEvent.click(screen.getByRole("tab", { name: /AI Portfolio/ }));
    fireEvent.click(screen.getByRole("radio", { name: "Usage & Value Proof" }));
    fireEvent.click(
      screen.getAllByRole("button", { name: /Fraud Graph Analytics v2/ })[0],
    );
    dump("08-drawer-ai");
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });

    fireEvent.click(screen.getByRole("tab", { name: /Evidence/ }));
    fireEvent.click(screen.getByRole("radio", { name: /What is missing/ }));
    fireEvent.click(screen.getAllByText("View audit trace →")[0]);
    dump("09-drawer-gap");
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });

    fireEvent.click(screen.getByRole("tab", { name: /Recommended Actions/ }));
    fireEvent.click(
      screen.getByRole("button", { name: "View priority action inventory" }),
    );
    fireEvent.click(screen.getAllByText(/Attest the avoidance method/)[0]);
    dump("10-drawer-action");

    expect(true).toBe(true);
  });
});
