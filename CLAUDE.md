# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — start the Vite dev server on port 3000 (host `0.0.0.0`)
- `npm run build` — production build to `dist/`
- `npm run preview` — serve the production build locally
- `npm run lint` — type-check only (`tsc --noEmit`); there is no ESLint and no test suite
- `npm run clean` — remove `dist/`

There are no unit tests. `npm run lint` is the only automated check — run it after edits to catch type errors.

## Architecture

Single-page React 19 + TypeScript portfolio built with Vite 6. The entire site is one scrolling page; there is no router. Entry: `index.html` → `src/main.tsx` → `src/App.tsx`.

**Design concept: "the research paper."** Warm paper background, near-black ink, a single vermilion accent; numbered `§` sections, captioned figures (`Fig. 1`, `Plate I`), an index-style project list and a colophon footer. Type is Instrument Serif (display), Geist (body) and Geist Mono (metadata/figures only), loaded from Google Fonts in `index.html`. Keep new UI inside this vocabulary: ruled lines over cards, serif headings with an italic accent `<Em>`, the `.label` utility for small uppercase metadata.

**Content lives in `src/data/content.ts`** (`profile`, `projects`, `experiences`, `stack`). Sections render from these arrays, so adding a project or role is a data edit. `src/App.tsx` holds the section markup; reusable pieces are in `src/components/`: `Navbar`, `SectionHeader`, `Reveal` (scroll-reveal wrapper), `ProjectIndex` (expandable project rows, height animated via `grid-template-rows`), `ContactForm`, `PipelineFigure`, `LocalTime`.

**`PipelineFigure` is the hero's signature piece**: two general SVG schematics that take turns as Fig. 1a/1b, a hybrid RAG pipeline and an AI end-to-end testing loop, both defined as data in `DIAGRAMS` (stages in viewBox coordinates, packet `routes`, y-`zones` that map a packet to a stage, and `groups` for side-by-side stages). Each diagram renders as its own `Panel` with its own refs and rAF loop that writes packet positions straight to the DOM; React re-renders only when the packet enters a new stage, which drives the highlight and the caption readout. Panels switch under `AnimatePresence mode="wait"` inside a fixed aspect-ratio box, advanced by the `animationend` of the `fig-progress` hairline under the active tab (so hover and scrolling away pause it by pausing the CSS animation). Under `prefers-reduced-motion` nothing moves or auto-advances (the global rule would otherwise end that animation instantly); the tabs still switch by hand.

**Sections are anchor-based and numbered.** The hero is `#top` (unnumbered); then `about` (01), `work` (02), `experience` (03), `stack` (04), `contact` (05). `src/data/chapters.ts` is the single source of truth for ids/numbers/names — the Navbar renders from it, and each section's `<SectionHeader number=…>` must match. When adding/renaming/reordering a section, update both `App.tsx` and `chapters.ts`.

**Styling is Tailwind CSS v4, configured entirely in CSS.** There is no `tailwind.config.js`; Tailwind is wired through the `@tailwindcss/vite` plugin. Colours are OKLCH custom properties on `:root` and `[data-theme="dark"]` in `src/index.css`, mapped to utilities through `@theme inline` (`bg-paper`, `bg-paper-2`, `text-ink`, `text-ink-2`, `text-muted`, `border-rule`, `border-rule-strong`, `text-accent`, `text-ok`, `text-err`) — so utilities follow the active theme without `dark:` variants. Use these tokens, never hard-coded colours. Fonts are `font-display` / `font-sans` / `font-mono`; easings `ease-out-expo` / `ease-out-quart`.

**Theming:** an inline script in `index.html` sets `data-theme` on `<html>` before first paint (stored choice in `localStorage.theme`, else the OS preference). `src/hooks/useTheme.ts` reads/toggles it; the Navbar has the toggle.

**Animation is the `motion` library, imported from `motion/react`** (not `framer-motion`). `App` wraps everything in `<MotionConfig reducedMotion="user">`. Patterns: `Reveal` (`whileInView`, `once: true`) for scroll reveals; the hero name uses a masked rise on load.

**Smooth scroll is Lenis** (`src/components/ScrollProvider.tsx`, mounted in `main.tsx`), disabled entirely under `prefers-reduced-motion`. Lenis runs on native scroll, so `useActiveSection` and `motion`'s scroll hooks work unchanged. Anywhere code scrolls programmatically, use `scrollToChapter(id, lenis)` from `src/data/chapters.ts` (grab `lenis` via `useLenis()` from `lenis/react`; `'top'` scrolls to the page top) rather than `window.scrollTo`.

**Contact form** (`src/components/ContactForm.tsx`) posts JSON to Formspree (`https://formspree.io/f/xeepkerq`). Validation is client-side in `validateForm`; the first invalid field is focused, errors are linked via `aria-describedby`, and network/non-OK responses surface an inline error with a mailto fallback.

## Conventions

- The `@` import alias maps to the project root (configured in both `vite.config.ts` and `tsconfig.json` `paths`).
- Image/asset imports rely on Vite ambient types declared in `src/vite-env.d.ts`. The portrait is `src/assets/portrait.webp` (640px wide, ~44 KB) — keep images WebP and sized for their display width.
- `vite.config.ts` toggles HMR via the `DISABLE_HMR` env var (used by AI Studio to prevent flicker during agent edits) — leave the `hmr` line alone.

## Deployment

Deployed on Vercel (`vercel.json`): build command `npm run build`, output `dist/`, with a catch-all rewrite to `/index.html` for SPA routing. Pushes to `main` auto-deploy. No environment variables are required; `vite.config.ts` still loads them via `loadEnv`.
