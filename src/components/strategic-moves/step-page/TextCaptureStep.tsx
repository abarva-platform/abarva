"use client";

import { useState, type ReactNode } from "react";
import { getPhaseCaptureSections } from "@/lib/programs/phase-capture-contract";
import { resolveStepNextAction } from "@/lib/programs/step-page-model";
import {
  captureTextStepNotes,
  hasUncitedPlanningFigure,
  parseCaptureTextStepRecord,
  type CaptureTextStepEntry,
} from "@/lib/programs/capture-text-step-record";
import { isBusinessChangeAssessmentComplete } from "@/lib/programs/solution-route-assessment";
import type { StepPageHostProps } from "./phase-step-pages";
import { useStepEvidence } from "./StepEvidence";
import { MovesStepPage, SourceLine, type StepPageRow } from "./MovesStepPage";
import { BusinessChangeAssessmentForm } from "../BusinessChangeAssessmentForm";
import { CharterBasisField } from "../CharterBasisField";
import styles from "./MovesStepPage.module.css";

const cx = (...names: string[]) =>
  names.map((name) => styles[name] ?? name).join(" ");

export interface TextCaptureStepConfig {
  view: string;
  stepId: string;
  recordKey: string;
  title: string;
  intro: string;
  ready: string;
  fields: readonly string[];
  evidence?: boolean;
  showArchetype?: boolean;
  sponsorCheck?: boolean;
  planningFigures?: boolean;
  charterBasis?: boolean;
}

function fieldComplete(key: string, value: string): boolean {
  return key === "business_change_assessment"
    ? isBusinessChangeAssessmentComplete(value)
    : value.trim().length > 0;
}

export function TextCaptureStep({
  host,
  config,
}: {
  host: StepPageHostProps;
  config: TextCaptureStepConfig;
}) {
  const sections = getPhaseCaptureSections(host.phase);
  const fields = config.fields.map((key) => {
    const section = sections.find((item) => item.key === key);
    if (!section) throw new Error(`Missing capture section ${key}`);
    return section;
  });
  const record = parseCaptureTextStepRecord(
    host.values[config.recordKey] ?? "",
  );
  const [editors, setEditors] = useState<Record<string, string>>({});
  const [edited, setEdited] = useState<ReadonlySet<string>>(new Set());
  const [notes, setNotes] = useState("");
  const [reply, setReply] = useState<string | null>(null);
  const [error, setError] = useState<Record<string, string>>({});
  const evidence = useStepEvidence({
    moveId: host.move.id,
    phase: host.phase,
    canReview: host.canApproveGates,
    onEvidenceChanged: () => window.location.reload(),
    uploadLabel: config.evidence ? "Upload evidence" : "Add session output",
  });
  const saveEntry = (key: string, entry: CaptureTextStepEntry) => {
    host.setValue(
      config.recordKey,
      JSON.stringify({
        version: 1,
        entries: { ...record.entries, [key]: entry },
      }),
    );
  };
  const save = (key: string, text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    if (config.planningFigures && hasUncitedPlanningFigure(trimmed)) {
      setError((before) => ({
        ...before,
        [key]:
          "Cite an Assumptions register row as [A:id] for this ESTIMATE before accepting it.",
      }));
      return;
    }
    if (key === "business_change_assessment" && !fieldComplete(key, trimmed)) {
      setError((before) => ({
        ...before,
        [key]:
          "Complete the structured business change assessment before accepting it.",
      }));
      return;
    }
    setError((before) => ({ ...before, [key]: "" }));
    host.setValue(key, trimmed);
    const previous = record.entries[key];
    saveEntry(key, {
      text: trimmed,
      source: !edited.has(key) && previous ? previous.source : "team",
      status: "accepted",
      ...(!edited.has(key) && previous?.citation
        ? { citation: previous.citation }
        : {}),
    });
    setEditors((before) => {
      const next = { ...before };
      delete next[key];
      return next;
    });
    setEdited((before) => {
      const next = new Set(before);
      next.delete(key);
      return next;
    });
  };
  const fillFromNotes = () => {
    const occupied = Object.fromEntries(
      fields.map((field) => [
        field.key,
        host.values[field.key] ||
          editors[field.key] ||
          record.entries[field.key]?.text ||
          "",
      ]),
    );
    const proposals = captureTextStepNotes(notes, fields, occupied);
    const count = Object.keys(proposals).length;
    if (count)
      host.setValue(
        config.recordKey,
        JSON.stringify({
          version: 1,
          entries: { ...record.entries, ...proposals },
        }),
      );
    setReply(
      count
        ? `Filled ${count} empty ${count === 1 ? "field" : "fields"} from your notes as drafts. Existing words were left alone. Accept each draft to save it as the team's answer.`
        : "Nothing open matched a labelled note. Existing words were left alone.",
    );
  };
  const rows: StepPageRow[] = fields.map((field, index) => {
    const accepted = host.values[field.key] ?? "";
    const proposal = record.entries[field.key];
    const local = editors[field.key];
    const answered = fieldComplete(field.key, accepted);
    const editing = answered && local !== undefined;
    const text = local ?? (answered ? accepted : (proposal?.text ?? ""));
    const saved = host.captureSaved?.[field.key] ?? true;
    const complete =
      answered &&
      saved &&
      (!config.charterBasis || (host.sectionReady?.[field.key] ?? true));
    const draft = !answered && Boolean(proposal?.text) && local === undefined;
    const state =
      complete && !editing ? "settled" : draft ? "draft" : "decision";
    const source = edited.has(field.key) ? "team" : proposal?.source;
    const body: ReactNode =
      answered && !editing ? (
        <>
          <p className={cx("item-name")}>
            {field.key === "business_change_assessment"
              ? "Structured assessment recorded"
              : accepted}
          </p>
          {record.entries[field.key]?.status === "accepted" &&
          record.entries[field.key]?.source === "notes" ? (
            <span className={cx("item-note")}>
              Session notes · accepted by you ·{" "}
              {record.entries[field.key]?.citation}
            </span>
          ) : null}
          {record.entries[field.key]?.status === "accepted" &&
          record.entries[field.key]?.source === "team" ? (
            <span className={cx("item-note")}>
              Your capture answer · accepted
            </span>
          ) : null}
          {!complete ? (
            <p className={cx("item-note")}>
              {saved
                ? "The answer is saved. Its charter basis or required evidence is still open."
                : "The answer is still saving. Continue after it is stored."}
            </p>
          ) : null}
        </>
      ) : field.key === "business_change_assessment" ? (
        <>
          {editing ? (
            <p className={cx("item-note")}>
              The saved answer remains in effect until you save changes.
            </p>
          ) : null}
          <BusinessChangeAssessmentForm
            value={text}
            onChange={(value) => {
              setEditors((before) => ({ ...before, [field.key]: value }));
              setEdited((before) => new Set(before).add(field.key));
            }}
          />
          {error[field.key] ? <p role="alert">{error[field.key]}</p> : null}
        </>
      ) : (
        <>
          {editing ? (
            <p className={cx("item-note")}>
              The saved answer remains in effect until you save changes.
            </p>
          ) : null}
          {draft && source === "notes" ? (
            <SourceLine
              source={{
                kind: "team",
                text: "Session notes · review",
                cite: proposal?.citation,
              }}
            />
          ) : null}
          {draft && source === "ava" ? (
            <span className={cx("item-note")}>Ava draft · review</span>
          ) : null}
          {draft && source === "team" ? (
            <span className={cx("item-note")}>
              Your capture answer · review
            </span>
          ) : null}
          {!draft && text.trim() ? (
            <span className={cx("item-note")}>
              Your capture answer · review
            </span>
          ) : null}
          <textarea
            aria-label={field.label}
            className={cx("q-input")}
            rows={3}
            placeholder={field.example ?? "Write the team's answer here."}
            value={text}
            onChange={(event) => {
              setEditors((before) => ({
                ...before,
                [field.key]: event.target.value,
              }));
              setEdited((before) => new Set(before).add(field.key));
            }}
          />
          {error[field.key] ? <p role="alert">{error[field.key]}</p> : null}
        </>
      );
    const basis =
      config.charterBasis && host.charterBasis?.active ? (
        <CharterBasisField
          sectionKey={field.key}
          value={host.charterBasis.values[field.key] ?? null}
          approvedSources={host.charterBasis.approvedSources[field.key] ?? []}
          emptyValue={!accepted.trim()}
          saveError={host.charterBasis.errors[field.key] ?? null}
          onChange={(next) => host.charterBasis?.setValue(field.key, next)}
        />
      ) : null;
    return {
      id: field.key,
      eyebrow: field.label,
      rank: index,
      subject: field.label,
      shortName: field.label.toLowerCase(),
      state,
      clause: editing
        ? `finish editing ${field.label.toLowerCase()}`
        : answered && !complete
          ? `complete the basis for ${field.label.toLowerCase()}`
          : `record ${field.label.toLowerCase()}`,
      draftName: `the ${field.label.toLowerCase()} draft`,
      facts: config.planningFigures
        ? [
            {
              kind: "est",
              text: "Any planning figure must cite an Assumptions register row [A:id].",
            },
          ]
        : undefined,
      middle: (
        <>
          {body}
          {basis}
        </>
      ),
      wide: field.key === "business_change_assessment" || Boolean(basis),
      actions: editing ? (
        <>
          <button
            type="button"
            className={cx("btn-ink")}
            disabled={!text.trim()}
            onClick={() => save(field.key, text)}
          >
            Save changes
          </button>
          <button
            type="button"
            className={cx("link-btn")}
            onClick={() => {
              setEditors((before) => {
                const next = { ...before };
                delete next[field.key];
                return next;
              });
              setEdited((before) => {
                const next = new Set(before);
                next.delete(field.key);
                return next;
              });
              setError((before) => ({ ...before, [field.key]: "" }));
            }}
          >
            Cancel
          </button>
        </>
      ) : answered ? (
        <button
          type="button"
          className={cx("link-btn")}
          onClick={() => {
            setEditors((before) => ({ ...before, [field.key]: accepted }));
          }}
        >
          Edit
        </button>
      ) : (
        <button
          type="button"
          className={cx("btn-ink")}
          disabled={!text.trim()}
          onClick={() => save(field.key, text)}
        >
          {draft ? "Accept" : "Save"}
        </button>
      ),
    };
  });
  if (config.evidence && !host.p0SourceEvidenceReady) {
    rows.push({
      id: "p0-source-evidence",
      eyebrow: "Evidence requirement",
      rank: fields.length,
      subject: "P0 source evidence",
      shortName: "reviewed source evidence",
      state: "decision",
      clause: "review a P0 source file",
      middle: (
        <p>
          One uploaded P0 source file must be reviewed and covered before
          origination approval.
        </p>
      ),
      actions: evidence.uploadControl,
    });
  }
  const pendingFieldRows = rows.filter(
    (row) =>
      config.fields.includes(row.id) &&
      row.state === "decision" &&
      typeof row.clause === "string" &&
      row.clause.startsWith("record "),
  );
  if (pendingFieldRows.length > 1) {
    pendingFieldRows[0].clause =
      pendingFieldRows.length === 2
        ? `record ${pendingFieldRows[0].shortName} and ${pendingFieldRows[1].shortName}`
        : `record ${pendingFieldRows[0].shortName} and ${pendingFieldRows.length - 1} more answers`;
    for (const row of pendingFieldRows.slice(1)) row.clause = null;
  }
  if (config.sponsorCheck) {
    const sponsor = host.move.participants.find(
      (participant) => participant.role.toLowerCase() === "sponsor",
    );
    rows.push({
      id: "sponsor-role",
      eyebrow: "Participant role",
      rank: fields.length,
      subject: "Sponsor assigned",
      shortName: "sponsor participant",
      state: sponsor ? "settled" : "decision",
      clause: "assign the sponsor participant role",
      middle: sponsor ? (
        <p>{sponsor.name} has the sponsor role on this Move.</p>
      ) : (
        <p>
          A sponsor contact answer does not assign a Move participant. Users
          &amp; Access can provision a participant; the sponsor role must then
          be assigned separately before the P1 gate.
        </p>
      ),
      actions: sponsor ? null : (
        <a className={cx("link-btn")} href="/admin/users-access">
          Open Users &amp; Access →
        </a>
      ),
    });
  }
  if (config.evidence) rows.unshift(...evidence.rows);
  const blockedBy =
    evidence.loaded && !evidence.readable
      ? "Wait for the evidence review status to be read"
      : null;
  const nextAction = resolveStepNextAction({
    depth: "full",
    rows,
    blockedBy,
    readySentence: config.ready,
    emptySentence: `Record ${fields[0]?.label.toLowerCase() ?? "this step"}`,
  });
  const phaseBase = `/strategic-moves/${encodeURIComponent(host.move.id)}/phase/${host.phase}`;
  const notesPanel = (
    <div className={cx("warn-inline")}>
      <label className={cx("q-label")} htmlFor={`${config.view}-notes`}>
        Paste labelled session notes
      </label>
      <textarea
        id={`${config.view}-notes`}
        className={cx("q-input")}
        rows={5}
        value={notes}
        onChange={(event) => setNotes(event.target.value)}
        placeholder={fields.map((field) => `${field.label}: …`).join("\n")}
      />
      <button type="button" className={cx("btn-ink")} onClick={fillFromNotes}>
        Fill this step from my notes
      </button>
      {reply ? <p role="status">{reply}</p> : null}
    </div>
  );
  const page = (
    <MovesStepPage
      moveName={host.move.displayCode || host.move.name}
      clientDisplayName={host.move.tenant.name}
      syntheticNote="Synthetic demo data"
      tabs={host.chrome.tabs}
      phases={host.chrome.phases}
      steps={host.chrome.steps}
      stepIndex={host.chrome.stepIndex}
      phaseCode={`P${host.phase}`}
      phaseName={host.phase === 0 ? "Originate" : "Charter"}
      title={config.title}
      intro={config.intro}
      nextAction={nextAction}
      blockedLink={
        blockedBy
          ? { label: "Open evidence →", href: `${phaseBase}?legacy=1` }
          : undefined
      }
      blockedWork={
        blockedBy ? (
          <div className={cx("warn-inline")}>
            <p>
              Saved answers and drafts are kept while evidence status is
              unavailable.
            </p>
            {fields
              .filter((field) => editors[field.key] !== undefined)
              .map((field) => (
                <label key={field.key} className={cx("q-label")}>
                  {field.label}
                  <textarea
                    className={cx("q-input")}
                    value={editors[field.key]}
                    onChange={(event) =>
                      setEditors((before) => ({
                        ...before,
                        [field.key]: event.target.value,
                      }))
                    }
                  />
                </label>
              ))}
          </div>
        ) : undefined
      }
      context={{
        items: [
          "Full depth",
          config.showArchetype
            ? `Archetype: ${host.move.archetype}`
            : "Team capture",
          config.evidence ? evidence.summary : "Session notes",
        ],
        details: [],
      }}
      contextAction={evidence.uploadControl}
      rows={rows}
      carry={
        config.planningFigures
          ? {
              label: "Assumptions",
              text: (
                <a href={`${phaseBase}?legacy=1#assumption-register-title`}>
                  Open the Assumptions register to add or verify [A:id]
                  references →
                </a>
              ),
            }
          : undefined
      }
      onBack={
        host.chrome.stepIndex > 0
          ? () =>
              window.location.assign(
                host.chrome.steps[host.chrome.stepIndex - 1]?.href ?? phaseBase,
              )
          : undefined
      }
      onContinue={() =>
        window.location.assign(
          host.chrome.steps[host.chrome.stepIndex + 1]?.href ?? phaseBase,
        )
      }
    />
  );
  return host.dock(page, {
    briefing: `I read the saved ${config.title.toLowerCase()} answers and left your existing words alone. Paste labelled session notes to fill empty fields as drafts. Drafts stay drafts until you accept them. I don't write figures.`,
    actions: [
      {
        id: `${config.view}-fill`,
        label: "Fill this step from my notes",
        onClick: fillFromNotes,
      },
    ],
    notesPanel,
  });
}
