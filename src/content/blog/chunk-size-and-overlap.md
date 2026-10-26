Take two RAG pipelines with the same documents, the same embedding model, the same vector store and the same LLM. One splits documents into 256-token chunks, the other into 1,024-token chunks with 20% overlap. Ask both the same question and they can retrieve different text, so the LLM answers from different evidence.

The previous article in this series, [*Chunking Strategies for RAG*](/blog/chunking-strategies-for-rag), asked which chunking approach to use. This one assumes you have picked one and asks the next question: once the approach is fixed, how do chunk size and overlap change what the retriever actually finds?

The honest answer is "it depends", which is useless on its own. So instead of a recommended number, this article does three things: it explains the mechanisms that make size and overlap matter, it designs a controlled experiment that isolates them, and it defines metrics that can tell the configurations apart. It then runs that experiment on 100 research papers and 287 questions from the QASPER dataset, with every comparison fixed before the run. The measured results are in the Results section; everything before it is either reasoning or a cited source.

## 1. What chunk size actually changes

Chunk size is not just a storage setting. It decides four things at once, and they pull in different directions.

**1. The unit of retrieval.** The retriever never returns sentences; it returns whole chunks. A 128-token chunk can isolate the one paragraph that answers a question. A 1,024-token chunk returns that paragraph plus everything around it, whether useful or not.

**2. What a single vector has to represent.** Each chunk becomes one embedding. A short chunk about one idea produces a vector that sits close to questions about that idea. A long chunk covering a refund rule, a shipping table and a contact address produces one vector that has to summarise all three, so its similarity to a narrow question can be weaker. This is an intuition, not a law: how much a vector dilutes depends on the embedding model. A 2025 study across six QA datasets found that one model (Stella) did better with larger chunks while another (Snowflake) did better with smaller ones on the same data ([Bhat et al., 2025](https://arxiv.org/abs/2505.21700)).

**3. How much text reaches the LLM.** With a fixed Top-K, retrieved tokens scale with chunk size. K = 5 means about 1,280 tokens at 256-token chunks and about 5,120 at 1,024. Comparing sizes at a fixed K therefore also compares different context budgets, a confound the experiment below has to handle.

**4. Whether the chunk is even fully embedded.** Embedding models have a maximum input length. Depending on the model and library, longer input is truncated, often silently, or rejected with an error. `all-MiniLM-L6-v2`, a common default in tutorials, truncates input longer than 256 word pieces ([model card](https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2)). A "1,024-token chunk" embedded with that model is really a 256-token chunk whose last 768 tokens are invisible to search but still sent to the LLM. Check `model.max_seq_length` before choosing sizes.

|  | Smaller chunks (≈ 64–256 tokens) | Larger chunks (≈ 512–1,024+ tokens) |
| --- | --- | --- |
| Tends to help | Focused factoid questions; less irrelevant text per hit | Questions whose answer spans several sentences or needs surrounding context |
| Tends to hurt | Answers split across chunks; context such as headings or definitions left behind | Precision per retrieved token; fewer distinct sources fit in the same budget |
| Index cost | More vectors, more embedding calls | Fewer vectors |
| Failure looks like | The right chunk is retrieved but lacks the condition or number that completes the answer | The right chunk ranks low because most of its text is about something else |

These are tendencies, not rules. The same Bhat et al. study found small chunks (64–128 tokens) worked best on datasets with short, fact-based answers, while 512–1,024-token chunks worked better where answers needed broader context. The point is that the answer changed with the dataset, which is why the rest of this article is about measuring rather than recommending.

## 2. Overlap and the chunk boundary problem

Overlap exists to solve one specific problem: a fact that straddles a chunk boundary.

Take a ten-token document and a chunk size of 5:

```text
Document:          A B C D E F G H I J

No overlap (stride 5):
  Chunk 1:         A B C D E
  Chunk 2:                   F G H I J

Overlap 2 (stride 3):
  Chunk 1:         A B C D E
  Chunk 2:               D E F G H
  Chunk 3:                     G H I J
```

With no overlap, the pair `E F` never appears in the same chunk. With an overlap of 2 it does, in chunk 2.

Now make it concrete. A fixed-size splitter cuts a policy document here:

```text
Chunk 7:  "...Customers may request a refund for purchases made within"
Chunk 8:  "30 days of the original transaction. Refunds are issued to..."
```

For the question *"What is the refund period?"*, chunk 7 has the topic but not the number; chunk 8 has the number but starts mid-sentence, without the word *refund* governing it. Each half is a weaker match than the whole sentence would be. The retriever may rank both below some unrelated chunk that happens to mention refunds more often. If it retrieves only one, the LLM sees half an answer.

### 2.1 What overlap guarantees, exactly

With chunk size S and overlap O, chunks start every S − O tokens. A little arithmetic gives a useful rule: **any span of at most O + 1 tokens is guaranteed to sit whole inside at least one chunk.** Longer spans may still be split, depending on where they fall. So overlap is not "some protection"; it is a protection with a known size. A 10% overlap on 256-token chunks protects facts up to about 27 tokens long. That is shorter than it sounds: in the experiment below, single-sentence evidence from a research paper had a median length of 34 tokens.

### 2.2 What overlap does not fix

- **Context that is far away.** If chunk 8 says "this policy" and the policy's name is in a heading three pages earlier, no reasonable overlap brings it back. That is a context problem, and it is better handled by adding the document title or section heading to each chunk before embedding.
- **Answers longer than the overlap.** A procedure that runs 300 tokens will be split at 256-token chunks no matter what overlap you choose below 300.
- **Bad boundaries.** Structure-aware splitting (covered in the previous article) moves boundaries to places where facts rarely straddle them. Overlap is a patch for boundaries you could not choose well.

### 2.3 What overlap costs

The number of chunks grows roughly as document length ÷ (S − O). That makes the index about 1.11× larger at 10% overlap, 1.25× at 20% and 2× at 50%, with embedding cost growing the same way. There is a quieter cost at query time: neighbouring chunks share text, so they often score alike and can both land in the Top-K. Two of five retrieved slots may then carry much of the same text, which wastes context budget and crowds out a different relevant passage. Chroma's chunking evaluation measures retrieval with a token-level intersection-over-union score partly for this reason: it penalises returning the same relevant tokens more than once ([Smith & Troynikov, 2024](https://www.trychroma.com/research/evaluating-chunking)).

So overlap trades index size and redundancy for boundary safety. Whether that trade pays off depends on how often answers in *your* documents actually straddle boundaries, which is a measurable quantity.

## 3. Designing the experiment

The goal is to change chunk size and overlap and nothing else, then see what the retriever returns.

### 3.1 The grid

| Variable | Values | Why these |
| --- | --- | --- |
| Chunk size | 128, 256, 512 tokens | Inside the range where published results disagree; each step doubles |
| Overlap | 0%, 10%, 20% of chunk size | No overlap as a baseline, then two common settings |

That is 9 configurations. These values are starting points, not answers. If the best result lands at an edge of the grid (128 or 512), extend the grid in that direction in a new run on fresh data, and include the existing sizes in that run, so old and new sizes are compared on the same sample.

### 3.2 What stays fixed

- **Corpus:** the same documents, cleaned the same way.
- **Splitter:** the same fixed-size token splitter for every run, so only size and overlap move. Token counts come from the embedding model's own tokenizer, not a word count.
- **Embedding model:** one model whose maximum input length is at least the largest chunk size. Otherwise the large-chunk runs are truncated or fail, and the comparison is meaningless.
- **Search:** exact (brute-force) cosine similarity. An approximate index such as HNSW adds its own recall loss, which would mix index error into the chunking result. Production can use ANN; the experiment should not.
- **Questions, and K.**

### 3.3 Two comparisons, not one

Fixed K hides a confound: at K = 5, 1,024-token chunks hand the LLM four times the text that 256-token chunks do. Larger chunks may "win" simply by returning more text. So run the grid twice:

1. **Equal K** (K = 5): what happens in a typical pipeline where K is a constant.
2. **Equal token budget** (for example 2,048 tokens: K = 16 at 128, 8 at 256, 4 at 512, 2 at 1,024): which size makes better use of a fixed amount of context.

If a configuration wins under equal K but loses under an equal budget, its advantage came from volume, not from better chunks.

### 3.4 Ground truth that survives re-chunking

The usual evaluation table lists a question and its "relevant chunk". That breaks here, because every configuration produces different chunks with different IDs. Chunk 12 at 256 tokens has no counterpart at 1,024 tokens.

The fix is to label **evidence text**, not chunks. Each question records the document and the exact sentence or phrase that answers it:

```json
{"id": "q07", "question": "What is the refund period?",
 "doc": "refund_policy.md",
 "evidence": "within 30 days of the original transaction",
 "type": "factoid"}
```

Each gold evidence span is located once in the source document and mapped to token positions using the experiment's tokenizer. Those evidence positions stay fixed while the chunk boundaries change around them, and every metric is computed against them: a retrieved chunk is relevant if its token range overlaps an evidence span. A question can have several spans. Text that overlapping chunks repeat counts once, so the same source tokens cannot inflate evidence recall or precision by appearing twice. This is the same idea behind Chroma's token-level evaluation, which judges retrieval against relevant excerpts rather than whole documents ([Smith & Troynikov, 2024](https://www.trychroma.com/research/evaluating-chunking)).

### 3.5 Building the question set

- **Size:** aim for 50–100 questions at the very least. With 50, one question moves a hit rate by 2 points, so small gaps between configurations are noise. Questions about the same document are not independent, so count documents too, and report a confidence interval, not just a mean.
- **Write questions like users do.** Don't copy the evidence sentence into the question. Questions that reuse the document's exact wording reward lexical overlap and flatter every configuration.
- **Mix question types and tag them**, because chunk size is expected to affect them differently:

| Type | Example | What it stresses |
| --- | --- | --- |
| factoid | "What is the refund period?" | Precision; small chunks should do well |
| multi-sentence | "How is a reimbursement approved?" | Completeness; evidence spans several sentences |
| multi-part | "Who can claim, and by when?" | Two evidence spans, possibly far apart |
| boundary | Any question whose evidence is split across chunks at a given size with no overlap (computed per size, not labelled by hand) | Overlap |

- **Keep selection and confirmation apart.** If you use evaluation results to choose or tune a configuration, confirm that choice on untouched documents (for example about 30% held back) that played no part in it. That includes choosing the grid and the selection rule: once held-out results have shaped either, they are no longer held out. The alternative is to fix the whole comparison plan before running anything and make no choice afterwards; then say so, and limit the claims to the comparisons you fixed.

## 4. What to measure

The standard retrieval metrics were designed for a fixed set of documents. When the thing being varied is the chunk itself, some of them need care. Here is the set used in this experiment, and what each one catches.

| Metric | Question it answers | Why it matters here |
| --- | --- | --- |
| Hit@K | Did any of the top K chunks touch the evidence? | The basic "did retrieval find it" check |
| Random Hit@K | What Hit@K would ranking the chunks at random achieve? | The floor. When K chunks cover much of the searchable text, a high Hit@K can be luck. Computed exactly per question as 1 − C(n − r, k) / C(n, k), where n chunks can be searched, r of them touch the evidence, and k = min(K, n), since a paper with fewer than K chunks returns all of them |
| Complete@K | Is every gold evidence span fully contained in at least one of the top-K chunks? Different spans may be covered by different chunks | Catches the boundary problem: a hit on half an answer is still a failure |
| Completable | Can every gold evidence span be fully contained in at least one chunk anywhere in the index, whatever the ranking? The chunks need not be the same one | Completable measures whether every evidence span fits inside at least one chunk. It is not inherently K-aware: its interpretation as an upper bound on Complete@K depends on whether all those spans can be covered within the available K chunks. In the experiment below they always could (the most chunks any completable question needed was 3, against K ≥ 4), so here it is a chunk-fit upper bound on Complete@K. A gap between the two is a ranking problem; a low bound is a chunking problem that no retriever can fix |
| Evidence recall@K | What fraction of the evidence text appears somewhere in the top K? Repeated text counts once | Graded version of Hit and Complete; handles multi-part answers |
| MRR@K | How high did the first relevant chunk rank? | Rank matters when K is small or a reranker cuts the list |
| Evidence precision | What fraction of the retrieved text is evidence? | How much noise the LLM has to read past. Text repeated by overlapping chunks counts once |
| Redundancy | What fraction of retrieved text is duplicated across chunks? | The query-time cost of overlap |
| Tokens per query | How much context did retrieval use? | Makes equal-K comparisons honest |

**Hit@K vs Complete@K** is the most informative pair for this question. Small chunks with no overlap often hit but don't complete: the retriever lands on the right place but returns only part of the answer. If overlap raises Complete@K without moving Hit@K, it is doing exactly its job.

**MRR** is the mean, over all questions, of 1 / rank of the first relevant chunk (0 if none appears in the top K):

$$
\mathrm{MRR@K} = \frac{1}{|Q|} \sum_{q \in Q} \frac{1}{\mathrm{rank}_q}
$$

If the first relevant chunk is at rank 1 for one question, rank 3 for another and missing for a third, MRR = (1 + 0.33 + 0) / 3 ≈ 0.44.

**Why not chunk-level Precision@K?** "Relevant chunks ÷ K" behaves differently at each size. A short answer can overlap only one 1,024-token chunk but two or three 128-token chunks. Precision@K then rewards small chunks for slicing the evidence finely and penalises large chunks for containing it whole. Evidence precision avoids this by measuring text rather than counting chunks. The same goes for chunk-level Recall@K, whose denominator (how many chunks are relevant) changes with every configuration; evidence recall measures against the fixed evidence text instead.

**Retrieval first, generation second.** All of these measure the retriever alone, before any LLM sees the text. Answer-quality evaluation is worth doing later, but it mixes in the LLM's ability to cope with noise and missing context. If retrieval is not measured on its own, a chunking problem can hide behind a capable model, or a weak model can hide a good chunking choice.

## 5. Results

**Setup:** corpus = 100 NLP research papers drawn at random from the QASPER dev set ([Dasigi et al., 2021](https://aclanthology.org/2021.naacl-main.365/)), none of them used in the pilot described below; 543,074 tokens, 1,732–23,245 per paper (median 5,036) · embedding model = nomic-embed-text-v1.5, trained on sequences of up to 2,048 tokens (8,192 with extra configuration), so every chunk is well inside its trained length; the longest model input was 519 tokens · questions = 287, at most 5 per paper (95 factoid, 129 multi-sentence, 63 multi-part; 76 have more than one evidence span) · exact cosine search · each question searches only its own paper.

QASPER questions were written by people who had read only a paper's title and abstract; other annotators answered them and highlighted the supporting sentences, which serve directly as evidence spans. Of 372 candidate questions in the sampled papers, 287 were kept; most exclusions had only table or figure evidence (Appendix C lists them all). Question types come from the evidence: a single sentence is factoid, several sentences in one paragraph are multi-sentence, and sentences from two or more paragraphs are multi-part.

**A pilot first, then a clean run.** A pilot on 40 other QASPER papers let its "held-out" questions shape both the grid and the rule for picking a configuration, so it could not confirm anything, and none of its numbers appear here. The study was re-run on 100 fresh papers, with the sample, metrics, tests, eight comparisons and the rules for reading them frozen before any retrieval. Every reported retrieval metric, aggregate and statistical comparison was then recomputed independently from the saved rankings, with no mismatches. No configuration is picked from these results, so there is no 70/30 split: the claims are limited to the eight fixed comparisons, and choosing a configuration for production would need confirming on other papers. Nothing below speaks to 64- or 1,024-token chunks.

**What searching one paper does to the numbers.** QASPER questions assume the reader knows which paper they are about ("what datasets do *they* use?"), so each search covers only that paper, as in a "chat with this document" tool. A paper yields 4 to 182 chunks, so random ranking already scores well: the floor is 0.49–0.63 under the equal budget. Absolute hit rates are much higher than in a multi-document index, and even the ordering of configurations could change in another setup.

**How results are compared.** The paper is the unit of analysis: each question's score is averaged within its paper, then across the 100 papers, and confidence intervals resample whole papers. The eight fixed comparisons use a paired permutation test on the per-paper differences, corrected for running eight tests (Holm's method). Everything else is descriptive. A non-significant difference is reported as inconclusive, never as a tie.

### 5.1 The picture in one chart

```diagram
complete-by-config
```

### 5.2 The comparisons fixed before the run

All eight compare Complete@K under the equal token budget. The two size comparisons:

| Comparison (0% overlap) | Complete@K | Difference (95% CI) | Papers better / worse / equal | Corrected p |
| --- | --- | --- | --- | --: |
| **256 vs 128 tokens** | **0.482 vs 0.323** | **+0.159 (+0.089 to +0.229)** | **43 / 8 / 49** | **< 0.001** |
| 512 vs 256 tokens | 0.543 vs 0.482 | +0.061 (−0.002 to +0.126) | 27 / 18 / 55 | 0.26 |

One comparison holds up: **256-token chunks deliver the evidence whole more often than 128-token chunks**, by 0.16. Counted by question, 256 tokens completed 61 questions that 128 did not, and the reverse happened for 14. Whether 512 beats 256 is not settled: the interval runs from slightly below zero to +0.13. Because 512 tokens is the edge of the grid, larger chunks might do better still; answering that would take a new run on fresh papers that includes 256 and 512 alongside the larger sizes.

**Overlap is inconclusive.** All six overlap comparisons (10% and 20% against 0% at each size) point the same way, +0.03 to +0.09, and at 20% overlap the uncorrected p is below 0.05 at every size. After the correction none holds up (the smallest corrected p is 0.11). A sample-size check made before the run suggested that 100 papers could reliably detect only differences of about 0.12–0.17, so effects this size may be real but out of reach here. Overlap also moves individual questions both ways: at 256 tokens, 20% overlap completed 41 questions that 0% did not and lost 29 that 0% had. All eight comparisons are in Appendix A.

### 5.3 Equal K versus equal budget

At K = 5, 0% overlap:

| Chunk size | Hit@5 | Random Hit@5 | Complete@5 | Tokens / query |
| --: | --: | --: | --: | --: |
| 128 | 0.65 | 0.26 | 0.20 | 633 |
| 256 | 0.70 | 0.39 | 0.38 | 1,245 |
| 512 | 0.84 | 0.61 | 0.60 | 2,416 |

Read alone, this says bigger is better. But 512-token chunks send nearly four times as much text, and the random floor rises with them. The raw gap above chance shrinks (+0.39, +0.31, +0.23) only because the room above chance shrinks; as a share of that room, the lead stays about the same (0.53, 0.50, 0.58). The climb in Hit@5 mostly reflects extra text and a higher floor, not better ranking.

Under an equal budget of 2,048 tokens (K = 16 / 8 / 4):

| Chunk size / overlap | Hit@K | Random Hit@K | Complete@K | Completable |
| --- | --: | --: | --: | --: |
| 128 / 0% | 0.92 | 0.63 | 0.32 | 0.40 |
| 128 / 10% | 0.91 | 0.62 | 0.35 | 0.45 |
| 128 / 20% | 0.88 | 0.60 | 0.41 | 0.56 |
| 256 / 0% | 0.83 | 0.57 | 0.48 | 0.64 |
| 256 / 10% | 0.84 | 0.55 | 0.55 | 0.75 |
| 256 / 20% | 0.81 | 0.54 | 0.56 | 0.86 |
| 512 / 0% | 0.76 | 0.51 | 0.54 | 0.81 |
| 512 / 10% | 0.78 | 0.50 | 0.59 | 0.89 |
| 512 / 20% | 0.76 | 0.49 | 0.61 | 0.97 |

With the same amount of text, the two metrics part ways. Hit@K falls as chunks grow: small chunks most often put *some* of the evidence in front of the LLM. Complete@K rises: larger chunks more often deliver it *whole*. Completable explains most of the gap. At 128 tokens with no overlap, only 40% of questions have every evidence span fitting whole in some chunk, so no ranking could do better. Overlap and size both raise that bound, to 0.97 at 512 / 20%, where ranking becomes the limit (Complete@K 0.61).

Under the budget, only 3.6–4.2% of the unique retrieved text overlaps the annotated evidence in every configuration. Some of the rest may be useful context, since this counts only labelled evidence, but it shows how much else the LLM has to read. Full tables with every metric and confidence interval are in Appendix A.

### 5.4 By question type (descriptive)

- **Factoid questions** are completed at similar rates at every size (0.63–0.75). Their evidence is short (median 34 tokens), so it fits in a chunk of any size; small chunks find them more often.
- **Multi-sentence questions** are where size matters most. Small chunks find them (0.91–0.94 at 128 tokens) but seldom deliver them whole (0.19–0.29), against 0.53–0.66 at 512 tokens.
- **Multi-part questions** are found almost everywhere but completed least, because every span has to arrive whole.

These are plain shares of questions; the table is in Appendix B.

### 5.5 Failure analysis (exploratory)

Each question in each configuration falls into one of four categories, defined before the run. Equal token budget, 287 questions:

| Configuration | Complete | At least one evidence span could not fit wholly in any chunk | Fits in a chunk, but missed entirely | Fits, partly retrieved, but not whole |
| --- | --: | --: | --: | --: |
| 128 / 0% | 95 | 170 | 17 | 5 |
| 128 / 10% | 100 | 154 | 17 | 16 |
| 128 / 20% | 114 | 131 | 23 | 19 |
| 256 / 0% | 142 | 101 | 29 | 15 |
| 256 / 10% | 159 | 67 | 39 | 22 |
| 256 / 20% | 154 | 48 | 46 | 39 |
| 512 / 0% | 155 | 59 | 56 | 17 |
| 512 / 10% | 162 | 33 | 63 | 29 |
| 512 / 20% | 177 | 13 | 65 | 32 |

- **At 128 tokens, it is a split answer.** At 0% overlap, 170 questions have evidence that no 128-token chunk contains whole, and 163 of those were still hit: the retriever found the place but could only return part of it. A span has a median of 55 tokens and a 90th percentile of 151, while 10% and 20% overlap on 128-token chunks protect only 14 and 27 tokens.
- **At 512 tokens, it is a miss.** The evidence fits in a chunk, but that chunk ranks too low (56–65 questions, against 17–23 at 128 tokens). It is not "just outside K": a missed chunk sat at a median rank of 7 in papers with a median of 10 chunks. That points to dilution, the evidence being one sentence among many in a large chunk.
- **256 tokens sits between the two.**

**Split answer.** *"What metrics do they use?"* The evidence is two sentences, 97 tokens, listing BLEU-1 to BLEU-4, METEOR and ROUGE-L and the evaluation script. In every 128-token run a retrieved chunk overlapped it but none held all of it; in every 256- and 512-token run it arrived whole, ranked 1st or 2nd.

**Diluted chunk.** *"How large is the Twitter dataset?"* The evidence is one 35-token sentence ("We have downloaded 1,873 Twitter conversation threads, roughly 14k tweets…"). Every 128- and 256-token run retrieved it whole at rank 1 or 2. At 512 / 0%, its chunk ranked 8th of the paper's 10 and fell outside K = 4; with 10% or 20% overlap at 512 tokens, it ranked 1st.

Overlap cuts both ways on single questions. A 31-token sentence cut at 128 / 0% arrived whole with 10% or 20% overlap, though it is longer than either overlap protects; a 121-token passage held whole at 256 / 0% was split at 256 / 10%. When evidence is longer than the overlap, where the boundaries land decides the outcome. Seven questions were missed by all nine configurations; in one, the evidence never uses the question's key word ("dataset"), which is a job for query rewriting or a reranker, not chunking. Missing context could not show up here, because each search covered one paper.

**A checklist from these failures:**

1. **Compute Completable before tuning anything.** If it is low, change the chunking, not the retriever.
2. **Compare evidence length with what overlap protects** (O + 1 tokens). Here a median span of 55 tokens against 14 protected meant overlap could never be the main fix at 128 tokens.
3. **Report a miss's rank relative to the number of chunks searched** before calling it "just outside K".

**In short, for this corpus and model:**

- **128-token chunks are too small to deliver this evidence whole.** 256 tokens did clearly better. Whether 512 beats 256 is not settled.
- **Overlap's effect is inconclusive:** consistently positive, not established. If you add it, measure it on your own data.
- **Do not judge chunk size from fixed-K comparisons alone.**

## 6. Why there is no best chunk size

Published comparisons disagree, and they should. Bhat et al. found the best size moved with the dataset and the embedding model. NVIDIA's comparison of page-, section- and token-based chunking found page-level chunks gave the highest average answer accuracy on its datasets, which were largely paginated PDF reports ([Han, 2025](https://developer.nvidia.com/blog/finding-the-best-chunking-strategy-for-accurate-ai-responses/)). What decides it is answer length and locality, document structure, information density, the embedding model, and what happens after retrieval (a reranker, the LLM's context window, its tolerance for noise). A number copied from a tutorial was tuned, if at all, for someone else's version of these.

## 7. The engineering trade-offs

Retrieval quality is not the only thing chunk size and overlap move.

| Concern | Smaller chunks / more overlap | Larger chunks / less overlap |
| --- | --- | --- |
| Vectors stored | More (grows as length ÷ (size − overlap)) | Fewer |
| Embedding cost at ingest | Higher, and repeated on every re-index | Lower |
| Retrieval noise | Near-duplicate neighbours compete for Top-K | Irrelevant text inside each hit |
| Context usage | Less per chunk; may need higher K to cover an answer | More per chunk; fewer distinct sources fit |
| Latency | Larger index; more candidates if a reranker scores them | Smaller index; longer texts per rerank call |
| Completeness | Answers and their conditions can be split | Answers usually arrive whole |

In a real system these costs decide between configurations that perform alike: the one with fewer vectors and fewer tokens per query is the better system. But "alike" needs evidence. A paired test that fails to find a difference has not shown that there is none, especially on a small question set. To claim two configurations are equivalent, set a margin in advance ("within 0.05 Complete@K") and show that the confidence interval of the difference sits inside it.

## 8. Common mistakes

- **Using 500 tokens because a tutorial did.** The tutorial's corpus, model and questions are not yours.
- **Chunking past the embedding model's input limit.** Depending on the library, the tail of every chunk is cut off before embedding, or the call fails.
- **Comparing sizes at a fixed K only.** Larger chunks then win partly by sending more text.
- **Labelling relevant chunk IDs instead of evidence text.** The labels stop meaning anything the moment chunking changes.
- **Adding large overlap without measuring it.** 50% overlap doubles the index. Check that Complete@K actually moves.
- **Evaluating only final answers.** A strong LLM can mask poor retrieval in demos and fail on harder questions.

## 9. A practical decision framework

1. **Check constraints:** the embedding model's maximum input length and the context budget you can afford per query.
2. **Pick a baseline** from the chunking approach chosen earlier, at a size the model can fully embed.
3. **Build 50–100 evidence-labelled questions** from real or realistic user queries, tagged by type. If you will pick a configuration from the results, hold about 30% of the documents back.
4. **Sweep chunk size at 0% overlap** under both equal K and an equal token budget.
5. **Add overlap at the best one or two sizes** and watch Complete@K, the index size and redundancy.
6. **Read the failures**, not just the averages, and classify them (split, diluted, missing context, vocabulary gap).
7. **Fix the comparisons, the metric, the test and an equivalence margin before looking at results.** Then choose the simplest configuration whose difference from the best stays inside that margin on every metric you care about. Without a margin, "not significantly worse" only means the test was too small to tell, and on a small question set almost anything passes it.
8. **If you selected a configuration from the results, confirm it on the held-back documents.** Re-run when the corpus, model or user questions change.

The question to ask is not "what chunk size is best?" but "which configuration works best for my documents, my model and the questions my users ask?"

## 10. Takeaways

- **Chunk size trades finding the evidence against receiving it whole.** Under a 2,048-token budget, 128-token chunks found some of the evidence most often (Hit@K 0.92) but delivered it whole for only 0.32 of questions; 256-token chunks did significantly better (0.48). 512 tokens (0.54) may be better still, but this study could not confirm it.
- **Compare sizes under an equal token budget, not only an equal K.** At K = 5, larger chunks raised Hit@5, but they also sent nearly four times the text and raised the random baseline, so a fixed-K comparison mixes chunk quality with context volume. The equal-budget comparison is the one that isolates size.
- **Put a floor and an upper bound next to every score.** Random Hit@K shows how much of a hit rate is luck; Completable shows whether delivering the evidence whole was possible at all.
- **Overlap protects facts up to O + 1 tokens, and real evidence is often longer.** The median evidence span here was 55 tokens. Overlap's effect was consistently positive but not established.
- **Label evidence text, not chunk IDs, and test with the document as the unit.** Individual questions swing both ways when boundaries move.
- **Fix the comparisons before you look.** The pilot let its held-out questions shape its choices and had to be set aside. And "not significantly different" does not mean "the same".

None of these numbers transfer. They come from one corpus, one embedding model, one question set and single-paper search; run the experiment on yours.

## 11. Sources

- Bhat, Rudat, Spiekermann, Flores-Herr. [Rethinking Chunk Size for Long-Document Retrieval: A Multi-Dataset Analysis](https://arxiv.org/abs/2505.21700). arXiv, 2025.
- Dasigi, Lo, Beltagy, Cohan, Smith, Gardner. [A Dataset of Information-Seeking Questions and Answers Anchored in Research Papers](https://aclanthology.org/2021.naacl-main.365/) (QASPER). NAACL, 2021. Data: [QASPER v0.3 train/dev](https://qasper-dataset.s3.us-west-2.amazonaws.com/qasper-train-dev-v0.3.tgz).
- Han. [Finding the Best Chunking Strategy for Accurate AI Responses](https://developer.nvidia.com/blog/finding-the-best-chunking-strategy-for-accurate-ai-responses/). NVIDIA Technical Blog, 2025.
- Nussbaum, Morris, Duderstadt, Mulyar. [Nomic Embed: Training a Reproducible Long Context Text Embedder](https://arxiv.org/abs/2402.01613). arXiv, 2024.
- [nomic-ai/nomic-embed-text-v1.5 model card](https://huggingface.co/nomic-ai/nomic-embed-text-v1.5). Hugging Face.
- Smith, Troynikov. [Evaluating Chunking Strategies for Retrieval](https://www.trychroma.com/research/evaluating-chunking). Chroma Research, 2024.
- [sentence-transformers/all-MiniLM-L6-v2 model card](https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2). Hugging Face.

## 12. Code, data and protocol

The code, the frozen protocol and configuration, the sample manifests, the raw per-question results and the verification logs are in the public repository: [github.com/sobanali256/chunk-size-overlap-rag](https://github.com/sobanali256/chunk-size-overlap-rag).

## Appendix A: full results

### All eight fixed comparisons

Complete@K, equal token budget, 100 paired papers. Each p comes from a paired sign-flip permutation test on the 100 per-paper differences; the corrected p uses Holm's method across the eight.

| Comparison (A vs B) | Complete@K, A vs B | Difference (95% CI) | Papers where A / B is better / equal | p | Holm-corrected p |
| --- | --- | --- | --- | --: | --: |
| 128 / 10% vs 128 / 0% | 0.350 vs 0.323 | +0.026 (−0.042 to +0.097) | 22 / 19 / 59 | 0.47 | 0.47 |
| 128 / 20% vs 128 / 0% | 0.411 vs 0.323 | +0.088 (+0.018 to +0.156) | 30 / 15 / 55 | 0.016 | 0.11 |
| 256 / 10% vs 256 / 0% | 0.552 vs 0.482 | +0.070 (−0.003 to +0.145) | 29 / 20 / 51 | 0.067 | 0.26 |
| 256 / 20% vs 256 / 0% | 0.564 vs 0.482 | +0.083 (+0.014 to +0.151) | 28 / 19 / 53 | 0.021 | 0.13 |
| 512 / 10% vs 512 / 0% | 0.592 vs 0.543 | +0.049 (−0.022 to +0.119) | 30 / 24 / 46 | 0.19 | 0.37 |
| 512 / 20% vs 512 / 0% | 0.614 vs 0.543 | +0.071 (+0.003 to +0.137) | 31 / 15 / 54 | 0.046 | 0.23 |
| **128 / 0% vs 256 / 0%** | **0.323 vs 0.482** | **−0.159 (−0.229 to −0.089)** | **8 / 43 / 49** | **< 0.001** | **< 0.001** |
| 256 / 0% vs 512 / 0% | 0.482 vs 0.543 | −0.061 (−0.126 to +0.002) | 18 / 27 / 55 | 0.065 | 0.26 |

### Equal K (K = 5)

| Chunk size | Overlap | Chunks indexed | Hit@5 (95% CI) | Random Hit@5 | Complete@5 (95% CI) | Completable | Evidence recall@5 | MRR@5 | Evidence precision | Redundancy | Tokens / query |
| --: | --: | --: | --- | --: | --- | --: | --: | --: | --: | --: | --: |
| 128 | 0% | 4,291 | 0.65 (0.58–0.72) | 0.26 | 0.20 (0.15–0.25) | 0.40 | 0.48 | 0.46 | 0.069 | 0.00 | 633 |
| 128 | 10% | 4,763 | 0.68 (0.62–0.74) | 0.26 | 0.24 (0.18–0.29) | 0.45 | 0.53 | 0.43 | 0.075 | 0.02 | 635 |
| 128 | 20% | 5,347 | 0.65 (0.58–0.71) | 0.25 | 0.27 (0.21–0.33) | 0.56 | 0.51 | 0.46 | 0.077 | 0.05 | 635 |
| 256 | 0% | 2,168 | 0.70 (0.63–0.76) | 0.39 | 0.38 (0.31–0.44) | 0.64 | 0.61 | 0.47 | 0.049 | 0.00 | 1,245 |
| 256 | 10% | 2,398 | 0.73 (0.67–0.79) | 0.38 | 0.46 (0.39–0.53) | 0.75 | 0.64 | 0.45 | 0.051 | 0.03 | 1,252 |
| 256 | 20% | 2,671 | 0.69 (0.62–0.75) | 0.38 | 0.46 (0.39–0.53) | 0.86 | 0.60 | 0.46 | 0.049 | 0.07 | 1,252 |
| 512 | 0% | 1,108 | 0.84 (0.78–0.89) | 0.61 | 0.60 (0.53–0.67) | 0.81 | 0.78 | 0.52 | 0.033 | 0.00 | 2,416 |
| 512 | 10% | 1,213 | 0.83 (0.78–0.88) | 0.59 | 0.65 (0.59–0.71) | 0.89 | 0.78 | 0.53 | 0.035 | 0.05 | 2,437 |
| 512 | 20% | 1,350 | 0.80 (0.74–0.86) | 0.58 | 0.68 (0.61–0.75) | 0.97 | 0.75 | 0.53 | 0.037 | 0.10 | 2,438 |

(All values are means over papers. Tokens per query counts overlapping text each time it is sent.)

### Equal token budget (2,048 tokens)

| Chunk size | Overlap | K | Hit@K (95% CI) | Random Hit@K | Complete@K (95% CI) | Completable | Evidence recall@K | MRR@K | Evidence precision | Redundancy | Tokens / query |
| --: | --: | --: | --- | --: | --- | --: | --: | --: | --: | --: | --: |
| 128 | 0% | 16 | 0.92 (0.88–0.95) | 0.63 | 0.32 (0.26–0.39) | 0.40 | 0.82 | 0.49 | 0.038 | 0.00 | 2,028 |
| 128 | 10% | 16 | 0.91 (0.86–0.94) | 0.62 | 0.35 (0.29–0.41) | 0.45 | 0.80 | 0.46 | 0.039 | 0.05 | 2,032 |
| 128 | 20% | 16 | 0.88 (0.84–0.93) | 0.60 | 0.41 (0.35–0.48) | 0.56 | 0.79 | 0.49 | 0.042 | 0.11 | 2,035 |
| 256 | 0% | 8 | 0.83 (0.77–0.88) | 0.57 | 0.48 (0.41–0.55) | 0.64 | 0.74 | 0.49 | 0.037 | 0.00 | 1,997 |
| 256 | 10% | 8 | 0.84 (0.78–0.89) | 0.55 | 0.55 (0.49–0.62) | 0.75 | 0.77 | 0.47 | 0.040 | 0.05 | 2,005 |
| 256 | 20% | 8 | 0.81 (0.75–0.86) | 0.54 | 0.56 (0.50–0.63) | 0.86 | 0.72 | 0.48 | 0.038 | 0.10 | 2,007 |
| 512 | 0% | 4 | 0.76 (0.69–0.82) | 0.51 | 0.54 (0.47–0.61) | 0.81 | 0.70 | 0.51 | 0.036 | 0.00 | 1,938 |
| 512 | 10% | 4 | 0.78 (0.72–0.83) | 0.50 | 0.59 (0.53–0.66) | 0.89 | 0.71 | 0.52 | 0.038 | 0.04 | 1,953 |
| 512 | 20% | 4 | 0.76 (0.70–0.82) | 0.49 | 0.61 (0.54–0.68) | 0.97 | 0.70 | 0.52 | 0.042 | 0.08 | 1,946 |

(Tokens per query fall below 2,048, mostly at 512 tokens, because the last chunk of each paper is shorter than the rest.)

## Appendix B: results by question type

Equal token budget, share of questions (factoid 95, multi-sentence 129, multi-part 63). These are plain averages over questions, not per-paper means.

| Size / overlap | Factoid Hit | Factoid Complete | Multi-sentence Hit | Multi-sentence Complete | Multi-part Hit | Multi-part Complete |
| --- | --: | --: | --: | --: | --: | --: |
| 128 / 0% | **0.89** | 0.65 | 0.93 | 0.19 | 0.92 | 0.14 |
| 128 / 10% | 0.86 | 0.64 | **0.94** | 0.23 | 0.92 | 0.14 |
| 128 / 20% | 0.84 | 0.65 | 0.91 | 0.29 | **0.94** | 0.24 |
| 256 / 0% | 0.81 | 0.72 | 0.87 | 0.45 | 0.92 | 0.25 |
| 256 / 10% | 0.76 | 0.71 | 0.89 | 0.59 | 0.89 | 0.25 |
| 256 / 20% | 0.80 | **0.75** | 0.81 | 0.53 | 0.86 | 0.22 |
| 512 / 0% | 0.72 | 0.66 | 0.78 | 0.53 | 0.87 | 0.37 |
| 512 / 10% | 0.65 | 0.63 | 0.81 | 0.63 | 0.86 | 0.33 |
| 512 / 20% | 0.69 | 0.67 | 0.75 | **0.66** | 0.90 | **0.44** |

## Appendix C: data and verification

In the 100 sampled papers, 372 questions were candidates and 287 were kept. 85 were excluded: 32 had only table or figure evidence, 20 were unanswerable, 10 had evidence that did not match the paper's text verbatim, 6 had no highlighted evidence, and 17 exceeded the cap of 5 questions per paper.

After the run, every reported field was recomputed independently from the saved rankings, chunk boundaries and evidence spans: all metrics for all 5,166 result rows, the per-paper and overall means, and the statistical tests. There were no mismatches. The Monte Carlo p-values and bootstrap intervals were re-estimated with different random seeds and agreed within sampling error.
