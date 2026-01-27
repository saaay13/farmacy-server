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
El sistema maneja 4 roles con permisos diferenciados:
1. **admin**: Control total, aprobación de promociones y reportes.
2. **farmaceutico**: Gestión de stock, lotes, revisiones y reportes.
3. **vendedor**: Realización de ventas y consulta de productos/stock.
---

## 📂 Estructura del Proyecto

```text
server/
├── prisma/
│   └── schema.prisma        # Definición de modelos y relaciones
├── src/
│   ├── config/
│   │   └── prisma.ts        # Cliente de Prisma (Singleton)
│   ├── controllers/         # Lógica de negocio
│   │   ├── alertController.ts
│   │   ├── authController.ts
│   │   ├── batchController.ts
│   │   ├── categoryController.ts
│   │   ├── inventoryController.ts
│   │   ├── productController.ts
│   │   ├── promotionController.ts
│   │   ├── reportController.ts
│   │   └── saleController.ts
│   ├── middleware/
│   │   └── authMiddleware.ts   # Autenticación y RBAC (Roles)
│   ├── routes/              # Endpoints de la API
│   │   ├── alertRoutes.ts
│   │   ├── authRoutes.ts
│   │   ├── batchRoutes.ts
│   │   ├── categoryRoutes.ts
│   │   ├── inventoryRoutes.ts
│   │   ├── productRoutes.ts
│   │   ├── promotionRoutes.ts
│   │   ├── reportRoutes.ts
│   │   ├── saleRoutes.ts
│   │   └── index.ts
│   └── index.ts             # Punto de entrada y Middleware global
├── .env                     # Variables sensibles
├── package.json             # Scripts y dependencias
├── prisma.config.ts         # Configuración avanzada de Prisma
├── README.md                # Documentación del proyecto
└── tsconfig.json            # Configuración de compilación TS
```

---

## ✅ Objetivos Cumplidos

El sistema cumple de manera íntegra con:
- **Integridad Transaccional**: Ventas y registros de stock protegidos mediante transacciones ACID.
- **Control de Vencimientos**: Gestión inteligente de lotes (FIFO) y alertas automáticas a 60 días.
- **Seguridad Robusta**: Autorización por roles (`RBAC`) en todos los puntos sensibles de la API.
- **Eficiencia Operativa**: Generación automática de sugerencias de promociones y reportes estratégicos.
- **Escalabilidad**: Arquitectura modular lista para el despliegue y conexión con Frontend.
