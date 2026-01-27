import { Request, Response } from 'express';
import prisma from '../config/prisma';

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

            for (const item of detalles) {
                const { idProducto, cantidad } = item;

                // A. Obtener producto y validar receta
                const producto = await tx.producto.findUnique({ where: { id: idProducto } });
                if (!producto) throw new Error(`Producto ${idProducto} no encontrado`);

                if (producto.requiereReceta && userRole === 'cliente') {
                    throw new Error(`El producto ${producto.nombre} requiere receta y no puede ser comprado directamente por un cliente.`);
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

                for (const lote of lotes) {
                    if (cantidadRestante <= 0) break;

                    if (lote.cantidad >= cantidadRestante) {
                        // El lote tiene suficiente para cubrir lo que queda
                        await tx.lote.update({
                            where: { id: lote.id },
                            data: { cantidad: lote.cantidad - cantidadRestante }
                        });
                        cantidadRestante = 0;
                    } else {
                        // Agotar este lote y seguir con el siguiente
                        cantidadRestante -= lote.cantidad;
                        await tx.lote.update({
                            where: { id: lote.id },
                            data: { cantidad: 0 }
                        });
                        // Opcional: podrías borrar el lote si llega a 0, 
                        // pero según regla se da de baja si vence. Aquí solo bajamos stock.
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

                // E. Preparar datos para el detalle y calcular total
                const subtotal = Number(producto.precio) * cantidad;
                totalVenta += subtotal;

                saleDetailsData.push({
                    idProducto,
                    cantidad,
                    precioUnitario: producto.precio,
                    subtotal
                });
            }

            // 2. Crear la Venta (Cabecera)
            const sale = await tx.venta.create({
                data: {
                    idCliente,
                    idVendedor,
                    fecha: new Date(),
                    total: totalVenta,
                    detalles: {
                        create: saleDetailsData
                    }
                },
                include: { detalles: true }
            });

            return sale;
        });

        res.status(201).json({ success: true, message: 'Venta realizada con éxito', data: result });
    } catch (error: any) {
        console.error('Sale Error:', error.message);
        res.status(400).json({ success: false, message: error.message });
    }
};

// 2. Obtener historial de ventas
export const getSales = async (req: Request, res: Response) => {
    try {
        const sales = await prisma.venta.findMany({
            include: {
                cliente: { select: { nombre: true, email: true } },
                vendedor: { select: { nombre: true, rol: true } },
                detalles: {
                    include: { producto: { select: { nombre: true } } }
                }
            },
            orderBy: { fecha: 'desc' }
        });
        res.json({ success: true, data: sales });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// 3. Ver detalle de una venta
export const getSaleById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const sale = await prisma.venta.findUnique({
            where: { id: String(id) },
            include: {
                cliente: true,
                vendedor: true,
                detalles: { include: { producto: true } }
            }
        });

        if (!sale) return res.status(404).json({ success: false, message: 'Venta no encontrada' });
        res.json({ success: true, data: sale });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
};
