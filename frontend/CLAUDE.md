# CLAUDE.md — frontend

SPA React + Vite. Consomme l'API du backend (même origine → chemins relatifs `/api`).

## Organisation

- `src/main.jsx` — routes (`react-router-dom`) : `/` (Today), `/archives`, `/jour/:date`.
- `src/App.jsx` — layout : header (logo + nav) + `<Outlet/>` + footer.
- `src/api.js` — client fetch minimal : `getLatest`, `getByDate`, `listBriefings`.
- `src/pages/` — `Today.jsx`, `Archive.jsx`, `BriefingByDate.jsx` (chacun gère loading/erreur/404).
- `src/components/`
  - `Briefing.jsx` — rendu d'un briefing : héro (date + compteurs), notions, papiers, news, learning path.
  - `Markdown.jsx` — rend le markdown des résumés via `marked` (source = notre propre LLM).
- `src/styles.css` — **tout le style** (pas de CSS-in-JS, pas de lib UI).

## Style / design

- **Thème clair uniquement** (`color-scheme: light`, pas de media `prefers-color-scheme: dark`).
- Polices : **Inter** (texte) + **Space Grotesk** (titres), chargées via Google Fonts dans `index.html`.
- Palette dégradée indigo→violet→rose (variables `--indigo/--violet/--pink/--grad` dans `:root`).
- **Responsive obligatoire** : unités fluides (`clamp`), grilles qui passent de 1 col (mobile) à
  2 col (desktop, `@media (min-width: 680px)`), `overflow-x: hidden` sur `body`,
  `overflow-wrap: anywhere` sur les contenus longs. Toujours tester **mobile ET desktop**.

## Dev / build

```bash
npm run dev     # Vite, proxy /api → 127.0.0.1:3022 (cf vite.config.js)
npm run build   # dist/ (assets hashés)
```

Déploiement : `bash ../deploy/deploy-frontend.sh` (build + rsync vers `/var/www/veille`).
`index.html` est servi en `no-cache` par nginx — les assets hashés en cache long.

## Vérifier une modif visuelle

`npm run build`, déployer, puis **capture d'écran** de la page à ≥2 largeurs (ex. 390px et 1200px)
pour confirmer le rendu responsive avant de conclure.
