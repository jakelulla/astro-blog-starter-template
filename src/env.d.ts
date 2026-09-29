type Runtime = import("@astrojs/cloudflare").Runtime<Env>;

declare namespace App {
	interface Locals extends Runtime {}
}

// Secret set with `wrangler secret put REINDEX_TOKEN` (and in .dev.vars locally).
interface Env {
	REINDEX_TOKEN?: string;
}
