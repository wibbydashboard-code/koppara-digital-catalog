import { supabase, Producto } from './supabase';
import { Product } from './types';

/**
 * Mapea un objeto de la base de datos al formato esperado por el frontend
 */
function mapDBToProduct(p: Producto): Product {
  return {
    id: p.id as any, // Manejamos el UUID como string/number según el tipo anterior
    name: p.nombre,
    category: p.categoria,
    price: p.precio,
    image: p.imagen_url,
    description: p.descripcion,
    benefit: p.beneficios?.join(', ') || '',
    products: p.rituales || [],
    tags: [p.referencia, p.categoria],
    sku: p.referencia,
    ingredients: p.ingredientes?.join(', '),
    usage: p.modo_uso,
    certifications: p.certificaciones
  };
}

/**
 * Obtiene todos los productos activos de Supabase
 */
export async function obtenerProductos(): Promise<Product[]> {
  try {
    const { data, error } = await supabase
      .from('productos')
      .select('*')
      .eq('activo', true)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    return (data as Producto[]).map(mapDBToProduct);
  } catch (error) {
    console.error('Error en obtenerProductos:', error);
    return [];
  }
}

/**
 * Busca productos por texto en nombre o descripción
 */
export async function buscarProductos(query: string): Promise<Product[]> {
  try {
    const { data, error } = await supabase
      .from('productos')
      .select('*')
      .eq('activo', true)
      .or(`nombre.ilike.%${query}%,descripcion.ilike.%${query}%`);
    
    if (error) throw error;
    return (data as Producto[]).map(mapDBToProduct);
  } catch (error) {
    console.error('Error en buscarProductos:', error);
    return [];
  }
}
