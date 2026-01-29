import prisma from '../config/prisma';

export class ProductService {
    /**
     * Obtiene una lista de productos filtrada por reglas de seguridad de rol.
     */
    public static async getFilteredProducts(filters: any, userRole: string) {
        const { nombre, idCategoria, estado } = filters;
        const sixtyDaysFromNow = new Date();
        sixtyDaysFromNow.setDate(sixtyDaysFromNow.getDate() + 60);

        const results = await prisma.producto.findMany({
            where: {
                nombre: nombre ? { contains: String(nombre), mode: 'insensitive' } : undefined,
                idCategoria: idCategoria ? String(idCategoria) : undefined,
                estado: estado ? String(estado) : undefined,

                // Reglas de Visibilidad (Refactorizadas)
                AND: (userRole === 'cliente' || userRole === 'guest') ? [
                    // { requiereReceta: false }, // PERMITIMOS ver productos con receta (Fase 6)
                    {
                        // Permitir productos activos O productos en promoción aprobada
                        OR: [
                            { estado: 'activo' },
                            {
                                // Productos con promoción aprobada y vigente
                                AND: [
                                    { estado: 'promocion' },
                                    {
                                        promociones: {
                                            some: {
                                                aprobada: true,
                                                fechaInicio: { lte: new Date(new Date().setHours(23, 59, 59, 999)) },
                                                fechaFin: { gte: new Date(new Date().setHours(0, 0, 0, 0)) }
                                            }
                                        }
                                    }
                                ]
                            }
                        ]
                    },
                    {
                        // Visibilidad: Mostrar productos con al menos un lote vigente (incluyendo hoy)
                        lotes: {
                            some: {
                                fechaVencimiento: { gte: new Date(new Date().setHours(0, 0, 0, 0)) }
                            }
                        }
                    }
                ] : []
            },
            include: {
                categoria: true,
                lotes: userRole !== 'cliente' && userRole !== 'guest', // Detalle de lotes solo staff
                inventario: userRole !== 'cliente' && userRole !== 'guest', // Stock total solo staff
                promociones: {
                    where: {
                        aprobada: true,
                        // Normalizar a medianoche para comparación de fechas
                        fechaInicio: { lte: new Date(new Date().setHours(23, 59, 59, 999)) }, // Comenzó hoy o antes
                        fechaFin: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } // Termina hoy o después
                    }
                }
            },
            orderBy: { nombre: 'asc' }
        });

        return results;
    }

    /**
     * Valida si un producto es visible para un rol específico.
     */
    public static isProductVisible(product: any, userRole: string): boolean {
        if (userRole === 'admin' || userRole === 'farmaceutico') return true;

        const sixtyDaysFromNow = new Date();
        sixtyDaysFromNow.setDate(sixtyDaysFromNow.getDate() + 60);

        if (product.requiereReceta) return false;
        if (product.estado !== 'activo') return false;

        const hasExpiringBatch = product.lotes?.some((l: any) => new Date(l.fechaVencimiento) <= sixtyDaysFromNow);
        if (hasExpiringBatch) return false;

        return true;
    }
}
