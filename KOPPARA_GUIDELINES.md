# 📄 KOPPARA_GUIDELINES.md

## 🎯 Visión del Proyecto
Plataforma de empoderamiento para distribuidoras de cosmética botánica, transformando un catálogo estático en un sistema de prospección y cierre de ventas automatizado. Koppara Digital no es solo un visualizador de productos, es una herramienta de ventas diseñada para maximizar la conversión y profesionalizar la red de socias.

---

## 🛠️ Stack & Skills (Habilidades Requeridas)
- **Frontend**: React.js con TypeScript para robustez tipográfica y prevención de errores en tiempo de ejecución.
- **Estilizado**: Tailwind CSS (configuración local) para consistencia de marca y diseño responsivo ultra-pro.
- **Backend & Auth**: Supabase (PostgreSQL) con manejo de **RLS (Row Level Security)** para proteger los leads y datos sensibles de las socias.
- **Generación de Documentos**: `jsPDF` y `html2canvas` configurados para renderizado de rejilla (grid) de **2 columnas** optimizado para móviles.
- **Integración de Comunicación**: Lógica de **Deep Linking** para WhatsApp Business, permitiendo mensajes personalizados sin dependencia de APIs de terceros.

---

## 🔄 Workflow de Desarrollo (Flujo de Trabajo)
1.  **Estado de Producto**: Todo nuevo producto inicia como `draft`. Solo el administrador puede visualizarlo y editarlo en el Panel Maestro. No es visible para socias hasta ser publicado.
2.  **Sincronización de Datos**: Cualquier cambio en **Precio Público** debe disparar el recálculo automático de los tres niveles de membresía:
    - **Básica**: 15% de margen.
    - **Luxury**: 25% de margen.
    - **Elite**: 35% de margen.
3.  **Ciclo de Publicación**: La regeneración del PDF oficial solo ocurre al presionar "Actualizar Catálogo Global" en el Panel Maestro, asegurando consistencia de precios.
4.  **Registro de Leads (Obligatorio)**: Ningún catálogo puede compartirse vía WhatsApp sin antes capturar el **Nombre** y **Número** del cliente en el CRM interno.

---

## 📏 Reglas de Oro (Branding & UX)
- **Logotipo**: Usar estrictamente `icon-512.png`. En el Navbar debe tener una altura fija de **64px**.
- **Tipografía**: Jerarquía clara; precios en negrita/mono y beneficios destacados con iconos **✓ verdes**.
- **Diseño de Catálogo**: Formato de **2 columnas** por página para eliminar espacios en blanco y optimizar el scroll en dispositivos móviles.
- **Alertas CRM**: Visualización en **rojo** para clientes que excedan las **48 horas** de inactividad (Seguimiento Pendiente).
- **Membresía Elite**: Resaltar el beneficio de "Envíos Gratis SIEMPRE" en el tono dorado específico (`#D4AF37`) o amarillo brillante en web (`#FFD700`).

---

## 📜 Historia y Aprendizajes (Log de Evolución)

### v1.0.0 (Feb 2026) - Lanzamiento y Estabilización
- **Aprendizaje**: El diseño original de 1 producto por página generaba un PDF demasiado largo y con muchos huecos, provocando abandono en móviles.
- **Ajuste**: Se implementó el formato de **2 columnas** y renderizado compacto.
- **Aprendizaje**: La marca perdía autoridad con logotipos pequeños o genéricos.
- **Ajuste**: Se escaló el logo a **54px** y se fijó el archivo `icon-512.png` como fuente única.
- **Aprendizaje**: Las socias perdían ventas por falta de seguimiento organizado.
- **Ajuste**: Creación del módulo **CRM Proactivo** con alertas de 48h y auto-registro de leads al compartir.
- **Seguridad**: Implementación de **Redirección RBAC** inmediata; el acceso a `/admin` está restringido estrictamente a cuentas con metadatos de administrador.

### v1.1.0 (Feb 2026) - Analítica y SEO de Nicho
- **Aprendizaje**: El término "Botánica" era demasiado genérico para resaltar el valor diferencial de la marca.
- **Ajuste**: Se actualizó el ADN del proyecto y el SEO (Open Graph) para posicionar a Koppara como **"Cosmética Orgánica hecha a base de coco"**, mejorando la previsualización en WhatsApp.
- **Aprendizaje**: El administrador necesitaba medir quién realmente vende y quién no para dirigir incentivos.
- **Ajuste**: Desarrollo de la sección **Estadísticas de Eficiencia** en `/admin`, con cálculo automático de tasas de conversión y ranking de líderes por monto cotizado.
- **UX**: Se estableció la regla de **bloqueo preventivo**; no se puede abrir el enlace de WhatsApp si los campos de registro de cliente están vacíos.

### v1.1.1 (Feb 2026) - Refinamiento de Header
- **Aprendizaje**: El logotipo a 54px se perdía visualmente debido al margen interno de la imagen original.
- **Ajuste**: Se escaló forzadamente a **64px** con altura fija y centrado flex absoluto dentro del Navbar.
- **Aprendizaje**: La barra de búsqueda competía por espacio con el logo en pantallas medianas.
- **Ajuste**: Se limitó el ancho de búsqueda a un **máximo de 300px** para dar "aire" al branding central.

### v1.1.2 (Feb 2026) - Estabilización de Despliegue
- **Aprendizaje**: El uso de `rewrites` en `vercel.json` puede causar errores 404 intermitentes al entrar directamente a rutas secundarias.
- **Ajuste**: Se migró a la configuración de `routes` con `{ "handle": "filesystem" }` para asegurar que Vercel sirva el `index.html` en cualquier ruta de la SPA.

---

## 📝 Instrucción para el Agente de IA
> **"Cada vez que realices una actualización en el código, es obligatorio documentar el cambio en la sección Historia y Aprendizajes de este archivo, especificando el problema resuelto y la nueva regla de uniformidad establecida."**
