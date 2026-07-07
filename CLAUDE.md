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

**`src/App.tsx` is the monolith.** It holds all page content, the section markup, and the data that drives it (the `projects`, `skills`, `skillColors`, and `experiences` arrays near the top of the file). Section content is authored inline here, not in separate page components. The files in `src/components/` are small reusable presentational pieces consumed by `App.tsx`: `Navbar`, `Typewriter`, `SectionHeader`, and `ProjectCard`.

**Background is `src/components/backgrounds/Hyperspeed.tsx`**, a vanilla three.js + `postprocessing` (bloom/SMAA) highway scene ported from reactbits.dev, recolored to the warm editorial `@theme` palette (see the `EDITORIAL_COLORS` constant — kept in sync with `index.css` by hand, since three.js needs numeric hex, not CSS vars). It's mounted once, globally, `fixed inset-0 z-0` behind all sections (lazy-loaded via `React.lazy`, split into its own `vendor-three` chunk in `vite.config.ts`). It has no built-in mouse/scroll reactivity of its own — `useScrollSpeed` (`src/components/backgrounds/useScrollSpeed.ts`) reads Lenis's scroll velocity and drives the scene's `setBoost(0..1)` imperative handle through a GSAP `quickTo` tween, so fast scrolling briefly speeds up/widens the tunnel's fov. Respects `prefers-reduced-motion` (renders a static gradient instead) and pauses its render loop on `document.visibilitychange`.

**Sections are anchor-based and numbered.** Each `<section>` has an `id` (`hero`, `about`, `skills`, `projects`, `experience`, `contact`) and a two-digit number (`01`–`06`). The `navLinks` array in `src/components/Navbar.tsx` must stay in sync with these section `id`s, numbers, and order — Navbar smooth-scrolls to the ids and highlights the active section on scroll. When adding/renaming/reordering a section, update both `App.tsx` and `navLinks`.

**Styling is Tailwind CSS v4, configured entirely in CSS.** There is no `tailwind.config.js`. Tailwind is wired through the `@tailwindcss/vite` plugin (`vite.config.ts`), and the design system lives in the `@theme { ... }` block of `src/index.css`. Custom design tokens defined there become utility classes — e.g. `--color-bg-void` → `bg-bg-void`, `--color-accent-cyan` → `text-accent-cyan`/`border-accent-cyan`, and the fonts `--font-display`/`--font-body`/`--font-mono` → `font-display` etc. Use these tokens rather than hard-coded colors to stay on-palette. Note Tailwind v4 supports arbitrary numeric utilities like `z-100` directly.

**Animation is the `motion` library, imported from `motion/react`** (not `framer-motion`). Common patterns in the codebase: `whileInView` + `viewport={{ once: true }}` for scroll-reveal, and `useScroll`/`scrollYProgress` driving the Experience timeline rail's `scaleY`.

**Smooth scroll is Lenis, GSAP is additive.** `src/components/ScrollProvider.tsx` wraps the whole app (mounted in `main.tsx`) in `<ReactLenis root>` with `autoRaf: false`, syncing Lenis's `raf` to `gsap.ticker` and calling `ScrollTrigger.update()` on Lenis's `scroll` event — the standard Lenis+GSAP integration pattern. Lenis runs on native scroll (still updates `window.scrollY`/fires native `scroll` events), so the existing `useActiveSection` hook and `motion`'s `useScroll()` calls keep working unchanged. GSAP is scoped specifically to driving Hyperspeed's scroll-velocity reactivity (see `useScrollSpeed` above) — it does not replace `motion` for reveals/timelines. Anywhere code needs to scroll programmatically (nav links, chapter dots), use `scrollToChapter(id, lenis)` from `src/data/chapters.ts` (grab `lenis` via `useLenis()` from `lenis/react`) rather than `window.scrollTo`, so it doesn't fight Lenis's inertia.

**Contact form** posts JSON to a Formspree endpoint (`https://formspree.io/f/xeepkerq` in `App.tsx`). Validation is client-side in `validateForm`; submission handles network and non-OK HTTP responses and surfaces success/error states inline.

## Conventions

- The `@` import alias maps to the project root (configured in both `vite.config.ts` and `tsconfig.json` `paths`).
- Image/asset imports rely on Vite ambient types declared in `src/vite-env.d.ts`.
- `vite.config.ts` toggles HMR via the `DISABLE_HMR` env var (used by AI Studio to prevent flicker during agent edits) — leave the `hmr` line alone.

## Deployment

Deployed on Vercel (`vercel.json`): build command `npm run build`, output `dist/`, with a catch-all rewrite to `/index.html` for SPA routing. Pushes to `main` auto-deploy. The README documents a `GEMINI_API_KEY` Vercel env var; `vite.config.ts` loads env vars via `loadEnv`.
