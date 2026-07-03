import { Router } from 'express';
import db from '../db/connection.js';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT s.*,
        (SELECT temperature FROM temperature_readings
         WHERE server_id = s.id ORDER BY recorded_at DESC LIMIT 1) AS last_temp,
        (SELECT recorded_at FROM temperature_readings
         WHERE server_id = s.id ORDER BY recorded_at DESC LIMIT 1) AS last_reading_at
      FROM servers s
      ORDER BY s.name
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM servers WHERE id = $1', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Servidor no encontrado' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, type, cooling_type, k_value, max_temp_c, tamb_default, rack_location, status } = req.body;
    const { rows } = await db.query(`
      INSERT INTO servers (name, type, cooling_type, k_value, max_temp_c, tamb_default, rack_location, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [name, type, cooling_type, k_value, max_temp_c ?? 85, tamb_default ?? 22, rack_location ?? '', status ?? 'active']
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { name, type, cooling_type, k_value, max_temp_c, tamb_default, rack_location, status } = req.body;
    const { rows } = await db.query(`
      UPDATE servers SET name=$1, type=$2, cooling_type=$3, k_value=$4,
        max_temp_c=$5, tamb_default=$6, rack_location=$7, status=$8
      WHERE id=$9 RETURNING *`,
      [name, type, cooling_type, k_value, max_temp_c, tamb_default, rack_location, status, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Servidor no encontrado' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM servers WHERE id = $1', [req.params.id]);
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
