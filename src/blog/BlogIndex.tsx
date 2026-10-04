import { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { profile } from '../data/content';
import { BLOG_HREF, BlogShell, CONTAINER, EASE, Em, setMeta } from './BlogLayout';
import PostList from './PostList';
import { BLOG_DESCRIPTION, posts } from './posts';


function readTag(): string | null {
  return new URLSearchParams(window.location.search).get('tag');
}

export default function BlogIndex() {
  // Tags across all posts, most used first.
  const tags = useMemo(() => {
    const counts = new Map<string, number>();
    for (const post of posts) for (const tag of post.tags) counts.set(tag, (counts.get(tag) ?? 0) + 1);
    return [...counts].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  }, []);

  const [tag, setTag] = useState<string | null>(() => {
    const t = readTag();
    return t && posts.some((p) => p.tags.includes(t)) ? t : null;
  });
  const visible = tag ? posts.filter((p) => p.tags.includes(tag)) : posts;

  useEffect(() => {
    document.title = `Writing — ${profile.name}`;
    setMeta('meta[name="description"]', BLOG_DESCRIPTION);
    setMeta('meta[property="og:title"]', `Writing — ${profile.name}`);
    setMeta('meta[property="og:description"]', BLOG_DESCRIPTION);
  }, []);

  // Keep the filter in the URL so a filtered view can be shared.
  useEffect(() => {
    history.replaceState(null, '', tag ? `${BLOG_HREF}?tag=${encodeURIComponent(tag)}` : BLOG_HREF);
  }, [tag]);

  const chip = (label: string, value: string | null, count: number) => {
    const active = tag === value;
    return (
      <button
        key={label}
        type="button"
        onClick={() => setTag(value)}
        aria-pressed={active}
        className={`inline-flex cursor-pointer items-baseline gap-1.5 rounded-full border px-3.5 py-1.5 font-mono text-[12px] transition-colors duration-200 ${
          active ? 'border-ink bg-ink text-paper' : 'border-rule-strong text-ink-2 hover:border-ink hover:text-ink'
        }`}
      >
        {label}
        <span className={`text-[10.5px] tabular ${active ? 'text-paper/70' : 'text-muted'}`}>{count}</span>
      </button>
    );
  };

  return (
    <BlogShell page="index">
      <header id="top" className="relative overflow-hidden pb-12 pt-28 md:pb-16 md:pt-36">
        <div aria-hidden="true" className="ruled pointer-events-none absolute inset-0 [mask-image:linear-gradient(to_bottom,black,transparent_85%)] opacity-60" />
        <div className={`${CONTAINER} relative`}>
          <div className="flex items-center justify-between border-t border-rule-strong pt-4">
            <span className="label">
              <span className="text-accent">Writing</span>
              <span className="mx-2 text-rule-strong">—</span>
              {profile.name}
            </span>
            <span className="label">
              {posts.length} {posts.length === 1 ? 'essay' : 'essays'}
            </span>
          </div>

          <div className="mt-10 grid gap-10 md:mt-14 lg:grid-cols-12 lg:gap-10">
            <motion.h1
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.1, ease: EASE }}
              className="font-display text-[clamp(3rem,8vw,6.5rem)] leading-[0.98] tracking-[-0.02em] text-ink lg:col-span-7"
            >
              Notes from <Em>the workbench.</Em>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.3, ease: EASE }}
              className="max-w-[44ch] self-end text-[clamp(1.1rem,1.5vw,1.3rem)] leading-[1.55] text-ink-2 lg:col-span-4 lg:col-start-9"
            >
              Long-form notes on the AI systems I build: retrieval, agents, evaluation, and the research behind them.
              Written for whoever is building the same thing next.
            </motion.p>
          </div>

          {tags.length > 1 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.45 }}
              role="group"
              aria-label="Filter by topic"
              className="mt-14 flex flex-wrap items-center gap-2 md:mt-20"
            >
              <span className="label mr-2">Filter</span>
              {chip('All', null, posts.length)}
              {tags.map(([t, n]) => chip(t, t, n))}
            </motion.div>
          )}
        </div>
      </header>

      <section aria-label="Essays" className={`${CONTAINER} pb-24 md:pb-32`}>
        <PostList posts={visible} />
      </section>
    </BlogShell>
  );
}
