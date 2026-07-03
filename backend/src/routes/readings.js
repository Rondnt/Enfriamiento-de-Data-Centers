import { Router } from 'express';
import db from '../db/connection.js';

const router = Router({ mergeParams: true });

router.get('/', async (req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT * FROM temperature_readings
      WHERE server_id = $1
      ORDER BY recorded_at DESC
      LIMIT 100`,
      [req.params.serverId]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { temperature } = req.body;
    const { rows } = await db.query(`
      INSERT INTO temperature_readings (server_id, temperature)
      VALUES ($1, $2) RETURNING *`,
      [req.params.serverId, temperature]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM temperature_readings WHERE id=$1 AND server_id=$2',
      [req.params.id, req.params.serverId]);
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
