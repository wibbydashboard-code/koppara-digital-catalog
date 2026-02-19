import { createClient } from '@supabase/supabase-js'

/**
 * Configuración del cliente de Supabase para Koppara Digital Catalog.
 * Credenciales hardcodeadas para asegurar el funcionamiento en cualquier entorno.
 */

const supabaseUrl = 'https://sdxngqnqlwbqdpqcltim.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNkeG5ncW5xbHdicWRwcWNsdGltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA0Njk2MjgsImV4cCI6MjA4NjA0NTYyOH0.FJWpkWTBP6cxkrnUuZRyvkbyakIQNBsrMo24a1lrax0'

console.log('🔍 Inicializando Supabase...')
console.log('URL:', supabaseUrl)
console.log('Key Status:', supabaseAnonKey ? '✅ Presente' : '❌ Faltante')

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('❌ Error: Faltan credenciales de Supabase')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// ============================================
// TIPOS PARA LA BASE DE DATOS
// ============================================

export interface Producto {
  id: string
  nombre: string
  referencia: string
  categoria: string
  descripcion: string
  beneficios: string[]
  modo_uso: string
  ingredientes: string[]
  precio: number
  precio_distribuidor: number | null
  imagen_url: string
  certificaciones: string[]
  rituales: string[]
  activo: boolean
  created_at: string
}

export interface Distribuidora {
  id: string;
  email: string;
  nombre: string;
  telefono: string;
  nivel: 'basica' | 'luxury' | 'elite';
  codigo_referido: string;
  ganancias_total: number;
  fecha_registro: string;
  created_at: string;
}

export interface Lead {
  id: string;
  distribuidora_id: string;
  nombre_cliente: string;
  whatsapp_cliente: string;
  productos: any;
  monto: number;
  fecha_pedido: string;
  estado: 'pendiente' | 'entregado' | 'cancelado';
}

/**
 * Verifica si el cliente de Supabase está correctamente configurado
 */
export async function verificarConexion(): Promise<boolean> {
  try {
    console.log('🔄 Probando conexión a Supabase...')
    // Usamos select('id') para una consulta ligera
    const { data, error } = await supabase.from('productos').select('id').limit(1)
    if (error) {
      console.error('❌ Error de conexión:', error)
      return false
    }
    console.log('✅ Conexión a Supabase exitosa')
    return true
  } catch (error) {
    console.error('❌ No se pudo conectar a Supabase:', error)
    return false
  }
}
