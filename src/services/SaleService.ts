import prisma from '../config/prisma';
import { ProductoModel } from '../models/Producto';
import { LoteModel } from '../models/Lote';
import { VentaModel } from '../models/Venta';
import { DetalleVentaModel } from '../models/DetalleVenta';

export class SaleService {
    /**
     * Procesa una venta completa dentro de una transacción.
     * Encapsula reglas FIFO, validación de recetas y bloqueo de vencimientos.
     */
    public static async processSale(idCliente: string | null, idVendedor: string, userRole: string, detalles: any[]) {
        return await prisma.$transaction(async (tx: any) => {
            let totalVenta = 0;
            const saleDetailsData = [];
            let hayProductoVencido = false;

            for (const item of detalles) {
                const { idProducto, cantidad } = item;

                // 1. Validar Producto con Modelo POO
                const productData = await tx.producto.findUnique({ where: { id: idProducto } });
                if (!productData) throw new Error(`Producto ${idProducto} no encontrado`);

                const productObj = new ProductoModel(
                    productData.id,
                    productData.nombre,
                    productData.estado,
                    Number(productData.precio),
                    productData.requiereReceta,
                    productData.idCategoria
                );

                if (!productObj.puedeSerCompradoPor(userRole)) {
                    throw new Error(`BLOQUEO: El producto ${productObj.nombre} requiere receta y no puede ser comprado por su rol actual.`);
                }

                // 2. Verificar Stock
                const inventory = await tx.inventario.findUnique({ where: { idProducto } });
                if (!inventory || inventory.stockTotal < cantidad) {
                    throw new Error(`Stock insuficiente para ${productObj.nombre}.`);
                }

                // 3. Lógica FIFO y Vencimiento con Modelo Lote
                let cantidadRestante = cantidad;
                const lotesData = await tx.lote.findMany({
                    where: { idProducto },
                    orderBy: { fechaVencimiento: 'asc' }
                });

                for (const l of lotesData) {
                    if (cantidadRestante <= 0) break;

                    const loteObj = new LoteModel(l.id, l.idProducto, l.fechaVencimiento, l.cantidad, l.numeroLote);

                    if (loteObj.estaVencido()) {
                        hayProductoVencido = true;
                        throw new Error(`BLOQUEO: Lote ${loteObj.numeroLote} de ${productObj.nombre} está vencido.`);
                    }

                    const cantidadADescontar = Math.min(loteObj.cantidad, cantidadRestante);
                    await tx.lote.update({
                        where: { id: loteObj.id },
                        data: { cantidad: loteObj.cantidad - cantidadADescontar }
                    });
                    cantidadRestante -= cantidadADescontar;
                }

                if (cantidadRestante > 0) throw new Error(`Stock real inconsistente para ${productObj.nombre}`);

                // 4. Actualizar Inventario
                await tx.inventario.update({
                    where: { idProducto },
                    data: { stockTotal: { decrement: cantidad }, fechaRevision: new Date() }
                });

                // 5. Acumular Detalle
                const subtotal = productObj.calcularPrecioFinal() * cantidad;
                totalVenta += subtotal;

                saleDetailsData.push({
                    idProducto,
                    cantidad,
                    precioUnitario: productData.precio,
                    subtotal
                });
            }

            // 6. Crear Venta
            const saleRecord = await tx.venta.create({
                data: {
                    idCliente,
                    idVendedor,
                    fecha: new Date(),
                    total: totalVenta,
                    ventaError: hayProductoVencido,
                    detalles: { create: saleDetailsData }
                },
                include: { detalles: true }
            });

            return saleRecord;
        });
    }
}
