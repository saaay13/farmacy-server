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

            // Obtener sucursal del vendedor
            const seller = await tx.usuario.findUnique({ where: { id: idVendedor }, select: { idSucursal: true } });
            if (!seller || !seller.idSucursal) throw new Error("El vendedor no tiene una sucursal asignada");
            const idSucursal = seller.idSucursal;

            for (const item of detalles) {
                const { idProducto, cantidad } = item;

                // Validar producto
                const productData = await tx.producto.findUnique({ where: { id: idProducto } });
                if (!productData) throw new Error(`Producto ${idProducto} no encontrado`);

                if (!productData.activo) {
                    // Registrar intento bloqueado por producto inactivo (Fuera de la transacción)
                    await prisma.intentoBloqueado.create({
                        data: {
                            idVendedor,
                            idCliente,
                            motivo: 'PRODUCTO_INACTIVO',
                            idProducto,
                            cantidadIntento: cantidad,
                            mensaje: `BLOQUEO: Intento de vender el producto ${productData.nombre} que está inactivo`,
                            fecha: new Date()
                        }
                    });
                    throw new Error(`BLOQUEO: El producto ${productData.nombre} está inactivo.`);
                }

                const productObj = new ProductoModel(
                    productData.id,
                    productData.nombre,
                    productData.estado,
                    Number(productData.precio),
                    productData.requiereReceta,
                    productData.idCategoria
                );

                if (!productObj.puedeSerCompradoPor(userRole)) {
                    // Registrar intento bloqueado por receta médica (Fuera de la transacción para que persista)
                    await prisma.intentoBloqueado.create({
                        data: {
                            idVendedor,
                            idCliente,
                            motivo: 'REQUIERE_RECETA',
                            idProducto,
                            cantidadIntento: cantidad,
                            mensaje: `BLOQUEO: El producto ${productObj.nombre} requiere receta médica y no puede ser vendido a clientes sin autorización`,
                            fecha: new Date()
                        }
                    });
                    throw new Error(`BLOQUEO: El producto ${productObj.nombre} requiere receta y no puede ser comprado por su rol actual.`);
                }

                // Verificar stock en la sucursal del vendedor
                const inventory = await tx.inventario.findUnique({
                    where: {
                        idProducto_idSucursal: {
                            idProducto,
                            idSucursal
                        }
                    }
                });
                if (!inventory || inventory.stockTotal < cantidad) {
                    // Registrar intento bloqueado por stock insuficiente (Fuera de la transacción)
                    await prisma.intentoBloqueado.create({
                        data: {
                            idVendedor,
                            idCliente,
                            motivo: 'STOCK_INSUFICIENTE',
                            idProducto,
                            cantidadIntento: cantidad,
                            mensaje: `BLOQUEO: Stock insuficiente para ${productObj.nombre}. Stock actual: ${inventory?.stockTotal || 0}, Solicitado: ${cantidad}`,
                            fecha: new Date()
                        }
                    });
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
                    where: { idProducto, idSucursal, activo: true },
                    orderBy: { fechaVencimiento: 'asc' }
                });

                for (const l of lotesData) {
                    if (cantidadRestante <= 0) break;

                    const loteObj = new LoteModel(l.id, l.idProducto, l.fechaVencimiento, l.cantidad, l.numeroLote, l.idSucursal);

                    if (loteObj.estaVencido()) {
                        hayProductoVencido = true;

                        // Registrar intento bloqueado por producto vencido (Fuera de la transacción)
                        await prisma.intentoBloqueado.create({
                            data: {
                                idVendedor,
                                idCliente,
                                motivo: 'PRODUCTO_VENCIDO',
                                idProducto,
                                idLote: loteObj.id,
                                cantidadIntento: cantidad,
                                mensaje: `BLOQUEO: Lote ${loteObj.numeroLote} de ${productObj.nombre} está vencido (vencimiento: ${loteObj.fechaVencimiento.toLocaleDateString()})`,
                                fecha: new Date()
                            }
                        });

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
                        idLote: loteObj.id,
                        cantidad: cantidadADescontar,
                        precioUnitario,
                        subtotal: subtotalLote
                    });

                    totalVenta += subtotalLote;
                    cantidadRestante -= cantidadADescontar;
                }

                if (cantidadRestante > 0) throw new Error(`Stock real inconsistente para ${productObj.nombre}`);

                // Actualizar inventario de la sucursal
                await tx.inventario.update({
                    where: {
                        idProducto_idSucursal: {
                            idProducto,
                            idSucursal
                        }
                    },
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
