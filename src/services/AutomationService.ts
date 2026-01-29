import cron from 'node-cron';
import prisma from '../config/prisma';

export class AutomationService {
    // Iniciar tareas programadas
    public static init() {
        console.log('🚀 Iniciando Servicio de Automatización...');

        // Revisión de sábados
        // Se ejecuta todos los sábados a las 23:59
        cron.schedule('59 23 * * 6', async () => {
            console.log('📅 Ejecutando revisión obligatoria de sábados...');
            await this.performSaturdayInventoryCheck();
        });

        // Escaneo de vencimientos y stock
        // Se ejecuta todos los días a las 00:01
        cron.schedule('1 0 * * *', async () => {
            console.log('🔍 Escaneando productos próximos a vencer y stock bajo...');
            await this.generateExpiryAndStockAlerts();
        });

        // Ejecución inmediata al iniciar para demostración
        this.generateExpiryAndStockAlerts();
    }

    // Marcar inventario como revisado
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

    // Generar alertas y promociones
    private static async generateExpiryAndStockAlerts() {
        try {
            const sixtyDaysFromNow = new Date();
            sixtyDaysFromNow.setDate(sixtyDaysFromNow.getDate() + 60);

            // Lotes próximos a vencer
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
                // Verificar duplicados
                const existingAlert = await prisma.alerta.findFirst({
                    where: {
                        idProducto: lote.idProducto,
                        tipo: 'expirado',
                        mensaje: { contains: lote.numeroLote } // Evitar duplicar por mismo lote
                    }
                });

                if (!existingAlert) {
                    await prisma.alerta.create({
                        data: {
                            tipo: 'expirado',
                            mensaje: `El producto ${lote.producto.nombre} (Lote: ${lote.numeroLote}) vence el ${lote.fechaVencimiento.toLocaleDateString()}`,
                            fecha: new Date(),
                            idProducto: lote.idProducto,
                            idUsuario: 'u-1'
                        }
                    });
                }

                // Crear promoción automática
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
