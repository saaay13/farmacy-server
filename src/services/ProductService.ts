import prisma from '../config/prisma';

export class ProductService {
    // Obtener productos filtrados
    public static async getFilteredProducts(filters: any, userRole: string) {
        const { nombre, idCategoria, estado, includeDeactivated, idSucursal } = filters;
        const sixtyDaysFromNow = new Date();
        sixtyDaysFromNow.setDate(sixtyDaysFromNow.getDate() + 60);

        const results = await prisma.producto.findMany({
            where: {
                nombre: nombre ? { contains: String(nombre), mode: 'insensitive' } : undefined,
                idCategoria: idCategoria ? String(idCategoria) : undefined,
                estado: estado ? String(estado) : undefined,
                activo: String(includeDeactivated) === 'true' ? undefined : true,

                // Reglas de visibilidad
                AND: (userRole === 'cliente' || userRole === 'guest') ? [
                    {
                        OR: [
                            { estado: 'activo' },
                            {
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
                        lotes: {
                            some: {
                                fechaVencimiento: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
                                idSucursal: idSucursal ? String(idSucursal) : undefined
                            }
                        }
                    }
                ] : []
            },
            include: {
                categoria: true,
                lotes: (userRole !== 'cliente' && userRole !== 'guest') ? {
                    where: idSucursal ? { idSucursal: String(idSucursal) } : undefined,
                    orderBy: { fechaVencimiento: 'asc' }
                } : false,
                inventarios: (userRole !== 'cliente' && userRole !== 'guest') ? {
                    where: idSucursal ? { idSucursal: String(idSucursal) } : undefined
                } : false,
                promociones: {
                    where: {
                        aprobada: true,
                        fechaInicio: { lte: new Date(new Date().setHours(23, 59, 59, 999)) },
                        fechaFin: { gte: new Date(new Date().setHours(0, 0, 0, 0)) }
                    }
                }
            },
            orderBy: { nombre: 'asc' }
        });

        return results;
    }

    // Validar visibilidad
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
