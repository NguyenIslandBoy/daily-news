# Daily News

A self-hosted news aggregator that scrapes RSS feeds, classifies articles by topic, computes article relations, and summarizes content via an LLM. Built with Go (backend) and React (frontend).

---

## Stack

| Layer | Tech |
|---|---|
| Backend | Go, Gin, pgx/v5 |
| Frontend | React 19, Vite, Chart.js |
| Database | PostgreSQL (Neon hosted) |
| Scraping | gofeed, robfig/cron |
| Summarization | Groq API (`llama-3.3-70b-versatile`) |
| Migrations | golang-migrate |

---

## Project Structure

```
daily-news/
├── cmd/
│   ├── server/main.go        # HTTP server entrypoint
│   └── migrate/main.go       # Database migration runner
├── internal/
│   ├── api/                  # Gin route handlers + middleware
│   │   ├── articles.go
│   │   ├── topics.go
│   │   ├── sources.go
│   │   ├── stats.go
│   │   ├── router.go
│   │   └── middleware.go
│   ├── config/config.go      # Env var loading with fail-fast validation
│   ├── db/                   # Database layer (pgx/v5 queries)
│   │   ├── db.go
│   │   ├── articles.go
│   │   ├── topics.go
│   │   ├── sources.go
│   │   ├── stats.go
│   │   └── relations.go
│   ├── matcher/              # Keyword-based topic matching
│   │   ├── topic.go
│   │   └── topic_test.go
│   ├── models/               # Domain structs
│   │   ├── article.go
│   │   ├── topic.go
│   │   └── source.go
│   ├── scraper/              # RSS scraping engine
│   │   ├── engine.go
│   │   ├── rss.go
│   │   ├── dedup.go
│   │   └── scheduler.go
│   └── summarizer/           # Groq API summarization
│       └── summarizer.go
├── migrations/               # SQL migration files (001–007)
├── frontend/                 # React + Vite app
│   └── src/
│       ├── App.jsx
│       ├── api.js
│       └── components/
│           ├── ArticleList.jsx
│           ├── ArticleCard.jsx
│           └── StatsPanel.jsx
├── static/                   # Built frontend (served by Gin)
├── Dockerfile
├── docker-compose.yml
└── Makefile
```

---

## Environment Variables

Copy `.env.example` to `.env` and fill in values:

```env
# Application DB connection (pooler URL for pgx pool)
DATABASE_URL=postgres://user:pass@host/db?sslmode=require

# Direct (non-pooler) connection for migrations only
DB_MIGRATE_URL=pgx5://user:pass@host/db?sslmode=require

PORT=8082
API_KEY=your-api-key

# News sources (optional — enhances scraping coverage)
GUARDIAN_API_KEY=
NYT_API_KEY=
REDDIT_CLIENT_ID=
REDDIT_SECRET=

# LLM summarization
GROQ_API_KEY=
```

> **Note:** `DATABASE_URL` uses the pooler hostname. `DB_MIGRATE_URL` must use the **direct** (non-pooler) hostname and the `pgx5://` scheme. These are intentionally different.

---

## Getting Started

### 1. Install dependencies

```bash
go mod download
cd frontend && npm install
```

### 2. Run migrations

```bash
make migrate
```

This runs all migrations in `./migrations/` against `DB_MIGRATE_URL`. Migrations include table creation, indexes, FTS triggers, and seed data (sources + topics).

### 3. Build the frontend

```bash
cd frontend && npm run build
```

The built output goes to `../static/`, which Gin serves directly.

### 4. Run the server

```bash
make run
```

The server starts on the configured `PORT` (default `8081`). On startup it:
- Warms the dedup set from the last 24h of scraped URLs
- Loads topics for the matcher
- Immediately runs one scrape, then every 15 minutes

---

## Makefile Commands

```bash
make run      # go run ./cmd/server
make build    # compile to bin/daily-news.exe
make test     # go test ./...
make migrate  # apply pending migrations
```

---

## API Endpoints

All endpoints are prefixed with `/api`.

### Articles

| Method | Path | Description |
|---|---|---|
| `GET` | `/articles` | List articles. Query params: `topic`, `source`, `q`, `page`, `limit`, `from`, `to` |
| `GET` | `/articles/:id` | Single article + related articles |
| `POST` | `/articles/:id/summarize` | Fetch article text and summarize via Groq |

### Topics

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/topics` | — | List topics with article counts |
| `POST` | `/topics` | — | Create a topic (name + keywords array) |
| `PUT` | `/topics/:id` | `X-API-Key` | Update a topic |
| `DELETE` | `/topics/:id` | `X-API-Key` | Delete a topic |

### Other

| Method | Path | Description |
|---|---|---|
| `GET` | `/sources` | List active sources |
| `GET` | `/stats` | Total articles, by-topic counts, 30-day volume (cached 60s) |
| `GET` | `/health` | DB ping + last scrape timestamp |

---

## How the Scraper Works

1. **Schedule** — Runs immediately on startup, then every 15 minutes via `robfig/cron`.
2. **Topic reload** — Topics are reloaded from the DB on every scrape tick, so newly added topics are picked up without a restart.
3. **Concurrency** — Up to 5 sources are fetched concurrently via a semaphore.
4. **Dedup** — URL hashes are stored in memory. On startup, the last 24h of hashes are warmed from the DB. `INSERT ... ON CONFLICT DO NOTHING` provides DB-level safety.
5. **Topic matching** — Each article title + summary is matched against topic keywords using word-boundary regex (`\bkeyword\b`). Short keywords (≤3 chars) also match as uppercase suffixes (e.g. `AI` in `OpenAI`).
6. **Relations** — After each insert, candidate related articles are found by: same author, same source+topic, or full-text search overlap. Relations are stored in `article_relations`.

---

## Database Schema

| Table | Purpose |
|---|---|
| `topics` | id, name, keywords[] |
| `sources` | id, name, url, feed_url, type, category, active, last_scraped_at |
| `articles` | id, url, url_hash, title, summary, author, published_at, source_id, topic_id, category, image_url, search_vector |
| `article_relations` | article_id, related_id (bidirectional junction table) |

Full-text search is handled via a `tsvector` column on `articles`, populated by a `BEFORE INSERT OR UPDATE` trigger.

---

## Summarization

`POST /api/articles/:id/summarize`:

1. Fetches the article URL (strips scripts, styles, and HTML tags)
2. Truncates to 2000 words
3. Sends to Groq `llama-3.3-70b-versatile`
4. Falls back to the existing RSS summary if the page can't be fetched or yields < 100 words

Groq rate limits (429) and payload limits (413) are handled gracefully with user-facing error messages.

---

## Frontend

The React app is served from `./static/` by Gin. During development, Vite proxies `/api` to `localhost:8082`.

```bash
cd frontend
npm run dev     # dev server with HMR at localhost:5173
npm run build   # production build → ../static/
```

**Key features:**
- Dark/light theme toggle
- Filter by topic and/or source
- Full-text search (debounced 300ms)
- AI Summary button per article (calls Groq)
- Related articles toggle (loaded on demand)
- Add Topic modal (no auth required — personal tool)
- Stats panel: donut chart by topic, 30-day line chart

---

## Docker

```bash
# Build image
docker build -t daily-news .

# Run with env vars
docker run -p 8082:8082 --env-file .env daily-news
```

The `docker-compose.yml` spins up a local PostgreSQL instance on port `5435` for development.

---

## Notes

- `Reuters Technology` feed is currently disabled (dead URL).
- arXiv author strings can be very long — they are truncated to 500 chars before insert.
- HN "Comments" summaries are stripped (`>Comments</a>` pattern).
- The Neon pooler connection requires `SET search_path TO public` via `AfterConnect` — this is handled in `internal/db/db.go`.
- `DB_MIGRATE_URL` must not use the pooler hostname; migrations require a direct connection.
