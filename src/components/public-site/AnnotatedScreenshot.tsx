interface AnnotatedScreenshotProps {
  phase: string; // phase id (discovery, synthesis, design, build, activate, operate)
  alt: string;
  annotation: string; // short annotation text overlaid on the screenshot
}

export function AnnotatedScreenshot({ phase, alt, annotation }: AnnotatedScreenshotProps) {
  return (
    <div
      aria-label={alt}
      style={{
        background: 'var(--pub-paper)',
        border: '1px solid var(--pub-rule)',
        borderRadius: '12px',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* Placeholder screenshot area — aspect ratio 16:9 */}
      <div
        data-phase={phase}
        style={{
          aspectRatio: '16 / 9',
          background:
            'linear-gradient(135deg, var(--pub-paper) 0%, #f0ebe0 100%)',
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Phase label centered in placeholder */}
        <span
          style={{
            fontFamily: 'var(--pub-font-mono)',
            fontSize: '14px',
            color: 'var(--pub-stone)',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
          }}
        >
          {phase}
        </span>

        {/* Annotation overlay — bottom-left */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            background: '#0c1a3a',
            color: '#ffffff',
            fontFamily: 'var(--pub-font-mono)',
            fontSize: '12px',
            padding: '8px 12px',
            borderRadius: '0 8px 0 12px',
            lineHeight: 1.4,
          }}
        >
          {annotation}
        </div>
      </div>
    </div>
  );
}
