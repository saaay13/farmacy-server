import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { IntentoBloqueadoModel } from '../models/IntentoBloqueado';

// Obtener todos los intentos bloqueados con filtros
export const getBlockedAttempts = async (req: Request, res: Response) => {
    try {
        const { motivo, idVendedor, desde, hasta } = req.query;

        const attempts = await prisma.intentoBloqueado.findMany({
            where: {
                motivo: motivo ? String(motivo) : undefined,
                idVendedor: idVendedor ? String(idVendedor) : undefined,
                fecha: {
                    gte: desde ? new Date(String(desde)) : undefined,
                    lte: hasta ? new Date(String(hasta)) : undefined
                }
            },
            include: {
                vendedor: { select: { nombre: true, email: true, rol: true } },
                cliente: { select: { nombre: true, email: true } },
                producto: { select: { nombre: true, precio: true, requiereReceta: true } },
                lote: { select: { numeroLote: true, fechaVencimiento: true } }
            },
            orderBy: { fecha: 'desc' }
        });

        // Enriquecer con modelo POO
        const enrichedAttempts = attempts.map((a: any) => {
            const intentoObj = new IntentoBloqueadoModel(
                a.id,
                a.idVendedor,
                a.fecha,
                a.motivo,
                a.idProducto,
                a.cantidadIntento,
                a.mensaje,
                a.idCliente,
                a.idLote
            );

            return {
                ...a,
                motivoLegible: intentoObj.getMotivoLegible(),
                esReciente: intentoObj.esReciente(),
                resumen: intentoObj.getResumen()
            };
        });

        res.json({
            success: true,
            title: 'Intentos de Venta Bloqueados',
            count: enrichedAttempts.length,
            data: enrichedAttempts
        });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// Obtener estadísticas de bloqueos
export const getBlockedAttemptStats = async (req: Request, res: Response) => {
    try {
        const { dias = 30 } = req.query;
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - Number(dias));

        // Total por motivo
        const byMotivo = await prisma.intentoBloqueado.groupBy({
            by: ['motivo'],
            where: { fecha: { gte: startDate } },
            _count: { id: true }
        });

        // Total por vendedor
        const byVendedor = await prisma.intentoBloqueado.groupBy({
            by: ['idVendedor'],
            where: { fecha: { gte: startDate } },
            _count: { id: true },
            orderBy: { _count: { id: 'desc' } },
            take: 5
        });

        // Enriquecer con nombres de vendedores
        const vendedoresConNombres = await Promise.all(
            byVendedor.map(async (item) => {
                const vendedor = await prisma.usuario.findUnique({
                    where: { id: item.idVendedor },
                    select: { nombre: true, email: true, rol: true }
                });
                return {
                    vendedor: vendedor?.nombre || 'Desconocido',
                    email: vendedor?.email,
                    rol: vendedor?.rol,
                    intentos: item._count.id
                };
            })
        );

        // Productos más bloqueados
        const byProducto = await prisma.intentoBloqueado.groupBy({
            by: ['idProducto'],
            where: { fecha: { gte: startDate } },
            _count: { id: true },
            orderBy: { _count: { id: 'desc' } },
            take: 5
        });

        const productosConNombres = await Promise.all(
            byProducto.map(async (item) => {
                const producto = await prisma.producto.findUnique({
                    where: { id: item.idProducto },
                    select: { nombre: true, requiereReceta: true }
                });
                return {
                    producto: producto?.nombre || 'Desconocido',
                    requiereReceta: producto?.requiereReceta || false,
                    intentos: item._count.id
                };
            })
        );

        // Total de intentos
        const totalIntentos = byMotivo.reduce((sum, item) => sum + item._count.id, 0);

        res.json({
            success: true,
            title: `Estadísticas de Bloqueos (Últimos ${dias} días)`,
            data: {
                totalIntentos,
                porMotivo: byMotivo.map(m => ({
                    motivo: m.motivo,
                    cantidad: m._count.id,
                    porcentaje: ((m._count.id / totalIntentos) * 100).toFixed(2)
                })),
                topVendedores: vendedoresConNombres,
                topProductos: productosConNombres
            }
        });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// Obtener intentos de un vendedor específico
export const getBlockedAttemptsByVendedor = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const attempts = await prisma.intentoBloqueado.findMany({
            where: { idVendedor: String(id) },
            include: {
                producto: { select: { nombre: true, precio: true } },
                lote: { select: { numeroLote: true, fechaVencimiento: true } },
                cliente: { select: { nombre: true } }
            },
            orderBy: { fecha: 'desc' }
        });

        // Estadísticas del vendedor
        const stats = {
            totalIntentos: attempts.length,
            porMotivo: await prisma.intentoBloqueado.groupBy({
                by: ['motivo'],
                where: { idVendedor: String(id) },
                _count: { id: true }
            })
        };

        res.json({
            success: true,
            count: attempts.length,
            stats,
            data: attempts
        });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// Obtener intentos recientes (últimas 24 horas)
export const getRecentBlockedAttempts = async (req: Request, res: Response) => {
    try {
        const twentyFourHoursAgo = new Date();
        twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

        const attempts = await prisma.intentoBloqueado.findMany({
            where: {
                fecha: { gte: twentyFourHoursAgo }
            },
            include: {
                vendedor: { select: { nombre: true, rol: true } },
                producto: { select: { nombre: true } },
                lote: { select: { numeroLote: true, fechaVencimiento: true } }
            },
            orderBy: { fecha: 'desc' }
        });

        res.json({
            success: true,
            title: 'Intentos Bloqueados (Últimas 24 horas)',
            count: attempts.length,
            data: attempts
        });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
};
