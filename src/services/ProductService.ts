import prisma from '../config/prisma';

export class ProductService {
    // Obtener productos filtrados
    public static async getFilteredProducts(filters: any, userRole: string) {
        const { nombre, idCategoria, estado, includeDeactivated, idSucursal } = filters;
        const sixtyDaysFromNow = new Date();
        sixtyDaysFromNow.setDate(sixtyDaysFromNow.getDate() + 60);

        const products = await prisma.producto.findMany({
            where: {
                nombre: nombre ? { contains: String(nombre), mode: 'insensitive' } : undefined,
                idCategoria: idCategoria ? String(idCategoria) : undefined,
                estado: estado ? String(estado) : undefined,
                activo: String(includeDeactivated) === 'true' ? undefined : true,
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
                                                activo: true,
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
                                fechaVencimiento: { gt: new Date() },
                                idSucursal: idSucursal ? String(idSucursal) : undefined
                            }
                        }
                    }
                ] : []
            },
            include: {
                categoria: true,
                lotes: {
                    where: {
                        fechaVencimiento: { gt: new Date() },
                        activo: true,
                        idSucursal: idSucursal ? String(idSucursal) : undefined
                    },
                    orderBy: { fechaVencimiento: 'asc' }
                },
                inventarios: {
                    where: idSucursal ? { idSucursal: String(idSucursal) } : undefined
                },
                promociones: {
                    where: {
                        aprobada: true,
                        activo: true,
                        fechaInicio: { lte: new Date(new Date().setHours(23, 59, 59, 999)) },
                        fechaFin: { gte: new Date(new Date().setHours(0, 0, 0, 0)) }
                    }
                }
            },
            orderBy: { nombre: 'asc' }
        });

        // --- REGLA DE NEGOCIO: FILTRAR STOCK REAL SEGÚN REGLA "PROMO O BLOQUEO" ---
        // sixtyDaysFromNow ya está definida arriba

        const results = products.map(product => {
            const tienePromoActiva = product.estado === 'promocion' && product.promociones.length > 0;

            // Filtrar los lotes que realmente son vendibles
            const lotesVendibles = product.lotes.filter(lote => {
                const fechaVenc = new Date(lote.fechaVencimiento);
                const estaProximo = fechaVenc <= sixtyDaysFromNow;

                // Si está próximo, solo es vendible si hay promo
                if (estaProximo) {
                    return tienePromoActiva;
                }
                // Si está bien (más de 60 días), es vendible
                return true;
            });

            // Recalcular el stock disponible basado solo en lotes vendibles
            const stockReal = lotesVendibles.reduce((acc, l) => acc + l.cantidad, 0);

            return {
                ...product,
                lotes: userRole === 'cliente' || userRole === 'guest' ? undefined : lotesVendibles,
                stockDisponible: stockReal, // Campo virtual para el frontend
                inventarios: product.inventarios.map(inv => ({
                    ...inv,
                    stockTotal: stockReal // Sincronizamos el stock mostrado con la realidad de los lotes vendibles
                }))
            };
        });

        // REGLA: Si el usuario es cliente/guest, ocultar productos que al final quedaron con stock 0 
        // (porque todos sus lotes estaban próximos y NO tenían promo)
        if (userRole === 'cliente' || userRole === 'guest') {
            return results.filter(p => p.stockDisponible > 0);
        }

        return results;
    }

    // Validar visibilidad (usado en detalles o búsquedas directas)
    public static isProductVisible(product: any, userRole: string): boolean {
        // Roles internos ven todo
        if (userRole === 'admin' || userRole === 'farmaceutico' || userRole === 'vendedor') return true;

        // Reglas para Clientes/Guests

        // 1. Estado inválido (debe ser activo o promocion con promo vigente)
        const tienePromoActiva = product.estado === 'promocion' && product.promociones?.some((p: any) => {
            const now = new Date();
            return p.aprobada && p.activo && new Date(p.fechaInicio) <= now && new Date(p.fechaFin) >= now;
        });

        if (product.estado !== 'activo' && !tienePromoActiva) return false;

        // 2. Verificar si tiene stock vendible
        const sixtyDaysFromNow = new Date();
        sixtyDaysFromNow.setDate(sixtyDaysFromNow.getDate() + 60);

        const hasVendibleStock = product.lotes?.some((l: any) => {
            const fechaVenc = new Date(l.fechaVencimiento);
            const estaProximo = fechaVenc <= sixtyDaysFromNow;
            const noVencido = fechaVenc > new Date();

            if (!noVencido) return false;

            // Si está próximo, solo es vendible si hay promo activa
            if (estaProximo) {
                return tienePromoActiva;
            }
            return true;
        });

        return !!hasVendibleStock;
    }
}
