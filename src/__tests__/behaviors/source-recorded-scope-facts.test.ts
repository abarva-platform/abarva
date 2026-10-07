import fs from "node:fs";
import path from "node:path";
import { recordedScopeFacts } from "@/lib/source/new-workspace/recorded-scope-facts";

/**
 * The Source New workspace rendered four governed facts as one paragraph.
 *
 * `source_events.scope_description` is a single column but not free text:
 * `buildSourceScopeDescription` writes four labelled facts into it and
 * `parseSourceScopeDescription` reads them back. The approval surface and the
 * strategy builder already parse it; the workspace did not, so the Request and
 * Define panels showed the whole column under one "Scope" heading —
 * and the Request panel then repeated the category from the event's own field
 * directly beneath it.
 *
 * The fixture below has the shape observed on the running product: four
 * labels, in that order, in one column.
 */
const LABELLED = [
  "Scope boundary: In: inbound member-service agent-assist capability and its",
  "integration needs. Out: claims decisions, clinical decisions, supplier",
  "contact, and contract award.",
  "Value target: Evaluate service quality, handling effort, transfer rate,",
  "compliance, and cost-to-serve. Any numeric benefit remains an assumption",
  "until a source-backed baseline is reviewed.",
  "Baseline owner: Product QA owns synthetic baselines only: call volumes,",
  "intent mix, average handling time, and current tool context.",
  "Category: BPO / Contact Centre",
].join("\n");

const read = (file: string) =>
  fs.readFileSync(path.join(process.cwd(), file), "utf8");

const workspace = read(
  "src/components/source/new-workspace/SourceNewWorkspace.tsx",
);
const summaryLib = read(
  "src/lib/source/new-workspace/historical-request-summary.ts",
);

/*
 * The Request-record cases live beside the builder, in
 * `src/lib/source/new-workspace/__tests__/historical-request-summary.test.ts`,
 * not here. Importing the builder into a behaviours suite adds every line of
 * that module to the behaviour coverage set, and the uncovered remainder took
 * the floor from 90% to 89.73%. The cases are worth keeping and the floor is
 * not worth lowering, so they moved rather than went away.
 */

describe("a labelled scope column is read as separate facts", () => {
  it("splits the three facts a reader can act on", () => {
    const facts = recordedScopeFacts(LABELLED);
    expect(facts.map((f) => f.key)).toEqual([
      "scopeBoundary",
      "valueTarget",
      "baselineOwner",
    ]);
    expect(facts.map((f) => f.label)).toEqual([
      "Scope boundary",
      "Value target",
      "Baseline owner",
    ]);
    expect(facts[0].value).toContain("inbound member-service");
    expect(facts[1].value).toContain("cost-to-serve");
    expect(facts[2].value).toContain("call volumes");
  });

  // The duplicate this change exists to remove. Both panels carry the event's
  // own category field; the copy inside the description is a repeat of it.
  it("never returns the category, because the event's own field owns it", () => {
    const facts = recordedScopeFacts(LABELLED);
    expect(facts.map((f) => f.key)).not.toContain("category");
    for (const fact of facts) {
      expect(fact.value).not.toContain("BPO / Contact Centre");
    }
  });

  // A plain sentence recorded as the scope is a scope. Relabelling it "Scope
  // boundary" renames a row without telling the reader anything new, so the
  // split is declined and the caller keeps its single row.
  it("declines to split a description that carries no labels", () => {
    expect(
      recordedScopeFacts("Run, maintain, and enhance the application estate."),
    ).toEqual([]);
  });

  it("splits a description whose only label is the scope boundary", () => {
    const facts = recordedScopeFacts("Scope boundary: Service desk only.");
    expect(facts).toHaveLength(1);
    expect(facts[0].key).toBe("scopeBoundary");
  });

  it("omits a fact the description does not carry, rather than emptying it", () => {
    const facts = recordedScopeFacts(
      "Scope boundary: Service desk only.\nBaseline owner: Operations.",
    );
    expect(facts.map((f) => f.key)).toEqual(["scopeBoundary", "baselineOwner"]);
  });

  it("treats an absent or blank column as nothing to split", () => {
    for (const value of [null, undefined, "", "   "]) {
      expect(recordedScopeFacts(value)).toEqual([]);
    }
  });
});

describe("both panels read the split, not the raw column", () => {
  it("the Define panel renders the parsed facts", () => {
    expect(workspace).toContain("recordedScopeFacts(event.scope)");
    // Control: the Define panel's own heading is in this file, so the
    // assertion above cannot pass against an unrelated surface.
    expect(workspace).toContain("What is recorded");
  });

  it("the Request record builds from the parsed facts", () => {
    expect(summaryLib).toContain("recordedScopeFacts(input.event.scope)");
  });
});
