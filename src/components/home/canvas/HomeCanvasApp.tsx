"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { HomeAvaChat } from "@/components/home/preview/HomeAvaChat";
import { BrowseTheData } from "@/components/home/preview/BrowseTheData";
import { sanitizeHomeReviewBundleNarrative } from "@/lib/home/preview/stale-claim-guard";
import {
  homeNarrativeStatusLabel,
  homeRecordSourceLabel,
  homeSourceCoverageLabel,
  homeSourceDateCoverageLabel,
  homeSourceFileReviewLabel,
} from "@/lib/home/preview/record-source";
import type { HomePreviewTenantKey } from "@/lib/home/preview/golden-snapshot";
import type {
  ChapterId,
  HomeRecordRenderSource,
  HomeReviewBundle,
} from "@/lib/home/preview/types";
import {
  CHAPTER_CONTRACTS,
  canvasHref,
  canvasViews,
  legacyCanvasView,
  resolveCanvasLocation,
  type CanvasView,
  type CanvasPanel,
} from "./canvas-model";
import {
  ChapterCanvas,
  InspectionEvidence,
  type CanvasInspection,
} from "./ChapterCanvas";
import { ArchitectureCanvas } from "./ArchitectureCanvas";
import { FamilyCanvas } from "./FamilyCanvas";
import styles from "./HomeCanvas.module.css";
import {
  homeIntelligenceHref,
  rememberHomeQuestion,
  type HomeIntelligenceRequest,
} from "@/lib/home/preview/intelligence-handoff";

export function HomeCanvasApp({
  bundle: rawBundle,
  recordSource,
  recordToken,
  tenantKey,
  tenantName,
  requestedProvider,
}: {
  bundle: HomeReviewBundle;
  recordSource: HomeRecordRenderSource;
  recordToken: string;
  tenantKey: HomePreviewTenantKey;
  tenantName: string;
  requestedProvider?: string;
}) {
  const bundle = useMemo(
    () => sanitizeHomeReviewBundleNarrative(rawBundle),
    [rawBundle],
  );
  const params = useSearchParams();
  const router = useRouter();
  const { view, panel } = resolveCanvasLocation(params, bundle);
  const chapter = bundle.chapters.find(
    (candidate) => candidate.chapterId === view,
  );
  const family = bundle.technologyEstate?.recordTypes.find(
    (candidate) => `tech:${candidate.objectType}` === view,
  );
  const query = params.get("q") ?? "";
  const [inspection, setInspection] = useState<CanvasInspection | null>(null);
  const [lastAvaQuestion, setLastAvaQuestion] = useState("");
  const intelligenceRequest: HomeIntelligenceRequest = {
    tenantKey,
    recordToken,
    requestedProvider,
    chapterId: chapter?.chapterId,
  };
  const dialog = useRef<HTMLDialogElement>(null);
  const viewport = useRef<HTMLDivElement>(null);
  const href = (
    destination: CanvasView,
    nextPanel: CanvasPanel = "overview",
    filter?: string,
  ) => {
    const boundParams = new URLSearchParams(params.toString());
    boundParams.set("tenant", tenantKey);
    if (requestedProvider) boundParams.set("provider", requestedProvider);
    return canvasHref(boundParams, destination, nextPanel, filter);
  };
  const title =
    chapter?.title ??
    family?.label ??
    (
      {
        architecture: "Current-state Architecture",
        "data-flow": "Current-state Data Flow",
        "browse-the-data": "Browse the Record",
        context: "Context & Modules",
      } as Record<string, string>
    )[view] ??
    "Home";
  const purpose = chapter
    ? CHAPTER_CONTRACTS[chapter.chapterId].purpose
    : family
      ? `${family.rows.length.toLocaleString()} records in the version on screen.`
      : view === "context"
        ? "The enterprise record underneath Intelligence, Moves, Source and Tower."
        : view === "architecture"
          ? "Where the business capabilities meet the systems that enable them."
          : view === "data-flow"
            ? "What the record establishes about movement, landing and consumption."
            : "The recorded facts and signals behind the enterprise interpretation.";
  const exportParams = new URLSearchParams();
  exportParams.set("tenant", tenantKey);
  if (requestedProvider) exportParams.set("provider", requestedProvider);
  exportParams.set("context", recordToken);
  exportParams.set("format", "pdf");
  useEffect(() => {
    if (params.has("view")) return;
    const legacyView = legacyCanvasView(window.location.hash, bundle);
    if (!legacyView) return;
    const next = new URLSearchParams(params.toString());
    next.set("tenant", tenantKey);
    if (requestedProvider) next.set("provider", requestedProvider);
    router.replace(canvasHref(next, legacyView), { scroll: false });
  }, [bundle, params, requestedProvider, router, tenantKey]);
  useEffect(() => {
    viewport.current?.scrollTo?.({ top: 0 });
  }, [view, panel, query]);
  useEffect(() => {
    if (inspection && !dialog.current?.open) dialog.current?.showModal();
    if (!inspection && dialog.current?.open) dialog.current.close();
  }, [inspection]);
  const recordInspection = () =>
    setInspection({
      title: "Record on screen",
      text: [
        homeRecordSourceLabel(recordSource),
        homeNarrativeStatusLabel(recordSource),
        homeSourceCoverageLabel(recordSource),
        homeSourceDateCoverageLabel(recordSource),
        homeSourceFileReviewLabel(recordSource),
        bundle.declaredSyntheticDemo
          ? "Synthetic reference record. Not client-attested."
          : null,
      ]
        .filter(Boolean)
        .join("\n"),
      basis: `Record version: ${recordSource.canonicalSnapshotHash}\nExport binding: ${recordToken}`,
    });
  const navLink = (destination: CanvasView, label: string, count?: number) => (
    <Link
      key={destination}
      href={href(destination)}
      scroll={false}
      prefetch={false}
      className={styles.navLink}
      aria-current={view === destination ? "page" : undefined}
    >
      <span>{label}</span>
      {count !== undefined && <small>{count.toLocaleString()}</small>}
    </Link>
  );
  return (
    <HomeAvaChat
      key={`${tenantKey}:${recordToken}`}
      tenantKey={tenantKey}
      activeChapterId={chapter?.chapterId}
      recordSource={recordSource}
      requestedProvider={requestedProvider}
      onQuestion={setLastAvaQuestion}
    >
      <div
        className={styles.app}
        data-home-canvas
        data-record-source={recordSource.kind}
        data-record-version={recordSource.canonicalSnapshotHash}
      >
        <aside className={styles.rail}>
          <div className={styles.identity}>
            <span className={styles.eyebrow}>Enterprise context</span>
            <strong>{tenantName}</strong>
            <span className={styles.badge}>
              {bundle.declaredSyntheticDemo
                ? "Synthetic reference"
                : "Governed record"}
            </span>
          </div>
          <nav className={styles.railNav} aria-label="Home explorer">
            <section className={styles.navGroup}>
              <h2>The enterprise</h2>
              {(
                Object.entries(CHAPTER_CONTRACTS) as [
                  ChapterId,
                  { title: string },
                ][]
              ).map(([id, contract]) => navLink(id, contract.title))}
            </section>
            <section className={styles.navGroup}>
              <h2>The context</h2>
              {navLink("context", "Context & modules")}
              {navLink("architecture", "Current-state architecture")}
              {navLink("data-flow", "Current-state data flow")}
              {navLink("browse-the-data", "Browse the record")}
            </section>
            <section className={styles.navGroup}>
              <h2>Evidence families</h2>
              {(bundle.technologyEstate?.recordTypes ?? []).map((type) =>
                navLink(
                  `tech:${type.objectType}`,
                  type.label,
                  type.rows.length,
                ),
              )}
            </section>
          </nav>
          <div className={styles.source}>
            <span className={styles.eyebrow}>Record on screen</span>
            <strong data-canvas-source-label>
              {homeRecordSourceLabel(recordSource)}
            </strong>
            <button onClick={recordInspection}>Source & version</button>
          </div>
        </aside>
        <main className={styles.workspace}>
          <div className={styles.mobileNav}>
            <select
              aria-label="Home view"
              value={view}
              onChange={(event) =>
                router.push(href(event.target.value as CanvasView), {
                  scroll: false,
                })
              }
            >
              {canvasViews(bundle).map((candidate) => (
                <option key={candidate} value={candidate}>
                  {CHAPTER_CONTRACTS[candidate as ChapterId]?.title ??
                    bundle.technologyEstate?.recordTypes.find(
                      (type) => `tech:${type.objectType}` === candidate,
                    )?.label ??
                    (
                      {
                        context: "Context & modules",
                        architecture: "Current-state architecture",
                        "data-flow": "Current-state data flow",
                        "browse-the-data": "Browse the record",
                      } as Record<string, string>
                    )[candidate]}
                </option>
              ))}
            </select>
          </div>
          <div className={styles.topline}>
            <span>
              <button className={styles.textButton} onClick={recordInspection}>
                {homeRecordSourceLabel(recordSource)}
              </button>
            </span>
            <div className={styles.actions}>
              <Link
                href={homeIntelligenceHref(intelligenceRequest)}
                prefetch={false}
                onClick={() =>
                  rememberHomeQuestion(intelligenceRequest, lastAvaQuestion)
                }
              >
                Explore in Intelligence
              </Link>
              <a
                href={`/api/home/walkthrough-export?${exportParams}`}
                title="Download the existing full Home walkthrough PDF"
              >
                Download PDF
              </a>
            </div>
          </div>
          <header className={styles.title}>
            <span className={styles.eyebrow}>
              {chapter ? title : "Enterprise context"}
            </span>
            <h1>{view === "executive_brief" ? tenantName : title}</h1>
            <p>{purpose}</p>
          </header>
          {(chapter || family) && (
            <nav
              className={styles.tabs}
              aria-label={chapter ? "Chapter views" : "Record views"}
            >
              {(["overview", "evidence", "reading"] as const).map(
                (candidate) => (
                  <Link
                    key={candidate}
                    href={href(view, candidate)}
                    scroll={false}
                    prefetch={false}
                    aria-current={panel === candidate ? "page" : undefined}
                  >
                    {
                      (chapter
                        ? {
                            overview: "Overview",
                            evidence: "Evidence",
                            reading: "Full reading",
                          }
                        : {
                            overview: "Overview",
                            evidence: "Records",
                            reading: "Associations",
                          })[candidate]
                    }
                  </Link>
                ),
              )}
            </nav>
          )}
          <div
            ref={viewport}
            className={styles.viewport}
            data-canvas-viewport
            data-active-view={view}
            data-active-panel={panel}
          >
            {chapter ? (
              <ChapterCanvas
                key={`${view}:${panel}`}
                chapter={chapter}
                bundle={bundle}
                source={recordSource}
                tenantName={tenantName}
                panel={panel}
                href={href}
                inspect={setInspection}
              />
            ) : view === "architecture" || view === "data-flow" ? (
              <ArchitectureCanvas
                key={view}
                bundle={bundle}
                tenantKey={tenantKey}
                tenantName={tenantName}
                flow={view === "data-flow"}
                recordsHref={href("tech:data_asset_or_integration", "evidence")}
                inspect={setInspection}
              />
            ) : view === "browse-the-data" ? (
              <div className={styles.recordLegacy}>
                <BrowseTheData
                  signalPacket={bundle.thesis.signalPacket}
                  presentation="canvas"
                />
              </div>
            ) : view === "context" ? (
              <ContextCanvas
                bundle={bundle}
                tenantKey={tenantKey}
                href={href}
                intelligenceRequest={intelligenceRequest}
              />
            ) : family ? (
              <FamilyCanvas
                key={`${family.objectType}:${panel}:${query}`}
                family={family}
                panel={panel}
                query={query}
                recordsHref={href(view, "evidence")}
              />
            ) : (
              <div className={styles.empty}>
                This chapter has not been published in the record on screen.
              </div>
            )}
          </div>
        </main>
        <dialog
          ref={dialog}
          className={styles.dialog}
          onCancel={() => setInspection(null)}
          onClose={() => setInspection(null)}
          aria-labelledby="canvas-inspection-title"
        >
          {inspection && (
            <>
              <div className={styles.dialogHeader}>
                <h2 id="canvas-inspection-title">{inspection.title}</h2>
                <button
                  className={styles.textButton}
                  onClick={() => setInspection(null)}
                >
                  Close
                </button>
              </div>
              <div className={styles.dialogBody}>
                <InspectionEvidence detail={inspection} bundle={bundle} />
              </div>
            </>
          )}
        </dialog>
      </div>
    </HomeAvaChat>
  );
}

function ContextCanvas({
  bundle,
  tenantKey,
  href,
  intelligenceRequest,
}: {
  bundle: HomeReviewBundle;
  tenantKey: HomePreviewTenantKey;
  href: (view: CanvasView, panel?: CanvasPanel) => string;
  intelligenceRequest: HomeIntelligenceRequest;
}) {
  const families = bundle.technologyEstate?.recordTypes ?? [];
  return (
    <div className={styles.overview}>
      <div className={styles.sectionLabel}>
        <h2 className={styles.heading}>The shared enterprise record</h2>
        <span className={styles.basis}>
          {families.length} available evidence families
        </span>
      </div>
      <div className={styles.familyGrid}>
        {families.map((family) => (
          <Link
            key={family.objectType}
            className={styles.familyItem}
            href={href(`tech:${family.objectType}`)}
            scroll={false}
            prefetch={false}
          >
            <strong>{family.rows.length.toLocaleString()}</strong>
            <span>{family.label}</span>
            <small>
              {family.rowSourceRefs
                ? `${family.rowSourceRefs.filter((refs) => refs.length > 0).length.toLocaleString()} source-linked rows`
                : "Source-row bridge not present in this record"}
            </small>
          </Link>
        ))}
      </div>
      <div className={styles.linkBand}>
        <div>
          <strong>Enterprise context is the common foundation</strong>
          <p>
            Business, priorities, ownership, systems, relationships and
            evidence. Product views use this foundation; product-specific
            results still require their own proof.
          </p>
        </div>
        <Link href={href("browse-the-data")} scroll={false} prefetch={false}>
          Inspect context
        </Link>
      </div>
      <div className={styles.moduleBand}>
        {[
          {
            name: "Intelligence",
            route: "/intelligence",
            text: "Interpret the enterprise evidence and test the questions that matter.",
          },
          {
            name: "Moves",
            route: "/moves",
            text: "Translate priorities into governed change, ownership and delivery.",
          },
          {
            name: "Source",
            route: "/source",
            text: "Evaluate commercial exposure in the context of business dependencies.",
          },
          {
            name: "Tower",
            route: "/tower",
            text: "Track performance and value with deterministic measurement.",
          },
        ].map((module) => (
          <section key={module.name}>
            <Link
              href={
                module.name === "Intelligence"
                  ? homeIntelligenceHref(intelligenceRequest)
                  : `${module.route}?tenant=${encodeURIComponent(tenantKey)}`
              }
              prefetch={false}
            >
              {module.name}
            </Link>
            <p>{module.text}</p>
          </section>
        ))}
      </div>
    </div>
  );
}
