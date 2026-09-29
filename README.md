# jake-lulla

My personal site and blog: an about page first, with a blog as its own section. It's built with Astro and runs on Cloudflare Workers.

**Live:** https://jake-lulla.LIVE_SUBDOMAIN.workers.dev

## Stack

- **[Astro](https://astro.build)** with the `@astrojs/cloudflare` adapter. Every page is prerendered to static HTML; only the `/api/*` routes run on demand.
- **Cloudflare Workers.** Serves the static assets and the API routes.
- **Cloudflare D1.** SQLite at the edge, storing post view counts and likes.
- **Workers AI.** Runs `@cf/baai/bge-base-en-v1.5` to create 768-dimensional text embeddings.
- **Cloudflare Vectorize.** A vector index (cosine metric) for semantic search.

## Features

- **About-me home page.** Projects, skills, and coursework are rendered from [`src/data/projects.ts`](src/data/projects.ts).
- **Blog.** Markdown/MDX posts with RSS and a sitemap.
- **View counter.** One D1 upsert with `RETURNING` per view, and at most one count per browser session.
- **Likes.** One like per visitor per post, enforced by a composite primary key. Visitors are identified by a salted SHA-256 hash of their IP, so raw IPs are never stored.
- **AI semantic search** at [`/search`](src/pages/search.astro):
  1. Posts are chunked and projects become one document each.
  2. Both are embedded with Workers AI and upserted into Vectorize.
  3. Each query is embedded the same way and ranked by cosine similarity.
  4. If Workers AI or Vectorize is unavailable, search falls back to keyword matching.

## API

| Route | Method | What it does |
| --- | --- | --- |
| `/api/views/:slug` | `GET` / `POST` | Read the view count / increment it |
| `/api/likes/:slug` | `GET` / `POST` | Read the like state / toggle it |
| `/api/search?q=` | `GET` | Semantic search over posts and projects |
| `/api/reindex` | `POST` | Re-embed all content into Vectorize (needs `Authorization: Bearer $REINDEX_TOKEN`) |

## Running it yourself

```bash
npm install

# One-time Cloudflare setup
npx wrangler login
npx wrangler d1 create jake-lulla-db            # paste the database_id into wrangler.json
npx wrangler vectorize create jake-lulla-search --dimensions=768 --metric=cosine
npm run db:migrate
npx wrangler secret put REINDEX_TOKEN

# Deploy, then build the search index
npm run build && npm run deploy
curl -X POST https://<your-worker>.workers.dev/api/reindex \
  -H "Authorization: Bearer $REINDEX_TOKEN" -H "Content-Type: application/json"
```

For local development:

```bash
cp .dev.vars.example .dev.vars
npm run db:migrate:local
npm run preview   # astro build + wrangler dev
```

Workers AI has no local emulator, so `wrangler dev` needs a Cloudflare login to proxy that binding. Without one, search falls back to keyword matching.

## Credit

Started from Cloudflare's [Astro blog starter](https://github.com/cloudflare/templates/tree/main/astro-blog-starter-template). The base styles are adapted from [Bear Blog](https://github.com/HermanMartinus/bearblog/) (MIT).
