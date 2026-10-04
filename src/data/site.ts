// Absolute URLs for link previews (Open Graph / X cards). Crawlers don't run
// JavaScript, so `vite.config.ts` writes these into a static page per blog route
// at build time; `npm run og` renders the images into `public/og/`.

export const SITE_URL = 'https://sobanali.vercel.app';

/** The preview image for a page: `home`, `blog`, or a post's slug. */
export const ogImage = (name: string) => `${SITE_URL}/og/${name}.png`;

export const OG_IMAGE_SIZE = { width: 1200, height: 630 };
