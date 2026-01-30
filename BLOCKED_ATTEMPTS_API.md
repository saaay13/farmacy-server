# API de Intentos Bloqueados - Documentación

## Descripción General

Este módulo registra y gestiona los intentos de venta que fueron bloqueados por el sistema debido a:
- Productos vencidos
- Productos que requieren receta médica
- Stock insuficiente
- Productos inactivos

## Endpoints Disponibles

### 1. Listar Intentos Bloqueados

**GET** `/api/blocked-attempts`

**Permisos**: Admin, Farmacéutico

**Query Parameters**:
- `motivo` (opcional): Filtrar por tipo de bloqueo
  - `PRODUCTO_VENCIDO`
  - `REQUIERE_RECETA`
  - `STOCK_INSUFICIENTE`
  - `PRODUCTO_INACTIVO`
- `idVendedor` (opcional): Filtrar por vendedor
- `desde` (opcional): Fecha inicio (formato: YYYY-MM-DD)
- `hasta` (opcional): Fecha fin (formato: YYYY-MM-DD)

**Ejemplo de Request**:
```
GET /api/blocked-attempts?motivo=PRODUCTO_VENCIDO&desde=2024-01-01
```

**Ejemplo de Response**:
```json
{
  "success": true,
  "title": "Intentos de Venta Bloqueados",
  "count": 15,
  "data": [
    {
      "id": "ib-1",
      "idVendedor": "u-5",
      "idCliente": "u-10",
      "fecha": "2024-01-29T19:30:00.000Z",
      "motivo": "PRODUCTO_VENCIDO",
      "idProducto": "p-123",
      "idLote": "l-456",
      "cantidadIntento": 5,
      "mensaje": "BLOQUEO: Lote L-2024-001 de Ibuprofeno 400mg está vencido (vencimiento: 29/1/2024)",
      "motivoLegible": "Producto Vencido",
      "esReciente": true,
      "resumen": "Producto Vencido - 5 unidades - 29/1/2024",
      "vendedor": {
        "nombre": "Juan Pérez",
        "email": "juan@farmacy.com",
        "rol": "vendedor"
      },
      "cliente": {
        "nombre": "María García",
        "email": "maria@example.com"
      },
      "producto": {
        "nombre": "Ibuprofeno 400mg",
        "precio": 5.50,
        "requiereReceta": false
      },
      "lote": {
        "numeroLote": "L-2024-001",
        "fechaVencimiento": "2024-01-29T00:00:00.000Z"
      }
    }
  ]
}
```

---

### 2. Obtener Estadísticas de Bloqueos

**GET** `/api/blocked-attempts/stats`

**Permisos**: Admin, Farmacéutico

**Query Parameters**:
- `dias` (opcional, default: 30): Número de días hacia atrás para calcular estadísticas

**Ejemplo de Request**:
```
GET /api/blocked-attempts/stats?dias=30
```

**Ejemplo de Response**:
```json
{
  "success": true,
  "title": "Estadísticas de Bloqueos (Últimos 30 días)",
  "data": {
    "totalIntentos": 45,
    "porMotivo": [
      {
        "motivo": "PRODUCTO_VENCIDO",
        "cantidad": 30,
        "porcentaje": "66.67"
      },
      {
        "motivo": "REQUIERE_RECETA",
        "cantidad": 15,
        "porcentaje": "33.33"
      }
    ],
    "topVendedores": [
      {
        "vendedor": "Juan Pérez",
        "email": "juan@farmacy.com",
        "rol": "vendedor",
        "intentos": 12
      },
      {
        "vendedor": "María García",
        "email": "maria@farmacy.com",
        "rol": "vendedor",
        "intentos": 8
      }
    ],
    "topProductos": [
      {
        "producto": "Ibuprofeno 400mg",
        "requiereReceta": false,
        "intentos": 15
      },
      {
        "producto": "Amoxicilina 500mg",
        "requiereReceta": true,
        "intentos": 10
      }
    ]
  }
}
```

---

### 3. Obtener Intentos Recientes (24 horas)

**GET** `/api/blocked-attempts/recent`

**Permisos**: Admin, Farmacéutico

**Ejemplo de Request**:
```
GET /api/blocked-attempts/recent
```

**Ejemplo de Response**:
```json
{
  "success": true,
  "title": "Intentos Bloqueados (Últimas 24 horas)",
  "count": 5,
  "data": [
    {
      "id": "ib-15",
      "fecha": "2024-01-29T18:45:00.000Z",
      "motivo": "PRODUCTO_VENCIDO",
      "cantidadIntento": 3,
      "mensaje": "BLOQUEO: Lote L-2024-005 de Paracetamol está vencido",
      "vendedor": {
        "nombre": "Carlos López",
        "rol": "vendedor"
      },
      "producto": {
        "nombre": "Paracetamol 500mg"
      },
      "lote": {
        "numeroLote": "L-2024-005",
        "fechaVencimiento": "2024-01-28T00:00:00.000Z"
      }
    }
  ]
}
```

---

### 4. Obtener Intentos por Vendedor

**GET** `/api/blocked-attempts/vendedor/:id`

**Permisos**: Admin, Farmacéutico

**Path Parameters**:
- `id`: ID del vendedor

**Ejemplo de Request**:
```
GET /api/blocked-attempts/vendedor/u-5
```

**Ejemplo de Response**:
```json
{
  "success": true,
  "count": 12,
  "stats": {
    "totalIntentos": 12,
    "porMotivo": [
      {
        "motivo": "PRODUCTO_VENCIDO",
        "_count": { "id": 8 }
      },
      {
        "motivo": "REQUIERE_RECETA",
        "_count": { "id": 4 }
      }
    ]
  },
  "data": [
    {
      "id": "ib-10",
      "fecha": "2024-01-29T15:30:00.000Z",
      "motivo": "PRODUCTO_VENCIDO",
      "cantidadIntento": 2,
      "mensaje": "BLOQUEO: Lote L-2024-003 de Aspirina está vencido",
      "producto": {
        "nombre": "Aspirina 100mg",
        "precio": 3.50
      },
      "lote": {
        "numeroLote": "L-2024-003",
        "fechaVencimiento": "2024-01-25T00:00:00.000Z"
      },
      "cliente": {
        "nombre": "Pedro Ramírez"
      }
    }
  ]
}
```

---

## Tipos de Motivos

| Motivo | Descripción | Cuándo se registra |
|--------|-------------|-------------------|
| `PRODUCTO_VENCIDO` | Producto con fecha de vencimiento pasada | Cuando se intenta vender un lote vencido |
| `REQUIERE_RECETA` | Producto que requiere receta médica | Cuando un cliente intenta comprar medicamento con receta |
| `STOCK_INSUFICIENTE` | No hay suficiente stock | Cuando la cantidad solicitada excede el stock disponible |
| `PRODUCTO_INACTIVO` | Producto desactivado en el sistema | Cuando se intenta vender un producto marcado como inactivo |

---

## Modelo de Datos

### IntentoBloqueado

```typescript
{
  id: string;              // ID único del intento bloqueado
  idVendedor: string;      // ID del vendedor que intentó la venta
  idCliente: string | null; // ID del cliente (puede ser null)
  fecha: Date;             // Fecha y hora del intento
  motivo: string;          // Tipo de bloqueo (ver tabla arriba)
  idProducto: string;      // ID del producto que causó el bloqueo
  idLote: string | null;   // ID del lote (solo para productos vencidos)
  cantidadIntento: number; // Cantidad de unidades que se intentó vender
  mensaje: string;         // Mensaje detallado del bloqueo
}
```

---

## Casos de Uso

### 1. Auditoría de Intentos de Venta de Productos Vencidos

**Objetivo**: Identificar qué vendedores están intentando vender productos vencidos

**Endpoint**: `GET /api/blocked-attempts?motivo=PRODUCTO_VENCIDO`

**Acción**: Revisar los vendedores con más intentos y capacitarlos

---

### 2. Monitoreo de Productos con Receta

**Objetivo**: Detectar intentos de venta de medicamentos con receta a clientes no autorizados

**Endpoint**: `GET /api/blocked-attempts?motivo=REQUIERE_RECETA`

**Acción**: Verificar que los controles de acceso funcionan correctamente

---

### 3. Análisis de Productos Problemáticos

**Objetivo**: Identificar qué productos se intentan vender vencidos con más frecuencia

**Endpoint**: `GET /api/blocked-attempts/stats`

**Acción**: Revisar la gestión de inventario de esos productos

---

### 4. Revisión de Desempeño de Vendedores

**Objetivo**: Evaluar el desempeño de un vendedor específico

**Endpoint**: `GET /api/blocked-attempts/vendedor/:id`

**Acción**: Capacitación o feedback al vendedor

---

## Integración con el Sistema de Ventas

Cuando se intenta realizar una venta (`POST /api/sales`), el sistema:

1. **Valida** cada producto en la venta
2. **Detecta** si hay algún problema (vencido, requiere receta, etc.)
3. **Registra** el intento bloqueado en la tabla `intento_bloqueado`
4. **Bloquea** la venta completa (rollback de transacción)
5. **Retorna** un error al cliente con el mensaje de bloqueo

**Ejemplo de error**:
```json
{
  "success": false,
  "message": "BLOQUEO: Lote L-2024-001 de Ibuprofeno 400mg está vencido."
}
```

---

## Notas Importantes

1. ✅ **Todos los intentos bloqueados se registran** antes de lanzar el error
2. ✅ **La venta NO se completa** cuando hay un bloqueo
3. ✅ **El inventario NO se modifica** en intentos bloqueados
4. ✅ **Solo admin y farmacéuticos** pueden consultar intentos bloqueados
5. ✅ **Los datos incluyen información completa** del vendedor, cliente, producto y lote

---

## Ejemplos de Consultas Útiles

### Intentos de hoy
```
GET /api/blocked-attempts?desde=2024-01-29&hasta=2024-01-29
```

### Intentos de un vendedor específico en el último mes
```
GET /api/blocked-attempts?idVendedor=u-5&desde=2023-12-29
```

### Estadísticas de la última semana
```
GET /api/blocked-attempts/stats?dias=7
```

### Todos los intentos de productos con receta
```
GET /api/blocked-attempts?motivo=REQUIERE_RECETA
```
