import type { ComponentType } from 'react';
import { profile } from '../data/content';
import { ChunkSizeCover, ChunkingCover } from './covers';

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
    slug: 'chunk-size-and-overlap',
    title: 'Chunk Size & Overlap: What Actually Changes Retrieval?',
    titleAccent: 'What Actually Changes Retrieval?',
    shareDescription:
      'A pre-registered experiment on 100 QASPER papers: how chunk size and overlap change what a RAG retriever delivers.',
    description:
      'How chunk size and overlap change what a RAG retriever finds: the mechanisms, a controlled experiment on 100 research papers and 287 questions, and metrics that survive re-chunking.',
    date: '2026-10-26',
    readingMinutes: 17,
    tags: ['RAG', 'Retrieval', 'Chunking', 'Evaluation'],
    tldr: [
      'Chunk size trades finding the evidence against receiving it whole: under a 2,048-token budget, 128-token chunks hit most often but delivered the evidence whole for only 0.32 of questions, against 0.48 at 256 tokens.',
      'Compare sizes under an equal token budget, not only an equal K. At a fixed K, larger chunks win partly by sending more text and raising the random baseline.',
      'Put a floor (Random Hit@K) and an upper bound (Completable) next to every score, so you can tell luck from ranking and ranking from chunking.',
      'Overlap only guarantees facts up to O + 1 tokens, and real evidence is often longer. Its effect here was consistently positive but not statistically established.',
      'Label evidence text rather than chunk IDs, fix the comparisons before you look, and run the experiment on your own data: none of these numbers transfer.',
    ],
    cover: ChunkSizeCover,
    coverCaption: 'One evidence span, cut at 128, 256 and 512 tokens.',
    loadBody: () => import('../content/blog/chunk-size-and-overlap.md?raw').then((m) => m.default),
  },
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
