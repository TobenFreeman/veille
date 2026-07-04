// Petit client de l'API veille. Même origine → chemins relatifs.
async function get(path) {
  const res = await fetch(`/api${path}`);
  if (!res.ok) {
    const err = new Error(`HTTP ${res.status}`);
    err.status = res.status;
    throw err;
  }
  return res.json();
}

export const getLatest = () => get('/briefings/latest');
export const getByDate = (date) => get(`/briefings/${date}`);
export const listBriefings = () => get('/briefings');
