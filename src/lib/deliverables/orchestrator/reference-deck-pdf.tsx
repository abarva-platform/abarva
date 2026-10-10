import "server-only";

import { Document, Page, Text, View, type DocumentProps } from "@react-pdf/renderer";
import type { ReactElement } from "react";
import type { ReferenceBlock, ReferenceCell, ReferenceDeckSpec } from "./reference-deck-model";

const ink = "#17202B";
const paper = "#F8F7F3";
const accent = "#9A2430";
const muted = "#53606B";
const display = (value: ReferenceCell) => typeof value === "string" ? value : value.display;

function PdfBlock({ block }: { block: ReferenceBlock }) {
  if (block.kind === "table") return (
    <View style={{ marginTop: 12, borderWidth: 0.5, borderColor: "#D4D2CC" }}>
      {[block.columns, ...block.rows].map((row, index) => (
        <View key={index} style={{ flexDirection: "row", backgroundColor: index === 0 ? ink : block.decisiveRows?.includes(index - 1) ? "#EFEEEA" : "#FFFFFF" }}>
          {row.map((cell, column) => (
            <Text key={column} style={{ flex: 1, padding: 6, minHeight: 29, fontSize: row.length > 6 ? 8 : 10,
              borderRightWidth: column < row.length - 1 ? 0.5 : 0, borderBottomWidth: 0.5,
              borderColor: "#D4D2CC", color: index === 0 ? "#FFFFFF" : ink }}>
              {display(cell)}
            </Text>
          ))}
        </View>
      ))}
    </View>
  );
  if (block.kind === "metrics") return (
    <View style={{ flexDirection: "row", gap: 10, marginTop: 12 }}>
      {block.items.map((item, index) => (
        <View key={index} style={{ flex: 1, minHeight: 92, backgroundColor: "#EFEEEA", padding: 11 }}>
          <Text style={{ fontSize: 9, color: muted }}>{item.label.toUpperCase()}</Text>
          <Text style={{ fontSize: 22, color: accent, marginTop: 7 }}>{display(item.value)}</Text>
          <Text style={{ fontSize: 9, color: ink, marginTop: 6 }}>{item.meaning}</Text>
        </View>
      ))}
    </View>
  );
  if (block.kind === "flow") return (
    <View style={{ marginTop: 18 }}>
      <View style={{ flexDirection: "row", gap: 10 }}>
        {block.nodes.map((node, index) => <View key={index} style={{ flex: 1, backgroundColor: "#EFEEEA", padding: 16, minHeight: 62 }}><Text style={{ fontSize: 12, color: ink }}>{node}</Text></View>)}
      </View>
      {block.annotation && <Text style={{ marginTop: 10, fontSize: 10, color: muted }}>{block.annotation}</Text>}
    </View>
  );
  if (block.kind === "architecture") return (
    <View style={{ flexDirection: "row", gap: 6, marginTop: 16 }}>
      {block.layers.map((layer, index) => <View key={index} style={{ flex: 1, backgroundColor: "#EFEEEA", minHeight: 128, padding: 8 }}>
        <Text style={{ fontSize: 9, color: accent }}>{layer.name.toUpperCase()}</Text>
        <Text style={{ fontSize: 9, color: ink, marginTop: 8 }}>{layer.items.join("\n")}</Text>
      </View>)}
      <View style={{ flex: 1, backgroundColor: ink, minHeight: 128, padding: 8 }}><Text style={{ fontSize: 9, color: "#FFFFFF" }}>{block.governance}</Text></View>
    </View>
  );
  if (block.kind === "bars") {
    const max = Math.max(1, ...block.items.map((item) => item.magnitude));
    return <View style={{ marginTop: 12 }}>{block.items.map((item, index) => <View key={index} style={{ flexDirection: "row", alignItems: "center", marginBottom: 7 }}>
      <Text style={{ width: 110, fontSize: 10, color: ink }}>{item.label}</Text>
      <View style={{ flex: 1, height: 9, backgroundColor: "#EFEEEA" }}><View style={{ width: `${Math.max(0, item.magnitude / max) * 100}%`, height: 9, backgroundColor: accent }} /></View>
      <Text style={{ width: 95, textAlign: "right", fontSize: 10, color: ink }}>{item.value.display}</Text>
    </View>)}</View>;
  }
  if (block.kind === "timeline") return (
    <View style={{ marginTop: 16 }}>
      <View style={{ flexDirection: "row", marginBottom: 9 }}><Text style={{ width: 130, fontSize: 9 }}> </Text>{block.quarters.map((quarter, index) => <Text key={index} style={{ flex: 1, fontSize: 9, textAlign: "center", color: muted }}>{quarter}</Text>)}</View>
      {block.rows.map((row, index) => <View key={index} style={{ flexDirection: "row", marginBottom: 8 }}><Text style={{ width: 130, fontSize: 10, color: ink }}>{row.label}</Text>{block.quarters.map((_, q) => <View key={q} style={{ flex: 1, height: 18, backgroundColor: q >= row.from && q <= row.to ? ink : "#EFEEEA", marginRight: 4 }} />)}{row.cost && <Text style={{ width: 85, fontSize: 10, textAlign: "right" }}>{row.cost.display}</Text>}</View>)}
    </View>
  );
  if (block.kind === "gap") return <View style={{ marginTop: 18, minHeight: 255, backgroundColor: "#EFEEEA", borderLeftWidth: 6, borderLeftColor: accent, padding: 25 }}>
    <Text style={{ fontSize: 22, fontFamily: "Times-Roman", color: ink }}>{block.title}</Text>
    <Text style={{ fontSize: 14, color: ink, marginTop: 22 }}>{block.detail}</Text>
    <Text style={{ fontSize: 11, color: accent, marginTop: 68 }}>NEXT READ  {block.nextAction}</Text>
  </View>;
  return <View style={{ marginTop: 13 }}>{block.lines.map((line, index) => <Text key={index} style={{ fontSize: 13, color: ink, marginBottom: 9 }}>{line}</Text>)}</View>;
}

/** Same governed spec as PPTX, laid out as in-memory landscape PDF pages. */
export function buildReferenceDeckPdf(spec: ReferenceDeckSpec): ReactElement<DocumentProps> {
  return <Document title={`${spec.useCase} · ${spec.edition} edition`} author="AbarVa">
    {spec.slides.map((slide, index) => {
      const dark = slide.archetype === "cover" || slide.archetype === "divider";
      return <Page key={index} size={[960, 540]} style={{ backgroundColor: dark ? ink : paper, padding: 45 }}>
        <Text style={{ fontSize: 9, color: dark ? "#FFFFFF" : muted }}>{spec.useCase.toUpperCase()}  ·  {slide.section ?? spec.edition.toUpperCase()}</Text>
        <Text style={{ fontSize: dark ? 34 : 24, color: dark ? "#FFFFFF" : ink, marginTop: dark ? 75 : 26, fontFamily: "Times-Roman" }}>{slide.actionTitle}</Text>
        {slide.archetype !== "cover" && slide.archetype !== "divider" && <View style={{ marginTop: 14, padding: 8, backgroundColor: ink }}><Text style={{ fontSize: 10, color: "#FFFFFF" }}>{slide.answerLabel}: {slide.answer}</Text></View>}
        {slide.blocks.map((block, blockIndex) => <PdfBlock key={blockIndex} block={block} />)}
        <Text style={{ position: "absolute", bottom: 29, left: 45, right: 45, fontSize: 8, color: dark ? "#FFFFFF" : muted }}>
          {slide.sourceIds?.length ? `Sources: ${slide.sourceIds.join(" · ")}` : `${spec.program} · Discussion draft`}  ·  {index + 1}
        </Text>
      </Page>;
    })}
  </Document>;
}
