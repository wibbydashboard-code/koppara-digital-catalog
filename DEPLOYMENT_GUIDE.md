# 🚀 Guía de Despliegue - Koppara Digital Catalog

Esta aplicación está construida con **Vite + React** y utiliza **Supabase** como backend. La mejor estrategia de despliegue es utilizar **Vercel** para el frontend, ya que es gratuito, rápido y se integra perfectamente con GitHub.

## 🛠️ Requisitos Previos
1. Una cuenta en [GitHub](https://github.com).
2. Una cuenta en [Vercel](https://vercel.com).
3. El código del proyecto subido a un repositorio de GitHub.

## 📦 Pasos para el Despliegue en Vercel

1. **Conectar el Repositorio**:
   - Inicia sesión en Vercel y haz clic en **"Add New"** > **"Project"**.
   - Importa tu repositorio de GitHub `koppara-digital-catalog`.

2. **Configuración del Framework**:
   - Vercel detectará automáticamente que es un proyecto de **Vite**.
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

3. **Variables de Entorno**:
   Aunque las llaves de Supabase están actualmente integradas para facilitar el desarrollo, se recomienda configurar las siguientes variables en la pestaña **"Environment Variables"** de Vercel:
   - `VITE_SUPABASE_URL`: Tu URL de Supabase.
   - `VITE_SUPABASE_ANON_KEY`: Tu llave anónima de Supabase.
   *(Nota: Si mantienes las llaves hardcodeadas en `src/lib/supabase.ts`, la app funcionará directamente sin configurar esto, pero es menos seguro).*

4. **Desplegar**:
   - Haz clic en **"Deploy"**. En menos de un minuto, tendrás tu URL de producción (ej: `koppara-catalog.vercel.app`).

## 🔍 Verificación de Salud (Healthchecks)

Puedes verificar que la aplicación esté funcionando correctamente visitando:
- **`https://tu-app.vercel.app/`**: Carga principal de la interfaz.
- **Consola del Navegador**: Busca el mensaje `✅ Conexión a Supabase exitosa` para confirmar que la base de datos está respondiendo.
- **Panel de Supabase**: Verifica que la tabla `productos` tenga datos para que el catálogo no aparezca vacío.

## 📈 Estructura de Rutas
La aplicación está configurada como una **SPA (Single Page Application)**. El archivo `vercel.json` ya incluye la regla de redirección para que cualquier ruta (como `/panel` o `/socias`) cargue correctamente el `index.html`.

---

## 💳 Siguientes Pasos: Mercado Pago vs Stripe

Una vez que la app esté en línea, podemos proceder con la integración de pagos. 

| Característica | **Stripe** | **Mercado Pago** |
| :--- | :--- | :--- |
| **Dificultad** | Media (API muy robusta) | Media (Documentación variada) |
| **Comisiones** | Estándar Global | Estándar Regional (Latam) |
| **Soporte Locales** | Excelente para USD/EUR | El estándar de oro en México/LATAM |

**Sugerencia**: Como Koppara ya tiene cuenta de Mercado Pago, la integración será más natural para el flujo de caja actual de la marca. Si decides por **Mercado Pago**, necesitaremos tus `ACCESS_TOKEN` y `PUBLIC_KEY` de producción del panel de desarrolladores.
