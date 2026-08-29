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
// approximating a half-canvas BI card; in the shipped page the browser gives
// each chart its true flex/card width.
jest.mock("recharts", () => {
  const actual = jest.requireActual("recharts");
  return {
    ...actual,
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
      <actual.ResponsiveContainer width={860} height={360}>
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
})!;

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
      />,
    );
  });

  it("writes every executive contract tab", () => {
    dump("01-executive-view");

    fireEvent.click(screen.getByRole("tab", { name: /AI bets/ }));
    fireEvent.click(screen.getByRole("tab", { name: /Value proof/ }));
    dump("02-value-proof");

    fireEvent.click(screen.getByRole("tab", { name: /Tools/ }));
    fireEvent.click(screen.getByRole("tab", { name: /AI portfolio/ }));
    dump("03-ai-portfolio");

    fireEvent.click(screen.getByRole("tab", { name: /What must happen next/ }));
    fireEvent.click(screen.getByRole("tab", { name: /Evidence queue/ }));
    dump("04-evidence-actions");

    expect(true).toBe(true);
  });

  it("writes every drawer", () => {
    fireEvent.click(screen.getByRole("tab", { name: /AI bets/ }));
    fireEvent.click(screen.getByRole("tab", { name: /Value proof/ }));
    fireEvent.click(screen.getByText("Risk & Compliance AI"));
    dump("07-drawer-program");
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });

    fireEvent.click(screen.getByRole("tab", { name: /Tools/ }));
    fireEvent.click(screen.getByRole("tab", { name: /AI portfolio/ }));
    fireEvent.click(
      screen
        .getAllByRole("button")
        .find((button) => button.textContent?.includes("exposed at review"))!,
    );
    dump("08-drawer-ai");
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });

    fireEvent.click(screen.getByRole("tab", { name: /What must happen next/ }));
    fireEvent.click(screen.getByRole("tab", { name: /Evidence queue/ }));
    const firstGap = [...view.gaps].sort(
      (a, b) => (b.valueAtStakeUsd ?? 0) - (a.valueAtStakeUsd ?? 0),
    )[0]!;
    fireEvent.click(
      screen
        .getAllByRole("button")
        .find((button) => button.textContent?.includes(firstGap.missing))!,
    );
    dump("09-drawer-gap");
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });

    fireEvent.click(screen.getByRole("button", { name: /Usage telemetry connection/ }));
    dump("10-drawer-action");

    expect(true).toBe(true);
  });
});
