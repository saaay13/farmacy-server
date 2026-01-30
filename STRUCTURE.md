# 🌳 Estructura Jerárquica - Farmacy Server

Listado jerárquico de carpetas y archivos del backend.

```text
/server
├── prisma/                     # Configuración de Base de Datos
│   └── schema.prisma           # Modelos y relaciones de Prisma
├── src/                        # Código fuente
    ├── index.ts                # Punto de entrada de la API
    ├── config/                 # Configuraciones
    │   └── prisma.ts           # Cliente Prisma (Singleton)
    ├── controllers/            # Controladores (Orquestación)
    │   ├── alertController.ts
    │   ├── authController.ts
    │   ├── batchController.ts
    │   ├── blockedAttemptController.ts
    │   ├── branchController.ts
    │   ├── categoryController.ts
    │   ├── homeController.ts
    │   ├── inventoryController.ts
    │   ├── logisticsController.ts
    │   ├── productController.ts
    │   ├── promotionController.ts
    │   ├── reportController.ts
    │   ├── saleController.ts
    │   └── userController.ts
    ├── middleware/             # Interceptores
    │   └── authMiddleware.ts   # Seguridad y roles JWT
    ├── models/                 # Clases POO (Lógica de Dominio)
    │   ├── Alerta.ts
    │   ├── Categoria.ts
    │   ├── DetalleVenta.ts
    │   ├── IntentoBloqueado.ts
    │   ├── Inventario.ts
    │   ├── Lote.ts
    │   ├── Producto.ts
    │   ├── Promocion.ts
    │   ├── Sucursal.ts
    │   ├── Usuario.ts
    │   └── Venta.ts
    ├── routes/                 # Definición de Endpoints
    │   ├── alertRoutes.ts
    │   ├── authRoutes.ts
    │   ├── batchRoutes.ts
    │   ├── blockedAttemptRoutes.ts
    │   ├── branchRoutes.ts
    │   ├── categoryRoutes.ts
    │   ├── inventoryRoutes.ts
    │   ├── logisticsRoutes.ts
    │   ├── productRoutes.ts
    │   ├── promotionRoutes.ts
    │   ├── reportRoutes.ts
    │   ├── saleRoutes.ts
    │   ├── userRoutes.ts
    │   └── index.ts            # Enrutador central
    ├── services/               # Servicios de Negocio y Automatización
    │   ├── AutomationService.ts # Cron jobs y tareas automáticas
    │   ├── ProductService.ts    # Reglas de visibilidad y catálogo
    │   ├── ReplenishmentService.ts # Algoritmos de reabastecimiento
    │   ├── SaleService.ts       # Procesamiento transaccional (FIFO)
    │   └── StockService.ts      # Gestión técnica de inventario
    ├── scripts/                # Scripts de utilidad
    │   ├── check-inventory.ts
    │   ├── check-users.ts
    │   └── init-db.ts
    └── utils/                  # Utilidades generales
```
├── .env                        # Variables de entorno
├── package.json                # Dependencias y scripts
├── README.md                   # Documentación principal
├── STRUCTURE.md                # (Este archivo)
└── tsconfig.json               # Configuración de TypeScript
---
*Este mapa refleja la estructura real y completa del servidor Farmacy Siempre Vivo.*
