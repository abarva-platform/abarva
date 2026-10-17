"use client";

import { useState, type ReactNode } from "react";
import { getPhaseCaptureSections } from "@/lib/programs/phase-capture-contract";
import { resolveStepNextAction } from "@/lib/programs/step-page-model";
import {
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
import { P1ParticipantBindingForm } from "./P1ParticipantBindingForm";
import { p1ParticipantBindingsReady } from "@/lib/programs/p1-participant-binding";
import { demoSafeClientText } from "@/lib/client-config";

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
          disabled={!saved || host.charterBasis.busy === true}
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
        : `record ${pendingFieldRows.length} answers`;
    for (const row of pendingFieldRows.slice(1)) row.clause = null;
  }
  if (config.sponsorCheck && host.p1ParticipantBinding?.enabled) {
    const confirmed = p1ParticipantBindingsReady(
      host.p1ParticipantBinding.preview,
    );
    rows.push({
      id: "sponsor-role",
      eyebrow: "Operational contacts",
      rank: fields.length,
      subject: confirmed
        ? "Sponsor contact and lead confirmed"
        : "Confirm sponsor contact and lead",
      shortName: "sponsor contact and lead",
      state: confirmed ? "settled" : "decision",
      clause: "confirm the existing sponsor contact and lead",
      middle: (
        <P1ParticipantBindingForm
          control={host.p1ParticipantBinding}
          captureBusy={host.charterBasis?.busy}
        />
      ),
      actions: null,
    });
  } else if (config.sponsorCheck) {
    const sponsor = host.move.participants.find(
      (participant) =>
        participant.role.toLowerCase() === "sponsor" &&
        participant.declaredRoleOnly !== true,
    );
    const proposedSponsor = host.move.participants.find(
      (participant) =>
        participant.role.toLowerCase() === "sponsor" &&
        participant.declaredRoleOnly === true,
    );
    rows.push({
      id: "sponsor-role",
      eyebrow: "Participant role",
      rank: fields.length,
      subject:
        proposedSponsor && !sponsor
          ? "Sponsor participant needed"
          : "Sponsor assigned",
      shortName: "sponsor participant",
      state: sponsor ? "settled" : "decision",
      clause: "assign the sponsor participant role",
      middle: sponsor ? (
        <p>{sponsor.name} has the sponsor role on this Move.</p>
      ) : proposedSponsor ? (
        <p>
          {proposedSponsor.name} is stored as a proposed sponsor role. A role
          placeholder does not confirm a sponsor participant or human approval.
          Assign the sponsor participant role before continuing.
        </p>
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
    readySentence: config.sponsorCheck && host.p1ParticipantBinding?.enabled
      ? "The existing sponsor contact, lead and scope are recorded. Continue to Stakeholders and decision rights"
      : config.ready,
    emptySentence: `Record ${fields[0]?.label.toLowerCase() ?? "this step"}`,
  });
  const phaseBase = `/strategic-moves/${encodeURIComponent(host.move.id)}/phase/${host.phase}`;
  const page = (
    <MovesStepPage
      // The Move's name, as every other step page shows it; never its internal code.
      moveName={demoSafeClientText(host.move.name)}
      clientDisplayName={host.move.tenant.name}
      syntheticNote="Synthetic demo data"
      tabs={host.chrome.tabs}
      phases={host.chrome.phases}
      steps={host.chrome.steps}
      stepIndex={host.chrome.stepIndex}
      phaseCode={`P${host.phase}`}
      phaseName={host.phase === 0 ? "Originate" : "Charter"}
      title={config.title}
      intro={config.sponsorCheck && host.p1ParticipantBinding?.enabled
        ? "Confirm operational sponsor progress contact and lead separately from preserved signed roles and participant permissions."
        : config.intro}
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
    // The step title is an instruction ("Name success measures"), so it is not spliced into a sentence.
    briefing: "Review this step's saved answers and edit each field where needed. Existing drafts remain available for your review. I don't write figures.",
    actions: [],
    notesPanel: null,
  });
}
