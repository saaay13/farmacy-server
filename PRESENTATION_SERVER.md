# 🎤 Guía de Exposición: Backend (Server)

Esta guía te servirá como guion técnico para tu presentación del servidor.

---

## 🏗️ 1. Arquitectura y Stack (El Cimiento)
*Explica sobre qué está construido y por qué.*

- **Stack**: Node.js con Express y TypeScript (para robustez y tipado).
- **ORM**: **Prisma** con PostgreSQL. (Habla de las migraciones y la seguridad de tipos en la BD).
- **Diseño**: Arquitectura **POO (Orientada a Objetos)**. No solo son rutas, hay Clases (`models/`) que contienen la lógica de negocio real.

---

## 🔐 2. Seguridad y Roles (El Blindaje)
*Menciona cómo protegemos la farmacia.*

- **JWT (JSON Web Tokens)**: Sistema de autenticación sin estado.
- **Matriz de Permisos**: Controladores que verifican si eres `Admin`, `Staff` o `Cliente`.
- **Ejemplo**: "Un cliente no puede ver el stock de la sucursal, pero un administrador tiene control total sobre el personal".

---

## 🤖 3. Automatización Inteligente (El Valor Agregado)
*¡Este es el punto más fuerte! Menciona los Cron Jobs.*

- **Cron Jobs**: Tareas programadas que corren solas en el fondo.
- **Servicio de Alertas**: El sistema detecta automáticamente productos que van a vencer (60 días) y crea notificaciones.
- **Promociones Automáticas**: Si un producto está por vencer, el server crea una "Sugerencia de Descuento" del 15%.
- **Logística**: Algoritmos que sugieren reabastecimiento comparando las ventas de los últimos 30 días contra el stock actual.

---

## 🛣️ 4. Estructura de la API (El Mapa)
*Muestra brevemente los módulos principales.*

- **/auth**: Registro y login seguro con encriptación `bcrypt`.
- **/products**: Catálogo que filtra automáticamente medicamentos con receta para invitados.
- **/inventory**: Gestión de stock centralizada.
- **/sales**: Procesamiento de ventas que descuenta stock en tiempo real (evita sobreventa).

---

## 🚀 5. Scripts de Utilidad
*Demuestra profesionalismo.*

- **`init-db.ts`**: Script para poblar la base de datos con datos de prueba realistas en un clic.
- **`check-db.ts`**: Monitor de conexión a la base de datos.

---

## 💡 Consejos para la Demo
1. **Muestra el código de un Modelo**: (ej: `Usuario.ts` o `Producto.ts`) para que vean que usas Clases.
2. **Muestra una tabla de Prisma**: El `schema.prisma` es impresionante visualmente.
3. **Ejecuta el servidor**: Abre el terminal y muestra el mensaje: `🚀 Iniciando Servicio de Automatización...`. Eso demuestra que hay procesos inteligentes corriendo.

---
Porque PRISMA 
"Usamos Prisma porque actúa como una fuente única de verdad. En lugar de gestionar la base de datos por un lado y el código por otro, Prisma unifica ambos. Nos da seguridad de tipos, lo que significa que el compilador nos avisa si intentamos guardar un dato mal, y nos permite realizar consultas complejas de forma muy legible y eficiente."
