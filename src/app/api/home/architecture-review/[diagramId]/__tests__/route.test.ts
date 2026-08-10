import { readFileSync } from "node:fs";
import path from "node:path";

import { HOME_CLAUDE_REVIEW_SVG_ASSETS } from "@/lib/home/claude-architecture-review-svg-assets";

import { GET } from "../route";

const RETAINED_REPORT_SVG_DIR = path.join(
  process.cwd(),
  "reports/home-claude-architecture-generation/generated-svg",
);

const RETAINED_REPORT_FILES: Record<
  keyof typeof HOME_CLAUDE_REVIEW_SVG_ASSETS,
  string
> = {
  "patterns-enterprise-operating-system":
    "patterns-enterprise-operating-system.svg",
  "economics-value-control": "economics-value-control.svg",
  "posture-evidence-authority": "posture-evidence-authority.svg",
  "coherence-domain-architecture-index": "coherence-domain-architecture-index.svg",
  "trajectory-executive-shifts": "trajectory-executive-shifts.svg",
};

it("serves allowlisted Claude architecture review SVGs", async () => {
  const response = await GET(new Request("http://localhost"), {
    params: Promise.resolve({
      diagramId: "patterns-enterprise-operating-system",
    }),
  });

  expect(response.status).toBe(200);
  expect(response.headers.get("content-type")).toBe(
    "image/svg+xml; charset=utf-8",
  );
  expect(response.headers.get("x-home-review-only")).toBe("true");
  expect(await response.text()).toContain("<svg");
});

it("keeps bundled review SVGs identical to retained Claude report outputs", () => {
  for (const [diagramId, svg] of Object.entries(
    HOME_CLAUDE_REVIEW_SVG_ASSETS,
  ) as Array<[keyof typeof HOME_CLAUDE_REVIEW_SVG_ASSETS, string]>) {
    const retained = readFileSync(
      path.join(RETAINED_REPORT_SVG_DIR, RETAINED_REPORT_FILES[diagramId]),
      "utf8",
    );

    expect(svg).toBe(retained);
  }
});

it("rejects non-allowlisted Claude architecture review SVGs", async () => {
  const response = await GET(new Request("http://localhost"), {
    params: Promise.resolve({
      diagramId: "../approved-content",
    }),
  });

  expect(response.status).toBe(404);
  await expect(response.json()).resolves.toMatchObject({
    error: "not_found",
  });
});
