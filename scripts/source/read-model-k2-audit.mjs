import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import ts from "typescript";

// K2 asks these questions of each proposed L4 read model. A missing field is
// different from a field whose declaration happens to be absent on a model.
export const K2_REQUIREMENTS = [
  { property: "reconciliation", field: "reconciliationEquation" },
  { property: "denominator", field: "denominator" },
  { property: "oppositeTenantQuery", field: "oppositeTenantQuery" },
  { property: "fieldAuthority", field: "fieldAuthority" },
  { property: "projectionTrigger", field: "projectionTrigger" },
  { property: "acceptableDelay", field: "freshnessSla" },
  { property: "asOfDate", field: "asOf" },
  { property: "staleBehavior", field: "staleBehavior" },
  { property: "avaMayAnswerWhileStale", field: "avaMayAnswerWhileStale" },
];

function propertyName(node) {
  if (!node) return null;
  return ts.isIdentifier(node) || ts.isStringLiteral(node) ? node.text : null;
}

function findDeclaration(sourceFile, predicate) {
  for (const statement of sourceFile.statements) {
    if (predicate(statement)) return statement;
  }
  throw new Error("Required read-model contract declaration is absent");
}

function fieldNamesFromUnion(sourceFile) {
  const declaration = findDeclaration(
    sourceFile,
    (statement) =>
      ts.isTypeAliasDeclaration(statement) &&
      statement.name.text === "SourceReadModelContractField",
  );
  const parts = ts.isUnionTypeNode(declaration.type)
    ? declaration.type.types
    : [declaration.type];
  return new Set(
    parts
      .filter(
        (part) =>
          ts.isLiteralTypeNode(part) && ts.isStringLiteral(part.literal),
      )
      .map((part) => part.literal.text),
  );
}

function fieldNamesFromInterface(sourceFile) {
  const declaration = findDeclaration(
    sourceFile,
    (statement) =>
      ts.isInterfaceDeclaration(statement) &&
      statement.name.text === "SourceReadModelDefinition",
  );
  return new Set(declaration.members.map((member) => propertyName(member.name)));
}

function inventoryRows(sourceFile) {
  for (const statement of sourceFile.statements) {
    if (!ts.isVariableStatement(statement)) continue;
    for (const declaration of statement.declarationList.declarations) {
      if (
        propertyName(declaration.name) !== "SOURCE_READ_MODEL_INVENTORY" ||
        !declaration.initializer ||
        !ts.isArrayLiteralExpression(declaration.initializer)
      ) {
        continue;
      }
      return declaration.initializer.elements.map((element) => {
        if (!ts.isObjectLiteralExpression(element)) {
          throw new Error("Inventory row is not an object literal");
        }
        const fields = new Map(
          element.properties
            .filter(ts.isPropertyAssignment)
            .map((property) => [propertyName(property.name), property.initializer]),
        );
        const id = fields.get("id");
        const state = fields.get("state");
        if (!ts.isStringLiteral(id) || !ts.isStringLiteral(state)) {
          throw new Error("Inventory row lacks literal id or state");
        }
        return { id: id.text, state: state.text, fields };
      });
    }
  }
  throw new Error("SOURCE_READ_MODEL_INVENTORY is absent");
}

export function auditReadModelContract(sourceText) {
  const sourceFile = ts.createSourceFile(
    "read-model-inventory.ts",
    sourceText,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );
  if (sourceFile.parseDiagnostics.length) {
    throw new Error("Read-model contract could not be parsed");
  }
  const unionFields = fieldNamesFromUnion(sourceFile);
  const interfaceFields = fieldNamesFromInterface(sourceFile);
  const support = K2_REQUIREMENTS.map(({ property, field }) => ({
    property,
    field,
    expressible:
      field !== null && unionFields.has(field) && interfaceFields.has(field),
  }));
  const models = inventoryRows(sourceFile).map(({ id, state, fields }) => ({
    id,
    state,
    cells: support.map(({ field, expressible }) =>
      !expressible ? "unexpressible" : fields.has(field) ? "declared" : "absent",
    ),
  }));
  return { support, models };
}

export function renderK2AuditMarkdown(audit) {
  const header = `| Read model | ${audit.support.map((entry) => entry.property).join(" | ")} |`;
  const separator = `|---|${audit.support.map(() => "---|").join("")}`;
  const rows = audit.models.map(
    (model) => `| ${model.id} | ${model.cells.join(" | ")} |`,
  );
  return [header, separator, ...rows].join("\n");
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const source = readFileSync(
    new URL("../../src/lib/source/data-model/read-model-inventory.ts", import.meta.url),
    "utf8",
  );
  process.stdout.write(`${renderK2AuditMarkdown(auditReadModelContract(source))}\n`);
}
