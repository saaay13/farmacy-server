import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { VentaModel } from '../models/Venta';
import { DetalleVentaModel } from '../models/DetalleVenta';

// 1. Crear una Venta
export const createSale = async (req: Request, res: Response) => {
    const { idCliente, detalles } = req.body; // detalles: [{idProducto, cantidad}]
    const idVendedor = (req as any).user.id;
    const userRole = (req as any).user.rol;

    if (!detalles || detalles.length === 0) {
        return res.status(400).json({ success: false, message: 'La venta debe tener al menos un producto' });
    }

    try {
        const result = await prisma.$transaction(async (tx: any) => {
            let totalVenta = 0;
            const saleDetailsData = [];
            let hayProductoVencido = false;

            for (const item of detalles) {
                const { idProducto, cantidad } = item;

                // A. Obtener producto y validar receta
                const producto = await tx.producto.findUnique({ where: { id: idProducto } });
                if (!producto) throw new Error(`Producto ${idProducto} no encontrado`);

                // Regla: Clientes no pueden comprar directamente medicamentos con receta
                if (producto.requiereReceta && userRole === 'cliente') {
                    throw new Error(`El producto ${producto.nombre} requiere receta y no puede ser comprado directamente por un cliente. Por favor acuda a sucursal.`);
                }

                // B. Verificar stock en Inventario
                const inventory = await tx.inventario.findUnique({ where: { idProducto } });
                if (!inventory || inventory.stockTotal < cantidad) {
                    throw new Error(`Stock insuficiente para ${producto.nombre}. Disponible: ${inventory?.stockTotal || 0}`);
                }

                // C. Descontar de Lotes (FIFO: primero los que vencen antes)
                let cantidadRestante = cantidad;
                const lotes = await tx.lote.findMany({
                    where: { idProducto },
                    orderBy: { fechaVencimiento: 'asc' }
                });

                const today = new Date();

                for (const lote of lotes) {
                    if (cantidadRestante <= 0) break;

                    // VALIDACIÓN DE VENCIMIENTO (Regla de Oro)
                    if (new Date(lote.fechaVencimiento) < today) {
                        // El sistema debe bloquear la venta de productos vencidos
                        // Excepto si queremos registrar el error (punto 15/46)
                        // Por ahora bloqueamos estrictamente a menos que se fuerce (lógica futura)
                        hayProductoVencido = true;
                        throw new Error(`BLOQUEO: El lote ${lote.numeroLote} del producto ${producto.nombre} está vencido. No se puede realizar la venta.`);
                    }

                    if (lote.cantidad >= cantidadRestante) {
                        await tx.lote.update({
                            where: { id: lote.id },
                            data: { cantidad: lote.cantidad - cantidadRestante }
                        });
                        cantidadRestante = 0;
                    } else {
                        cantidadRestante -= lote.cantidad;
                        await tx.lote.update({
                            where: { id: lote.id },
                            data: { cantidad: 0 }
                        });
                    }
                }

                if (cantidadRestante > 0) {
                    throw new Error(`Error inesperado: No hay lotes suficientes para cubrir el stock del producto ${producto.nombre}`);
                }

                // D. Actualizar Inventario global
                await tx.inventario.update({
                    where: { idProducto },
                    data: {
                        stockTotal: { decrement: cantidad },
                        fechaRevision: new Date()
                    }
                });

                // E. Preparar datos para el detalle
                const subtotal = Number(producto.precio) * cantidad;
                totalVenta += subtotal;

                saleDetailsData.push({
                    idProducto,
                    cantidad,
                    precioUnitario: Number(producto.precio),
                    subtotal
                });
            }

            // 2. Crear la Venta (Cabecera)
            const saleData = await tx.venta.create({
                data: {
                    idCliente,
                    idVendedor,
                    fecha: new Date(),
                    total: totalVenta,
                    ventaError: hayProductoVencido, // Se marca si hubo algún vencido involucrado
                    detalles: {
                        create: saleDetailsData
                    }
                },
                include: { detalles: true }
            });

            // --- USO DE MODELOS POO ---
            const ventaObj = new VentaModel(
                saleData.id,
                saleData.idVendedor,
                saleData.fecha,
                Number(saleData.total),
                saleData.idCliente,
                saleData.ventaError ?? false
            );

            const detallesObj = saleData.detalles.map((d: any) =>
                new DetalleVentaModel(d.id, d.idVenta, d.idProducto, d.cantidad, Number(d.precioUnitario))
            );

            return {
                ...saleData,
                totalCalculado: ventaObj.getTotal(),
                infoEstado: ventaObj.ventaError ? 'VENTA CON ERROR (Producto Vencido)' : 'VENTA OK',
                resumenDetalles: detallesObj.map((d: any) => ({
                    productoId: d.idProducto,
                    subtotal: d.getSubtotal()
                }))
            };
        });

        res.status(201).json({ success: true, message: 'Venta realizada con éxito (Modelo POO)', data: result });
    } catch (error: any) {
        console.error('Sale Error:', error.message);
        res.status(400).json({ success: false, message: error.message });
    }
};

// 2. Obtener historial de ventas (Con Filtrado por Dueño)
export const getSales = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const userRole = (req as any).user.rol;

        // SEGURIDAD: Si es cliente, solo ve sus propias compras
        const sales = await prisma.venta.findMany({
            where: {
                idCliente: userRole === 'cliente' ? userId : undefined
            },
            include: {
                cliente: { select: { nombre: true, email: true } },
                vendedor: { select: { nombre: true, rol: true } },
                detalles: {
                    include: { producto: { select: { nombre: true } } }
                }
            },
            orderBy: { fecha: 'desc' }
        });

        const optimizedSales = sales.map((s: any) => {
            const ventaObj = new VentaModel(s.id, s.idVendedor, s.fecha, Number(s.total), s.idCliente, s.ventaError ?? false);
            return {
                ...s,
                totalFormateado: ventaObj.getTotal().toFixed(2),
                esVentaCritica: ventaObj.ventaError
            };
        });

        res.json({ success: true, count: optimizedSales.length, data: optimizedSales });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// 3. Ver detalle de una venta (Con Validación de Acceso)
export const getSaleById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const userId = (req as any).user.id;
        const userRole = (req as any).user.rol;

        const sale = await prisma.venta.findUnique({
            where: { id: String(id) },
            include: {
                cliente: true,
                vendedor: true,
                detalles: { include: { producto: true } }
            }
        });

        if (!sale) return res.status(404).json({ success: false, message: 'Venta no encontrada' });

        // SEGURIDAD: Un cliente solo puede ver el detalle si la venta es suya
        if (userRole === 'cliente' && sale.idCliente !== userId) {
            return res.status(403).json({ success: false, message: 'No tiene permiso para ver esta venta' });
        }

        const ventaObj = new VentaModel(sale.id, sale.idVendedor, sale.fecha, Number(sale.total), sale.idCliente, sale.ventaError ?? false);

        res.json({
            success: true,
            data: {
                ...sale,
                infoPOO: {
                    total: ventaObj.getTotal(),
                    esError: ventaObj.ventaError
                }
            }
        });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
};
