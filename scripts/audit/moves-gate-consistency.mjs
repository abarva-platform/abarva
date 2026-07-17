#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const file = "src/app/api/v1/programs/[programId]/phase-gate-approval/route.ts";
const body = fs.readFileSync(path.join(process.cwd(), file), "utf8");

const required = [
  "function gateIdFor",
  "gateId: gateIdFor(programId, phase)",
  "transition:",
  "nextAction:",
  "capture,",
  "capture_incomplete",
  "terminalHandoff",
];

for (const token of required) {
  if (!body.includes(token)) {
    throw new Error(`Gate consistency token missing from ${file}: ${token}`);
  }
}

console.log("PASS audit:moves-gate-consistency");
