import fs from "node:fs";
import path from "node:path";

const source = fs.readFileSync(
  path.join(process.cwd(), "src/components/shell/AtlasDrawer.tsx"),
  "utf8",
);

const actionApprovalNoticeSource = fs.readFileSync(
  path.join(process.cwd(), "src/components/agent/AgentActionApprovalNotice.tsx"),
  "utf8",
);

describe("AtlasDrawer · composer continuity", () => {
  it("keeps newest turns directly under top composers", () => {
    expect(source).toMatch(
      /const latestFirst = composerPlacement === ["']afterHeader["']/,
    );
    expect(source).toContain("? [...visibleConversation].reverse()");
    expect(source).toContain(
      "scroller.scrollTop = latestFirst ? 0 : scroller.scrollHeight",
    );
  });

  it("enables browser writing assists on the prompt textarea", () => {
    expect(source).toContain("spellCheck");
    expect(source).toContain('autoCorrect="on"');
    expect(source).toContain('autoCapitalize="sentences"');
  });

  it("renders the shared AI responsibility footer inside the input bar", () => {
    expect(source).toContain("AIResponsibilityFooter");
    expect(source).toContain('tone="dark"');
  });

  it("renders the shared in-chat action approval boundary", () => {
    expect(source).toContain("AgentActionApprovalNotice");
    expect(source).toContain('tone="dark"');
    expect(actionApprovalNoticeSource).toContain(
      "Human approval required for agent actions",
    );
  });
});
