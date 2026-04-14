# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

No build step. Open `index.html` directly in browser.

```bash
# Check leaderboard API locally via Vercel CLI:
vercel dev
```

## Architecture

Static HTML/CSS/JS — no framework, no bundler.

`api/` directory contains Vercel serverless functions (Node.js) for leaderboard persistence via `@vercel/kv`.

When testing: open DevTools Console for JS errors, Network tab to verify leaderboard API calls.
