import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { CategoriaModel } from '../models/Categoria';

// Listar todas las categorías
export const getCategories = async (req: Request, res: Response) => {
    try {
        const { includeDeactivated } = req.query;
        const categories = await prisma.categoria.findMany({
            where: { activo: includeDeactivated === 'true' ? undefined : true },
            orderBy: { nombre: 'asc' }
        });

        // --- USO DE MODELO POO ---
        const categoriesWithLogic = categories.map((c: any) => {
            const catObj = new CategoriaModel(c.id, c.nombre);
            return {
                ...c,
                nombreDisplay: catObj.getNombreFormateado()
            };
        });

        res.json({ success: true, count: categoriesWithLogic.length, data: categoriesWithLogic });
    } catch (error: any) {
        console.error('Error al obtener categorías:', error);
        res.status(500).json({ success: false, message: 'Error al obtener categorías', error: error.message });
    }
};

// Crear una nueva categoría
export const createCategory = async (req: Request, res: Response) => {
    try {
        const { nombre } = req.body;

        if (!nombre) {
            return res.status(400).json({ success: false, message: 'El nombre es obligatorio' });
        }

        const category = await prisma.categoria.create({
            data: { nombre }
        });

        res.status(201).json({ success: true, message: 'Categoría creada exitosamente', data: category });
    } catch (error: any) {
        if (error.code === 'P2002') {
            return res.status(400).json({ success: false, message: 'La categoría ya existe' });
        }
        res.status(500).json({ success: false, message: 'Error al crear categoría', error: error.message });
    }
};

// Actualizar una categoría
export const updateCategory = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { nombre } = req.body;

        const category = await prisma.categoria.update({
            where: { id: String(id) },
            data: { nombre }
        });

        res.json({ success: true, message: 'Categoría actualizada exitosamente', data: category });
    } catch (error: any) {
        res.status(500).json({ success: false, message: 'Error al actualizar categoría', error: error.message });
    }
};

// Eliminar una categoría
export const deleteCategory = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        // Verificar si tiene productos asociados antes de eliminar
        const productsCount = await prisma.producto.count({
            where: { idCategoria: String(id) }
        });

        if (productsCount > 0) {
            return res.status(400).json({
                success: false,
                message: 'No se puede eliminar una categoría que tiene productos asociados'
            });
        }

        await prisma.categoria.update({
            where: { id: String(id) },
            data: { activo: false }
        });

        res.json({ success: true, message: 'Categoría eliminada exitosamente' });
    } catch (error: any) {
        res.status(500).json({ success: false, message: 'Error al eliminar categoría', error: error.message });
    }
};

// Restaurar una categoría (Solo Admin y Farmacéutico)
export const restoreCategory = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const category = await prisma.categoria.findUnique({ where: { id: String(id) } });
        if (!category) return res.status(404).json({ success: false, message: 'Categoría no encontrada' });

        if (category.activo) {
            return res.status(400).json({ success: false, message: 'La categoría ya está activa' });
        }

        const restoredCategory = await prisma.categoria.update({
            where: { id: String(id) },
            data: { activo: true }
        });

        res.json({ success: true, message: 'Categoría restaurada exitosamente', data: restoredCategory });
    } catch (error: any) {
        res.status(500).json({ success: false, message: 'Error al restaurar categoría', error: error.message });
    }
};
