import "server-only";

import { Document, Page, Path, Svg, Text, View, type DocumentProps } from "@react-pdf/renderer";
import { Fragment, type ReactElement } from "react";
import { COLORS } from "@/lib/design/design-tokens";
import { referenceSourceLine, type ReferenceBlock, type ReferenceCell, type ReferenceDeckSpec } from "./reference-deck-model";

const ink = COLORS.deckInk;
const paper = COLORS.cream;
const accent = "#9A2430";
const muted = COLORS.deckMuted;
const rule = COLORS.deckRule;
const display = (value: ReferenceCell) => typeof value === "string" ? value : value.display;

function PdfContents({ block }: { block: Extract<ReferenceBlock, { kind: "table" }> }) {
  return <View style={{ marginTop: 17 }}>{block.rows.map((row, index) => {
    const heading = display(row[0] ?? "").match(/^0?(\d+)\s+(.+)$/);
    return <View key={index} style={{ flexDirection: "row", minHeight: 48, marginBottom: 9, paddingBottom: 9,
      borderBottomWidth: index < block.rows.length - 1 ? 0.5 : 0, borderBottomColor: rule }}>
      <Text style={{ width: 43, fontSize: 26, fontFamily: "Times-Roman", color: accent }}>{heading?.[1] ?? String(index + 1)}</Text>
      <View style={{ width: 205, marginRight: 20 }}>
        <Text style={{ fontSize: 14, fontFamily: "Helvetica-Bold", color: ink }}>{heading?.[2] ?? display(row[0] ?? "")}</Text>
        <Text style={{ fontSize: 9, color: muted, marginTop: 7 }}>Slides {display(row[2] ?? "")}</Text>
      </View>
      <Text style={{ flex: 1, fontSize: 13, color: ink, marginTop: 3 }}>{display(row[1] ?? "")}</Text>
    </View>;
  })}</View>;
}

function PdfBlock({ block }: { block: ReferenceBlock }) {
  if (block.kind === "table") return (
    <View style={{ marginTop: 12, borderWidth: 0.5, borderColor: rule }}>
      {[block.columns, ...block.rows].map((row, index) => (
        <View key={index} style={{ flexDirection: "row", backgroundColor: index === 0 ? ink : block.decisiveRows?.includes(index - 1) ? "#EFEEEA" : "#FFFFFF" }}>
          {row.map((cell, column) => (
            <Text key={column} style={{ flex: 1, padding: 6, minHeight: 29, fontSize: row.length > 6 ? 8 : 10,
              borderRightWidth: column < row.length - 1 ? 0.5 : 0, borderBottomWidth: 0.5,
              borderColor: rule, color: index === 0 ? "#FFFFFF" : ink }}>
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
          <Text style={{ fontSize: 22, fontFamily: "Times-Roman", color: accent, marginTop: 7 }}>{display(item.value)}</Text>
          <Text style={{ fontSize: 9, color: ink, marginTop: 6 }}>{item.meaning}</Text>
        </View>
      ))}
    </View>
  );
  if (block.kind === "flow") {
    const columns = Math.ceil(block.nodes.length / 2);
    const twoRows = block.nodes.length > 4;
    const top = twoRows ? block.nodes.slice(0, columns).map((node, index) => ({ node, index }))
      : block.nodes.map((node, index) => ({ node, index }));
    const bottom = twoRows ? block.nodes.slice(columns).map((node, offset) => ({ node, index: columns + offset })).reverse() : [];
    const row = (items: { node: string; index: number }[], reverse = false) => <View style={{ flexDirection: "row", alignItems: "center", marginTop: 8 }}>
      {reverse && items.length < columns && <View style={{ flex: columns - items.length }} />}
      {items.map(({ node, index }, position) => <Fragment key={index}>
        <View style={{ flex: 1, backgroundColor: "#EFEEEA", padding: 12, minHeight: 70 }}>
          {twoRows && <Text style={{ fontSize: 8, color: accent }}>{String(index + 1).padStart(2, "0")}</Text>}
          <Text hyphenationCallback={(word) => [word]} style={{ fontSize: 11, color: ink, marginTop: 5 }}>{node}</Text>
        </View>
        {position < items.length - 1 && <Svg width={22} height={14} viewBox="0 0 22 14">
          <Path d={reverse ? "M20 7 H4 M9 2 L4 7 L9 12" : "M2 7 H18 M13 2 L18 7 L13 12"} stroke={accent} strokeWidth={1.5} fill="none" />
        </Svg>}
      </Fragment>)}
    </View>;
    return <View style={{ marginTop: 14 }}>
      {row(top)}
      {twoRows && <><Svg width={20} height={26} viewBox="0 0 20 26" style={{ alignSelf: "flex-end", marginRight: 95 }}>
        <Path d="M10 2 V20 M5 15 L10 20 L15 15" stroke={accent} strokeWidth={1.5} fill="none" />
      </Svg>{row(bottom, true)}</>}
      {block.annotation && <Text style={{ marginTop: 10, fontSize: 10, color: muted }}>{block.annotation}</Text>}
    </View>;
  }
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
  if (block.kind === "gap") return <View style={{ marginTop: block.compact ? 12 : 18, minHeight: block.compact ? 120 : 255,
    backgroundColor: "#EFEEEA", borderLeftWidth: 6, borderLeftColor: accent, padding: block.compact ? 14 : 25 }}>
    <Text style={{ fontSize: block.compact ? 17 : 22, fontFamily: "Times-Roman", color: ink }}>{block.title}</Text>
    <Text style={{ fontSize: block.compact ? 11 : 14, color: ink, marginTop: block.compact ? 10 : 22 }}>{block.detail}</Text>
    <Text style={{ fontSize: block.compact ? 9.5 : 11, color: accent, marginTop: block.compact ? 16 : 68 }}>TO CONFIRM  {block.nextAction}</Text>
  </View>;
  return <View style={{ marginTop: 13 }}>{block.lines.map((line, index) => <Text key={index} style={{ fontSize: 13, color: ink, marginBottom: 9 }}>{line}</Text>)}</View>;
}

/** Same governed spec as PPTX, laid out as in-memory landscape PDF pages. */
export function buildReferenceDeckPdf(spec: ReferenceDeckSpec): ReactElement<DocumentProps> {
  return <Document title={`${spec.useCase} · ${spec.edition} edition`} author="AbarVa">
    {spec.slides.map((slide, index) => {
      const dark = slide.archetype === "cover" || slide.archetype === "divider";
      return <Page key={index} size={[960, 540]} style={{ backgroundColor: dark ? ink : paper, padding: 45 }}>
        {slide.archetype === "cover" ? <>
          <Text style={{ fontSize: 11, color: "#FFFFFF" }}>VALUE PROPOSITION  /  {spec.edition.toUpperCase()} EDITION</Text>
          <Text style={{ fontSize: 38, color: "#FFFFFF", marginTop: 75, fontFamily: "Times-Roman" }}>{spec.useCase}</Text>
          <Text style={{ fontSize: 19, color: "#FFFFFF", marginTop: 35 }}>{slide.answer}</Text>
          <Text style={{ fontSize: 12, color: "#FFFFFF", marginTop: 48 }}>Sponsor: {spec.sponsorRole}</Text>
          <Text style={{ position: "absolute", bottom: 54, left: 45, right: 45, fontSize: 9, color: "#FFFFFF" }}>Discussion draft · {spec.monthYear}</Text>
          <Text style={{ position: "absolute", bottom: 31, left: 45, right: 45, fontSize: 9, color: "#FFFFFF" }}>Prepared by AbarVa · {spec.edition} edition</Text>
        </> : slide.archetype === "divider" ? <>
          <Text style={{ fontSize: 16, color: "#FFFFFF" }}>
            {String(Math.max(1, ["CONTEXT", "WHAT", "WHY", "VALIDATE", "HOW"].indexOf(slide.section === "CONFIRM" ? "VALIDATE" : slide.section ?? "CONTEXT") + 1)).padStart(2, "0")}  {slide.section ?? "CONTEXT"}
          </Text>
          <Text style={{ fontSize: 34, color: "#FFFFFF", marginTop: 68, fontFamily: "Times-Roman" }}>{slide.actionTitle}</Text>
          {slide.answer && <Text style={{ fontSize: 19, color: "#FFFFFF", marginTop: 30, fontFamily: "Times-Italic" }}>{slide.answer}</Text>}
          <View style={{ marginTop: 55 }}>
            <Text style={{ fontSize: 10, color: "#FFFFFF", marginBottom: 10 }}>IN THIS SECTION</Text>
            {slide.blocks.flatMap((block) => block.kind === "text" ? block.lines : []).map((line, lineIndex) =>
              <Text key={lineIndex} style={{ fontSize: 12, color: "#FFFFFF", marginBottom: 7 }}>{line}</Text>)}
          </View>
          <Text style={{ position: "absolute", bottom: 29, left: 45, right: 45, fontSize: 8, color: "#FFFFFF" }}>{spec.program} · Discussion draft · {index + 1}</Text>
        </> : <>
          <View style={{ flexDirection: "row", alignItems: "center", paddingBottom: 8, borderBottomWidth: 0.5, borderBottomColor: rule }}>
            <Text style={{ flex: 1, fontSize: 8, color: muted }}>{spec.useCase.toUpperCase()}</Text>
            <View style={{ flexDirection: "row", gap: 4 }}>
              {["CONTEXT", "WHAT", "WHY", spec.edition === "validation" ? "CONFIRM" : "VALIDATE", "HOW"].map((section) => <View key={section} style={{
                width: 64, padding: 4, borderRadius: 3, borderWidth: 0.5,
                borderColor: section === slide.section ? accent : rule,
                backgroundColor: section === slide.section ? accent : paper,
              }}><Text style={{ fontSize: 6.4, textAlign: "center", color: section === slide.section ? "#FFFFFF" : muted }}>{section}</Text></View>)}
            </View>
            <Text style={{ width: 48, marginLeft: 16, textAlign: "right", fontSize: 9, fontFamily: "Helvetica-Bold", color: ink }}>AbarVa</Text>
          </View>
          <Text style={{ fontSize: 24, color: ink, marginTop: 15, fontFamily: "Times-Roman" }}>{slide.actionTitle}</Text>
          {slide.blocks.map((block, blockIndex) => slide.archetype === "contents" && block.kind === "table"
            ? <PdfContents key={blockIndex} block={block} /> : <PdfBlock key={blockIndex} block={block} />)}
          <View style={{ position: "absolute", bottom: 48, left: 45, right: 45, minHeight: 42, padding: 10, backgroundColor: ink }}>
            <Text style={{ fontSize: 11, color: "#FFFFFF" }}>{slide.answerLabel?.toUpperCase() ?? "THE ANSWER"}: {slide.answer}</Text>
          </View>
          {slide.sourceIds?.length ? <Text style={{ position: "absolute", bottom: 29, left: 45, right: 45, fontSize: 8, color: muted }}>{referenceSourceLine(slide)}</Text> : null}
          <Text style={{ position: "absolute", bottom: 12, left: 45, right: 90, fontSize: 8, color: muted }}>{spec.program} · Discussion draft</Text>
          <Text style={{ position: "absolute", bottom: 12, right: 45, fontSize: 8, color: muted }}>{index + 1}</Text>
        </>}
      </Page>;
    })}
  </Document>;
}
