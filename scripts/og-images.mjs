// Renders the link-preview images (1200×630 PNG) into public/og/: one for the
// portfolio, one for /blog and one per post. Run `npm run og` after adding a post
// or changing the profile, then commit the images.
//
// Cards are plain HTML in the site's "research paper" style, screenshotted with
// headless Chrome (set CHROME_PATH if it isn't found).

import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';

const root = path.resolve(import.meta.dirname, '..');
const outDir = path.join(root, 'public', 'og');

const CHROME_CANDIDATES = [
  process.env.CHROME_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
];
const chrome = CHROME_CANDIDATES.find((p) => p && existsSync(p));
if (!chrome) throw new Error('No Chrome/Edge found; set CHROME_PATH.');

// Load the site's own data through Vite so the TS/TSX sources are used as-is.
const vite = await createServer({ root, configFile: false, logLevel: 'error', server: { middlewareMode: true }, appType: 'custom', optimizeDeps: { noDiscovery: true, entries: [] } });
const { profile } = await vite.ssrLoadModule('/src/data/content.ts');
const { posts, formatDate, BLOG_DESCRIPTION } = await vite.ssrLoadModule('/src/blog/posts.ts');
const { SITE_URL } = await vite.ssrLoadModule('/src/data/site.ts');
await vite.close();

const host = new URL(SITE_URL).host;
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const portrait = `data:image/webp;base64,${readFileSync(path.join(root, 'src/assets/portrait.webp')).toString('base64')}`;

// A title with its accent suffix set in italic vermilion, as on the site.
const accented = (title, accent) =>
  accent && title.endsWith(accent)
    ? `${esc(title.slice(0, -accent.length))}<em>${esc(accent)}</em>`
    : esc(title);

const page = (body) => `<!doctype html>
<html><head><meta charset="utf-8">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Geist:wght@300..700&family=Geist+Mono:wght@400;500&family=Instrument+Serif:ital@0;1&display=block">
<style>
  :root {
    --paper: oklch(97.2% 0.009 80); --paper-2: oklch(94.6% 0.012 78);
    --ink: oklch(21% 0.012 60); --ink-2: oklch(38% 0.014 60); --muted: oklch(50% 0.014 62);
    --rule: oklch(87% 0.013 75); --rule-strong: oklch(76% 0.016 70); --accent: oklch(53% 0.175 36);
  }
  * { margin: 0; box-sizing: border-box; }
  html, body { width: 1200px; height: 630px; overflow: hidden; }
  body { background: var(--paper); color: var(--ink); font-family: 'Geist', sans-serif; padding: 56px 64px;
         display: flex; flex-direction: column; }
  .font-mono, .label { font-family: 'Geist Mono', monospace; }
  .label { font-size: 15px; letter-spacing: 0.14em; text-transform: uppercase; color: var(--muted); }
  .label b { color: var(--accent); font-weight: 400; }
  .bar { display: flex; justify-content: space-between; align-items: baseline; }
  .top { padding-bottom: 18px; border-bottom: 1px solid var(--rule-strong); }
  .bottom { padding-top: 18px; border-top: 1px solid var(--rule-strong); }
  main { flex: 1; display: flex; gap: 56px; align-items: center; min-height: 0; }
  .text { flex: 1; min-width: 0; }
  h1 { font-family: 'Instrument Serif', serif; font-weight: 400; letter-spacing: -0.02em; line-height: 0.98; }
  em { font-style: italic; color: var(--accent); }
  p { font-size: 25px; line-height: 1.4; color: var(--ink-2); }
  figure { flex: none; display: flex; flex-direction: column; gap: 12px; }
  figure .frame { border: 1px solid var(--rule-strong); background: var(--paper-2); overflow: hidden; }
  figure img, figure svg { display: block; width: 100%; height: 100%; object-fit: cover; }
  figcaption { font-size: 13px; }
</style></head><body>${body}</body></html>`;

const cards = {
  home: page(`
    <div class="bar top label"><span><b>§</b>&nbsp; ${esc(host)}</span><span>${esc(profile.location)}</span></div>
    <main>
      <div class="text">
        <h1 style="font-size:132px">${esc(profile.name)}</h1>
        <h1 style="font-size:60px;margin-top:10px"><em>${esc(profile.role)}</em></h1>
        <p style="margin-top:30px;max-width:620px">Multi-agent systems, RAG pipelines, and research replications that beat their baselines.</p>
      </div>
      <figure style="width:300px">
        <div class="frame" style="height:340px"><img src="${portrait}" alt=""></div>
        <figcaption class="label">Plate I — ${esc(profile.name)}</figcaption>
      </figure>
    </main>
    <div class="bar bottom label"><span>Portfolio · Writing · Résumé</span><span>${esc(profile.availability)}</span></div>`),

  blog: page(`
    <div class="bar top label"><span><b>§</b>&nbsp; ${esc(host)} / blog</span><span>${posts.length} ${posts.length === 1 ? 'essay' : 'essays'}</span></div>
    <main>
      <div class="text">
        <h1 style="font-size:132px">Writing<em>.</em></h1>
        <p style="margin-top:28px">${esc(BLOG_DESCRIPTION)}</p>
      </div>
    </main>
    <div class="bar bottom label"><span>${esc(profile.name)} — ${esc(profile.role)}</span><span>Long-form notes</span></div>`),
};

for (const post of posts) {
  const cover = renderToStaticMarkup(createElement(post.cover));
  const size = post.title.length > 70 ? 54 : post.title.length > 45 ? 62 : 72;
  cards[post.slug] = page(`
    <div class="bar top label"><span><b>§</b>&nbsp; ${esc(host)} / blog</span><span>${esc(formatDate(post.date))} · ${post.readingMinutes} min read</span></div>
    <main>
      <div class="text">
        <h1 style="font-size:${size}px;line-height:1.02">${accented(post.title, post.titleAccent)}</h1>
        <div class="label" style="margin-top:30px">${post.tags.map(esc).join(' · ')}</div>
      </div>
      <figure style="width:440px">
        <div class="frame" style="height:275px">${cover}</div>
        <figcaption class="label">Plate I</figcaption>
      </figure>
    </main>
    <div class="bar bottom label"><span>${esc(profile.name)} — ${esc(profile.role)}</span><span>Writing</span></div>`);
}

mkdirSync(outDir, { recursive: true });
const tmp = mkdtempSync(path.join(tmpdir(), 'og-'));
try {
  for (const [name, html] of Object.entries(cards)) {
    const file = path.join(tmp, `${name}.html`);
    const out = path.join(outDir, `${name}.png`);
    writeFileSync(file, html);
    execFileSync(chrome, [
      '--headless=new',
      '--disable-gpu',
      '--hide-scrollbars',
      '--force-device-scale-factor=1',
      '--window-size=1200,630',
      '--virtual-time-budget=10000',
      `--user-data-dir=${path.join(tmp, 'profile')}`,
      `--screenshot=${out}`,
      pathToFileURL(file).href,
    ], { stdio: 'ignore' });
    console.log(`og/${name}.png`);
  }
} finally {
  rmSync(tmp, { recursive: true, force: true });
}
