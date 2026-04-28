export function JwtDataPlaneDiagram() {
  return (
    <svg
      viewBox="0 0 800 400"
      width="100%"
      style={{ display: 'block', maxWidth: '900px', margin: '0 auto' }}
      role="img"
      aria-labelledby="jwt-title jwt-desc"
    >
      <title id="jwt-title">JWT data plane flow diagram</title>
      <desc id="jwt-desc">
        Diagram showing JWT token flow between the Control Plane and Data Plane. An authentication
        request flows to the Control Plane, which issues a JWT with a 15-minute TTL. The token then
        grants scoped access to the Data Plane.
      </desc>

      {/* Control Plane band (top half) */}
      <rect x={0} y={0} width={800} height={185} fill="#0c1a3a" rx={0} />
      <text
        x={16}
        y={28}
        fontFamily="var(--pub-font-mono, 'JetBrains Mono', monospace)"
        fontSize={11}
        fill="#a3cef4"
        letterSpacing="0.1em"
      >
        CONTROL PLANE
      </text>

      {/* Data Plane band (bottom half) */}
      <rect x={0} y={215} width={800} height={185} fill="var(--pub-paper, #faf7f1)" stroke="#0c1a3a" strokeWidth={1.5} rx={0} />
      <text
        x={16}
        y={243}
        fontFamily="var(--pub-font-mono, 'JetBrains Mono', monospace)"
        fontSize={11}
        fill="#5F5E5A"
        letterSpacing="0.1em"
      >
        DATA PLANE
      </text>

      {/* Divider */}
      <line x1={0} y1={200} x2={800} y2={200} stroke="#0066CC" strokeWidth={2} strokeDasharray="6 4" />
      <text
        x={400}
        y={212}
        textAnchor="middle"
        fontFamily="var(--pub-font-mono, monospace)"
        fontSize={9}
        fill="#0066CC"
      >
        JWT boundary
      </text>

      {/* Step 1: Auth request box */}
      <rect x={40} y={70} width={130} height={50} rx={6} fill="none" stroke="#a3cef4" strokeWidth={1.5} />
      <text x={105} y={91} textAnchor="middle" fontFamily="var(--pub-font-mono, monospace)" fontSize={11} fill="#faf7f1">Auth</text>
      <text x={105} y={107} textAnchor="middle" fontFamily="var(--pub-font-mono, monospace)" fontSize={11} fill="#faf7f1">Request</text>

      {/* Arrow: auth request → JWT issuer */}
      <line x1={170} y1={95} x2={240} y2={95} stroke="#a3cef4" strokeWidth={1.5} markerEnd="url(#jwt-arrow-light)" />
      <text x={205} y={87} textAnchor="middle" fontFamily="var(--pub-font-mono, monospace)" fontSize={9} fill="#a3cef4">identity check</text>

      {/* JWT Issuer box */}
      <rect x={240} y={60} width={150} height={70} rx={6} fill="#0066CC" stroke="none" />
      <text x={315} y={88} textAnchor="middle" fontFamily="var(--pub-font-mono, monospace)" fontSize={11} fill="#fff" fontWeight="600">JWT Issuer</text>
      <text x={315} y={104} textAnchor="middle" fontFamily="var(--pub-font-mono, monospace)" fontSize={9} fill="#cde8ff">(Control Plane)</text>
      <text x={315} y={120} textAnchor="middle" fontFamily="var(--pub-font-mono, monospace)" fontSize={9} fill="#cde8ff">Clerk + RBAC</text>

      {/* JWT Token box — the token itself */}
      <rect x={450} y={58} width={160} height={74} rx={6} fill="#faf7f1" stroke="#0066CC" strokeWidth={2} />
      <text x={530} y={82} textAnchor="middle" fontFamily="var(--pub-font-mono, monospace)" fontSize={11} fill="#0c1a3a" fontWeight="600">JWT Token</text>
      <rect x={465} y={89} width={130} height={20} rx={3} fill="#0066CC" fillOpacity={0.15} />
      <text x={530} y={103} textAnchor="middle" fontFamily="var(--pub-font-mono, monospace)" fontSize={12} fill="#0066CC" fontWeight="700">15-min TTL</text>
      <text x={530} y={120} textAnchor="middle" fontFamily="var(--pub-font-mono, monospace)" fontSize={9} fill="#5F5E5A">tenant-scoped</text>

      {/* Arrow: issuer → JWT token */}
      <line x1={390} y1={95} x2={448} y2={95} stroke="#a3cef4" strokeWidth={1.5} markerEnd="url(#jwt-arrow-light)" />
      <text x={419} y={87} textAnchor="middle" fontFamily="var(--pub-font-mono, monospace)" fontSize={9} fill="#a3cef4">issue</text>

      {/* Arrow: JWT token goes DOWN to data plane */}
      <line x1={530} y1={132} x2={530} y2={258} stroke="#0066CC" strokeWidth={1.5} strokeDasharray="4 3" markerEnd="url(#jwt-arrow-blue)" />
      <text x={548} y={195} fontFamily="var(--pub-font-mono, monospace)" fontSize={9} fill="#0066CC">token presented</text>

      {/* Data Plane: Tenant data box */}
      <rect x={430} y={270} width={200} height={60} rx={6} fill="none" stroke="#0c1a3a" strokeWidth={1.5} />
      <text x={530} y={295} textAnchor="middle" fontFamily="var(--pub-font-mono, monospace)" fontSize={11} fill="#0c1a3a" fontWeight="600">Tenant Data</text>
      <text x={530} y={311} textAnchor="middle" fontFamily="var(--pub-font-mono, monospace)" fontSize={9} fill="#5F5E5A">isolated per JWT scope</text>

      {/* Response arrow */}
      <line x1={430} y1={300} x2={250} y2={300} stroke="#0c1a3a" strokeWidth={1.5} markerEnd="url(#jwt-arrow-dark)" />
      <text x={340} y={292} textAnchor="middle" fontFamily="var(--pub-font-mono, monospace)" fontSize={9} fill="#5F5E5A">scoped response</text>

      {/* Client box in data plane */}
      <rect x={60} y={270} width={170} height={60} rx={6} fill="none" stroke="#888780" strokeWidth={1} />
      <text x={145} y={295} textAnchor="middle" fontFamily="var(--pub-font-mono, monospace)" fontSize={11} fill="#0c1a3a">Client</text>
      <text x={145} y={311} textAnchor="middle" fontFamily="var(--pub-font-mono, monospace)" fontSize={9} fill="#5F5E5A">receives filtered data</text>

      <defs>
        <marker id="jwt-arrow-light" markerWidth="7" markerHeight="7" refX="5" refY="3.5" orient="auto">
          <path d="M0,0 L7,3.5 L0,7 Z" fill="#a3cef4" />
        </marker>
        <marker id="jwt-arrow-blue" markerWidth="7" markerHeight="7" refX="5" refY="3.5" orient="auto">
          <path d="M0,0 L7,3.5 L0,7 Z" fill="#0066CC" />
        </marker>
        <marker id="jwt-arrow-dark" markerWidth="7" markerHeight="7" refX="5" refY="3.5" orient="auto">
          <path d="M0,0 L7,3.5 L0,7 Z" fill="#0c1a3a" />
        </marker>
      </defs>
    </svg>
  );
}
