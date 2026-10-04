import { useEffect, useRef, useState, type ReactNode } from 'react';
import { motion } from 'motion/react';
import { useLenis } from 'lenis/react';
import { ArrowLeft, ArrowRight, ArrowUp, ArrowUpRight, Check, Link2 } from 'lucide-react';
import { scrollToChapter } from '../data/chapters';
import { profile } from '../data/content';
import { BLOG_HREF, BlogShell, CONTAINER, EASE, Em, setMeta } from './BlogLayout';
import Markdown from './Markdown';
import TableOfContents, { useActiveHeading, useHeadings } from './TableOfContents';
import { formatDate, getPost, postHref, postPageDescription, postPageTitle, posts, type Post } from './posts';

const tagHref = (tag: string) => `${BLOG_HREF}?tag=${encodeURIComponent(tag)}`;
const X_HANDLE = profile.x.replace(/^https?:\/\/(www\.)?x\.com\//, '');

function PostHeader({ post, sections }: { post: Post; sections: number }) {
  const lead = post.titleAccent && post.title.endsWith(post.titleAccent) ? post.title.slice(0, -post.titleAccent.length) : post.title;
  const Cover = post.cover;
  const index = posts.length - posts.indexOf(post);

  return (
    <header id="top" className="relative overflow-hidden pb-14 pt-28 md:pb-20 md:pt-36">
      <div aria-hidden="true" className="ruled pointer-events-none absolute inset-0 [mask-image:linear-gradient(to_bottom,black,transparent_85%)] opacity-60" />
      <div className={`${CONTAINER} relative`}>
        <div className="flex items-center justify-between border-t border-rule-strong pt-4">
          <a href={BLOG_HREF} className="label transition-colors hover:text-ink">
            <span className="text-accent">Writing</span>
            <span className="mx-2 text-rule-strong">—</span>
            Essay No. {String(index).padStart(2, '0')}
          </a>
          <time dateTime={post.date} className="label hidden sm:block">{formatDate(post.date)}</time>
        </div>

        <div className="mt-10 grid gap-12 md:mt-14 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-7">
            <motion.ul
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.05 }}
              aria-label="Tags"
              className="mb-7 flex flex-wrap gap-2"
            >
              {post.tags.map((tag) => (
                <li key={tag}>
                  <a
                    href={tagHref(tag)}
                    className="block rounded-full border border-rule-strong px-3 py-1 font-mono text-[11.5px] text-ink-2 transition-colors duration-200 hover:border-ink hover:text-ink"
                  >
                    {tag}
                  </a>
                </li>
              ))}
            </motion.ul>
            <motion.h1
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.1, ease: EASE }}
              className="font-display text-[clamp(2.6rem,5.6vw,4.75rem)] leading-[1.02] tracking-[-0.015em] text-ink"
            >
              {lead}
              {post.titleAccent && lead !== post.title && <Em>{post.titleAccent}</Em>}
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.3, ease: EASE }}
              className="mt-8 max-w-[52ch] text-[clamp(1.1rem,1.5vw,1.3rem)] leading-[1.55] text-ink-2"
            >
              {post.description}
            </motion.p>
          </div>

          <motion.figure
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.35 }}
            className="lg:col-span-5"
          >
            <div className="overflow-hidden rounded-[3px] border border-rule">
              <Cover className="block h-auto w-full" />
            </div>
            <figcaption className="mt-3 text-[13px] text-muted">
              <span className="font-medium text-ink">Plate I</span> — {post.coverCaption}
            </figcaption>
          </motion.figure>
        </div>

        <motion.dl
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.5 }}
          className="mt-14 grid grid-cols-3 border-t border-rule-strong md:mt-20"
        >
          {([
            ['Published', <time dateTime={post.date}>{formatDate(post.date)}</time>],
            ['Reading time', `${post.readingMinutes} min`],
            ['Sections', sections > 0 ? sections : '—'],
          ] as [string, ReactNode][]).map(([k, v], i) => (
            <div key={k} className={`py-4 pr-4 md:py-5 md:pr-6 ${i > 0 ? 'border-l border-rule pl-4 md:pl-6' : ''}`}>
              <dt className="label mb-1.5">{k}</dt>
              <dd className="text-[15px] text-ink tabular">{v}</dd>
            </div>
          ))}
        </motion.dl>
      </div>
    </header>
  );
}

function Tldr({ points }: { points: string[] }) {
  return (
    <aside aria-labelledby="tldr-label" className="mb-14 border-y border-rule-strong bg-paper-2/60 px-5 py-7 sm:px-8">
      <p id="tldr-label" className="label mb-5">
        <span className="text-accent">TL;DR</span>
        <span className="mx-2 text-rule-strong">—</span>
        The short version
      </p>
      <ol className="space-y-3.5">
        {points.map((point, i) => (
          <li key={point} className="grid grid-cols-[2rem_1fr] text-[16px] leading-[1.65] text-ink">
            <span className="pt-[0.3em] font-mono text-[11px] text-accent tabular">{String(i + 1).padStart(2, '0')}</span>
            <span>{point}</span>
          </li>
        ))}
      </ol>
    </aside>
  );
}

function ShareRow({ post }: { post: Post }) {
  const [copied, setCopied] = useState(false);
  const url = typeof window !== 'undefined' ? `${window.location.origin}${postHref(post)}` : postHref(post);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {}
  };
  const shares = [
    { name: 'LinkedIn', href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}` },
    { name: 'X', href: `https://x.com/intent/post?url=${encodeURIComponent(url)}&text=${encodeURIComponent(post.title)}&via=${X_HANDLE}` },
  ];
  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-[14px]">
      <span className="label">Share</span>
      <button type="button" onClick={copy} className="group inline-flex cursor-pointer items-center gap-1.5 text-ink">
        {copied ? <Check size={14} className="text-ok" /> : <Link2 size={14} strokeWidth={1.7} />}
        <span className="link-draw">{copied ? 'Link copied' : 'Copy link'}</span>
        <span role="status" className="sr-only">{copied ? 'Link copied' : ''}</span>
      </button>
      {shares.map(({ name, href }) => (
        <a key={name} href={href} target="_blank" rel="noopener noreferrer" className="group inline-flex items-center gap-1 text-ink">
          <span className="link-draw">{name}</span>
          <ArrowUpRight size={14} className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
        </a>
      ))}
    </div>
  );
}

function EndMatter({ post }: { post: Post }) {
  const i = posts.indexOf(post);
  const newer = posts[i - 1];
  const older = posts[i + 1];

  return (
    <div className="mt-20 space-y-10">
      <div className="border-t border-rule-strong pt-6">
        <ShareRow post={post} />
      </div>

      <nav aria-label="More writing" className="grid border-t border-rule sm:grid-cols-2">
        {older ? (
          <a href={postHref(older)} className="group py-6 sm:pr-6">
            <span className="label flex items-center gap-1.5"><ArrowLeft size={13} /> Previous</span>
            <span className="mt-2 block font-display text-[1.4rem] leading-tight text-ink">{older.title}</span>
          </a>
        ) : (
          <a href={BLOG_HREF} className="group py-6 sm:pr-6">
            <span className="label flex items-center gap-1.5"><ArrowLeft size={13} /> Back</span>
            <span className="mt-2 block font-display text-[1.4rem] leading-tight text-ink">All writing</span>
          </a>
        )}
        {newer && (
          <a href={postHref(newer)} className="group border-t border-rule py-6 sm:border-l sm:border-t-0 sm:pl-6 sm:text-right">
            <span className="label flex items-center gap-1.5 sm:justify-end">Next <ArrowRight size={13} /></span>
            <span className="mt-2 block font-display text-[1.4rem] leading-tight text-ink">{newer.title}</span>
          </a>
        )}
      </nav>
    </div>
  );
}

function NotFound() {
  return (
    <section className={`${CONTAINER} pb-32 pt-36`}>
      <p className="label border-t border-rule-strong pt-4">
        <span className="text-accent">404</span>
        <span className="mx-2 text-rule-strong">—</span>
        Not found
      </p>
      <h1 className="mt-8 max-w-[18ch] font-display text-[clamp(2.5rem,5.5vw,4.5rem)] leading-[1.02]">
        This essay <Em>doesn’t exist.</Em>
      </h1>
      <p className="mt-6 max-w-[48ch] text-[17px] leading-[1.75]">It may have moved, or the link has a typo.</p>
      <a href={BLOG_HREF} className="group mt-10 inline-flex items-center gap-2 text-[15px] font-medium text-ink">
        <ArrowLeft size={16} className="transition-transform duration-300 group-hover:-translate-x-0.5" />
        <span className="link-draw">See all writing</span>
      </a>
    </section>
  );
}

export default function BlogPost({ slug }: { slug: string }) {
  const post = getPost(slug);
  const [body, setBody] = useState<string | null>(null);
  const articleRef = useRef<HTMLElement>(null);
  const headings = useHeadings(articleRef, body);
  const active = useActiveHeading(headings);
  const lenis = useLenis();
  const mobileToc = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    if (!post) {
      document.title = `Not found — ${profile.name}`;
      return;
    }
    const title = postPageTitle(post);
    document.title = title;
    setMeta('meta[name="description"]', postPageDescription(post));
    setMeta('meta[property="og:title"]', title);
    setMeta('meta[property="og:description"]', postPageDescription(post));
    setMeta('meta[property="og:type"]', 'article');
    let cancelled = false;
    post.loadBody().then((text) => {
      if (!cancelled) setBody(text);
    });
    return () => {
      cancelled = true;
    };
  }, [post]);

  // Honour a #section in the URL once the article has rendered.
  useEffect(() => {
    if (!body || !window.location.hash) return;
    const id = decodeURIComponent(window.location.hash.slice(1));
    requestAnimationFrame(() => scrollToChapter(id, lenis));
  }, [body, lenis]);

  if (!post) {
    return (
      <BlogShell page="post">
        <NotFound />
      </BlogShell>
    );
  }

  return (
    <BlogShell page="post" progress>
      <PostHeader post={post} sections={headings.filter((h) => h.level === 2).length} />

      <div className={`${CONTAINER} pb-24 md:pb-32`}>
        <div className="grid gap-12 lg:grid-cols-[14rem_minmax(0,1fr)] lg:gap-14 xl:grid-cols-[16rem_minmax(0,1fr)] xl:gap-20">
          <aside aria-label="Table of contents" className="hidden lg:block">
            <div className="sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto overscroll-contain pb-6 [scrollbar-width:thin]" data-lenis-prevent data-toc-scroll>
              <p className="label mb-4 border-t border-rule-strong pt-4">
                <span className="text-accent">Contents</span>
              </p>
              <TableOfContents headings={headings} active={active} />
              <div className="mt-6 border-t border-rule pt-4">
                <a
                  href="#top"
                  onClick={(e) => {
                    e.preventDefault();
                    scrollToChapter('top', lenis);
                  }}
                  className="group inline-flex items-center gap-1.5 text-[13px] text-muted transition-colors hover:text-ink"
                >
                  <ArrowUp size={13} className="transition-transform duration-300 group-hover:-translate-y-0.5" />
                  Back to top
                </a>
              </div>
            </div>
          </aside>
          <div className="min-w-0 max-w-[46rem]">
            <Tldr points={post.tldr} />

            {headings.length > 0 && (
              <details ref={mobileToc} className="toc-details mb-12 border-y border-rule lg:hidden">
                <summary className="flex cursor-pointer list-none items-center justify-between py-4">
                  <span className="label">
                    <span className="text-accent">Contents</span>
                    <span className="mx-2 text-rule-strong">—</span>
                    {headings.filter((h) => h.level === 2).length} sections
                  </span>
                  <span aria-hidden="true" className="toc-chevron font-mono text-[15px] text-muted">+</span>
                </summary>
                <div className="pb-5">
                  <TableOfContents headings={headings} active={active} onNavigate={() => mobileToc.current?.removeAttribute('open')} />
                </div>
              </details>
            )}

            <article ref={articleRef} className="prose-paper">
              {body === null ? (
                <div aria-live="polite" className="space-y-4">
                  <p className="label">Loading the essay…</p>
                  {[100, 92, 97, 64].map((w) => (
                    <div key={w} className="h-3 animate-pulse rounded-full bg-paper-2" style={{ width: `${w}%` }} />
                  ))}
                </div>
              ) : (
                <Markdown body={body} />
              )}
            </article>

            {body !== null && <EndMatter post={post} />}
          </div>

        </div>
      </div>
    </BlogShell>
  );
}
