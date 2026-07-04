import { Router } from 'express';
import { getBriefingByDate, getLatestBriefing, listBriefings } from '../db/briefings.js';
import { generateBriefing } from '../jobs/generate.js';

export const router = Router();

// Liste des briefings (métadonnées, pour les archives).
router.get('/', async (req, res, next) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 60, 365);
    res.json(await listBriefings(limit));
  } catch (err) {
    next(err);
  }
});

// Le briefing du jour (le plus récent).
router.get('/latest', async (req, res, next) => {
  try {
    const b = await getLatestBriefing();
    if (!b) return res.status(404).json({ error: 'Aucun briefing disponible' });
    res.json(b);
  } catch (err) {
    next(err);
  }
});

// Génération manuelle (protégée par token). À placer AVANT la route param.
router.post('/generate', async (req, res, next) => {
  try {
    const token = req.get('x-generate-token');
    if (!process.env.GENERATE_TOKEN || token !== process.env.GENERATE_TOKEN) {
      return res.status(401).json({ error: 'Non autorisé' });
    }
    const result = await generateBriefing({ date: req.body?.date });
    res.json({ ok: true, ...result });
  } catch (err) {
    next(err);
  }
});

// Un briefing par date (YYYY-MM-DD).
router.get('/:date', async (req, res, next) => {
  try {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(req.params.date)) {
      return res.status(400).json({ error: 'Date invalide (attendu YYYY-MM-DD)' });
    }
    const b = await getBriefingByDate(req.params.date);
    if (!b) return res.status(404).json({ error: 'Briefing introuvable' });
    res.json(b);
  } catch (err) {
    next(err);
  }
});
