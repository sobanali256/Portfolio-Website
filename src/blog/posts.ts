import type { ComponentType } from 'react';
import { profile } from '../data/content';
import { ChunkingCover } from './covers';

// The writing index's description, also used for its link preview.
export const BLOG_DESCRIPTION = `Writing by ${profile.name}: long-form notes on retrieval, agents, evaluation and the research behind the AI systems I build.`;

export interface Post {
  slug: string;
  title: string;
  // The part of the title set in the italic accent; must be a suffix of `title`.
  titleAccent?: string;
  description: string;
  // Shorter versions for search results and link previews (≤60 / ≤125 characters,
  // before " — Soban Ali" is added to the title). Fall back to title/description.
  shareTitle?: string;
  shareDescription?: string;
  date: string; // ISO date, e.g. "2026-10-04"
  readingMinutes: number;
  tags: string[];
  tldr: string[];
  // Themed SVG plate used on the card and at the top of the post.
  cover: ComponentType<{ className?: string }>;
  coverCaption: string;
  // Loaded on demand so article text stays out of the portfolio bundle.
  loadBody: () => Promise<string>;
}

// The <title>/og:title and description used when a post is shared or indexed.
export const postPageTitle = (post: Post) => `${post.shareTitle ?? post.title} — ${profile.name}`;
export const postPageDescription = (post: Post) => post.shareDescription ?? post.description;

// Newest first. Adding a post: put the Markdown (without its title) in
// src/content/blog/<slug>.md and add an entry here.
export const posts: Post[] = [
  {
    slug: 'chunking-strategies-for-rag',
    title: 'Chunking Strategies for RAG: How to Choose the Right Approach',
    titleAccent: 'How to Choose the Right Approach',
    shareTitle: 'How to Choose a Chunking Strategy for RAG',
    shareDescription:
      'A practical guide to fixed-size, recursive, semantic and document-aware chunking, and how to evaluate each for RAG.',
    description:
      'A practical guide to fixed-size, recursive, semantic and document-aware chunking, with overlap, parent-child retrieval and evaluation strategies for RAG systems.',
    date: '2026-10-04',
    readingMinutes: 18,
    tags: ['RAG', 'Retrieval', 'Chunking', 'LLMs'],
    tldr: [
      'Chunking decides what evidence the retriever can return. No prompt, model or reranker can recover a fact that no retrieved chunk contains.',
      'Start simple: recursive splitting at around 512 tokens with 10–15% overlap, or fixed-size chunks for weakly structured text. Prepend headings whenever documents have them.',
      'Reach for semantic chunking on topic-shifting transcripts, and document-aware parsing for docs, policies and anything with tables.',
      'Parent-child retrieval separates the unit you match from the unit you send to the LLM, softening the small-versus-large trade-off.',
      'Evaluate retrieval directly, with labels tied to source spans rather than chunk IDs, and let observed failures justify every added piece of complexity.',
    ],
    cover: ChunkingCover,
    coverCaption: 'One document, cut into overlapping chunks.',
    loadBody: () => import('../content/blog/chunking-strategies-for-rag.md?raw').then((m) => m.default),
  },
];

export function getPost(slug: string): Post | undefined {
  return posts.find((post) => post.slug === slug);
}

export function postHref(post: Post): string {
  return `/blog/${post.slug}`;
}

export function formatDate(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}
