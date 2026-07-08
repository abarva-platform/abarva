import "server-only";

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  type DocumentProps,
} from "@react-pdf/renderer";
import type { ReactElement } from "react";

import { isVisibleAvaArtifact } from "@/lib/ava-answer/renderable-artifacts";
import { sanitizeAvaAnswerForRender } from "@/lib/intelligence/answer/answer-safety";
import type {
  AnswerChart,
  AnswerTable,
  AvaAnswerPacket,
} from "@/lib/ava-answer/contract";

const styles = StyleSheet.create({
  page: {
    padding: 36,
    fontFamily: "Helvetica",
    color: "#111827",
    backgroundColor: "#ffffff",
  },
  eyebrow: {
    fontSize: 8,
    letterSpacing: 1.4,
    textTransform: "uppercase",
    color: "#166534",
    fontWeight: 700,
    marginBottom: 6,
  },
  title: {
    fontSize: 20,
    fontFamily: "Helvetica-Bold",
    marginBottom: 8,
  },
  meta: {
    fontSize: 8,
    color: "#6b7280",
    marginBottom: 16,
  },
  prose: {
    fontSize: 10,
    lineHeight: 1.55,
    marginBottom: 12,
  },
  card: {
    borderColor: "#dedacf",
    borderWidth: 1,
    borderRadius: 4,
    padding: 10,
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    marginBottom: 8,
  },
  row: {
    flexDirection: "row",
    borderBottomColor: "#e5e1d8",
    borderBottomWidth: 0.5,
  },
  headerCell: {
    flex: 1,
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: "#6b7280",
    padding: 5,
    textTransform: "uppercase",
  },
  cell: {
    flex: 1,
    fontSize: 8,
    padding: 5,
  },
  quadrantGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    borderColor: "#111827",
    borderWidth: 1,
  },
  quadrant: {
    width: "50%",
    minHeight: 92,
    padding: 8,
    borderColor: "#dedacf",
    borderWidth: 0.5,
  },
  quadrantTitle: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    marginBottom: 4,
  },
  bullet: {
    fontSize: 8,
    marginBottom: 3,
  },
  note: {
    fontSize: 8,
    color: "#6b7280",
    marginTop: 6,
  },
});

function text(value: unknown): string {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function paragraphs(value: string): string[] {
  return value
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

function tableBlock(table: AnswerTable): ReactElement {
  return (
    <View style={styles.card} wrap={false}>
      <Text style={styles.cardTitle}>{table.title ?? "Table"}</Text>
      <View style={styles.row}>
        {table.columns.slice(0, 5).map((column) => (
          <Text key={column.key} style={styles.headerCell}>
            {column.label}
          </Text>
        ))}
      </View>
      {table.rows.slice(0, 16).map((row, rowIndex) => (
        <View key={rowIndex} style={styles.row}>
          {table.columns.slice(0, 5).map((column) => (
            <Text key={column.key} style={styles.cell}>
              {text(row[column.key]) || "-"}
            </Text>
          ))}
        </View>
      ))}
      {table.note ? <Text style={styles.note}>{table.note}</Text> : null}
    </View>
  );
}

function quadrantPoints(chart: AnswerChart): Array<{ label: string; x: number; y: number }> {
  const data = chart.data as { points?: unknown };
  if (!Array.isArray(data?.points)) return [];
  return data.points.flatMap((point) => {
    if (typeof point !== "object" || point === null) return [];
    const record = point as Record<string, unknown>;
    const label = text(record.label);
    const x = typeof record.x === "number" ? record.x : null;
    const y = typeof record.y === "number" ? record.y : null;
    return label && x !== null && y !== null ? [{ label, x, y }] : [];
  });
}

function chartBlock(chart: AnswerChart): ReactElement {
  if (chart.kind !== "quadrant-matrix") {
    return (
      <View style={styles.card} wrap={false}>
        <Text style={styles.cardTitle}>{chart.title ?? chart.kind}</Text>
        <Text style={styles.note}>
          This PDF preserves the chart as a governed exhibit summary. Use the
          HTML export for the full inline SVG chart.
        </Text>
      </View>
    );
  }
  const points = quadrantPoints(chart);
  const cells = [
    {
      title: "Quick wins",
      rows: points.filter((point) => point.y >= 50 && point.x < 50),
    },
    {
      title: "Strategic bets",
      rows: points.filter((point) => point.y >= 50 && point.x >= 50),
    },
    {
      title: "Monitor",
      rows: points.filter((point) => point.y < 50 && point.x < 50),
    },
    {
      title: "Defer",
      rows: points.filter((point) => point.y < 50 && point.x >= 50),
    },
  ];
  return (
    <View style={styles.card} wrap={false}>
      <Text style={styles.cardTitle}>{chart.title ?? "Value / Complexity Matrix"}</Text>
      <View style={styles.quadrantGrid}>
        {cells.map((cell) => (
          <View key={cell.title} style={styles.quadrant}>
            <Text style={styles.quadrantTitle}>{cell.title}</Text>
            {cell.rows.length > 0 ? (
              cell.rows.map((point) => (
                <Text key={point.label} style={styles.bullet}>
                  {point.label}
                </Text>
              ))
            ) : (
              <Text style={styles.note}>No ranked item</Text>
            )}
          </View>
        ))}
      </View>
    </View>
  );
}

export function buildAvaAnswerPdf(
  answer: AvaAnswerPacket,
): ReactElement<DocumentProps> {
  const display = sanitizeAvaAnswerForRender(answer);
  const artifacts = display.artifacts.filter(isVisibleAvaArtifact);
  const charts = artifacts.filter((artifact) => artifact.artifact === "chart");
  const tables = artifacts.filter((artifact) => artifact.artifact === "table");
  const generatedAt = new Date().toISOString();

  return (
    <Document
      title={`aVa answer export - ${display.tenantKey}`}
      author="AbarVa"
      creator="AbarVa"
      producer="AbarVa"
    >
      <Page size="LETTER" style={styles.page}>
        <Text style={styles.eyebrow}>aVa Intelligence Export</Text>
        <Text style={styles.title}>{display.question}</Text>
        <Text style={styles.meta}>
          {display.tenantKey} | {display.status} | {display.quality.confidence} confidence | {generatedAt}
        </Text>
        {paragraphs(display.directAnswer).map((paragraph, index) => (
          <Text key={index} style={styles.prose}>
            {paragraph}
          </Text>
        ))}
        {charts.map((chart) => (
          <View key={chart.id}>{chartBlock(chart)}</View>
        ))}
        {tables.map((table) => (
          <View key={table.id}>{tableBlock(table)}</View>
        ))}
      </Page>
    </Document>
  );
}
