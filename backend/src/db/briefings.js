// Accès aux données des briefings (lecture + écriture transactionnelle).
import { pool, query } from './pool.js';

// Récupère un briefing complet (papiers, news, concepts) par date, ou null.
export async function getBriefingByDate(date) {
  const { rows } = await query(
    'SELECT * FROM briefings WHERE briefing_date = $1',
    [date]
  );
  if (rows.length === 0) return null;
  return hydrate(rows[0]);
}

// Récupère le briefing le plus récent, ou null.
export async function getLatestBriefing() {
  const { rows } = await query(
    'SELECT * FROM briefings ORDER BY briefing_date DESC LIMIT 1'
  );
  if (rows.length === 0) return null;
  return hydrate(rows[0]);
}

// Liste des briefings (métadonnées + compteurs), du plus récent au plus ancien.
export async function listBriefings(limit = 60) {
  const { rows } = await query(
    `SELECT b.briefing_date, b.generated_at, b.learning_path,
            (SELECT count(*) FROM papers p   WHERE p.briefing_id = b.id) AS paper_count,
            (SELECT count(*) FROM news n     WHERE n.briefing_id = b.id) AS news_count,
            (SELECT count(*) FROM concepts c WHERE c.briefing_id = b.id) AS concept_count,
            (SELECT coalesce(array_agg(DISTINCT t), '{}')
               FROM papers p, unnest(p.tags) t WHERE p.briefing_id = b.id) AS tags
       FROM briefings b
      ORDER BY b.briefing_date DESC
      LIMIT $1`,
    [limit]
  );
  return rows.map((r) => ({
    date: r.briefing_date,
    generated_at: r.generated_at,
    topic: r.learning_path?.topic ?? null,
    papers: Number(r.paper_count),
    news: Number(r.news_count),
    concepts: Number(r.concept_count),
    tags: r.tags,
  }));
}

async function hydrate(b) {
  const [papers, news, concepts] = await Promise.all([
    query('SELECT title, authors, abstract, summary_fr, tags, link FROM papers WHERE briefing_id = $1 ORDER BY position', [b.id]),
    query('SELECT title, source, link, summary_fr FROM news WHERE briefing_id = $1 ORDER BY position', [b.id]),
    query('SELECT name, why FROM concepts WHERE briefing_id = $1 ORDER BY position', [b.id]),
  ]);
  return {
    date: b.briefing_date,
    generated_at: b.generated_at,
    learning_path: b.learning_path,
    papers: papers.rows,
    news: news.rows,
    concepts: concepts.rows,
  };
}

// Insère (ou remplace) un briefing complet dans une transaction.
// data = { date, papers[], news[], concepts[], learning_path }
export async function saveBriefing(data) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Un seul briefing par date : on écrase l'existant (les enfants suivent via CASCADE).
    await client.query('DELETE FROM briefings WHERE briefing_date = $1', [data.date]);

    const { rows } = await client.query(
      'INSERT INTO briefings (briefing_date, learning_path) VALUES ($1, $2) RETURNING id',
      [data.date, data.learning_path ?? null]
    );
    const briefingId = rows[0].id;

    for (const [i, p] of (data.papers ?? []).entries()) {
      await client.query(
        `INSERT INTO papers (briefing_id, position, title, authors, abstract, summary_fr, tags, link)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [briefingId, i, p.title, p.authors ?? null, p.abstract ?? null, p.summary ?? null, p.tags ?? [], p.link ?? null]
      );
    }
    for (const [i, n] of (data.news ?? []).entries()) {
      await client.query(
        `INSERT INTO news (briefing_id, position, title, source, link, summary_fr)
         VALUES ($1,$2,$3,$4,$5,$6)`,
        [briefingId, i, n.title, n.source ?? null, n.link ?? null, n.summary ?? null]
      );
    }
    for (const [i, c] of (data.concepts ?? []).entries()) {
      await client.query(
        `INSERT INTO concepts (briefing_id, position, name, why)
         VALUES ($1,$2,$3,$4)`,
        [briefingId, i, c.name, c.why ?? null]
      );
    }

    await client.query('COMMIT');
    return briefingId;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
