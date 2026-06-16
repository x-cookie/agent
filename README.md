<div align="center">

<img src="public/logo-agent.png" alt="agent logo" width="72" height="72" />

# agent

**14-lesson Node.js course portal for building AI agents from first principles.**

![version](https://img.shields.io/badge/version-1.0.0-black?style=flat-square)
![license](https://img.shields.io/badge/license-MIT-green?style=flat-square)
![lessons](https://img.shields.io/badge/lessons-14-0031FF?style=flat-square)
![stages](https://img.shields.io/badge/stages-3-8259EF?style=flat-square)
![runtime](https://img.shields.io/badge/runtime-Node.js-16a34a?style=flat-square)

[https://x.com/agentlearnsite](https://x.com/agentlearnsite)

`CA: A4qQ4Rk42S4smtxD2fGGSFLxsoMPykDtQJXuioTMpump`

</div>

A full-stack learning portal for [AI Agents from Scratch](https://github.com/pguso/ai-agents-from-scratch). Each lesson covers one foundational agent pattern — model loading, function calling, memory, ReAct, DAG planning, tree/graph/chain of thought — with an embedded AI tutor backed by Claude.

---

## What it does

- **Skill tree roadmap** — Visual node graph of all 14 lessons grouped into 3 stages. Click any node to jump directly into that lesson.
- **Per-lesson chat tutor** — Server-side Claude integration answers questions in the context of each lesson. API key never touches the browser.
- **GitHub content sync** — Lesson concept and code content is fetched from the upstream repo at build time (ISR, 1-hour revalidation). No manual copy-paste, no stale content.
- **4 pages** — Landing, Branch (roadmap), Chat (per-lesson tutor), Docs (technical reference)

---

## Key features

| Feature | Detail |
|---|---|
| 14 lessons | 3 stages: Fundamentals → Agent patterns → Advanced reasoning |
| AI tutor | Claude Sonnet, server-side only via `/api/tutor` route |
| ISR content | GitHub raw API, `revalidate: 3600` — stays in sync automatically |
| Vercel dark design | Locked token system: `--bg`, `--bd`, `--purple`, `--green` — no deviations |
| Geist fonts | Geist Sans (prose) + Geist Mono (labels, code, breadcrumbs) |

---

## Stages

```mermaid
graph LR
    root["AI Agents from Scratch"] --> S1["Stage 01 — Fundamentals\n6 lessons"]
    root --> S2["Stage 02 — Agent patterns\n4 lessons"]
    root --> S3["Stage 03 — Advanced reasoning\n4 lessons"]
    S1 --> L1["01 Introduction"]
    S1 --> L2["02 OpenAI intro"]
    S1 --> L3["03 Translation"]
    S1 --> L4["04 Think"]
    S1 --> L5["05 Batch"]
    S1 --> L6["06 Streaming"]
    S2 --> L7["07 Simple agent"]
    S2 --> L8["08 Memory agent"]
    S2 --> L9["09 ReAct agent"]
    S2 --> L10["10 AoT agent"]
    S3 --> L11["11 Error handling"]
    S3 --> L12["12 Tree of thought"]
    S3 --> L13["13 Graph of thought"]
    S3 --> L14["14 Chain of thought"]
```

---

## Architecture

```mermaid
graph TD
    Browser["Browser"] --> Landing["/  Landing page"]
    Browser --> Branch["/learn  Skill tree"]
    Branch --> Chat["/learn/[id]  Lesson + tutor"]
    Chat --> API["/api/tutor  Server route"]
    API --> Claude["Anthropic SDK\nclaude-sonnet-4-20250514"]
    Chat --> GH["GitHub raw API\nCONCEPT.md + CODE.md"]
    Branch --> Docs["/docs  Reference"]
```

---

## Quick start

```bash
git clone https://github.com/muaddib14/ai-agents-from-scratch
cd ai-agents-from-scratch
npm install

# Add your Anthropic API key
echo "ANTHROPIC_API_KEY=sk-ant-..." > .env.local

npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Project structure

```
src/
├── app/
│   ├── page.tsx                  ← Landing (/)
│   ├── learn/
│   │   ├── page.tsx              ← Branch — skill tree (/learn)
│   │   └── [id]/page.tsx         ← Chat — lesson + tutor (/learn/[id])
│   ├── docs/page.tsx             ← Technical reference (/docs)
│   └── api/tutor/route.ts        ← Server-side Anthropic route
├── components/
│   ├── shared/TopNav.tsx         ← Navigation bar
│   └── chat/ChatPanel.tsx        ← AI tutor client component
└── lib/
    ├── lessons.ts                ← Lesson metadata + GitHub fetch
    └── tutor.ts                  ← System prompt builder
```

---

## Configuration

| Variable | Description |
|---|---|
| `ANTHROPIC_API_KEY` | Required. Anthropic API key for the tutor route. |

The API key lives in `.env.local` only. It is never bundled into client code.

---

## Lesson map

| # | Title | Tag | Stage |
|---|---|---|---|
| 01 | Introduction | basic llm | Fundamentals |
| 02 | OpenAI intro | hosted llms | Fundamentals |
| 03 | Translation | system prompts | Fundamentals |
| 04 | Think | reasoning | Fundamentals |
| 05 | Batch | parallelism | Fundamentals |
| 06 | Streaming | response control | Fundamentals |
| 07 | Simple agent | function calling | Agent patterns |
| 08 | Memory agent | persistent state | Agent patterns |
| 09 | ReAct agent | reason + act | Agent patterns |
| 10 | AoT agent | atomic planning | Agent patterns |
| 11 | Error handling | resilience | Advanced reasoning |
| 12 | Tree of thought | beam search | Advanced reasoning |
| 13 | Graph of thought | dag merge | Advanced reasoning |
| 14 | Chain of thought | auditable reasoning | Advanced reasoning |

---

## Deployment

### Vercel (recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

Set `OPENROUTER_API_KEY` in your Vercel project's Environment Variables dashboard.

### Self-hosted (Node.js)

```bash
npm run build
npm start          # runs on port 3000 by default
```

Requires Node.js 18+. Set `OPENROUTER_API_KEY` in your environment before starting.

### Environment variables

| Variable | Required | Description |
|---|---|---|
| `OPENROUTER_API_KEY` | Yes | OpenRouter API key for the AI tutor route |

---

## Contributing

1. Fork the repo and clone it locally
2. Create a branch: `git checkout -b feature/your-feature`
3. Make your changes with conventional commits: `feat(scope): description`
4. Run tests: `npm test`
5. Open a pull request against `main`

Commit types: `feat`, `fix`, `refactor`, `docs`, `test`, `chore`, `ci`

---

## License

MIT
