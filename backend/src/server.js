import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { router as briefingsRouter } from './routes/briefings.js';
import { pool } from './db/pool.js';

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok' });
  } catch {
    res.status(503).json({ status: 'db_error' });
  }
});

app.use('/api/briefings', briefingsRouter);

// Gestion d'erreurs centralisée.
app.use((err, req, res, next) => {
  console.error('Erreur API:', err);
  res.status(500).json({ error: 'Erreur serveur' });
});

const PORT = process.env.PORT || 3022;
app.listen(PORT, '127.0.0.1', () => {
  console.log(`Veille API en écoute sur http://127.0.0.1:${PORT}`);
});
