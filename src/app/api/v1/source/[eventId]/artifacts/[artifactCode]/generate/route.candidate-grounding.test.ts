import { readFileSync } from "node:fs";
import { join } from "node:path";
import ts from "typescript";

it("uses the accepted-panel draft in the D12 branch before model egress", () => {
  const path = join(__dirname, "route.ts");
  const source = ts.createSourceFile(
    path,
    readFileSync(path, "utf8"),
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );
  let draftBranch: ts.IfStatement | null = null;
  let modelCall = -1;

  const isD12 = (expression: ts.Expression): boolean =>
    ts.isBinaryExpression(expression) &&
    expression.operatorToken.kind === ts.SyntaxKind.EqualsEqualsEqualsToken &&
    ts.isIdentifier(expression.left) &&
    expression.left.text === "artifactCode" &&
    ts.isStringLiteral(expression.right) &&
    expression.right.text === "d12_vendor_shortlist";

  function visit(node: ts.Node) {
    if (ts.isIfStatement(node) && isD12(node.expression)) {
      const body = node.thenStatement.getText(source);
      if (body.includes("buildCandidatePanelShortlistDraft")) draftBranch = node;
    }
    if (
      ts.isCallExpression(node) &&
      ts.isIdentifier(node.expression) &&
      node.expression.text === "preflightAnthropicDirectClient"
    ) {
      modelCall = node.getStart(source);
    }
    ts.forEachChild(node, visit);
  }
  visit(source);

  expect(draftBranch).not.toBeNull();
  expect(draftBranch!.getStart(source)).toBeLessThan(modelCall);
  expect(draftBranch!.thenStatement.getText(source)).toMatch(
    /body\s*=\s*buildCandidatePanelShortlistDraft\s*\(/,
  );
  expect(draftBranch!.thenStatement.getText(source)).not.toContain(
    "preflightAnthropicDirectClient",
  );
});
