import "server-only";
import { join } from "node:path";
import {
  Document,
  Page,
  Text,
  View,
  Svg,
  G,
  Line,
  Circle,
  Rect,
  Polyline,
  Polygon,
  StyleSheet,
  Font,
  Link,
  type DocumentProps,
} from "@react-pdf/renderer";
import type { ReactElement } from "react";
import type { AvaArtifact } from "@/lib/ava-answer/contract";
import type { AvaChatSessionExport } from "./session-types";
import {
  chartPlot,
  graphPlot,
  matrixQuadrants,
} from "@/lib/intelligence/answer/model-exhibit-layout";
import { measureExecutiveAnswer } from "@/lib/intelligence/answer/model-authored-answer";

const fontDirectory = join(process.cwd(), "public", "fonts", "dejavu");
Font.register({
  family: "IntelligenceSans",
  fonts: [
    { src: join(fontDirectory, "DejaVuSans.ttf"), fontWeight: 400 },
    { src: join(fontDirectory, "DejaVuSans-Bold.ttf"), fontWeight: 700 },
  ],
});
Font.register({
  family: "IntelligenceMono",
  src: join(fontDirectory, "DejaVuSansMono.ttf"),
});

const styles = StyleSheet.create({
  page: {
    padding: 36,
    paddingBottom: 48,
    fontFamily: "IntelligenceSans",
    color: "#17281e",
    fontSize: 10,
  },
  eyebrow: { color: "#166534", fontSize: 8, marginBottom: 8 },
  title: { fontSize: 22, fontWeight: 700, marginBottom: 14 },
  heading: { fontSize: 13, fontWeight: 700, marginBottom: 10 },
  prose: { fontSize: 10, lineHeight: 1.5, marginBottom: 10 },
  meta: { fontSize: 8, lineHeight: 1.5, color: "#57534e", marginBottom: 12 },
  card: {
    borderWidth: 1,
    borderColor: "#d6d3d1",
    borderRadius: 4,
    padding: 12,
    marginBottom: 14,
  },
  row: { flexDirection: "row", borderBottomWidth: 1, borderColor: "#e7e5e4" },
  cell: { flex: 1, padding: 5, fontSize: 8, lineHeight: 1.4 },
  bold: { fontWeight: 700 },
  footer: {
    position: "absolute",
    bottom: 22,
    left: 36,
    right: 36,
    fontSize: 7,
    color: "#78716c",
  },
  raw: { fontSize: 7, lineHeight: 1.4, fontFamily: "IntelligenceMono" },
});

/** Formatting only; no public-language cleaner or content fallback. */
function proseBlocks(body: string) {
  return body.split(/\n\s*\n/).map((paragraph, i) => (
    <Text key={i} style={styles.prose}>
      {paragraph.split(/(\*\*[^*]+\*\*)/g).map((part, j) =>
        part.startsWith("**") && part.endsWith("**") ? (
          <Text key={j} style={styles.bold}>
            {part.slice(2, -2)}
          </Text>
        ) : (
          part
        ),
      )}
    </Text>
  ));
}

function exhibitBlock(a: AvaArtifact) {
  return (
    <View key={a.id} style={styles.card} wrap={a.artifact === "table"}>
      {a.title && (
        <Text style={styles.heading} minPresenceAhead={128}>
          {a.title}
        </Text>
      )}
      {a.artifact === "table" ? (
        <>
          <View style={styles.row} wrap={false}>
            {a.columns.map((c) => (
              <Text key={c.key} style={[styles.cell, styles.bold]}>
                {c.label}
              </Text>
            ))}
          </View>
          {a.rows.map((r, i) => (
            <View key={i} style={styles.row} wrap={false}>
              {a.columns.map((c) => (
                <Text key={c.key} style={styles.cell}>
                  {r[c.key] === null ? "" : String(r[c.key])}
                </Text>
              ))}
            </View>
          ))}
          {a.note && <Text style={styles.meta}>{a.note}</Text>}
        </>
      ) : a.artifact === "chart" ? (
        (() => {
          if (a.kind === "quadrant-matrix") {
            const quadrants = matrixQuadrants(a);
            return (
              <>
                {a.subtitle && <Text style={styles.meta}>{a.subtitle}</Text>}
                {[0, 2].map((offset) => (
                  <View key={offset} style={{ flexDirection: "row" }}>
                    {quadrants.slice(offset, offset + 2).map((q) => (
                      <View
                        key={`${q.x}-${q.y}`}
                        style={{
                          flex: 1,
                          borderWidth: 1,
                          borderColor: "#a7cdb2",
                          backgroundColor: "#f0f7f2",
                          padding: 8,
                          minHeight: 75,
                        }}
                      >
                        <Text style={[styles.meta, styles.bold]}>
                          {a.xKey}: {q.x} · {a.yKey}: {q.y}
                        </Text>
                        {q.rows.map((row, i) => (
                          <View key={i} style={{ marginBottom: 6 }}>
                            <Text style={[styles.cell, styles.bold]}>
                              {String(row.label)}
                            </Text>
                            {Object.entries(row)
                              .filter(
                                ([key]) =>
                                  !["label", a.xKey!, a.yKey!].includes(key),
                              )
                              .map(([key, value]) => (
                                <Text key={key} style={styles.cell}>
                                  {key}: {String(value ?? "")}
                                </Text>
                              ))}
                          </View>
                        ))}
                      </View>
                    ))}
                  </View>
                ))}
                {a.sourceNote && (
                  <Text style={styles.meta}>{a.sourceNote}</Text>
                )}
              </>
            );
          }
          const p = chartPlot(a);
          return (
            <>
              {a.subtitle && <Text style={styles.meta}>{a.subtitle}</Text>}
              <Svg
                viewBox={`0 0 ${p.width} ${p.height}`}
                width="100%"
                height={160}
              >
                <Line
                  x1={p.horizontal ? p.baselineX : 30}
                  x2={p.horizontal ? p.baselineX : 470}
                  y1={p.horizontal ? 10 : p.baseline}
                  y2={p.horizontal ? 200 : p.baseline}
                  stroke="#a8a29e"
                />
                {a.kind === "line" && (
                  <Polyline
                    points={p.points.map((v) => `${v.x},${v.y}`).join(" ")}
                    fill="none"
                    stroke="#166534"
                    strokeWidth={2}
                  />
                )}
                {p.points.map((v, i) => (
                  <G key={i}>
                    {a.kind === "line" ? (
                      <Circle cx={v.x} cy={v.y} r={4} fill="#166534" />
                    ) : (
                      <Rect
                        x={p.horizontal ? Math.min(v.x, p.baselineX) : v.x - 12}
                        y={p.horizontal ? v.y - 7 : Math.min(v.y, p.baseline)}
                        width={p.horizontal ? Math.abs(v.x - p.baselineX) : 24}
                        height={p.horizontal ? 14 : Math.abs(v.y - p.baseline)}
                        fill="#166534"
                      />
                    )}
                    <Text
                      x={p.horizontal ? v.x + 8 : v.x}
                      y={p.horizontal ? v.y + 3 : v.y - 8}
                      textAnchor="middle"
                      style={{ fontSize: 9 }}
                    >
                      {String(v.value)}
                    </Text>
                    <Text
                      x={p.horizontal ? 18 : v.x}
                      y={p.horizontal ? v.y + 3 : 193}
                      textAnchor="middle"
                      style={{ fontSize: 9 }}
                    >
                      {String(i + 1)}
                    </Text>
                  </G>
                ))}
              </Svg>
              {a.unit && <Text style={styles.meta}>{a.unit}</Text>}
              {p.points.map((v, i) => (
                <Text key={i} style={styles.meta}>
                  {i + 1}. {v.label}: {String(v.value)}
                </Text>
              ))}
              {a.sourceNote && <Text style={styles.meta}>{a.sourceNote}</Text>}
            </>
          );
        })()
      ) : (
        (() => {
          const p = graphPlot(a);
          return (
            <>
              <Svg
                viewBox={`0 0 ${p.width} ${p.height}`}
                width="100%"
                height={170}
              >
                {p.edges.map((e, i) => {
                  const angle = Math.atan2(
                    e.toNode.y - e.fromNode.y,
                    e.toNode.x - e.fromNode.x,
                  );
                  const x = e.toNode.x - Math.cos(angle) * 16,
                    y = e.toNode.y - Math.sin(angle) * 16;
                  return (
                    <G key={i}>
                      <Line
                        x1={e.fromNode.x}
                        y1={e.fromNode.y}
                        x2={x}
                        y2={y}
                        stroke="#78716c"
                      />
                      <Polygon
                        points={`${x},${y} ${x - Math.cos(angle - 0.5) * 9},${y - Math.sin(angle - 0.5) * 9} ${x - Math.cos(angle + 0.5) * 9},${y - Math.sin(angle + 0.5) * 9}`}
                        fill="#78716c"
                      />
                    </G>
                  );
                })}
                {p.nodes.map((n) => (
                  <G key={n.id}>
                    <Circle
                      cx={n.x}
                      cy={n.y}
                      r={16}
                      fill="#dcfce7"
                      stroke="#166534"
                    />
                    <Text
                      x={n.x}
                      y={n.y + 4}
                      textAnchor="middle"
                      style={{ fontSize: 12 }}
                    >
                      {String(n.index)}
                    </Text>
                  </G>
                ))}
              </Svg>
              {p.nodes.map((n) => (
                <Text key={n.id} style={styles.meta}>
                  {n.index}. {n.label}
                </Text>
              ))}
              {p.edges.map((e, i) => (
                <Text key={i} style={styles.meta}>
                  {e.fromNode.label} -&gt; {e.toNode.label}
                  {e.label ? `: ${e.label}` : ""}
                </Text>
              ))}
            </>
          );
        })()
      )}
    </View>
  );
}

export function buildModelAuthoredSessionPdf(
  session: AvaChatSessionExport,
): ReactElement<DocumentProps> {
  const responses = session.turns.filter((t) => t.role === "agent");
  const questions = session.turns.filter((t) => t.role === "user");
  const footer = (
    <Text
      style={styles.footer}
      fixed
      render={({ pageNumber, totalPages }) =>
        `Intelligence quality review | ${pageNumber} / ${totalPages}`
      }
    />
  );
  return (
    <Document
      title={session.title ?? "Intelligence answer review"}
      author="AbarVa"
      creator="AbarVa"
    >
      <Page size="LETTER" style={styles.page}>
        <Text style={styles.eyebrow}>INTELLIGENCE · ANSWER QUALITY REVIEW</Text>
        <Text style={styles.title}>
          {session.title ?? "Executive answer review"}
        </Text>
        <Text style={styles.meta}>
          {session.qualityReview?.startedAt ?? new Date().toISOString()}
        </Text>
        <Text style={styles.prose}>
          {session.qualityReview
            ? `${session.qualityReview.completedQuestions} of ${session.qualityReview.plannedQuestions} questions completed.`
            : `${responses.length} responses.`}{" "}
          Each answer is reproduced with its authored exhibits. Length checks
          are observations, not quality scores.
          {session.qualityReview?.includeOriginalResponses
            ? " The appendix retains the original model response including exhibit protocols."
            : ""}
        </Text>
        <Text style={styles.heading}>Review checklist</Text>
        <Text style={styles.prose}>
          Does the opening answer the decision? Are the reasons specific and
          sourced? Does the recommendation make economic or strategic sense? Are
          uncertainties explicit? Do the exhibits help the decision? Is the next
          action and validation gate clear?
        </Text>
        <View style={styles.row}>
          <Text style={[styles.cell, styles.bold]}>Question / status</Text>
          <Text style={[styles.cell, styles.bold]}>Opening words</Text>
          <Text style={[styles.cell, styles.bold]}>Prose words</Text>
          <Text style={[styles.cell, styles.bold]}>Exhibits</Text>
        </View>
        {responses.map((t, i) => {
          const m = measureExecutiveAnswer(t.body);
          return (
            <View key={t.id} style={styles.row}>
              <Text style={styles.cell}>
                {i + 1} / {t.reviewStatus ?? "complete"}
              </Text>
              <Text style={styles.cell}>
                {t.reviewStatus && t.reviewStatus !== "complete"
                  ? "—"
                  : `${m.openingWords}${m.openingWithinTarget ? "" : " (over 35)"}`}
              </Text>
              <Text style={styles.cell}>{m.proseWords}</Text>
              <Text style={styles.cell}>{t.answer?.artifacts.length ?? 0}</Text>
            </View>
          );
        })}
        {footer}
      </Page>
      {responses.map((t, i) => (
        <Page key={t.id} size="LETTER" style={styles.page}>
          <Text style={styles.eyebrow}>
            QUESTION {i + 1} · {t.reviewStatus ?? "complete"}
          </Text>
          <Text style={styles.heading}>
            {questions[i]?.body ?? t.answer?.question}
          </Text>
          <Text style={styles.meta}>{t.at}</Text>
          {proseBlocks(t.body)}
          {t.answer?.artifacts.map(exhibitBlock)}
          {(t.answer?.modelAuthored?.protocolIssues.length ?? 0) > 0 && (
            <View style={styles.card}>
              <Text style={styles.heading}>Rendering observations</Text>
              {t.answer!.modelAuthored!.protocolIssues.map((s, n) => (
                <Text key={n} style={styles.meta}>
                  {s}
                </Text>
              ))}
            </View>
          )}
          {t.answer?.citations.length ? (
            <View wrap={false}>
              <Text style={styles.heading}>Sources</Text>
              {t.answer.citations.map((c) => (
                <Text key={c.id} style={styles.meta}>
                  {c.url ? <Link src={c.url}>{c.label}</Link> : c.label}
                </Text>
              ))}
            </View>
          ) : null}
          {t.answer?.nextSteps.length ? (
            <View wrap={false}>
              <Text style={styles.heading}>Follow-up questions</Text>
              {t.answer.nextSteps.map((s) => (
                <Text key={s.id} style={styles.meta}>
                  {s.label}
                </Text>
              ))}
            </View>
          ) : null}
          {footer}
        </Page>
      ))}
      {session.qualityReview?.includeOriginalResponses &&
        responses
          .filter((t) => t.answer?.modelAuthored)
          .map((t) => (
            <Page key={`raw-${t.id}`} size="LETTER" style={styles.page}>
              <Text style={styles.eyebrow}>
                APPENDIX · ORIGINAL MODEL RESPONSE · {t.id}
              </Text>
              <Text style={styles.meta}>
                Transport payload retained for inspection. This is the complete
                original response, including exhibit and follow-up blocks.
              </Text>
              <Text style={styles.raw} hyphenationCallback={(word) => [word]}>
                {t.answer!.modelAuthored!.rawText}
              </Text>
              {footer}
            </Page>
          ))}
    </Document>
  );
}
