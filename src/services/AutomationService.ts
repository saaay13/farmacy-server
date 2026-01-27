import cron from 'node-cron';
import prisma from '../config/prisma';

export class AutomationService {
    /**
     * Inicia todas las tareas programadas del sistema
     */
    public static init() {
        console.log('🚀 Iniciando Servicio de Automatización...');

        // 1. REVISIÓN OBLIGATORIA DE SÁBADOS (Punto 13)
        // Se ejecuta todos los sábados a las 23:59
        cron.schedule('59 23 * * 6', async () => {
            console.log('📅 Ejecutando revisión obligatoria de sábados...');
            await this.performSaturdayInventoryCheck();
        });

        // 2. ESCANEO DIARIO DE VENCIMIENTOS Y STOCK (Punto 12)
        // Se ejecuta todos los días a las 00:01
        cron.schedule('1 0 * * *', async () => {
            console.log('🔍 Escaneando productos próximos a vencer y stock bajo...');
            await this.generateExpiryAndStockAlerts();
        });

        // Ejecución inmediata al iniciar para demostración
        this.generateExpiryAndStockAlerts();
    }

    /**
     * Marca todo el inventario como revisado (Punto 13)
     */
    private static async performSaturdayInventoryCheck() {
        try {
            const result = await prisma.inventario.updateMany({
                data: {
                    fechaRevision: new Date()
                }
            });
            console.log(`✅ Revisión sabatina completada: ${result.count} registros actualizados.`);
        } catch (error) {
            console.error('❌ Error en revisión sabatina:', error);
        }
    }

    /**
     * Genera alertas y promociones automáticas (Punto 12)
     */
    private static async generateExpiryAndStockAlerts() {
        try {
            const sixtyDaysFromNow = new Date();
            sixtyDaysFromNow.setDate(sixtyDaysFromNow.getDate() + 60);

            // A. Buscar lotes próximos a vencer (<= 60 días)
            const expiringLots = await prisma.lote.findMany({
                where: {
                    fechaVencimiento: {
                        lte: sixtyDaysFromNow,
                        gt: new Date() // Que no estén vencidos ya
                    },
                    cantidad: { gt: 0 }
                },
                include: { producto: true }
            });

            for (const lote of expiringLots) {
                // 1. Crear Alerta Visual
                await prisma.alerta.create({
                    data: {
                        tipo: 'expirado', // Valor permitido por el CHECK constraint
                        mensaje: `El producto ${lote.producto.nombre} (Lote: ${lote.numeroLote}) vence el ${lote.fechaVencimiento.toLocaleDateString()}`,
                        fecha: new Date(),
                        idProducto: lote.idProducto,
                        idUsuario: 'u-1' // Asignado por defecto al Admin/Sistema
                    }
                });

                // 2. Crear Promoción Automática (15% descuento)
                // Verificamos si ya existe una promoción activa para este producto
                const existingPromo = await prisma.promocion.findFirst({
                    where: {
                        idProducto: lote.idProducto,
                        fechaFin: { gte: new Date() }
                    }
                });

                if (!existingPromo) {
                    await prisma.promocion.create({
                        data: {
                            idProducto: lote.idProducto,
                            porcentajeDescuento: 15.00,
                            fechaInicio: new Date(),
                            fechaFin: lote.fechaVencimiento, // Hasta que venza el lote
                            aprobada: false // Requiere aprobación admin según requerimiento
                        }
                    });
                    console.log(`🎁 Promoción automática sugerida (15%) para: ${lote.producto.nombre}`);
                }
            }

            console.log(`🔔 Proceso de alertas finalizado. Lotes analizados: ${expiringLots.length}`);
        } catch (error) {
            console.error('❌ Error generando alertas:', error);
        }
    }
}
