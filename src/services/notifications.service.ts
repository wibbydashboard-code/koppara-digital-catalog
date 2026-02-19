import { supabase, Notificacion } from '../lib/supabase';

export async function enviarNotificacion(notif: Partial<Notificacion>) {
    const { data, error } = await supabase
        .from('notificaciones')
        .insert([{
            ...notif,
            leida: false,
            created_at: new Date().toISOString()
        }]);

    if (error) throw error;

    // Integración WhatsApp Mock up
    if (notif.categoria === 'urgente') {
        const message = `🔔 AVISO KOPPARA: ${notif.titulo}\n\n${notif.cuerpo}`;
        window.open(`https://wa.me/4774166291?text=${encodeURIComponent(message)}`, '_blank');
    }

    return data;
}

export async function obtenerNotificaciones(nivel?: string, distribuidora_id?: string): Promise<Notificacion[]> {
    let query = supabase.from('notificaciones').select('*').order('created_at', { ascending: false });

    if (nivel && nivel !== 'todas') {
        query = query.or(`nivel_objetivo.eq.${nivel},nivel_objetivo.eq.todas`);
    }

    if (distribuidora_id) {
        query = query.or(`distribuidora_id.eq.${distribuidora_id},distribuidora_id.is.null`);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data as Notificacion[];
}
