import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { StockService } from '../services/StockService';

// Listar todos los lotes
export const getBatches = async (req: Request, res: Response) => {
    try {
        const { idProducto, includeDeactivated } = req.query;

        const batches = await prisma.lote.findMany({
            where: {
                idProducto: idProducto ? String(idProducto) : undefined,
                activo: includeDeactivated === 'true' ? undefined : true
            },
            include: {
                producto: true,
                sucursal: true
            },
            orderBy: { fechaVencimiento: 'asc' }
        });

        res.json({ success: true, count: batches.length, data: batches });
    } catch (error: any) {
        console.error('Error al obtener lotes:', error);
        res.status(500).json({ success: false, message: 'Error al obtener lotes', error: error.message });
    }
};

// Crear un nuevo lote (Usando el Servicio y Modelo POO)
export const createBatch = async (req: Request, res: Response) => {
    try {
        const { idProducto, fechaVencimiento, cantidad, numeroLote, idSucursal } = req.body;

        if (!idProducto || !fechaVencimiento || !cantidad || !numeroLote) {
            return res.status(400).json({ success: false, message: 'Faltan campos obligatorios' });
        }

        const result = await StockService.registrarNuevoLote({
            idProducto,
            fechaVencimiento,
            cantidad,
            numeroLote,
            idSucursal
        });

        res.status(201).json({ success: true, message: 'Lote creado con éxito (Modelo POO)', data: result });
    } catch (error: any) {
        res.status(500).json({ success: false, message: 'Error al crear lote', error: error.message });
    }
};

// Eliminar un lote
export const deleteBatch = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        await prisma.$transaction(async (tx: any) => {
            const batch = await tx.lote.findFirst({ where: { id: String(id), activo: true } });

            if (!batch) {
                throw new Error('Lote no encontrado');
            }

            await tx.inventario.update({
                where: { idProducto: batch.idProducto },
                data: {
                    stockTotal: { decrement: batch.cantidad },
                    fechaRevision: new Date()
                }
            });

            await tx.lote.update({
                where: { id: String(id) },
                data: { activo: false }
            });
        });

        res.json({ success: true, message: 'Lote eliminado e inventario actualizado' });
    } catch (error: any) {
        res.status(500).json({ success: false, message: 'Error al eliminar lote', error: error.message });
    }
};

// Restaurar un lote (Incrementa inventario)
export const restoreBatch = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        await prisma.$transaction(async (tx: any) => {
            const batch = await tx.lote.findUnique({ where: { id: String(id) } });

            if (!batch) {
                throw new Error('Lote no encontrado');
            }

            if (batch.activo) {
                throw new Error('El lote ya está activo');
            }

            // Incrementar inventario
            await tx.inventario.update({
                where: { idProducto: batch.idProducto },
                data: {
                    stockTotal: { increment: batch.cantidad },
                    fechaRevision: new Date()
                }
            });

            // Activar lote
            await tx.lote.update({
                where: { id: String(id) },
                data: { activo: true }
            });
        });

        res.json({ success: true, message: 'Lote restaurado e inventario actualizado' });
    } catch (error: any) {
        res.status(500).json({ success: false, message: 'Error al restaurar lote', error: error.message });
    }
};
