// Génère la veille du jour : fetch arXiv + news, résumés FR via OpenRouter,
// notions à apprendre + learning path, puis sauvegarde en base.
import 'dotenv/config';
import { fetchArxiv } from '../services/arxiv.js';
import { fetchNews } from '../services/news.js';
import { summarizePaper, explainNews } from '../services/openrouter.js';
import { generateConcepts, generateLearningPath } from '../services/concepts.js';
import { saveBriefing } from '../db/briefings.js';
import { pool } from '../db/pool.js';

// Limite la concurrence des appels LLM pour rester gentil avec l'API.
async function mapLimit(items, limit, fn) {
  const out = new Array(items.length);
  let i = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (i < items.length) {
      const idx = i++;
      out[idx] = await fn(items[idx], idx);
    }
  });
  await Promise.all(workers);
  return out;
}

export async function generateBriefing({ date } = {}) {
  const today = date || new Date().toISOString().slice(0, 10);
  console.log(`📡 Génération de la veille — ${today}`);

  console.log('  📄 arXiv…');
  const papers = await fetchArxiv(5).catch((e) => {
    console.warn('  ⚠️ arXiv échoué:', e.message);
    return [];
  });
  console.log(`    → ${papers.length} papiers`);

  console.log('  📰 News…');
  const news = await fetchNews(5).catch((e) => {
    console.warn('  ⚠️ news échoué:', e.message);
    return [];
  });
  console.log(`    → ${news.length} news`);

  console.log('  🤖 Résumés des papiers (FR)…');
  await mapLimit(papers, 3, async (p) => {
    p.summary = await summarizePaper(p.title, p.abstract);
  });

  console.log('  🤖 Explications des news (FR)…');
  await mapLimit(news, 3, async (n) => {
    n.summary = await explainNews(n.title, n.content);
  });

  console.log('  🧠 Notions à apprendre…');
  const concepts = await generateConcepts(papers, news);
  console.log(`    → ${concepts.length} notions`);

  console.log('  📚 Learning path…');
  const learningPath = await generateLearningPath(concepts);

  const id = await saveBriefing({
    date: today,
    papers,
    news,
    concepts,
    learning_path: learningPath,
  });

  console.log('─'.repeat(48));
  console.log(`✅ Briefing #${id} sauvegardé (${today})`);
  console.log(`   ${papers.length} papiers · ${news.length} news · ${concepts.length} notions · ` +
    `learning path: ${learningPath?.topic ?? 'aucun'}`);
  return { date: today, papers: papers.length, news: news.length, concepts: concepts.length };
}

// Exécution directe en CLI (cron) : `node src/jobs/generate.js`
if (import.meta.url === `file://${process.argv[1]}`) {
  generateBriefing()
    .then(() => pool.end())
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('❌ Génération échouée :', err);
      process.exit(1);
    });
}
