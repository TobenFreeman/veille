import { useEffect, useState } from 'react';
import { getLatest } from '../api.js';
import Briefing from '../components/Briefing.jsx';

export default function Today() {
  const [state, setState] = useState({ loading: true });

  useEffect(() => {
    getLatest()
      .then((briefing) => setState({ loading: false, briefing }))
      .catch((err) => setState({ loading: false, error: err }));
  }, []);

  if (state.loading) return <div className="status">Chargement de la veille…</div>;
  if (state.error) {
    return (
      <div className="status">
        {state.error.status === 404
          ? "Aucune veille n'a encore été générée."
          : 'Impossible de charger la veille.'}
      </div>
    );
  }
  return <Briefing briefing={state.briefing} />;
}
