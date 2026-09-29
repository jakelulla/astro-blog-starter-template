---
title: "Building this site: D1, Workers AI, and a search bar that understands you"
description: "What I added on top of the Astro starter, what broke, and what I learned turning a blog template into a personal site on Cloudflare Workers."
pubDate: "Sep 29 2026"
---

This site started as Cloudflare's Astro blog starter: a static blog with five Lorem ipsum posts and a placeholder name in the footer. I wanted a personal site first and a blog second, and I wanted at least one piece of it to do something a static page can't. Here's what I changed, what broke, and what I'd do differently.

## What I added

**An about page as the front door.** The home page is now about me, my projects, and what I'm looking for. The project list lives in one TypeScript file (`src/data/projects.ts`) instead of hard-coded HTML, because two parts of the site need it: the page that renders it, and the search index that embeds it.

**A view counter and likes in D1.** D1 is Cloudflare's SQLite-at-the-edge database. The schema is two tables:

```sql
CREATE TABLE views (slug TEXT PRIMARY KEY, count INTEGER NOT NULL DEFAULT 0);
CREATE TABLE likes (slug TEXT NOT NULL, visitor TEXT NOT NULL, PRIMARY KEY (slug, visitor));
```

A view increment is a single upsert with `RETURNING`, so reading and bumping the count is one round trip instead of two:

```sql
INSERT INTO views (slug, count) VALUES (?1, 1)
ON CONFLICT(slug) DO UPDATE SET count = count + 1
RETURNING count;
```

Likes are de-duplicated per visitor without storing IP addresses. The Worker hashes the client IP together with a salt and the post slug using SHA-256, then stores only that hash. The composite primary key makes a second like from the same visitor a no-op at the database level, not just in the UI. The browser also remembers in `sessionStorage` that it already counted a view, so refreshing a post doesn't inflate the number.

**Semantic search with Workers AI and Vectorize.** This is the part I was most excited about, because it's the same idea as the search in [PhotoTrove](/#phototrove), the on-device photo search app I built this summer. There, CLIP maps images and text into a shared vector space and cosine similarity does the ranking. Here the pipeline is:

1. **Chunk.** Every blog post is split on paragraphs and packed into ~900-character chunks. Each project becomes one document.
2. **Embed.** Each chunk goes through `@cf/baai/bge-base-en-v1.5` on Workers AI, which returns a 768-dimensional vector.
3. **Store.** Vectors go into a Vectorize index (cosine metric) with the URL, title, and a snippet as metadata.
4. **Query.** A search embeds the query with the same model, asks Vectorize for the top 10 neighbors, drops anything below a similarity threshold, and collapses multiple chunks from the same page into that page's best hit.

The result is that "how do you shrink a neural net to fit on a phone" finds the CoreML quantization work, even though the word "shrink" appears nowhere on the site. Keyword search can't do that.

Indexing runs through a token-protected `POST /api/reindex` endpoint that I call after deploying new content. That way the Worker embeds its own content with the same content collection it renders, so the index can't drift from what's on the page.

## What broke

**Deleting the template posts broke the build.** I `git rm`'d all the sample posts, and because git doesn't track empty directories, `src/content/blog/` vanished with them. Astro then failed every page that queries the collection with `The collection "blog" does not exist or is empty`. It's obvious in hindsight, but it's a good reminder that the content folder is part of the schema.

**Local dev wouldn't start once I added Workers AI.** There's no local emulator for Workers AI, so `wrangler dev` opens a remote proxy session to Cloudflare for that binding. It needs credentials, so without them the whole dev server refuses to start. My fix was a local-only wrangler config without the AI and Vectorize bindings, plus a code path in the search endpoint that falls back to plain keyword matching when embedding fails. That turned out to be a feature: if Workers AI ever has a bad moment in production, search degrades instead of returning a 500.

**My own API returned 403 to curl.** When I tested the likes endpoint from the terminal, every POST came back `Cross-site POST form submissions are forbidden`. Astro enables CSRF protection (`security.checkOrigin`) by default for on-demand routes, and a bare `curl -X POST` has no `Origin` header, so it looks like a cross-site form post. Browsers' `fetch` sends the header automatically, so real visitors were never affected. It still took me a minute to realize my code wasn't the problem and the framework was doing its job.

## What I learned

- **Static where possible, dynamic where it matters.** Every page on this site is prerendered HTML served from Cloudflare's asset cache. Only four tiny API routes run code. The page loads instantly and the counters fill in a moment later.
- **Embeddings are a general tool.** The same pattern (encode everything into one vector space, rank by cosine similarity) powered photo search on an iPhone and text search on the edge. The model and the storage changed; the idea didn't.
- **Design for the binding being missing.** Anything that depends on a remote service should have a fallback, both for local development and for production resilience.
- **Read the 403 before you debug your code.** The error message told me exactly what was happening; I just had to believe it.

The source is on [GitHub](https://github.com/jakelulla/jake-lulla-blog). If you try the search bar and it finds something surprising, good or bad, I'd like to hear about it.
