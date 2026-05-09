// /source/learn — legacy layout. The Source primer surface has been
// folded into the unified guide at /home/learn/source/*. The pages
// inside this segment now redirect to the new home; this layout stays
// as a transparent passthrough so the redirect runs without dragging
// the legacy chrome (top bar + side nav) along for the ride.

export default function SourceLearnLegacyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
