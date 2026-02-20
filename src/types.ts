
export interface Product {
  id: number;
  name: string;
  category: string;
  price: number;
  image: string;
  description: string;
  benefit: string;
  products: string[];
  tags: string[];
  sku?: string;
  ingredients?: string;
  usage?: string;
  certifications?: string[];
  presentation?: string;
}

export interface Distributor {
  id?: string;          // UUID de auth (presente cuando viene de Supabase)
  name: string;
  nombre?: string;      // Alias en español (para compatibilidad con lógica existente)
  phone: string;
  email?: string;
  isSocia?: boolean;
  nivel?: 'Básica' | 'Luxury' | 'Elite' | 'basica' | 'luxury' | 'elite';
  codigoReferido?: string;
  referidosActivos?: number;
  gananciasAcumuladas?: number;
  socioId?: string;
  organicLead?: boolean;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface ReferralRecord {
  id: string;
  nombreNuevaSocia: string;
  fecha: string;
  plan: string;
  comision: number;
  estatus: 'pagada' | 'pendiente';
}
