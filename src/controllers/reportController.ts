import { Request, Response } from 'express';
import prisma from '../config/prisma';

// 1. Reporte de productos próximos a vencer (ventana de 60 días)
export const getExpiringProductsReport = async (req: Request, res: Response) => {
    try {
        const today = new Date();
        const sixtyDaysFromNow = new Date();
        sixtyDaysFromNow.setDate(today.getDate() + 60);

        const expiringBatches = await prisma.lote.findMany({
            where: {
                fechaVencimiento: {
                    lte: sixtyDaysFromNow,
                    gte: today
                },
                cantidad: { gt: 0 }
            },
            include: {
                producto: {
                    select: { nombre: true, precio: true, idCategoria: true }
                }
            },
            orderBy: { fechaVencimiento: 'asc' }
        });

        res.json({
            success: true,
            title: 'Reporte de Productos Próximos a Vencer (60 días)',
            count: expiringBatches.length,
            data: expiringBatches
        });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// 2. Reporte de productos vencidos (Stock bloqueado)
export const getExpiredProductsReport = async (req: Request, res: Response) => {
    try {
        const today = new Date();

        const expiredBatches = await prisma.lote.findMany({
            where: {
                fechaVencimiento: { lt: today }
            },
            include: {
                producto: {
                    select: { nombre: true, estado: true }
                }
            },
            orderBy: { fechaVencimiento: 'desc' }
        });

        res.json({
            success: true,
            title: 'Reporte de Productos Vencidos',
            count: expiredBatches.length,
            data: expiredBatches
        });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// 3. Reporte de stock actual por sucursal
export const getStockReport = async (req: Request, res: Response) => {
    try {
        const stockData = await prisma.inventario.findMany({
            include: {
                producto: {
                    select: { nombre: true, precio: true, requiereReceta: true }
                },
                sucursal: {
                    select: { nombre: true }
                }
            },
            orderBy: { stockTotal: 'asc' }
        });

        res.json({
            success: true,
            title: 'Reporte de Stock Actual',
            data: stockData
        });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// 4. Resumen de ventas (Total recaudado y cantidad de transacciones)
export const getSalesReport = async (req: Request, res: Response) => {
    try {
        const { days = 30 } = req.query;
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - Number(days));

        const salesCount = await prisma.venta.count({
            where: { fecha: { gte: startDate } }
        });

        const salesSum = await prisma.venta.aggregate({
            where: { fecha: { gte: startDate } },
            _sum: { total: true }
        });

        const topProducts = await prisma.detalleVenta.groupBy({
            by: ['idProducto'],
            _sum: { cantidad: true },
            orderBy: { _sum: { cantidad: 'desc' } },
            take: 5
        });

        // Enriquecer top productos con nombres
        const topProductsWithNames = await Promise.all(topProducts.map(async (item: any) => {
            const prod = await prisma.producto.findUnique({
                where: { id: item.idProducto },
                select: { nombre: true }
            });
            return {
                nombre: prod?.nombre || 'Desconocido',
                cantidadVendida: item._sum.cantidad
            };
        }));

        res.json({
            success: true,
            title: `Resumen de Ventas (Últimos ${days} días)`,
            summary: {
                totalVendido: salesSum._sum.total || 0,
                cantidadTransacciones: salesCount,
                promedioVenta: salesCount > 0 ? (Number(salesSum._sum.total) / salesCount).toFixed(2) : 0
            },
            topProducts: topProductsWithNames
        });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// 5. Reporte detallado de ventas por producto
export const getSalesByProductReport = async (req: Request, res: Response) => {
    try {
        const productSales = await prisma.detalleVenta.groupBy({
            by: ['idProducto'],
            _sum: {
                cantidad: true,
                subtotal: true
            },
            orderBy: {
                _sum: {
                    subtotal: 'desc'
                }
            }
        });

        const enrichedData = await Promise.all(productSales.map(async (item: any) => {
            const product = await prisma.producto.findUnique({
                where: { id: item.idProducto },
                select: {
                    nombre: true,
                    precio: true,
                    categoria: { select: { nombre: true } }
                }
            });

            return {
                idProducto: item.idProducto,
                nombre: product?.nombre || 'Desconocido',
                categoria: product?.categoria?.nombre || 'Sin categoría',
                precioActual: product?.precio || 0,
                cantidadTotal: item._sum.cantidad || 0,
                ingresosTotales: item._sum.subtotal || 0
            };
        }));

        res.json({
            success: true,
            title: 'Ventas Detalladas por Producto',
            count: enrichedData.length,
            data: enrichedData
        });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
};
