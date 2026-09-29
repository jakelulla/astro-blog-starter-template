import type { APIRoute } from "astro";
import { SLUG_RE } from "../../../lib/visitor";

export const prerender = false;

/** Read the view count without incrementing. */
export const GET: APIRoute = async ({ params, locals }) => {
	const slug = params.slug ?? "";
	if (!SLUG_RE.test(slug)) return new Response("Bad slug", { status: 400 });

	const row = await locals.runtime.env.DB.prepare("SELECT count FROM views WHERE slug = ?1")
		.bind(slug)
		.first<{ count: number }>();
	return Response.json({ views: row?.count ?? 0 });
};

/** Increment and return the view count for a post. */
export const POST: APIRoute = async ({ params, locals }) => {
	const slug = params.slug ?? "";
	if (!SLUG_RE.test(slug)) return new Response("Bad slug", { status: 400 });

	const row = await locals.runtime.env.DB.prepare(
		`INSERT INTO views (slug, count) VALUES (?1, 1)
		 ON CONFLICT(slug) DO UPDATE SET count = count + 1
		 RETURNING count`,
	)
		.bind(slug)
		.first<{ count: number }>();
	return Response.json({ views: row?.count ?? 0 });
};
