// Appels OpenRouter pour expliquer / résumer / structurer en français.
import 'dotenv/config';

const API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const MODEL = process.env.OPENROUTER_MODEL || 'deepseek/deepseek-chat';

function apiKey() {
  const k = process.env.OPENROUTER_API_KEY;
  if (!k) throw new Error('OPENROUTER_API_KEY manquant dans l\'environnement');
  return k;
}

// Appel chat brut avec retry. Renvoie le texte, ou null en cas d'échec.
export async function chat(system, user, { maxTokens = 1024, temperature = 0.3, retries = 3 } = {}) {
  const body = JSON.stringify({
    model: MODEL,
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
    max_tokens: maxTokens,
    temperature,
  });

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey()}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://veille.tobenfreeman.dev',
          'X-Title': 'Veille IA',
        },
        body,
        signal: AbortSignal.timeout(90_000),
      });
      const data = await res.json();
      if (data.error) {
        console.warn('  ⚠️ OpenRouter error:', data.error?.message || data.error);
        await sleep(2000);
        continue;
      }
      const text = data.choices?.[0]?.message?.content?.trim();
      if (text && text.length > 10) return text;
    } catch (err) {
      console.warn(`  ⚠️ OpenRouter échec (essai ${attempt + 1}/${retries}):`, err.message);
      await sleep(2000);
    }
  }
  return null;
}

// Résume un papier de recherche en français (markdown). 3-4 phrases + pourquoi c'est intéressant.
export async function summarizePaper(title, abstract) {
  if (!abstract?.trim()) return null;
  const system =
    "Tu es un expert IA qui résume des papiers de recherche en français clair, pour quelqu'un qui apprend le ML. " +
    "Écris 3 à 4 phrases accessibles, puis termine par une ligne **Pourquoi c'est intéressant :** suivie d'une phrase. " +
    'Réponds en markdown, sans titre.';
  const user = `**Titre :** ${title}\n\n**Résumé (anglais) :** ${abstract.slice(0, 2000)}`;
  return chat(system, user, { maxTokens: 700 });
}

// Explique une actualité IA en français (markdown). 2-4 phrases.
export async function explainNews(title, content) {
  const system =
    'Tu es un journaliste tech francophone. Explique cette actualité IA en 2 à 4 phrases claires en français, ' +
    'en disant pourquoi ça compte. Réponds en markdown, sans titre.';
  const user = `**Titre :** ${title}${content ? `\n\n**Contenu :** ${content.slice(0, 1500)}` : ''}`;
  return chat(system, user, { maxTokens: 500 });
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
