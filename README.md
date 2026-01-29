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
- **Privacidad "Data Owner"**: Los clientes solo visualizan sus propias compras y un catálogo restringido.

### 2. Automatización (Cron Jobs)
- **Servicio de Alertas**: Escaneo diario de vencimientos próximos (60 días) y stock crítico.
- **Promociones Automáticas**: Generación de sugerencias de descuento (15%) para evitar pérdidas por caducidad.
- **Control Sabatino**: Automatización del cumplimiento de inventario todos los sábados a las 23:59.

### 3. Logística Avanzada
- **Sugerencias de Reabastecimiento**: Análisis inteligente de ventas (últimos 30 días) vs stock actual.
- **Reportes Críticos**: Endpoint centralizado para visualizar productos con stock bajo y lotes por vencer.

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
| **Alertas** | `/api/alerts` | Visualización de notificaciones del sistema |

---

## 🔐 Seguridad y Roles (Matriz de Permisos)

| Recurso | Administrador | Farmacéutico | Vendedor | Cliente |
| :--- | :--- | :--- | :--- | :--- |
| **Usuarios** | CRUD Total | Ver perfil propio | Registra Clientes | Ver perfil propio |
| **Productos** | CRUD Total | Ver catálogo | Ver catálogo | Ver catálogo* |
| **Inventario** | CRUD Total | Actualizar Stock | Ver stock | Sin acceso |
| **Lote** | CRUD Total | Alta/Baja Lotes | Ver lotes | Sin acceso |
| **Ventas** | Supervisión | Realizar Venta | Realizar Venta | Ver sus compras |
| **Logística** | CRUD Total | Ver Reportes | Sin acceso | Sin acceso |

> [!NOTE]
> * **Privacidad de Clientes**: Filtrado automático de:
>   - Medicamentos con receta (se muestran con advertencia informativa)
>   - Productos próximos a vencer **SIN** promoción aprobada
>   - Productos con **promociones aprobadas SÍ son visibles** (para incentivar ventas antes del vencimiento)

---

## 📂 Estructura del Proyecto

```text
server/
├── prisma/
│   └── schema.prisma        # Definición de modelos y relaciones Prisma
├── src/
│   ├── config/
│   │   └── prisma.ts        # Cliente de Prisma (Singleton)
│   ├── controllers/         # Lógica de orquestación de la API
│   │   ├── alertController.ts
│   │   ├── authController.ts
│   │   ├── batchController.ts
│   │   ├── categoryController.ts
│   │   ├── homeController.ts
│   │   ├── inventoryController.ts
│   │   ├── logisticsController.ts
│   │   ├── productController.ts
│   │   ├── promotionController.ts
│   │   ├── reportController.ts
│   │   └── saleController.ts
│   ├── middleware/
│   │   └── authMiddleware.ts    # Guardias de seguridad y validación JWT
│   ├── models/               # Clases POO con lógica de negocio (Dominio)
│   │   ├── Alerta.ts
│   │   ├── Categoria.ts
│   │   ├── DetalleVenta.ts
│   │   ├── Inventario.ts
│   │   ├── Lote.ts
│   │   ├── Producto.ts
│   │   ├── Promocion.ts
│   │   ├── Sucursal.ts
│   │   ├── Usuario.ts
│   │   └── Venta.ts
│   ├── routes/               # Definición de Endpoints
│   │   ├── alertRoutes.ts
│   │   ├── authRoutes.ts
│   │   ├── batchRoutes.ts
│   │   ├── categoryRoutes.ts
│   │   ├── index.ts
│   │   ├── inventoryRoutes.ts
│   │   ├── logisticsRoutes.ts
│   │   ├── productRoutes.ts
│   │   ├── promotionRoutes.ts
│   │   ├── reportRoutes.ts
│   │   └── saleRoutes.ts
│   ├── scripts/              # Scripts de utilidad y base de datos
│   │   ├── check-db.ts
│   │   └── init-db.ts
│   ├── services/             # Servicios de dominio y automatización
│   │   ├── AutomationService.ts
│   │   ├── ProductService.ts
│   │   ├── ReplenishmentService.ts
│   │   ├── SaleService.ts
│   │   └── StockService.ts
│   └── index.ts              # Punto de entrada de la aplicación
├── .env                      # Configuración de entorno
├── package.json              # Gestión de dependencias
├── README.md                 # Documentación principal
└── tsconfig.json             # Configuración de TypeScript
```

---

## ✅ Objetivos Cumplidos

- **Arquitectura POO**: Migración total a un diseño basado en clases y servicios.
- **Lógica de Negocio Robusta**: Sistema FIFO, bloqueo de vencidos y validación de roles.
- **Servicios Automáticos**: Motor de alertas y promociones operando sin intervención humana.
- **Logística Inteligente**: Asistente de compras basado en tendencias de venta.
