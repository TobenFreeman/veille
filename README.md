# Veille IA 🧠

Veille quotidienne en intelligence artificielle, générée chaque matin et publiée sur
**[veille.tobenfreeman.dev](https://veille.tobenfreeman.dev)**.

Chaque jour, la veille rassemble :

- 📄 **Les 5 derniers papiers arXiv** en IA / ML / NLP / IR
- 🌐 **Les 5 dernières actualités IA** (TechCrunch, VentureBeat, MIT Tech Review, Wired, The Decoder)
- 🧠 **Les notions à apprendre du jour** (ML, maths, IA) pour bien comprendre les sujets
- 📚 **Un plan d'apprentissage** progressif sur la notion clé

Papiers et actualités sont **résumés et expliqués en français** via
[OpenRouter](https://openrouter.ai/) (modèle `deepseek/deepseek-chat`), et tout est
**sauvegardé en base PostgreSQL** puis servi par une API.

## Architecture

```
┌──────────────┐   cron 6h    ┌─────────────────────────┐     ┌────────────┐
│ arXiv + RSS  │─────────────▶│  jobs/generate.js       │────▶│ PostgreSQL │
│  (5 + 5)     │              │  fetch → résumé FR (LLM) │     │ briefings  │
└──────────────┘              └─────────────────────────┘     └─────┬──────┘
                                                                     │
        ┌──────────────┐        /api/briefings/*          ┌─────────▼──────┐
        │ React (Vite) │◀───────────────────────────────▶│ Express API    │
        │  front SPA   │                                  │ (Node.js, pg)  │
        └──────────────┘                                  └────────────────┘
```

- **backend/** — API Node.js/Express + `pg`. Récupère les sources, appelle OpenRouter,
  sauvegarde en base, et expose une API REST.
- **frontend/** — SPA React + Vite (page *Aujourd'hui* + *Archives*).
- **deploy/** — units systemd, config nginx, script de déploiement du front.

La génération quotidienne est portée par le job Node (`npm run generate`), déclenché par
un timer systemd (`veille-generate.timer`) chaque matin à 6h.

## API

| Méthode | Route | Description |
|---------|-------|-------------|
| `GET` | `/api/health` | Ping + état BDD |
| `GET` | `/api/briefings/latest` | Le briefing du jour (complet) |
| `GET` | `/api/briefings` | Liste des briefings (métadonnées, pour les archives) |
| `GET` | `/api/briefings/:date` | Un briefing par date (`YYYY-MM-DD`) |
| `POST` | `/api/briefings/generate` | Génération manuelle (header `x-generate-token`) |

## Développement local

```bash
# Backend
cd backend
cp .env.example .env      # remplir DATABASE_URL + OPENROUTER_API_KEY
npm install
npm run migrate           # applique le schéma
npm run generate          # génère un briefing
npm start                 # API sur http://127.0.0.1:3022

# Frontend
cd frontend
npm install
npm run dev               # Vite, proxy /api vers le backend
```

## Base de données

Schéma dans `backend/migrations/` : `briefings` (1 par jour) avec ses `papers`, `news`,
`concepts` liés (cascade), et le `learning_path` en JSONB.

## Déploiement (VPS)

Voir `deploy/` :

- `veille-backend.service` — l'API (port 3022)
- `veille-generate.service` + `.timer` — génération quotidienne à 6h
- `nginx-veille.conf` — sert le build React + reverse-proxy `/api/`
- `deploy-frontend.sh` — build + publication du front

---

Généré chaque matin par **Hermes**, l'assistant personnel « second cerveau ».
