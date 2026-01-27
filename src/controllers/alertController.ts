import { Request, Response } from 'express';
import prisma from '../config/prisma';

// Generar alertas automáticas de vencimiento y stock bajo
export const checkAndGenerateAlerts = async (req: Request, res: Response) => {
    try {
        const today = new Date();
        const sixtyDaysFromNow = new Date();
        sixtyDaysFromNow.setDate(today.getDate() + 60);

        const alertsCreated = [];

        // 1. Revisar lotes próximos a vencer (60 días)
        const expiringBatches = await prisma.lote.findMany({
            where: {
                fechaVencimiento: {
                    lte: sixtyDaysFromNow,
                    gte: today
                }
            },
            include: { producto: true }
        });

        for (const batch of expiringBatches) {
            // Verificar si ya existe una alerta activa para este lote/producto recientemente
            const existingAlert = await prisma.alerta.findFirst({
                where: {
                    idProducto: batch.idProducto,
                    tipo: 'expirado',
                    mensaje: { contains: batch.numeroLote }
                }
            });

            if (!existingAlert) {
                const alert = await prisma.alerta.create({
                    data: {
                        tipo: 'expirado',
                        mensaje: `Lote ${batch.numeroLote} del producto ${batch.producto.nombre} vencerá el ${batch.fechaVencimiento.toLocaleDateString()}`,
                        fecha: new Date(),
                        idProducto: batch.idProducto,
                        idUsuario: (req as any).user.id // Usuario que dispara el chequeo
                    }
                });
                alertsCreated.push(alert);
            }
        }

        // 2. Revisar stock bajo (digamos < 10 unidades por simplicidad)
        const lowStockInventory = await prisma.inventario.findMany({
            where: {
                stockTotal: { lt: 10 }
            },
            include: { producto: true }
        });

        for (const item of lowStockInventory) {
            const existingAlert = await prisma.alerta.findFirst({
                where: {
                    idProducto: item.idProducto,
                    tipo: 'stock_bajo'
                }
            });

            if (!existingAlert) {
                const alert = await prisma.alerta.create({
                    data: {
                        tipo: 'stock_bajo',
                        mensaje: `Stock bajo para ${item.producto.nombre}: solo quedan ${item.stockTotal} unidades`,
                        fecha: new Date(),
                        idProducto: item.idProducto,
                        idUsuario: (req as any).user.id
                    }
                });
                alertsCreated.push(alert);
            }
        }

        res.json({
            success: true,
            message: 'Chequeo de alertas completado',
            newAlertsCount: alertsCreated.length,
            data: alertsCreated
        });
    } catch (error: any) {
        console.error('Alert Check Error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

// Obtener todas las alertas
export const getAlerts = async (req: Request, res: Response) => {
    try {
        const alerts = await prisma.alerta.findMany({
            include: {
                producto: true,
                usuario: { select: { nombre: true, rol: true } }
            },
            orderBy: { fecha: 'desc' }
        });

        res.json({ success: true, count: alerts.length, data: alerts });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// Eliminar/Resolver alerta
export const deleteAlert = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await prisma.alerta.delete({ where: { id: String(id) } });
        res.json({ success: true, message: 'Alerta eliminada' });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
};
