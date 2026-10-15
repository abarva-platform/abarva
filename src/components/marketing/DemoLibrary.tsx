"use client";
import Link from "next/link";
import Image from "next/image";
import { SignOutButton } from "@clerk/nextjs";
import { useRef, useState, type FormEvent } from "react";
import { ArrowLeft, LockKeyhole, Play, ShieldCheck } from "lucide-react";
import { EmailCodeSignIn } from "@/components/auth/EmailCodeSignIn";
import { RequestAccessController } from "./RequestAccessController";
import type { DemoVideoId } from "@/lib/demo-library/policy";
import styles from "./DemoLibrary.module.css";

type Video = {
  id: DemoVideoId;
  title: string;
  duration: string;
  description: string;
  ready: boolean;
  captionsReady: boolean;
  chapters: Array<{ at: number; title: string }>;
};
type Props = {
  state: "anonymous" | "unapproved" | "approved" | "unavailable";
  admin: boolean;
  videos: Video[];
};

function AccessManager() {
  const [email, setEmail] = useState("");
  const [days, setDays] = useState("7");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  async function update(action: "grant" | "revoke", event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/demo-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          email,
          ...(action === "grant"
            ? {
                days: Number(days),
              }
            : {}),
        }),
      });
      if (!response.ok)
        throw new Error(
          "Access could not be updated. Check the email and account requirements, then retry.",
        );
      setMessage(
        action === "grant"
          ? `Approved ${email} for ${days} days. Share app.abarva.ai/demo; no invitation email was sent.`
          : `Demo approval revoked for ${email}.`,
      );
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Access could not be updated.",
      );
    } finally {
      setPending(false);
    }
  }
  return (
    <details className={styles.admin}>
      <summary>
        <ShieldCheck size={18} /> Viewer access
      </summary>
      <form
        onSubmit={(event) => update("grant", event)}
        className={styles.adminForm}
      >
        <label>
          Email
          <input
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="viewer@company.com"
          />
        </label>
        <label>
          Access expires
          <select
            value={days}
            onChange={(event) => setDays(event.target.value)}
          >
            <option value="7">In 7 days</option>
            <option value="14">In 14 days</option>
            <option value="30">In 30 days</option>
          </select>
        </label>
        <button className={styles.primary} disabled={pending}>
          Approve viewer
        </button>
        <button
          type="button"
          onClick={(event) => update("revoke", event)}
          disabled={pending || !email}
        >
          Revoke access
        </button>
      </form>
      {message && <p role="status">{message}</p>}
    </details>
  );
}

export function DemoLibrary({ state, admin, videos }: Props) {
  const [selected, setSelected] = useState<DemoVideoId>(
    videos[0]?.id ?? "executive",
  );
  const [error, setError] = useState(false);
  const player = useRef<HTMLVideoElement>(null);
  const video = videos.find((item) => item.id === selected) ?? videos[0];
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link href="/" aria-label="Nexus home">
          <Image
            src="/brand/nexus/abarva-nexus-navbar-light-clearance.svg"
            alt="Abarva Nexus"
            width={248}
            height={42}
            priority
          />
        </Link>
        <Link href="/">
          <ArrowLeft size={17} /> Back to overview
        </Link>
        {state !== "anonymous" && state !== "unavailable" && (
          <SignOutButton redirectUrl="/demo">
            <button type="button">Sign out</button>
          </SignOutButton>
        )}
      </header>
      <main className={styles.main}>
        <div className={styles.heading}>
          <p className={styles.eyebrow}>PRIVATE PRODUCT DEMO</p>
          <h1>Nexus, from context to outcomes.</h1>
          <p>
            See how enterprise context, Claude reasoning and human decisions
            connect across one operating system.
          </p>
        </div>
        {state === "approved" && video ? (
          <>
            <div
              role="tablist"
              aria-label="Choose a walkthrough"
              className={styles.tabs}
            >
              {videos.map((item) => (
                <button
                  type="button"
                  role="tab"
                  key={item.id}
                  id={`demo-tab-${item.id}`}
                  aria-selected={selected === item.id}
                  aria-controls="demo-player"
                  tabIndex={selected === item.id ? 0 : -1}
                  onKeyDown={(event) => {
                    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight")
                      return;
                    event.preventDefault();
                    const next =
                      videos[
                        (videos.findIndex((item) => item.id === selected) +
                          (event.key === "ArrowRight"
                            ? 1
                            : videos.length - 1)) %
                          videos.length
                      ];
                    setSelected(next.id);
                    setError(false);
                    document.getElementById(`demo-tab-${next.id}`)?.focus();
                  }}
                  onClick={() => {
                    setSelected(item.id);
                    setError(false);
                  }}
                >
                  <Play size={17} />
                  <span>
                    {item.title}
                    <small>{item.duration}</small>
                  </span>
                </button>
              ))}
            </div>
            <section
              role="tabpanel"
              id="demo-player"
              aria-labelledby={`demo-tab-${video.id}`}
              className={styles.playerSection}
            >
              <div className={styles.player}>
                {video.ready && !error ? (
                  <video
                    ref={player}
                    key={video.id}
                    controls
                    playsInline
                    preload="metadata"
                    controlsList="nodownload"
                    onError={() => setError(true)}
                    aria-label={video.title}
                  >
                    <source
                      src={`/api/demo-video/${video.id}`}
                      type="video/mp4"
                    />
                    {video.captionsReady && (
                      <track
                        kind="captions"
                        src={`/api/demo-video/${video.id}?asset=captions`}
                        srcLang="en"
                        label="English"
                      />
                    )}
                  </video>
                ) : (
                  <div className={styles.pending}>
                    <LockKeyhole size={32} />
                    <h2>
                      {error
                        ? "Playback is unavailable."
                        : "The final video is being prepared."}
                    </h2>
                    <p>
                      {error
                        ? "Your session or access may have expired. Reload to check your access."
                        : "Your access is approved. The video will appear here once the final edit is published."}
                    </p>
                    {error && (
                      <button
                        type="button"
                        onClick={() => window.location.reload()}
                      >
                        Reload
                      </button>
                    )}
                  </div>
                )}
              </div>
              <label className={styles.chapterPicker}>
                Chapter
                <select
                  aria-label="Jump to chapter"
                  key={video.id}
                  disabled={!video.ready || error}
                  defaultValue="0"
                  onChange={(event) => {
                    if (player.current)
                      player.current.currentTime = Number(event.target.value);
                  }}
                >
                  {video.chapters.map((chapter) => (
                    <option key={chapter.at} value={chapter.at}>
                      {String(Math.floor(chapter.at / 60)).padStart(2, "0")}:
                      {String(Math.floor(chapter.at % 60)).padStart(2, "0")}{" "}
                      {chapter.title}
                    </option>
                  ))}
                </select>
              </label>
              <div className={styles.videoCaption}>
                <div>
                  <h2>{video.title}</h2>
                  <p>{video.description}</p>
                </div>
                <span>{video.duration}</span>
              </div>
            </section>
            <p className={styles.disclosure}>
              Synthetic healthcare reference. AI-generated narration. Recorded
              product examples and product vision are distinguished;
              illustrative economics are not verified client results.
            </p>
          </>
        ) : state === "anonymous" ? (
          <div className={styles.accessPaths}>
            <section
              className={styles.accessPath}
              aria-labelledby="approved-access-title"
            >
              <h2 id="approved-access-title">Already approved</h2>
              <div className={styles.signInPanel}>
                <EmailCodeSignIn redirectUrl="/demo" purpose="demo" />
              </div>
              <p className={styles.pathNote}>
                Codes go only to emails already provisioned for demo access.
              </p>
            </section>
            <section
              className={styles.accessPath}
              aria-labelledby="request-access-title"
            >
              <h2 id="request-access-title">New here</h2>
              <div className={styles.requestPanel}>
                <LockKeyhole size={26} />
                <h3>Request access to the private demo.</h3>
                <p>
                  Watch the executive overview or the full product walkthrough
                  with your approved email. No client workspace is included.
                </p>
                <button
                  type="button"
                  className={styles.primary}
                  data-request-access=""
                >
                  Request access
                </button>
              </div>
              <p className={styles.pathNote}>
                We review requests and email you when your access is ready.
              </p>
            </section>
          </div>
        ) : (
          <section className={styles.access}>
            <div>
              <LockKeyhole size={26} />
              <h2>
                {state === "unavailable"
                  ? "Access verification is unavailable."
                  : "This account is not approved for the demo."}
              </h2>
              <p>
                {state === "unavailable"
                  ? "Please reload and try again. No video is available without a successful access check."
                  : "Access may not have been granted, or it may have expired. Request a new approval from your host."}
              </p>
              <button type="button" data-request-access>
                Request access
              </button>
            </div>
          </section>
        )}
        {admin && <AccessManager />}
      </main>
      <footer className={styles.footer}>
        Nexus by Abarva. Private preview.
      </footer>
      <div className="abarva-landing">
        <RequestAccessController />
      </div>
    </div>
  );
}
