# Contributing to readme-terminal

Thanks for stopping by. Small, focused PRs are welcome.

## Setup

Requires Node 20+ and pnpm (repo pins `pnpm@11.21.0`).

```bash
pnpm install
pnpm dev    # http://localhost:3000
```

Other commands: `pnpm build`, `pnpm start`, `pnpm lint`.

## Where things live

- `app/page.tsx` — entry, renders the builder
- `components/builder.tsx` — UI state, preview, download, share link
- `lib/svg.ts` — SMIL SVG renderer (start here for rendering bugs)
- `lib/schema.ts` — zod schemas / limits for frames + settings
- `lib/themes.ts` — theme palettes
- `lib/codec.ts` — `?data=` share-link encode/decode
- `lib/presets.ts` — default demo script

This project uses Next.js 16 (App Router, static export), React 19, Tailwind CSS 4, zod, and fflate. Check `node_modules/next/dist/docs/` if an API looks unfamiliar — this Next version has breaking changes vs older tutorials.

## Making changes

1. Fork and create a branch: `git checkout -b feat/short-name`.
2. Keep it scoped — one feature/fix per PR.
3. Match existing style: TypeScript strict, no comments unless the logic is non-obvious, Tailwind utilities + existing `components/ui.tsx` primitives, lowercase UI copy.
4. Respect schema limits (`lib/schema.ts`): ≤30 frames, payload caps, field max-lengths. If you add a frame field or theme, update the schema, renderer, share codec, and README docs together.
5. Test manually: `pnpm dev`, try dark/light themes, `chrome: none`, `loop` on/off, and download the SVG — open it in a fresh tab and confirm it animates standalone. Also test a share link (`share link` button → paste URL in incognito).
6. Run `pnpm lint` and fix everything before pushing.

## Themes

Add new palettes to `THEMES` in `lib/themes.ts` with all required keys (`bg, fg, prompt, cmd, output, accent, green`) and a `mode` of `dark` or `light`. They show up in the builder dropdown automatically.

## Commit + PR

- Use conventional prefixes: `feat:`, `fix:`, `chore:`, `docs:` (see `git log --oneline`).
- PR description should say what changed, how you tested (preview screenshot/GIF helps for visual changes), and any schema/share-link compatibility notes.
- Be prepared to split large PRs.

## Reporting bugs

Open an issue with: steps to reproduce, expected vs actual, browser version, and (if relevant) the `?data=` share URL that triggers it.
