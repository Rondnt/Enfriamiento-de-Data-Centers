import { Router } from 'express';
import db from '../db/connection.js';

const router = Router({ mergeParams: true });

router.get('/', async (req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT * FROM temperature_readings
      WHERE server_id = $1
      ORDER BY t_minutes ASC NULLS LAST, recorded_at ASC
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
    const { temperature, t_minutes } = req.body;
    const t = (t_minutes !== '' && t_minutes != null) ? parseFloat(t_minutes) : null;
    const { rows } = await db.query(`
      INSERT INTO temperature_readings (server_id, temperature, t_minutes)
      VALUES ($1, $2, $3) RETURNING *`,
      [req.params.serverId, temperature, t]
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
