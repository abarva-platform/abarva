/**
 * Shared path disposition for QA filesystem verifiers.
 *
 * A QA report that reads the tree has to say what an ABSENT path means, and
 * there are only three honest answers:
 *
 *   - a named commit removed it            -> 'removed'
 *   - a named slice has not built it yet   -> 'deferred'
 *   - nobody has decided, and no commit on this history ever added or removed
 *     it                                   -> 'deferred', said out loud
 *
 * The fourth answer — guessing — is what this module exists to stop. T-521
 * found five months of "not yet present ... Deferred pending <SLICE> merge"
 * standing over files the legacy surface sunset had deleted, and built
 * BLUEPRINT_PATH_REGISTER + resolvePathStatus for one verifier. T-524 found
 * the same wording in a second, NOT-quarantined verifier, where one path
 * carried two contradictory dispositions at once:
 * src/components/intelligence/IntelligenceRouteShell.tsx was 'removed' in the
 * blueprint report and "a Wave-20 SHELL7 component ... not yet integrated" in
 * the route-shell report, on the same commit, in the same tree.
 *
 * T-527 found the third caller, and it needed an answer the first two did not
 * have. apex-source-program-storyline-verification reported three slices as
 * "Deferred pending <SLICE> integration" when all three are `code_complete` in
 * docs/build/build-slices.json and all three modules are on disk — under the
 * name the slice actually used, not the name the check guessed. The path is
 * absent and the work is done: that is 'superseded', and it resolves to a pass
 * only once the landing path has been OBSERVED, never on the register's word.
 *
 * That is why the mechanism lives here rather than being copied a third time,
 * and why dispositions that more than one verifier reads live in
 * SHARED_PATH_DISPOSITIONS: two registers cannot disagree about a path they
 * both take from the same entry.
 *
 * Every commit named in a disposition was derived with `git log origin/main`
 * and confirmed with `git merge-base --is-ancestor`. A `--all` reading
 * attributed a deletion to an unmerged commit during T-521 and had to be
 * corrected mid-PR; `--all` is not evidence about a branch.
 */

export type PathStatus =
  | 'pass'
  | 'fail'
  | 'deferred'
  | 'removed'
  | 'not_applicable';

/** A path that is gone on purpose, with the commit that removed it. */
export interface RetiredPath {
  /**
   * What the commit actually deleted.
   *
   * 'path' — the commit deleted this file.
   * 'containing-directory' — the file never appeared on this history at all,
   *   and the directory that would hold it was deleted by this commit. The
   *   distinction is not cosmetic: attributing a deletion to a commit that
   *   never held the file is the same class of false claim this register
   *   exists to stop, one level up.
   */
  scope: 'path' | 'containing-directory';
  /** Short SHA of the commit, on this branch's own history. */
  commit: string;
  /** The slice or change the deletion belongs to. */
  slice: string;
  /** What serves this purpose now, or null when nothing replaced it. */
  replacement: string | null;
  /** Why it went, in the words of the change that removed it. */
  note: string;
  /**
   * The commit that brought the file BACK, when one did.
   *
   * A retirement that was undone is still a fail — the register and the tree
   * disagree and somebody has to decide which is right. What changes is what
   * the reader is handed. Three of the ten paths T-528 measured are back on
   * the tree, two of them restored by one squashed merge, and the report said
   * only "still exists": the right verdict with none of the evidence,
   * which is the same defect one level up from the one this module was built
   * to stop.
   *
   * This is a claim about history, and the only observation available to a
   * filesystem verifier is presence — so the resolver reports it ONLY on the
   * present branch, where presence is exactly what a restoration asserts. An
   * absent path never repeats the claim, because there the tree contradicts
   * it. And an entry that omits this field while the file is present is told
   * so out loud rather than passed over, or the evidence-free verdict returns
   * for free in the next entry somebody writes.
   */
  restoredAt?: {
    /** Short SHA of the restoring commit, on this branch's own history. */
    commit: string;
    /** What the restoring change was doing when it brought the file back. */
    note: string;
  };
}

/** A path that has not been built yet, under a named slice. */
export interface PendingPath {
  slice: string;
  note: string;
}

/**
 * A path whose absence nobody has ruled on.
 *
 * This is NOT a softer 'pending'. A pending entry asserts that a named slice
 * is going to add the file; when no commit on this history has ever added or
 * removed it, that assertion is unearned, and writing it anyway is how
 * "deferred pending Wave-20 integration" came to stand over a route no wave
 * ever planned. An undecided entry says the true thing instead and names the
 * item that owns the decision, so the report stays green without the reader
 * being told something false.
 */
export interface UndecidedPath {
  /** Backlog item that owns the decision. */
  owner: string;
  note: string;
}

/**
 * A path that is absent because the work landed somewhere else.
 *
 * This is the opposite error from a stale 'pending', and it is the more
 * expensive one: a pending entry says a slice has not shipped, and a reader
 * who believes it merely waits. A check that guessed a filename, never found
 * it, and reported "pending" says a slice has not shipped when it HAS — the
 * reader is told to build something that already exists. Three checks in
 * apex-source-program-storyline-verification did exactly that for five months,
 * over LINK1, SRC33 and PROG15.
 *
 * `landedAt` is a claim about the tree, so the resolver observes it rather
 * than trusting it. An entry whose landing path is itself gone fails, which is
 * what makes this safe to leave in place after the slice is renamed again.
 */
export interface SupersededPath {
  /** The slice that shipped, as docs/build/build-slices.json names it. */
  slice: string;
  /** Where it actually landed. Verified by observation, not asserted. */
  landedAt: string;
  /** How the guessed name and the real one were reconciled. */
  note: string;
}

export interface PathDisposition {
  retired?: RetiredPath;
  pending?: PendingPath;
  undecided?: UndecidedPath;
  superseded?: SupersededPath;
}

export type PathDispositionRegister = Record<string, PathDisposition>;

/**
 * Dispositions read by more than one verifier.
 *
 * A register that needs one of these spreads it in rather than restating it,
 * so the two reports cannot drift apart the way they had by T-524.
 */
export const SHARED_PATH_DISPOSITIONS: PathDispositionRegister = {
  'src/components/intelligence/IntelligenceRouteShell.tsx': {
    retired: {
      scope: 'containing-directory',
      commit: '0c6a86c51',
      slice: 'legacy surface sunset (v1/v2/v3/v4)',
      replacement: null,
      note:
        'git log over this branch history finds no commit that added this file, ' +
        'so the check was written against a shell component that never landed ' +
        'here. What did exist is src/components/intelligence/, and the sunset ' +
        'removed it: twenty-odd components at 0c6a86c51 and the last two at ' +
        'd5e0ef495. Nothing wraps the surviving /intelligence route in a shell ' +
        'component.',
    },
  },
};

/**
 * Resolve one path to a status. Pure: the caller observes the filesystem, this
 * decides what the observation means.
 */
export function resolvePathStatus(
  rel: string,
  present: boolean,
  register: PathDispositionRegister,
  /**
   * The register's own name, so a failure tells the reader which file to edit.
   * Two registers share this resolver; "declare it in the register" sends the
   * reader looking. Defaulted rather than required so a fixture register in a
   * test need not name itself.
   */
  registerName = 'the register',
  /**
   * Observes whether another path exists, for dispositions that make a claim
   * about a second file. Only 'superseded' needs it; a register with no
   * superseded entry never calls it. Omitting it where one IS declared is a
   * failure rather than a default, because the whole point of the disposition
   * is that the landing path is checked and not taken on trust.
   */
  observePresent?: (rel: string) => boolean,
): { status: PathStatus; detail: string } {
  const disposition = register[rel];

  if (present) {
    if (disposition?.superseded) {
      const { slice, landedAt } = disposition.superseded;
      return {
        status: 'fail',
        detail:
          `${rel} is declared superseded by ${slice} at ${landedAt}, but the ` +
          'path is present. Two files now answer for one slice. Decide which ' +
          `is canonical and correct the ${registerName} entry.`,
      };
    }
    if (disposition?.retired) {
      const { commit, slice, restoredAt } = disposition.retired;
      const account = restoredAt
        ? `It came back at ${restoredAt.commit}: ${restoredAt.note}`
        : 'The return is unaccounted for — no commit is named for it. Measure ' +
          `it with git log on this branch and record it on the ${registerName} ` +
          'entry, so the next reader is not left to find it again';
      return {
        status: 'fail',
        detail:
          `${rel} is declared retired by ${commit} (${slice}) but the file is ` +
          `present. ${account}. Either the retirement was reverted, in which ` +
          `case remove the ${registerName} entry, or this is an unintended ` +
          'restoration. A register that disagrees with the tree is no better ' +
          'than a guess.',
      };
    }
    return { status: 'pass', detail: `Found: ${rel}` };
  }

  if (disposition?.retired) {
    const { scope, commit, slice, replacement, note } = disposition.retired;
    const lead =
      scope === 'path'
        ? `Removed by ${commit} (${slice}): ${rel}.`
        : `Absent: ${rel}. The path itself never appeared on this history; the ` +
          `directory that would hold it was removed by ${commit} (${slice}).`;
    return {
      status: 'removed',
      detail: `${lead} ${note} Replacement: ${replacement ?? 'none'}.`,
    };
  }

  if (disposition?.pending) {
    const { slice, note } = disposition.pending;
    return {
      status: 'deferred',
      detail: `${slice} pre-integration: not yet present at ${rel}. ${note}`,
    };
  }

  if (disposition?.superseded) {
    const { slice, landedAt, note } = disposition.superseded;
    if (!observePresent) {
      return {
        status: 'fail',
        detail:
          `${rel} is declared superseded by ${slice} at ${landedAt}, but ` +
          'resolvePathStatus was called without an observer, so the landing ' +
          'path was not checked. Pass one. A superseded entry that is taken ' +
          'on trust is the guess this register exists to stop.',
      };
    }
    if (!observePresent(landedAt)) {
      return {
        status: 'fail',
        detail:
          `${rel} is declared superseded by ${slice} at ${landedAt}, and ` +
          `${landedAt} is absent too. Neither path exists, so the slice ` +
          `cannot be shown to have shipped. Re-measure and correct the ` +
          `${registerName} entry.`,
      };
    }
    return {
      status: 'pass',
      detail:
        `${slice} is integrated. Absent at ${rel} — that name was never ` +
        `built; the slice landed at ${landedAt}, observed present. ${note}`,
    };
  }

  if (disposition?.undecided) {
    const { owner, note } = disposition.undecided;
    return {
      status: 'deferred',
      detail:
        `Absent at ${rel}, and no commit on this history has ever added or ` +
        `removed it. Nothing is pending: whether this path should exist is an ` +
        `open decision owned by ${owner}. ${note}`,
    };
  }

  return {
    status: 'fail',
    detail:
      `Absent at ${rel}, and nothing declares why. Declare it in ` +
      `${registerName} as retired (with the commit that removed it), pending ` +
      '(with the slice that adds it), undecided (with the item that owns the ' +
      'call), or superseded (with the path the slice actually landed at). An ' +
      'undeclared absence cannot be told apart from a deletion, ' +
      'and these reports spent five months calling one deletion "not yet ' +
      'present".',
  };
}
