import { PageTitle } from '@/components/shared/typography/PageTitle';
import { EyebrowLabel } from '@/components/shared/typography/EyebrowLabel';
import { Body } from '@/components/shared/typography/Body';

interface Props {
  // Display name · may be preferred name from executive profile or first
  // name from Clerk. Falls back to a non-personalized opener.
  displayName: string | null;
  // Voice-shaped one-liner framing · sourced from the briefing's
  // opening_line when available, otherwise a safe default keyed to
  // time-of-day.
  framingLine: string | null;
  // Full-day local timestamp rendered above the greeting. Pass the actual
  // Date so the server formats it consistently with the user's locale.
  now: Date;
}

// Personalized opener above the briefing. Per C11 spec §3.1 the greeting
// reads as a conversation starter, not a dashboard title · "Good morning,
// Prat." in Georgia with a one-line framing underneath.
export function OpeningGreeting({ displayName, framingLine, now }: Props) {
  const hour = now.getHours();
  const salutation = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const greeting = displayName ? `${salutation}, ${displayName}.` : `${salutation}.`;

  // Day formatted as "Tuesday, April 21, 2026" · matches spec §3.1 timestamp shape.
  const dayLabel = now.toLocaleDateString(undefined, {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  });
  // Time formatted without seconds · "9:42 AM" matches spec example.
  const timeLabel = now.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });

  return (
    <section aria-labelledby="opening-greeting">
      <EyebrowLabel tone="muted" size="xs" style={{ marginBottom: 10 }}>
        {dayLabel} · {timeLabel}
      </EyebrowLabel>
      <PageTitle id="opening-greeting" size="page" style={{ marginBottom: 8 }}>
        {greeting}
      </PageTitle>
      {framingLine ? (
        <Body size="lg" tone="secondary" style={{ maxWidth: 640 }}>
          {framingLine}
        </Body>
      ) : null}
    </section>
  );
}
