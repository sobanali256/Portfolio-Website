import { ArrowUpRight } from 'lucide-react';
import Reveal from '../components/Reveal';
import { formatDate, postHref, posts as allPosts, type Post } from './posts';

// The writing index: one ruled entry per post, cover plate beside the text.
// Posts are full-page routes (/blog/<slug>), so these are plain links.
export default function PostList({ posts }: { posts: Post[] }) {
  return (
    <ol className="border-b border-rule">
      {posts.map((post, i) => {
        const Cover = post.cover;
        return (
          <Reveal as="li" key={post.slug} delay={Math.min(i, 4) * 0.05} className="border-t border-rule-strong">
            <a href={postHref(post)} className="group grid gap-8 py-9 md:grid-cols-12 md:gap-10 md:py-12">
              <div className="md:col-span-5">
                <div className="overflow-hidden rounded-[3px] border border-rule">
                  <Cover className="block h-auto w-full transition-transform duration-700 ease-out-expo group-hover:scale-[1.025]" />
                </div>
              </div>

              <div className="flex flex-col md:col-span-7 md:pt-1">
                <p className="label flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="text-accent">No. {String(allPosts.length - allPosts.indexOf(post)).padStart(2, '0')}</span>
                  <span className="text-rule-strong">/</span>
                  <time dateTime={post.date}>{formatDate(post.date)}</time>
                  <span className="text-rule-strong">/</span>
                  <span>{post.readingMinutes} min read</span>
                </p>

                <h3 className="mt-5 font-display text-[clamp(1.9rem,3.4vw,2.9rem)] leading-[1.05] text-ink transition-transform duration-500 ease-out-expo group-hover:translate-x-1.5">
                  {post.title}
                </h3>
                <p className="mt-5 max-w-[58ch] text-[16px] leading-[1.7]">{post.description}</p>

                <ul className="mt-6 flex flex-wrap gap-2" aria-label="Tags">
                  {post.tags.map((tag) => (
                    <li key={tag} className="rounded-full border border-rule-strong px-3 py-1 font-mono text-[11.5px] text-ink-2">
                      {tag}
                    </li>
                  ))}
                </ul>

                <span className="mt-8 inline-flex items-center gap-1 self-start text-[15px] font-medium text-ink md:mt-auto md:pt-8">
                  <span className="link-draw">Read the essay</span>
                  <ArrowUpRight size={16} className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </span>
              </div>
            </a>
          </Reveal>
        );
      })}
    </ol>
  );
}
