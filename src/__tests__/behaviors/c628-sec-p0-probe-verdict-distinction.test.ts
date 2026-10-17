import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import yaml from "js-yaml";

/**
 * Item C-628 — a post-deploy security control that cannot reach its targets
 * must not be reported as the same red as one that probed and found a leak.
 *
 * The mechanism is that three outcomes collapse into two reported states. The
 * suite already exits 0 / 1 / 2 for clean / leak / misconfigured, and nothing
 * reads the distinction, so GitHub shows `failure` for the second and the
 * third alike. A run that executed nothing therefore looks exactly like a run
 * that executed everything and found a boundary open — and the unresolved
 * path is the path these runs take, so neither state gets acted on. Run ids
 * and the measured history are in the internal execution register.
 *
 * So the gate here is on the EMISSION, not on the configuration. Cases 1–3
 * pin that the three verdicts are distinct in token, annotation title and
 * severity; cases 4–5 drive the real bash suite to two different real
 * outcomes — no env at all, and a server that answers 200 to everything —
 * and assert each reaches its own verdict through the same wrapper; case 6
 * holds the workflow to routing through the emitter rather than calling the
 * suite bare, which is the shape the four months of red had.
 *
 * Case 5 needs independent truth for "a leak", and a stub that returns 200 to
 * every request is exactly that: it is not the thing under test, and every
 * probe in the suite expects 403/400/404, so all eight fail for a reason the
 * suite computes rather than one this test asserts.
 */

const repoRoot = path.resolve(__dirname, "../../..");
const EMITTER = "scripts/security/sec-p0-probe-verdict.mjs";
const SUITE = "tests/security/sec-p0-cross-tenant-probes.sh";
const WORKFLOW = ".github/workflows/sec-p0-post-deploy.yml";

type Emission = {
  verdict: string;
  title: string;
  severity: string;
  exit: number;
  stdout: string;
  summary: string;
};

function runEmitter(args: string[], env: Record<string, string> = {}): Emission {
  const summaryDir = mkdtempSync(path.join(tmpdir(), "c628-summary-"));
  const summaryFile = path.join(summaryDir, "summary.md");
  try {
    const result = spawnSync(
      process.execPath,
      [EMITTER, ...args],
      {
        cwd: repoRoot,
        encoding: "utf8",
        env: {
          ...process.env,
          ...env,
          GITHUB_STEP_SUMMARY: summaryFile,
        },
        timeout: 120_000,
      },
    );
    const stdout = `${result.stdout ?? ""}`;
    let summary = "";
    try {
      summary = readFileSync(summaryFile, "utf8");
    } catch {
      summary = "";
    }
    const verdict = /^SEC-P0 VERDICT: ([A-Z_]+)$/m.exec(stdout)?.[1] ?? "";
    const title = /::(?:error|notice|warning) title=([^:]+)::/.exec(stdout)?.[1] ?? "";
    const severity = /^SEC-P0 SEVERITY: ([a-z_]+)$/m.exec(stdout)?.[1] ?? "";
    return {
      verdict,
      title,
      severity,
      exit: result.status ?? -1,
      stdout,
      summary,
    };
  } finally {
    rmSync(summaryDir, { recursive: true, force: true });
  }
}

/** Env that makes the real suite refuse at configuration, with nothing inherited. */
const UNRESOLVABLE_ENV = {
  ABARVA_PROBE_BASE_URL: "",
  ABARVA_PROBE_SESSION: "",
  ABARVA_PROBE_COOKIE_HEADER: "",
  ABARVA_PROBE_OTHER_TENANT_ID: "",
};

describe("C-628 · SEC-P0 verdicts distinguish not-run from leak", () => {
  it("case 1: a misconfigured run and a leak do not share a verdict token", () => {
    const unresolved = runEmitter(["--from-exit", "2"]);
    const leak = runEmitter(["--from-exit", "1"]);
    const clean = runEmitter(["--from-exit", "0"]);

    expect(unresolved.verdict).toBe("NOT_RUN_CONFIG_UNRESOLVED");
    expect(leak.verdict).toBe("CROSS_TENANT_LEAK");
    expect(clean.verdict).toBe("PROBES_CLEAN");

    const tokens = [unresolved.verdict, leak.verdict, clean.verdict];
    expect(new Set(tokens).size).toBe(3);
  });

  it("case 2: the annotation title and severity differ too, so the run page differs", () => {
    const unresolved = runEmitter(["--from-exit", "2"]);
    const leak = runEmitter(["--from-exit", "1"]);

    expect(unresolved.title).not.toBe(leak.title);
    expect(unresolved.title).toMatch(/NOT RUN/);
    expect(leak.title).toMatch(/LEAK/);

    expect(unresolved.severity).toBe("not_run");
    expect(leak.severity).toBe("incident");
    expect(unresolved.severity).not.toBe(leak.severity);

    // The step summary carries the verdict, so it is readable without logs.
    expect(unresolved.summary).toContain("NOT_RUN_CONFIG_UNRESOLVED");
    expect(leak.summary).toContain("CROSS_TENANT_LEAK");
    expect(unresolved.summary).not.toContain("CROSS_TENANT_LEAK");
  });

  it("case 3: an unrecognised exit is its own not-run verdict, never a leak", () => {
    const unknown = runEmitter(["--from-exit", "7"]);

    expect(unknown.verdict).toBe("NOT_RUN_HARNESS_ERROR");
    expect(unknown.severity).toBe("not_run");
    expect(unknown.stdout).not.toContain("CROSS_TENANT_LEAK");
    // A harness error is still red: a control that did not run must be loud.
    expect(unknown.exit).not.toBe(0);
  });

  it("case 4: driving the real suite with unresolvable targets reaches the not-run verdict and exit 2", () => {
    const emission = runEmitter(["--run"], UNRESOLVABLE_ENV);

    expect(emission.verdict).toBe("NOT_RUN_CONFIG_UNRESOLVED");
    expect(emission.severity).toBe("not_run");
    expect(emission.exit).toBe(2);
    expect(emission.stdout).not.toContain("CROSS_TENANT_LEAK");
  });

  it("case 5: driving the same suite against a server that allows everything reaches the leak verdict and exit 1", () => {
    // The stub and the emitter both live in a CHILD process on purpose.
    // `spawnSync` blocks this process's event loop, so a stub server listening
    // here could never answer the suite's curl calls — the first draft of this
    // case hung for its whole timeout and read as the emitter failing.
    const harness = `
      const http = require("node:http");
      const { spawn } = require("node:child_process");
      const server = http.createServer((_req, res) => {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ ok: true, data: [] }));
      });
      server.listen(0, "127.0.0.1", () => {
        const { port } = server.address();
        const child = spawn(process.execPath, [${JSON.stringify(EMITTER)}, "--run"], {
          cwd: process.cwd(),
          env: {
            ...process.env,
            ABARVA_PROBE_BASE_URL: "http://127.0.0.1:" + port,
            ABARVA_PROBE_SESSION: "c628-not-a-real-session",
            ABARVA_PROBE_COOKIE_HEADER: "",
            ABARVA_PROBE_OTHER_TENANT_ID: "00000000-0000-4000-8000-00000000c628",
          },
        });
        let out = "";
        child.stdout.on("data", (chunk) => { out += chunk; });
        child.stderr.on("data", (chunk) => { out += chunk; });
        child.on("close", (code) => {
          server.close(() => {
            process.stdout.write("__C628__" + JSON.stringify({ code, out }) + "__C628__");
            process.exit(0);
          });
        });
      });
    `;

    const result = spawnSync(process.execPath, ["-e", harness], {
      cwd: repoRoot,
      encoding: "utf8",
      timeout: 120_000,
    });

    const payload = /__C628__([\s\S]*?)__C628__/.exec(result.stdout ?? "")?.[1];
    expect(payload).toBeDefined();
    const { code, out } = JSON.parse(payload as string) as {
      code: number;
      out: string;
    };

    // Independent truth: a server that answers 200 to everything is not the
    // thing under test, and all 8 probes expect a refusal, so the suite
    // computes the failure rather than this test asserting it.
    expect(out).toContain("Result: 0 passed, 8 failed");
    expect(code).toBe(1);
    expect(/^SEC-P0 VERDICT: ([A-Z_]+)$/m.exec(out)?.[1]).toBe("CROSS_TENANT_LEAK");
    expect(/^SEC-P0 SEVERITY: ([a-z_]+)$/m.exec(out)?.[1]).toBe("incident");
    expect(out).not.toContain("NOT_RUN_CONFIG_UNRESOLVED");
  }, 180_000);

  it("case 6: the workflow routes the suite through the emitter and does not call it bare", () => {
    const document = yaml.load(
      readFileSync(path.join(repoRoot, WORKFLOW), "utf8"),
    ) as {
      jobs: Record<string, { steps?: { name?: string; run?: string }[] }>;
    };

    const steps = Object.values(document.jobs).flatMap((job) => job.steps ?? []);
    const runs = steps.map((step) => step.run ?? "").filter(Boolean);
    expect(runs.length).toBeGreaterThan(0);

    const emitterSteps = runs.filter((run) => run.includes(EMITTER));
    expect(emitterSteps.length).toBeGreaterThan(0);

    // Every invocation of the suite goes through the emitter. A bare
    // A bare `bash tests/security/...` is the shape whose reds were identical.
    for (const run of runs) {
      if (!run.includes(SUITE)) continue;
      expect(run).toContain(EMITTER);
    }

    // The resolve step must not be the thing that decides the red: a bare
    // `exit 2` there never reaches the emitter.
    const resolveStep = steps.find((step) =>
      (step.name ?? "").toLowerCase().includes("resolve environment"),
    );
    expect(resolveStep).toBeDefined();
    const resolveRun = resolveStep?.run ?? "";
    for (const line of resolveRun.split("\n")) {
      if (!/^\s*exit\s+[1-9]/.test(line)) continue;
      throw new Error(
        `Resolve step exits non-zero on its own, bypassing the verdict emitter: ${line.trim()}`,
      );
    }
  });
});
