// /home layout — passthrough only.
// Each sub-surface owns its own chrome:
//   /home          → insight-first operating room. It does not expose
//                    setup, connector, template, user, or data-load controls.
//   /home/learn/*  → AppTopBar + LearnSideNav (in learn/layout.tsx).
// Setup/Admin work lives under /admin/* and legacy setup-ish /home URLs
// are redirected by src/proxy.ts.
export default function HomeLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
