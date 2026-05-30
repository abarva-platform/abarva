import { getAzureReadFluentClient } from "@/lib/data-plane/postgresCompat";
import { connection } from "next/server";
import Link from "next/link";
import type { EvidenceLedgerRow, EvidenceSurface } from "@/lib/evidence/ledger";
import { resolveCitationRow } from "@/lib/evidence/citations";

export const metadata = {
  title: "Evidence Ledger | AbarVa",
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Search = {
  surface?: string;
  artifact_ref?: string;
  confidence?: string;
  stale?: string;
  ledger_id?: string;
};

export default async function EvidenceLedgerPage({
  searchParams,
}: {
  searchParams?: Promise<Search>;
}) {
  await connection();
  const params = searchParams ? await searchParams : {};
  const result = await loadEvidenceRows(params);

  return (
    <main style={pageStyle}>
      <header style={headerStyle}>
        <div>
          <div style={eyebrowStyle}>Trust moat</div>
          <h1 style={titleStyle}>Evidence Ledger</h1>
          <p style={subtitleStyle}>
            Tenant-scoped provenance for claims, metrics, recommendations, hard
            answers, and not-enough-data calls.
          </p>
        </div>
        <Link href="/admin/data-trust" style={buttonStyle}>
          Data trust
        </Link>
      </header>

      <section style={filtersStyle} aria-label="Evidence ledger filters">
        {filterLink("All", {})}
        {filterLink("Intelligence", { surface: "intelligence" })}
        {filterLink("Moves", { surface: "moves" })}
        {filterLink("Source", { surface: "source" })}
        {filterLink("Tower", { surface: "tower" })}
        {filterLink("Watchlist", { surface: "watchlist" })}
      </section>

      {result.error && (
        <section style={errorStyle}>
          <strong>Ledger unavailable:</strong> {result.error}
        </section>
      )}

      <section style={summaryStyle}>
        <Stat label="Rows" value={result.rows.length.toString()} />
        <Stat
          label="Not enough data"
          value={result.rows
            .filter((row) => row.not_enough_data_flag)
            .length.toString()}
        />
        <Stat
          label="High confidence"
          value={result.rows
            .filter(
              (row) => row.confidence >= 0.85 && !row.not_enough_data_flag,
            )
            .length.toString()}
        />
      </section>

      <section style={tableShellStyle}>
        <div style={tableHeaderStyle}>
          <span>Claim</span>
          <span>Source</span>
          <span>Confidence</span>
          <span>Freshness</span>
        </div>
        {result.rows.length === 0 ? (
          <div style={emptyStyle}>No evidence rows match this filter yet.</div>
        ) : (
          result.rows.map((row) => {
            const citation = resolveCitationRow(row);
            const freshnessLabel = toIsoString(row.freshness_at).slice(0, 10);
            return (
              <article
                key={row.id}
                id={row.id}
                style={{
                  ...rowStyle,
                  outline:
                    params.ledger_id === row.id ? "2px solid #175cd3" : "none",
                }}
              >
                <div>
                  <div style={claimStyle}>{row.claim_text}</div>
                  <div style={metaStyle}>
                    {row.surface} · {row.artifact_type} · {row.artifact_ref}
                  </div>
                </div>
                <div style={sourceStyle}>
                  <div>{citation.humanText}</div>
                  {row.source_quote && (
                    <blockquote style={quoteStyle}>
                      {row.source_quote}
                    </blockquote>
                  )}
                </div>
                <div>
                  <span style={badgeStyle(citation.confidenceLabel)}>
                    {citation.confidenceLabel}
                  </span>
                  <div style={metaStyle}>
                    {Math.round(row.confidence * 100)}%
                  </div>
                </div>
                <div style={metaStyle}>
                  {freshnessLabel}
                  {row.not_enough_data_flag && (
                    <div style={{ color: "#475467", marginTop: 6 }}>
                      {row.not_enough_data_reason ?? "Insufficient evidence."}
                    </div>
                  )}
                </div>
              </article>
            );
          })
        )}
      </section>
    </main>
  );
}

async function loadEvidenceRows(
  params: Search,
): Promise<{ rows: EvidenceLedgerRow[]; error?: string }> {
  try {
    let query = getAzureReadFluentClient()
      .from("evidence_ledger")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);

    if (isEvidenceSurface(params.surface))
      query = query.eq("surface", params.surface);
    if (params.artifact_ref)
      query = query.eq("artifact_ref", params.artifact_ref);
    if (params.confidence === "low") query = query.lt("confidence", 0.6);
    if (params.confidence === "high") query = query.gte("confidence", 0.85);

    const { data, error } = await query;
    if (error) return { rows: [], error: error.message };
    return { rows: (data ?? []) as EvidenceLedgerRow[] };
  } catch (error) {
    return {
      rows: [],
      error:
        error instanceof Error
          ? error.message
          : "Unknown evidence ledger load error",
    };
  }
}

function toIsoString(value: string | Date | null | undefined): string {
  if (!value) return new Date(0).toISOString();
  return value instanceof Date ? value.toISOString() : value;
}

function isEvidenceSurface(
  value: string | undefined,
): value is EvidenceSurface {
  return (
    value === "intelligence" ||
    value === "moves" ||
    value === "source" ||
    value === "tower" ||
    value === "watchlist"
  );
}

function filterLink(label: string, params: Record<string, string>) {
  const query = new URLSearchParams(params);
  const href =
    query.size > 0
      ? `/evidence-ledger?${query.toString()}`
      : "/evidence-ledger";
  return (
    <Link href={href} style={filterStyle}>
      {label}
    </Link>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div style={statStyle}>
      <div style={statValueStyle}>{value}</div>
      <div style={metaStyle}>{label}</div>
    </div>
  );
}

function badgeStyle(label: "high" | "medium" | "low" | "insufficient") {
  const color =
    label === "high"
      ? "#067647"
      : label === "medium"
        ? "#b54708"
        : label === "low"
          ? "#b42318"
          : "#475467";
  const background =
    label === "high"
      ? "#ecfdf3"
      : label === "medium"
        ? "#fffaeb"
        : label === "low"
          ? "#fef3f2"
          : "#f2f4f7";
  return {
    display: "inline-flex",
    borderRadius: 999,
    padding: "4px 9px",
    background,
    color,
    fontSize: 12,
    fontWeight: 800,
    textTransform: "capitalize",
  } as const;
}

const pageStyle = {
  padding: "32px",
  color: "#111827",
  background: "#f8f7f4",
  minHeight: "100vh",
} as const;
const headerStyle = {
  display: "flex",
  justifyContent: "space-between",
  gap: 24,
  alignItems: "flex-start",
  marginBottom: 24,
} as const;
const eyebrowStyle = {
  fontSize: 12,
  fontWeight: 800,
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  color: "#667085",
} as const;
const titleStyle = {
  margin: "6px 0 0",
  fontFamily: "Georgia, serif",
  fontSize: 44,
  lineHeight: 1.05,
} as const;
const subtitleStyle = {
  margin: "10px 0 0",
  maxWidth: 740,
  color: "#475467",
  fontSize: 16,
  lineHeight: 1.5,
} as const;
const buttonStyle = {
  border: "1px solid #111827",
  color: "#111827",
  background: "#fff",
  padding: "10px 14px",
  borderRadius: 6,
  fontWeight: 800,
  textDecoration: "none",
} as const;
const filtersStyle = {
  display: "flex",
  flexWrap: "wrap",
  gap: 8,
  marginBottom: 18,
} as const;
const filterStyle = {
  border: "1px solid #d0d5dd",
  background: "#fff",
  color: "#344054",
  padding: "8px 11px",
  borderRadius: 6,
  fontWeight: 700,
  textDecoration: "none",
  fontSize: 13,
} as const;
const errorStyle = {
  border: "1px solid #fecdca",
  background: "#fef3f2",
  color: "#b42318",
  padding: 14,
  borderRadius: 6,
  marginBottom: 18,
} as const;
const summaryStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: 12,
  marginBottom: 18,
} as const;
const statStyle = {
  background: "#fff",
  border: "1px solid #e4e7ec",
  borderRadius: 6,
  padding: 16,
} as const;
const statValueStyle = { fontSize: 26, fontWeight: 900 } as const;
const tableShellStyle = {
  background: "#fff",
  border: "1px solid #e4e7ec",
  borderRadius: 8,
  overflow: "hidden",
} as const;
const tableHeaderStyle = {
  display: "grid",
  gridTemplateColumns: "1.1fr 1.6fr 160px 180px",
  gap: 16,
  padding: "12px 16px",
  background: "#f2f4f7",
  color: "#475467",
  fontSize: 12,
  fontWeight: 900,
  textTransform: "uppercase",
  letterSpacing: "0.08em",
} as const;
const rowStyle = {
  display: "grid",
  gridTemplateColumns: "1.1fr 1.6fr 160px 180px",
  gap: 16,
  padding: 16,
  borderTop: "1px solid #e4e7ec",
} as const;
const claimStyle = { fontWeight: 800, lineHeight: 1.35 } as const;
const sourceStyle = { color: "#344054", lineHeight: 1.45 } as const;
const quoteStyle = {
  margin: "8px 0 0",
  borderLeft: "3px solid #175cd3",
  paddingLeft: 10,
  color: "#475467",
} as const;
const metaStyle = { color: "#667085", fontSize: 12, lineHeight: 1.4 } as const;
const emptyStyle = { padding: 24, color: "#667085" } as const;
