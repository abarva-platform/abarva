import { readFileSync } from "node:fs";
import { join } from "node:path";
import ts from "typescript";

it("checks the finished D09 draft before its generation receipt is written", () => {
  const path = join(__dirname, "route.ts");
  const source = ts.createSourceFile(
    path,
    readFileSync(path, "utf8"),
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );
  const calls: Array<{ name: string; start: number }> = [];
  function visit(node: ts.Node) {
    if (ts.isCallExpression(node)) {
      const name = ts.isIdentifier(node.expression)
        ? node.expression.text
        : ts.isPropertyAccessExpression(node.expression)
          ? node.expression.name.text
          : null;
      if (name) calls.push({ name, start: node.getStart(source) });
    }
    ts.forEachChild(node, visit);
  }
  visit(source);

  const position = (name: string) => calls.find((call) => call.name === name)?.start ?? -1;
  const disclosurePosition = position("markD09VendorDisclosureReview");
  expect(disclosurePosition).toBeGreaterThan(
    position("normalizeRequiredSectionHeadings"),
  );
  const receiptPosition = calls.find(
    (call) => call.name === "withSectionVerificationMetadata" && call.start > disclosurePosition,
  )?.start ?? -1;
  const writePosition = calls.find(
    (call) => call.name === "updateArtifactBody" && call.start > disclosurePosition,
  )?.start ?? -1;
  expect(receiptPosition).toBeGreaterThan(disclosurePosition);
  expect(writePosition).toBeGreaterThan(receiptPosition);
});
