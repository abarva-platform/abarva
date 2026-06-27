#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const CONTRACT_FILE = "docs/standards/NORTH_STAR_SCALE_QUALITY_CONTRACT.md";

const REQUIRED_MARKERS = [
  "Quality must be verifiable by construction as dimensions multiply.",
  "L1 Sources -> L2 Entities/Facts/Relationships -> L3 Dimension Dossiers -> L4 Read Models -> L5 Bounded Advisory Packets -> L6 Quality Gate + Renderer",
  "Every new dimension enters the same assembly line:",
  "One Path",
  "Content-Gated Readiness",
  "Contract Computed Once",
  "Determinism Owns Facts; The Model Owns Prose",
  "Proof Is Continuous, By Dimension",
  "Capacity Is Based On Populated Content",
  "Locked Control Plane",
];

const RELEASE_RECORD_PATTERN = /^docs\/releases\/records\/[^/]+\.md$/;

const NORTH_STAR_PATHS = [
  /^src\/app\/api\/home\//,
  /^src\/app\/api\/intelligence\//,
  /^src\/app\/api\/tower\//,
  /^src\/components\/home\//,
  /^src\/components\/intelligence/,
  /^src\/components\/tower\//,
  /^src\/components\/atlas\//,
  /^src\/components\/ava-chat\//,
  /^src\/components\/agent-answer\//,
  /^src\/lib\/home\//,
  /^src\/lib\/intelligence\/ask\//,
  /^src\/lib\/semantic2\//,
  /^src\/lib\/semantic-dossiers\//,
  /^src\/lib\/tower\//,
  /^src\/lib\/tower-v2\//,
  /^src\/lib\/atlas\//,
  /^src\/lib\/agent\/(visible-answer-contract|multipart-completeness|response-shape|quality)\./,
  /^scripts\/semantic2\//,
  /^scripts\/semantic2-dossier-eligibility-report\.ts$/,
  /^scripts\/qa\//,
  /^docs\/semantic2-answer-synthesis\//,
  /^docs\/semantic-layer\//,
];

const REQUIRED_RELEASE_RECORD_TERMS = [
  /north-star/i,
  /one path/i,
  /content[- ]gated readiness/i,
  /contract computed once/i,
  /proof is continuous|continuous proof/i,
];

function argValue(name, fallback) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] ?? fallback : fallback;
}

function runGit(args) {
  return execFileSync("git", args, { encoding: "utf8" }).trim();
}

function changedFiles(base, head) {
  const files = new Set();
  const diff = runGit(["diff", "--name-only", `${base}...${head}`]);
  for (const file of diff ? diff.split("\n").filter(Boolean) : []) files.add(file);

  if (head === "HEAD") {
    const staged = runGit(["diff", "--cached", "--name-only"]);
    const unstaged = runGit(["diff", "--name-only"]);
    const untracked = runGit(["ls-files", "--others", "--exclude-standard"]);
    for (const file of staged ? staged.split("\n").filter(Boolean) : []) files.add(file);
    for (const file of unstaged ? unstaged.split("\n").filter(Boolean) : []) files.add(file);
    for (const file of untracked ? untracked.split("\n").filter(Boolean) : []) files.add(file);
  }

  return Array.from(files).sort();
}

function fileText(file) {
  const absolute = path.resolve(process.cwd(), file);
  return existsSync(absolute) ? readFileSync(absolute, "utf8") : "";
}

function isNorthStarSurface(file) {
  if (file === "scripts/release-control/check-north-star-quality-contract.mjs") return true;
  if (file === CONTRACT_FILE) return true;
  return NORTH_STAR_PATHS.some((pattern) => pattern.test(file));
}

const errors = [];
const contractText = fileText(CONTRACT_FILE);

if (!contractText) {
  errors.push(`${CONTRACT_FILE}: required North-Star quality contract is missing.`);
} else {
  for (const marker of REQUIRED_MARKERS) {
    if (!contractText.includes(marker)) {
      errors.push(`${CONTRACT_FILE}: missing required marker "${marker}".`);
    }
  }
}

const base =
  argValue("--base", process.env.GITHUB_BASE_SHA) ||
  process.env.GITHUB_BASE_REF ||
  "origin/main";
const head = argValue("--head", process.env.GITHUB_SHA || "HEAD");
const files = changedFiles(base, head);
const northStarFiles = files.filter(isNorthStarSurface);

if (northStarFiles.length > 0) {
  const records = files.filter((file) => RELEASE_RECORD_PATTERN.test(file));
  const recordText = records.map(fileText).join("\n\n");
  for (const term of REQUIRED_RELEASE_RECORD_TERMS) {
    if (!term.test(recordText)) {
      errors.push(
        `North-Star quality paths changed (${northStarFiles.join(", ")}), but the release record does not mention ${term}.`,
      );
    }
  }
}

if (errors.length > 0) {
  console.error("North-Star Quality Contract Gate failed.");
  console.error("");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

if (northStarFiles.length > 0) {
  console.log("North-Star Quality Contract Gate passed.");
  console.log(`North-Star files: ${northStarFiles.join(", ")}`);
} else {
  console.log("North-Star Quality Contract Gate passed.");
  console.log("No North-Star answer/substrate paths changed.");
}
