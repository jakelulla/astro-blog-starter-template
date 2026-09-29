// Projects shown on the home page. Also indexed into Vectorize so AI search
// can find them alongside blog posts.

export interface Project {
	slug: string;
	name: string;
	context: string;
	summary: string;
	highlights: string[];
	tags: string[];
	link?: { href: string; label: string };
}

export const projects: Project[] = [
	{
		slug: "phototrove",
		name: "PhotoTrove: On-Device AI Photo Search",
		context: "iOS · Client contract · Jun–Aug 2026",
		summary:
			"A client-commissioned native iOS app for natural-language photo search, face detection, and file sharing. Every model runs on the phone with zero backend, so photos never leave the device.",
		highlights: [
			"Built a PyTorch → CoreML conversion pipeline with 6-bit k-means and float16 quantization, compressing 4 neural networks to ~150 MB at 98.6% accuracy parity.",
			"Wrote a custom SCRFD face detector in Swift: decoded 9 output tensors across 16.8k anchors with 5-point alignment and NMS, reaching 98.72% ± 0.37% on LFW after finding a bug in the reference implementation that discarded half the test data.",
			"Search uses CLIP encoders with a custom BPE tokenizer and a two-stage retrieval pipeline (query parser, then cosine-similarity ranking).",
			"Actor-based async indexing with Swift Concurrency and a binary codec cut storage by 100+ MB and overlapped Neural Engine work with I/O.",
			"Delivered a 24k-line, zero-dependency Swift codebase with 101 unit tests, and presented the architecture, threshold calibration, and benchmarks to the client.",
		],
		tags: ["Swift", "CoreML", "PyTorch", "CLIP", "Quantization"],
	},
	{
		slug: "riscv-kernel",
		name: "RISC-V 64-bit Operating System Kernel",
		context: "Coursework · ECE 391",
		summary:
			"A full OS with preemptive multitasking, virtual memory, and persistent storage, running on QEMU.",
		highlights: [
			"RISC-V assembly bootloader, priority-based scheduler driven by timer interrupts, and Sv39 paging with LRU replacement and swap.",
			"Reader-writer locks built on atomic AMO instructions; resolved deadlocks with a total lock ordering and chased down 5–10 race conditions with GDB and stress tests.",
			"Buddy allocator (O(log n)), VirtIO block driver, and a dual-filesystem design: a FAT-based ngfs plus read-only tarfs.",
			"fork/exec syscalls with full process state and page-table management.",
		],
		tags: ["C", "RISC-V", "Operating Systems", "Concurrency"],
	},
	{
		slug: "duplicate-questions",
		name: "Duplicate Question Detection",
		context: "Coursework · Deep learning",
		summary:
			"Semantic-equivalence classification on 300K Quora question pairs, comparing three model families.",
		highlights: [
			"Implemented MLP, RNN/GRU, and Transformer models; the Transformer reached 81.18% validation accuracy, 6.18 points above the RNN baseline.",
			"Built the Transformer from first principles: sinusoidal positional encodings and masked multi-head attention.",
			"Ran an ablation over 4–8 attention heads and found overfitting beyond 4 heads.",
			"Custom PyTorch dataset with BERT tokenization, padding, and a stratified 2:1 train/val split.",
		],
		tags: ["PyTorch", "Transformers", "NLP"],
	},
	{
		slug: "this-site",
		name: "This site",
		context: "Astro · Cloudflare Workers",
		summary:
			"The page you're reading. Statically built with Astro and served from Cloudflare Workers, with a D1-backed view counter and likes, plus semantic search powered by Workers AI embeddings and Vectorize.",
		highlights: [
			"D1 (SQLite at the edge) stores per-post view counts and de-duplicated likes.",
			"Blog posts and projects are chunked, embedded with bge-base-en-v1.5, and stored in a Vectorize index for meaning-based search.",
		],
		tags: ["Astro", "Cloudflare Workers", "D1", "Workers AI", "Vectorize"],
		link: { href: "https://github.com/jakelulla/jake-lulla-blog", label: "Source" },
	},
];

export const skills: Record<string, string[]> = {
	Languages: ["C/C++", "Python", "Java", "Swift", "RISC-V Assembly", "TypeScript"],
	"AI / ML": ["PyTorch", "CoreML", "CLIP", "Transformers", "Face detection", "Model quantization"],
	Systems: ["Virtual memory", "Scheduling", "Synchronization", "Device drivers", "GDB / QEMU"],
	Tools: ["Xcode", "Swift Concurrency", "GPU computing", "Git", "Cloudflare Workers"],
};

export const coursework = [
	"ECE 391 · Computer Systems Engineering",
	"ECE 408 · Applied Parallel Programming",
	"ECE 494 · Deep Learning for Computer Vision",
	"ECE 448 · Artificial Intelligence",
	"ECE 438 · Computer Networks",
	"ECE 364 · Programming Methods for ML",
	"CS 225 · Data Structures",
	"CS 418 · Interactive Computer Graphics",
];
