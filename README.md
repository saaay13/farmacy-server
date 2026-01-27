# Store Farmacy Server - Backend API

Sistema de gestión integral para farmacias multisucursal, desarrollado con Node.js, Express y Prisma.

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
- **cors** (^2.8.6): Configuración de recursos cruzados.
- **dotenv** (^17.2.3): Gestión de variables de entorno.

### Desarrollo
- **ts-node** (^10.9.2): Ejecución directa de TypeScript.
- **nodemon** (^3.1.11): Reinicio automático del servidor.

---

## ⚙️ Configuración del Proyecto

### 1. Variables de Entorno
Crea un archivo `.env` en la raíz de la carpeta `/server` con lo siguiente:
```env
DATABASE_URL="postgresql://USUARIO:PASSWORD@localhost:5432/farmacia?schema=farmacy"
JWT_SECRET="tu_clave_secreta_aqui"
```

### 2. Instalación
```bash
npm install
```

### 3. Base de Datos (Prisma)
Para generar el cliente de Prisma y sincronizar el esquema:
```bash
npx prisma generate
```

---

## 🚀 Ejecución

**Modo Desarrollo**:
```bash
npm run dev
```
El servidor estará disponible en `http://localhost:3001`

---

## 🛣️ Estructura de la API

### Autenticación (`/api/auth`)
- `POST /register`: Registro de nuevos usuarios.
- `POST /login`: Inicio de sesión y obtención de token.

### Productos y Categorías
- `/api/products`: CRUD completo con filtros por nombre y categoría.
- `/api/categories`: Gestión de categorías de medicamentos.

### Inventario y Lotes (`/api/inventory` / `/api/batches`)
- Manejo de stock por sucursal.
- Registro de lotes con fechas de vencimiento (Sistema FIFO automático).

### Alertas y Promociones (`/api/alerts` / `/api/promotions`)
- Generación de alertas automáticas (vencimientos a 60 días y stock bajo).
- Sugerencia de promociones automáticas para productos por vencer.
- Aprobación administrativa obligatoria para descuentos.

### Ventas (`/api/sales`)
- Procesamiento de ventas transaccional.
- Validación de recetas médicas por rol (Clientes bloqueados para controlados).
- Descuento automático de stock de los lotes más antiguos.

### Reportes (`/api/reports`)
- Reporte detallado de vencimientos y bajas.
- Resumen consolidado de stock e ingresos.

---

## 🔐 Seguridad y Roles
El sistema implementa un control de acceso robusto basado en roles (RBAC) tanto a nivel de API como de Base de Datos:

### Matriz de Permisos (Base de Datos)

| Recurso | Administrador | Farmacéutico | Vendedor | Cliente |
| :--- | :--- | :--- | :--- | :--- |
| **Usuarios** | CRUD Total | Ver perfil propio | Registra Clientes | Ver perfil propio |
| **Productos** | CRUD Total | Ver catálogo | Ver catálogo | Ver catálogo* |
| **Inventario** | CRUD Total | Actualizar Stock | Ver stock | Sin acceso |
| **Lote** | CRUD Total | Alta/Baja Lotes | Ver lotes | Sin acceso |
| **Ventas** | Supervisión | Realizar Venta | Realizar Venta | Ver sus compras |
| **Promociones**| Aprobar/Crear | Ver sugerencias | Ver sugerencias | Ver activas |
| **Alertas** | Ver/Gestionar | Ver alertas | Ver alertas | Sin acceso |

> [!NOTE]
> * **Privacidad de Clientes**: Los clientes solo pueden visualizar productos en buen estado (no próximos a vencer) y que no requieran receta para venta directa.

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
│   │   ├── ...
│   │   └── saleController.ts
│   ├── middleware/
│   │   └── authMiddleware.ts   # Guardias de seguridad y validación JWT
│   ├── models/              # Clases POO con lógica de negocio (Dominio)
│   │   ├── Producto.ts
│   │   ├── Venta.ts
│   │   ├── Promocion.ts
│   │   └── ...
│   ├── routes/              # Definición de Endpoints
│   │   ├── categoryRoutes.ts
│   │   ├── ...
│   │   └── index.ts
│   ├── services/           # Lotería de servicios complejos
│   │   └── StockService.ts # Lógica de inventario y lotes
│   └── index.ts             # Punto de entrada de la aplicación
├── .env                     # Configuración de entorno
├── package.json             # Gestión de dependencias
├── README.md                # Documentación principal
└── tsconfig.json            # Configuración de TypeScript
```

---

## ✅ Objetivos Cumplidos

- **Modelado POO**: Migración exitosa de controladores hacia un diseño orientado a objetos utilizando clases de dominio.
- **Seguridad Multinivel**: Implementación de roles en PostgreSQL (`GRANT/REVOKE`) y protección de rutas en Express.
- **Control de Inventario Inteligente**: Sistema de lotes FIFO con bloqueo automático de productos vencidos.
- **Alertas y Automatización**: Motor de sugerencias para promociones y reportes de stock crítico.
- **Escalabilidad**: Preparado para manejar catálogos de más de 2000 productos con alto performance.
