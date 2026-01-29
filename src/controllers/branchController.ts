import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { SucursalModel } from '../models/Sucursal';

// Listar sucursales
export const getSucursales = async (req: Request, res: Response) => {
    try {
        const { includeDeactivated } = req.query;
        const where = includeDeactivated === 'true' ? {} : { activo: true };

        const sucursales = await prisma.sucursal.findMany({
            where,
            orderBy: { nombre: 'asc' }
        });

        const sucursalesWithLogic = sucursales.map((s: any) => {
            const sucObj = new SucursalModel(
                s.idSucursal,
                s.nombre,
                s.direccion
            );

            return {
                ...s,
                detalles: sucObj.getDetalles()
            };
        });

        res.json({
            success: true,
            count: sucursalesWithLogic.length,
            data: sucursalesWithLogic
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: 'Error al obtener sucursales',
            error: error.message
        });
    }
};
export const createSucursal = async (req: Request, res: Response) => {
    try {
        const { nombre, direccion } = req.body;

        if (!nombre || !direccion) {
            return res.status(400).json({
                success: false,
                message: 'Nombre y dirección son obligatorios'
            });
        }

        const sucursal = await prisma.sucursal.create({
            data: { nombre, direccion }
        });

        res.status(201).json({
            success: true,
            message: 'Sucursal creada exitosamente',
            data: sucursal
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: 'Error al crear sucursal',
            error: error.message
        });
    }
};
export const updateSucursal = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { nombre, direccion } = req.body;

        const sucursal = await prisma.sucursal.update({
            where: { idSucursal: String(id) },
            data: { nombre, direccion }
        });

        res.json({
            success: true,
            message: 'Sucursal actualizada exitosamente',
            data: sucursal
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: 'Error al actualizar sucursal',
            error: error.message
        });
    }
};
export const deleteSucursal = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const inventarioCount = await prisma.inventario.count({
            where: { idSucursal: String(id) }
        });

        if (inventarioCount > 0) {
            return res.status(400).json({
                success: false,
                message: 'No se puede eliminar la sucursal porque tiene inventario asociado'
            });
        }

        await prisma.sucursal.update({
            where: { idSucursal: String(id) },
            data: { activo: false }
        });

        res.json({
            success: true,
            message: 'Sucursal desactivada exitosamente'
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: 'Error al desactivar sucursal',
            error: error.message
        });
    }
};

export const restoreSucursal = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        await prisma.sucursal.update({
            where: { idSucursal: String(id) },
            data: { activo: true }
        });

        res.json({
            success: true,
            message: 'Sucursal reactivada exitosamente'
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: 'Error al reactivar sucursal',
            error: error.message
        });
    }
};
