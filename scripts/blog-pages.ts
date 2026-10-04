// Build step: link-preview crawlers don't run JavaScript, so every route would
// share the portfolio's preview. After the build this writes dist/blog/index.html
// and dist/blog/<slug>/index.html, copies of the SPA shell with that page's title,
// description, URL and image. vercel.json rewrites /blog and /blog/:slug to them;
// an unknown slug gets 404.html, the plain shell, which renders the "not found" post.

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { createServer, type Plugin } from 'vite';

interface PageMeta {
  title: string;
  description: string;
  url: string;
  image: string;
  type: 'website' | 'article';
  published?: string;
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function setMeta(html: string, attr: 'name' | 'property', key: string, value: string) {
  const pattern = new RegExp(`(<meta ${attr}="${key}" content=")[^"]*(")`);
  if (!pattern.test(html)) throw new Error(`blog-pages: index.html has no <meta ${attr}="${key}">`);
  return html.replace(pattern, (_, start, end) => `${start}${esc(value)}${end}`);
}

function render(template: string, meta: PageMeta) {
  let html = template
    .replace(/<title>[^<]*<\/title>/, `<title>${esc(meta.title)}</title>`)
    .replace(/(<link rel="canonical" href=")[^"]*(")/, (_, a, b) => `${a}${esc(meta.url)}${b}`);
  html = setMeta(html, 'name', 'description', meta.description);
  html = setMeta(html, 'property', 'og:title', meta.title);
  html = setMeta(html, 'property', 'og:description', meta.description);
  html = setMeta(html, 'property', 'og:type', meta.type);
  html = setMeta(html, 'property', 'og:url', meta.url);
  html = setMeta(html, 'property', 'og:image', meta.image);
  html = setMeta(html, 'property', 'og:image:alt', meta.title);
  if (meta.published) {
    html = html.replace('<title>', `<meta property="article:published_time" content="${esc(meta.published)}" />\n    <title>`);
  }
  return html;
}

export function blogPages(): Plugin {
  let root = '';
  let outDir = '';
  return {
    name: 'blog-pages',
    apply: 'build',
    configResolved(config) {
      root = config.root;
      outDir = path.resolve(config.root, config.build.outDir);
    },
    async closeBundle() {
      // Load the site's own data so titles and descriptions can't drift.
      const server = await createServer({ root, configFile: false, logLevel: 'error', server: { middlewareMode: true }, appType: 'custom', optimizeDeps: { noDiscovery: true, entries: [] } });
      let mods;
      try {
        mods = await Promise.all([
          server.ssrLoadModule('/src/data/content.ts'),
          server.ssrLoadModule('/src/blog/posts.ts'),
          server.ssrLoadModule('/src/data/site.ts'),
        ]);
      } finally {
        await server.close();
      }
      const [{ profile }, { posts, BLOG_DESCRIPTION, postPageTitle, postPageDescription }, { SITE_URL, ogImage }] = mods;

      const template = readFileSync(path.join(outDir, 'index.html'), 'utf8');
      writeFileSync(path.join(outDir, '404.html'), template);
      const write = (route: string, meta: PageMeta) => {
        const dir = path.join(outDir, route);
        mkdirSync(dir, { recursive: true });
        writeFileSync(path.join(dir, 'index.html'), render(template, meta));
      };

      write('blog', {
        title: `Writing — ${profile.name}`,
        description: BLOG_DESCRIPTION,
        url: `${SITE_URL}/blog`,
        image: ogImage('blog'),
        type: 'website',
      });
      for (const post of posts) {
        write(`blog/${post.slug}`, {
          title: postPageTitle(post),
          description: postPageDescription(post),
          url: `${SITE_URL}/blog/${post.slug}`,
          image: ogImage(post.slug),
          type: 'article',
          published: post.date,
        });
      }
    },
  };
}
