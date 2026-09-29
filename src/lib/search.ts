import { getCollection } from "astro:content";
import { projects } from "../data/projects";

export const EMBEDDING_MODEL = "@cf/baai/bge-base-en-v1.5"; // 768 dimensions
const CHUNK_CHARS = 900;

export interface Doc {
	id: string; // Vectorize vector id, e.g. "blog/building-this-site#2"
	url: string;
	title: string;
	kind: "post" | "project";
	text: string;
}

export interface SearchResult {
	url: string;
	title: string;
	kind: Doc["kind"];
	snippet: string;
	score: number;
}

/** Strip the bits of Markdown/MDX that add noise to embeddings. */
function plain(md: string): string {
	return md
		.replace(/```[\s\S]*?```/g, " ")
		.replace(/^(import|export) .*$/gm, "")
		.replace(/!\[[^\]]*\]\([^)]*\)/g, "")
		.replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
		.replace(/[#>*_`|]/g, "")
		.replace(/\s+/g, " ")
		.trim();
}

/** Split on paragraphs, then pack paragraphs into ~CHUNK_CHARS chunks. */
function chunk(md: string): string[] {
	const paras = md.split(/\n\s*\n/).map(plain).filter(Boolean);
	const chunks: string[] = [];
	let cur = "";
	for (const p of paras) {
		if (cur && cur.length + p.length > CHUNK_CHARS) {
			chunks.push(cur);
			cur = "";
		}
		cur = cur ? `${cur} ${p}` : p;
	}
	if (cur) chunks.push(cur);
	return chunks;
}

/** Every searchable piece of the site, ready to embed. */
export async function collectDocs(): Promise<Doc[]> {
	const docs: Doc[] = [];

	for (const post of await getCollection("blog")) {
		const url = `/blog/${post.id}/`;
		const pieces = chunk(`${post.data.description}\n\n${post.body ?? ""}`);
		pieces.forEach((text, i) =>
			docs.push({ id: `blog/${post.id}#${i}`, url, title: post.data.title, kind: "post", text }),
		);
	}

	for (const p of projects) {
		docs.push({
			id: `project/${p.slug}`,
			url: `/#${p.slug}`,
			title: p.name,
			kind: "project",
			text: plain(`${p.name}. ${p.summary} ${p.highlights.join(" ")} ${p.tags.join(", ")}`),
		});
	}

	return docs;
}

export async function embed(ai: Ai, texts: string[]): Promise<number[][]> {
	const out = (await ai.run(EMBEDDING_MODEL, { text: texts })) as { data: number[][] };
	return out.data;
}

/** Collapse multiple matching chunks from the same page into its best hit. */
export function dedupe(results: SearchResult[], limit: number): SearchResult[] {
	const best = new Map<string, SearchResult>();
	for (const r of results) {
		const prev = best.get(r.url);
		if (!prev || r.score > prev.score) best.set(r.url, r);
	}
	return [...best.values()].sort((a, b) => b.score - a.score).slice(0, limit);
}

/** Plain keyword match, used when Workers AI / Vectorize are unavailable (e.g. local dev). */
export async function keywordSearch(q: string, limit: number): Promise<SearchResult[]> {
	const terms = q.toLowerCase().split(/\W+/).filter((t) => t.length > 2);
	if (!terms.length) return [];
	const hits = (await collectDocs())
		.map((d) => {
			const hay = `${d.title} ${d.text}`.toLowerCase();
			const matched = terms.filter((t) => hay.includes(t)).length;
			return { url: d.url, title: d.title, kind: d.kind, snippet: d.text.slice(0, 220), score: matched / terms.length };
		})
		.filter((r) => r.score > 0);
	return dedupe(hits, limit);
}
