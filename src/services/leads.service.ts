import { supabase, Lead } from '../lib/supabase';

/**
 * Registra un nuevo lead (interés de compra en WhatsApp)
 */
export async function registrarLead(lead: Omit<Lead, 'id' | 'fecha_pedido' | 'created_at'>): Promise<Lead | null> {
    try {
        const { data, error } = await supabase
            .from('leads')
            .insert(lead)
            .select()
            .single();

        if (error) throw error;
        return data as Lead;
    } catch (error) {
        console.error('Error en registrarLead:', error);
        return null;
    }
}

/**
 * Obtiene los leads de una distribuidora específica
 */
export async function obtenerLeadsDistribuidora(distribuidoraId: string): Promise<Lead[]> {
    try {
        const { data, error } = await supabase
            .from('leads')
            .select('*')
            .eq('distribuidora_id', distribuidoraId)
            .order('fecha_pedido', { ascending: false });

        if (error) throw error;
        return data as Lead[];
    } catch (error) {
        console.error('Error en obtenerLeadsDistribuidora:', error);
        return [];
    }
}
