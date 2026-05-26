-- ============================================================
-- KM7 EVALUACIÓN COMERCIAL · ESQUEMA SUPABASE
-- Ejecuta este SQL en Supabase → SQL Editor → New Query → Run
-- ============================================================

-- Tabla de vendedores (equipo comercial)
CREATE TABLE IF NOT EXISTS vendors (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  initials TEXT NOT NULL,
  pin TEXT NOT NULL DEFAULT '0000',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de resultados de pruebas
CREATE TABLE IF NOT EXISTS test_results (
  id BIGSERIAL PRIMARY KEY,
  vendor_id TEXT NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  test_id TEXT NOT NULL,
  score INTEGER NOT NULL,
  total INTEGER NOT NULL,
  area_stats JSONB NOT NULL,
  completed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índice para consultar resultados por vendedor rápido
CREATE INDEX IF NOT EXISTS idx_test_results_vendor ON test_results(vendor_id);
CREATE INDEX IF NOT EXISTS idx_test_results_test ON test_results(test_id);
CREATE INDEX IF NOT EXISTS idx_test_results_completed ON test_results(completed_at DESC);

-- Insertar los 3 vendedores iniciales (PIN por defecto: cada uno tiene su propio PIN)
INSERT INTO vendors (id, name, initials, pin) VALUES
  ('anthony',   'Anthony Herrera',     'AH', '1111'),
  ('luisa',     'Luisa Montañez',      'LM', '2222'),
  ('yessibeth', 'Yessibeth Hernández', 'YH', '3333')
ON CONFLICT (id) DO NOTHING;

-- Insertar admin (tú) - cámbiale el PIN
INSERT INTO vendors (id, name, initials, pin) VALUES
  ('admin', 'Administrador KM7', 'KM', '0707')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- Activamos políticas básicas: cualquiera puede leer/escribir
-- (la seguridad real está en el PIN del lado del servidor)
-- ============================================================

ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_results ENABLE ROW LEVEL SECURITY;

-- Solo el backend (con service_role key) podrá modificar.
-- Si quieres permitir lectura pública desde el navegador, descomenta:
-- CREATE POLICY "public read vendors" ON vendors FOR SELECT USING (true);
-- CREATE POLICY "public read results" ON test_results FOR SELECT USING (true);

-- Por defecto, TODO pasa por las funciones serverless de Vercel
-- (que usan la service_role key) → más seguro.
