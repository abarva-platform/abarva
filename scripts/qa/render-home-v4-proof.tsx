#!/usr/bin/env npx tsx
/**
 * Renders every v4 chapter for both tenants to static HTML, from the real golden snapshots.
 *
 * This exists because two real defects on this workstream were caught only by looking at rendered
 * output and would have passed any test written against the source: an SVG fill silently
 * overridden by a CSS class, and a total double-counted across parent and child nodes. Types and
 * unit tests confirm the code does what it says; only rendering confirms the page is legible.
 *
 * Deliberately not a screenshot test. The output is for a person to open and read.
 *
 * Usage: npx tsx scripts/qa/render-home-v4-proof.tsx [--out-dir <dir>]
 */

import fs from "node:fs";
import path from "node:path";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { ChapterPage } from "../../src/components/home/v4/ChapterPage";
import { splitChapterIntoBands } from "../../src/components/home/v4/chapter-bands";
import type { HomeReviewBundle } from "../../src/lib/home/preview/types";

const OUT_DIR = (() => {
  const i = process.argv.indexOf("--out-dir");
  return i > -1 ? process.argv[i + 1] : "/tmp/home-v4-proof";
})();

const SNAPSHOT_DIR = path.join(process.cwd(), "src/lib/home/preview/golden-snapshots");

const SHELL = (title: string, body: string) => `<!doctype html>
<html><head><meta charset="utf-8"><title>${title}</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500;600&display=swap">
<style>html,body{margin:0;padding:0;background:#faf7f1;}*{box-sizing:border-box;}</style>
</head><body><div style="font-family:Inter,system-ui,sans-serif;font-size:16px;line-height:1.6;color:#000;max-width:1180px;">${body}</div></body></html>`;

fs.mkdirSync(OUT_DIR, { recursive: true });
const index: string[] = [];

for (const file of fs.readdirSync(SNAPSHOT_DIR).filter((f) => f.endsWith(".json"))) {
  const tenantKey = file.replace(/\.json$/, "");
  const bundle = JSON.parse(fs.readFileSync(path.join(SNAPSHOT_DIR, file), "utf8")) as HomeReviewBundle;
  const signalPacket = bundle.thesis.signalPacket;
  const visualDatasets = signalPacket.visualDatasets ?? {};

  bundle.chapters.forEach((chapter, i) => {
    const bands = splitChapterIntoBands(chapter, signalPacket);
    const html = renderToStaticMarkup(
      React.createElement(ChapterPage, {
        chapter,
        chapterNumber: i + 1,
        signalPacket,
        visualDatasets,
      }),
    );
    const name = `${tenantKey}--${chapter.chapterId}.html`;
    fs.writeFileSync(path.join(OUT_DIR, name), SHELL(`${tenantKey} · ${chapter.title}`, html));
    index.push(
      `<li><a href="${name}">${tenantKey} · ${chapter.title}</a> ` +
        `<code>record ${bands.record.length} · follows ${bands.follows.length} · exposures ${bands.exposures.length} · gaps ${bands.gaps.length} · questions ${bands.questions.length}</code></li>`,
    );
  });
}

fs.writeFileSync(
  path.join(OUT_DIR, "index.html"),
  SHELL("Home v4 proof renders", `<div style="padding:40px 56px;"><h1 style="font-family:Fraunces,Georgia,serif;font-weight:500;">Home v4 — every chapter, both tenants</h1><ul style="line-height:2;">${index.join("")}</ul></div>`),
);

console.log(`Wrote ${index.length} chapter renders to ${OUT_DIR}`);
