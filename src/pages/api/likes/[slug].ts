import type { APIRoute } from "astro";
import { SLUG_RE, visitorId } from "../../../lib/visitor";

export const prerender = false;

async function state(db: D1Database, slug: string, visitor: string) {
	const [total, mine] = await db.batch<{ n: number }>([
		db.prepare("SELECT COUNT(*) AS n FROM likes WHERE slug = ?1").bind(slug),
		db.prepare("SELECT COUNT(*) AS n FROM likes WHERE slug = ?1 AND visitor = ?2").bind(slug, visitor),
	]);
	return { likes: total.results[0]?.n ?? 0, liked: (mine.results[0]?.n ?? 0) > 0 };
}

/** Current like count, and whether this visitor has liked the post. */
export const GET: APIRoute = async ({ params, request, locals }) => {
	const slug = params.slug ?? "";
	if (!SLUG_RE.test(slug)) return new Response("Bad slug", { status: 400 });
	const db = locals.runtime.env.DB;
	return Response.json(await state(db, slug, await visitorId(request, slug)));
};

/** Toggle this visitor's like. */
export const POST: APIRoute = async ({ params, request, locals }) => {
	const slug = params.slug ?? "";
	if (!SLUG_RE.test(slug)) return new Response("Bad slug", { status: 400 });
	const db = locals.runtime.env.DB;
	const visitor = await visitorId(request, slug);

	const removed = await db.prepare("DELETE FROM likes WHERE slug = ?1 AND visitor = ?2").bind(slug, visitor).run();
	if (!removed.meta.changes) {
		await db.prepare("INSERT OR IGNORE INTO likes (slug, visitor) VALUES (?1, ?2)").bind(slug, visitor).run();
	}
	return Response.json(await state(db, slug, visitor));
};
