import prisma from '../config/prisma';
import { LoteModel } from '../models/Lote';

export class StockService {
    // Registrar nuevo lote
    public static async registrarNuevoLote(datos: any) {
        return await prisma.$transaction(async (tx: any) => {
            const newBatch = await tx.lote.create({
                data: {
                    idProducto: datos.idProducto,
                    idSucursal: datos.idSucursal,
                    fechaVencimiento: new Date(datos.fechaVencimiento),
                    cantidad: Number(datos.cantidad),
                    numeroLote: datos.numeroLote
                }
            });

            // Validaciones de modelo
            const loteObj = new LoteModel(
                newBatch.id,
                newBatch.idProducto,
                newBatch.fechaVencimiento,
                newBatch.cantidad,
                newBatch.numeroLote,
                newBatch.idSucursal
            );

            // Actualizar inventario
            const inventory = await tx.inventario.findUnique({
                where: {
                    idProducto_idSucursal: {
                        idProducto: datos.idProducto,
                        idSucursal: datos.idSucursal
                    }
                }
            });

            if (inventory) {
                await tx.inventario.update({
                    where: {
                        idProducto_idSucursal: {
                            idProducto: datos.idProducto,
                            idSucursal: datos.idSucursal
                        }
                    },
                    data: { stockTotal: inventory.stockTotal + loteObj.cantidad, fechaRevision: new Date() }
                });
            } else {
                await tx.inventario.create({
                    data: {
                        idProducto: datos.idProducto,
                        idSucursal: datos.idSucursal,
                        stockTotal: loteObj.cantidad,
                        fechaRevision: new Date()
                    }
                });
            }

            return newBatch;
        });
    }

    public static async obtenerLotesVencidos() {
        const lotes = await prisma.lote.findMany({
            where: { activo: true }
        });
        // Lógica de modelo
        return lotes
            .map((l: any) => new LoteModel(l.id, l.idProducto, l.fechaVencimiento, l.cantidad, l.numeroLote, l.idSucursal))
            .filter((l: LoteModel) => l.estaVencido());
    }
}
