# pi-internet-search

Internet search tools for [pi](https://github.com/earendil-works/pi-coding-agent):

| Tool | Purpose |
|---|---|
| `internet_search` | Web search (Exa → Tavily → Brave → DuckDuckGo fallback chain) |
| `academic_search` | Academic paper search (arXiv + OpenAlex + CrossRef, no keys needed) |
| `code_search` | GitHub repository search (no key needed) |
| `web_fetch` | Fetch a URL (HTML→text, files→disk for PDF processing) |

## Install

```bash
pi install npm:pi-internet-search   # once published to npm
```

From a local checkout, install the runtime dependency first (pi does not modify
local packages). Use `--omit=peer` — the `peerDependencies` are provided by pi
itself at runtime and must not be bundled as physical copies:

```bash
(cd packages/internet-search && npm install --omit=peer)
pi install ./packages/internet-search
```

## Configuration

API keys live in `~/.pi/agent/internet-search.json`; environment variables take precedence:

```json
{
  "tavilyApiKey": "tvly-...",
  "braveApiKey": "BSA...",
  "proxy": "http://127.0.0.1:10808"
}
```

- `proxy` — optional global proxy for all requests; an empty string forces direct
  connections. Without it, `HTTP_PROXY`/`HTTPS_PROXY`/`ALL_PROXY` (any letter
  case) are honored; `NO_PROXY` and loopback hosts are never proxied. Only
  `http(s)://` proxy URLs are supported. Behavior is identical in every Node
  mode (no `NODE_USE_ENV_PROXY` needed).
- Env vars `TAVILY_API_KEY`, `BRAVE_API_KEY`, `EXA_API_KEY` override the config
  keys.

Without keys, `internet_search` falls back to free Exa and DuckDuckGo, so the
package works unconfigured.
