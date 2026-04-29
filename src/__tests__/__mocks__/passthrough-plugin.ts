// Jest mock for unified-style remark/rehype plugins (remark-gfm,
// rehype-sanitize). These are ESM-only and break next/jest's default
// transformIgnorePatterns. The mocked react-markdown ignores plugins
// anyway, so a no-op default export is sufficient.

export default function passthrough() {
  return () => {};
}
