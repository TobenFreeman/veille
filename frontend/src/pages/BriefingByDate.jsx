import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getByDate } from '../api.js';
import Briefing from '../components/Briefing.jsx';

export default function BriefingByDate() {
  const { date } = useParams();
  const [state, setState] = useState({ loading: true });

  useEffect(() => {
    setState({ loading: true });
    getByDate(date)
      .then((briefing) => setState({ loading: false, briefing }))
      .catch((err) => setState({ loading: false, error: err }));
  }, [date]);

  if (state.loading) return <div className="status">Chargement…</div>;
  if (state.error) return <div className="status">Briefing introuvable pour cette date.</div>;

  return (
    <>
      <Link to="/archives" className="back-link">← Retour aux archives</Link>
      <Briefing briefing={state.briefing} />
    </>
  );
}
