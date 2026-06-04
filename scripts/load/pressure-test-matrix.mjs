#!/usr/bin/env node
import { spawnSync } from "node:child_process";

const PROFILES = [
  {
    id: "T151",
    name: "pilot-baseline-10-user-soak",
    row: "T151",
    title: "Baseline 10 concurrent user soak",
    durationSeconds: 3600,
    concurrency: 10,
    baseCommand: "npm run azure:load:primary-surfaces",
    args: [
      "--duration-seconds",
      "3600",
      "--concurrency",
      "10",
      "--think-time-ms",
      "250",
      "--p95-target-ms",
      "8000",
      "--max-error-rate",
      "0",
    ],
    evidence: [
      "authenticated client or demo session",
      "route-level latency and error summary",
      "deployment URL and commit SHA",
      "0 unhandled 5xx or documented rerun",
    ],
  },
  {
    id: "T152",
    name: "year-one-50-user-soak",
    row: "T152",
    title: "Stretch 50 concurrent user 24-hour soak",
    durationSeconds: 86400,
    concurrency: 50,
    baseCommand: "npm run azure:load:primary-surfaces",
    args: [
      "--duration-seconds",
      "86400",
      "--concurrency",
      "50",
      "--think-time-ms",
      "250",
      "--p95-target-ms",
      "8000",
      "--max-error-rate",
      "0.005",
    ],
    evidence: [
      "24-hour run output",
      "database pool and slow-query dashboard",
      "Azure dependency latency and retry dashboard",
      "queue backlog and error-budget decision",
    ],
  },
  {
    id: "T153",
    name: "llm-stream-burst-10",
    row: "T153",
    title: "10 simultaneous Claude stream burst",
    durationSeconds: 1800,
    concurrency: 10,
    baseCommand: "npm run azure:agent-provider-overload:smoke",
    args: ["--streams", "10", "--duration-seconds", "1800", "--dry-run"],
    evidence: [
      "provider request concurrency",
      "stream start latency and completion latency",
      "model/provider error and retry summary",
      "AI egress audit/cost metadata",
    ],
  },
  {
    id: "T154",
    name: "parallel-document-upload-50",
    row: "T154",
    title: "50 PDF/DOCX parallel upload storm",
    durationSeconds: 900,
    concurrency: 50,
    baseCommand: "npm run azure:blob-upload-pattern:verify",
    args: ["--profile", "parallel-document-upload-50"],
    evidence: [
      "50 upload attempts with file type mix",
      "Blob/ADLS write result and malware scan handoff",
      "parse queue handoff or quarantine result",
      "no cross-client storage prefix violation",
    ],
  },
  {
    id: "T155",
    name: "db-pool-sizing",
    row: "T155",
    title: "DB connection pool and pgbouncer sizing probe",
    durationSeconds: 1800,
    concurrency: 50,
    baseCommand: "npm run azure:postgres-disruption:smoke",
    args: ["--profile", "pool-sizing", "--dry-run"],
    evidence: [
      "max active connections",
      "pool wait time and timeout count",
      "slow-query sample",
      "recommended pool and pgbouncer settings",
    ],
  },
  {
    id: "T156",
    name: "cold-start-primary-routes",
    row: "T156",
    title: "Cold-start measurement across primary Vercel and Azure functions",
    durationSeconds: 600,
    concurrency: 1,
    baseCommand: "npm run azure:load:primary-surfaces",
    args: [
      "--duration-seconds",
      "600",
      "--concurrency",
      "1",
      "--think-time-ms",
      "30000",
      "--p95-target-ms",
      "10000",
      "--max-error-rate",
      "0",
    ],
    evidence: [
      "10 cold-ish route samples",
      "warm-up excluded from steady-state p95",
      "function/runtime logs",
      "route-level cold-start table",
    ],
  },
  {
    id: "T157",
    name: "token-runaway-1m",
    row: "T157",
    title: "Single-user 1M token runaway guard test",
    durationSeconds: 3600,
    concurrency: 1,
    baseCommand: "npm run azure:agent-quality:telemetry-smoke",
    args: ["--profile", "token-runaway-1m", "--dry-run"],
    evidence: [
      "usage cap setting",
      "alert or degraded-mode event",
      "AI egress audit total",
      "customer-safe stop message",
    ],
  },
];

function parseArgs(argv) {
  const args = {
    baseUrl: process.env.PRESSURE_BASE_URL ?? process.env.BASE_URL ?? "https://example.com",
    profile: "all",
    dryRun: false,
    json: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const raw = argv[index];
    const [key, inlineValue] = raw.split("=", 2);
    const nextValue = inlineValue ?? argv[index + 1];
    const consume = inlineValue === undefined;

    switch (key) {
      case "--base-url":
        args.baseUrl = nextValue;
        if (consume) index += 1;
        break;
      case "--profile":
        args.profile = nextValue;
        if (consume) index += 1;
        break;
      case "--dry-run":
        args.dryRun = true;
        break;
      case "--json":
        args.json = true;
        break;
      default:
        throw new Error(`Unknown argument: ${raw}`);
    }
  }

  return args;
}

function selectedProfiles(profile) {
  if (profile === "all") return PROFILES;
  const matches = PROFILES.filter((item) => item.name === profile || item.row === profile);
  if (matches.length === 0) {
    throw new Error(`Unknown pressure-test profile: ${profile}`);
  }
  return matches;
}

function commandFor(profile, baseUrl) {
  return [profile.baseCommand, "--", "--base-url", baseUrl, ...profile.args].join(" ");
}

function manifest(args) {
  const profiles = selectedProfiles(args.profile).map((profile) => ({
    ...profile,
    command: commandFor(profile, args.baseUrl),
  }));

  return {
    audit: "pressure-test-matrix",
    status: "pass",
    mode: args.dryRun ? "dry-run" : "execute",
    baseUrl: args.baseUrl,
    profile: args.profile,
    completionRule:
      "Rows move to Done only after a live evidence packet is attached with command, environment, commit, latency/error/cost summary, and rerun decision.",
    profiles,
  };
}

function printHuman(payload) {
  console.log(`# ${payload.audit}`);
  console.log(`mode: ${payload.mode}`);
  console.log(`baseUrl: ${payload.baseUrl}`);
  console.log("");

  for (const profile of payload.profiles) {
    console.log(`## ${profile.row} - ${profile.title}`);
    console.log(`profile: ${profile.name}`);
    console.log(`command: ${profile.command}`);
    console.log("evidence:");
    for (const item of profile.evidence) console.log(`- ${item}`);
    console.log("");
  }
}

function executeProfile(profile, baseUrl) {
  const command = commandFor(profile, baseUrl);
  const result = spawnSync(command, {
    shell: true,
    stdio: "inherit",
    env: process.env,
  });

  return {
    profile: profile.name,
    status: result.status === 0 ? "pass" : "fail",
    exitCode: result.status,
  };
}

const args = parseArgs(process.argv.slice(2));
const payload = manifest(args);

if (args.json) {
  console.log(JSON.stringify(payload, null, 2));
} else {
  printHuman(payload);
}

if (!args.dryRun) {
  const results = selectedProfiles(args.profile).map((profile) => executeProfile(profile, args.baseUrl));
  if (results.some((result) => result.status === "fail")) {
    process.exitCode = 1;
  }
}
