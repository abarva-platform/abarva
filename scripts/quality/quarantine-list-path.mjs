/**
 * Where a quarantine checker reads its list from.
 *
 * The Source quarantine ratchet suite used to exercise the checker by writing a
 * mutated `scripts/quality/source-integration-quarantine.json` into the working
 * tree and restoring it in a `finally`. `git status` stayed clean, so nothing
 * caught it — but `scripts/quality/test-ci-coverage-census.mjs` reads EVERY
 * `scripts/quality/*-quarantine.json` it finds, and it is one of roughly thirty
 * readers of that directory. Driven concurrently against a tree where that write
 * still happens, a census read 34 declared quarantined suites instead of 35 and
 * credited 51 declared quarantines instead of 52, with no error and no failed
 * gate; under contention the same window also produced 1,037 unreadable reads in
 * 224,012. Fewer exclusions read means coverage is over-credited, the same
 * direction as T-487.
 *
 * So a checker takes `--list <path>` and the suite points it at a scratch copy.
 *
 * An override that redirects a control is itself a hazard: a list path passed on
 * a CI command line would silently swap the file the gate judges. Two things
 * hold it shut. The default here is the committed path and nothing else, and the
 * ratchet suite asserts that every configured invocation of the checker — in
 * `package.json` and in the workflows — resolves through this function back to
 * that same committed file. The assertion is over the destination the real
 * argv reaches, not over the spelling of the command.
 */

/**
 * Resolve the list a checker should read.
 *
 * @param {string[]} argv     Arguments after the script name.
 * @param {string} defaultPath The committed list, used when `--list` is absent.
 * @returns {string} `--list`'s value when given, otherwise `defaultPath`.
 */
export function resolveQuarantineListPath(argv, defaultPath) {
  if (typeof defaultPath !== "string" || defaultPath.trim() === "") {
    throw new TypeError(
      "resolveQuarantineListPath needs the committed list as its default. " +
        "Without one, an absent --list would resolve to nothing and the " +
        "checker would read no list at all rather than the one it guards.",
    );
  }

  const args = Array.isArray(argv) ? argv : [];

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (typeof arg !== "string") continue;

    if (arg === "--list") {
      const value = args[index + 1];
      if (typeof value !== "string" || value.trim() === "" || value.startsWith("--")) {
        throw new Error("--list needs a path. Pass `--list <file>` or omit the flag.");
      }
      return value;
    }

    if (arg.startsWith("--list=")) {
      const value = arg.slice("--list=".length);
      if (value.trim() === "") {
        throw new Error("--list= needs a path. Pass `--list=<file>` or omit the flag.");
      }
      return value;
    }
  }

  return defaultPath;
}
