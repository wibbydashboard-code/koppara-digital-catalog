import { supabase, Producto } from '../lib/supabase';

type ProductoActualizado = Omit<Producto, 'id' | 'created_at'> & { activo?: boolean };

export const productosActualizados: ProductoActualizado[] = [
  {
    referencia: 'KOP-SPA-001',
    nombre: 'Kit Spa en Casa',
    categoria: 'Relax',
    descripcion: 'Transforma tu bano en un santuario privado de lujo. Este ritual completo te envuelve en aromaterapia relajante mientras exfolia, nutre y renueva tu piel, revelando una version mas suave y radiante de ti.',
    precio: 850.0,
    precio_distribuidor: 637.5,
    imagen_url: 'https://sdxngqnqlwbqdpqcltim.supabase.co/storage/v1/object/public/productos-imagenes/kit-spa-casa.jpg',
    beneficios: [
      'Reset mental inmediato con aromaterapia de menta',
      'Exfoliacion profunda que elimina celulas muertas',
      'Hidratacion intensiva que dura 48 horas',
      'Piel visiblemente mas tersa y luminosa desde el primer uso'
    ],
    modo_uso: 'Ritual de 20 minutos: 1) Aplica el jabon de sal sobre piel humeda con movimientos circulares. 2) Disuelve las sales de mar en tu tina con agua tibia y sumergete 15 minutos. 3) Sella la hidratacion con Soft Skin en todo el cuerpo.',
    ingredientes: ['Jabon de Sal 100g', 'Sales de Mar con Aceite Esencial de Menta', 'Soft Skin 150ml', 'Aceite de Coco Organico', 'Extractos Botanicos'],
    certificaciones: ['Organico Certificado', 'Cruelty-Free', 'Vegano', 'Sin Parabenos'],
    rituales: ['Nocturno', 'Fin de semana', 'Self-care'],
    activo: true
  },
  {
    referencia: 'KOP-PIES-002',
    nombre: 'Kit Spa de Pies',
    categoria: 'Corporal',
    descripcion: 'Pies renovados que conquistan cualquier camino. Tratamiento profesional de 4 pasos que elimina callosidades, neutraliza olores y devuelve suavidad extrema. Como un spa de lujo, pero en tu hogar.',
    precio: 920.0,
    precio_distribuidor: 690.0,
    imagen_url: 'https://sdxngqnqlwbqdpqcltim.supabase.co/storage/v1/object/public/productos-imagenes/kit-spa-pies.jpg',
    beneficios: [
      'Elimina malos olores y sudoracion excesiva desde la primera aplicacion',
      'Suaviza y remueve callosidades rebeldes',
      'Estimula la circulacion y desinflama pies cansados',
      'Repara talones agrietados en 7 dias de uso constante'
    ],
    modo_uso: 'Protocolo spa semanal: 1) Lava con jabon de Neem y Arbol del Te. 2) Remoja 15 min en agua tibia con sales de menta. 3) Exfolia con cascara de coco en movimientos circulares. 4) Aplica tratamiento de pies antes de dormir con calcetines de algodon.',
    ingredientes: ['Jabon de Neem y Arbol del Te', 'Sales de Mar con Menta', 'Exfoliante de Cascara de Coco', 'Tratamiento Crema-Unguento'],
    certificaciones: ['Antiseptico Natural', 'Dermatologicamente Probado', 'Libre de Quimicos Agresivos'],
    rituales: ['Semanal', 'Nocturno', 'Cuidado intensivo'],
    activo: true
  },
  {
    referencia: 'KOP-DEPIL-003',
    nombre: 'Kit Depilatorio Profesional',
    categoria: 'Corporal',
    descripcion: 'Depilar nunca fue tan facil ni tan efectivo. Sistema completo que depila sin dolor, retarda el crecimiento del vello y deja tu piel sedosa. Olvidate de las banditas y la irritacion.',
    precio: 780.0,
    precio_distribuidor: 585.0,
    imagen_url: 'https://sdxngqnqlwbqdpqcltim.supabase.co/storage/v1/object/public/productos-imagenes/kit-depilatorio.jpg',
    beneficios: [
      'Depilacion sin banditas, sin dolor y sin irritacion',
      'Retarda el crecimiento del vello hasta 25% con uso continuo',
      'Elimina rojeces e inflamacion en minutos',
      'Reduce gradualmente la frecuencia de depilacion'
    ],
    modo_uso: 'Sistema de 3 pasos: 1) Limpia el area con jabon de curcuma. 2) Aplica cera tibia con espatula y retira en direccion contraria al vello. 3) Calma y nutre inmediatamente con Soft Skin para eliminar residuos y rojeces.',
    ingredientes: ['Jabon de Curcuma', 'Cera Depilatoria 120g con Extractos Botanicos', 'Soft Skin 150ml', 'Aceites Antisepticos'],
    certificaciones: ['Sin Quimicos Agresivos', 'Formula Botanica', 'Antiseptico Natural'],
    rituales: ['Quincenal', 'Mensual', 'Cuidado personal'],
    activo: true
  },
  {
    referencia: 'KOP-MANCH-NOC-004',
    nombre: 'Kit Anti-Manchas Nocturno',
    categoria: 'Facial',
    descripcion: 'Tu piel trabaja mientras tu descansas. Ingenieria nocturna con acido kojico y activos despigmentantes que borran manchas, unifican el tono y revelan luminosidad natural. Despierta con una piel renovada.',
    precio: 1350.0,
    precio_distribuidor: 1012.5,
    imagen_url: 'https://sdxngqnqlwbqdpqcltim.supabase.co/storage/v1/object/public/productos-imagenes/kit-manchas-nocturno.jpg',
    beneficios: [
      'Atenua manchas, pano y melasma de forma progresiva',
      'Unifica el tono y aporta luminosidad visible en 21 dias',
      'Regenera la piel mientras duermes con activos concentrados',
      'Efecto tensor que suaviza lineas de expresion'
    ],
    modo_uso: 'Ritual nocturno de 4 pasos: 1) Limpia con jabon Despigmed. 2) Exfolia 2 veces por semana con limon-cafe. 3) Aplica mascarilla de arroz 10 min (2 veces/semana). 4) Sella con serum Despigmed todas las noches antes de dormir.',
    ingredientes: ['Jabon Despigmed con Acido Kojico', 'Exfoliante Limon-Cafe', 'Mascarilla de Arroz', 'Serum Despigmed', 'Arroz Fermentado'],
    certificaciones: ['Dermatologicamente Probado', 'Libre de Hidroquinona', 'Activos Naturales Concentrados'],
    rituales: ['Nocturno', 'Tratamiento intensivo 28 dias', 'Renovacion celular'],
    activo: true
  },
  {
    referencia: 'KOP-MANCH-DIA-005',
    nombre: 'Kit Anti-Manchas de Dia',
    categoria: 'Facial',
    descripcion: 'Tu escudo diario contra las manchas. Protege, aclara y previene con FPS 50 mientras mejoras tu tono. Koppara es tu aliada contra el sol, el pano y la hiperpigmentacion.',
    precio: 1280.0,
    precio_distribuidor: 960.0,
    imagen_url: 'https://sdxngqnqlwbqdpqcltim.supabase.co/storage/v1/object/public/productos-imagenes/kit-manchas-dia.jpg',
    beneficios: [
      'Proteccion solar FPS 50 UVA/UVB de amplio espectro',
      'Previene nuevas manchas mientras aclara las existentes',
      'Hidratacion profunda con acido hialuronico de 48 horas',
      'Formula ligera no grasa, perfecta para uso bajo maquillaje'
    ],
    modo_uso: 'Rutina matutina de 4 pasos: 1) Limpia con jabon de fresa. 2) Tonifica con agua de rosas + acido hialuronico. 3) Aplica crema Derma Aclarant en areas con manchas. 4) Protege todo el rostro con bloqueador FPS 50. Reaplica el bloqueador cada 4 horas.',
    ingredientes: ['Jabon de Fresa', 'Agua de Rosas + Acido Hialuronico', 'Crema Derma Aclarant', 'Bloqueador FPS 50 con Vitamina E'],
    certificaciones: ['FPS 50 Certificado', 'Antioxidante Vitamina E', 'Libre de Parabenos'],
    rituales: ['Diario', 'Matutino', 'Proteccion continua'],
    activo: true
  },
  {
    referencia: 'KOP-ACNE-006',
    nombre: 'Kit Anti-Acne Clinico',
    categoria: 'Facial',
    descripcion: 'Adios al acne. Hola a la confianza. Sistema de 5 pasos de grado clinico que combate la bacteria causante, seca brotes activos, previene marcas y restaura tu piel. Resultados visibles en 14 dias.',
    precio: 1420.0,
    precio_distribuidor: 1065.0,
    imagen_url: 'https://sdxngqnqlwbqdpqcltim.supabase.co/storage/v1/object/public/productos-imagenes/kit-anti-acne.jpg',
    beneficios: [
      'Combate la bacteria P. acnes desde la raiz del problema',
      'Seca brotes activos y previene nuevos en 72 horas',
      'Atenua marcas y cicatrices con baba de caracol regenerativa',
      'Controla grasa excesiva y afina poros dilatados'
    ],
    modo_uso: 'Protocolo completo: Manana - limpia con Acnimed, aplica serum en brotes. Noche - limpia, exfolia (3 veces/semana), aplica serum Acnimed, hidrata con crema de baba de caracol. Mascarilla de carbon 2 veces/semana por 15 min.',
    ingredientes: ['Jabon Acnimed', 'Exfoliante Antiacne', 'Serum Acnimed Concentrado', 'Crema de Baba de Caracol', 'Mascarilla Carbon Activado + Colageno'],
    certificaciones: ['Antiseptico Clinico', 'Dermatologicamente Probado', 'No Comedogenico', 'Testado en Pieles Sensibles'],
    rituales: ['Diario', 'Matutino y nocturno', 'Tratamiento 60 dias'],
    activo: true
  },
  {
    referencia: 'KOP-CABEL-007',
    nombre: 'Kit Cabello Hermoso',
    categoria: 'Capilar',
    descripcion: 'Revive tu cabello desde la raiz hasta las puntas. Sistema profesional que detiene la caida, aporta brillo espejo y desenreda sin esfuerzo. Nota la diferencia desde el primer lavado.',
    precio: 890.0,
    precio_distribuidor: 667.5,
    imagen_url: 'https://sdxngqnqlwbqdpqcltim.supabase.co/storage/v1/object/public/productos-imagenes/kit-cabello.jpg',
    beneficios: [
      'Frena la caida fortaleciendo el foliculo piloso desde la raiz',
      'Brillo espejo intenso y sedosidad al tacto desde el primer uso',
      'Protege el color en cabellos tenidos por mas tiempo',
      'Controla el frizz y ofrece proteccion termica hasta 230C'
    ],
    modo_uso: 'Ritual capilar: 1) Lava con shampoo Stop Caida con masaje circular de 3 minutos. 2) Aplica acondicionador Bright Hair de medios a puntas, deja actuar 2 min. 3) Despues del secado, aplica 2-3 gotas de Silk Hair Plus en manos y distribuye en cabello humedo o seco.',
    ingredientes: ['Shampoo Stop Caida', 'Acondicionador Solido Bright Hair', 'Silk Hair Plus (Seda Vitaminica)', 'Extractos Botanicos'],
    certificaciones: ['Sin Sulfatos Agresivos', 'Sin Parabenos', 'Proteccion Termica', 'Color Safe'],
    rituales: ['Diario', 'Lavado 2-3 veces/semana', 'Recuperacion capilar'],
    activo: true
  },
  {
    referencia: 'KOP-ANTIAGE-NOC-008',
    nombre: 'Kit Anti-Edad Nocturno',
    categoria: 'Facial',
    descripcion: 'Haz que el tiempo retroceda en tu piel. Nutricion profunda anti-edad con rosa mosqueta y aceites regenerativos que actuan mientras duermes. Despierta con un rostro visiblemente mas joven y luminoso.',
    precio: 1180.0,
    precio_distribuidor: 885.0,
    imagen_url: 'https://sdxngqnqlwbqdpqcltim.supabase.co/storage/v1/object/public/productos-imagenes/kit-antiedad-noche.jpg',
    beneficios: [
      'Regeneracion celular nocturna intensiva con rosa mosqueta',
      'Suaviza arrugas y lineas de expresion en 30 dias',
      'Reafirma y mejora la elasticidad perdida por el tiempo',
      'Aclara el tono y unifica la textura de la piel'
    ],
    modo_uso: 'Ritual nocturno anti-edad: 1) Limpia con jabon de rosa mosqueta. 2) Exfolia con limon-cafe 2 veces/semana. 3) Aplica Back Time Oil en rostro, cuello y escote con movimientos ascendentes. Masajea hasta completa absorcion. Usa todas las noches para resultados optimos.',
    ingredientes: ['Jabon de Rosa Mosqueta', 'Exfoliante Limon-Cafe', 'Back Time Oil (Aceite Anti-Edad Intensivo)', 'Vitamina E', 'Antioxidantes Naturales'],
    certificaciones: ['Anti-Aging Certificado', 'Aceites Puros Prensados en Frio', 'Libre de Quimicos Sinteticos'],
    rituales: ['Nocturno', 'Tratamiento continuo', 'Regeneracion profunda'],
    activo: true
  },
  {
    referencia: 'KOP-ANTIAGE-DIA-009',
    nombre: 'Kit Anti-Edad de Dia',
    categoria: 'Facial',
    descripcion: 'Cuida hoy la piel que luciras manana. Proteccion solar FPS 50 + tratamiento anti-edad con colageno y elastina. Previene arrugas mientras hidratas y proteges tu inversion mas valiosa: tu piel.',
    precio: 1250.0,
    precio_distribuidor: 937.5,
    imagen_url: 'https://sdxngqnqlwbqdpqcltim.supabase.co/storage/v1/object/public/productos-imagenes/kit-antiedad-dia.jpg',
    beneficios: [
      'Proteccion solar anti-envejecimiento FPS 50 con vitamina E',
      'Hidratacion profunda con acido hialuronico que rellena arrugas',
      'Mejora la elasticidad con colageno y elastina desde el primer uso',
      'Previene el envejecimiento prematuro causado por el sol'
    ],
    modo_uso: 'Rutina matutina anti-edad: 1) Limpia con jabon de colageno. 2) Tonifica con agua de rosas + acido hialuronico. 3) Aplica crema facial Anti Age con movimientos ascendentes. 4) Protege con bloqueador FPS 50 en rostro, cuello y escote. Reaplica cada 4 horas.',
    ingredientes: ['Jabon de Colageno', 'Agua de Rosas + Acido Hialuronico', 'Crema Facial Anti Age', 'Bloqueador FPS 50 con Vitamina E', 'Rosa Mosqueta', 'Elastina'],
    certificaciones: ['FPS 50 Amplio Espectro', 'Colageno Hidrolizado', 'Anti-Aging Dermatologico'],
    rituales: ['Diario', 'Matutino', 'Prevencion continua'],
    activo: true
  },
  {
    referencia: 'KOP-ANTIESTR-010',
    nombre: 'Kit Anti-Estres Spa',
    categoria: 'Relax',
    descripcion: 'Relaja tu cuerpo, calma tu mente. Experiencia aromaterapica completa con sinergia de aceites esenciales que desactivan el estres acumulado. Convierte tu hogar en un refugio de paz.',
    precio: 1450.0,
    precio_distribuidor: 1087.5,
    imagen_url: 'https://sdxngqnqlwbqdpqcltim.supabase.co/storage/v1/object/public/productos-imagenes/kit-antiestres.jpg',
    beneficios: [
      'Reset mental inmediato con aromaterapia clinica',
      'Reduce cortisol (hormona del estres) en 20 minutos',
      'Promueve sueno profundo y reparador',
      'Hidratacion profunda con aceite de coco organico'
    ],
    modo_uso: 'Ritual anti-estres completo: 1) Enciende el difusor con 5-7 gotas de sinergia anti-estres. 2) Bano con jabon relajante con masaje circular. 3) Aplica hidratante para masaje con movimientos lentos y profundos. Para uso diario: aplica sinergia en puntos de pulso (munecas, cuello, sienes).',
    ingredientes: ['Jabon Relajante Anti-Estres', 'Hidratante para Masaje con Coco Organico', 'Sinergia de Aromaterapia (Lavanda, Bergamota, Ylang Ylang)', 'Difusor Electrico de Aromaterapia'],
    certificaciones: ['Aromaterapia Certificada', 'Aceites Esenciales Puros', 'Organico', 'Terapeutico'],
    rituales: ['Nocturno', 'Relajacion profunda', 'Meditacion', 'Pre-sleep'],
    activo: true
  },
  {
    referencia: 'KOP-AROMA-011',
    nombre: 'Kit Aromaterapia Premium',
    categoria: 'Especializado',
    descripcion: 'Energia positiva para cada rincon. Coleccion de 5 esencias premium que transforman tu espacio y elevan tu estado de animo. Desde enfoque mental hasta relajacion profunda, cada aroma tiene su proposito.',
    precio: 1680.0,
    precio_distribuidor: 1260.0,
    imagen_url: 'https://sdxngqnqlwbqdpqcltim.supabase.co/storage/v1/object/public/productos-imagenes/kit-aromaterapia.jpg',
    beneficios: [
      'Menta: Despeja la mente y promueve claridad mental',
      'Cafe: Energiza y mejora el enfoque en trabajo/estudio',
      'Melissa: Calma la ansiedad y equilibra emociones',
      'Verbena y Te Blanco: Eleva el animo y aporta optimismo',
      'Sinergia Anti-Estres: Relaja profundamente cuerpo y mente'
    ],
    modo_uso: 'Programa aromas segun tu necesidad: Manana - Cafe o Verbena para energizar. Tarde - Menta para concentracion. Noche - Melissa o Anti-Estres para relajar. Agrega 5-7 gotas al difusor con agua. Sesiones de 30-60 minutos. Alterna aromas segun tu mood.',
    ingredientes: ['5 Esencias Concentradas (10ml c/u)', 'Menta Piperita', 'Extracto de Cafe', 'Melissa Officinalis', 'Verbena y Te Blanco', 'Sinergia Anti-Estres', 'Difusor Electrico Ultrasonico'],
    certificaciones: ['Aceites Esenciales 100% Puros', 'Grado Terapeutico', 'Sin Sinteticos'],
    rituales: ['Diario', 'Ambiente laboral', 'Meditacion', 'Yoga', 'Estudio'],
    activo: true
  },
  {
    referencia: 'KOP-MIRADA-012',
    nombre: 'Kit Mirada Hermosa',
    categoria: 'Facial',
    descripcion: 'Dile adios a bolsas, ojeras y arrugas. Tratamiento especializado de contorno de ojos que desinflama, ilumina y alarga pestanas. Una mirada descansada y rejuvenecida en 21 dias.',
    precio: 980.0,
    precio_distribuidor: 735.0,
    imagen_url: 'https://sdxngqnqlwbqdpqcltim.supabase.co/storage/v1/object/public/productos-imagenes/kit-mirada.jpg',
    beneficios: [
      'Reduce bolsas y ojeras visiblemente en 21 dias',
      'Alarga y fortalece pestanas con activos botanicos',
      'Suaviza patas de gallo y lineas de expresion',
      'Hidratacion profunda que no migra al ojo'
    ],
    modo_uso: 'Ritual de contorno: Manana y noche - limpia con jabon de cafe. Noche - aplica NobelLash en pestanas limpias. Manana y noche - aplica Eyeraser liquida con toquecitos suaves. Sella con balsamo Eyeraser en zona de ojeras y bolsas. No frotar, dar toquecitos ligeros.',
    ingredientes: ['Jabon de Cafe Reafirmante', 'Tratamiento NobelLash', 'Crema Eyeraser Liquida', 'Balsamo Eyeraser', 'Cafeina', 'Peptidos'],
    certificaciones: ['Oftalmologicamente Probado', 'Hipoalergenico', 'Sin Fragancias Agresivas'],
    rituales: ['Diario', 'Matutino y nocturno', 'Cuidado especializado'],
    activo: true
  },
  {
    referencia: 'KOP-VITIL-013',
    nombre: 'Kit Vitiligo Especializado',
    categoria: 'Especializado',
    descripcion: 'El vitiligo no se quita solo: tratalo hoy y dale a tu piel la oportunidad de regenerarse. Sistema unico con aceite de moringa y activos que estimulan melanocitos. Constancia + paciencia = resultados.',
    precio: 1580.0,
    precio_distribuidor: 1185.0,
    imagen_url: 'https://sdxngqnqlwbqdpqcltim.supabase.co/storage/v1/object/public/productos-imagenes/kit-vitiligo.jpg',
    beneficios: [
      'Estimula la produccion natural de melanocitos',
      'Protege las celulas de estres oxidativo con moringa',
      'Favorece la repigmentacion progresiva en 90 dias',
      'Aporta mas de 42 aminoacidos esenciales para salud celular'
    ],
    modo_uso: 'Tratamiento de 90 dias: 1) Limpia areas afectadas con jabon Vitiligo. 2) Aplica crema tratamiento 2 veces al dia con masaje suave. 3) Sella con aceite de moringa + vitamina E. Exposicion solar controlada de 15 min diarios (manana o tarde). Constancia es clave.',
    ingredientes: ['Jabon Vitiligo', 'Tratamiento en Crema Vitiligo', 'Aceite Puro de Semilla de Moringa + Vitamina E', 'Activos Naturales Concentrados'],
    certificaciones: ['Dermatologicamente Probado', 'Activos Naturales', '100% Organico', 'Sin Quimicos Agresivos'],
    rituales: ['Diario', 'Tratamiento prolongado 90 dias', 'Exposicion solar controlada'],
    activo: true
  },
  {
    referencia: 'KOP-ZEROWASTE-014',
    nombre: 'Kit Cero Waste Consciente',
    categoria: 'Eco',
    descripcion: 'Belleza consciente que cuida tu piel y el planeta. Formato solido sin envases plasticos, con activos puros que hidratan, fortalecen y nutren. Cada producto dura 3 meses. Sostenibilidad sin sacrificar lujo.',
    precio: 850.0,
    precio_distribuidor: 637.5,
    imagen_url: 'https://sdxngqnqlwbqdpqcltim.supabase.co/storage/v1/object/public/productos-imagenes/kit-zero-waste.jpg',
    beneficios: [
      'Cero residuos plasticos - 100% biodegradable',
      'Concentracion 3x mayor que versiones liquidas',
      'Cada producto dura 3-4 meses (equivale a 3 botes plasticos)',
      'Fortalece cabello, previene caida y nutre profundamente'
    ],
    modo_uso: 'Uso sostenible: Shampoo solido - frota en cabello mojado, masajea y enjuaga. Acondicionador - aplica de medios a puntas, deja 2 min. Jabon de lavanda - uso corporal diario. Crema solida - calienta en manos y aplica en piel limpia. Guarda en superficies secas entre usos.',
    ingredientes: ['Jabon de Lavanda', 'Shampoo Solido Anti-Caida', 'Acondicionador Solido Bright Hair', 'Crema Solida Beso de Angel', 'Mantecas Naturales', 'Sin Conservadores'],
    certificaciones: ['Cero Waste', 'Vegano', 'Cruelty-Free', 'Biodegradable', 'Sin Envases Plasticos', 'Organico'],
    rituales: ['Diario', 'Sustentable', 'Minimalista', 'Eco-friendly'],
    activo: true
  },
  {
    referencia: 'KOP-SONRISA-015',
    nombre: 'Kit Sonrisa Perfecta',
    categoria: 'Especializado',
    descripcion: 'Impacta con tu sonrisa. Sistema natural de blanqueamiento con carbon activado que elimina manchas sin danar el esmalte. Aliento fresco duradero y dientes visiblemente mas blancos en 15 dias.',
    precio: 650.0,
    precio_distribuidor: 487.5,
    imagen_url: 'https://sdxngqnqlwbqdpqcltim.supabase.co/storage/v1/object/public/productos-imagenes/kit-sonrisa.jpg',
    beneficios: [
      'Blanqueamiento natural sin sensibilidad dental',
      'Elimina manchas de cafe, te y vino en 15 dias',
      'Neutraliza mal aliento y cuida encias',
      'Alternativa eco-friendly a blanqueamientos quimicos'
    ],
    modo_uso: 'Rutina dental natural: 1) Humedece cepillo de bambu y sumerge en Dental Powder. 2) Cepilla 2-3 min con movimientos suaves circulares. 3) Enjuaga bien. 4) Mastica tableta de enjuague hasta disolverse (sin agua). Usar 2-3 veces/semana para blanqueamiento, diario para mantenimiento.',
    ingredientes: ['Cepillo Dental de Bambu', 'Dental Powder de Carbon Activado', 'Tabletas de Enjuague Bucal', 'Extractos Naturales'],
    certificaciones: ['Sin Fluor', 'Vegano', 'Biodegradable', 'Libre de Quimicos Blanqueadores'],
    rituales: ['Diario', 'Blanqueamiento natural', 'Cuidado dental consciente'],
    activo: true
  }
];

export async function actualizarProductosEnSupabase(
  productos: ProductoActualizado[],
  onProgress?: (current: number, total: number) => void
) {
  if (!productos.length) return [] as Producto[];

  const updated: Producto[] = [];
  const total = productos.length;

  for (let index = 0; index < productos.length; index += 1) {
    const item = productos[index];
    const payload = {
      ...item,
      activo: item.activo ?? true
    };

    const { data, error } = await supabase
      .from('productos')
      .upsert(payload, { onConflict: 'referencia' })
      .select();

    if (error) throw error;
    if (data) updated.push(...(data as Producto[]));
    if (onProgress) onProgress(index + 1, total);
  }

  return updated;
}
