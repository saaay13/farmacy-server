import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { PromocionModel } from '../models/Promocion';

// 1. Obtener promociones (filtrables por aprobación)
export const getPromotions = async (req: Request, res: Response) => {
    try {
        const { aprobada } = req.query;
        const userRole = (req as any).user?.rol || 'guest';

        // Validación de acceso: Clientes/guests solo pueden ver promociones aprobadas
        if ((userRole === 'cliente' || userRole === 'guest') && aprobada !== 'true') {
            return res.status(403).json({
                success: false,
                message: 'Acceso denegado: Solo puede ver promociones aprobadas'
            });
        }

        const promotions = await prisma.promocion.findMany({
            where: {
                aprobada: aprobada !== undefined ? aprobada === 'true' : undefined,
                activo: true
            },
            include: {
                producto: {
                    select: { nombre: true, precio: true, estado: true }
                }
            },
            orderBy: { fechaInicio: 'desc' }
        });

        // --- USO DE MODELO POO ---
        const promotionsWithLogic = promotions.map((p: any) => {
            const promoObj = new PromocionModel(
                p.id,
                p.idProducto,
                Number(p.porcentajeDescuento),
                p.fechaInicio,
                p.fechaFin,
                p.aprobada
            );
            return {
                ...p,
                estaVigente: promoObj.estaVigente(),
                esAprobada: promoObj.esAprobada()
            };
        });

        res.json({ success: true, count: promotionsWithLogic.length, data: promotionsWithLogic });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// 2. Crear una promoción (Sugerencia)
export const createPromotion = async (req: Request, res: Response) => {
    try {
        const { idProducto, porcentajeDescuento, fechaInicio, fechaFin } = req.body;

        if (!idProducto || !porcentajeDescuento || !fechaInicio || !fechaFin) {
            return res.status(400).json({ success: false, message: 'Faltan campos obligatorios' });
        }

        const promotion = await prisma.promocion.create({
            data: {
                idProducto,
                porcentajeDescuento: Number(porcentajeDescuento),
                fechaInicio: new Date(fechaInicio),
                fechaFin: new Date(fechaFin),
                aprobada: false // Por defecto requiere aprobación
            }
        });

        res.status(201).json({ success: true, message: 'Sugerencia de promoción creada', data: promotion });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// 3. Aprobar una promoción (Solo Admin)
export const approvePromotion = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const promotion = await prisma.promocion.findFirst({ where: { id: String(id), activo: true } });
        if (!promotion) {
            return res.status(404).json({ success: false, message: 'Promoción no encontrada' });
        }

        // Usar transacción para aprobar y actualizar estado del producto
        const result = await prisma.$transaction(async (tx: any) => {
            // Aprobar promoción
            const updatedPromotion = await tx.promocion.update({
                where: { id: String(id) },
                data: { aprobada: true }
            });

            // Cambiar estado del producto a 'promocion'
            await tx.producto.update({
                where: { id: promotion.idProducto },
                data: { estado: 'promocion' }
            });

            return updatedPromotion;
        });

        const promoObj = new PromocionModel(
            result.id,
            result.idProducto,
            Number(result.porcentajeDescuento),
            result.fechaInicio,
            result.fechaFin,
            result.aprobada
        );

        res.json({
            success: true,
            message: 'Promoción aprobada y aplicada al producto',
            data: {
                ...result,
                esAprobada: promoObj.esAprobada()
            }
        });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// Eliminar/Rechazar promoción
export const deletePromotion = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const promotion = await prisma.promocion.findFirst({ where: { id: String(id), activo: true } });

        if (promotion && promotion.aprobada) {
            // Si estaba aprobada, devolver el producto a estado 'activo'
            await prisma.producto.update({
                where: { id: promotion.idProducto },
                data: { estado: 'activo' }
            });
        }

        await prisma.promocion.update({
            where: { id: String(id) },
            data: { activo: false }
        });
        res.json({ success: true, message: 'Promoción eliminada' });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
};
// Restaurar una promoción desactivada
export const restorePromotion = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const promotion = await prisma.promocion.findUnique({ where: { id: String(id) } });
        if (!promotion) return res.status(404).json({ success: false, message: 'Promoción no encontrada' });

        if (promotion.activo) {
            return res.status(400).json({ success: false, message: 'La promoción ya está activa' });
        }

        const restoredPromotion = await prisma.promocion.update({
            where: { id: String(id) },
            data: { activo: true }
        });

        res.json({ success: true, message: 'Promoción restaurada exitosamente', data: restoredPromotion });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
};
