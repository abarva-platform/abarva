#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import ts from "typescript";
import postcss from "postcss";
import valueParser from "postcss-value-parser";
import colorNames from "color-name";

const ROOTS = [
  "src/components/source/",
  "src/app/(maestro)/source/",
  "src/lib/source/",
];
const TOKEN_FILES = new Set([
  "src/components/source/canvas/canvas-tokens.ts",
  "src/components/source/portfolio/portfolio-tokens.ts",
]);
const COLOR_FUNCTIONS = new Set([
  "rgb",
  "rgba",
  "hsl",
  "hsla",
  "hwb",
  "lab",
  "lch",
  "oklab",
  "oklch",
  "color",
]);
const PAINT_PROPERTY =
  /^(?:--|color$|background|border|outline|boxshadow|textshadow|textdecoration|columnrule|fill$|stroke$|caretcolor$|accentcolor$|stopcolor$|floodcolor$|lightingcolor$|mask|filter$)/i;
const ARBITRARY_PAINT =
  /(?:^|[\s:!])(?:bg|text|border(?:-[trblxy])?|outline|ring(?:-offset)?|shadow|fill|stroke|accent|caret|decoration|from|via|to)-\[([^\]]+)\]/g;
const NON_PAINT_ATTRIBUTE = /^(?:href|src|id|title|alt|aria-.+|data-.+)$/;
const SELECTOR_CALL =
  /^(?:querySelector|querySelectorAll|getElementById|matches|closest)$/;

export function isSourceColorFile(file) {
  return (
    ROOTS.some((root) => file.startsWith(root)) &&
    /\.(?:[cm]?[jt]sx?|css)$/.test(file) &&
    !/(?:^|\/)(?:__tests__|__mocks__|fixtures)(?:\/|$)|\.(?:test|spec|d)\.[^.]+$/.test(
      file,
    ) &&
    !TOKEN_FILES.has(file)
  );
}

function normalizedColor(value) {
  return valueParser(value.toLowerCase())
    .walk((node) => {
      if (node.type === "comment") {
        node.type = "space";
        node.value = " ";
      }
      if (node.type === "space") node.value = " ";
      if (node.type === "div") {
        node.before = "";
        node.after = "";
      }
      if (node.type === "function") {
        node.before = "";
        node.after = "";
      }
    })
    .toString()
    .replace(/\s+/g, " ")
    .trim();
}

function valueColors(value, allowNames = true) {
  const found = [];
  valueParser(value).walk((node) => {
    if (node.type === "function") {
      const name = node.value.toLowerCase();
      if (name === "url") return false;
      if (COLOR_FUNCTIONS.has(name)) {
        let derived = false;
        valueParser(valueParser.stringify(node)).walk((child) => {
          if (
            child.type === "function" &&
            ["var", "env"].includes(child.value.toLowerCase())
          )
            derived = true;
        });
        if (derived) return undefined;
        found.push({
          color: normalizedColor(valueParser.stringify(node)),
          offset: node.sourceIndex,
        });
        return false;
      }
    }
    if (
      node.type === "word" &&
      (/^#(?:[a-f\d]{3}|[a-f\d]{4}|[a-f\d]{6}|[a-f\d]{8})$/i.test(node.value) ||
        (allowNames && Object.hasOwn(colorNames, node.value.toLowerCase())))
    )
      found.push({
        color: normalizedColor(node.value),
        offset: node.sourceIndex,
      });
    return undefined;
  });
  return found;
}

function propertyName(node) {
  return node?.name &&
    (ts.isIdentifier(node.name) || ts.isStringLiteral(node.name))
    ? node.name.text
    : "";
}

function paintProperty(name) {
  return name.startsWith("--") || PAINT_PROPERTY.test(name.replaceAll("-", ""));
}

function decodeArbitraryValue(value) {
  return valueParser(value)
    .walk((node) => {
      if (node.type === "function" && node.value.toLowerCase() === "url")
        return false;
      if (node.type === "word")
        node.value = node.value.replace(/\\_|_/g, (match) =>
          match === "\\_" ? "_" : " ",
        );
      return undefined;
    })
    .toString();
}

function styleElement(node) {
  const expression = node.parent;
  return (
    ts.isJsxExpression(expression) &&
    ts.isJsxElement(expression.parent) &&
    expression.parent.openingElement.tagName.getText() === "style"
  );
}

function excludedString(node) {
  const parent = node.parent;
  if (ts.isLiteralTypeNode(parent)) return true;
  for (
    let ancestor = parent;
    ancestor && !ts.isSourceFile(ancestor);
    ancestor = ancestor.parent
  ) {
    if (ts.isJsxAttribute(ancestor))
      return NON_PAINT_ATTRIBUTE.test(propertyName(ancestor));
    if (ts.isJsxElement(ancestor) || ts.isJsxSelfClosingElement(ancestor))
      break;
  }
  if (
    ts.isJsxAttribute(parent) &&
    NON_PAINT_ATTRIBUTE.test(propertyName(parent))
  )
    return true;
  if (ts.isImportDeclaration(parent) || ts.isExportDeclaration(parent))
    return true;
  if (ts.isPropertyAssignment(parent) && parent.name === node) return true;
  if (ts.isCallExpression(parent)) {
    const callName = ts.isPropertyAccessExpression(parent.expression)
      ? parent.expression.name.text
      : "";
    if (SELECTOR_CALL.test(callName)) return true;
  }
  return false;
}

export function scanColorLiterals(file, source) {
  const rows = [];
  const record = (values, startLine) => {
    for (const { color } of values) rows.push({ file, line: startLine, color });
  };
  function stylesheet(value, line = 1) {
    let parsed;
    try {
      parsed = postcss.parse(value, { from: file });
    } catch (error) {
      throw new Error(`Cannot parse ${file}: ${error.message}`);
    }
    parsed.walkDecls((decl) =>
      record(
        valueColors(decl.value, paintProperty(decl.prop)),
        line + decl.source.start.line - 1,
      ),
    );
  }
  if (file.endsWith(".css")) {
    stylesheet(source);
    return rows;
  }
  const parsed = ts.createSourceFile(
    file,
    source,
    ts.ScriptTarget.Latest,
    true,
  );
  if (parsed.parseDiagnostics.length) {
    throw new Error(
      `Cannot parse ${file}: ${ts.flattenDiagnosticMessageText(parsed.parseDiagnostics[0].messageText, " ")}`,
    );
  }
  function visit(node) {
    if (
      (ts.isStringLiteral(node) ||
        ts.isNoSubstitutionTemplateLiteral(node) ||
        ts.isTemplateExpression(node)) &&
      !excludedString(node)
    ) {
      // Parse one complete CSS value so a literal after an interpolation is
      // not lost to an unmatched closing parenthesis in a template tail.
      const value = ts.isTemplateExpression(node)
        ? node.head.text +
          node.templateSpans
            .map((span) => `var(--source-interpolation)${span.literal.text}`)
            .join("")
        : node.text;
      const line =
        parsed.getLineAndCharacterOfPosition(node.getStart(parsed)).line + 1;
      const name = propertyName(node.parent);
      const arbitrary = [...value.matchAll(ARBITRARY_PAINT)];
      const arbitraryProperties = [
        ...value.matchAll(/(?:^|[\s:!])\[([a-z-]+):([^\]]+)\]/g),
      ].filter((match) => paintProperty(match[1]));
      if (styleElement(node)) {
        stylesheet(value, line);
      } else if (arbitrary.length || arbitraryProperties.length) {
        for (const match of arbitrary)
          record(valueColors(decodeArbitraryValue(match[1])), line);
        for (const match of arbitraryProperties)
          record(valueColors(decodeArbitraryValue(match[2])), line);
      } else {
        const exactName = Object.hasOwn(colorNames, value.toLowerCase());
        const cssContext =
          paintProperty(name) ||
          /(?:gradient|var|color-mix|light-dark)\(/i.test(value);
        record(valueColors(value, exactName || cssContext), line);
      }
      if (ts.isTemplateExpression(node)) {
        for (const span of node.templateSpans) visit(span.expression);
        return;
      }
    }
    ts.forEachChild(node, visit);
  }
  visit(parsed);
  return rows;
}

export function compareColorLiterals(before, after) {
  const violations = [];
  let beforeCount = 0;
  let afterCount = 0;
  let scannedFiles = 0;
  for (const file of new Set([...before.keys(), ...after.keys()])) {
    if (!isSourceColorFile(file)) continue;
    scannedFiles += 1;
    const oldRows = scanColorLiterals(file, before.get(file) ?? "");
    const newRows = scanColorLiterals(file, after.get(file) ?? "");
    beforeCount += oldRows.length;
    afterCount += newRows.length;
    const allowance = new Map();
    for (const { color } of oldRows)
      allowance.set(color, (allowance.get(color) ?? 0) + 1);
    for (const row of newRows) {
      const remaining = allowance.get(row.color) ?? 0;
      if (remaining > 0) allowance.set(row.color, remaining - 1);
      else violations.push(row);
    }
  }
  return { violations, beforeCount, afterCount, scannedFiles };
}

function git(root, args) {
  return execFileSync("git", args, {
    cwd: root,
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
  });
}

function readTree(root, ref) {
  const working = ref === "WORKTREE";
  if (!working) git(root, ["rev-parse", "--verify", `${ref}^{commit}`]);
  const files = git(
    root,
    working
      ? ["ls-files", "-z", "--cached", "--others", "--exclude-standard"]
      : ["ls-tree", "-rz", "--name-only", ref],
  )
    .split("\0")
    .filter(isSourceColorFile);
  const tree = new Map();
  if (!working && files.length) {
    if (files.some((file) => file.includes("\n")))
      throw new Error("Unsupported newline in Source filename.");
    const output = execFileSync("git", ["cat-file", "--batch"], {
      cwd: root,
      input: files.map((file) => `${ref}:${file}\n`).join(""),
      maxBuffer: 64 * 1024 * 1024,
    });
    let offset = 0;
    for (const file of files) {
      const end = output.indexOf(10, offset);
      const header = output.subarray(offset, end).toString("utf8");
      const match = header.match(/^[a-f\d]+ blob (\d+)$/);
      if (!match) throw new Error(`Cannot read ${ref}:${file}: ${header}`);
      const size = Number(match[1]);
      offset = end + 1;
      tree.set(file, output.subarray(offset, offset + size).toString("utf8"));
      offset += size + 1;
    }
    return tree;
  }
  for (const file of new Set(files)) {
    const absolute = path.join(root, file);
    if (working && !fs.existsSync(absolute)) continue;
    tree.set(file, fs.readFileSync(absolute, "utf8"));
  }
  return tree;
}

function main() {
  const args = Object.fromEntries(
    process.argv.slice(2).map((arg) => {
      const match = arg.match(/^--(base|head)=(.+)$/);
      if (!match)
        throw new Error(
          `Unknown argument ${arg}; use --base=<ref> --head=<ref|WORKTREE>.`,
        );
      return [match[1], match[2]];
    }),
  );
  const root = process.cwd();
  const base = args.base ?? "origin/main";
  const head = args.head ?? "WORKTREE";
  const result = compareColorLiterals(
    readTree(root, base),
    readTree(root, head),
  );
  console.log(
    `Source color literals: ${result.beforeCount} -> ${result.afterCount}; ${result.scannedFiles} files; ${base} -> ${head}.`,
  );
  if (result.violations.length) {
    for (const row of result.violations)
      console.error(
        `${row.file}:${row.line} new hard-coded color: ${row.color}`,
      );
    console.error(
      "Use the existing Source tokens or brand CSS variables. Allowances are per file and literal, not a global budget.",
    );
    process.exitCode = 1;
  } else console.log("PASS: no new hard-coded Source colors.");
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  try {
    main();
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
