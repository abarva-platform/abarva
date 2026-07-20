import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Signed out · AbarVa",
  robots: { index: false, follow: false },
};

export default function SignedOutPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#F8F7F4",
        display: "grid",
        placeItems: "center",
        padding: "32px 20px",
        color: "#111318",
        fontFamily: "Inter, system-ui, sans-serif",
      }}
    >
      <section
        aria-labelledby="signed-out-title"
        style={{
          width: "100%",
          maxWidth: 480,
          border: "1px solid #D9D6CD",
          background: "#FFFFFF",
          borderRadius: 14,
          padding: 32,
          boxShadow: "0 24px 70px rgba(17, 19, 24, 0.10)",
          display: "grid",
          gap: 18,
        }}
      >
        <div
          style={{
            fontFamily: '"JetBrains Mono", ui-monospace, monospace',
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: ".16em",
            textTransform: "uppercase",
            color: "#0066CC",
          }}
        >
          AbarVa workspace
        </div>
        <div style={{ display: "grid", gap: 10 }}>
          <h1
            id="signed-out-title"
            style={{
              margin: 0,
              fontFamily: "Fraunces, Georgia, serif",
              fontSize: 36,
              lineHeight: 1.05,
              letterSpacing: "-0.01em",
            }}
          >
            You are signed out.
          </h1>
          <p
            style={{
              margin: 0,
              color: "#4B5563",
              fontSize: 15,
              lineHeight: 1.55,
            }}
          >
            Your active workspace context has been cleared. Use your approved
            workspace email to sign back in.
          </p>
        </div>
        <Link
          href="/sign-in"
          style={{
            display: "inline-flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: 46,
            borderRadius: 10,
            background: "#111318",
            color: "#FFFFFF",
            textDecoration: "none",
            fontSize: 14,
            fontWeight: 700,
          }}
        >
          Sign in again
        </Link>
        <Link
          href="/"
          style={{
            color: "#4B5563",
            textDecoration: "none",
            fontSize: 13,
            textAlign: "center",
          }}
        >
          Return to public overview
        </Link>
      </section>
    </main>
  );
}
