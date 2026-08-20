import {
  countBodyWords,
  countBodyWordsFromHtml,
  isAppendixHeading,
  stripNonProseMarkdown,
  type ProseSection,
} from "../body-word-count";
import { P3_P4_WORD_BAND_CONTRACTS } from "../artifact-contracts";

const PROSE = "one two three four five";

describe("isAppendixHeading", () => {
  it("recognises supporting-material headings, numbered or not", () => {
    for (const title of [
      "Appendix",
      "Appendix A — Detailed assumptions",
      "3. Appendices",
      "Annex 1",
      "Exhibits",
      "Source Register",
      "Evidence Register",
      "Glossary",
      "References",
    ]) {
      expect(isAppendixHeading(title)).toBe(true);
    }
  });

  it("does not swallow argument sections that merely mention evidence", () => {
    for (const title of [
      "Evidence and gaps",
      "Recommendation and asks",
      "Investment case",
      "What we are funding",
      "Appendix-free summary",
    ]) {
      expect(isAppendixHeading(title)).toBe(false);
    }
  });
});

describe("stripNonProseMarkdown", () => {
  it("removes markdown table rows including the alignment separator", () => {
    const md = [
      "Intro prose here.",
      "",
      "| Option | Cost |",
      "| --- | ---: |",
      "| Build | $1.2M |",
      "",
      "Closing prose here.",
    ].join("\n");
    const out = stripNonProseMarkdown(md);
    expect(out).not.toMatch(/Option|Build|1\.2M/);
    expect(out).toMatch(/Intro prose here/);
    expect(out).toMatch(/Closing prose here/);
  });

  it("removes fenced blocks, including an unterminated one at the end", () => {
    expect(stripNonProseMarkdown("a\n```\nsecret code\n```\nb")).not.toMatch(
      /secret code/,
    );
    expect(stripNonProseMarkdown("a\n```\ndangling forever")).not.toMatch(
      /dangling/,
    );
    expect(stripNonProseMarkdown("a\n~~~\ntilde block\n~~~\nb")).not.toMatch(
      /tilde block/,
    );
  });

  it("removes inline HTML tables and SVG whole", () => {
    expect(
      stripNonProseMarkdown(
        "before <table><tr><td>cell text</td></tr></table> after",
      ),
    ).not.toMatch(/cell text/);
    expect(
      stripNonProseMarkdown("before <svg><text>label text</text></svg> after"),
    ).not.toMatch(/label text/);
  });

  it("keeps the text content of ordinary inline tags", () => {
    expect(stripNonProseMarkdown("a <strong>kept</strong> b")).toMatch(/kept/);
  });
});

describe("countBodyWords", () => {
  const sections: ProseSection[] = [
    { title: "Investment case", bodyMarkdown: PROSE },
    {
      title: "Options",
      bodyMarkdown: `${PROSE}\n\n| A | B |\n| --- | --- |\n| 1 | 2 |`,
    },
    { title: "Appendix A", bodyMarkdown: "nine ten eleven twelve" },
  ];

  it("reproduces the legacy whole-body count exactly when the flag is off", () => {
    const legacy = (
      sections
        .map((s) => `${s.title}\n${s.bodyMarkdown}`)
        .join("\n\n")
        .trim()
        .match(/\S+/g) ?? []
    ).length;
    expect(countBodyWords(sections, { excludeNonProse: false })).toBe(legacy);
  });

  it("excludes tables, appendices and section titles when the flag is on", () => {
    // Two argument sections × 5 prose words each. The table rows, the appendix
    // section, and every section title are all excluded.
    expect(countBodyWords(sections, { excludeNonProse: true })).toBe(10);
  });

  it("counts fewer words with the flag on than off, for the same document", () => {
    expect(countBodyWords(sections, { excludeNonProse: true })).toBeLessThan(
      countBodyWords(sections, { excludeNonProse: false }),
    );
  });

  it("handles an empty document without throwing", () => {
    expect(countBodyWords([], { excludeNonProse: true })).toBe(0);
    expect(countBodyWords([], { excludeNonProse: false })).toBe(0);
  });

  it("does not let a table-only section inflate the count", () => {
    const tableOnly: ProseSection[] = [
      {
        title: "Cost stack",
        bodyMarkdown: "| a | b |\n| --- | --- |\n| 1 | 2 |",
      },
    ];
    expect(countBodyWords(tableOnly, { excludeNonProse: true })).toBe(0);
  });
});

describe("countBodyWordsFromHtml", () => {
  const html =
    "<h1>Title</h1><p>one two three</p><table><tr><td>x y z</td></tr></table>" +
    "<svg><text>a b c</text></svg><script>var q = 1;</script>";

  it("always drops script and style, in both modes", () => {
    expect(countBodyWordsFromHtml(html, { excludeNonProse: false })).toBe(
      // Title + "one two three" + "x y z" + "a b c" = 1 + 3 + 3 + 3
      10,
    );
  });

  it("drops table and SVG text when excluding non-prose", () => {
    expect(countBodyWordsFromHtml(html, { excludeNonProse: true })).toBe(4);
  });
});

describe("P4 business_case band reconciliation", () => {
  const bc = P3_P4_WORD_BAND_CONTRACTS.business_case;

  it("targets 3,000-5,000 prose words with a 5,800 hard ceiling", () => {
    expect(bc.minWords).toBe(3_000);
    expect(bc.targetWordsMax).toBe(5_000);
    expect(bc.advisoryMaxWords).toBe(5_800);
    expect(bc.enforceMaxAsBlocker).toBe(true);
  });

  it("counts prose only, so exhibits do not consume the band", () => {
    expect(bc.excludeNonProseFromBody).toBe(true);
  });

  it("keeps the band internally ordered", () => {
    expect(bc.minWords).toBeLessThan(bc.targetWordsMax);
    expect(bc.targetWordsMax).toBeLessThan(bc.advisoryMaxWords);
  });

  it("leaves every other band on whole-body counting, so none is silently tightened", () => {
    for (const [key, band] of Object.entries(P3_P4_WORD_BAND_CONTRACTS)) {
      if (key === "business_case") continue;
      expect(band.excludeNonProseFromBody).toBeUndefined();
    }
  });
});
