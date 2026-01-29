import prisma from '../config/prisma';
import { LoteModel } from '../models/Lote';

export class StockService {
    // Mover aquí la lógica que estaba en el controlador para que use el Modelo
    public static async registrarNuevoLote(datos: any) {
        return await prisma.$transaction(async (tx: any) => {
            const newBatch = await tx.lote.create({
                data: {
                    idProducto: datos.idProducto,
                    fechaVencimiento: new Date(datos.fechaVencimiento),
                    cantidad: Number(datos.cantidad),
                    numeroLote: datos.numeroLote
                }
            });

            // Usamos el modelo Lote para cualquier validación extra si fuera necesario
            const loteObj = new LoteModel(
                newBatch.id,
                newBatch.idProducto,
                newBatch.fechaVencimiento,
                newBatch.cantidad,
                newBatch.numeroLote
            );

            // Actualizar inventario
            const inventory = await tx.inventario.findUnique({ where: { idProducto: datos.idProducto } });
            if (inventory) {
                await tx.inventario.update({
                    where: { idProducto: datos.idProducto },
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
        // Filtrar usando la lógica del MODELO
        return lotes
            .map((l: any) => new LoteModel(l.id, l.idProducto, l.fechaVencimiento, l.cantidad, l.numeroLote))
            .filter((l: LoteModel) => l.estaVencido());
    }
}
