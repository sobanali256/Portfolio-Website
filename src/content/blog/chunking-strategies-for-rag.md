## 1. Why Chunking Matters

A RAG system can fail even with a strong model, because the model can only reason over the evidence the retriever gives it. If the required evidence is not retrieved, the model cannot reliably ground its answer in that evidence. Depending on the system design, it may guess, give an incomplete answer, or abstain.

Chunking shapes that evidence. If the right fact is split across two chunks, buried in a chunk full of unrelated text, or separated from the context that explains it, retrieval gets harder before any prompt or model choice comes into play. Better prompts, larger models, and rerankers can't recover information that no retrieved chunk contains.

**A hypothetical example.** Imagine an assistant over a company's travel policy. An employee asks whether they can book business class for a 9-hour flight. The policy says business class is allowed for flights over 8 hours, but only with director approval, and that condition sits in the next paragraph. If the chunker cut between those two sentences, the retriever may return only the first one. The model may then give a confident but incomplete answer, and the root cause is retrieval, not the model or the prompt.

This article walks through foundational chunking strategies, what each one trades off, and how to decide between them. The short version: start with the simplest approach that fits your documents, then let retrieval evaluation tell you when to change it.

**At a glance:**

| Approach | Good starting use | Main weakness |
| --- | --- | --- |
| [Fixed-size](#41-fixed-size-chunking) | Weakly structured text, baselines | Ignores semantic boundaries |
| [Recursive](#42-recursive--structure-aware-chunking) | Well-formatted prose | Depends on useful separators |
| [Semantic](#43-semantic-chunking) | Topic-shifting unstructured text | Extra compute and threshold tuning |
| [Document-aware](#44-document-aware-chunking) | Docs, papers, tables, policies | Requires reliable parsing |
| [Overlap](#5-overlap-as-a-separate-design-decision) (technique) | Reducing boundary splits | Duplication and index growth |
| [Parent-child](#7-escaping-the-small-vs-large-trade-off) (technique) | Specific retrieval plus richer context | More indexing and retrieval logic |

## 2. Where Chunking Fits in a RAG Pipeline

In a typical RAG pipeline, chunking splits a document into smaller passages before they are embedded and indexed. Retrieval then works on those passages, not on whole documents.

A typical ingestion and query flow looks like this:

1. **Extraction and parsing**: get clean text out of the source. This can include PDF extraction, OCR for scanned pages, HTML cleaning, normalisation, and attaching metadata such as title, source, and section.
2. **Chunking**: split the parsed text into passages.
3. **Embedding**: convert each chunk into a vector with an embedding model.
4. **Indexing**: store the vectors, usually with their text and metadata.
5. **Retrieval**: embed the user's query, find the closest chunks, and pass them to the LLM as context.

So chunking is not literally the first step. It is one of the earliest retrieval-design decisions after extraction and parsing, and its quality depends on theirs. A chunker can't respect a section boundary that the PDF extractor already flattened.

```diagram
rag-pipeline
```

In a typical chunk-then-embed pipeline, chunking happens during ingestion, and later queries retrieve from those precomputed chunks.

Why not embed whole documents? Embedding models have a maximum input length, and a single vector for a long document has to represent every topic in it at once. A query about pricing then competes with content about timelines, staffing, and legal terms in the same vector.

In most RAG systems, the chunk is the unit of retrieval. Section 7 covers a useful exception: the unit you retrieve doesn't have to be the unit you send to the LLM.

## 3. The Core Trade-Off

Every chunking strategy is a different answer to one question: how much text belongs together?

| | Smaller chunks | Larger chunks |
| --- | --- | --- |
| Specificity | Often higher: fewer competing concepts per chunk | Often lower: several topics share one chunk |
| Context | Thin: a sentence can lose its meaning alone | Rich: surrounding explanation stays attached |
| Irrelevant text sent to the LLM | Less | More |
| Typical failure | The answer is split across chunks | The answer is buried in unrelated text |

Smaller chunks often contain fewer competing concepts, which may improve retrieval specificity. But chunks that are too small can lose the context needed to interpret them. "It was reduced to 12% in 2024" means nothing without knowing what "it" is.

Larger chunks keep that context, but each one mixes more ideas, so its embedding is a less specific match for any single question. They also use more of the LLM's context window on text it doesn't need, which can make the relevant part harder to use.

The strategies below are different ways of drawing boundaries so that each chunk is small enough to match specifically and large enough to make sense on its own. Section 7 shows how to partly escape this trade-off by retrieving small chunks but returning larger context.

## 4. Choosing Chunk Boundaries

There are several foundational chunk-boundary strategies worth understanding first. They differ in one thing: where they decide one chunk ends and the next begins. This list isn't exhaustive; section 10 points to more advanced approaches.

Some techniques are not boundary strategies at all. Overlap, heading or metadata enrichment, and parent-child context expansion can be combined with any of the strategies below, so they get their own discussion in sections 4.4, 5, and 7.

### 4.1 Fixed-Size Chunking

**Example scenario:** a records team has digitised 15 years of scanned maintenance logs. After OCR, each file is a long stream of text with unreliable line breaks, no headings, and occasional text from neighbouring columns mixed in. There is little trustworthy structure to split on, and the team wants a searchable baseline quickly. Fixed-size chunking gives them one without depending on structure the OCR output doesn't have.

**How it works:** split the text every N tokens, regardless of what the text says. No additional structure-aware parsing or model calls are required.

Whenever possible, measure size with the tokenizer of the embedding model you will actually use, because that is what its input limit is counted in. The example below assumes OpenAI's `text-embedding-3-small` and uses `tiktoken.encoding_for_model()` so the tokenizer is resolved from the embedding model rather than hard-coded. OpenAI's embeddings guide says to use `cl100k_base` for third-generation embedding models such as this one, and lists their maximum input as 8,192 tokens ([3](https://developers.openai.com/api/docs/guides/embeddings)). For any other embedding model, use that model's own tokenizer; `tiktoken` is not a universal choice.

```python
import tiktoken

EMBEDDING_MODEL = "text-embedding-3-small"
enc = tiktoken.encoding_for_model(EMBEDDING_MODEL)  # resolves to cl100k_base

def count_tokens(text: str) -> int:
    return len(enc.encode(text))

def fixed_size_chunks(text: str, size: int = 512) -> list[str]:
    if size <= 0:
        raise ValueError("size must be positive")
    tokens = enc.encode(text)
    return [enc.decode(tokens[i:i + size]) for i in range(0, len(tokens), size)]
```

**A note for production:** this example illustrates the idea of fixed-token chunking, not a production splitter. Slicing a token list and decoding each slice can corrupt text at the cut points. With byte-level tokenizers such as `tiktoken`'s, the UTF-8 byte sequence representing a Unicode character can span multiple tokens, so cutting between those tokens can lead to decoding artifacts. Production splitters avoid this by moving cut points to character or word boundaries, and library implementations are generally safer than a hand-rolled loop.

**Example:** a 2,000-token log file at size 512 becomes four chunks: three of 512 tokens and one of 464.

**Advantages:**

- Simple, fast, and deterministic.
- Predictable chunk sizes, which makes token budgeting easy.
- A useful baseline to measure everything else against.

**Limitations:**

- It cuts mid-sentence, mid-paragraph, and even mid-word or mid-table.
- A definition can land in one chunk and the term it defines in the next.
- It ignores any structure the documents do have.

**When to use it:**

- Long text with weak or unreliable structure: OCR output, raw transcripts, scraped text with formatting stripped.
- Prototypes where you need a working baseline before investing in parsing.
- A benchmark that smarter strategies have to beat.

It is a poor fit for contracts, manuals, or anything with tables, where a cut in the wrong place changes the meaning. It is also unnecessary for collections of short, self-contained items such as individual support tickets or product reviews, where each item may already be a natural retrieval unit.

Fixed-size chunking is a reasonable baseline and rarely the final answer for structured documents. Start here when structure is weak, measure, and add complexity only when evaluation shows a need.

### 4.2 Recursive / Structure-Aware Chunking

**Example scenario:** an internal assistant over a company's HR handbook and engineering wiki. The pages are written by people, with clear paragraphs: one on parental leave, one on remote work, one on expense limits. An employee asks, "How many weeks of parental leave do I get?" Fixed-size chunks might cut the leave paragraph in half and attach it to the start of the remote-work policy. A recursive splitter tends to keep it whole, because it prefers the paragraph break the author already wrote.

**How it works:** try to split on the largest meaningful separator first, and fall back to smaller ones only for pieces that are still too big. The example below uses this order:

1. Paragraphs (`\n\n`)
2. Lines (`\n`)
3. Sentences, approximated by `". "`
4. Words (`" "`)

This educational version is simplified. It merges small adjacent pieces up to the size limit, has no overlap, and returns an oversized piece as-is if no separator can break it. It reuses `count_tokens` from section 4.1, so size is measured in the embedding model's tokens.

```python
def recursive_chunks(text, max_tokens=512, seps=("\n\n", "\n", ". ", " ")):
    if count_tokens(text) <= max_tokens or not seps:
        return [text]
    sep, rest = seps[0], seps[1:]
    chunks, current = [], ""
    for part in text.split(sep):
        candidate = f"{current}{sep}{part}" if current else part
        if count_tokens(candidate) <= max_tokens:
            current = candidate
            continue
        if current:
            chunks.append(current)
        if count_tokens(part) <= max_tokens:
            current = part
        else:
            chunks.extend(recursive_chunks(part, max_tokens, rest))
            current = ""
    if current:
        chunks.append(current)
    return chunks
```

In practice you would likely use a library implementation such as LangChain's `RecursiveCharacterTextSplitter`. It follows the same general idea, with more complete handling of sizing, merging, overlap, and separators. Two defaults are worth knowing: it measures `chunk_size` in characters unless you pass a different length function, and its default separators are `["\n\n", "\n", " ", ""]`, with no sentence separator ([1](https://docs.langchain.com/oss/python/integrations/splitters/recursive_text_splitter)).

This example does not split on headings. Splitters can be given heading separators, but using headings properly, by carrying them into each chunk, is covered under document-aware chunking in 4.4.

**Why structure helps:** authors often put one idea per paragraph. Preferring paragraph breaks keeps ideas intact more often than an arbitrary token count, at almost no extra cost.

**When it works well:** prose with consistent paragraph formatting. For general-purpose RAG over this kind of text, it is a reasonable default to test first.

**Good fits:** company wikis, help-centre articles, blog posts, email threads, and course notes.

### 4.3 Semantic Chunking

**Example scenario:** a sales team wants to search transcripts of hour-long client calls. One call drifts from introductions to pricing, then to an integration question, back to pricing, then to timelines. The transcript is a wall of speaker turns with no headings and inconsistent line breaks. A recursive splitter has little structure to work with, and fixed-size chunks mix pricing with integration talk. Semantic chunking tries to split where the conversation actually changes topic.

**How it works:** instead of splitting on characters or formatting, split where the meaning appears to shift.

1. Split the text into sentences.
2. Embed each sentence.
3. Measure cosine distance between neighbouring sentences.
4. Where the distance is unusually large, start a new chunk.

Semantic chunking can use embedding similarity between neighbouring sentences to identify likely topic shifts. LangChain previously provided an experimental `SemanticChunker` implementing a version of this approach, but the example below is intentionally library-independent.

**The code below is a simplified educational example, not a definitive algorithm.** Production implementations commonly add some of the following: a context window of neighbouring sentences per embedding (the former LangChain version grouped sentences before comparing), minimum and maximum chunk sizes, smoothing of the distance curve, more robust sentence segmentation, and alternative breakpoint rules such as standard deviation, interquartile range, or gradient.

```python
import numpy as np
from sentence_transformers import SentenceTransformer

# Used only to detect topic shifts, not necessarily for indexing.
model = SentenceTransformer("all-MiniLM-L6-v2")

def semantic_chunks(sentences: list[str], percentile: int = 90) -> list[str]:
    if len(sentences) < 2:
        return [" ".join(sentences)]
    emb = model.encode(sentences, normalize_embeddings=True)
    distances = 1 - np.sum(emb[:-1] * emb[1:], axis=1)  # cosine distance
    threshold = np.percentile(distances, percentile)
    chunks, start = [], 0
    for i, d in enumerate(distances):
        if d > threshold:
            chunks.append(" ".join(sentences[start:i + 1]))
            start = i + 1
    chunks.append(" ".join(sentences[start:]))
    return chunks
```

Because the embeddings are normalised, the dot product of neighbouring vectors is their cosine similarity, and one minus that is the distance. The percentile sets the sensitivity: a higher value means fewer breakpoints and larger chunks.

Two details matter. First, nothing here caps chunk size, so a long single-topic stretch can produce one oversized chunk; a real pipeline would pass large chunks through a size-limited splitter. Second, semantic chunking can involve two different models: one that detects breakpoints, and the embedding model that indexes the final chunks. Each has its own tokenizer and maximum input length. Chunk size should be measured with the indexing model's tokenizer, as in 4.1. For the breakpoint model used here, `all-MiniLM-L6-v2` truncates input longer than 256 word pieces by default ([2](https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2)). That is usually enough for ordinary sentences, but unusually long sentences, which are common in legal, technical, or OCR'd text, can still exceed it.

**Advantages:**

- Boundaries follow topic shifts rather than formatting.
- It can work on messy text where structure-based splitting has little to use.

**Costs and caveats:**

- Every sentence is embedded at ingestion, on top of embedding the final chunks.
- The threshold is a tunable parameter, so results vary across corpora.
- Short sentences produce noisy similarity scores, which can cause odd splits.

**When it's worth it:** unstructured or conversational text, or when evaluation shows recursive chunking failing on topic boundaries. It isn't an obvious default: it adds ingestion cost, and a well-tuned recursive splitter may perform comparably on well-formatted text. Test both on your own data.

**Good fits:** sales and meeting call transcripts, podcast and lecture transcripts, long customer chat sessions, and scraped web text where the formatting was lost.

### 4.4 Document-Aware Chunking

**Example scenario:** a support bot over a SaaS product's API docs and pricing page. A developer asks, "What's the rate limit on the Pro plan?" The answer lives in a table with plans as rows and limits as columns. A generic splitter can turn that table into a stream of numbers, cut it mid-row, and separate it from the header, so "1,000" no longer says it means requests per minute, or which plan it belongs to. On top of that, "Rate limits" appears under five different endpoints, so a chunk without its heading path is ambiguous.

**How it works:** parse the document's actual structure first, then chunk along it. Different content types need different rules:

| Content | What goes wrong with naive chunking | Document-aware approach |
| --- | --- | --- |
| Headings | A chunk loses which section it belongs to | Prepend the heading path to every chunk ("Pricing > Enterprise tier") |
| Sections | Unrelated sections merge into one chunk | Don't let a chunk cross a section boundary |
| Tables | Rows split from their header, numbers lose meaning | Keep small tables whole; for large ones, repeat the header with each row group |
| Research papers | Abstract, methods, and results blend together | Chunk per section; keep figure captions with their figures |
| Documentation | Code examples split from the explanation | Keep code blocks intact and attached to the paragraph above |

**Heading and metadata enrichment** is a strong low-cost technique here. A chunk that says "The limit is 100 requests per minute" is ambiguous on its own. The same chunk prefixed with "API Reference > Rate Limits > Free Tier" carries the context a query is likely to mention. Enrichment is a cross-cutting technique, not a boundary strategy: you can prepend headings, titles, or other metadata to chunks produced by any of the strategies above.

Metadata isn't free, though. Every prepended token counts towards the embedding model's input limit and the LLM's context budget, and a long heading path can crowd out the content of a short chunk. The code below measures the real token cost of the prefix and stops with a clear error if the prefix leaves no room for content.

The example below is simplified. It assumes headings sit in their own blank-line-separated block, treats each paragraph as a separate unit rather than merging paragraphs within a section, and does not handle fenced code blocks, where a line starting with `#` may be a comment rather than a heading. For real Markdown, use a proper parser or a library splitter built for it.

```python
def chunk_markdown(md: str, max_tokens: int = 512) -> list[str]:
    chunks, path = [], []
    for block in md.split("\n\n"):
        if block.startswith("#"):
            level = len(block) - len(block.lstrip("#"))
            path = path[:level - 1] + [block.lstrip("# ").strip()]
            continue
        prefix = " > ".join(path)
        header = f"{prefix}\n\n" if prefix else ""
        budget = max_tokens - count_tokens(header)  # real cost of prefix + separator
        if budget <= 0:
            raise ValueError(
                f"Heading path {prefix!r} uses the whole {max_tokens}-token budget. "
                "Shorten it (for example, keep only the last two headings) or raise max_tokens."
            )
        for piece in recursive_chunks(block, budget):
            chunks.append(header + piece)
    return chunks
```

Counting the header and the content separately is a close approximation, not an exact guarantee: tokens can merge across the join, so leave a small safety margin below the model's hard limit. Instead of raising an error, you could also simplify the metadata automatically, for example by keeping only the nearest headings.

**When to use it:**

- API and product documentation, where code blocks and heading paths matter.
- Contracts and policies, where every clause belongs to a numbered section.
- Research papers, where methods and results should stay apart.
- RFPs and proposals, which tend to follow repeated section templates.
- Anything with tables: pricing pages, spec sheets, financial reports.

The parsing effort often pays off when documents have consistent structure. For PDFs, extraction is usually the harder part: if the extractor loses headings or table layout, no chunker can recover them.

## 5. Overlap as a Separate Design Decision

Overlap isn't a boundary strategy of its own. It's a parameter you can add to most of them: consecutive chunks share a window of text, so information near a boundary has a better chance of appearing whole in at least one chunk. It is most visible with fixed-size chunking, which cuts without regard to meaning, but library recursive splitters expose it too.

**Example scenario:** an online store's refund policy is indexed with fixed-size chunks and no overlap. A customer asks, "Can I get a refund on a sale item?" Chunk 7 ends with "Refunds are available within 30 days of purchase." Chunk 8 starts with "This does not apply to discounted items." The retriever returns chunk 7 alone, and the bot says yes. The exception that changes the answer was just across the boundary.

```python
def overlapping_chunks(text: str, size: int = 512, overlap: int = 64) -> list[str]:
    if size <= 0:
        raise ValueError("size must be positive")
    if not 0 <= overlap < size:
        raise ValueError("overlap must satisfy 0 <= overlap < size")
    tokens = enc.encode(text)  # same tokenizer as section 4.1
    step = size - overlap
    starts = range(0, max(len(tokens) - overlap, 1), step)
    return [enc.decode(tokens[i:i + size]) for i in starts]
```

The validation keeps `step` positive, so `range()` never receives a zero or negative step. The `max(len(tokens) - overlap, 1)` bound stops the loop from emitting a final chunk that would contain nothing but text already in the previous one. The production caveat from 4.1 about decoding raw token slices applies here too.

**Example:** with size 512 and overlap 64, chunk 1 covers tokens 0–511, chunk 2 covers 448–959, and chunk 3 covers 896–1407. The last 64 tokens of each chunk are the first 64 of the next.

```diagram
overlap
```

Overlap improves boundary robustness: text near a cut point appears together with its neighbours in at least one chunk. It reduces the chance that a fact is divided across chunks, but doesn't eliminate it. A condition that sits further from the boundary than the overlap window can still be separated, which is the case in the refund example if the exception is more than 64 tokens away.

**Benefits:**

- Fewer facts divided at chunk boundaries.
- Simple and cheap to add.
- Often reduces boundary-related retrieval misses in practice, though it's worth measuring on your own data.

**Costs:**

- A larger index. The number of chunks scales roughly with size / (size − overlap), so 20% overlap means about 25% more chunks. That figure is an approximation that holds for documents much longer than one chunk; short documents behave differently.
- Duplicate context. Top-K results can include neighbouring chunks that repeat the same text, which uses context slots on duplicates instead of new information.
- Noisier evaluation, because the same passage can be counted as retrieved more than once.

**A reasonable starting point** is around 10–20% overlap. If top-K results keep returning adjacent chunks, consider deduplicating or merging neighbours after retrieval rather than increasing overlap further.

**When to use it:** whenever chunk boundaries are likely to fall inside connected text: refund and returns policies, terms of service, meeting notes, lecture transcripts.

## 6. Choosing Chunk Size

There's no universally correct chunk size. A number like 512 tokens is a starting point, not an answer. These factors usually decide it:

| Factor | Pushes toward smaller chunks | Pushes toward larger chunks |
| --- | --- | --- |
| Document type | FAQs, specs, reference tables | Narratives, legal reasoning, long arguments |
| Query type | Factoid lookups ("What's the rate limit?") | Explanations and summaries ("Why was X decided?") |
| Embedding model | Models with short input limits or trained mainly on short passages | Models with long input limits trained to embed longer text |
| Retrieval strategy | A reranker over many candidates, high top-K | Low top-K with no reranker |
| Evidence needed | The evidence fits in a sentence or two | The evidence spans several paragraphs |

A few practical notes:

- **Check your embedding model's maximum input length, and what your stack does when it's exceeded.** Over-length input may be truncated or rejected depending on the model, library, and API. For example, the `all-MiniLM-L6-v2` model card says input over 256 word pieces is truncated by default ([2](https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2)). OpenAI's API reference, by contrast, states that each input must not exceed 8,192 tokens, and over-length requests are rejected with an error rather than truncated ([3](https://developers.openai.com/api/reference/resources/embeddings)). Truncation is the more dangerous of the two, because the end of the chunk is dropped without a visible failure.
- **Retrieval strategy changes the calculation.** A reranker makes it more practical to retrieve many fine-grained candidates and let it pick. Without one, each chunk has to carry more context on its own. Hybrid search on its own doesn't imply a particular chunk size.
- **Match chunk size to the typical evidence span required to answer the query.** A short answer may still need several paragraphs of supporting evidence, such as a rule and its exceptions. If most queries need about a paragraph of evidence, chunks much larger than that mostly add unrelated text.

For prose, roughly 256–1,024 tokens is a reasonable range to start testing, as long as it stays within your embedding model's limit. Compare two or three sizes on your own evaluation set rather than trusting any default, including this one.

## 7. Escaping the Small-vs-Large Trade-Off

The trade-off in section 3 assumes that the chunk you retrieve is also the chunk you send to the LLM. It doesn't have to be. The retrieval unit and the generation-context unit can differ.

**Parent-child (small-to-big) retrieval** separates the two:

1. Split each document into larger **parent** units, such as sections.
2. Split each parent into small **child** chunks, and index only the children.
3. At query time, match against the small children, which tend to be specific.
4. Return each matched child's parent to the LLM, which carries the surrounding context.

**Example scenario:** in the travel-policy example from section 1, the query matches a small child chunk containing "business class is allowed for flights over 8 hours." Instead of sending only that sentence, the system sends the whole "Flight class" section, which includes the director-approval condition.

```python
# Index small child chunks, each pointing to its parent section.
children = []
for section_id, section in enumerate(sections):
    for child in recursive_chunks(section, max_tokens=128):
        children.append({"text": child, "parent_id": section_id})

def retrieve_with_parents(query, search, k=5):
    hits = search(query, k=k)  # your vector search over the child chunks
    parent_ids = list(dict.fromkeys(h["parent_id"] for h in hits))  # dedupe, keep rank order
    return [sections[pid] for pid in parent_ids]
```

**Trade-offs:**

- Parents must fit your context budget. Very long sections may need to be capped or split themselves.
- Several children from the same parent collapse into one result, so you may get fewer distinct sources than K.
- You now store a mapping between children and parents, which adds some indexing complexity.

This doesn't remove the need to choose sizes, but it lets you tune retrieval specificity and generation context separately. Sentence-window retrieval, mentioned in section 10, is a closely related variant.

## 8. Evaluating Chunking

Judging a chunking change by reading a few generated answers mixes up retrieval quality with generation quality. Evaluate retrieval directly, before the LLM sees anything.

### 8.1 Build a test set

Write 30–100 realistic questions. For each one, record where the answer lives in the source: which document, which section, and ideally the exact span. Mix simple lookups with questions that need surrounding context.

**Be careful with synthetic questions.** An LLM can help draft them, but questions generated directly from the source text tend to reuse its wording, which makes retrieval look easier than it will be for real users. Review every question and label by hand. Where possible, include real user queries, independently paraphrased questions, wording that differs from the source, and a mix of easy and hard cases.

**Be realistic about what a small set can show.** Around 30 questions is useful as a smoke test for catching obvious regressions. It is weak evidence for small differences between strategies: one or two questions flipping can move the score by several points. Before claiming one chunking strategy is better, use a larger, more representative set, and look at per-question results rather than only the average.

One subtlety matters for chunking specifically: **label relevance against the source, not against chunk IDs.** Chunk IDs change every time you change the chunker, so a label like "chunk 42 is relevant" can't be reused across strategies. A label like "document 7, section 3.2" or "document 7, characters 1,200–1,450" can. A retrieved chunk then counts as relevant if it overlaps a labelled span.

### 8.2 Choose the right metric

Run each question through the retriever with a fixed K, such as 5, and score the ranked results. Metric names vary across information-retrieval and QA literature. In this article, Hit Rate@K refers to binary per-query success, while Recall@K and Precision@K use the set-based definitions below, following the standard treatment of precision and recall over the top K results ([4](https://nlp.stanford.edu/IR-book/html/htmledition/evaluation-of-ranked-retrieval-results-1.html)).

**Hit Rate@K** (also called Success@K): the fraction of queries for which at least one relevant item appears in the top K.

$$
\text{HitRate@}K = \frac{1}{|Q|} \sum_{q \in Q} \mathbb{1}\left[\, |\text{Rel}_q \cap \text{Top}_K(q)| \ge 1 \,\right]
$$

**Recall@K:** for each query, the number of relevant items retrieved in the top K divided by the total number of relevant items for that query, then averaged over queries.

$$
\text{Recall@}K = \frac{1}{|Q|} \sum_{q \in Q} \frac{|\text{Rel}_q \cap \text{Top}_K(q)|}{|\text{Rel}_q|}
$$

**Precision@K:** for each query, the number of relevant items in the top K divided by K, then averaged.

$$
\text{Precision@}K = \frac{1}{|Q|} \sum_{q \in Q} \frac{|\text{Rel}_q \cap \text{Top}_K(q)|}{K}
$$

When every query has exactly one relevant item, Recall@K and Hit Rate@K give the same number. They diverge when an answer needs several passages, such as a policy and its exception. In that case Hit Rate@K can look healthy while the retriever routinely misses the second passage. Note also that with one relevant item, Precision@K can be at most 1/K, so judge it relative to that ceiling.

For RAG, recall-type metrics are often the first to watch: if the evidence isn't retrieved, the generator can't use it. Precision@K tells you how many of the retrieved items are relevant, which helps reveal when retrieval is filling the context with unnecessary results.

### 8.3 A quick development check vs a rigorous setup

**Quick development check.** During early iteration, a substring test is fast and needs no labelling infrastructure. Each question gets a short answer-bearing snippet, and a hit means some top-K chunk contains it. This measures Hit Rate@K, so it is named accordingly:

```python
def hit_rate_at_k(results: list[list[str]], gold_snippets: list[str], k: int = 5) -> float:
    """Prototype check: does any top-k chunk contain the gold snippet?"""
    hits = sum(any(g in chunk for chunk in res[:k])
               for res, g in zip(results, gold_snippets))
    return hits / len(gold_snippets)
```

It is crude. Whitespace, OCR noise, or prepended headings can break exact matches, common phrases can create false hits, and it says nothing about questions with several relevant passages. Use it to catch regressions, not to report results.

**More rigorous setup.** Annotate each question with the IDs of all relevant source units, such as section IDs or labelled spans. Then map each retrieved chunk to the source units it overlaps. With that mapping, report three things separately, because they answer different questions:

- **Evidence coverage** (Recall@K, with source units as the items): what fraction of the required gold units the top-K chunks cover.
- **Chunk-level precision** (Precision@K, with chunks as the items): what fraction of the K retrieved chunks contain any relevant evidence. The denominator is K chunks, not unique source units.
- **Redundancy:** what fraction of the K chunks are relevant but add no new evidence beyond higher-ranked chunks. This matters when comparing overlap-heavy strategies, which can score well on chunk-level precision while sending the same evidence several times.

```python
def evaluate_at_k(chunk_units: list[list[set[str]]],
                  relevant_units: list[set[str]], k: int = 5):
    """chunk_units[q][i]: source-unit IDs overlapped by the i-th ranked chunk for query q.
    relevant_units[q]: manually labelled relevant source-unit IDs for query q."""
    coverage, precision, redundancy = [], [], []
    for ranked, relevant in zip(chunk_units, relevant_units):
        seen, useful, repeats = set(), 0, 0
        for units in ranked[:k]:
            hits = units & relevant
            if hits:
                useful += 1
                if hits <= seen:  # relevant, but nothing new
                    repeats += 1
                seen |= hits
        coverage.append(len(seen) / len(relevant))
        precision.append(useful / k)
        redundancy.append(repeats / k)
    n = len(relevant_units)
    return sum(coverage) / n, sum(precision) / n, sum(redundancy) / n
```

This redundancy measure is intentionally simple and depends on the granularity of the relevance labels. Coarse section-level labels can make two chunks appear redundant even when they contain different useful evidence; span-level annotations give a more accurate picture.

The labelling takes longer, but the numbers stay comparable across chunking strategies because the labels are tied to the source, not to a particular chunker. Graded relevance judgments, where some passages are more useful than others, support further metrics such as NDCG ([4](https://nlp.stanford.edu/IR-book/html/htmledition/evaluation-of-ranked-retrieval-results-1.html)).

### 8.4 Inspect the failures

A metric tells you that retrieval failed; the failures tell you why. For each miss, open the retrieved chunks and the gold passage, and ask what went wrong.

```diagram
failure-map
```

Name the symptom first, and the fix usually follows. Grouping failures this way is often where the most useful insights come from, because it points to a specific change rather than general tuning.

## 9. Practical Workflow

A reasonable process for a new RAG project:

1. **Start simple.** Use recursive chunking at around 512 tokens with 10–15% overlap, within your embedding model's input limit. If documents have clear headings, prepend them from the start, since it costs little. For text with weak structure, start with fixed-size chunks instead.
2. **Build the evaluation set before tuning anything.** Even 30 labelled questions are far better than none for catching regressions. Without them, every change is judged by impression.
3. **Measure the baseline.** Record Hit Rate@5 from the quick check, and evidence coverage, chunk-level precision, and redundancy once you have source-level labels. Record operational numbers too: index size, ingestion time, query latency, and tokens sent to the LLM.
4. **Read the failures.** Group misses by cause: split answers, noisy chunks, lost context, broken tables.
5. **Fix the largest failure category, one change at a time.** Split answers point to overlap or structure-aware splits. Lost context points to heading enrichment or parent-child retrieval. Broken tables point to document-aware parsing. Topic drift in unstructured text points to trying semantic chunking.
6. **Re-measure and judge the whole trade-off.** Keep a change if it improves the quality/cost trade-off for your application, not only if one retrieval metric increases. A change that leaves retrieval quality roughly flat can still be worth it if it reduces index size, ingestion time, query latency, embedding or reranking cost, generation tokens, or storage. A small metric gain may not be worth a large jump in cost.

It is tempting to start with semantic or agentic chunking because it sounds more sophisticated. Added complexity is easier to justify, and easier to debug, when it responds to a measured failure.

Chunking also isn't the only lever. If retrieval metrics look healthy but answers are still poor, the issue may lie in reranking, top-K, prompting, or the generator, not in the chunks.

## 10. Beyond Basic Chunking

The strategies above are foundations. Several more advanced approaches build on them. Briefly:

- **Parent-child retrieval:** retrieve small chunks, return their larger parents. Covered in section 7.
- **Sentence-window retrieval:** index individual sentences for specific matching, then return a window of neighbouring sentences around each match. It applies the small-to-big idea at sentence level.
- **Hierarchical chunking:** build several levels of chunks at once, such as document, section, and paragraph, so the system can retrieve at whichever level fits the query, or merge related small hits into their shared parent.
- **Proposition-based retrieval:** instead of splitting along existing boundaries, rewrite the text into propositions and index those (proposition-level indexing). Chen et al. define a proposition as an atomic, self-contained expression of a single fact, and report that indexing by propositions outperformed passage-level units on their retrieval benchmarks ([5](https://arxiv.org/abs/2312.06648)). Proposition generation adds an extra segmentation step at ingestion. That step may use an LLM directly or a dedicated proposition-generation model, which increases preprocessing cost and complexity.
- **Late chunking:** proposed by Günther et al. ([6](https://arxiv.org/abs/2409.04701v3)). Late chunking first runs the long document through the encoder to obtain contextualized token representations. Chunk boundaries are then applied after the transformer, and the token representations inside each chunk are pooled into chunk embeddings, using mean pooling in the paper's formulation. No single document embedding is created and then split; each chunk gets its own vector, computed with the rest of the document in view. It requires a long-context embedding model.

All of these are worth testing only once a simpler baseline and an evaluation set are in place. Otherwise there is no way to tell whether the added complexity helped.

That caution has empirical support. A reproduction study by Zhou et al., published at SIGIR 2026, compared structure-based, semantic, LLM-guided, and contextualized chunking in two settings ([7](https://doi.org/10.1145/3805712.3808575)). It found the best strategy was task-dependent. Simple structure-based methods outperformed LLM-guided ones for in-corpus retrieval, while an LLM-guided method, LumberChunker, did best for finding information within a single long document. Contextualized chunking, the family late chunking belongs to, improved in-corpus retrieval but degraded in-document retrieval. More sophisticated methods don't automatically win.

## 11. Conclusion

There is no universally best chunking strategy. Fixed-size, recursive, semantic, and document-aware chunking each make a different assumption about where meaning lives in your text. Overlap, enrichment, and parent-child retrieval adjust how much context travels with each chunk.

The right combination depends on your documents, your queries, your embedding model, and your retrieval setup. The reliable way to find it is to measure retrieval with metrics that match your labels, then read the failures.

So pick the simplest strategy that fits your documents, measure it honestly, and let observed retrieval failures justify each added piece of complexity.

## 12. References

1. LangChain documentation. [Splitting recursively (RecursiveCharacterTextSplitter)](https://docs.langchain.com/oss/python/integrations/splitters/recursive_text_splitter). Default separators and character-based sizing (section 4.2).
2. Sentence Transformers. [all-MiniLM-L6-v2 model card](https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2), Hugging Face. Default truncation of input over 256 word pieces (sections 4.3 and 6).
3. OpenAI. [Vector embeddings guide](https://developers.openai.com/api/docs/guides/embeddings) and [Embeddings API reference](https://developers.openai.com/api/reference/resources/embeddings). `cl100k_base` for third-generation embedding models and the 8,192-token per-input limit (sections 4.1 and 6). The explicit error for over-length input is shown in the archived OpenAI Cookbook recipe [Embedding texts that are longer than the model's maximum context length](https://developers.openai.com/cookbook/examples/embedding_long_inputs).
4. Christopher D. Manning, Prabhakar Raghavan, and Hinrich Schütze. [Introduction to Information Retrieval, "Evaluation of ranked retrieval results"](https://nlp.stanford.edu/IR-book/html/htmledition/evaluation-of-ranked-retrieval-results-1.html). Cambridge University Press, 2008. Precision and recall over top-k results, Precision at k, and NDCG (section 8).
5. Tong Chen et al. [Dense X Retrieval: What Retrieval Granularity Should We Use?](https://arxiv.org/abs/2312.06648) arXiv:2312.06648. Proposition-level indexing (section 10).
6. Michael Günther et al. [Late Chunking: Contextual Chunk Embeddings Using Long-Context Embedding Models](https://arxiv.org/abs/2409.04701v3). arXiv:2409.04701. Late chunking (section 10).
7. Yongjie Zhou, Shuai Wang, Bevan Koopman, and Guido Zuccon. 2026. [Beyond Chunk-Then-Embed: A Comprehensive Taxonomy and Evaluation of Document Chunking Strategies for Information Retrieval](https://doi.org/10.1145/3805712.3808575). In *Proceedings of the 49th International ACM SIGIR Conference on Research and Development in Information Retrieval (SIGIR '26)*, pp. 3081–3091. ACM. Free preprint: [arXiv:2602.16974](https://arxiv.org/abs/2602.16974). Task-dependence of chunking strategies (section 10).
