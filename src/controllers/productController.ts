import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { ProductoModel } from '../models/Producto';

// Listar productos con filtros (nombre, categoría, estado)
export const getProducts = async (req: Request, res: Response) => {
    try {
        const { nombre, idCategoria, estado } = req.query;
        const userRole = (req as any).user?.rol || 'guest';

        const sixtyDaysFromNow = new Date();
        sixtyDaysFromNow.setDate(sixtyDaysFromNow.getDate() + 60);

        const products = await prisma.producto.findMany({
            where: {
                nombre: nombre ? { contains: String(nombre), mode: 'insensitive' } : undefined,
                idCategoria: idCategoria ? String(idCategoria) : undefined,
                estado: estado ? String(estado) : undefined,

                // SEGURIDAD: Si es cliente o invitado, aplicamos restricciones estrictas
                AND: (userRole === 'cliente' || userRole === 'guest') ? [
                    { requiereReceta: false }, // No ve productos con receta
                    {
                        NOT: {
                            lotes: {
                                some: {
                                    fechaVencimiento: { lte: sixtyDaysFromNow }
                                }
                            }
                        }
                    } // No ve productos con lotes próximos a vencer (<= 60 días)
                ] : []
            },
            include: {
                categoria: true,
                lotes: userRole !== 'cliente' // Solo admin/staff ven detalles de lotes
            },
            orderBy: { nombre: 'asc' }
        });

        res.json({ success: true, count: products.length, data: products });
    } catch (error: any) {
        console.error('Error al obtener productos:', error);
        res.status(500).json({ success: false, message: 'Error al obtener productos', error: error.message });
    }
};

// Obtener detalle de un producto
export const getProductById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const userRole = (req as any).user?.rol || 'guest';

        const sixtyDaysFromNow = new Date();
        sixtyDaysFromNow.setDate(sixtyDaysFromNow.getDate() + 60);

        const productData = await prisma.producto.findUnique({
            where: { id: String(id) },
            include: {
                categoria: true,
                lotes: true,
                inventario: true
            }
        });

        if (!productData) {
            return res.status(404).json({ success: false, message: 'Producto no encontrado' });
        }

        // SEGURIDAD: Validación manual para preventas por ID directo de clientes/invitados
        if (userRole === 'cliente' || userRole === 'guest') {
            if (productData.requiereReceta) {
                return res.status(403).json({ success: false, message: 'Este producto requiere receta y no puede ser visualizado por clientes públicos.' });
            }

            const hasExpiringBaches = productData.lotes.some((l: any) => new Date(l.fechaVencimiento) <= sixtyDaysFromNow);
            if (hasExpiringBaches) {
                return res.status(403).json({ success: false, message: 'Este producto no está disponible para venta directa por proximidad de vencimiento.' });
            }
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

        const finalResponse = {
            ...productData,
            lotes: (userRole === 'cliente' || userRole === 'guest') ? undefined : productData.lotes, // Ocultar lotes a clientes
            infoEstado: productObj.getEstado(),
            precioConDescuentoSugerido: productObj.calcularPrecioFinal(15)
        };

        res.json({ success: true, data: finalResponse });
    } catch (error: any) {
        res.status(500).json({ success: false, message: 'Error al obtener detalle del producto', error: error.message });
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

        await prisma.producto.delete({
            where: { id: String(id) }
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
