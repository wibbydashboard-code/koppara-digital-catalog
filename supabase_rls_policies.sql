-- ═══════════════════════════════════════════════════════════════════
--  KOPPARA — Políticas RLS Mínimas para Producción
--  
--  INSTRUCCIONES:
--  1. Abre tu proyecto en https://supabase.com
--  2. Ve a Database → SQL Editor
--  3. Pega y ejecuta TODO este script
--  4. Ve a Authentication → Policies y verifica que aparecen las políticas
--
--  Las tablas deben tener RLS HABILITADO (Enable RLS):
--    - distribuidoras ✓
--    - prospectos     ✓
--    - leads          ✓
--    - productos      ✓ (solo lectura pública)
--    - notificaciones ✓
-- ═══════════════════════════════════════════════════════════════════


-- ─────────────────────────────────────────────────
--  1. HABILITAR RLS EN TODAS LAS TABLAS
-- ─────────────────────────────────────────────────
ALTER TABLE distribuidoras   ENABLE ROW LEVEL SECURITY;
ALTER TABLE prospectos       ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads            ENABLE ROW LEVEL SECURITY;
ALTER TABLE productos        ENABLE ROW LEVEL SECURITY;
ALTER TABLE notificaciones   ENABLE ROW LEVEL SECURITY;


-- ─────────────────────────────────────────────────
--  2. TABLA: distribuidoras
--  Cada socia solo puede leer y editar SU propio perfil.
--  El admin (wibbydashboard@gmail.com) o role=admin: todo.
-- ─────────────────────────────────────────────────

-- Política de lectura: solo tu propio perfil
CREATE POLICY "distribuidoras_select_own"
  ON distribuidoras
  FOR SELECT
  USING (
    auth.uid() = id
    OR (auth.jwt() ->> 'email')::text = 'wibbydashboard@gmail.com'
    OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );

-- Política de inserción: solo puedes crear TU perfil (id = tu uid)
CREATE POLICY "distribuidoras_insert_own"
  ON distribuidoras
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Política de actualización: solo tu propio perfil
CREATE POLICY "distribuidoras_update_own"
  ON distribuidoras
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Política de lectura para admin: todos los perfiles
CREATE POLICY "distribuidoras_select_admin"
  ON distribuidoras
  FOR ALL
  USING (
    (auth.jwt() ->> 'email')::text = 'wibbydashboard@gmail.com'
    OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );


-- ─────────────────────────────────────────────────
--  3. TABLA: prospectos
--  Cada socia solo ve sus propios clientes.
-- ─────────────────────────────────────────────────

CREATE POLICY "prospectos_select_own"
  ON prospectos
  FOR SELECT
  USING (auth.uid() = distribuidora_id);

CREATE POLICY "prospectos_insert_own"
  ON prospectos
  FOR INSERT
  WITH CHECK (auth.uid() = distribuidora_id);

CREATE POLICY "prospectos_update_own"
  ON prospectos
  FOR UPDATE
  USING (auth.uid() = distribuidora_id);

CREATE POLICY "prospectos_delete_own"
  ON prospectos
  FOR DELETE
  USING (auth.uid() = distribuidora_id);

-- Admin: acceso total
CREATE POLICY "prospectos_admin_all"
  ON prospectos
  FOR ALL
  USING (
    (auth.jwt() ->> 'email')::text = 'wibbydashboard@gmail.com'
    OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );


-- ─────────────────────────────────────────────────
--  4. TABLA: leads
--  Igual que prospectos: solo el dueño puede ver sus registros.
-- ─────────────────────────────────────────────────

CREATE POLICY "leads_select_own"
  ON leads
  FOR SELECT
  USING (auth.uid() = distribuidora_id);

CREATE POLICY "leads_insert_own"
  ON leads
  FOR INSERT
  WITH CHECK (auth.uid() = distribuidora_id);

CREATE POLICY "leads_update_own"
  ON leads
  FOR UPDATE
  USING (auth.uid() = distribuidora_id);

-- Admin
CREATE POLICY "leads_admin_all"
  ON leads
  FOR ALL
  USING (
    (auth.jwt() ->> 'email')::text = 'wibbydashboard@gmail.com'
    OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );


-- ─────────────────────────────────────────────────
--  5. TABLA: productos
--  Lectura pública para clientes que visitan el catálogo.
--  Escritura/borrado solo para admin.
-- ─────────────────────────────────────────────────

-- Cualquier visitante puede leer productos activos
CREATE POLICY "productos_public_select"
  ON productos
  FOR SELECT
  USING (activo = true AND status = 'published');

-- Admin ve y edita todo (incluyendo borradores)
CREATE POLICY "productos_admin_all"
  ON productos
  FOR ALL
  USING (
    (auth.jwt() ->> 'email')::text = 'wibbydashboard@gmail.com'
    OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );


-- ─────────────────────────────────────────────────
--  6. TABLA: notificaciones
--  Cada socia solo ve sus notificaciones o las globales (distribuidora_id IS NULL).
-- ─────────────────────────────────────────────────

CREATE POLICY "notificaciones_select_own_or_global"
  ON notificaciones
  FOR SELECT
  USING (
    distribuidora_id IS NULL
    OR auth.uid() = distribuidora_id
    OR (auth.jwt() ->> 'email')::text = 'wibbydashboard@gmail.com'
    OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );

-- Solo admin puede crear/editar notificaciones
CREATE POLICY "notificaciones_admin_write"
  ON notificaciones
  FOR ALL
  USING (
    (auth.jwt() ->> 'email')::text = 'wibbydashboard@gmail.com'
    OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );


-- ═══════════════════════════════════════════════════════════════════
-- FIN DEL SCRIPT
-- ═══════════════════════════════════════════════════════════════════
-- NOTA: Si corres este script dos veces, las políticas ya existentes
-- generarán un error "already exists". Para eso, puedes anteponer:
--   DROP POLICY IF EXISTS "nombre_politica" ON tabla;
-- antes de cada CREATE POLICY.
-- ═══════════════════════════════════════════════════════════════════
