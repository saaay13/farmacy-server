import prisma from '../config/prisma';

export class ProductService {
    /**
     * Obtiene una lista de productos filtrada por reglas de seguridad de rol.
     */
    public static async getFilteredProducts(filters: any, userRole: string) {
        const { nombre, idCategoria, estado } = filters;
        const sixtyDaysFromNow = new Date();
        sixtyDaysFromNow.setDate(sixtyDaysFromNow.getDate() + 60);

        return await prisma.producto.findMany({
            where: {
                nombre: nombre ? { contains: String(nombre), mode: 'insensitive' } : undefined,
                idCategoria: idCategoria ? String(idCategoria) : undefined,
                estado: estado ? String(estado) : undefined,

                // Reglas de Visibilidad (Refactorizadas)
                AND: (userRole === 'cliente' || userRole === 'guest') ? [
                    { requiereReceta: false },
                    { estado: 'activo' },
                    {
                        NOT: {
                            lotes: {
                                some: { fechaVencimiento: { lte: sixtyDaysFromNow } }
                            }
                        }
                    }
                ] : []
            },
            include: {
                categoria: true,
                lotes: userRole !== 'cliente' && userRole !== 'guest' // Detalle de lotes solo staff
            },
            orderBy: { nombre: 'asc' }
        });
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
