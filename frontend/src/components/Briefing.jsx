import Markdown from './Markdown.jsx';

function formatDate(iso) {
  try {
    return new Date(iso).toLocaleDateString('fr-FR', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    });
  } catch {
    return iso;
  }
}

export default function Briefing({ briefing }) {
  const { date, papers = [], news = [], concepts = [], learning_path } = briefing;

  const stats = [
    { n: papers.length, label: 'papiers arXiv' },
    { n: news.length, label: 'actualités' },
    { n: concepts.length, label: 'notions' },
  ];

  return (
    <article className="briefing">
      <div className="hero">
        <div className="hero-badge">Briefing du jour</div>
        <h1 className="hero-date">{formatDate(date)}</h1>
        <div className="hero-stats">
          {stats.map((s) => (
            <div className="stat" key={s.label}>
              <span className="stat-n">{s.n}</span>
              <span className="stat-l">{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {concepts.length > 0 && (
        <section className="section">
          <h2><span className="ico">🧠</span> Notions à apprendre aujourd'hui</h2>
          <div className="concepts">
            {concepts.map((c, i) => (
              <div className="concept" key={i}>
                <div className="concept-name">{c.name}</div>
                <Markdown className="concept-why">{c.why}</Markdown>
              </div>
            ))}
          </div>
        </section>
      )}

      {papers.length > 0 && (
        <section className="section">
          <h2><span className="ico">📄</span> Papiers arXiv du jour</h2>
          <div className="cards">
            {papers.map((p, i) => (
              <div className="card card--paper" key={i}>
                <h3>{p.title}</h3>
                {p.authors && <div className="meta">{p.authors}</div>}
                <Markdown className="summary">{p.summary_fr || p.abstract}</Markdown>
                <div className="card-foot">
                  <div className="tags">
                    {(p.tags || []).map((t) => <span className="tag" key={t}>{t}</span>)}
                  </div>
                  {p.link && <a className="link" href={p.link} target="_blank" rel="noreferrer">arXiv →</a>}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {news.length > 0 && (
        <section className="section">
          <h2><span className="ico">🌐</span> Actualités IA</h2>
          <div className="cards">
            {news.map((n, i) => (
              <div className="card card--news" key={i}>
                <div className="news-src">{n.source}</div>
                <h3>{n.title}</h3>
                <Markdown className="summary">{n.summary_fr}</Markdown>
                {n.link && <a className="link" href={n.link} target="_blank" rel="noreferrer">Lire l'article →</a>}
              </div>
            ))}
          </div>
        </section>
      )}

      {learning_path?.steps?.length > 0 && (
        <section className="section">
          <h2><span className="ico">📚</span> Plan d'apprentissage</h2>
          <div className="learning-path">
            <h3>{learning_path.topic}</h3>
            <ol>
              {learning_path.steps.map((s, i) => (
                <li key={i}>
                  <strong>{s.title}</strong>
                  {s.desc && <> — {s.desc}</>}
                </li>
              ))}
            </ol>
          </div>
        </section>
      )}
    </article>
  );
}
