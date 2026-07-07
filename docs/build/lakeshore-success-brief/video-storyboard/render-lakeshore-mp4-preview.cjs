#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");
const OpenAI = require("openai");

const ROOT = path.resolve(__dirname);
const OUT = path.join(ROOT, "render");
const AUDIO_DIR = path.join(OUT, "audio");
const CLIP_DIR = path.join(OUT, "clips");
const FPS = 30;
const WIDTH = 1600;
const HEIGHT = 900;
const PAD_SECONDS = 1.15;
const DEFAULT_VOICE = "nova";
const VOICE_INSTRUCTIONS =
  "Warm, empathetic, confident female executive narrator. Pronounce AbarVa as one word, 'uh-BAR-vuh' or 'Abarva'; never say 'A bar V A' or isolate the A. Natural pacing, slight sympathy for implementation risk, no hype.";

const scenes = [
  {
    id: "01",
    title: "Opening Thesis",
    image: "assets/01-opening.png",
    text: "AI success for Lakeshore is not a chatbot. It is a governed execution layer for treasury, vendors, risk, decisions, and measurable value.",
    x: 900,
    y: 470,
    zoom: 1.15,
    target: "product pillars and proof metrics",
  },
  {
    id: "02",
    title: "Lakeshore Operating Profile",
    image: "assets/02-profile.png",
    text: "Abarva starts with Lakeshore's facts: operating platforms, revenue baseline, people, systems, vendors, banks, and board priorities. Context comes before AI.",
    x: 800,
    y: 505,
    zoom: 1.10,
    target: "planning profile metrics and company cards",
  },
  {
    id: "03",
    title: "Federated Complexity",
    image: "assets/03-operating-map.png",
    text: "The complexity is the product opportunity: sponsor decisions, HoldCo autonomy, PortCo systems, CXO ownership, contracts, CMDB, and process evidence.",
    x: 750,
    y: 470,
    zoom: 1.15,
    target: "federated operating map",
  },
  {
    id: "04",
    title: "Lakeshore Intelligence Layer",
    image: "assets/04-intelligence-layer.png",
    text: "The intelligence layer is the moat: tenant context, role context, evidence, corpus doctrine, workflow state, and value ledger working together.",
    x: 850,
    y: 485,
    zoom: 1.12,
    target: "context to value bridge",
  },
  {
    id: "05",
    title: "Editable Corpus Doctrine",
    image: "assets/05-corpus.png",
    text: "The corpus stays editable. Lakeshore leaders approve, refine, localize, or retire doctrine as the portfolio learns what actually works.",
    x: 800,
    y: 545,
    zoom: 1.12,
    target: "editable corpus actions",
  },
  {
    id: "06",
    title: "Kyriba And Treasury Wedge",
    image: "assets/06-treasury-wedge.png",
    text: "Kyriba is a treasury management platform for cash visibility, bank connectivity, payments, liquidity, and forecasting. It fails when bank, ERP, entity, cash, control, and adoption facts surface too late. Abarva turns those risks into gates.",
    x: 900,
    y: 515,
    zoom: 1.18,
    target: "six treasury readiness gates",
  },
  {
    id: "07",
    title: "Beyond Kyriba",
    image: "assets/07-ai-success-platform.png",
    text: "Kyriba is the opening wedge. The broader platform finds value across treasury, vendors, IT, cyber, operations, and growth AI.",
    x: 780,
    y: 460,
    zoom: 1.10,
    target: "five value lanes",
  },
  {
    id: "08",
    title: "$500K Value Case",
    image: "assets/08-value-case.png",
    text: "The five hundred thousand dollar case is about five to ten times value potential: avoid rollout failure, rationalize vendors, reduce execution cost, and prove savings.",
    x: 800,
    y: 450,
    zoom: 1.12,
    target: "value metrics and value bridge",
  },
  {
    id: "09",
    title: "Move Execution Proof",
    image: "assets/09-proof-move.png",
    text: "A Move converts insight into owned work: phase, evidence, value, gaps, artifacts, and a next action.",
    x: 850,
    y: 500,
    zoom: 1.16,
    target: "Move product screen and ownership cards",
  },
  {
    id: "10",
    title: "Source Decision Proof",
    image: "assets/10-proof-source-decision.png",
    text: "Source turns finance, procurement, and executive judgment into a decision path with evidence, guardrails, and required artifacts.",
    x: 850,
    y: 500,
    zoom: 1.15,
    target: "executive decision fork",
  },
  {
    id: "11",
    title: "Value Pipeline Proof",
    image: "assets/11-proof-value-pipeline.png",
    text: "The value story is controlled: forecast, approval, negotiated outcome, and finance-accepted proof stay separate.",
    x: 750,
    y: 485,
    zoom: 1.18,
    target: "forecast to proof controls",
  },
  {
    id: "12",
    title: "Architecture Trust Layer",
    image: "assets/12-architecture.png",
    text: "Claude can reason. Abarva governs what it can see, cite, create, and persist for board and audit use.",
    x: 800,
    y: 535,
    zoom: 1.10,
    target: "trust controls around Claude",
  },
  {
    id: "13",
    title: "Six-Month Roadmap",
    image: "assets/13-six-month-roadmap.png",
    text: "The six-month roadmap builds context, corpus, finance proof, Source events, execution rhythm, and a board-ready value pack.",
    x: 800,
    y: 515,
    zoom: 1.10,
    target: "six-month roadmap cards",
  },
  {
    id: "14",
    title: "Renewal Standard",
    image: "assets/14-success-standard.png",
    text: "By month six, the renewal case should be earned: coverage, proof, value pipeline, and a finance-defensible ledger.",
    x: 850,
    y: 460,
    zoom: 1.13,
    target: "coverage proof ROI cards",
  },
];

function loadEnvFile(file) {
  if (!fs.existsSync(file)) return;
  for (const raw of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const index = line.indexOf("=");
    if (index === -1) continue;
    const key = line.slice(0, index).trim();
    let value = line.slice(index + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, { stdio: options.stdio || "pipe", encoding: "utf8" });
  if (result.status !== 0) {
    const stderr = result.stderr || "";
    const stdout = result.stdout || "";
    throw new Error(`${command} failed\n${stdout}\n${stderr}`);
  }
  return result.stdout || "";
}

function durationSeconds(file) {
  const out = run("ffprobe", [
    "-v", "error",
    "-show_entries", "format=duration",
    "-of", "default=noprint_wrappers=1:nokey=1",
    file,
  ]);
  return Number.parseFloat(out.trim());
}

async function createSpeech(client, scene, outFile) {
  if (fs.existsSync(outFile) && process.env.FORCE_AUDIO !== "1") return;
  const candidates = [
    { model: process.env.OPENAI_TTS_MODEL || "gpt-4o-mini-tts", voice: process.env.OPENAI_TTS_VOICE || DEFAULT_VOICE, instructions: VOICE_INSTRUCTIONS },
    { model: "tts-1", voice: process.env.OPENAI_TTS_VOICE || DEFAULT_VOICE },
  ];
  let lastError;
  for (const candidate of candidates) {
    try {
      const response = await client.audio.speech.create({
        model: candidate.model,
        voice: candidate.voice,
        input: scene.text,
        response_format: "mp3",
        ...(candidate.instructions ? { instructions: candidate.instructions } : {}),
      });
      const buffer = Buffer.from(await response.arrayBuffer());
      fs.writeFileSync(outFile, buffer);
      return;
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError;
}

function createClip(scene, audioFile, clipFile, timelineEntry) {
  const clipDuration = timelineEntry.clipDuration;
  const frames = Math.ceil(clipDuration * FPS);
  const holdFrames = Math.round(frames * 0.16);
  const rampFrames = Math.max(45, Math.round(frames * 0.46));
  const rampEnd = Math.min(frames - 1, holdFrames + rampFrames);
  const outStart = Math.min(frames - 2, Math.max(rampEnd + 1, Math.round(timelineEntry.audioDuration * FPS)));
  const z = scene.zoom.toFixed(3);
  const p = `if(lte(on\\,${holdFrames})\\,0\\,if(lte(on\\,${rampEnd})\\,(on-${holdFrames})/${Math.max(1, rampEnd - holdFrames)}\\,1))`;
  const settle = `if(lte(on\\,${outStart})\\,1\\,1-0.88*(on-${outStart})/${Math.max(1, frames - outStart)})`;
  const zoom = `if(lte(on\\,${holdFrames})\\,1\\,if(lte(on\\,${rampEnd})\\,1+(${z}-1)*(on-${holdFrames})/${Math.max(1, rampEnd - holdFrames)}\\,if(lte(on\\,${outStart})\\,${z}\\,${z}-(${z}-1.060)*(on-${outStart})/${Math.max(1, frames - outStart)})))`;
  const x = `(800+(${scene.x}-800)*${p}*${settle})-iw/zoom/2`;
  const y = `(450+(${scene.y}-450)*${p}*${settle})-ih/zoom/2`;
  const fadeStart = Math.max(0, clipDuration - 0.25).toFixed(3);
  const filter = [
    `[0:v]scale=${WIDTH}:${HEIGHT},zoompan=z='${zoom}':x='${x}':y='${y}':d=${frames}:fps=${FPS}:s=${WIDTH}x${HEIGHT},format=yuv420p[v]`,
    `[1:a]apad=pad_dur=${PAD_SECONDS},atrim=0:${clipDuration.toFixed(3)},afade=t=out:st=${fadeStart}:d=0.2[a]`,
  ].join(";");

  run("ffmpeg", [
    "-y",
    "-loop", "1",
    "-i", path.join(ROOT, scene.image),
    "-i", audioFile,
    "-filter_complex", filter,
    "-map", "[v]",
    "-map", "[a]",
    "-r", String(FPS),
    "-c:v", "libx264",
    "-preset", "veryfast",
    "-crf", "20",
    "-c:a", "aac",
    "-b:a", "160k",
    "-shortest",
    clipFile,
  ]);
}

function concatClips(clipFiles, outputFile) {
  const listFile = path.join(OUT, "concat-list.txt");
  fs.writeFileSync(listFile, clipFiles.map((file) => `file '${file.replace(/'/g, "'\\''")}'`).join("\n") + "\n");
  run("ffmpeg", [
    "-y",
    "-f", "concat",
    "-safe", "0",
    "-i", listFile,
    "-c", "copy",
    outputFile,
  ]);
}

async function main() {
  loadEnvFile(path.resolve(process.cwd(), ".env.local"));
  loadEnvFile(path.resolve(process.cwd(), ".env.azure.local"));
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY was not found in environment or .env.local.");
  }
  fs.mkdirSync(AUDIO_DIR, { recursive: true });
  fs.mkdirSync(CLIP_DIR, { recursive: true });

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const timeline = [];
  const clipFiles = [];
  let cursor = 0;

  for (const scene of scenes) {
    const audioFile = path.join(AUDIO_DIR, `scene-${scene.id}.mp3`);
    const clipFile = path.join(CLIP_DIR, `scene-${scene.id}.mp4`);
    process.stdout.write(`voice ${scene.id}... `);
    await createSpeech(client, scene, audioFile);
    const audioDuration = durationSeconds(audioFile);
    const clipDuration = Math.max(audioDuration + PAD_SECONDS, 4.8);
    const entry = {
      scene: scene.id,
      title: scene.title,
      image: scene.image,
      audio: path.relative(ROOT, audioFile),
      clip: path.relative(ROOT, clipFile),
      voiceText: scene.text,
      cameraTarget: scene.target,
      zoomTarget: { x: scene.x, y: scene.y, zoom: scene.zoom },
      audioDuration: Number(audioDuration.toFixed(3)),
      clipDuration: Number(clipDuration.toFixed(3)),
      timelineStart: Number(cursor.toFixed(3)),
      timelineEnd: Number((cursor + clipDuration).toFixed(3)),
      gapAfterVoice: Number((clipDuration - audioDuration).toFixed(3)),
    };
    process.stdout.write(`clip ${scene.id}... `);
    createClip(scene, audioFile, clipFile, entry);
    timeline.push(entry);
    clipFiles.push(clipFile);
    cursor += clipDuration;
    process.stdout.write("done\n");
  }

  const outputFile = path.join(OUT, "LAKESHORE_AI_SUCCESS_PLATFORM_PREVIEW_V1.mp4");
  concatClips(clipFiles, outputFile);
  fs.writeFileSync(path.join(OUT, "LAKESHORE_AI_SUCCESS_PLATFORM_PREVIEW_V1_TIMELINE.json"), JSON.stringify({
    created: new Date().toISOString(),
    fps: FPS,
    frameSize: { width: WIDTH, height: HEIGHT },
    maxGapAfterVoiceSeconds: PAD_SECONDS,
    voice: process.env.OPENAI_TTS_VOICE || DEFAULT_VOICE,
    pronunciation: "AbarVa/Abarva is pronounced as one word: uh-BAR-vuh. Do not say A bar V A.",
    voiceInstructions: VOICE_INSTRUCTIONS,
    output: path.relative(ROOT, outputFile),
    scenes: timeline,
  }, null, 2) + "\n");
  console.log(`wrote ${path.relative(process.cwd(), outputFile)}`);
  console.log(`duration ${cursor.toFixed(1)}s`);
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
