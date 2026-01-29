import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { VentaModel } from '../models/Venta';
import { DetalleVentaModel } from '../models/DetalleVenta';
import { SaleService } from '../services/SaleService';

// Crear una Venta (Refactorizado con Service + OOP)
export const createSale = async (req: Request, res: Response) => {
    try {
        const { idCliente, detalles } = req.body;
        const idVendedor = (req as any).user.id;
        const userRole = (req as any).user.rol;

        if (!detalles || detalles.length === 0) {
            return res.status(400).json({ success: false, message: 'La venta debe tener al menos un producto' });
        }

        // Delegar lógica al servicio de dominio
        const saleRecord = await SaleService.processSale(idCliente, idVendedor, userRole, detalles);

        // Uso de modelos para respuesta enriquecida
        const ventaObj = new VentaModel(
            saleRecord.id,
            saleRecord.idVendedor,
            saleRecord.fecha,
            Number(saleRecord.total),
            saleRecord.idCliente,
            saleRecord.ventaError ?? false
        );

        res.status(201).json({
            success: true,
            message: 'Venta realizada con éxito (Arquitectura OOP)',
            data: {
                ...saleRecord,
                infoEstado: ventaObj.ventaError ? 'CRÍTICA' : 'OK',
                totalFormateado: ventaObj.getTotal().toFixed(2)
            }
        });
    } catch (error: any) {
        console.error('Sale Error:', error.message);
        res.status(400).json({ success: false, message: error.message });
    }
};

// Obtener historial de ventas (Con Filtrado por Dueño)
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

// Ver detalle de una venta (Con Validación de Acceso)
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
