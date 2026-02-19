
import { Product } from './types';

export const PRODUCTS: Product[] = [
  {
    id: 1,
    sku: "KOP-RSC-001",
    name: "Ritual Spa en Casa",
    category: "Relax",
    price: 850,
    image: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=800&q=80",
    description: "Transforma tu baño en un santuario privado. Experiencia de lujo sensorial elaborada con aceite de coco orgánico.",
    benefit: "Reset mental inmediato, relajación muscular profunda y nutrición cutánea intensiva.",
    products: ["Jabón Sal de Mar", "Sales de Baño Menta", "Soft Skin Lotion"],
    tags: ["relajante", "estrés", "regalo", "baño", "descanso"],
    ingredients: "Aceite de Coco Orgánico, Sal de Grano, Aceite Esencial de Menta Piperita.",
    usage: "Aplicar el jabón en piel húmeda, disolver sales en tina tibia y sellar con la loción corporal.",
    presentation: "Kit de 3 productos full size",
    certifications: ["Orgánico", "Kosher", "Cruelty-Free"]
  },
  {
    id: 6,
    sku: "KOP-FAC-002",
    name: "Protocolo Anti-Acné Clínico",
    category: "Facial",
    price: 1350,
    image: "/acne.png",
    description: "Recupera el control de tu piel sin agresividad. Fórmula de grado clínico basada en botánica avanzada.",
    benefit: "Seca brotes activos, reduce inflamación y previene marcas residuales.",
    products: ["Jabón Acnimed", "Sérum Seborregulador", "Mascarilla Carbón Activo"],
    tags: ["granos", "espinillas", "acné", "piel grasa", "puntos negros"],
    ingredients: "Ácido Salicílico Natural, Tea Tree, Carbón Activado Vegano, Aceite de Coco.",
    usage: "Limpieza matutina, sérum preventivo y mascarilla profunda 2 veces por semana.",
    presentation: "Tratamiento completo 60 días",
    certifications: ["Clínicamente Probado", "Orgánico"]
  },
  {
    id: 4,
    sku: "KOP-FAC-003",
    name: "Corrector de Manchas Nocturno",
    category: "Facial",
    price: 1250,
    image: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=800&q=80",
    description: "Ingeniería nocturna que borra el daño solar y unifica el tono facial.",
    benefit: "Despigmentación acelerada, luminosidad renovada y textura refinada.",
    products: ["Jabón Despigmed", "Sérum Vitamina C", "Mascarilla de Arroz"],
    tags: ["paño", "manchas", "sol", "tono desigual", "luminosidad"],
    ingredients: "Extracto de Arroz Orgánico, Vitamina C Estabilizada, Aceite de Coco Virgen.",
    usage: "Uso exclusivo nocturno. Aplicar sobre piel limpia antes de dormir.",
    presentation: "Tratamiento intensivo 30ml + 100g",
    certifications: ["Orgánico", "Libre de Hidroquinona"]
  },
  {
    id: 15,
    sku: "KOP-ESP-004",
    name: "Kit Sonrisa Perfecta",
    category: "Especializado",
    price: 650,
    image: "/kit_sonrisa.png",
    description: "Blanqueamiento natural sin dañar el esmalte dental. Fórmula zero-waste.",
    benefit: "Dientes visiblemente más blancos y aliento fresco prolongado.",
    products: ["Carbón Activado Dental", "Cepillo de Bambú", "Tabletas Dentales"],
    tags: ["dientes", "blanqueador", "sonrisa", "higiene bucal", "café"],
    ingredients: "Carbón de Cáscara de Coco, Menta Orgánica, Xilitol Natural.",
    usage: "Cepillado suave 2-3 veces por semana con el polvo de carbón.",
    presentation: "Envase de vidrio reutilizable",
    certifications: ["Vegano", "Fluoride Free"]
  },
  {
    id: 2,
    sku: "KOP-COR-005",
    name: "Kit Pies de Seda",
    category: "Corporal",
    price: 780,
    image: "https://images.unsplash.com/photo-1519415387722-a1c3bbef716c?auto=format&fit=crop&w=800&q=80",
    description: "Tratamiento intensivo para pies cansados, agrietados y con hiperqueratosis.",
    benefit: "Reparación profunda, suavidad extrema y eliminación de asperezas.",
    products: ["Jabón de Neem", "Sales Exfoliantes", "Ungüento Reparador"],
    tags: ["talones", "pies", "hongos", "pedicure", "suavidad"],
    ingredients: "Aceite de Neem Orgánico, Karité, Urea Natural, Coco.",
    usage: "Exfoliar durante el baño y aplicar el ungüento generosamente antes de dormir.",
    presentation: "Set de cuidado podológico",
    certifications: ["Orgánico", "Antifúngico Natural"]
  },
  {
    id: 12,
    sku: "KOP-VIT-012",
    name: "Tratamiento Vitíligo Natural",
    category: "Especializado",
    price: 1100,
    image: "/vitil.png",
    description: "Apoyo a la pigmentación mediante activos botánicos y aceite de coco orgánico.",
    benefit: "Ayuda a la repigmentación progresiva y protege zonas sensibles.",
    products: ["Jabón Vitíligo", "Crema Melalín", "Extracto Esencial"],
    tags: ["vitíligo", "despigmentación", "piel", "blanco", "tratamiento"],
    ingredients: "Psoralea Corylifolia, Aceite de Coco Extra Virgen, Esencia de Ammi Majus.",
    usage: "Uso diario constante. Consultar guía adjunta para exposición solar controlada.",
    presentation: "Kit de regeneración pigmentaria",
    certifications: ["Orgánico", "Botánica Pura"]
  }
];

export const CATEGORIES = ["Todos", "Facial", "Corporal", "Capilar", "Especializado", "Relax", "Eco"];
