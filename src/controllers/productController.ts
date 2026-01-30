import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { ProductoModel } from '../models/Producto';
import { ProductService } from '../services/ProductService';

// Listar productos (Refactorizado con Service)
export const getProducts = async (req: Request, res: Response) => {
    try {
        const filters = req.query;
        const userRole = (req as any).user?.rol || 'guest';

        const products = await ProductService.getFilteredProducts(filters, userRole);

        res.json({ success: true, count: products.length, data: products });
    } catch (error: any) {
        res.status(500).json({ success: false, message: 'Error al obtener productos', error: error.message });
    }
};

// Obtener detalle de un producto (Refactorizado con Service)
export const getProductById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const userRole = (req as any).user?.rol || 'guest';

        const productData = await prisma.producto.findUnique({
            where: { id: String(id) },
            include: { categoria: true, lotes: true, inventarios: true, promociones: true }
        });

        if (!productData) return res.status(404).json({ success: false, message: 'Producto no encontrado' });

        // Validar visibilidad con el Servicio
        if (!ProductService.isProductVisible(productData, userRole)) {
            return res.status(403).json({ success: false, message: 'No tiene permiso para ver este producto o está restringido.' });
        }

        const productObj = new ProductoModel(
            productData.id,
            productData.nombre,
            productData.estado,
            Number(productData.precio),
            productData.requiereReceta,
            productData.idCategoria,
            productData.descripcion,
            productData.imageUrl
        );

        res.json({
            success: true,
            data: {
                ...productData,
                lotes: (userRole === 'admin' || userRole === 'farmaceutico') ? productData.lotes : undefined,
                infoPOO: {
                    estado: productObj.getEstado(),
                    precioSugerido: productObj.calcularPrecioFinal(15)
                }
            }
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: 'Error al obtener producto', error: error.message });
    }
};

// Crear un nuevo producto
export const createProduct = async (req: Request, res: Response) => {
    try {
        const { nombre, descripcion, precio, requiereReceta, estado, idCategoria, imageUrl } = req.body;

        if (!nombre || !precio || requiereReceta === undefined || !estado || !idCategoria) {
            return res.status(400).json({ success: false, message: 'Faltan campos obligatorios' });
        }

        const product = await prisma.producto.create({
            data: {
                nombre,
                descripcion,
                precio,
                requiereReceta,
                estado,
                idCategoria,
                imageUrl
            }
        });

        res.status(201).json({ success: true, message: 'Producto creado exitosamente', data: product });
    } catch (error: any) {
        res.status(500).json({ success: false, message: 'Error al crear producto', error: error.message });
    }
};

// Actualizar un producto
export const updateProduct = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const data = req.body;

        const product = await prisma.producto.update({
            where: { id: String(id) },
            data
        });

        res.json({ success: true, message: 'Producto actualizado exitosamente', data: product });
    } catch (error: any) {
        res.status(500).json({ success: false, message: 'Error al actualizar producto', error: error.message });
    }
};

// Eliminar un producto
export const deleteProduct = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        await prisma.producto.update({
            where: { id: String(id) },
            data: { activo: false }
        });

        res.json({ success: true, message: 'Producto eliminado exitosamente' });
    } catch (error: any) {
        if (error.code === 'P2003') {
            return res.status(400).json({
                success: false,
                message: 'No se puede eliminar el producto porque tiene registros asociados'
            });
        }
        res.status(500).json({ success: false, message: 'Error al eliminar producto', error: error.message });
    }
};
// Restaurar un producto desactivado
export const restoreProduct = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const product = await prisma.producto.findUnique({ where: { id: String(id) } });
        if (!product) return res.status(404).json({ success: false, message: 'Producto no encontrado' });

        if (product.activo) {
            return res.status(400).json({ success: false, message: 'El producto ya está activo' });
        }

        const restoredProduct = await prisma.producto.update({
            where: { id: String(id) },
            data: { activo: true }
        });

        res.json({ success: true, message: 'Producto restaurado exitosamente', data: restoredProduct });
    } catch (error: any) {
        res.status(500).json({ success: false, message: 'Error al restaurar producto', error: error.message });
    }
};
