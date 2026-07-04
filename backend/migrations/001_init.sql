-- Schéma de la veille IA quotidienne.
-- Un briefing par jour, avec ses papiers, news et concepts.

CREATE TABLE IF NOT EXISTS briefings (
    id            SERIAL PRIMARY KEY,
    briefing_date DATE NOT NULL UNIQUE,
    generated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    -- Le learning path du jour, stocké tel quel (topic + steps).
    learning_path JSONB,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS papers (
    id           SERIAL PRIMARY KEY,
    briefing_id  INTEGER NOT NULL REFERENCES briefings(id) ON DELETE CASCADE,
    position     INTEGER NOT NULL DEFAULT 0,
    title        TEXT NOT NULL,
    authors      TEXT,
    abstract     TEXT,
    summary_fr   TEXT,          -- résumé français via OpenRouter
    tags         TEXT[] NOT NULL DEFAULT '{}',
    link         TEXT
);

CREATE TABLE IF NOT EXISTS news (
    id           SERIAL PRIMARY KEY,
    briefing_id  INTEGER NOT NULL REFERENCES briefings(id) ON DELETE CASCADE,
    position     INTEGER NOT NULL DEFAULT 0,
    title        TEXT NOT NULL,
    source       TEXT,
    link         TEXT,
    summary_fr   TEXT           -- explication française via OpenRouter
);

CREATE TABLE IF NOT EXISTS concepts (
    id           SERIAL PRIMARY KEY,
    briefing_id  INTEGER NOT NULL REFERENCES briefings(id) ON DELETE CASCADE,
    position     INTEGER NOT NULL DEFAULT 0,
    name         TEXT NOT NULL,
    why          TEXT           -- pourquoi l'apprendre aujourd'hui
);

CREATE INDEX IF NOT EXISTS idx_papers_briefing   ON papers(briefing_id);
CREATE INDEX IF NOT EXISTS idx_news_briefing     ON news(briefing_id);
CREATE INDEX IF NOT EXISTS idx_concepts_briefing ON concepts(briefing_id);
CREATE INDEX IF NOT EXISTS idx_briefings_date    ON briefings(briefing_date DESC);
