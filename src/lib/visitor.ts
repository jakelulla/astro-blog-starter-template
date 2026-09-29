/** Salted SHA-256 of the client IP, so likes can be de-duplicated without storing IPs. */
export async function visitorId(request: Request, slug: string): Promise<string> {
	const ip = request.headers.get("CF-Connecting-IP") ?? "local";
	const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`jake-lulla:${slug}:${ip}`));
	return [...new Uint8Array(bytes)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export const SLUG_RE = /^[a-z0-9-]{1,100}$/;
