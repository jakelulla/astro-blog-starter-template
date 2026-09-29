import type { APIRoute } from "astro";
import { collectDocs, embed } from "../../lib/search";

export const prerender = false;

const BATCH = 50;

/**
 * Re-embeds every post and project and upserts them into Vectorize.
 * Run after deploying new content:
 *   curl -X POST https://<site>/api/reindex -H "Authorization: Bearer $REINDEX_TOKEN"
 */
export const POST: APIRoute = async ({ request, locals }) => {
	const { AI, VECTORIZE, REINDEX_TOKEN } = locals.runtime.env;
	if (!REINDEX_TOKEN || request.headers.get("Authorization") !== `Bearer ${REINDEX_TOKEN}`) {
		return new Response("Unauthorized", { status: 401 });
	}

	const docs = await collectDocs();
	try {
		for (let i = 0; i < docs.length; i += BATCH) {
			const batch = docs.slice(i, i + BATCH);
			const vectors = await embed(AI, batch.map((d) => `${d.title}. ${d.text}`));
			await VECTORIZE.upsert(
				batch.map((d, j) => ({
					id: d.id,
					values: vectors[j],
					metadata: { url: d.url, title: d.title, kind: d.kind, snippet: d.text.slice(0, 220) },
				})),
			);
		}
	} catch (err) {
		return Response.json({ error: `Indexing failed: ${err}` }, { status: 503 });
	}
	return Response.json({ indexed: docs.length, ids: docs.map((d) => d.id) });
};
