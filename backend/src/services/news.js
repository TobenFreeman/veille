// Récupère les dernières actualités IA depuis plusieurs flux RSS/Atom,
// fusionne et garde les plus récentes.
import { XMLParser } from 'fast-xml-parser';

// Sources RSS IA fiables et bien maintenues.
const SOURCES = [
  { url: 'https://techcrunch.com/category/artificial-intelligence/feed/', name: 'TechCrunch' },
  { url: 'https://venturebeat.com/category/ai/feed/', name: 'VentureBeat' },
  { url: 'https://www.technologyreview.com/topic/artificial-intelligence/feed', name: 'MIT Tech Review' },
  { url: 'https://www.wired.com/feed/tag/ai/latest/rss', name: 'Wired' },
  { url: 'https://the-decoder.com/feed/', name: 'The Decoder' },
];

const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_' });

const asArray = (x) => (x == null ? [] : Array.isArray(x) ? x : [x]);

// Décode les entités HTML courantes (nommées + numériques) présentes dans les flux RSS.
function decodeEntities(s) {
  const named = {
    amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ',
    laquo: '«', raquo: '»', hellip: '…', mdash: '—', ndash: '–',
    rsquo: '’', lsquo: '‘', ldquo: '“', rdquo: '”', eacute: 'é', egrave: 'è',
  };
  return String(s)
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(parseInt(d, 10)))
    .replace(/&([a-z]+);/gi, (m, name) => named[name] ?? named[name.toLowerCase()] ?? m);
}

function text(node) {
  if (node == null) return '';
  if (typeof node === 'string') return node;
  if (typeof node === 'object') return node['#text'] ?? node['@_href'] ?? '';
  return String(node);
}

function stripHtml(s) {
  return decodeEntities(String(s).replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
}

function parseFeed(xml, sourceName) {
  const doc = parser.parse(xml);
  const channel = doc?.rss?.channel;
  const items = channel ? asArray(channel.item) : asArray(doc?.feed?.entry); // RSS ou Atom

  return items.map((it) => {
    const title = stripHtml(text(it.title));
    let link = '';
    if (it.link) {
      const links = asArray(it.link);
      // Atom : plusieurs <link>, prendre rel=alternate ou le premier href.
      const alt = links.find((l) => l?.['@_rel'] === 'alternate') || links[0];
      link = typeof alt === 'string' ? alt : alt?.['@_href'] ?? '';
    }
    if (!link && it.guid) link = text(it.guid);
    const rawSummary = stripHtml(text(it.description ?? it.summary ?? it['content:encoded'] ?? it.content));
    const dateStr = it.pubDate ?? it.published ?? it.updated ?? null;
    const ts = dateStr ? Date.parse(dateStr) : NaN;
    return {
      title,
      link,
      source: sourceName,
      content: rawSummary.slice(0, 1500),
      ts: Number.isNaN(ts) ? 0 : ts,
    };
  }).filter((n) => n.title);
}

// Renvoie les `count` actualités les plus récentes, tous flux confondus.
export async function fetchNews(count = 5) {
  const results = await Promise.allSettled(
    SOURCES.map(async (src) => {
      const res = await fetch(src.url, {
        headers: { 'User-Agent': 'VeilleIA/1.0 (veille.tobenfreeman.dev)' },
        signal: AbortSignal.timeout(15_000),
      });
      if (!res.ok) throw new Error(`${src.name} HTTP ${res.status}`);
      return parseFeed(await res.text(), src.name);
    })
  );

  const all = [];
  for (const r of results) {
    if (r.status === 'fulfilled') all.push(...r.value.slice(0, 6));
    else console.warn('  ⚠️ flux news échoué:', r.reason?.message);
  }

  // Dédoublonnage par titre, puis tri par date décroissante.
  const seen = new Set();
  const unique = all.filter((n) => {
    const key = n.title.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  unique.sort((a, b) => b.ts - a.ts);

  // Diversité : au plus 2 news par source, en gardant l'ordre chronologique.
  const perSource = new Map();
  const picked = [];
  for (const n of unique) {
    const c = perSource.get(n.source) ?? 0;
    if (c >= 2) continue;
    perSource.set(n.source, c + 1);
    picked.push(n);
    if (picked.length >= count) break;
  }
  // Complète si on n'a pas atteint `count` (peu de sources dispo).
  if (picked.length < count) {
    for (const n of unique) {
      if (picked.includes(n)) continue;
      picked.push(n);
      if (picked.length >= count) break;
    }
  }
  return picked.slice(0, count);
}
