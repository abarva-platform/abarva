"use client";
import { useEffect, useRef, useState } from "react";
import {
  P5_MEASUREMENT_PLAN_KEY,
  P5MeasurementPlanSchema,
  P5HandoffViewSchema,
  readP5MeasurementPlan,
  type P5HandoffView,
  type P5MeasurementPlan,
  type P5MeasurementRow,
} from "@/lib/programs/p5-measurement-plan";
import styles from "./MovesStepPage.module.css";

async function readResponse(
  response: Response,
  moveId: string,
): Promise<P5HandoffView> {
  const body = await response.json();
  if (!response.ok)
    throw new Error(
      body.detail ?? "The handoff could not be read. Its state is unknown.",
    );
  const read = P5HandoffViewSchema.safeParse(body);
  if (!read.success || read.data.programId !== moveId)
    throw new Error(
      "The handoff response does not match this Move. No publication is claimed.",
    );
  return read.data;
}

const fields = [
  ["sourceReference", "Baseline source reference"],
  ["comparator", "Comparator and cohort"],
  ["method", "Measurement method"],
  ["firstReviewTrigger", "First review trigger"],
  ["exclusionRules", "Exclusions and double-credit rules"],
  ["openConditions", "Open conditions"],
] as const;

const emptyMeasure = (leverId: string): P5MeasurementRow => ({
  leverId,
  ownerUserId: "",
  ownerRole: "",
  sourceReference: "",
  comparator: "",
  method: "",
  cadence: "monthly",
  firstReviewTrigger: "",
  exclusionRules: "",
  openConditions: "",
});

export function P5TowerHandoff({
  moveId,
  value,
  setValue,
  canAccept,
  onState,
}: {
  moveId: string;
  value: string;
  setValue: (key: string, value: string) => void;
  canAccept: boolean;
  onState?: (published: boolean) => void;
}) {
  const [view, setView] = useState<P5HandoffView | null>(null);
  const [measures, setMeasures] = useState<P5MeasurementRow[]>(
    () => readP5MeasurementPlan(value)?.measures ?? [],
  );
  const [detail, setDetail] = useState("Reading the current planned handoff…");
  const [busy, setBusy] = useState(false);
  const [edited, setEdited] = useState(false);
  const request = useRef(0);
  const onStateRef = useRef(onState);
  onStateRef.current = onState;
  const path = `/api/v1/programs/${encodeURIComponent(moveId)}/tower-handoff`;
  useEffect(() => {
    let live = true;
    const serial = ++request.current;
    fetch(path, { credentials: "include" })
      .then((response) => readResponse(response, moveId))
      .then((body) => {
        if (!live || serial !== request.current) return;
        setView(body);
        setDetail(body.detail);
        setMeasures(
          readP5MeasurementPlan(value)?.measures ??
            body.savedPlan?.measures ??
            body.levers.map((lever) => emptyMeasure(lever.leverId)),
        );
        onStateRef.current?.(body.publication.state === "published");
      })
      .catch((error) => {
        if (!live || serial !== request.current) return;
        setView(null);
        setDetail(error.message);
        onStateRef.current?.(false);
      });
    return () => {
      live = false;
    };
    // The keyed mount binds a read to one Move; edits are reviewed explicitly.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [moveId, path]);

  const plan: P5MeasurementPlan = {
    kind: "p5_measurement_handoff",
    version: 1,
    measures,
  };
  const validatedPlan = P5MeasurementPlanSchema.safeParse(plan);
  const matchesSaved =
    view?.savedPlan &&
    JSON.stringify(validatedPlan.success ? validatedPlan.data : null) ===
      JSON.stringify(view.savedPlan);
  const change = (index: number, update: Partial<P5MeasurementRow>) => {
    request.current++;
    setEdited(true);
    onStateRef.current?.(false);
    setView((current) =>
      current
        ? {
            ...current,
            binding: null,
            publication: { state: "not_yet_linked", rowIds: [] },
          }
        : null,
    );
    setDetail(
      "Save the edited measurement plan, then review the saved handoff.",
    );
    setMeasures((current) =>
      current.map((row, i) => (i === index ? { ...row, ...update } : row)),
    );
  };
  const review = async () => {
    const serial = ++request.current;
    setBusy(true);
    setView(null);
    onStateRef.current?.(false);
    try {
      const body = await readResponse(
        await fetch(path, { credentials: "include" }),
        moveId,
      );
      if (serial !== request.current) return;
      setView(body);
      setDetail(body.detail);
      setEdited(false);
      onStateRef.current?.(body.publication.state === "published");
    } catch (error) {
      if (serial === request.current)
        setDetail(
          error instanceof Error ? error.message : "Handoff read failed.",
        );
    } finally {
      if (serial === request.current) setBusy(false);
    }
  };
  const publish = async () => {
    if (!view?.binding || !matchesSaved) return;
    const binding = view.binding;
    const serial = ++request.current;
    setBusy(true);
    setView(null);
    onStateRef.current?.(false);
    try {
      const body = await readResponse(
        await fetch(path, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "accept_planned_handoff", binding }),
        }),
        moveId,
      );
      if (serial !== request.current) return;
      setView(body);
      setDetail(body.detail);
      onStateRef.current?.(body.publication.state === "published");
    } catch (error) {
      if (serial === request.current)
        setDetail(
          error instanceof Error
            ? error.message
            : "Handoff publication failed; read stored state.",
        );
    } finally {
      if (serial === request.current) setBusy(false);
    }
  };
  return (
    <div className={styles.field}>
      <p role="status" className={styles.proposal}>
        {detail}
      </p>
      <p className={styles["item-note"]}>
        ESTIMATE · Planned cash comes from the current deterministic P4 case.
        Baseline and realized value are unknown.
      </p>
      {measures.map((row, index) => (
        <details key={row.leverId} className={styles.field}>
          <summary>
            {view?.levers.find((lever) => lever.leverId === row.leverId)
              ?.name ?? row.leverId}{" "}
            · Measurement definition
          </summary>
          <label className={styles["q-label"]} htmlFor={`p5-owner-${index}`}>
            Receiving participant role
          </label>
          <select
            id={`p5-owner-${index}`}
            className={styles["q-input"]}
            value={`${row.ownerUserId}|${row.ownerRole}`}
            disabled={busy || !canAccept}
            onChange={(event) => {
              const owner = view?.owners.find(
                (item) => `${item.userId}|${item.role}` === event.target.value,
              );
              if (owner)
                change(index, {
                  ownerUserId: owner.userId,
                  ownerRole: owner.role,
                });
            }}
          >
            <option value="|">Choose a current Move participant</option>
            {view?.owners.map((owner) => (
              <option
                key={`${owner.userId}|${owner.role}`}
                value={`${owner.userId}|${owner.role}`}
              >
                {owner.role} · {owner.userId}
              </option>
            ))}
          </select>
          {fields.map(([key, label]) => (
            <div key={key}>
              <label
                className={styles["q-label"]}
                htmlFor={`p5-${key}-${index}`}
              >
                {label}
              </label>
              <textarea
                id={`p5-${key}-${index}`}
                className={styles["q-input"]}
                value={row[key]}
                disabled={busy || !canAccept}
                onChange={(event) =>
                  change(index, { [key]: event.target.value })
                }
              />
            </div>
          ))}
          <label className={styles["q-label"]} htmlFor={`p5-cadence-${index}`}>
            Review cadence
          </label>
          <select
            id={`p5-cadence-${index}`}
            className={styles["q-input"]}
            value={row.cadence}
            disabled={busy || !canAccept}
            onChange={(event) =>
              change(index, {
                cadence: event.target.value as P5MeasurementRow["cadence"],
              })
            }
          >
            {(["weekly", "monthly", "quarterly"] as const).map((cadence) => (
              <option key={cadence}>{cadence}</option>
            ))}
          </select>
        </details>
      ))}
      {!view?.binding || edited || !matchesSaved ? (
        <button
          type="button"
          className={styles["btn-ink"]}
          disabled={
            busy ||
            !canAccept ||
            !P5MeasurementPlanSchema.safeParse(plan).success
          }
          onClick={() => {
            if (!validatedPlan.success) return;
            setMeasures(validatedPlan.data.measures);
            setValue(
              P5_MEASUREMENT_PLAN_KEY,
              JSON.stringify(validatedPlan.data),
            );
            setDetail(
              "Measurement plan entered. Wait for capture to save, then review the saved handoff.",
            );
          }}
        >
          Save measurement plan
        </button>
      ) : null}
      <button
        type="button"
        className={styles["link-btn"]}
        disabled={busy}
        onClick={() => void review()}
      >
        Review saved handoff
      </button>
      {view?.binding && !edited && matchesSaved ? (
        <>
          <p className={`${styles["item-note"]} ${styles["handoff-proof"]}`}>
            Signed contract {view.binding.contractId} · version{" "}
            {view.binding.contractVersion} · SHA-256 {view.binding.contractHash}
          </p>
          <button
            type="button"
            className={styles["btn-ink"]}
            disabled={
              busy || !canAccept || view.publication.state === "published"
            }
            onClick={() => void publish()}
          >
            Accept planned Tower handoff
          </button>
        </>
      ) : null}
      {view?.publication.state === "published" && matchesSaved ? (
        <a
          className={styles["link-btn"]}
          href={`/tower?moveId=${encodeURIComponent(moveId)}`}
        >
          Read this Move in Tower
        </a>
      ) : null}
    </div>
  );
}

export function P5TowerPublicationReadback({ moveId }: { moveId: string }) {
  const [view, setView] = useState<P5HandoffView | null>(null);
  const [detail, setDetail] = useState("Reading this Move's planned handoff…");
  useEffect(() => {
    let live = true;
    setView(null);
    setDetail("Reading this Move's planned handoff…");
    fetch(`/api/v1/programs/${encodeURIComponent(moveId)}/tower-handoff`, {
      credentials: "include",
    })
      .then((response) => readResponse(response, moveId))
      .then((body) => {
        if (live) {
          setView(body);
          setDetail(body.detail);
        }
      })
      .catch((error) => {
        if (live) {
          setView(null);
          setDetail(error.message);
        }
      });
    return () => {
      live = false;
    };
  }, [moveId]);
  return (
    <section
      className={`${styles.root} ${styles["handoff-readback"]}`}
      aria-label="Move planned outcome handoff"
    >
      <h2 className={styles["q-label"]}>Planned outcome handoff</h2>
      <p className={styles.proposal} role="status">
        {detail}
      </p>
      <p className={styles["item-note"]}>
        Move {moveId} · ESTIMATE · Baseline and realized values unknown.
      </p>
      {view?.publication.state === "published" ? (
        <>
          {view.levers.map((lever) => (
            <p className={styles.proposal} key={lever.leverId}>
              {lever.name}: planned annual cash{" "}
              {lever.projectedUsd.toLocaleString("en-US", {
                style: "currency",
                currency: "USD",
              })}{" "}
              ·{" "}
              {
                view.savedPlan?.measures.find(
                  (row) => row.leverId === lever.leverId,
                )?.ownerRole
              }
            </p>
          ))}
          <p className={styles["item-note"]}>
            Contract {view.binding?.contractId} · v
            {view.binding?.contractVersion} · SHA-256{" "}
            {view.binding?.contractHash}
          </p>
          <p className={styles["item-note"]}>
            Ledger rows: {view.publication.rowIds.join(", ")}
          </p>
        </>
      ) : null}
    </section>
  );
}
