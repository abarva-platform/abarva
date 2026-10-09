/**
 * What `POST /api/v1/deliverables/generate-phase` owes the reader when a phase
 * build enqueued nothing at all.
 *
 * That route has eighteen exits. Seventeen of them carry an authored `detail`
 * sentence, because `PhaseApproveAndBuild` — the single product fetcher, mounted
 * both on the redesigned capture flow and on the legacy canvas — reads
 * `describeRequiredEvidenceRefusal(data) ?? data.detail ?? data.error ??
 * "HTTP " + status` and renders the result as the whole build outcome.
 *
 * The eighteenth is the one that fires when **not a single document reached the
 * queue**. Its body carries `queued: 0`, `total`, and a per-document `error`
 * string for every spec the route tried — and no `error` code and no `detail`.
 * So the ladder fell all the way through and the reader of the most complete
 * failure this route can have was told `HTTP 500`, while the partial failure
 * beside it (one document of six) answers 202 and names the one that failed in
 * its own row. The less there was to report, the less was reported.
 *
 * The per-document reasons were lost twice over, not once: the client only
 * renders `r.error` for a row whose status is `"error"`, and its catch resets
 * every row to `"idle"` before anything is drawn. Nothing logged them either —
 * each `createDeliverableRun` rejection is caught into a result and the route
 * returned without a `console.error` — so a total enqueue failure was silent on
 * the screen AND silent in the logs.
 *
 * ## Why two sentences and not one
 *
 * `queued === 0` is reachable from two enqueue paths that differ in what they
 * may have written, so one sentence would have to lie about one of them:
 *
 * - **`every_attempt_failed`** — the per-document loop. Each spec gets its own
 *   `createDeliverableRun`, which is a single insert that throws only when the
 *   insert itself errored. Every attempt throwing therefore means no run row
 *   exists: *nothing landed*, and pressing the control again cannot duplicate
 *   work.
 * - **`accepted_without_runs`** — P3's ordered batch. One
 *   `createSequentialDeliverableRunBatch` call inserts every row at once and
 *   returns them; this arm is reached when it returns **without throwing** and
 *   still yields no run for any index (`(data ?? [])` is the representable
 *   empty). The call reported success, so rows may well exist: this is a
 *   *cannot-know*, and telling the reader "nothing was queued" here would
 *   invite a second batch on top of a running one.
 *
 * The outcome is declared by the call site rather than sniffed out of the
 * result rows, so neither sentence can start describing the other path after a
 * refactor.
 *
 * ## What the sentences deliberately do not say
 *
 * Neither carries the underlying error text. Every other refusal this route
 * can give names something the reader controls — capture, evidence, an
 * unapproved option — so the reader's trained next move is to go and edit the
 * Move. For this one that move is wrong, and saying so is the useful half. The
 * raw reasons stay in the response body and go to `console.error`, where an
 * operator looks.
 */

/** The two ways a phase build can finish with nothing queued. */
export type PhaseBuildEnqueueOutcome =
  | "every_attempt_failed"
  | "accepted_without_runs";

/**
 * What each outcome can honestly claim about the queue.
 *
 * A `Record` over the union rather than a hand-written list: a third outcome
 * cannot be added without deciding this, because omitting a key is a compile
 * error.
 */
export const PHASE_BUILD_ENQUEUE_WRITE_STATE: Record<
  PhaseBuildEnqueueOutcome,
  "nothing_landed" | "cannot_know"
> = {
  every_attempt_failed: "nothing_landed",
  accepted_without_runs: "cannot_know",
};

const SENTENCE: Record<
  PhaseBuildEnqueueOutcome,
  (args: { phase: number; attempted: number }) => string
> = {
  every_attempt_failed: ({ phase, attempted }) =>
    `None of the ${attempted} document${attempted === 1 ? "" : "s"} P${phase} builds reached the build queue: every request to enqueue one was refused. ` +
    `Nothing was generated and nothing is running, so this phase's document list is unchanged and requesting the build again cannot duplicate work. ` +
    `Run Approve & Build once more. If it refuses again the build service is unavailable — this is not a gap in the Move, and nothing in the capture needs changing to clear it.`,
  accepted_without_runs: ({ phase, attempted }) =>
    `P${phase} is built as one ordered batch of ${attempted} document${attempted === 1 ? "" : "s"}, and the batch was accepted without reporting a single run to follow. ` +
    `Whether any document was queued cannot be read from here. ` +
    `Reload this phase and check its document list before running Approve & Build again, so a second batch is not started on top of one that is already running.`,
};

/** Every outcome, derived from the sentence map so a new member cannot be missed. */
export const PHASE_BUILD_ENQUEUE_OUTCOMES = Object.keys(
  SENTENCE,
) as PhaseBuildEnqueueOutcome[];

/** The named refusal code. One code: a reader cannot tell the two paths apart. */
export const PHASE_BUILD_NOT_QUEUED_ERROR = "phase_build_not_queued" as const;

export interface PhaseBuildNotQueuedRefusal {
  error: typeof PHASE_BUILD_NOT_QUEUED_ERROR;
  detail: string;
}

/**
 * The `error` + `detail` pair to merge into the `queued === 0` response.
 *
 * Spread over the existing body: it adds the two fields the client's ladder
 * reads and changes nothing else about what the route reports.
 */
export function phaseBuildNotQueuedRefusal(args: {
  phase: number;
  attempted: number;
  outcome: PhaseBuildEnqueueOutcome;
}): PhaseBuildNotQueuedRefusal {
  return {
    error: PHASE_BUILD_NOT_QUEUED_ERROR,
    detail: SENTENCE[args.outcome]({
      phase: args.phase,
      attempted: args.attempted,
    }),
  };
}
