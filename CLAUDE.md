# CLAUDE.md — Veille IA

Guide pour travailler dans ce dépôt. Voir aussi `backend/CLAUDE.md` et `frontend/CLAUDE.md`.

## Ce que c'est

Veille IA quotidienne, en ligne sur **https://veille.tobenfreeman.dev**. Chaque matin, un job :
1. récupère **5 papiers arXiv** (cs.AI/LG/CL/IR) + **5 actualités IA** (RSS multi-sources),
2. les **résume/explique en français via OpenRouter**,
3. génère les **notions à apprendre** du jour + un **plan d'apprentissage**,
4. **sauvegarde le tout en PostgreSQL**.

Le front React lit une API Node/Express qui sert les briefings depuis la base.

## Structure

- `backend/` — API Node/Express + `pg`, services de récupération/résumé, job de génération.
- `frontend/` — SPA React + Vite (page *Aujourd'hui* + *Archives*).
- `deploy/` — units systemd, config nginx, script de déploiement du front.

## Stack & conventions

- **Node ESM** partout (`"type": "module"`). Node 24, `fetch` natif (pas d'axios).
- **Français** pour l'UI, les commentaires et les prompts LLM. Code en anglais.
- Pas de framework lourd : Express + `pg` côté serveur, React + Vite + `react-router-dom` côté client.
- Secrets **jamais commités** : `backend/.env` est gitignoré (voir `backend/.env.example`).

## Commandes clés

```bash
# Backend (depuis backend/)
npm run migrate      # applique les migrations SQL
npm run generate     # génère le briefing du jour → BDD
npm start            # API sur 127.0.0.1:3022

# Frontend (depuis frontend/)
npm run dev          # Vite + proxy /api → backend
npm run build        # build de prod dans dist/

# Déploiement front sur le VPS
bash deploy/deploy-frontend.sh
```

## Déploiement (VPS)

- API = service systemd **`veille-backend`** (port 3022).
- Génération quotidienne = **`veille-generate.timer`** (6h) → `veille-generate.service`.
  Régénérer à la main : `sudo systemctl start veille-generate.service`.
- nginx sert le build React (`/var/www/veille`) + reverse-proxy `/api/` → 3022.
- Après modif d'un `deploy/*.service|*.timer`, recopier dans `/etc/systemd/system/` puis
  `sudo systemctl daemon-reload`. Après modif `deploy/nginx-veille.conf`, recopier dans
  `/etc/nginx/sites-available/veille`, `sudo nginx -t`, `sudo systemctl reload nginx`.

## Pièges à connaître

- **nginx `listen 51.210.243.211:443`** (IP publique précise, pas `listen 443` wildcard) :
  tailscaled tient déjà le 443 ailleurs, un wildcard échoue en EADDRINUSE.
- **`index.html` en `no-cache`** dans nginx : ne pas remettre en cache, sinon les déploiements
  ne sont pas pris en compte (le navigateur resert d'anciens assets).
- **Prompts LLM** : forcer explicitement le français dans les prompts qui renvoient du JSON
  (notions, learning path), sinon le modèle répond en anglais.
- **PostgreSQL** : base `veille` sur le Postgres partagé Docker du VPS (conteneur `postgres`).
  Un briefing par date (contrainte unique) ; régénérer écrase la journée (DELETE + INSERT).

## Vérifier une modif

Après un changement, régénérer un briefing (`npm run generate`), interroger l'API
(`curl localhost:3022/api/briefings/latest`), et pour le front, `npm run build` +
capture d'écran de la page. Toujours vérifier le rendu **mobile ET desktop**.
