import { Request, Response } from 'express';
import prisma from '../config/prisma';

// Listar todos los lotes
export const getBatches = async (req: Request, res: Response) => {
    try {
        const { idProducto } = req.query;

        const batches = await prisma.lote.findMany({
            where: {
                idProducto: idProducto ? String(idProducto) : undefined
            },
            include: {
                producto: true
            },
            orderBy: { fechaVencimiento: 'asc' }
        });

        res.json({ success: true, count: batches.length, data: batches });
    } catch (error: any) {
        console.error('Error al obtener lotes:', error);
        res.status(500).json({ success: false, message: 'Error al obtener lotes', error: error.message });
    }
};

// Crear un nuevo lote (Aumenta stock en inventario)
export const createBatch = async (req: Request, res: Response) => {
    try {
        const { idProducto, fechaVencimiento, cantidad, numeroLote, idSucursal } = req.body;

        if (!idProducto || !fechaVencimiento || !cantidad || !numeroLote) {
            return res.status(400).json({ success: false, message: 'Faltan campos obligatorios' });
        }

        const result = await prisma.$transaction(async (tx: any) => {
            const newBatch = await tx.lote.create({
                data: {
                    idProducto,
                    fechaVencimiento: new Date(fechaVencimiento),
                    cantidad: Number(cantidad),
                    numeroLote
                }
            });

            const inventory = await tx.inventario.findUnique({
                where: { idProducto }
            });

            if (inventory) {
                await tx.inventario.update({
                    where: { idProducto },
                    data: {
                        stockTotal: inventory.stockTotal + Number(cantidad),
                        fechaRevision: new Date()
                    }
                });
            } else {
                if (!idSucursal) {
                    throw new Error('Se requiere idSucursal para crear el registro de inventario inicial');
                }
                await tx.inventario.create({
                    data: {
                        idProducto,
                        idSucursal,
                        stockTotal: Number(cantidad),
                        fechaRevision: new Date()
                    }
                });
            }

            return newBatch;
        });

        res.status(201).json({ success: true, message: 'Lote creado e inventario actualizado', data: result });
    } catch (error: any) {
        console.error('Error al crear lote:', error);
        res.status(500).json({ success: false, message: 'Error al crear lote', error: error.message });
    }
};

// Eliminar un lote (Resta stock)
export const deleteBatch = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        await prisma.$transaction(async (tx: any) => {
            const batch = await tx.lote.findUnique({ where: { id: String(id) } });

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

            await tx.lote.delete({ where: { id: String(id) } });
        });

        res.json({ success: true, message: 'Lote eliminado e inventario actualizado' });
    } catch (error: any) {
        res.status(500).json({ success: false, message: 'Error al eliminar lote', error: error.message });
    }
};
