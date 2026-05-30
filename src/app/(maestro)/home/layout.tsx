// /home layout — passthrough only.
// Each sub-surface owns its own chrome:
//   /home          → CL-1 (2026-05-30) · No page.tsx. Top-nav "Home"
//                    points at /admin (Trust Plane). /home itself
//                    301-redirects to /admin via src/proxy.ts.
//   /home/learn/*  → AppTopBar + LearnSideNav (in learn/layout.tsx)
export default function HomeLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
