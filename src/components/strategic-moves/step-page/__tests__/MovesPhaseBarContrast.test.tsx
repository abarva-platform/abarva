/** @jest-environment jsdom */

import fs from "node:fs";
import path from "node:path";
import { parse } from "postcss";
import { render, screen, within } from "@testing-library/react";
import { resolveStepNextAction } from "@/lib/programs/step-page-model";
import { MovesStepPage } from "../MovesStepPage";

const css = fs.readFileSync(
  path.resolve(process.cwd(), "src/components/strategic-moves/step-page/MovesStepPage.module.css"),
  "utf8",
);

function rule(selector: string): string {
  let body: string | undefined;
  parse(css).walkRules((entry) => {
    if (body || !entry.selectors.includes(selector)) return;
    const declarations: string[] = [];
    entry.walkDecls((declaration) => {
      declarations.push(`${declaration.prop}: ${declaration.value};`);
    });
    body = declarations.join("\n");
  });
  if (!body) throw new Error(`Missing CSS rule: ${selector}`);
  return body;
}

function token(body: string, name: string): string {
  const color = body.match(new RegExp(`--mv-${name}: (#[0-9a-f]{6});`, "i"))?.[1];
  if (!color) throw new Error(`Missing color token: ${name}`);
  return color;
}

function contrast(foreground: string, background: string): number {
  const luminance = (hex: string) => {
    const components = [1, 3, 5].map((index) =>
      Number.parseInt(hex.slice(index, index + 2), 16) / 255,
    );
    const linear = components.map((value) =>
      value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4,
    );
    return linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722;
  };
  const a = luminance(foreground);
  const b = luminance(background);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

describe("Moves phase bar contrast", () => {
  it("keeps small phase labels at WCAG AA contrast in both themes", () => {
    const mutedLabels = [rule(".phase-tab .code"), rule(".phase-tab .count")];
    for (const label of mutedLabels) {
      expect(label).toMatch(/color:\s*var\(--mv-muted\)/);
      expect(label).not.toMatch(/\bopacity\s*:/);
    }
    expect(css).toMatch(
      /\.phase-tab\[aria-current="page"\] \.code,\s*\.phase-tab\[aria-current="page"\] \.count\s*\{\s*color:\s*var\(--mv-current-ink\)/,
    );

    for (const theme of [rule(".root"), rule('.root[data-theme="dark"]')]) {
      expect(contrast(token(theme, "muted"), token(theme, "surface"))).toBeGreaterThanOrEqual(4.5);
      expect(contrast(token(theme, "current-ink"), token(theme, "current-bg"))).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("renders active and inactive status labels on the real step page", () => {
    render(
      <MovesStepPage
        moveName="Governed data foundation"
        clientDisplayName="Demo tenant"
        phases={[
          { code: "P1", name: "Charter", status: "Done", href: "#charter" },
          { code: "P2", name: "Discover", status: "Done · 1 to confirm", current: true },
          { code: "P3", name: "Design", status: "Not started", href: "#design" },
        ]}
        phaseCode="P2"
        phaseName="Discover"
        steps={[{ title: "Root causes", depth: "full" }]}
        stepIndex={0}
        title="Rank what’s causing the gap"
        intro="Review the cause and its evidence."
        nextAction={resolveStepNextAction({
          depth: "full",
          rows: [],
          readySentence: "Continue to Design",
          emptySentence: "Add the cause and its evidence",
        })}
        context={{ items: ["Full depth"], details: [] }}
        rows={[]}
      />,
    );
    const phases = screen.getByRole("navigation", { name: "Phases" });
    expect(within(phases).getByText("Done · 1 to confirm").closest('[aria-current="page"]')).not.toBeNull();
    expect(within(phases).getByRole("link", { name: /Charter Done/ })).not.toBeNull();
    expect(within(phases).getByRole("link", { name: /Design Not started/ })).not.toBeNull();
  });
});
