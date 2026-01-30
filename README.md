# Store Farmacy Server - Backend Profesional 🚀

Sistema de gestión integral e inteligente para farmacias multisucursal, desarrollado con Node.js, Express, Prisma y PostgreSQL. Ahora con arquitectura orientada a objetos (POO) y automatización avanzada.

## 🛠️ Tecnologías y Versiones

### Núcleo
- **Runtime**: Node.js (v18+)
- **Lenguaje**: TypeScript ^5.9.3
- **Framework**: Express ^5.2.1
- **ORM**: Prisma ^6.3.0
- **Base de Datos**: PostgreSQL

### Dependencias Principales
- **bcryptjs** (^3.0.3): Encriptación de contraseñas.
- **jsonwebtoken** (^9.0.3): Autenticación basada en tokens (JWT).
- **node-cron** (^3.0.3): Automatización de tareas programadas.
- **cors** (^2.8.6): Configuración de recursos cruzados.
- **dotenv** (^17.2.3): Gestión de variables de entorno.

### Desarrollo
- **ts-node** (^10.9.2): Ejecución directa de TypeScript.
- **nodemon** (^3.1.11): Reinicio automático del servidor.

---

## ⚙️ Configuración del Proyecto

### 1. Variables de Envorno
Crea un archivo `.env` en la raíz de la carpeta `/server`:
```env
DATABASE_URL="postgresql://USUARIO:PASSWORD@localhost:5432/farmacia?schema=farmacy"
JWT_SECRET="tu_clave_secreta_aqui"
```

### 2. Instalación y Ejecución
```bash
npm install
npx prisma generate
npm run dev
```
El servidor estará disponible en `http://localhost:3001`

---

## ✨ Características de Inteligencia y Seguridad

### 1. Blindaje Operativo
- **Bloqueo de Vencidos**: No se permite la venta de productos caducados (Implementado en `SaleService`).
- **Control de Recetas**: Validación por rol para medicamentos que requieren receta médica.
- **Auditoría de Intentos**: Registro automático de intentos de venta bloqueados (por stock, receta, vencimiento o inactividad) en la tabla `IntentoBloqueado`.
- **Privacidad "Data Owner"**: Los clientes solo visualizan sus propias compras y un catálogo restringido.

### 2. Automatización (Cron Jobs)
- **Servicio de Alertas**: Escaneo diario de vencimientos próximos (60 días) y stock crítico.
- **Promociones Automáticas**: Generación de sugerencias de descuento (15%) para evitar pérdidas por caducidad.
- **Control Sabatino**: Automatización del cumplimiento de inventario todos los sábados a las 23:59.

### 3. Logística
- **Reabastecimiento**: Análisis inteligente de ventas vs stock.
- **Reportes Críticos**: Stock bajo y vencimientos.

---

## 🛣️ Estructura de la API

| Módulo | Endpoint Base | Funcionalidad Clave |
| :--- | :--- | :--- |
| **Auth** | `/api/auth` | Registro y Login con JWT (Roles) |
| **Productos** | `/api/products` | Catálogo inteligente y filtros de seguridad |
| **Inventario** | `/api/inventory` | Gestión de stock por sucursal |
| **Lotes** | `/api/batches` | Sistema FIFO con fechas de vencimiento |
| **Ventas** | `/api/sales` | Procesamiento transaccional enriquecido |
| **Logística** | `/api/logistics` | Reabastecimiento inteligente y reportes |
| **Promociones**| `/api/promotions`| Gestión y aprobación de descuentos |
| **Alertas**     | `/api/alerts`     | Visualización de notificaciones del sistema |
| **Bloqueos**   | `/api/blocked-attempts` | Auditoría de intentos de venta fallidos |

---

## 🔐 Seguridad y Roles (Matriz de Permisos)

| Recurso | Administrador | Farmacéutico | Vendedor | Cliente |
| :--- | :--- | :--- | :--- | :--- |
| **Usuarios** | CRUD Total | Ver perfil propio | Registra Clientes | Ver perfil propio |
| **Productos** | CRUD Total | Ver catálogo | Ver catálogo | Ver catálogo* |
| **Inventario** | CRUD Total | Actualizar Stock | Ver stock | Sin acceso |
| **Lote** | CRUD Total | Alta/Baja Lotes | Ver lotes | Sin acceso |
| **Ventas**     | Supervisión   | Realizar Venta | Realizar Venta | Ver sus compras |
| **Logística**  | CRUD Total    | Ver Reportes   | Sin acceso     | Sin acceso      |
| **Bloqueos**   | Gestión Total | Ver Reportes   | Sin acceso     | Sin acceso      |

> [!NOTE]
> * **Privacidad de Clientes**: Filtrado automático de:
>   - Medicamentos con receta (se muestran con advertencia informativa)
>   - Productos próximos a vencer **SIN** promoción aprobada
>   - Productos con **promociones aprobadas SÍ son visibles** (para incentivar ventas antes del vencimiento)

---

## ✅ Objetivos Cumplidos

- **POO**: Arquitectura basada en clases y servicios.
- **Negocio**: FIFO y validación de roles.
- **Automatización**: Alertas y promociones automáticas.
- **Logística**: Asistente de compras inteligente.
