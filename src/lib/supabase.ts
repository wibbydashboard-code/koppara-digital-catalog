import { createClient } from '@supabase/supabase-js'

/**
 * Configuración del cliente de Supabase para Koppara Digital Catalog.
 * Credenciales hardcodeadas para asegurar el funcionamiento en cualquier entorno.
 */

const supabaseUrl = 'https://rgrdogwwczlxakeggnbu.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJncmRvZ3d3Y3pseGFrZWdnbmJ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE1MzQwMTgsImV4cCI6MjA4NzExMDAxOH0.K0MrGpM6QiZ8eEIXXNyVwXEyKwIaGyb_n3heb5mbfDI'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// ============================================
// TIPOS PARA LA BASE DE DATOS
// ============================================

export interface Producto {
  id: string
  nombre: string
  referencia: string
  categoria: string
  description: string // Sincronizado con DB
  descripcion?: string // Compatibilidad legacy
  beneficios: string[]
  modo_uso: string
  ingredientes: string[]
  precio: number
  precio_distribuidor: number | null
  imagen_url: string
  certificaciones: string[]
  rituales: string[]
  activo: boolean
  status: 'published' | 'draft'
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
  prospecto_id?: string;
  nombre_cliente: string;
  whatsapp_cliente: string;
  productos: any;
  monto: number;
  fecha_pedido: string;
  estado: 'pendiente' | 'entregado' | 'cancelado';
  created_at: string;
}

export interface Prospecto {
  id: string;
  distribuidora_id: string;
  nombre: string;
  telefono: string;
  estado: 'interesado' | 'en_proceso' | 'venta_cerrada';
  ultima_interaccion: string;
  created_at: string;
}

export interface Notificacion {
  id: string;
  distribuidora_id?: string; // Si es null, es para todas
  nivel_objetivo?: 'basica' | 'luxury' | 'elite' | 'todas';
  titulo: string;
  cuerpo: string;
  categoria: 'urgente' | 'promocion' | 'lanzamiento';
  leida: boolean;
  created_at: string;
}

/**
 * Verifica si el cliente de Supabase está correctamente configurado
 */
export async function verificarConexion(): Promise<boolean> {
  try {
    const { error } = await supabase.from('productos').select('id').limit(1)
    return !error;
  } catch {
    return false;
  }
}
