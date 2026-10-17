"use client";

// Setup → Rate cards: the workspace's own rates for Moves estimates.
//
// Load once, before any Move: download the template, upload the CSV, review
// every problem row and the change against the current version, then approve
// with a reason. Approving creates a new immutable version; Moves estimates
// approved on an earlier version keep those rates until they are re-approved.
// Nothing here prices anything — the preview route and the estimate do.

import { useRouter } from "next/navigation";
import { useState, type CSSProperties, type ReactNode } from "react";

import type { RateCardCodes } from "@/lib/pricing/moves-workflow/rom-reference";

export interface RateCardLineView {
  roleOrBandRef: string;
  level: string | null;
  providerRef: string | null;
  locationRef: string | null;
  unit: string;
  rateValue: number;
  currency: string;
}

export type RateCardRead =
  | {
      status: "ready";
      current: { version: number; approvedAt: string | null; approvalRationale: string | null } | null;
      lines: RateCardLineView[];
      history: { version: number; status: string; approvedAt: string | null }[];
    }
  | { status: "error" };

interface RowError {
  rowNumber: number;
  field?: string;
  code: string;
  message: string;
}

interface DiffLine extends RateCardLineView {
  identityKey: string;
}

interface Preview {
  currentVersion: number | null;
  parseErrors: RowError[];
  validationErrors: RowError[];
  validRowCount: number;
  diff: { added: DiffLine[]; changed: { before: DiffLine; after: DiffLine }[]; unchanged: DiffLine[]; removed: DiffLine[] };
  linesToCommit: Array<RateCardLineView & Record<string, unknown>>;
}

export const RATE_CARD_TEMPLATE_HEADER =
  "role_or_band_ref,level,provider_ref,location_ref,rate_basis,unit,rate_value,currency,valid_from,valid_to";

const HOURLY = new Set(["hour", "hours", "hr", "hrs", "hourly"]);
const isHourly = (unit: string) => HOURLY.has(unit.trim().toLowerCase());

const card: CSSProperties = {
  border: "1px solid rgba(15, 23, 42, 0.10)",
  borderRadius: 8,
  background: "#FFFFFF",
  padding: 20,
  display: "grid",
  gap: 12,
};
const label: CSSProperties = { fontSize: 11, letterSpacing: "0.06em", textTransform: "uppercase", color: "#64748B", fontWeight: 700 };
const muted: CSSProperties = { color: "#475569", fontSize: 14, margin: 0 };
const warn: CSSProperties = { background: "#FFF7E6", border: "1px solid #F1D9A6", borderRadius: 6, padding: "10px 12px", fontSize: 14, margin: 0 };
const bad: CSSProperties = { background: "#FDECEC", border: "1px solid #F3C2C2", borderRadius: 6, padding: "10px 12px", fontSize: 14, margin: 0 };
const good: CSSProperties = { background: "#E8F5EF", border: "1px solid #B9DFCB", borderRadius: 6, padding: "10px 12px", fontSize: 14, margin: 0 };
const button: CSSProperties = { padding: "8px 14px", borderRadius: 6, border: "1px solid #0F766E", background: "#0F766E", color: "#FFFFFF", fontWeight: 600, cursor: "pointer" };
const quiet: CSSProperties = { ...button, background: "#FFFFFF", color: "#0F766E" };

function money(value: number, currency: string): string {
  return `${currency === "USD" ? "$" : `${currency} `}${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function shortDate(iso: string | null): string {
  if (!iso) return "date not recorded";
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? iso
    : d.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
}

function LinesTable({ lines, testId }: { lines: RateCardLineView[]; testId: string }) {
  // Codes never wrap mid-code; on a narrow screen the table scrolls inside its card.
  const cell: CSSProperties = { padding: "6px 10px", borderBottom: "1px solid #E2E8F0", textAlign: "left", fontSize: 13, whiteSpace: "nowrap" };
  return (
    <div style={{ overflowX: "auto" }}>
      <table data-testid={testId} style={{ borderCollapse: "collapse", width: "100%", fontVariantNumeric: "tabular-nums" }}>
        <thead>
          <tr>
            {["Role or band", "Level", "Provider", "Location", "Unit", "Rate"].map((h) => (
              <th key={h} style={{ ...cell, ...label, borderBottom: "1px solid #CBD5E1" }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {lines.map((l, i) => (
            <tr key={`${l.roleOrBandRef}-${l.level}-${l.providerRef}-${l.locationRef}-${i}`}>
              <td style={cell}>{l.roleOrBandRef}</td>
              <td style={cell}>{l.level ?? "any"}</td>
              <td style={cell}>{l.providerRef ?? "any"}</td>
              <td style={cell}>{l.locationRef ?? "any"}</td>
              <td style={cell}>{l.unit}</td>
              <td style={{ ...cell, textAlign: "right" }}>{money(l.rateValue, l.currency)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Section({ title, children, testId }: { title: string; children: ReactNode; testId: string }) {
  return (
    <section style={card} data-testid={testId}>
      <h2 style={{ margin: 0, fontSize: 18 }}>{title}</h2>
      {children}
    </section>
  );
}

async function detailOf(res: Response, fallback: string): Promise<string> {
  try {
    const body = (await res.json()) as { detail?: unknown; error?: unknown };
    if (typeof body.detail === "string" && body.detail.trim()) return body.detail;
  } catch {
    /* no body */
  }
  return fallback;
}

export function RateCardManager({ tenantName, card: read, codes }: { tenantName: string; card: RateCardRead; codes: RateCardCodes }) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [busy, setBusy] = useState<"preview" | "approve" | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const [rationale, setRationale] = useState("");

  const downloadTemplate = () => {
    const url = URL.createObjectURL(new Blob([`${RATE_CARD_TEMPLATE_HEADER}\n`], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "client_rate_card.template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const runPreview = async () => {
    if (!file) return;
    setBusy("preview");
    setProblem(null);
    setDone(null);
    setPreview(null);
    try {
      const form = new FormData();
      form.set("file", file);
      const res = await fetch("/api/admin/pricing/rate-cards/import", { method: "POST", body: form });
      if (!res.ok) {
        setProblem(await detailOf(res, "The rate card could not be checked. Nothing was saved."));
        return;
      }
      const body = (await res.json()) as { preview?: Preview };
      if (!body.preview) {
        setProblem("The rate card check answered without a result. Nothing was saved.");
        return;
      }
      setPreview(body.preview);
    } catch {
      setProblem("The rate card check could not be reached. Nothing was saved.");
    } finally {
      setBusy(null);
    }
  };

  const errors = preview ? [...preview.parseErrors, ...preview.validationErrors].sort((a, b) => a.rowNumber - b.rowNumber) : [];
  const changes = preview ? preview.diff.added.length + preview.diff.changed.length + preview.diff.removed.length : 0;
  const nonHourly = preview ? preview.linesToCommit.filter((l) => !isHourly(String(l.unit))).length : 0;
  const approveBlocker = !preview
    ? "Check a file first."
    : errors.length > 0
      ? `Fix the ${errors.length} problem ${errors.length === 1 ? "row" : "rows"} and check the file again. A card is approved whole, never with rows left out.`
      : preview.linesToCommit.length === 0
        ? "The file has no rate lines."
        : changes === 0
          ? "This file matches the current card exactly; there is nothing to approve."
          : !rationale.trim()
            ? "Give a reason for the approval; it is recorded with the version."
            : null;

  const approve = async () => {
    if (!preview || approveBlocker) return;
    setBusy("approve");
    setProblem(null);
    try {
      const res = await fetch("/api/admin/pricing/rate-cards/ENTERPRISE/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lines: preview.linesToCommit, approvalRationale: rationale.trim() }),
      });
      if (!res.ok) {
        setProblem(await detailOf(res, "The rate card was not approved. Nothing was saved."));
        return;
      }
      const body = (await res.json()) as { result?: { action?: string; version?: number } };
      setDone(
        body.result?.action === "noop"
          ? `Nothing changed: this is already version ${body.result.version}.`
          : `Approved as version ${body.result?.version ?? "?"}. New Moves estimates price on it; approved estimates keep their rates until re-approved.`,
      );
      setPreview(null);
      setFile(null);
      setRationale("");
      router.refresh();
    } catch {
      setProblem("The approval could not be reached. Check this page again before retrying: it may have been saved.");
    } finally {
      setBusy(null);
    }
  };

  return (
    <main style={{ maxWidth: 1080, margin: "0 auto", padding: "32px 20px 64px", display: "grid", gap: 20 }} data-admin-rate-cards>
      <header style={{ display: "grid", gap: 6 }}>
        <div style={label}>Setup · {tenantName}</div>
        <h1 style={{ margin: 0, fontSize: 28 }}>Rate cards</h1>
        <p style={{ ...muted, maxWidth: "70ch" }}>
          Your own rates for Moves estimates: global integrators, boutiques, offshore providers and your internal staff, side by side.
          Load them once; every estimate in this workspace then prices on them. Roles you leave out use AbarVa reference rates.
        </p>
      </header>

      <Section title="Current card" testId="rate-card-current">
        {read.status === "error" ? (
          <p style={bad} role="alert" data-testid="rate-card-read-error">
            The current rate card could not be read. This does not mean no card is loaded. Reload the page to try again.
          </p>
        ) : read.current ? (
          <>
            <p style={muted}>
              Version {read.current.version}, approved {shortDate(read.current.approvedAt)} · {read.lines.length}{" "}
              {read.lines.length === 1 ? "line" : "lines"}
              {read.current.approvalRationale ? ` · “${read.current.approvalRationale}”` : ""}
            </p>
            <LinesTable lines={read.lines} testId="rate-card-current-lines" />
          </>
        ) : (
          <p style={muted} data-testid="rate-card-none">
            No rate card is loaded. Moves estimates in this workspace price on AbarVa reference rates.
          </p>
        )}
      </Section>

      <Section title="Load a new version" testId="rate-card-load">
        <p style={muted}>
          One row per rate. Use <code>provider_ref</code> to hold different rates for the same role by provider class, and{" "}
          <code>INTERNAL</code> for your own staff. Estimates price only hourly lines (<code>unit</code> = <code>hour</code>).
        </p>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <button type="button" style={quiet} onClick={downloadTemplate}>
            Download the template
          </button>
          <input
            type="file"
            accept=".csv,text/csv"
            aria-label="Rate card CSV"
            onChange={(e) => {
              setFile(e.target.files?.[0] ?? null);
              setPreview(null);
              setDone(null);
            }}
          />
          <button type="button" style={button} disabled={!file || busy !== null} onClick={() => void runPreview()}>
            {busy === "preview" ? "Checking…" : "Check the file"}
          </button>
        </div>

        {problem ? (
          <p style={bad} role="alert" data-testid="rate-card-problem">
            {problem}
          </p>
        ) : null}
        {done ? (
          <p style={good} role="status" data-testid="rate-card-done">
            {done}
          </p>
        ) : null}

        {preview ? (
          <div style={{ display: "grid", gap: 12 }} data-testid="rate-card-preview">
            <p style={muted} data-testid="rate-card-summary">
              {preview.validRowCount} valid {preview.validRowCount === 1 ? "line" : "lines"} · against{" "}
              {preview.currentVersion ? `version ${preview.currentVersion}` : "no current card"}: {preview.diff.added.length} added,{" "}
              {preview.diff.changed.length} changed, {preview.diff.removed.length} removed, {preview.diff.unchanged.length} unchanged.
            </p>
            {errors.length > 0 ? (
              <div style={bad} data-testid="rate-card-errors">
                <strong>
                  {errors.length} problem {errors.length === 1 ? "row" : "rows"}
                </strong>
                <ul style={{ margin: "6px 0 0", paddingLeft: 18 }}>
                  {errors.map((e, i) => (
                    <li key={`${e.rowNumber}-${e.code}-${i}`}>
                      Row {e.rowNumber}
                      {e.field ? ` (${e.field})` : ""}: {e.message}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            {preview.diff.removed.length > 0 ? (
              <p style={warn} data-testid="rate-card-removed">
                {preview.diff.removed.length} {preview.diff.removed.length === 1 ? "line" : "lines"} in the current card{" "}
                {preview.diff.removed.length === 1 ? "is" : "are"} not in this file. Approving removes{" "}
                {preview.diff.removed.length === 1 ? "it" : "them"}; those roles fall back to AbarVa reference rates.
              </p>
            ) : null}
            {nonHourly > 0 ? (
              <p style={warn} data-testid="rate-card-non-hourly">
                {nonHourly} {nonHourly === 1 ? "line is" : "lines are"} priced per day or year. Estimates never convert units, so those
                roles show as unpriced until an hourly line is added.
              </p>
            ) : null}
            {preview.diff.changed.length > 0 ? (
              <div>
                <div style={label}>Changed rates</div>
                <ul style={{ margin: "6px 0 0", paddingLeft: 18, fontSize: 14 }} data-testid="rate-card-changed">
                  {preview.diff.changed.map(({ before, after }) => (
                    <li key={after.identityKey}>
                      {[after.roleOrBandRef, after.level, after.providerRef, after.locationRef].filter(Boolean).join(" ")}:{" "}
                      {money(before.rateValue, before.currency)} → {money(after.rateValue, after.currency)} per {after.unit}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            <label style={{ display: "grid", gap: 6 }}>
              <span style={label}>Reason for approval</span>
              <textarea
                value={rationale}
                onChange={(e) => setRationale(e.target.value)}
                rows={2}
                maxLength={500}
                placeholder="For example: FY27 negotiated rates from the master services agreement"
                style={{ fontFamily: "inherit", fontSize: 14, padding: 8, borderRadius: 6, border: "1px solid #CBD5E1" }}
              />
            </label>
            <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
              <button
                type="button"
                style={{ ...button, opacity: approveBlocker || busy ? 0.5 : 1, cursor: approveBlocker || busy ? "not-allowed" : "pointer" }}
                disabled={approveBlocker !== null || busy !== null}
                onClick={() => void approve()}
              >
                {busy === "approve" ? "Approving…" : `Approve as version ${(preview.currentVersion ?? 0) + 1}`}
              </button>
              {approveBlocker ? (
                <span style={{ ...muted, fontSize: 13 }} data-testid="rate-card-approve-blocker">
                  {approveBlocker}
                </span>
              ) : null}
            </div>
          </div>
        ) : null}
      </Section>

      <Section title="Codes you can use" testId="rate-card-codes">
        <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}>
          {(
            [
              ["provider_ref", [...codes.providerClasses, { code: "INTERNAL", label: "Your own staff" }]],
              ["location_ref", codes.locations],
              ["level", codes.levels],
            ] as const
          ).map(([column, list]) => (
            <div key={column} style={{ minWidth: 0 }}>
              <div style={label}>{column}</div>
              <ul style={{ margin: "6px 0 0", paddingLeft: 0, listStyle: "none", fontSize: 13, display: "grid", gap: 2 }}>
                {list.map((c) => (
                  <li key={c.code}>
                    <code>{c.code}</code> · {c.label}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Section>

      {read.status === "ready" && read.history.length > 1 ? (
        <Section title="Version history" testId="rate-card-history">
          <ul style={{ margin: 0, paddingLeft: 18, fontSize: 14 }}>
            {read.history.map((h) => (
              <li key={h.version}>
                Version {h.version} · {h.status} · {shortDate(h.approvedAt)}
              </li>
            ))}
          </ul>
        </Section>
      ) : null}
    </main>
  );
}
