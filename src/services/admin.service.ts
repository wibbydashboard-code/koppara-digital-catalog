import { supabase } from '../lib/supabase';

export interface PromotoraStats {
    id: string;
    nombre: string;
    contactos: number;
    compartidos: number;
    ventas: number;
    conversion: number;
    slaIndex: number; // Porcentaje de contactos atendidos a tiempo (<48h)
    montoTotal: number;
}

export interface ProductStat {
    nombre: string;
    cantidad: number;
    monto: number;
}

export async function obtenerEstadisticasAdmin() {
    // 1. Obtener todas las distribuidoras
    const { data: distribuidoras } = await supabase
        .from('distribuidoras')
        .select('id, nombre');

    // 2. Obtener todos los prospectos
    const { data: prospectos } = await supabase
        .from('prospectos')
        .select('*');

    // 3. Obtener todos los leads (historial de compartición)
    const { data: leads } = await supabase
        .from('leads')
        .select('*');

    if (!distribuidoras || !prospectos || !leads) return null;

    // --- Procesamiento de Promotoras ---
    const statsPromotoras: PromotoraStats[] = distribuidoras.map(d => {
        const misProspectos = prospectos.filter(p => p.distribuidora_id === d.id);
        const misLeads = leads.filter(l => l.distribuidora_id === d.id);

        const ventas = misProspectos.filter(p => p.estado === 'venta_cerrada').length;
        const contactos = misProspectos.length;

        // Cálculo de SLA: % de prospectos que NO están vencidos (>48h sin interacción)
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
    const { data: currentProducts } = await supabase
        .from('productos')
        .select('nombre, status');

    const publishedNames = new Set(currentProducts?.filter(p => p.status !== 'draft').map(p => p.nombre) || []);

    const productMap = new Map<string, { cantidad: number; monto: number }>();

    leads.forEach(l => {
        const items = l.productos || [];
        items.forEach((p: any) => {
            if (!publishedNames.has(p.name)) return; // Excluir si es borrador o no existe

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
