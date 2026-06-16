/**
 * Search & Fetch Tools Extension
 *
 * Four tools:
 *  - web_search:       General web search (Exa → Tavily → Brave → DuckDuckGo fallback chain)
 *  - academic_search:  Academic paper search (arXiv + OpenAlex + CrossRef, parallel, combined)
 *  - code_search:      GitHub repository search
 *  - web_fetch:        Fetch a URL (HTML→text, files→disk for PDF processing)
 */

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";
import { StringEnum } from "@earendil-works/pi-ai";
import { mkdirSync, readFileSync, existsSync, createWriteStream, statSync } from "node:fs";
import { tmpdir, homedir } from "node:os";
import { join } from "node:path";
import { Text } from "@earendil-works/pi-tui";

// ─── Download directory ─────────────────────────────────────────────────────
const DOWNLOAD_DIR = join(tmpdir(), "pi-web-files");
mkdirSync(DOWNLOAD_DIR, { recursive: true });

// ─── Cache ──────────────────────────────────────────────────────────────────
interface CacheEntry {
	data: unknown;
	expiresAt: number;
}
const searchCache = new Map<string, CacheEntry>();
const searchTimestamps: number[] = [];

const CACHE_TTL_MS = 5 * 60 * 1_000;
const CACHE_MAX_ENTRIES = 200;
const RATE_LIMIT_MIN_INTERVAL_MS = 2_000;

function getCached<T>(key: string): T | null {
	const entry = searchCache.get(key);
	if (!entry) return null;
	if (Date.now() > entry.expiresAt) {
		searchCache.delete(key);
		return null;
	}
	return entry.data as T;
}

function setCache<T>(key: string, data: T): void {
	if (searchCache.size >= CACHE_MAX_ENTRIES) {
		const entries = [...searchCache.entries()];
		entries.sort((a, b) => a[1].expiresAt - b[1].expiresAt);
		const toRemove = Math.max(1, Math.floor(CACHE_MAX_ENTRIES * 0.25));
		for (let i = 0; i < toRemove; i++) searchCache.delete(entries[i][0]);
	}
	searchCache.set(key, { data, expiresAt: Date.now() + CACHE_TTL_MS });
}

async function rateLimit(): Promise<void> {
	const now = Date.now();
	while (searchTimestamps.length > 0 && searchTimestamps[0] < now - 10_000) {
		searchTimestamps.shift();
	}
	if (searchTimestamps.length > 0) {
		const elapsed = now - searchTimestamps[searchTimestamps.length - 1];
		if (elapsed < RATE_LIMIT_MIN_INTERVAL_MS) {
			await new Promise((r) => setTimeout(r, RATE_LIMIT_MIN_INTERVAL_MS - elapsed));
		}
	}
	searchTimestamps.push(Date.now());
}

// Simple URL download cache (prevents re-downloading)
const downloadCache = new Map<string, { path: string; sizeBytes: number }>();
// In-flight lock: deduplicates concurrent downloads of the same URL
const inFlightDownloads = new Map<string, Promise<void>>();

// ─── Helpers ────────────────────────────────────────────────────────────────
function extractXmlTag(xml: string, tag: string): string | null {
	const match = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`));
	return match ? match[1].trim() : null;
}

// ─── MCP Client (for Exa & Parallel) ────────────────────────────────────────
async function mcpCall(
	url: string,
	toolName: string,
	args: Record<string, unknown>,
	headers: Record<string, string> = {},
): Promise<string | null> {
	const req = {
		jsonrpc: "2.0" as const,
		id: 1 as const,
		method: "tools/call" as const,
		params: { name: toolName, arguments: args },
	};
	const resp = await fetch(url, {
		method: "POST",
		headers: { "Content-Type": "application/json", Accept: "application/json, text/event-stream", ...headers },
		body: JSON.stringify(req),
		signal: AbortSignal.timeout(15_000),
	});
	const body = await resp.text();
	const trimmed = body.trim();

	// Direct JSON-RPC response
	if (trimmed.startsWith("{")) {
		try {
			const parsed = JSON.parse(trimmed);
			const content = parsed?.result?.content;
			if (Array.isArray(content)) {
				for (const item of content) {
					if (item?.type === "text" && item?.text) return item.text;
				}
			}
		} catch { /* fall through to SSE parsing */ }
	}

	// SSE-style response (data: {...}\n\n)
	for (const line of body.split("\n")) {
		if (!line.startsWith("data: ")) continue;
		const data = line.slice(6).trim();
		if (!data.startsWith("{")) continue;
		try {
			const parsed = JSON.parse(data);
			const content = parsed?.result?.content;
			if (Array.isArray(content)) {
				for (const item of content) {
					if (item?.type === "text" && item?.text) return item.text;
				}
			}
		} catch { continue; }
	}
	return null;
}

// =========================================================================
//  WEB SEARCH BACKENDS  (fallback chain: Exa → Tavily → Brave → DuckDuckGo)
// =========================================================================

// ─── Exa (MCP — free, no key needed for basic use) ──────────────────────────
async function searchExa(query: string, numResults: number): Promise<string | null> {
	const url = process.env.EXA_API_KEY
		? `https://mcp.exa.ai/mcp?exaApiKey=${encodeURIComponent(process.env.EXA_API_KEY)}`
		: "https://mcp.exa.ai/mcp";

	const result = await mcpCall(url, "web_search_exa", {
		query,
		type: "auto",
		numResults,
		livecrawl: "fallback",
	});
	if (!result) return null;

	const lower = result.trim().toLowerCase();
	if (lower.startsWith("no search results") || lower.startsWith("no results")) return null;
	return result;
}

// ─── Tavily ─────────────────────────────────────────────────────────────────
const TAVILY_API_URL = "https://api.tavily.com/search";
const TAVILY_CONFIG_PATH = join(homedir(), ".pi", "tavily.json");

function getTavilyApiKey(): string | null {
	if (process.env.TAVILY_API_KEY) return process.env.TAVILY_API_KEY;
	try {
		if (existsSync(TAVILY_CONFIG_PATH)) {
			const raw = readFileSync(TAVILY_CONFIG_PATH, "utf-8");
			const config = JSON.parse(raw) as { apiKey?: string };
			if (config.apiKey) return config.apiKey;
		}
	} catch { /* ignore */ }
	return null;
}

async function searchTavily(query: string, maxResults: number): Promise<string | null> {
	const apiKey = getTavilyApiKey();
	if (!apiKey) return null;

	const response = await fetch(TAVILY_API_URL, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${apiKey}`,
		},
		body: JSON.stringify({ query, search_depth: "basic", max_results: Math.min(maxResults, 20), include_answer: true, include_images: false }),
		signal: AbortSignal.timeout(15_000),
	});

	if (!response.ok) {
		const text = await response.text();
		throw new Error(`Tavily API error (${response.status}): ${text.slice(0, 200)}`);
	}

	const data = (await response.json()) as {
		answer?: string;
		results?: Array<{ title: string; url: string; content: string; score?: number }>;
	};

	const results = data.results ?? [];
	if (results.length === 0) return null;

	const lines: string[] = [`## Tavily Search Results: "${query}"`];
	if (data.answer) lines.push("", data.answer);
	for (const [i, r] of results.entries()) {
		const snippet = r.content ? (r.content.length > 500 ? r.content.slice(0, 500) + "..." : r.content) : "";
		lines.push("", `**${i + 1}. ${r.title}**`, `  URL: ${r.url}`, ...(snippet ? [`  ${snippet}`] : []));
	}
	return lines.join("\n");
}

// ─── Brave Search ───────────────────────────────────────────────────────────
async function searchBrave(query: string, numResults: number): Promise<string | null> {
	const apiKey = process.env.BRAVE_API_KEY;
	if (!apiKey) return null;

	const url = `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=${Math.min(numResults, 20)}`;
	const response = await fetch(url, {
		headers: { Accept: "application/json", "X-Subscription-Token": apiKey },
		signal: AbortSignal.timeout(15_000),
	});

	if (!response.ok) throw new Error(`Brave API returned status ${response.status}`);

	const data = (await response.json()) as {
		web?: { results?: Array<{ title: string; url: string; description?: string }> };
	};

	const results = data?.web?.results ?? [];
	if (results.length === 0) return null;

	const lines = [`## Brave Search Results: "${query}"`, ""];
	for (let i = 0; i < results.length; i++) {
		const r = results[i];
		lines.push(`${i + 1}. **${r.title}**`, `   URL: ${r.url}`, `   ${r.description ?? ""}`, "");
	}
	return lines.join("\n");
}

// ─── DuckDuckGo + Wikipedia (free fallback) ─────────────────────────────────
interface DdgRelatedTopic {
	FirstURL?: string;
	Text?: string;
}
interface DdgResponse {
	Abstract?: string;
	AbstractText?: string;
	AbstractSource?: string;
	AbstractURL?: string;
	Heading?: string;
	Answer?: string;
	AnswerType?: string;
	RelatedTopics?: (DdgRelatedTopic | { Name?: string; Topics?: DdgRelatedTopic[] })[];
	Results?: DdgRelatedTopic[];
}
interface WikiSearchResult {
	pageid: number;
	title: string;
	snippet: string;
	timestamp?: string;
}

async function searchDuckDuckGo(query: string, numResults: number): Promise<string | null> {
	const lines: string[] = [];
	let found = 0;

	// Step 1: DuckDuckGo Instant Answer API
	const iaUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`;
	const resp = await fetch(iaUrl, { signal: AbortSignal.timeout(10_000) });
	const data = (await resp.json()) as DdgResponse;

	if (data.AbstractText) {
		lines.push(`## ${data.Heading || data.AbstractSource || "Summary"}`);
		lines.push(data.AbstractText);
		if (data.AbstractURL) lines.push(`Source: ${data.AbstractURL}`);
		lines.push("");
		found++;
	}
	if (data.Answer) {
		lines.push(`## Answer (${data.AnswerType || "direct"})`);
		lines.push(data.Answer);
		lines.push("");
		found++;
	}
	if (data.RelatedTopics) {
		const flat: DdgRelatedTopic[] = [];
		for (const t of data.RelatedTopics) {
			if ("Topics" in t && t.Topics) flat.push(...t.Topics);
			else if ("FirstURL" in t) flat.push(t);
		}
		const max = Math.min(flat.length, numResults - found);
		if (max > 0) {
			lines.push("## Related Topics");
			for (let i = 0; i < max; i++) {
				const text = (flat[i].Text ?? "").replace(/<[^>]*>/g, "").trim();
				if (text) {
					lines.push(`${i + 1}. ${text}`);
					if (flat[i].FirstURL) lines.push(`   ${flat[i].FirstURL}`);
					lines.push("");
					found++;
				}
			}
		}
	}
	if (data.Results) {
		const max = Math.min(data.Results.length, numResults - found);
		for (let i = 0; i < max; i++) {
			const text = (data.Results[i].Text ?? "").replace(/<[^>]*>/g, "").trim();
			if (text) {
				lines.push(`${found + 1}. ${text}`);
				if (data.Results[i].FirstURL) lines.push(`   ${data.Results[i].FirstURL}`);
				lines.push("");
				found++;
			}
		}
	}

	// Step 2: Wikipedia search for more results
	if (found < numResults) {
		const wikiUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&srlimit=${numResults - found}`;
		try {
			const wikiResp = await fetch(wikiUrl, { signal: AbortSignal.timeout(10_000) });
			const wikiData = (await wikiResp.json()) as { query?: { search?: WikiSearchResult[] } };
			const wikiResults = wikiData?.query?.search ?? [];
			if (wikiResults.length > 0) {
				if (found === 0) lines.push("## Wikipedia Search Results");
				for (const r of wikiResults) {
					if (found >= numResults) break;
					const cleanSnippet = r.snippet.replace(/<[^>]*>/g, "").replace(/\.\.\./g, "…");
					const pageUrl = `https://en.wikipedia.org/wiki/${encodeURIComponent(r.title.replace(/ /g, "_"))}`;
					lines.push(`${found + 1}. **${r.title}**`, `   ${cleanSnippet}`, `   ${pageUrl}`, "");
					found++;
				}
			}
		} catch { /* Wikipedia API failed */ }
	}

	if (found === 0) return null;
	return lines.join("\n");
}

// =========================================================================
//  ACADEMIC SEARCH BACKENDS  (run in parallel, combined)
// =========================================================================

// ─── arXiv ──────────────────────────────────────────────────────────────────
async function searchArxiv(query: string, maxResults: number): Promise<string | null> {
	const encoded = encodeURIComponent(query);
	const url = `https://export.arxiv.org/api/query?search_query=all:${encoded}&start=0&max_results=${maxResults}&sortBy=relevance&sortOrder=descending`;

	const response = await fetch(url, {
		headers: { "User-Agent": "pi-coding-agent/1.0" },
		signal: AbortSignal.timeout(15_000),
	});
	if (!response.ok) throw new Error(`arXiv API error: ${response.status}`);

	const xml = await response.text();
	const entries = xml.split("<entry>").slice(1);
	if (entries.length === 0) return null;

	const results: string[] = [];
	for (const entry of entries) {
		const title = extractXmlTag(entry, "title")?.replace(/\s+/g, " ").trim() || "No title";
		const summary = extractXmlTag(entry, "summary")?.replace(/\s+/g, " ").trim() || "";
		const id = extractXmlTag(entry, "id") || "";
		const published = extractXmlTag(entry, "published")?.slice(0, 10) || "";
		const authors = [...entry.matchAll(/<author>.*?<name>(.*?)<\/name>.*?<\/author>/gs)]
			.map((m) => m[1].trim())
			.join(", ");
		const arxivId = id.replace(/.*\/abs\//, "").replace(/v\d+$/, "");
		const pdfUrl = `https://arxiv.org/pdf/${arxivId}`;
		results.push(
			`**${title}**`,
			`  Authors: ${authors}`,
			`  Published: ${published}`,
			`  arXiv: ${id}`,
			`  PDF: ${pdfUrl}`,
			`  Summary: ${summary.slice(0, 300)}${summary.length > 300 ? "..." : ""}`,
			"",
		);
	}
	return results.join("\n");
}

// ─── OpenAlex ───────────────────────────────────────────────────────────────
async function searchOpenAlex(query: string, maxResults: number): Promise<string | null> {
	const encoded = encodeURIComponent(query);
	const perPage = Math.min(maxResults, 20);
	const url = `https://api.openalex.org/works?search=${encoded}&per_page=${perPage}&sort=relevance_score:desc`;

	const response = await fetch(url, {
		headers: { "User-Agent": "pi-coding-agent/1.0" },
		signal: AbortSignal.timeout(15_000),
	});
	if (response.status === 429) throw new Error("OpenAlex rate limit reached (100k requests/day).");
	if (!response.ok) {
		const text = await response.text();
		throw new Error(`OpenAlex error (${response.status}): ${text.slice(0, 200)}`);
	}

	const data = (await response.json()) as {
		results?: Array<{
			id: string;
			title: string;
			publication_year?: number;
			authorships?: Array<{ author: { display_name: string } }>;
			cited_by_count?: number;
			doi?: string;
			primary_location?: { source?: { display_name?: string }; pdf_url?: string } | null;
			open_access?: { is_oa: boolean; oa_url?: string } | null;
			abstract_inverted_index?: Record<string, number[]> | null;
		}>;
		meta?: { count?: number };
	};

	const papers = data.results ?? [];
	if (papers.length === 0) return null;

	const results: string[] = [];
	for (const paper of papers) {
		const authors = (paper.authorships ?? []).slice(0, 5).map((a) => a.author.display_name).join(", ");
		const authorStr = authors + ((paper.authorships ?? []).length > 5 ? " et al." : "");
		const yearStr = paper.publication_year ? ` (${paper.publication_year})` : "";
		const citations = paper.cited_by_count ?? 0;
		const journal = paper.primary_location?.source?.display_name ?? "";
		const journalStr = journal ? ` | ${journal}` : "";
		let abstract = "";
		if (paper.abstract_inverted_index) {
			const words: Array<{ word: string; pos: number }> = [];
			for (const [word, positions] of Object.entries(paper.abstract_inverted_index)) {
				for (const pos of positions) words.push({ word, pos });
			}
			words.sort((a, b) => a.pos - b.pos);
			abstract = words.map((w) => w.word).join(" ").slice(0, 300);
			if (abstract.length >= 300) abstract += "...";
		}
		const links: string[] = [];
		const openalexId = paper.id.split("/").pop() ?? "";
		links.push(`https://openalex.org/${openalexId}`);
		if (paper.doi) links.push(`https://doi.org/${paper.doi}`);
		if (paper.open_access?.oa_url) links.push(`PDF: ${paper.open_access.oa_url}`);
		else if (paper.primary_location?.pdf_url) links.push(`PDF: ${paper.primary_location.pdf_url}`);

		results.push(
			`**${paper.title}**${yearStr}`,
			`  Authors: ${authorStr}`,
			`  Citations: ${citations}${journalStr}`,
			`  ${links.join(" | ")}`,
			...(abstract ? [`  ${abstract}`] : []),
			"",
		);
	}
	return results.join("\n");
}

// ─── CrossRef ───────────────────────────────────────────────────────────────
async function searchCrossref(query: string, maxResults: number): Promise<string | null> {
	const encoded = encodeURIComponent(query);
	const url = `https://api.crossref.org/works?query=${encoded}&rows=${Math.min(maxResults, 20)}&sort=relevance&order=desc`;

	const response = await fetch(url, {
		headers: { "User-Agent": "pi-coding-agent/1.0 (mailto:pi-agent@example.com)" },
		signal: AbortSignal.timeout(15_000),
	});
	if (!response.ok) {
		const text = await response.text();
		throw new Error(`CrossRef error (${response.status}): ${text.slice(0, 200)}`);
	}

	const data = (await response.json()) as {
		message?: {
			items?: Array<{
				title?: string[];
				author?: Array<{ given?: string; family?: string }>;
				published?: { "date-parts"?: number[][] };
				container?: { "container-title"?: string[] };
				DOI?: string;
				URL?: string;
				type?: string;
				"is-referenced-by-count"?: number;
				abstract?: string;
			}>;
		};
	};

	const items = data.message?.items ?? [];
	if (items.length === 0) return null;

	const results: string[] = [];
	for (const item of items) {
		const title = (item.title ?? ["No title"])[0];
		const authors = (item.author ?? []).slice(0, 5).map((a) => [a.given, a.family].filter(Boolean).join(" ")).join(", ");
		const authorStr = authors + ((item.author ?? []).length > 5 ? " et al." : "");
		const year = item.published?.["date-parts"]?.[0]?.[0];
		const yearStr = year ? ` (${year})` : "";
		const journal = item.container?.["container-title"]?.[0] ?? "";
		const journalStr = journal ? ` | ${journal}` : "";
		const citations = item["is-referenced-by-count"] ?? 0;
		const doi = item.DOI ?? "";
		const doiUrl = doi ? `https://doi.org/${doi}` : "";
		const type = (item.type ?? "").replace(/-/g, " ");
		let abstract = "";
		if (item.abstract) {
			abstract = item.abstract.replace(/<[^>]*>/g, "").replace(/\n/g, " ").slice(0, 300);
			if (abstract.length >= 300) abstract += "...";
		}
		results.push(
			`**${title}**${yearStr}`,
			`  Authors: ${authorStr}`,
			`  Type: ${type}${journalStr} | Citations: ${citations}`,
			...(doiUrl ? [`  DOI: ${doiUrl}`] : []),
			...(abstract ? [`  ${abstract}`] : []),
			"",
		);
	}
	return results.join("\n");
}

// =========================================================================
//  CODE SEARCH BACKEND
// =========================================================================

async function searchGitHub(query: string, maxResults: number): Promise<string | null> {
	const encoded = encodeURIComponent(query);
	const url = `https://api.github.com/search/repositories?q=${encoded}&sort=stars&order=desc&per_page=${maxResults}`;

	const response = await fetch(url, {
		headers: { Accept: "application/vnd.github.v3+json", "User-Agent": "pi-coding-agent/1.0" },
		signal: AbortSignal.timeout(15_000),
	});
	if (!response.ok) {
		const text = await response.text();
		throw new Error(`GitHub API error (${response.status}): ${text.slice(0, 200)}`);
	}

	const data = (await response.json()) as {
		items: Array<{
			full_name: string;
			html_url: string;
			description: string | null;
			stargazers_count: number;
			language: string | null;
			topics: string[];
			updated_at: string;
		}>;
	};

	if (!data.items || data.items.length === 0) return null;

	const results = data.items.map((repo) => {
		const topics = repo.topics?.slice(0, 5).join(", ") || "";
		return [
			`**${repo.full_name}**`,
			`  URL: ${repo.html_url}`,
			`  ⭐ ${repo.stargazers_count} | Language: ${repo.language || "N/A"} | Updated: ${repo.updated_at.slice(0, 10)}`,
			repo.description ? `  Description: ${repo.description}` : "",
			topics ? `  Topics: ${topics}` : "",
		].filter(Boolean).join("\n");
	});

	return `## GitHub Search Results: "${query}"\n\n${results.join("\n\n")}`;
}

// =========================================================================
//  FETCH BACKENDS
// =========================================================================

async function processTextResponse(response: Response, url: string) {
	const html = await response.text();

	const text = html
		.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
		.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
		.replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, "")
		.replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, "")
		.replace(/<header[^>]*>[\s\S]*?<\/header>/gi, "")
		.replace(/<\/(p|div|h[1-6]|li|tr|blockquote|pre)>/gi, "\n")
		.replace(/<br\s*\/?>/gi, "\n")
		.replace(/<[^>]*>/g, "")
		.replace(/&amp;/g, "&")
		.replace(/&lt;/g, "<")
		.replace(/&gt;/g, ">")
		.replace(/&quot;/g, '"')
		.replace(/&#39;/g, "'")
		.replace(/&nbsp;/g, " ")
		.replace(/&[a-z]+;/g, " ")
		.replace(/\n\s*\n\s*\n/g, "\n\n")
		.replace(/[ \t]+/g, " ")
		.trim();

	const maxLen = 50_000;
	const displayText =
		text.length > maxLen
			? text.slice(0, maxLen) + `\n\n... [truncated at ${maxLen} chars, total ${text.length}]`
			: text;

	return {
		content: [{ type: "text", text: displayText }],
		details: { url, contentType: response.headers.get("content-type") || "text/html", length: text.length },
	};
}

// ─── Helpers for web_fetch ─────────────────────────────────────────────────
function shortHash(s: string): string {
	let hash = 0;
	for (let i = 0; i < s.length; i++) {
		hash = ((hash << 5) - hash) + s.charCodeAt(i);
		hash |= 0;
	}
	return Math.abs(hash).toString(16).slice(0, 8);
}

async function saveFileFromResponse(response: Response, url: string) {
	// Generate unique filename from URL hash + original extension
	const urlPath = new URL(url).pathname;
	const baseName = urlPath.split("/").pop() || "";
	const hash = shortHash(url);
	const ext = baseName.lastIndexOf(".") > 0 ? baseName.slice(baseName.lastIndexOf(".")) : "";
	const fileName = `${hash}${ext}`;
	const filePath = join(DOWNLOAD_DIR, fileName);

	// Check download cache
	const cached = downloadCache.get(url);
	if (cached && existsSync(cached.path)) {
		const sizeKb = (cached.sizeBytes / 1024).toFixed(1);
		return {
			content: [{ type: "text", text: `File already downloaded: **${cached.path.split("/").pop()}** (${sizeKb} KB)\nPath: \`${cached.path}\`\n\nUse \`read_pdf\` with path \`${cached.path}\` to read the content.` }],
			details: { path: cached.path, url, sizeBytes: cached.sizeBytes, cached: true },
		};
	}

	// Deduplicate: if another fetch for this URL is in-flight, wait for it
	const existing = inFlightDownloads.get(url);
	if (existing) {
		await existing;
		const nowCached = downloadCache.get(url);
		if (nowCached) {
			const sizeKb = (nowCached.sizeBytes / 1024).toFixed(1);
			return {
				content: [{ type: "text", text: `File downloaded: **${fileName}** (${sizeKb} KB)\nPath: \`${nowCached.path}\`\n\nUse \`read_pdf\` with path \`${nowCached.path}\` to read PDF content.` }],
				details: { path: nowCached.path, url, sizeBytes: nowCached.sizeBytes, cached: true },
			};
		}
	}

	// Stream response body directly to disk (no buffering)
	const downloadDone = (async () => {
		const file = createWriteStream(filePath);
		const reader = response.body!.getReader();
		try {
			while (true) {
				const { done, value } = await reader.read();
				if (done) break;
				file.write(value);
			}
		} finally {
			reader.releaseLock();
			await new Promise<void>((resolve, reject) => {
				file.end((err: Error | null) => (err ? reject(err) : resolve()));
			});
		}

		const sizeBytes = statSync(filePath).size;

		// Cache with LRU (max 20)
		downloadCache.set(url, { path: filePath, sizeBytes });
		if (downloadCache.size > 20) {
			const firstKey = downloadCache.keys().next().value;
			if (firstKey !== undefined) downloadCache.delete(firstKey);
		}
	})();

	inFlightDownloads.set(url, downloadDone);
	try {
		await downloadDone;
	} finally {
		inFlightDownloads.delete(url);
	}

	const sizeBytes = statSync(filePath).size;
	const sizeKb = (sizeBytes / 1024).toFixed(1);

	return {
		content: [{ type: "text", text: `File downloaded: **${fileName}** (${sizeKb} KB)\nPath: \`${filePath}\`\n\nUse \`read_pdf\` with path \`${filePath}\` to read PDF content.` }],
		details: { path: filePath, url, sizeBytes, cached: false },
	};
}

// =========================================================================
//  EXTENSION ENTRY POINT
// =========================================================================

export default function (pi: ExtensionAPI) {
	const currentYear = new Date().getFullYear();

	// ─── web_search ──────────────────────────────────────────────────────────
	pi.registerTool({
		name: "web_search",
		label: "Web Search",
		description: [
			"Search the internet for general information, current events, and real-time data.",
			"",
			`The current year is ${currentYear}.`,
			`You MUST use this year when searching for recent information or current events.`,
			`Example: If the current year is ${currentYear} and the user asks for "latest AI news",`,
			`search for "AI news ${currentYear}", NOT "AI news ${currentYear - 1}".`,
			"",
			"Backends tried in order: Exa (free, no key) → Tavily (needs key) → Brave (needs key) → DuckDuckGo (free fallback).",
			"Use the source parameter to force a specific backend.",
		].join("\n"),
		promptSnippet: "Search the web for general information, current events, and recent data",
		promptGuidelines: [
			"Use web_search for general web searches, current events, real-time data, and documentation lookups.",
			"Use web_search with source='exa' or source='tavily' to force a specific backend.",
			"After finding a URL of interest, use web_fetch to retrieve its content.",
			"For research papers and academic articles, use academic_search instead.",
			"For finding code implementations or libraries, use code_search instead.",
		],
		parameters: Type.Object({
			query: Type.String({ description: "The search query" }),
			source: Type.Optional(
				StringEnum(["exa", "tavily", "brave", "duckduckgo"] as const, {
					description: "Force a specific search backend (default: auto fallback chain)",
				}),
			),
			maxResults: Type.Optional(
				Type.Integer({ description: "Number of results (default: 5, max: 20)", default: 5, maximum: 20 }),
			),
		}),
		async execute(_toolCallId, params, _signal, _onUpdate, _ctx) {
			const { query, source, maxResults } = params;
			const numResults = Math.min(maxResults ?? 5, 20);
			const cacheKey = `web:${source ?? "auto"}:${query}:${numResults}`;

			const cached = getCached<string>(cacheKey);
			if (cached) {
				return { content: [{ type: "text", text: cached }], details: { query, cached: true } };
			}

			await rateLimit();

			if (source) {
				// Explicit backend
				let result: string | null = null;
				try {
					switch (source) {
						case "exa":
							result = await searchExa(query, numResults);
							break;
						case "tavily":
							result = await searchTavily(query, numResults);
							break;
						case "brave":
							result = await searchBrave(query, numResults);
							break;
						case "duckduckgo":
							result = await searchDuckDuckGo(query, numResults);
							break;
					}
				} catch (err: unknown) {
					const msg = err instanceof Error ? err.message : String(err);
					return { content: [{ type: "text", text: `Search failed (${source}): ${msg}` }], isError: true, details: {} };
				}
				const output = result ?? `No results found via ${source}.`;
				setCache(cacheKey, output);
				return { content: [{ type: "text", text: output }], details: { query, source, cached: false } };
			}

			// Fallback chain
			const chain: Array<{ name: string; search: () => Promise<string | null> }> = [
				{ name: "Exa", search: () => searchExa(query, numResults) },
				{ name: "Tavily", search: () => searchTavily(query, numResults) },
				{ name: "Brave", search: () => searchBrave(query, numResults) },
				{ name: "DuckDuckGo", search: () => searchDuckDuckGo(query, numResults) },
			];

			let lastError = "";
			for (const { name, search } of chain) {
				try {
					const result = await search();
					if (result !== null) {
						const header = `## Web Search: "${query}"\n*Results from ${name}*\n\n`;
						const output = header + result;
						setCache(cacheKey, output);
						return { content: [{ type: "text", text: output }], details: { query, backend: name, cached: false } };
					}
				} catch (err: unknown) {
					lastError = err instanceof Error ? err.message : String(err);
				}
			}

			const msg = lastError
				? `All web search backends failed. Last error: ${lastError}`
				: `No results found from any web search backend.`;
			setCache(cacheKey, msg);
			return { content: [{ type: "text", text: msg }], isError: true, details: {} };
		},

		renderResult(result, { expanded, isPartial }, theme, _context) {
			if (isPartial) return new Text(theme.fg("warning", "Searching..."), 0, 0);
			if (result.isError) return new Text(theme.fg("error", "Search failed"), 0, 0);
			const details = result.details as { query?: string; backend?: string } | undefined;
			let text = theme.fg("success", "Search results");
			if (details?.query) text += theme.fg("accent", ` "${details.query}"`);
			if (details?.backend) text += theme.fg("dim", ` (via ${details.backend})`);
			const content = result.content[0]?.type === "text" ? result.content[0].text : "";
			const resultCount = content.split("\n").filter((l) => /^\d+\.\s/.test(l.trim()) || /^\*\*[^*]/.test(l.trim())).length;
			if (resultCount > 0) text += theme.fg("dim", `, ${resultCount} results`);
			if (expanded) {
				const lines = content.split("\n").slice(0, 25);
				for (const line of lines) text += `\n${theme.fg("dim", line)}`;
				const total = content.split("\n").length;
				if (total > 25) text += `\n${theme.fg("muted", `... ${total - 25} more lines`)}`;
			}
			return new Text(text, 0, 0);
		},
	});

	// ─── academic_search ─────────────────────────────────────────────────────
	pi.registerTool({
		name: "academic_search",
		label: "Academic Search",
		description:
			"Search academic databases for research papers, preprints, and citation metadata. " +
			"Runs arXiv (preprints), OpenAlex (250M+ works), and CrossRef (DOI metadata) in parallel " +
			"and combines results. All backends are free and require no API keys.",
		promptSnippet: "Search academic databases for research papers, preprints, and citation metadata",
		promptGuidelines: [
			"Use academic_search for research papers, preprints, citations, DOIs, and academic literature.",
			"Searches arXiv (preprints), OpenAlex (250M+ works), and CrossRef (DOI metadata) simultaneously and combines results.",
			"After finding a paper with a PDF link, use web_fetch to download it, then read_pdf to extract the content.",
			"Use code_search to find code implementations of papers or algorithms.",
		],
		parameters: Type.Object({
			query: Type.String({ description: "The research topic or paper title to search for" }),
			maxResults: Type.Optional(
				Type.Integer({ description: "Max results per backend (default: 5, max: 20)", default: 5, maximum: 20 }),
			),
		}),
		async execute(_toolCallId, params, _signal, _onUpdate, _ctx) {
			const { query, maxResults } = params;
			const numResults = Math.min(maxResults ?? 5, 20);
			const cacheKey = `academic:${query}:${numResults}`;

			const cached = getCached<string>(cacheKey);
			if (cached) {
				return { content: [{ type: "text", text: cached }], details: { query, cached: true } };
			}

			await rateLimit();

			const settled = await Promise.allSettled([
				searchArxiv(query, numResults),
				searchOpenAlex(query, numResults),
				searchCrossref(query, numResults),
			]);

			const sections: string[] = [`## Academic Search Results: "${query}"`, ""];
			const labels = ["arXiv", "OpenAlex", "CrossRef"];

			for (let i = 0; i < settled.length; i++) {
				const r = settled[i];
				const label = labels[i];
				if (r.status === "rejected") {
					sections.push(`### ${label}\n_(error: ${r.reason})_`, "");
				} else if (r.value === null) {
					sections.push(`### ${label}\nNo results found.`, "");
				} else {
					sections.push(`### ${label}`, r.value, "");
				}
			}

			const output = sections.join("\n");

			setCache(cacheKey, output);
			return { content: [{ type: "text", text: output }], details: { query, cached: false } };
		},

		renderResult(result, { expanded, isPartial }, theme, _context) {
			if (isPartial) return new Text(theme.fg("warning", "Searching..."), 0, 0);
			if (result.isError) return new Text(theme.fg("error", "Search failed"), 0, 0);
			const details = result.details as { query?: string } | undefined;
			let text = theme.fg("success", "Academic results");
			if (details?.query) text += theme.fg("accent", ` "${details.query}"`);
			const content = result.content[0]?.type === "text" ? result.content[0].text : "";
			const resultCount = content.split("\n").filter((l) => /^\*\*[^*]/.test(l.trim()) && !l.trim().startsWith("###")).length;
			if (resultCount > 0) text += theme.fg("dim", `, ${resultCount} results`);
			if (expanded) {
				const lines = content.split("\n").slice(0, 25);
				for (const line of lines) text += `\n${theme.fg("dim", line)}`;
				const total = content.split("\n").length;
				if (total > 25) text += `\n${theme.fg("muted", `... ${total - 25} more lines`)}`;
			}
			return new Text(text, 0, 0);
		},
	});

	// ─── code_search ─────────────────────────────────────────────────────────
	pi.registerTool({
		name: "code_search",
		label: "Code Search",
		description:
			"Search GitHub for open-source repositories, libraries, and codebases. " +
			"Returns repo name, URL, stars, language, description, and topics. " +
			"Use when looking for code implementations, tools, or developer resources.",
		promptSnippet: "Search GitHub for code repositories, libraries, and tools",
		promptGuidelines: [
			"Use code_search to find open-source code, libraries, developer tools, and reference implementations.",
			"Include a language or framework name in the query for more relevant results (e.g., 'pdf parser python').",
			"Use web_fetch to download and inspect repository contents from URLs found by code_search.",
		],
		parameters: Type.Object({
			query: Type.String({ description: "Search query (e.g., 'rust web framework', 'pdf parser python')" }),
			maxResults: Type.Optional(
				Type.Integer({ description: "Number of results (default: 5, max: 20)", default: 5, maximum: 20 }),
			),
		}),
		async execute(_toolCallId, params, _signal, _onUpdate, _ctx) {
			const { query, maxResults } = params;
			const numResults = Math.min(maxResults ?? 5, 20);
			const cacheKey = `code:${query}:${numResults}`;

			const cached = getCached<string>(cacheKey);
			if (cached) {
				return { content: [{ type: "text", text: cached }], details: { query, cached: true } };
			}

			await rateLimit();

			try {
				const result = await searchGitHub(query, numResults);
				if (result === null) {
					const msg = `No repositories found on GitHub for "${query}".`;
					setCache(cacheKey, msg);
					return { content: [{ type: "text", text: msg }], details: {} };
				}
				setCache(cacheKey, result);
				return { content: [{ type: "text", text: result }], details: { query, cached: false } };
			} catch (err: unknown) {
				const msg = err instanceof Error ? err.message : String(err);
				return { content: [{ type: "text", text: `GitHub search error: ${msg}` }], isError: true, details: {} };
			}
		},

		renderResult(result, { expanded, isPartial }, theme, _context) {
			if (isPartial) return new Text(theme.fg("warning", "Searching..."), 0, 0);
			if (result.isError) return new Text(theme.fg("error", "Search failed"), 0, 0);
			const details = result.details as { query?: string } | undefined;
			let text = theme.fg("success", "Code search results");
			if (details?.query) text += theme.fg("accent", ` "${details.query}"`);
			const content = result.content[0]?.type === "text" ? result.content[0].text : "";
			const resultCount = content.split("\n").filter((l) => /^\*\*[^*]/.test(l.trim()) && !l.trim().startsWith("###") && !l.trim().startsWith("##")).length;
			if (resultCount > 0) text += theme.fg("dim", `, ${resultCount} results`);
			if (expanded) {
				const lines = content.split("\n").slice(0, 25);
				for (const line of lines) text += `\n${theme.fg("dim", line)}`;
				const total = content.split("\n").length;
				if (total > 25) text += `\n${theme.fg("muted", `... ${total - 25} more lines`)}`;
			}
			return new Text(text, 0, 0);
		},
	});

	// ─── web_fetch ───────────────────────────────────────────────────────────
	pi.registerTool({
		name: "web_fetch",
		label: "Web Fetch",
		description:
			"Download content from a URL. " +
			"For HTML pages returns stripped text content. " +
			"For PDFs and other files, saves to disk and returns the file path " +
			"(use read_pdf afterwards for PDFs). " +
			"Supports arXiv paper pages, GitHub raw content, and general web pages.",
		promptSnippet: "Download content from a URL (HTML text or files)",
		promptGuidelines: [
			"Use web_fetch to download content from URLs found by web_search, academic_search, or code_search.",
			"For PDFs and other files, web_fetch saves the file to /tmp/pi-web-files/ and returns the file path.",
			"After downloading a PDF, use read_pdf to extract its text and math content.",
			"For arXiv papers, use the abstract page URL (arxiv.org/abs/...) or the PDF URL (arxiv.org/pdf/...).",
		],
		parameters: Type.Object({
			url: Type.String({ description: "URL to fetch" }),
		}),
		async execute(_toolCallId, params, _signal, _onUpdate, _ctx) {
			const { url } = params;

			try {
				// Resolve arXiv abstract pages to PDF URLs before fetching
				const arxivAbsMatch = url.match(/arxiv\.org\/abs\/(\d+\.\d+)/);
				const fetchUrl = arxivAbsMatch
					? `https://arxiv.org/pdf/${arxivAbsMatch[1]}.pdf`
					: url;

				const response = await fetch(fetchUrl, {
					headers: { "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36" },
					signal: AbortSignal.timeout(30_000),
				});

				if (!response.ok) {
					throw new Error(`HTTP ${response.status}: ${response.statusText}`);
				}

				const contentType = response.headers.get("content-type") ?? "";

				const isFile =
					url.split("?")[0].endsWith(".pdf") ||
					contentType.startsWith("application/pdf") ||
					contentType.startsWith("application/octet-stream") ||
					contentType.startsWith("image/") ||
					contentType.startsWith("audio/") ||
					contentType.startsWith("video/");

				if (isFile) {
					return await saveFileFromResponse(response, url);
				}

				return await processTextResponse(response, url);
			} catch (err: unknown) {
				const msg = err instanceof Error ? err.message : String(err);
				return {
					content: [{ type: "text", text: `Fetch error: ${msg}` }],
					isError: true,
					details: {},
				};
			}
		},

		renderResult(result, { expanded, isPartial }, theme, _context) {
			if (isPartial) return new Text(theme.fg("warning", "Fetching..."), 0, 0);
			if (result.isError) return new Text(theme.fg("error", "Fetch failed"), 0, 0);
			const details = result.details as { url?: string; length?: number; sizeBytes?: number; path?: string } | undefined;
			const url = details?.url ?? "unknown";
			const size = details?.length ?? details?.sizeBytes ?? 0;
			const sizeStr = size > 1024 ? `${(size / 1024).toFixed(0)}KB` : `${size}B`;
			let text = theme.fg("success", "Fetched");
			text += theme.fg("accent", ` ${url}`);
			text += theme.fg("dim", ` (${sizeStr})`);
			if (expanded) {
				const content = result.content[0]?.type === "text" ? result.content[0].text : "";
				const lines = content.split("\n").slice(0, 30);
				for (const line of lines) text += `\n${theme.fg("dim", line)}`;
				const total = content.split("\n").length;
				if (total > 30) text += `\n${theme.fg("muted", `... ${total - 30} more lines`)}`;
			}
			return new Text(text, 0, 0);
		},
	});
}
