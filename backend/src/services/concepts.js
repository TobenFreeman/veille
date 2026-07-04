// Génère les "notions à apprendre" du jour (ML, maths, IA) + un plan d'apprentissage,
// à partir des papiers et news du jour, via OpenRouter.
import { chat } from './openrouter.js';

// Extrait le premier bloc JSON (objet ou tableau) d'une réponse LLM.
function extractJson(text, open, close) {
  if (!text) return null;
  const cleaned = text.replace(/```(?:json)?/gi, '').trim();
  const start = cleaned.indexOf(open);
  const end = cleaned.lastIndexOf(close);
  if (start < 0 || end <= start) return null;
  try {
    return JSON.parse(cleaned.slice(start, end + 1));
  } catch {
    return null;
  }
}

// 3-4 notions clés à apprendre aujourd'hui, chacune avec un "pourquoi".
export async function generateConcepts(papers, news) {
  const paperTitles = papers.slice(0, 5).map((p) => `- ${p.title}`).join('\n');
  const newsTitles = news.slice(0, 3).map((n) => `- ${n.title}`).join('\n');

  const system =
    'Tu es un mentor en IA/ML. À partir de l\'actualité du jour, identifie 3 à 4 notions fondamentales ' +
    '(ML, mathématiques, IA, architectures…) qu\'il serait utile de comprendre aujourd\'hui pour bien saisir ces sujets. ' +
    'Chaque "why" explique en une phrase pourquoi cette notion aide à comprendre le contenu du jour. ' +
    'Réponds UNIQUEMENT en JSON : [{"name":"...","why":"..."}, ...]';
  const user = `Papiers du jour :\n${paperTitles}\n\nActualités :\n${newsTitles}\n\nLes notions à apprendre aujourd'hui ?`;

  const result = await chat(system, user, { maxTokens: 900 });
  const parsed = extractJson(result, '[', ']');
  if (Array.isArray(parsed) && parsed.length) {
    return parsed
      .filter((c) => c && c.name)
      .slice(0, 4)
      .map((c) => ({ name: String(c.name), why: String(c.why ?? '') }));
  }
  return [{
    name: 'Suivre les papiers du jour',
    why: 'Les sujets du moment sont dans la sélection arXiv ci-dessus.',
  }];
}

// Plan d'apprentissage en 3-4 étapes pour la première notion.
export async function generateLearningPath(concepts) {
  if (!concepts?.length) return null;
  const topic = concepts[0].name;

  const system =
    'Tu es un formateur technique francophone. Propose un plan d\'apprentissage progressif en 3 à 4 étapes. ' +
    'Réponds UNIQUEMENT en JSON : {"topic":"...","steps":[{"title":"...","desc":"..."}, ...]}';
  const user = `Plan pour comprendre et maîtriser : ${topic}`;

  const result = await chat(system, user, { maxTokens: 900 });
  const parsed = extractJson(result, '{', '}');
  if (parsed && Array.isArray(parsed.steps) && parsed.steps.length) {
    return {
      topic: String(parsed.topic ?? topic),
      steps: parsed.steps
        .filter((s) => s && s.title)
        .map((s) => ({ title: String(s.title), desc: String(s.desc ?? '') })),
    };
  }
  return null;
}
