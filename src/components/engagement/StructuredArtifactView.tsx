interface StructuredArtifactViewProps {
  document: Record<string, unknown>;
  title?: string;
  ink?: string;
  mute?: string;
  dim?: string;
  teal?: string;
  border?: string;
  panelBg?: string;
  mono?: string;
}

const DEFAULT_THEME = {
  ink: '#F5F5F0',
  mute: 'rgba(245, 245, 240, 0.72)',
  dim: 'rgba(245, 245, 240, 0.48)',
  teal: '#14B8A6',
  border: '0.5px solid rgba(255,255,255,0.08)',
  panelBg: 'rgba(255,255,255,0.02)',
  mono: 'JetBrains Mono, monospace',
};

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function titleCase(input: string): string {
  return input
    .replace(/[_-]+/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatPrimitive(value: string | number | boolean | null): string {
  if (value === null) return 'None';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  return String(value);
}

function isScalar(value: unknown): value is string | number | boolean | null {
  return value === null || ['string', 'number', 'boolean'].includes(typeof value);
}

function arrayOfScalars(value: unknown[]): value is Array<string | number | boolean | null> {
  return value.every((item) => isScalar(item));
}

function arrayOfPlainObjects(value: unknown[]): value is Array<Record<string, unknown>> {
  return value.length > 0 && value.every((item) => isPlainObject(item));
}

function renderValue(
  label: string,
  value: unknown,
  depth: number,
  theme: typeof DEFAULT_THEME,
): React.ReactNode {
  if (value == null) {
    return (
      <div style={{ color: theme.dim, fontSize: 12 }}>
        None
      </div>
    );
  }

  if (isScalar(value)) {
    return (
      <div
        style={{
          color: theme.ink,
          fontSize: 13,
          lineHeight: 1.6,
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
        }}
      >
        {formatPrimitive(value)}
      </div>
    );
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return <div style={{ color: theme.dim, fontSize: 12 }}>No entries.</div>;
    }

    if (arrayOfScalars(value)) {
      return (
        <ul style={{ margin: 0, paddingLeft: 18, color: theme.ink, fontSize: 13, lineHeight: 1.7 }}>
          {value.map((item, index) => (
            <li key={`${label}-${index}`}>{formatPrimitive(item)}</li>
          ))}
        </ul>
      );
    }

    if (arrayOfPlainObjects(value)) {
      return (
        <div style={{ display: 'grid', gap: 10 }}>
          {value.map((item, index) => (
            <div
              key={`${label}-${index}`}
              style={{
                padding: 12,
                background: depth > 1 ? 'rgba(0,0,0,0.18)' : theme.panelBg,
                border: theme.border,
                borderRadius: 8,
              }}
            >
              <div
                style={{
                  fontFamily: theme.mono,
                  fontSize: 10,
                  color: theme.teal,
                  letterSpacing: '0.1em',
                  marginBottom: 8,
                }}
              >
                {titleCase(label)} {String(index + 1).padStart(2, '0')}
              </div>
              <div style={{ display: 'grid', gap: 10 }}>
                {Object.entries(item).map(([childKey, childValue]) => (
                  <div key={childKey}>
                    <div
                      style={{
                        fontFamily: theme.mono,
                        fontSize: 10,
                        color: theme.mute,
                        letterSpacing: '0.08em',
                        marginBottom: 6,
                      }}
                    >
                      {titleCase(childKey)}
                    </div>
                    {renderValue(childKey, childValue, depth + 1, theme)}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      );
    }

    return (
      <div style={{ display: 'grid', gap: 8 }}>
        {value.map((item, index) => (
          <div key={`${label}-${index}`}>{renderValue(`${label}_${index + 1}`, item, depth + 1, theme)}</div>
        ))}
      </div>
    );
  }

  if (isPlainObject(value)) {
    return (
      <div style={{ display: 'grid', gap: 10 }}>
        {Object.entries(value).map(([childKey, childValue]) => (
          <div
            key={childKey}
            style={{
              padding: depth > 0 ? 12 : 0,
              background: depth > 0 ? theme.panelBg : 'transparent',
              border: depth > 0 ? theme.border : 'none',
              borderRadius: depth > 0 ? 8 : 0,
            }}
          >
            <div
              style={{
                fontFamily: theme.mono,
                fontSize: 10,
                color: theme.mute,
                letterSpacing: '0.08em',
                marginBottom: 6,
              }}
            >
              {titleCase(childKey)}
            </div>
            {renderValue(childKey, childValue, depth + 1, theme)}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div style={{ color: theme.dim, fontSize: 12 }}>
      Unsupported content
    </div>
  );
}

export function StructuredArtifactView({
  document,
  title,
  ink = DEFAULT_THEME.ink,
  mute = DEFAULT_THEME.mute,
  dim = DEFAULT_THEME.dim,
  teal = DEFAULT_THEME.teal,
  border = DEFAULT_THEME.border,
  panelBg = DEFAULT_THEME.panelBg,
  mono = DEFAULT_THEME.mono,
}: StructuredArtifactViewProps) {
  const theme = { ink, mute, dim, teal, border, panelBg, mono };
  const entries = Object.entries(document);

  return (
    <section>
      {title ? (
        <div
          style={{
            fontFamily: mono,
            fontSize: 10,
            color: mute,
            letterSpacing: '0.14em',
            marginBottom: 10,
          }}
        >
          {title}
        </div>
      ) : null}
      <div style={{ display: 'grid', gap: 12 }}>
        {entries.map(([key, value]) => (
          <div
            key={key}
            style={{
              padding: 14,
              background: panelBg,
              border,
              borderRadius: 10,
            }}
          >
            <div
              style={{
                fontFamily: mono,
                fontSize: 10,
                color: teal,
                letterSpacing: '0.1em',
                marginBottom: 8,
              }}
            >
              {titleCase(key)}
            </div>
            {renderValue(key, value, 0, theme)}
          </div>
        ))}
      </div>
    </section>
  );
}
