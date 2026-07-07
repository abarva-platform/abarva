import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const packetPath = join(root, "docs/business/business-setup-readiness-packet.md");
const releasePath = join(
  root,
  "docs/releases/records/2026-06-03-business-setup-readiness.md",
);

const packet = readFileSync(packetPath, "utf8");
const release = readFileSync(releasePath, "utf8");

const requiredPacketSnippets = [
  "Backlog rows: T001, T002, T003, T004, T005, T006, T007, T008, T009, T010, T011, T012, T013, T014",
  "## Readiness Rule",
  "## Evidence Folder Standard",
  "## T001 - Incorporation Packet",
  "## T002 - 83(b) Deadline Control",
  "## T005 - Founder Employment and IP Assignment",
  "## T006 - Counsel Engagement Packet",
  "## T007 - Insurance Broker Packet",
  "## T010 - Public Policy Starter Pack",
  "## T013 - SOC 2 Type 1 Launch Packet",
  "Do not commit confidential executed documents to the public repository.",
  "Do not mark any Business Setup row Done from this repo-only packet.",
];

const requiredReleaseSnippets = [
  "`2026-06-03-business-setup-readiness`",
  "internal-admin",
  "T001",
  "T014",
  "No runtime rollout",
  "No Business Setup row should be marked Done solely because of this release.",
];

function assertIncludes(source, snippet, label) {
  if (!source.includes(snippet)) {
    throw new Error(`${label} is missing required snippet: ${snippet}`);
  }
}

for (const snippet of requiredPacketSnippets) {
  assertIncludes(packet, snippet, "business setup packet");
}

for (const snippet of requiredReleaseSnippets) {
  assertIncludes(release, snippet, "release record");
}

const taskIds = Array.from(packet.matchAll(/\bT\d{3}\b/g), ([match]) => match);
const uniqueTaskIds = new Set(taskIds);

for (const id of [
  "T001",
  "T002",
  "T003",
  "T004",
  "T005",
  "T006",
  "T007",
  "T008",
  "T009",
  "T010",
  "T011",
  "T012",
  "T013",
  "T014",
]) {
  if (!uniqueTaskIds.has(id)) {
    throw new Error(`business setup packet does not mention ${id}`);
  }
}

console.log(
  `Business setup readiness packet verified (${uniqueTaskIds.size} task ids referenced).`,
);
