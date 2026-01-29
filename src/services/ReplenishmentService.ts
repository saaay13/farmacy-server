import prisma from '../config/prisma';

export interface ReplenishmentSuggestion {
    idProducto: string;
    nombre: string;
    stockActual: number;
    ventasUltimoMes: number;
    cantidadSugerida: number;
    nivelUrgencia: 'ALTA' | 'MEDIA' | 'BAJA';
    razon: string;
}

export class ReplenishmentService {
    /**
     * Analiza el inventario y genera sugerencias de compra
     */
    public static async getSuggestions(): Promise<ReplenishmentSuggestion[]> {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        // 1. Obtener todos los productos con su stock actual
        const inventory = await prisma.inventario.findMany();
        const products = await prisma.producto.findMany({
            where: { estado: 'activo', activo: true }
        });

        const suggestions: ReplenishmentSuggestion[] = [];

        const recentSales = await prisma.venta.findMany({
            where: { fecha: { gte: thirtyDaysAgo } },
            select: { id: true }
        });
        const recentSalesIds = recentSales.map(v => v.id);

        for (const product of products) {
            const stockRecord = inventory.find(i => i.idProducto === product.id);
            const stockActual = stockRecord?.stockTotal ?? 0;

            // 2. Calcular ventas del último mes para este producto
            const salesCount = await prisma.detalleVenta.aggregate({
                where: {
                    idProducto: product.id,
                    idVenta: { in: recentSalesIds }
                },
                _sum: { cantidad: true }
            });

            const ventasMes = salesCount._sum.cantidad ?? 0;

            // Lógica de sugerencia:
            // - Si el stock es menor a 10 y hay ventas -> ALTA
            // - Si el stock es menor al 50% de lo vendido en el mes -> MEDIA

            let cantidadSugerida = 0;
            let nivelUrgencia: 'ALTA' | 'MEDIA' | 'BAJA' = 'BAJA';
            let razon = '';

            if (stockActual < 10) {
                nivelUrgencia = 'ALTA';
                cantidadSugerida = Math.max(20, ventasMes * 1.5); // Sugerir lo de un mes y medio o mínimo 20
                razon = 'Stock crítico por debajo de 10 unidades.';
            } else if (stockActual < ventasMes) {
                nivelUrgencia = 'MEDIA';
                cantidadSugerida = Math.ceil(ventasMes * 1.2) - stockActual;
                razon = 'El stock actual es menor a la demanda del último mes.';
            }

            if (nivelUrgencia !== 'BAJA') {
                suggestions.push({
                    idProducto: product.id,
                    nombre: product.nombre,
                    stockActual,
                    ventasUltimoMes: ventasMes,
                    cantidadSugerida: Math.ceil(cantidadSugerida),
                    nivelUrgencia,
                    razon
                });
            }
        }

        return suggestions.sort((a, b) => {
            const priority = { 'ALTA': 0, 'MEDIA': 1, 'BAJA': 2 };
            return priority[a.nivelUrgencia] - priority[b.nivelUrgencia];
        });
    }

    /**
     * Genera un reporte de productos en estado crítico
     */
    public static async getCriticalReport() {
        const sixtyDaysFromNow = new Date();
        sixtyDaysFromNow.setDate(sixtyDaysFromNow.getDate() + 60);

        // Productos con bajo stock
        const lowStock = await this.getSuggestions();

        // Productos próximos a vencer
        const expiringSoon = await prisma.lote.findMany({
            where: {
                fechaVencimiento: { lte: sixtyDaysFromNow, gte: new Date() },
                cantidad: { gt: 0 },
                activo: true
            },
            include: { producto: true }
        });

        return {
            fechaReporte: new Date(),
            resumen: {
                totalBajoStock: lowStock.length,
                totalProximosAVencer: expiringSoon.length
            },
            detalles: {
                reabastecimiento: lowStock,
                vencimientos: expiringSoon.map(l => ({
                    producto: l.producto.nombre,
                    lote: l.numeroLote,
                    vence: l.fechaVencimiento,
                    cantidadEnLote: l.cantidad
                }))
            }
        };
    }
}
