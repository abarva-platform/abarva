#!/usr/bin/env node
import { createHash } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";

const DEFAULT_RELEASE_ID = "corpus-release-2026-06-02";
const DEFAULT_VERSION = "v1.0";
const DEFAULT_MANIFEST_DATE = "2026-06-02";
const DEFAULT_JSON_OUTPUT =
  "docs/knowledge-corpus/releases/corpus-release-manifest.json";
const DEFAULT_MD_OUTPUT = "docs/knowledge-corpus/releases/README.md";

const corpusRoots = [
  {
    label: "knowledge-corpus-docs",
    path: "docs/knowledge-corpus",
    description: "Schema, provenance, curation, validation, and generated corpus evidence.",
  },
  {
    label: "pattern-library-docs",
    path: "docs/pattern-library",
    description: "Pattern-library source documents used by corpus authorship and retrieval.",
  },
  {
    label: "knowledge-data-sources",
    path: "scripts/knowledge-data",
    description: "Industry corpus source text packs for genome, healthcare, retail, and finserv.",
  },
  {
    label: "corpus-generation-scripts",
    path: "scripts/corpus",
    description: "Corpus generation and reporting scripts.",
  },
  {
    label: "corpus-overlay-scripts",
    path: "scripts/corpus-generation",
    description: "Overlay generation scripts for industry-specific corpus waves.",
  },
];

const ignoredPathFragments = [
  "/.git/",
  "/node_modules/",
  "/docs/knowledge-corpus/releases/",
];

function parseArgs(argv) {
  const args = {
    releaseId: process.env.CORPUS_RELEASE_ID ?? DEFAULT_RELEASE_ID,
    version: process.env.CORPUS_RELEASE_VERSION ?? DEFAULT_VERSION,
    manifestDate: process.env.CORPUS_RELEASE_DATE ?? DEFAULT_MANIFEST_DATE,
    jsonOutput: DEFAULT_JSON_OUTPUT,
    mdOutput: DEFAULT_MD_OUTPUT,
    check: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = argv[index + 1];
    if (arg === "--release-id" && next) {
      args.releaseId = next;
      index += 1;
    } else if (arg === "--version" && next) {
      args.version = next;
      index += 1;
    } else if (arg === "--date" && next) {
      args.manifestDate = next;
      index += 1;
    } else if (arg === "--json-output" && next) {
      args.jsonOutput = next;
      index += 1;
    } else if (arg === "--md-output" && next) {
      args.mdOutput = next;
      index += 1;
    } else if (arg === "--check") {
      args.check = true;
    } else {
      throw new Error(`Unknown or incomplete argument: ${arg}`);
    }
  }

  return args;
}

function sha256(buffer) {
  return createHash("sha256").update(buffer).digest("hex");
}

function stableJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function toPosix(filePath) {
  return filePath.split(path.sep).join("/");
}

async function pathExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function listFiles(rootDir, repoRoot) {
  const files = [];
  const rootAbs = path.join(repoRoot, rootDir);

  async function walk(currentAbs) {
    const entries = await fs.readdir(currentAbs, { withFileTypes: true });
    entries.sort((left, right) => left.name.localeCompare(right.name));

    for (const entry of entries) {
      const absolutePath = path.join(currentAbs, entry.name);
      const relativePath = toPosix(path.relative(repoRoot, absolutePath));
      const normalized = `/${relativePath}/`;
      if (ignoredPathFragments.some((fragment) => normalized.includes(fragment))) {
        continue;
      }
      if (entry.isDirectory()) {
        await walk(absolutePath);
      } else if (entry.isFile()) {
        files.push(relativePath);
      }
    }
  }

  if (await pathExists(rootAbs)) {
    await walk(rootAbs);
  }

  return files;
}

async function buildManifest(args, repoRoot) {
  const rootSummaries = [];
  const files = [];

  for (const root of corpusRoots) {
    const rootFiles = await listFiles(root.path, repoRoot);
    rootSummaries.push({
      label: root.label,
      path: root.path,
      description: root.description,
      fileCount: rootFiles.length,
    });

    for (const filePath of rootFiles) {
      const content = await fs.readFile(path.join(repoRoot, filePath));
      files.push({
        path: filePath,
        root: root.label,
        bytes: content.byteLength,
        lines: content.toString("utf8").split(/\r?\n/).length,
        sha256: sha256(content),
      });
    }
  }

  files.sort((left, right) => left.path.localeCompare(right.path));
  const aggregateHash = sha256(
    Buffer.from(
      stableJson(
        files.map((file) => ({
          path: file.path,
          bytes: file.bytes,
          sha256: file.sha256,
        })),
      ),
      "utf8",
    ),
  );

  return {
    releaseId: args.releaseId,
    version: args.version,
    manifestDate: args.manifestDate,
    aggregateSha256: aggregateHash,
    scope: {
      purpose:
        "Version and checksum the committed industry corpus release inputs so client/pilot corpus pins can be audited.",
      excluded:
        "docs/knowledge-corpus/releases is excluded so generated manifests do not hash themselves.",
    },
    roots: rootSummaries,
    totals: {
      files: files.length,
      bytes: files.reduce((sum, file) => sum + file.bytes, 0),
      roots: rootSummaries.length,
    },
    files,
  };
}

function renderMarkdown(manifest) {
  const rootRows = manifest.roots
    .map(
      (root) =>
        `| ${root.label} | \`${root.path}\` | ${root.fileCount} | ${root.description} |`,
    )
    .join("\n");

  const fileRows = manifest.files
    .map(
      (file) =>
        `| \`${file.path}\` | ${file.root} | ${file.bytes} | \`${file.sha256}\` |`,
    )
    .join("\n");

  return `# Knowledge Corpus Release Manifest

Status: generated
Release ID: \`${manifest.releaseId}\`
Version: \`${manifest.version}\`
Manifest date: \`${manifest.manifestDate}\`
Aggregate SHA-256: \`${manifest.aggregateSha256}\`

This manifest versions the committed AbarVa industry corpus inputs so a client
or pilot environment can pin to a concrete corpus release. Re-run
\`npm run corpus:release-manifest\` after corpus source files, pattern-library
docs, or corpus generation scripts change.

## Scope

${manifest.scope.purpose}

Excluded: ${manifest.scope.excluded}

## Roots

| Label | Path | Files | Description |
| --- | --- | ---: | --- |
${rootRows}

## Totals

| Metric | Value |
| --- | ---: |
| Files | ${manifest.totals.files} |
| Bytes | ${manifest.totals.bytes} |
| Roots | ${manifest.totals.roots} |

## File Checksums

| Path | Root | Bytes | SHA-256 |
| --- | --- | ---: | --- |
${fileRows}
`;
}

async function writeOrCheck(filePath, content, check) {
  if (check) {
    const current = await pathExists(filePath)
      ? await fs.readFile(filePath, "utf8")
      : null;
    if (current !== content) {
      throw new Error(`${toPosix(filePath)} is out of date`);
    }
    return;
  }

  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, content, "utf8");
}

const args = parseArgs(process.argv.slice(2));
const repoRoot = process.cwd();
const manifest = await buildManifest(args, repoRoot);
const jsonOutput = path.join(repoRoot, args.jsonOutput);
const mdOutput = path.join(repoRoot, args.mdOutput);

await writeOrCheck(jsonOutput, stableJson(manifest), args.check);
await writeOrCheck(mdOutput, renderMarkdown(manifest), args.check);

console.log(
  JSON.stringify(
    {
      releaseId: manifest.releaseId,
      aggregateSha256: manifest.aggregateSha256,
      files: manifest.totals.files,
      bytes: manifest.totals.bytes,
      check: args.check,
      jsonOutput: args.jsonOutput,
      mdOutput: args.mdOutput,
    },
    null,
    2,
  ),
);
