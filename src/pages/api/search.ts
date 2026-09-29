import type { APIRoute } from "astro";
import { dedupe, embed, keywordSearch, type SearchResult } from "../../lib/search";

export const prerender = false;

const LIMIT = 5;
// bge-base cosine scores for unrelated text tend to sit below ~0.55.
const MIN_SCORE = 0.55;

export const GET: APIRoute = async ({ url, locals }) => {
	const q = url.searchParams.get("q")?.trim().slice(0, 200) ?? "";
	if (!q) return Response.json({ query: q, mode: "none", results: [] });

	const { AI, VECTORIZE } = locals.runtime.env;
	try {
		const [vector] = await embed(AI, [q]);
		const { matches } = await VECTORIZE.query(vector, { topK: 10, returnMetadata: "all" });
		const results: SearchResult[] = matches
			.filter((m) => m.score >= MIN_SCORE && m.metadata)
			.map((m) => {
				const md = m.metadata as Record<string, string>;
				return { url: md.url, title: md.title, kind: md.kind as SearchResult["kind"], snippet: md.snippet, score: m.score };
			});
		return Response.json({ query: q, mode: "semantic", results: dedupe(results, LIMIT) });
	} catch (err) {
		// Local dev has no real Vectorize index; degrade to keyword search instead of failing.
		console.warn("semantic search unavailable, falling back to keyword search:", err);
		return Response.json({ query: q, mode: "keyword", results: await keywordSearch(q, LIMIT) });
	}
};
