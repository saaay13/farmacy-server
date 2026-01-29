import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { InventarioModel } from '../models/Inventario';

// Obtener inventario actual
export const getInventory = async (req: Request, res: Response) => {
    try {
        const { idSucursal, idProducto } = req.query;

        const inventory = await prisma.inventario.findMany({
            where: {
                idSucursal: idSucursal ? String(idSucursal) : undefined,
                idProducto: idProducto ? String(idProducto) : undefined,
                producto: { activo: true }
            },
            include: {
                producto: {
                    select: {
                        nombre: true,
                        precio: true,
                        estado: true,
                        categoria: {
                            select: { nombre: true }
                        }
                    }
                },
                sucursal: true
            },
            orderBy: { stockTotal: 'desc' }
        });

        // Opcional: Instanciar para lógica extra (ej. verificar stock crítico)
        const inventoryWithLogic = inventory.map((item: any) => {
            const invObj = new InventarioModel(item.idProducto, item.idSucursal, item.stockTotal, item.fechaRevision);
            return {
                ...item,
                esSotckBajo: invObj.esStockCritico(15) // Umbral personalizado
            };
        });

        res.json({ success: true, count: inventoryWithLogic.length, data: inventoryWithLogic });
    } catch (error: any) {
        console.error('Error al obtener inventario:', error);
        res.status(500).json({ success: false, message: 'Error al obtener inventario', error: error.message });
    }
};

// Detalle de inventario por producto
export const getInventoryByProduct = async (req: Request, res: Response) => {
    try {
        const { idProducto } = req.params;

        const inventory = await prisma.inventario.findUnique({
            where: { idProducto: String(idProducto) },
            include: {
                producto: true,
                sucursal: true
            }
        });

        if (!inventory) {
            return res.status(404).json({ success: false, message: 'No hay registro de inventario para este producto' });
        }

        // --- USO DE MODELO POO ---
        const invObj = new InventarioModel(
            inventory.idProducto,
            inventory.idSucursal,
            inventory.stockTotal,
            inventory.fechaRevision
        );

        res.json({
            success: true,
            data: {
                ...inventory,
                infoPOO: {
                    stockActual: invObj.stockTotal,
                    esCritico: invObj.esStockCritico()
                }
            }
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: 'Error al obtener detalle de inventario', error: error.message });
    }
};
