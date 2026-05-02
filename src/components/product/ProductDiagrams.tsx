import type { ProductTabKey } from "@/lib/product/product-page-content";

const INK = "#0c1a3a";
const MUTED = "#5b6c8a";
const LINE = "#d8cdb7";
const PAPER = "#fbfaf7";
const SAGE = "#c6d7c2";
const TEAL = "#a9cfd0";
const COPPER = "#d8a15f";
const PLUM = "#c8b8d6";
const BLUE = "#bccfe6";

function Label({
  x,
  y,
  children,
  muted = false,
}: {
  x: number;
  y: number;
  children: string;
  muted?: boolean;
}) {
  return (
    <text
      x={x}
      y={y}
      fill={muted ? MUTED : INK}
      fontFamily="JetBrains Mono, Fira Code, monospace"
      fontSize="10"
      fontWeight="700"
      letterSpacing="0.08em"
      textAnchor="middle"
    >
      {children.toUpperCase()}
    </text>
  );
}

function Body({ x, y, children }: { x: number; y: number; children: string }) {
  return (
    <text
      x={x}
      y={y}
      fill={MUTED}
      fontFamily="Inter, sans-serif"
      fontSize="12"
      textAnchor="middle"
    >
      {children}
    </text>
  );
}

function Box({
  x,
  y,
  w,
  h,
  fill,
  stroke = LINE,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  fill: string;
  stroke?: string;
}) {
  return (
    <rect
      x={x}
      y={y}
      width={w}
      height={h}
      rx="16"
      fill={fill}
      stroke={stroke}
      strokeWidth="1.2"
    />
  );
}

function ArchitectureDiagram() {
  const layers = [
    [
      "Executive workspaces",
      "Home, Setup, Programs, Source, Intelligence, Tower",
      PLUM,
    ],
    ["Surface agents", "Atlas, Steward, Sentinel, Nexus", BLUE],
    ["Lifecycle discipline", "Phases, gates, evidence, handoffs", SAGE],
    [
      "Context substrate",
      "Client facts, corpus, metrics, market context",
      TEAL,
    ],
    ["Foundation reasoning", "Language, synthesis, drafting, critique", COPPER],
  ] as const;

  return (
    <svg
      viewBox="0 0 720 430"
      role="img"
      aria-label="AbarVa architecture stack diagram"
    >
      <rect width="720" height="430" rx="24" fill={PAPER} />
      {layers.map(([title, subtitle, fill], index) => {
        const y = 52 + index * 66;
        return (
          <g key={title}>
            <Box
              x={86}
              y={y}
              w={548}
              h={48}
              fill={fill}
              stroke={index === 0 ? "#a897b8" : LINE}
            />
            <Label x={360} y={y + 20}>
              {title}
            </Label>
            <Body x={360} y={y + 38}>
              {subtitle}
            </Body>
          </g>
        );
      })}
      <path
        d="M360 104 V344"
        stroke={INK}
        strokeWidth="1.4"
        strokeDasharray="5 6"
      />
      <circle cx="360" cy="30" r="10" fill={INK} />
      <Label x={360} y={386}>
        AbarVa operating system above the model layer
      </Label>
    </svg>
  );
}

function KnowledgeDiagram() {
  const sources = [
    ["Client context", 115, 86, SAGE],
    ["Pattern corpus", 360, 86, COPPER],
    ["Market context", 605, 86, BLUE],
  ] as const;
  const agents = [
    ["Sentinel", 190, 292, PLUM],
    ["Nexus", 330, 292, TEAL],
    ["Atlas", 470, 292, SAGE],
    ["Steward", 610, 292, BLUE],
  ] as const;

  return (
    <svg
      viewBox="0 0 720 430"
      role="img"
      aria-label="Knowledge and corpus flow diagram"
    >
      <rect width="720" height="430" rx="24" fill={PAPER} />
      {sources.map(([label, x, y, fill]) => (
        <g key={label}>
          <circle cx={x} cy={y} r="52" fill={fill} stroke={LINE} />
          <Label x={x} y={y + 4}>
            {label}
          </Label>
        </g>
      ))}
      <Box x={178} y={172} w={364} h={78} fill="#fffdf8" stroke="#c9bda5" />
      <Label x={360} y={202}>
        Retrieval substrate
      </Label>
      <Body x={360} y={224}>
        Patterns, metrics, provenance, cross-references
      </Body>
      {sources.map(([, x]) => (
        <path
          key={x}
          d={`M${x} 138 C${x} 158 300 160 330 174`}
          fill="none"
          stroke={INK}
          strokeWidth="1.2"
          opacity="0.65"
        />
      ))}
      {agents.map(([label, x, y, fill]) => (
        <g key={label}>
          <rect
            x={x - 48}
            y={y - 28}
            width="96"
            height="56"
            rx="14"
            fill={fill}
            stroke={LINE}
          />
          <Label x={x} y={y + 4}>
            {label}
          </Label>
          <path
            d={`M360 250 C360 270 ${x} 260 ${x} ${y - 30}`}
            fill="none"
            stroke={INK}
            strokeWidth="1.1"
            opacity="0.65"
          />
        </g>
      ))}
      <Label x={360} y={382}>
        Every answer cites the substrate it used
      </Label>
    </svg>
  );
}

function DataPlaneDiagram() {
  const tenants = [
    ["Client plane A", 145, SAGE],
    ["Client plane B", 360, TEAL],
    ["Client plane C", 575, PLUM],
  ] as const;

  return (
    <svg
      viewBox="0 0 720 430"
      role="img"
      aria-label="Private data plane boundary diagram"
    >
      <rect width="720" height="430" rx="24" fill={PAPER} />
      <Box x={90} y={42} w={540} h={66} fill="#fffdf8" stroke="#c9bda5" />
      <Label x={360} y={72}>
        Shared product plane
      </Label>
      <Body x={360} y={92}>
        Chrome, workflows, agents, non-client-specific corpus
      </Body>
      <path
        d="M360 108 V150"
        stroke={INK}
        strokeWidth="1.2"
        strokeDasharray="5 6"
      />
      <Box x={94} y={146} w={532} h={210} fill="#f8f4eb" stroke="#d5c7ae" />
      <Label x={360} y={176}>
        Tenant-private retrieval boundary
      </Label>
      {tenants.map(([label, x, fill]) => (
        <g key={label}>
          <rect
            x={x - 78}
            y="220"
            width="156"
            height="86"
            rx="18"
            fill={fill}
            stroke={LINE}
          />
          <Label x={x} y={253}>
            {label}
          </Label>
          <Body x={x} y={276}>
            Artifacts, metrics, users
          </Body>
        </g>
      ))}
      <path
        d="M145 320 H575"
        stroke={INK}
        strokeWidth="1.2"
        strokeDasharray="4 8"
      />
      <Label x={360} y={384}>
        Prepared for dedicated private deployment
      </Label>
    </svg>
  );
}

function LifecycleDiagram() {
  const phases = ["P0", "P1", "P2", "P3", "P4", "P5", "P6"];
  const colors = [COPPER, SAGE, TEAL, BLUE, PLUM, SAGE, COPPER];

  return (
    <svg
      viewBox="0 0 720 430"
      role="img"
      aria-label="Lifecycle with agent overlay diagram"
    >
      <rect width="720" height="430" rx="24" fill={PAPER} />
      <path d="M88 210 H632" stroke={INK} strokeWidth="2" />
      {phases.map((phase, index) => {
        const x = 96 + index * 88;
        return (
          <g key={phase}>
            <circle cx={x} cy="210" r="30" fill={colors[index]} stroke={LINE} />
            <Label x={x} y={214}>
              {phase}
            </Label>
            <Body x={x} y={260}>
              {
                [
                  "Originate",
                  "Frame",
                  "Design",
                  "Source",
                  "Deliver",
                  "Adopt",
                  "Observe",
                ][index]
              }
            </Body>
          </g>
        );
      })}
      <Box x={96} y={68} w={184} h={58} fill={PLUM} />
      <Label x={188} y={94}>
        Sentinel
      </Label>
      <Body x={188} y={112}>
        Challenge thesis
      </Body>
      <Box x={300} y={68} w={184} h={58} fill={TEAL} />
      <Label x={392} y={94}>
        Nexus
      </Label>
      <Body x={392} y={112}>
        Drive execution
      </Body>
      <Box x={504} y={68} w={128} h={58} fill={SAGE} />
      <Label x={568} y={94}>
        Atlas
      </Label>
      <Body x={568} y={112}>
        Observe value
      </Body>
      <path
        d="M188 126 C190 150 126 160 96 184"
        fill="none"
        stroke={INK}
        strokeWidth="1.2"
      />
      <path
        d="M392 126 C392 160 360 164 360 180"
        fill="none"
        stroke={INK}
        strokeWidth="1.2"
      />
      <path
        d="M568 126 C570 160 624 160 624 184"
        fill="none"
        stroke={INK}
        strokeWidth="1.2"
      />
      <Label x={360} y={350}>
        Gates require evidence before momentum becomes scale
      </Label>
    </svg>
  );
}

function ScalabilityDiagram() {
  const steps = [
    ["Rubric", 110, COPPER],
    ["Corpus", 230, SAGE],
    ["Validate", 350, TEAL],
    ["Publish", 470, BLUE],
    ["Retrieve", 590, PLUM],
  ] as const;

  return (
    <svg
      viewBox="0 0 720 430"
      role="img"
      aria-label="Codex authoring pipeline diagram"
    >
      <rect width="720" height="430" rx="24" fill={PAPER} />
      {steps.map(([label, x, fill], index) => (
        <g key={label}>
          <rect
            x={x - 48}
            y="78"
            width="96"
            height="64"
            rx="16"
            fill={fill}
            stroke={LINE}
          />
          <Label x={x} y={114}>
            {label}
          </Label>
          {index < steps.length - 1 ? (
            <path
              d={`M${x + 50} 110 H${steps[index + 1][1] - 52}`}
              stroke={INK}
              strokeWidth="1.3"
              markerEnd="url(#arrow)"
            />
          ) : null}
        </g>
      ))}
      <defs>
        <marker
          id="arrow"
          markerWidth="8"
          markerHeight="8"
          refX="7"
          refY="4"
          orient="auto"
        >
          <path d="M0 0 L8 4 L0 8 Z" fill={INK} />
        </marker>
      </defs>
      <Box x={158} y={214} w={404} h={64} fill="#fffdf8" stroke="#c9bda5" />
      <Label x={360} y={242}>
        Draft to verified to locked
      </Label>
      <Body x={360} y={262}>
        Practitioner review, smoke tests, telemetry stability
      </Body>
      <path
        d="M590 144 C640 202 560 290 466 278"
        fill="none"
        stroke={INK}
        strokeWidth="1.2"
        strokeDasharray="5 7"
      />
      <path
        d="M254 278 C150 286 88 218 110 144"
        fill="none"
        stroke={INK}
        strokeWidth="1.2"
        strokeDasharray="5 7"
      />
      <Label x={360} y={354}>
        Agent gaps become the next corpus backlog
      </Label>
    </svg>
  );
}

export function ProductDiagram({ tabKey }: { tabKey: ProductTabKey }) {
  if (tabKey === "architecture") return <ArchitectureDiagram />;
  if (tabKey === "knowledge-layer") return <KnowledgeDiagram />;
  if (tabKey === "data-plane-security") return <DataPlaneDiagram />;
  if (tabKey === "lifecycle-discipline") return <LifecycleDiagram />;
  return <ScalabilityDiagram />;
}
