import Link from "next/link";

import { ClassificationTriageQueue } from "@/components/admin/context-layer/ClassificationTriageQueue";

export const metadata = {
  title: "Classification Triage | AbarVa Admin",
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

const shellStyle = {
  background: "#F8F7F4",
  minHeight: "100%",
  padding: 32,
};

export default function ClassificationTriagePage() {
  return (
    <main style={shellStyle}>
      <section
        style={{ maxWidth: 1180, margin: "0 auto", display: "grid", gap: 24 }}
      >
        <div>
          <p
            style={{
              fontFamily: "DM Sans, sans-serif",
              fontSize: 12,
              letterSpacing: 0,
              textTransform: "uppercase",
              margin: 0,
              color: "#6b665c",
            }}
          >
            <Link
              href="/admin"
              style={{ color: "inherit", textDecoration: "none" }}
            >
              Admin
            </Link>
            {" · "}
            <Link
              href="/admin/context-layer"
              style={{ color: "inherit", textDecoration: "none" }}
            >
              Context Layer
            </Link>
            {" · "}
            Classification Triage
          </p>
          <h1
            style={{
              fontFamily: "Georgia, serif",
              fontSize: 44,
              lineHeight: 1.05,
              margin: "8px 0",
            }}
          >
            Classification Triage
          </h1>
          <p
            style={{
              maxWidth: 780,
              fontFamily: "DM Sans, sans-serif",
              fontSize: 16,
              lineHeight: 1.6,
              margin: "0 0 4px",
              color: "#514c43",
            }}
          >
            Records loaded with unknown domain segment or business function.
            Confirm classification before they appear in Explore and Sentinel
            answers.
          </p>
        </div>

        <ClassificationTriageQueue />
      </section>
    </main>
  );
}
