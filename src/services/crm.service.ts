import { supabase, Prospecto, Lead } from '../lib/supabase';

export async function registrarProspectoYCompartir(
    distribuidora_id: string,
    datos: { nombre: string; telefono: string },
    productos: any[],
    monto: number
) {
    // 1. Verificar si el prospecto ya existe para esta vendedora
    const { data: existente } = await supabase
        .from('prospectos')
        .select('id')
        .eq('distribuidora_id', distribuidora_id)
        .eq('telefono', datos.telefono)
        .single();

    let prospecto_id = existente?.id;

    if (!prospecto_id) {
        const { data: nuevo, error } = await supabase
            .from('prospectos')
            .insert([{
                distribuidora_id,
                nombre: datos.nombre,
                telefono: datos.telefono,
                estado: 'interesado',
                ultima_interaccion: new Date().toISOString(),
                created_at: new Date().toISOString()
            }])
            .select()
            .single();

        if (error) throw error;
        prospecto_id = nuevo.id;
    } else {
        // Actualizar última interacción
        await supabase
            .from('prospectos')
            .update({ ultima_interaccion: new Date().toISOString() })
            .eq('id', prospecto_id);
    }

    // 2. Registrar el Lead (Historial de compartición)
    const { error: errorLead } = await supabase
        .from('leads')
        .insert([{
            distribuidora_id,
            prospecto_id,
            nombre_cliente: datos.nombre,
            whatsapp_cliente: datos.telefono,
            productos,
            monto,
            estado: 'pendiente',
            fecha_pedido: new Date().toISOString(),
            created_at: new Date().toISOString()
        }]);

    if (errorLead) throw errorLead;

    return prospecto_id;
}

export async function obtenerProspectos(distribuidora_id: string): Promise<Prospecto[]> {
    const { data, error } = await supabase
        .from('prospectos')
        .select('*')
        .eq('distribuidora_id', distribuidora_id)
        .order('ultima_interaccion', { ascending: false });

    if (error) throw error;
    return data as Prospecto[];
}

export async function obtenerHistorialLeads(distribuidora_id: string): Promise<Lead[]> {
    const { data, error } = await supabase
        .from('leads')
        .select('*')
        .eq('distribuidora_id', distribuidora_id)
        .order('fecha_pedido', { ascending: false });

    if (error) throw error;
    return data as Lead[];
}

export async function actualizarEstadoProspecto(id: string, estado: Prospecto['estado']) {
    const { error } = await supabase
        .from('prospectos')
        .update({ estado })
        .eq('id', id);
    if (error) throw error;
}
