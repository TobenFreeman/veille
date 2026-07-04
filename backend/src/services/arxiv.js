// Récupère les derniers papiers arXiv en IA / ML / NLP / IR.
import { XMLParser } from 'fast-xml-parser';

const CATEGORIES = 'cat:cs.AI+OR+cat:cs.LG+OR+cat:cs.CL+OR+cat:cs.IR';

const CAT_LABELS = {
  'cs.AI': 'AI', 'cs.LG': 'ML', 'cs.CL': 'NLP', 'cs.CV': 'CV',
  'cs.IR': 'IR', 'stat.ML': 'ML', 'cs.NE': 'Neuro', 'cs.RO': 'Robotics',
  'cs.MA': 'Multi-Agent', 'cs.SE': 'SE', 'cs.DB': 'DB',
};

const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_' });

function asArray(x) {
  if (x === undefined || x === null) return [];
  return Array.isArray(x) ? x : [x];
}

function clean(s) {
  return String(s ?? '').replace(/\s+/g, ' ').trim();
}

// Renvoie les `count` papiers les plus récents.
export async function fetchArxiv(count = 5) {
  const url =
    'https://export.arxiv.org/api/query?' +
    `search_query=${CATEGORIES}&sortBy=submittedDate&sortOrder=descending&max_results=${count * 3}`;

  const res = await fetch(url, {
    headers: { 'User-Agent': 'VeilleIA/1.0 (veille.tobenfreeman.dev)' },
    signal: AbortSignal.timeout(30_000),
  });
  if (!res.ok) throw new Error(`arXiv HTTP ${res.status}`);
  const xml = await res.text();
  const feed = parser.parse(xml)?.feed;
  const entries = asArray(feed?.entry);

  const papers = [];
  for (const e of entries) {
    const title = clean(e.title);
    const abstract = clean(e.summary);
    const link = clean(e.id);
    if (title.length < 10 || !abstract || !link) continue;

    const authorNames = asArray(e.author).map((a) => clean(a.name)).filter(Boolean);
    let authors = authorNames.slice(0, 4).join(', ');
    if (authorNames.length > 4) authors += ' et al.';

    const terms = asArray(e.category).map((c) => c['@_term']).filter(Boolean);
    const tags = [...new Set(terms.map((t) => CAT_LABELS[t]).filter(Boolean))];

    papers.push({ title, authors, abstract, tags: tags.length ? tags : ['ML'], link });
    if (papers.length >= count) break;
  }
  return papers;
}
