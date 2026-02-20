# Plan de Pruebas de Campo (Beta Cerrada) - Koppara Digital

Este documento guía a las vendedoras y al administrador a través de los flujos críticos de la aplicación para asegurar que todo funcione perfectamente antes del lanzamiento masivo.

---

## 📋 Instrucciones para Vendedoras (Testers)

**Objetivo:** Usar la aplicación como si estuvieran vendiendo en un día normal.
**Reporte:** Al finalizar, por favor llenen el [Formulario de Feedback](#formulario-de-feedback).

### ✅ Flujo 1: Registro y Acceso
*Prueba básica de identidad.*

1.  [ ] ** Paso 1:** Abrir la app en el navegador (Chrome/Safari).
2.  [ ] ** Paso 2:** Ir a "Membresía" o "Acceso" y registrarse/iniciar sesión usando el correo electrónico.
3.  [ ] ** Paso 3:** Verificar el correo, hacer clic en el enlace mágico (Magic Link) y regresar a la app.
    *   **Resultado Esperado:** Debes entrar automáticamente y ver tu nombre o "Socia" en la parte superior.

### ✅ Flujo 2: Catálogo Móvil
*Prueba de experiencia de usuario en celular.*

1.  [ ] ** Paso 1:** Navegar por el catálogo haciendo scroll hacia abajo.
2.  [ ] ** Paso 2:** Probar los filtros de categoría (ej. "Facial", "Corporal").
3.  [ ] ** Paso 3:** Usar la barra de búsqueda para encontrar un producto específico (ej. "Crema").
    *   **Resultado Esperado:** La búsqueda debe ser rápida y las imágenes deben cargar bien.

### ✅ Flujo 3: Compartir Herramientas de Venta
*Prueba del sistema de referidos.*

1.  [ ] ** Paso 1:** Entrar a tu perfil de "Socia" (botón superior).
2.  [ ] ** Paso 2:** Buscar el botón "Compartir Catálogo PDF vía WA" o copiar "Tu link único".
3.  [ ] ** Paso 3:** Enviárselo a un amigo o contacto de prueba en WhatsApp.
    *   **Resultado Esperado:** El mensaje de WhatsApp debe incluir tu enlace personalizado (revisar que termine en `?ref=TU_CODIGO`) y el texto debe ser legible y limpio.

### ✅ Flujo 4: Registro de Clientes (CRM)
*Prueba de cierre de ventas.*

1.  [ ] ** Paso 1:** En el catálogo, agregar 2 productos al carrito.
2.  [ ] ** Paso 2:** Abrir el carrito y dar clic en "Cerrar Venta WhatsApp".
3.  [ ] ** Paso 3:** Llenar el popup con el nombre de un cliente ficticio (ej. "María Prueba").
4.  [ ] ** Paso 4:** Confirmar.
5.  [ ] ** Paso 5:** Ir a tu perfil de Socia > Pestaña "Mis Clientes".
    *   **Resultado Esperado:** "María Prueba" debe aparecer en tu lista de clientes y el mensaje de WhatsApp debe estar listo para enviarse con el total calculado.

---

## 🛡️ Instrucciones para Administrador

### ✅ Flujo 5: Gestión de Red y Linaje
*Prueba de controles administrativos.*

1.  [ ] ** Paso 1:** Iniciar sesión con la cuenta admin (`wibbydashboard@gmail.com`).
2.  [ ] ** Paso 2:** Ir al panel "Maestro" (icono de escudo) > Pestaña "Red".
3.  [ ] ** Paso 3:** Buscar a una vendedora recién registrada (ej. la del Flujo 1).
4.  [ ] ** Paso 4:** Verificar que tenga su `ID Socio` (KP-26-XXX) y `Patrocinador` asignado (o Admin si es orgánico).
5.  [ ] ** Paso 5:** Usar el botón "Cambiar Patrocinador" para moverla bajo otra socia.
    *   **Resultado Esperado:** El sistema debe permitir el cambio, actualizar la tabla inmediatamente y bloquear si intentas asignarla a ella misma o crear un ciclo.

---

## 📝 Formulario de Feedback

*(Copia y pega este texto para enviarlo por WhatsApp al finalizar tus pruebas)*

```text
REPORTE DE PRUEBA KOPPARA (BETA)
------------------------------------------------
1. Nombre de la Vendedora: 
2. Equipo usado (iPhone/Android/PC): 
3. Navegador (Chrome/Safari/Otro): 

4. ¿Qué se te hizo difícil o confuso?
R: 

5. ¿En qué pantalla sentiste que te perdiste?
R: 

6. ¿Algún error "raro" que notaste?
R: 

7. calificación de la app (1-5): 
```
