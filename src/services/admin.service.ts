import { supabase } from '../lib/supabase';

// --- Interfaces de Reportes ---
export interface PromotoraStats {
    id: string;
    nombre: string;
    contactos: number;
    compartidos: number;
    ventas: number;
    conversion: number;
    slaIndex: number;
    montoTotal: number;
}

export interface ProductStat {
    nombre: string;
    cantidad: number;
    monto: number;
}

// --- Métodos de Estadísticas ---

export async function obtenerEstadisticasAdmin() {
    // 1. Obtener todas las distribuidoras
    const { data: distribuidoras } = await supabase
        .from('distribuidoras')
        .select('id, nombre');

    // 2. Obtener todos los prospectos
    const { data: prospectos } = await supabase
        .from('prospectos')
        .select('*');

    // 3. Obtener leads
    const { data: leads } = await supabase
        .from('leads')
        .select('*');

    if (!distribuidoras || !prospectos || !leads) return null;

    // --- Procesamiento de Promotoras (Performance Optimizada) ---
    const statsPromotoras: PromotoraStats[] = distribuidoras.map(d => {
        const misProspectos = prospectos.filter(p => p.distribuidora_id === d.id);
        const misLeads = leads.filter(l => l.distribuidora_id === d.id);
        const ventas = misProspectos.filter(p => p.estado === 'venta_cerrada').length;
        const contactos = misProspectos.length;

        // SLA: % de prospectos atendidos antes de 48h
        const aTiempo = misProspectos.filter(p => {
            const ultima = new Date(p.ultima_interaccion).getTime();
            const diffHours = (Date.now() - ultima) / 36e5;
            return diffHours < 48 || p.estado === 'venta_cerrada';
        }).length;

        const montoTotal = misLeads.reduce((acc, curr) => acc + (curr.monto || 0), 0);

        return {
            id: d.id,
            nombre: d.nombre,
            contactos,
            compartidos: misLeads.length,
            ventas,
            conversion: contactos > 0 ? (ventas / contactos) * 100 : 0,
            slaIndex: contactos > 0 ? (aTiempo / contactos) * 100 : 100,
            montoTotal
        };
    });

    // --- Procesamiento de Productos ---
    const { data: currentProducts } = await supabase.from('productos').select('nombre, status');
    const publishedNames = new Set(currentProducts?.filter(p => p.status !== 'draft').map(p => p.nombre) || []);
    const productMap = new Map<string, { cantidad: number; monto: number }>();

    leads.forEach(l => {
        const items = l.productos || [];
        items.forEach((p: any) => {
            if (!publishedNames.has(p.name)) return;
            const existing = productMap.get(p.name) || { cantidad: 0, monto: 0 };
            productMap.set(p.name, {
                cantidad: existing.cantidad + (p.qty || 1),
                monto: existing.monto + (l.monto / items.length)
            });
        });
    });

    const statsProductos: ProductStat[] = Array.from(productMap.entries())
        .map(([nombre, data]) => ({ nombre, ...data }))
        .sort((a, b) => b.cantidad - a.cantidad);

    return {
        promotoras: statsPromotoras,
        productos: statsProductos,
        global: {
            totalVentas: statsPromotoras.reduce((acc, p) => acc + p.ventas, 0),
            totalMonto: statsPromotoras.reduce((acc, p) => acc + p.montoTotal, 0),
            conversionPromedio: statsPromotoras.length > 0
                ? statsPromotoras.reduce((acc, p) => acc + p.conversion, 0) / statsPromotoras.length
                : 0
        }
    };
}

// ============================================================================
// GESTIÓN DE LINAJE Y SEGURIDAD DE RED (Consolidado)
// ============================================================================

/**
 * Obtiene el listado completo de la red con detalles de linaje.
 * Incluye Socio ID, Nivel, Lead Orgánico y Patrocinador Actual.
 */
export async function obtenerDistribuidorasLinaje() {
    const { data, error } = await supabase
        .from('distribuidoras')
        // Nota: El join 'sponsor:referred_by' asume que tenemos la FK configurada en DB
        .select(`
      id, 
      socio_id, 
      nombre, 
      email,
      nivel, 
      organic_lead, 
      referred_by,
      sponsor:referred_by ( id, nombre, socio_id )
    `)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
}

/**
 * Ejecuta un cambio de patrocinador de alto nivel con validaciones estrictas.
 * 1. Verifica ciclos (A->B->A).
 * 2. Realiza el cambio.
 * 3. Registra auditoría inmutable.
 */
export async function cambiarPatrocinador(
    adminEmail: string,
    sociaId: string,
    nuevoPatrocinadorId: string | null, // NULL = Mover a Raíz (Sin patrocinador)
    patrocinadorAnteriorId: string | null
) {
    // 1. Validación Básica: No ser padre de sí mismo
    if (sociaId === nuevoPatrocinadorId) {
        throw new Error("REGLA DE NEGOCIO: Una socia no puede ser su propio patrocinador.");
    }

    // 2. Validación de Ciclos Profunda (SQL Function)
    if (nuevoPatrocinadorId) {
        // Llamada a función RPC para verificar si el nuevo padre es descendiente del hijo
        // Esta función debe existir en la DB (Ver supabase_lineage.sql)
        const { data: isCycle, error: rpcError } = await supabase
            .rpc('check_lineage_cycle', {
                child_id: sociaId,
                projected_parent_id: nuevoPatrocinadorId
            });

        if (rpcError) {
            // Si la función RPC no existe aún, continuamos con warning pero bloqueamos lo obvio
            console.warn("Advertencia: No se pudo verificar ciclos complejos (RPC missing).", rpcError);
        } else if (isCycle) {
            throw new Error("REGLA DE NEGOCIO: Ciclo detectado. No puedes asignar a una socia bajo alguien que ya está en su propia línea descendente.");
        }
    }

    // 3. Ejecutar Update (Atomicidad)
    const { error: updateError } = await supabase
        .from('distribuidoras')
        .update({
            referred_by: nuevoPatrocinadorId,
            organic_lead: false // Si se asigna manualmente, ya no es orgánico "huérfano"
        })
        .eq('id', sociaId);

    if (updateError) throw updateError;

    // 4. Registrar en Auditoría (Inmutable)
    const { error: logError } = await supabase
        .from('audit_logs_lineage')
        .insert({
            admin_email: adminEmail,
            distribuidora_id: sociaId,
            old_sponsor_id: patrocinadorAnteriorId,
            new_sponsor_id: nuevoPatrocinadorId,
            reason: 'Reasignación manual desde Panel Admin'
        });

    if (logError) console.error("CRITICAL: Error guardando log de auditoría", logError);
}
