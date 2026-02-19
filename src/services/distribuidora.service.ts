import { supabase, Distribuidora } from '../lib/supabase';

/**
 * Obtiene el perfil de una distribuidora por su ID (UUID de Auth)
 */
export async function obtenerPerfilDistribuidora(id: string): Promise<Distribuidora | null> {
    try {
        const { data, error } = await supabase
            .from('distribuidoras')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            if (error.code === 'PGRST116') return null; // No encontrado
            throw error;
        }

        return data as Distribuidora;
    } catch (error) {
        console.error('Error en obtenerPerfilDistribuidora:', error);
        return null;
    }
}

/**
 * Crea o actualiza el perfil de una distribuidora
 */
export async function guardarPerfilDistribuidora(perfil: Partial<Distribuidora>): Promise<Distribuidora | null> {
    try {
        const { data, error } = await supabase
            .from('distribuidoras')
            .upsert(perfil, { onConflict: 'id' })
            .select()
            .single();

        if (error) throw error;
        return data as Distribuidora;
    } catch (error) {
        console.error('Error en guardarPerfilDistribuidora:', error);
        throw error;
    }
}

/**
 * Genera un código de referido único basado en el nombre
 */
export function generarCodigoReferido(nombre: string): string {
    const prefix = nombre.split(' ')[0].toUpperCase().substring(0, 4);
    const random = Math.floor(1000 + Math.random() * 9000);
    return `${prefix}${random}`;
}
