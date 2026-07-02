import { getHomeV6ContextBrowser } from "@/lib/home/v6-context-browser";
import { buildHomeV6ContextFindings } from "@/lib/home/v6/home-v6-context-findings";

const REQUIRED_FIELDS = [
  "supportingDimensions",
  "sourceFiles",
  "sourceRowCount",
  "evidenceRefs",
  "evidenceGaps",
  "confidence",
  "claimBasis",
  "patternContextUsed",
  "recommendedSurface",
  "recommendedQuestion",
] as const;

describe("Home V6 context findings", () => {
  it.each([
    ["Airline Demo", "skyharbor"],
    ["Lakeshore Holdings", "lakeshore"],
  ])("builds four V6-backed context findings for %s", (_label, tenantKey) => {
    const browser = getHomeV6ContextBrowser(tenantKey);

    const findings = buildHomeV6ContextFindings(browser);

    expect(findings).toHaveLength(4);
    for (const finding of findings) {
      for (const field of REQUIRED_FIELDS) {
        expect(finding[field]).toBeDefined();
      }
      expect(finding.supportingDimensions.length).toBeGreaterThan(0);
      expect(finding.sourceFiles.length).toBeGreaterThan(0);
      expect(finding.sourceFiles.every((file) => file.startsWith("V6_"))).toBe(
        true,
      );
      expect(finding.sourceRowCount).toBeGreaterThan(0);
      expect(finding.evidenceRefs.length).toBeGreaterThan(0);
      expect(
        finding.evidenceRefs.every((ref) => ref.v6File.startsWith("V6_")),
      ).toBe(true);
      expect(finding.recommendedQuestion).not.toMatch(/\.csv|datasets\/|Row:/i);
    }
  });

  it("labels pattern context without treating it as tenant proof", () => {
    const browser = getHomeV6ContextBrowser("skyharbor");

    const findings = buildHomeV6ContextFindings(browser);
    const patternFindings = findings.filter(
      (finding) => finding.patternContextUsed,
    );

    expect(patternFindings.length).toBeGreaterThan(0);
    expect(
      patternFindings.every((finding) =>
        ["mixed", "industry_pattern"].includes(finding.claimBasis),
      ),
    ).toBe(true);
  });

  it("does not reuse the legacy top-four Home signal headlines", () => {
    const legacyHeadlines = [
      "Data volume is not the blocker; governed real-time operating data products are.",
      "Teradata/SAS/BI rationalization is a modernization move, not just a cost takeout.",
      "Mainframe-adjacent feeds still determine how fast digital and AI can move.",
      "Customer AI scale needs CDP and identity governance first.",
      "Kyriba go-live is a control-evidence question, not just a project milestone.",
      "ERP/AP/AR/GL feed quality is the largest treasury value risk.",
      "Liquidity forecasting needs certified finance data products.",
      "Finance AI needs close/reporting evidence before it becomes board-ready.",
    ];
    const browsers = [
      getHomeV6ContextBrowser("skyharbor"),
      getHomeV6ContextBrowser("lakeshore"),
    ];

    const visibleFindingText = browsers
      .flatMap((browser) => buildHomeV6ContextFindings(browser))
      .flatMap((finding) => [
        finding.title,
        finding.executiveFinding,
        finding.whyItMatters,
      ]);

    for (const legacyHeadline of legacyHeadlines) {
      expect(visibleFindingText).not.toContain(legacyHeadline);
    }
  });
});
