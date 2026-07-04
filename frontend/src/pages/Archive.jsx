import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listBriefings } from '../api.js';

function formatDate(iso) {
  try {
    return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  } catch {
    return iso;
  }
}

export default function Archive() {
  const [state, setState] = useState({ loading: true });

  useEffect(() => {
    listBriefings()
      .then((days) => setState({ loading: false, days }))
      .catch((err) => setState({ loading: false, error: err }));
  }, []);

  if (state.loading) return <div className="status">Chargement des archives…</div>;
  if (state.error) return <div className="status">Impossible de charger les archives.</div>;
  if (!state.days.length) return <div className="status">Aucune veille archivée pour l'instant.</div>;

  return (
    <div className="archive">
      <h2 className="archive-title">📖 Archives</h2>
      <div className="archive-list">
        {state.days.map((d) => {
          const date = d.date.slice(0, 10);
          return (
            <Link to={`/jour/${date}`} className="archive-item" key={date}>
              <div className="archive-item-date">{formatDate(d.date)}</div>
              {d.topic && <div className="archive-item-topic">📚 {d.topic}</div>}
              <div className="archive-item-meta">
                {d.papers} papiers · {d.news} news · {d.concepts} notions
              </div>
              <div className="tags">
                {(d.tags || []).map((t) => <span className="tag" key={t}>{t}</span>)}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
