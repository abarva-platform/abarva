import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import ts from "typescript";

const ROOT = "src/app/api/v1/source/[eventId]/artifacts/[artifactCode]";
const ROUTES = [
  ["render-docx", "renderArtifactDocx"],
  ["render-html", "renderArtifactHtml"],
  ["render-pdf", "buildPdfPayload"],
] as const;

function hasGuardBeforeRender(source: string, renderName: string): boolean {
  const file = ts.createSourceFile("route.ts", source, ts.ScriptTarget.Latest, true);
  let authorityCall = -1;
  let responseGuard = -1;
  let renderCall = -1;

  function visit(node: ts.Node): void {
    if (ts.isCallExpression(node) && ts.isIdentifier(node.expression)) {
      if (
        node.expression.text === "requireRfpArtifactExport" &&
        node.arguments.length >= 3 &&
        ts.isIdentifier(node.arguments[0]!) &&
        node.arguments[0]!.text === "ctx" &&
        ts.isIdentifier(node.arguments[1]!) &&
        node.arguments[1]!.text === "artifactCode"
      ) {
        authorityCall = node.getStart(file);
      }
      if (node.expression.text === renderName) {
        renderCall = node.getStart(file);
      }
    }
    if (
      ts.isIfStatement(node) &&
      ts.isPropertyAccessExpression(node.expression) &&
      ts.isIdentifier(node.expression.expression) &&
      node.expression.expression.text === "rfpExport" &&
      node.expression.name.text === "response" &&
      ts.isReturnStatement(node.thenStatement) &&
      node.thenStatement.expression !== undefined &&
      ts.isPropertyAccessExpression(node.thenStatement.expression) &&
      ts.isIdentifier(node.thenStatement.expression.expression) &&
      node.thenStatement.expression.expression.text === "rfpExport" &&
      node.thenStatement.expression.name.text === "response"
    ) {
      responseGuard = node.getStart(file);
    }
    ts.forEachChild(node, visit);
  }
  visit(file);
  return authorityCall >= 0 && authorityCall < responseGuard && responseGuard < renderCall;
}

describe("legacy RFP export routes", () => {
  for (const [route, renderName] of ROUTES) {
    it(`${route} refuses before rendering when the shared authority check blocks`, () => {
      const source = readFileSync(resolve(process.cwd(), ROOT, route, "route.ts"), "utf8");
      expect(hasGuardBeforeRender(source, renderName)).toBe(true);
      expect(
        hasGuardBeforeRender(
          source.replace("requireRfpArtifactExport(", "requireRfpArtifactExportXX("),
          renderName,
        ),
      ).toBe(false);
    });
  }

  it("uses the RFP-aware degraded PDF policy in its render fallback", () => {
    const source = readFileSync(resolve(process.cwd(), ROOT, "render-pdf", "route.ts"), "utf8");
    const file = ts.createSourceFile("route.ts", source, ts.ScriptTarget.Latest, true);
    let policyCall = false;
    function visit(node: ts.Node): void {
      if (
        ts.isCallExpression(node) &&
        ts.isIdentifier(node.expression) &&
        node.expression.text === "allowsDegradedSourcePdf"
      ) {
        policyCall = true;
      }
      ts.forEachChild(node, visit);
    }
    visit(file);
    expect(policyCall).toBe(true);
  });
});
