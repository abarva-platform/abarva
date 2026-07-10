// Phase Evidence Hub — /strategic-moves/[moveId]/evidence
//
// Standalone full-page view of the phase document set.
// Links route back to the standalone phase workspace, not retired detail tabs.
// Rendered with PhaseDocumentsPanel (shared server component).

import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";
import { requireProductModule } from "@/lib/auth/server-module-access";
import { getStrategicMoveById } from "@/lib/programs/queries";
import { getStrategicMovesTenancy } from "@/lib/programs/strategic-moves-context";
import { AppShell } from "@/components/shell/AppShell";
import { PhaseDocumentsPanel } from "@/components/strategic-moves/PhaseDocumentsPanel";
import { BoardArtifactsPanel } from "@/components/strategic-moves/BoardArtifactsPanel";
import { isStrategicMoveRouteId } from "@/lib/programs/strategic-move-route-params";
import { boardArtifactsForMove } from "@/lib/programs/board-artifacts/board-artifacts-registry";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ moveId: string }>;
}

export default async function PhaseEvidenceHubPage({ params }: Props) {
  await requireProductModule("programs");
  const ctx = await getStrategicMovesTenancy();
  if (!ctx) redirect("/sign-in");

  const { moveId } = await params;
  if (!isStrategicMoveRouteId(moveId)) {
    notFound();
  }

  const move = await getStrategicMoveById(ctx, moveId);
  if (!move) notFound();
  const boardArtifactCount = boardArtifactsForMove(move).length;

  return (
    <AppShell surface="programs-detail">
      <div style={{ padding: "24px 32px", maxWidth: 960, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              marginBottom: 8,
              fontSize: 12,
              color: "#9AA3B2",
            }}
          >
            <Link
              href="/strategic-moves"
              style={{ color: "#9AA3B2", textDecoration: "none" }}
            >
              Strategic Moves
            </Link>
            <span>›</span>
            <Link
              href={`/strategic-moves/${moveId}`}
              style={{ color: "#9AA3B2", textDecoration: "none" }}
            >
              {move.displayCode}
            </Link>
            <span>›</span>
            <span>Documents</span>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              gap: 16,
              flexWrap: "wrap",
            }}
          >
            <div>
              <h1
                style={{
                  fontFamily: "Fraunces, Georgia, serif",
                  fontSize: 22,
                  fontWeight: "normal",
                  margin: "0 0 3px",
                  color: "#1A1A18",
                }}
              >
                Phase Documents
              </h1>
              <div style={{ fontSize: 13, color: "#525866" }}>
                {move.name} · {move.tenant.name}
              </div>
            </div>
            <div
              style={{
                display: "flex",
                gap: 8,
                alignItems: "center",
                flexShrink: 0,
              }}
            >
              <Link
                href={`/strategic-moves/${moveId}/phase/${move.currentPhase ?? 1}`}
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: "#525866",
                  textDecoration: "none",
                  padding: "5px 12px",
                  border: "1px solid #D4D0C8",
                  borderRadius: 5,
                  backgroundColor: "#F8F7F4",
                }}
              >
                ← Back to phase workspace
              </Link>
              <Link
                href={`/strategic-moves/${moveId}/phase/${move.currentPhase ?? 1}`}
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: "#FFFFFF",
                  textDecoration: "none",
                  padding: "5px 12px",
                  border: "1px solid #1B2B5C",
                  borderRadius: 5,
                  backgroundColor: "#1B2B5C",
                }}
              >
                Open workspace →
              </Link>
            </div>
          </div>
        </div>

        {/* Document panel */}
        <BoardArtifactsPanel move={move} />
        <Suspense
          fallback={
            <div
              style={{
                padding: "48px 0",
                textAlign: "center",
                fontSize: 13,
                color: "#9AA3B2",
              }}
            >
              Loading documents…
            </div>
          }
        >
          <PhaseDocumentsPanel
            moveId={moveId}
            currentPhase={move.currentPhase ?? 1}
            compact={false}
            archetype={move.archetype}
            moveName={move.name}
            clientDisplayName={move.tenant.name}
            boardArtifactCount={boardArtifactCount}
          />
        </Suspense>
      </div>
    </AppShell>
  );
}
