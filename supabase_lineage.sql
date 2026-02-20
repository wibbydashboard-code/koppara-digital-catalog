-- ==============================================================================
-- MÓDULO DE IDENTIDAD, LINAJE Y AUDITORÍA KOPPARA (VERSIÓN FINAL SEGURA)
-- ==============================================================================

-- 1. ESTRUCTURA DE DATOS
ALTER TABLE distribuidoras ADD COLUMN IF NOT EXISTS socio_id TEXT UNIQUE;
ALTER TABLE distribuidoras ADD COLUMN IF NOT EXISTS organic_lead BOOLEAN DEFAULT FALSE;
ALTER TABLE distribuidoras ADD COLUMN IF NOT EXISTS referred_by UUID;

-- Configurar FK autorreferencial (Árbol de patrocinio)
ALTER TABLE distribuidoras DROP CONSTRAINT IF EXISTS fk_sponsor;
ALTER TABLE distribuidoras 
  ADD CONSTRAINT fk_sponsor FOREIGN KEY (referred_by) REFERENCES distribuidoras(id);

-- Secuencia para IDs legibles
CREATE SEQUENCE IF NOT EXISTS socio_id_seq START 1;

-- 2. TABLA DE AUDITORÍA
CREATE TABLE IF NOT EXISTS audit_logs_lineage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_email TEXT NOT NULL,
  distribuidora_id UUID NOT NULL REFERENCES distribuidoras(id),
  old_sponsor_id UUID REFERENCES distribuidoras(id),
  new_sponsor_id UUID REFERENCES distribuidoras(id),
  changed_at TIMESTAMPTZ DEFAULT NOW(),
  reason TEXT DEFAULT 'Cambio administrativo manual'
);

-- BORRAR POLÍTICAS PREVIAS PARA EVITAR ERRORES DE "ALREADY EXISTS"
DROP POLICY IF EXISTS "Admins view logs" ON audit_logs_lineage;
DROP POLICY IF EXISTS "System insert logs" ON audit_logs_lineage;

ALTER TABLE audit_logs_lineage ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins view logs" ON audit_logs_lineage FOR SELECT USING (auth.jwt() ->> 'email' = 'wibbydashboard@gmail.com');
CREATE POLICY "System insert logs" ON audit_logs_lineage FOR INSERT WITH CHECK (true);

-- 3. FUNCIÓN DE DETECCIÓN DE CICLOS (Mejorada con manejo de NULLs)
CREATE OR REPLACE FUNCTION check_lineage_cycle(child_id UUID, projected_parent_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  cycle_exists BOOLEAN;
BEGIN
  -- Si no hay padre, no puede haber ciclo
  IF projected_parent_id IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Si intentas ser tu propio padre
  IF child_id = projected_parent_id THEN
    RETURN TRUE;
  END IF;

  -- Búsqueda recursiva hacia arriba
  WITH RECURSIVE lineage_path AS (
      -- Base: Empezamos buscando al padre propuesto
      SELECT id, referred_by
      FROM distribuidoras
      WHERE id = projected_parent_id
      
      UNION ALL
      
      -- Recursión: Subimos por los ancestros
      SELECT d.id, d.referred_by
      FROM distribuidoras d
      INNER JOIN lineage_path lp ON d.id = lp.referred_by
  )
  SELECT EXISTS (SELECT 1 FROM lineage_path WHERE id = child_id) INTO cycle_exists;
  
  RETURN cycle_exists;
END;
$$ LANGUAGE plpgsql;

-- 4. TRIGGER DE BLOQUEO DE CICLOS (Safety Logic)
CREATE OR REPLACE FUNCTION prevent_sponsor_cycle()
RETURNS TRIGGER AS $$
BEGIN
  -- Solo validamos si el patrocinador cambia a algo no nulo
  IF NEW.referred_by IS NOT NULL AND (OLD.referred_by IS NULL OR NEW.referred_by != OLD.referred_by) THEN
     IF check_lineage_cycle(NEW.id, NEW.referred_by) THEN
        RAISE EXCEPTION 'Operación denegada: Asignar este patrocinador crearía un ciclo infinito en el linaje.';
     END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prevent_sponsor_cycle ON distribuidoras;
CREATE TRIGGER trg_prevent_sponsor_cycle
BEFORE UPDATE OF referred_by ON distribuidoras
FOR EACH ROW
EXECUTE FUNCTION prevent_sponsor_cycle();

-- 5. TRIGGER DE ASIGNACION AUTOMÁTICA (ID + Orgánicos)
CREATE OR REPLACE FUNCTION handle_new_distributor_logic()
RETURNS TRIGGER AS $$
DECLARE
  admin_uuid UUID;
BEGIN
  -- A) Generar ID KP-26-XXX secuencial
  IF NEW.socio_id IS NULL THEN
    NEW.socio_id := 'KP-26-' || LPAD(nextval('socio_id_seq')::text, 3, '0');
  END IF;

  -- B) Fallback Orgánico: Si no trae sponsor, buscar al Admin
  IF NEW.referred_by IS NULL THEN
     SELECT id INTO admin_uuid FROM distribuidoras WHERE email = 'wibbydashboard@gmail.com' LIMIT 1;
     
     -- Auto-asignar solo si encontramos al admin y no es el mismo usuario
     IF admin_uuid IS NOT NULL AND NEW.id != admin_uuid THEN
       NEW.referred_by := admin_uuid;
       NEW.organic_lead := TRUE;
     END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_new_distributor_logic ON distribuidoras;
CREATE TRIGGER trg_new_distributor_logic
BEFORE INSERT ON distribuidoras
FOR EACH ROW
EXECUTE FUNCTION handle_new_distributor_logic();
