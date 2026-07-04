CREATE TABLE IF NOT EXISTS servers (
  id            SERIAL PRIMARY KEY,
  name          VARCHAR(120) NOT NULL,
  type          VARCHAR(60)  NOT NULL DEFAULT 'general',
  cooling_type  VARCHAR(60)  NOT NULL DEFAULT 'air',
  k_value       DECIMAL(8,5),
  max_temp_c    DECIMAL(6,2) NOT NULL DEFAULT 85,
  tamb_default  DECIMAL(6,2) NOT NULL DEFAULT 22,
  rack_location VARCHAR(100),
  status        VARCHAR(20)  NOT NULL DEFAULT 'active',
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS temperature_readings (
  id          SERIAL PRIMARY KEY,
  server_id   INTEGER      NOT NULL REFERENCES servers(id) ON DELETE CASCADE,
  temperature DECIMAL(6,2) NOT NULL,
  t_minutes   DECIMAL(8,4),
  recorded_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS custom_scenarios (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(120) NOT NULL,
  description TEXT,
  t0          DECIMAL(6,2) NOT NULL,
  tamb        DECIMAL(6,2) NOT NULL,
  k           DECIMAL(8,5) NOT NULL,
  tmax        DECIMAL(8,2) NOT NULL DEFAULT 90,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Servidores de ejemplo (solo si la tabla está vacía)
INSERT INTO servers (name, type, cooling_type, k_value, max_temp_c, tamb_default, rack_location, status)
SELECT name, type, cooling_type, k_value, max_temp_c, tamb_default, rack_location, status
FROM (VALUES
  ('Web-Server-01',    'web',      'air',    0.08::DECIMAL,  85.0, 22.0, 'Zona A — Rack 1', 'active'),
  ('DB-Primary',       'database', 'liquid', 0.25::DECIMAL,  80.0, 18.0, 'Zona B — Rack 3', 'active'),
  ('GPU-Cluster-01',   'gpu',      'liquid', 0.35::DECIMAL,  90.0, 15.0, 'Zona C — Rack 5', 'active'),
  ('HPC-Node-03',      'hpc',      'hybrid', 0.15::DECIMAL,  85.0, 20.0, 'Zona D — Rack 8', 'maintenance'),
  ('Storage-NAS-02',   'storage',  'air',    0.06::DECIMAL,  70.0, 24.0, 'Zona A — Rack 2', 'active')
) AS v(name, type, cooling_type, k_value, max_temp_c, tamb_default, rack_location, status)
WHERE NOT EXISTS (SELECT 1 FROM servers LIMIT 1);
