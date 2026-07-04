-- Hace k_value opcional en servidores existentes
ALTER TABLE servers ALTER COLUMN k_value DROP NOT NULL;

-- Agrega columna de tiempo (minutos) a lecturas existentes
ALTER TABLE temperature_readings ADD COLUMN IF NOT EXISTS t_minutes DECIMAL(8,4);
