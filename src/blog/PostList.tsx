import { ArrowUpRight } from 'lucide-react';
import Reveal from '../components/Reveal';
import { formatDate, postHref, posts as allPosts, type Post } from './posts';

// The writing index: a grid of ruled entries (three per row on wide screens), cover plate above the text.
// Posts are full-page routes (/blog/<slug>), so these are plain links.
export default function PostList({ posts }: { posts: Post[] }) {
  return (
    <ol className="grid gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3 lg:gap-x-10">
      {posts.map((post, i) => {
        const Cover = post.cover;
        return (
          <Reveal as="li" key={post.slug} delay={Math.min(i, 4) * 0.05} className="border-t border-rule-strong">
            <a href={postHref(post)} className="group flex h-full flex-col pt-6">
              <div className="overflow-hidden rounded-[3px] border border-rule">
                <Cover className="block h-auto w-full transition-transform duration-700 ease-out-expo group-hover:scale-[1.025]" />
              </div>

              <p className="label mt-6 flex flex-wrap items-center gap-x-2 gap-y-1">
                <span className="text-accent">No. {String(allPosts.length - allPosts.indexOf(post)).padStart(2, '0')}</span>
                <span className="text-rule-strong">/</span>
                <time dateTime={post.date}>{formatDate(post.date)}</time>
                <span className="text-rule-strong">/</span>
                <span>{post.readingMinutes} min read</span>
              </p>

              <h3 className="mt-4 font-display text-[clamp(1.55rem,2.2vw,1.9rem)] leading-[1.08] text-ink transition-transform duration-500 ease-out-expo group-hover:translate-x-1">
                {post.title}
              </h3>
              <p className="mt-4 line-clamp-3 text-[15px] leading-[1.65]">{post.description}</p>

              <ul className="mt-5 flex flex-wrap gap-2" aria-label="Tags">
                {post.tags.map((tag) => (
                  <li key={tag} className="rounded-full border border-rule-strong px-2.5 py-0.5 font-mono text-[11px] text-ink-2">
                    {tag}
                  </li>
                ))}
              </ul>

              <span className="mt-auto inline-flex items-center gap-1 self-start pt-6 text-[14.5px] font-medium text-ink">
                <span className="link-draw">Read the essay</span>
                <ArrowUpRight size={15} className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </span>
            </a>
          </Reveal>
        );
      })}
    </ol>
  );
}
