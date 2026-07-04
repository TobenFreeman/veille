# CLAUDE.md — backend

API Node/Express + `pg` et générateur du briefing. ESM, Node 24, `fetch` natif.

## Organisation

- `src/server.js` — app Express, monte `/api/briefings`, `/api/health`, écoute sur `127.0.0.1:PORT`.
- `src/routes/briefings.js` — routes REST (voir plus bas).
- `src/db/`
  - `pool.js` — pool `pg` depuis `DATABASE_URL` (échoue si absent).
  - `migrate.js` — applique `migrations/*.sql` dans l'ordre, trace dans `_migrations` (idempotent).
  - `briefings.js` — accès données : `getLatestBriefing`, `getBriefingByDate`, `listBriefings`,
    `saveBriefing` (transaction, DELETE+INSERT par date).
- `src/services/`
  - `arxiv.js` — `fetchArxiv(count)`, parse le flux Atom arXiv (`fast-xml-parser`).
  - `news.js` — `fetchNews(count)`, agrège plusieurs RSS/Atom, décode les entités HTML,
    dédoublonne, trie par date, **max 2 par source**. Liste des sources en haut du fichier.
  - `openrouter.js` — `chat()`, `summarizePaper()`, `explainNews()`. Modèle via `OPENROUTER_MODEL`.
  - `concepts.js` — `generateConcepts()` + `generateLearningPath()` (LLM → JSON, prompts FR).
- `src/jobs/generate.js` — orchestre fetch → résumé (concurrence limitée via `mapLimit`) →
  concepts → save. Exécutable en CLI (`npm run generate`) et exporté (`generateBriefing`).

## API

| Méthode | Route | Notes |
|---|---|---|
| GET | `/api/health` | ping + `SELECT 1` |
| GET | `/api/briefings/latest` | briefing complet le plus récent |
| GET | `/api/briefings` | liste (métadonnées) pour les archives |
| GET | `/api/briefings/:date` | par date `YYYY-MM-DD` (valide le format) |
| POST | `/api/briefings/generate` | header `x-generate-token` == `GENERATE_TOKEN` |

⚠️ Dans le routeur, `POST /generate` doit rester **avant** `GET /:date` (sinon capté par le param).

## Env (`.env`, non commité — cf `.env.example`)

`DATABASE_URL`, `PORT` (3022), `OPENROUTER_API_KEY`, `OPENROUTER_MODEL` (`deepseek/deepseek-chat`),
`GENERATE_TOKEN`.

## Conventions

- Chaque appel réseau a un timeout (`AbortSignal.timeout`) et échoue proprement (le job
  continue même si une source tombe : `Promise.allSettled`, `.catch` qui renvoie `[]`).
- Ne pas fabuler : si OpenRouter renvoie vide, `summary` reste vide (le front retombe sur l'abstract).
- Les prompts qui renvoient du JSON doivent **exiger le français** explicitement.
- Ajouter une source news = éditer le tableau `SOURCES` dans `services/news.js` (vérifier que le
  flux renvoie bien des items avant de l'ajouter).
- Changement de schéma = **nouvelle** migration `migrations/00N_*.sql` (ne pas éditer une migration
  déjà appliquée), puis `npm run migrate`.
