import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

import db from './db/connection.js';
import serversRouter  from './routes/servers.js';
import readingsRouter from './routes/readings.js';
import scenariosRouter from './routes/scenarios.js';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FRONTEND  = path.resolve(__dirname, '../../');
const PORT      = process.env.PORT || 4000;

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(FRONTEND));

app.use('/api/servers',                    serversRouter);
app.use('/api/servers/:serverId/readings', readingsRouter);
app.use('/api/scenarios',                  scenariosRouter);

async function runMigrations() {
  const migrDir = path.join(__dirname, 'db/migrations');
  for (const file of ['001_init.sql', '002_add_t_minutes.sql']) {
    const sql = fs.readFileSync(path.join(migrDir, file), 'utf8');
    await db.query(sql);
  }
  console.log('✓ Migraciones OK');
}

app.listen(PORT, async () => {
  try {
    await runMigrations();
    console.log(`Servidor en http://localhost:${PORT}`);
  } catch (err) {
    console.error('Error BD:', err.message);
    process.exit(1);
  }
});
