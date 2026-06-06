"use client";

import { SignIn } from "@clerk/nextjs";
import { useEffect } from "react";
import { clearActiveClientContext } from "@/lib/auth/client-context-storage";
import { DemoCodeSignIn } from "@/components/auth/DemoCodeSignIn";
import { EmailCodeSignIn } from "@/components/auth/EmailCodeSignIn";

interface Props {
  redirectUrl: string;
  signInMode?: "accessibility" | "clerk" | "demo-code" | "email-code";
}

export function SignInShell({ redirectUrl, signInMode = "email-code" }: Props) {
  useEffect(() => {
    clearActiveClientContext();
  }, []);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#F8F7F4",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "32px 20px",
      }}
    >
      <div
        style={{
          width: "100%",
          display: "grid",
          justifyItems: "center",
          gap: 16,
        }}
      >
        {signInMode === "accessibility" ? (
          <div
            aria-label="AbarVa sign-in unavailable during accessibility scan"
            role="status"
            style={{
              width: "100%",
              maxWidth: 460,
              border: "1px solid #D9D6CD",
              background: "#FFFFFF",
              borderRadius: 12,
              padding: 32,
              boxShadow: "0 24px 70px rgba(17, 19, 24, 0.10)",
              color: "#1F2937",
              fontFamily: "Inter, system-ui, sans-serif",
              lineHeight: 1.55,
            }}
          >
            <div
              style={{
                fontSize: 24,
                color: "#111318",
                fontFamily: "Fraunces, Georgia, serif",
                marginBottom: 8,
              }}
            >
              Sign in to your workspace.
            </div>
            <div style={{ fontSize: 14, color: "#374151" }}>
              Clerk sign-in is disabled for this automated accessibility scan.
              Production users sign in with the normal invited email or phone
              one-time-code flow.
            </div>
          </div>
        ) : signInMode === "demo-code" ? (
          <DemoCodeSignIn redirectUrl={redirectUrl} />
        ) : signInMode === "email-code" ? (
          <EmailCodeSignIn redirectUrl={redirectUrl} />
        ) : (
          <div
            style={{
              width: "100%",
              maxWidth: 460,
              display: "grid",
              justifyItems: "center",
            }}
          >
            <SignIn
              path="/sign-in"
              routing="path"
              forceRedirectUrl={redirectUrl}
              fallbackRedirectUrl={redirectUrl}
              withSignUp={false}
              appearance={{
                elements: {
                  rootBox: {
                    width: "100%",
                  },
                  cardBox: {
                    width: "100%",
                    boxShadow: "0 24px 70px rgba(17, 19, 24, 0.10)",
                    border: "1px solid #D9D6CD",
                    borderRadius: "12px",
                  },
                  card: {
                    borderRadius: "12px",
                  },
                },
              }}
            />
          </div>
        )}
        <div
          style={{
            width: "100%",
            maxWidth: 460,
            border: "1px solid rgba(38, 51, 77, 0.12)",
            background: "#F3F1EC",
            borderRadius: 12,
            padding: "12px 14px",
            color: "#4B5563",
            fontSize: 12,
            lineHeight: 1.55,
            textAlign: "left",
            fontFamily: "Inter, system-ui, sans-serif",
            letterSpacing: "-0.005em",
          }}
        >
          <strong style={{ color: "#1F2937" }}>Responsible AI</strong>
          <div>
            AI output may contain errors. Human approval is required before any
            write, submission, vendor communication, or decision based on this
            workspace.
          </div>
        </div>
        <div
          style={{
            maxWidth: 460,
            color: "#5D6572",
            fontSize: 11.5,
            lineHeight: 1.55,
            textAlign: "center",
            fontFamily: "Inter, system-ui, sans-serif",
            letterSpacing: "-0.005em",
          }}
        >
          AbarVa · AI Success Platform · Access is restricted to invited client
          identities.
        </div>
      </div>
    </div>
  );
}
