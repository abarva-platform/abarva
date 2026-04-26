import { existsSync, readFileSync, statSync } from 'node:fs'
import { resolve } from 'node:path'

/**
 * CLOUD3 · Docker Runtime Packaging static checks.
 *
 * These are not runtime build checks. They assert the *shape* of the
 * Dockerfile, .dockerignore, and verify-docker-build.sh on disk so a
 * lane refactor cannot silently delete the artifacts or sneak a baked
 * secret into the image. No Docker daemon is invoked.
 */

const repoRoot = resolve(__dirname, '..', '..', '..', '..')

describe('CLOUD3 · Docker runtime packaging artifacts', () => {
  describe('Dockerfile', () => {
    const dockerfilePath = resolve(repoRoot, 'Dockerfile')
    let dockerfile = ''

    beforeAll(() => {
      expect(existsSync(dockerfilePath)).toBe(true)
      dockerfile = readFileSync(dockerfilePath, 'utf8')
    })

    it('exists at the repo root', () => {
      expect(existsSync(dockerfilePath)).toBe(true)
    })

    it('uses a current Node 24 LTS base image', () => {
      // Accept any node:24* base (e.g. node:24-bookworm-slim, node:24-alpine).
      expect(dockerfile).toMatch(/FROM\s+node:24/)
    })

    it('declares a non-root USER directive', () => {
      // Match `USER node`, `USER 1001`, `USER 1001:1001`, etc.
      expect(dockerfile).toMatch(/^USER\s+\S+/m)
      // Reject `USER root` or `USER 0`.
      expect(dockerfile).not.toMatch(/^USER\s+root\s*$/m)
      expect(dockerfile).not.toMatch(/^USER\s+0(:0)?\s*$/m)
    })

    it('does NOT contain hardcoded provider tokens', () => {
      // Scan for common token prefixes. Any hit is a build-time leak.
      const forbiddenTokenPatterns: ReadonlyArray<RegExp> = [
        /\bsk-[A-Za-z0-9_-]{8,}/, // OpenAI / Anthropic-shaped keys
        /\bghp_[A-Za-z0-9]{8,}/, // GitHub PATs
        /\bvercel_[A-Za-z0-9]{8,}/, // Vercel tokens
        /\bnpm_[A-Za-z0-9]{8,}/, // npm automation tokens
      ]
      for (const pattern of forbiddenTokenPatterns) {
        expect(dockerfile).not.toMatch(pattern)
      }
    })

    it('does NOT copy any .env file into the image', () => {
      // Reject explicit `COPY .env`, `COPY .env.local`, etc.
      expect(dockerfile).not.toMatch(/^\s*COPY\s+\.env(\.\S+)?\s/m)
      expect(dockerfile).not.toMatch(/^\s*ADD\s+\.env(\.\S+)?\s/m)
    })

    it('declares a multi-stage build with deps / build / runtime', () => {
      expect(dockerfile).toMatch(/AS\s+deps/i)
      expect(dockerfile).toMatch(/AS\s+build/i)
      expect(dockerfile).toMatch(/AS\s+runtime/i)
    })
  })

  describe('.dockerignore', () => {
    const ignorePath = resolve(repoRoot, '.dockerignore')
    let ignore = ''

    beforeAll(() => {
      expect(existsSync(ignorePath)).toBe(true)
      ignore = readFileSync(ignorePath, 'utf8')
    })

    it('exists at the repo root', () => {
      expect(existsSync(ignorePath)).toBe(true)
    })

    const requiredEntries = ['node_modules', '.env', 'reports', '.git'] as const

    it.each(requiredEntries)('ignores %s', (entry) => {
      // Match the entry on its own line (allow a leading optional !
      // negation guard via a substring check that the negation form is
      // *not* the canonical line).
      const lineRegex = new RegExp(
        `^${entry.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/?\\s*$`,
        'm',
      )
      expect(ignore).toMatch(lineRegex)
    })

    it('does NOT ignore src/ (build needs it)', () => {
      expect(ignore).not.toMatch(/^src\/?\s*$/m)
    })
  })

  describe('scripts/verify-docker-build.sh', () => {
    const scriptPath = resolve(repoRoot, 'scripts', 'verify-docker-build.sh')
    let script = ''

    beforeAll(() => {
      expect(existsSync(scriptPath)).toBe(true)
      script = readFileSync(scriptPath, 'utf8')
    })

    it('exists at scripts/verify-docker-build.sh', () => {
      expect(existsSync(scriptPath)).toBe(true)
    })

    it('starts with a bash shebang', () => {
      const firstLine = script.split('\n', 1)[0] ?? ''
      // Accept `#!/usr/bin/env bash` or `#!/bin/bash` variants.
      expect(firstLine).toMatch(/^#!.*\bbash\b/)
    })

    it('uses set -euo pipefail for safer execution', () => {
      expect(script).toMatch(/set\s+-euo\s+pipefail/)
    })

    it('handles the Docker-missing case with a neutral exit 0', () => {
      expect(script).toMatch(/command\s+-v\s+docker/)
      expect(script).toMatch(/Docker unavailable on this host/)
    })

    it('is marked executable', () => {
      const mode = statSync(scriptPath).mode
      // POSIX: any execute bit set on owner / group / world.
      const executable = (mode & 0o111) !== 0
      expect(executable).toBe(true)
    })
  })
})
