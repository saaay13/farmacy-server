import prisma from '../config/prisma';
import { ProductoModel } from '../models/Producto';
import { LoteModel } from '../models/Lote';
import { VentaModel } from '../models/Venta';
import { DetalleVentaModel } from '../models/DetalleVenta';

export class SaleService {
    // Procesar venta
    public static async processSale(idCliente: string | null, idVendedor: string, userRole: string, detalles: any[]) {
        return await prisma.$transaction(async (tx: any) => {
            let totalVenta = 0;
            const saleDetailsData = [];
            let hayProductoVencido = false;

            for (const item of detalles) {
                const { idProducto, cantidad } = item;

                // Validar producto
                const productData = await tx.producto.findFirst({ where: { id: idProducto, activo: true } });
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

                // Verificar stock
                const inventory = await tx.inventario.findUnique({ where: { idProducto } });
                if (!inventory || inventory.stockTotal < cantidad) {
                    throw new Error(`Stock insuficiente para ${productObj.nombre}.`);
                }

                // Promociones activas
                const promociones = await tx.promocion.findMany({
                    where: {
                        idProducto,
                        aprobada: true,
                        activo: true,
                        fechaInicio: { lte: new Date() },
                        fechaFin: { gte: new Date() }
                    }
                });

                // Lógica FIFO
                let cantidadRestante = cantidad;
                const lotesData = await tx.lote.findMany({
                    where: { idProducto, activo: true },
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

                    // Determinar si este lote tiene promoción aplicable
                    const tienePromocion = loteObj.estaProximoAVencer(60) && promociones.length > 0;
                    const descuento = tienePromocion ? Number(promociones[0].porcentajeDescuento) : 0;
                    const precioUnitario = productObj.calcularPrecioFinal(descuento);
                    const subtotalLote = precioUnitario * cantidadADescontar;

                    // Actualizar o desactivar lote
                    const nuevaCantidad = loteObj.cantidad - cantidadADescontar;
                    if (nuevaCantidad === 0) {
                        // Actualizar o desactivar lote
                        await tx.lote.update({
                            where: { id: loteObj.id },
                            data: { activo: false, cantidad: 0 }
                        });
                    } else {
                        // Actualizar cantidad si aún quedan unidades
                        await tx.lote.update({
                            where: { id: loteObj.id },
                            data: { cantidad: nuevaCantidad }
                        });
                    }

                    // Crear detalle de venta separado por lote (cuando hay diferencia de precio)
                    saleDetailsData.push({
                        idProducto,
                        cantidad: cantidadADescontar,
                        precioUnitario,
                        subtotal: subtotalLote
                    });

                    totalVenta += subtotalLote;
                    cantidadRestante -= cantidadADescontar;
                }

                if (cantidadRestante > 0) throw new Error(`Stock real inconsistente para ${productObj.nombre}`);

                // Actualizar inventario
                await tx.inventario.update({
                    where: { idProducto },
                    data: { stockTotal: { decrement: cantidad }, fechaRevision: new Date() }
                });
            }

            // Registrar venta
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
