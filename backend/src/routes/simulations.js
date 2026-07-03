import { Router } from 'express';
import db from '../db/connection.js';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const { rows } = await db.query(
      'SELECT * FROM simulations ORDER BY created_at DESC LIMIT 50'
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, t0, tamb, k, tmax, h, qdot } = req.body;
    const { rows } = await db.query(
      `INSERT INTO simulations (name, t0, tamb, k, tmax, h, qdot)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [name || 'Sin nombre', t0, tamb, k, tmax, h, qdot ?? 2]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM simulations WHERE id = $1', [req.params.id]);
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
