import cron from 'node-cron';
import prisma from '../config/prisma';

export class AutomationService {
    // Iniciar tareas programadas
    public static init() {
        console.log('🚀 Iniciando Servicio de Automatización...');

        // Revisión de jueves
        // Se ejecuta todos los jueves a las 23:59
        cron.schedule('59 23 * * 4', async () => {
            console.log('📅 Ejecutando revisión obligatoria de jueves...');
            await this.performThursdayInventoryCheck();
        });

        // Escaneo de vencimientos y stock
        // Se ejecuta todos los días a las 00:01
        cron.schedule('1 0 * * *', async () => {
            console.log('🔍 Escaneando productos próximos a vencer y stock bajo...');
            await this.generateExpiryAndStockAlerts();
        });

        // Ejecución inmediata al iniciar
        this.performThursdayInventoryCheck();
        this.generateExpiryAndStockAlerts();
    }

    // Marcar inventario como revisado
    private static async performThursdayInventoryCheck() {
        try {
            const result = await prisma.inventario.updateMany({
                data: {
                    fechaRevision: new Date()
                }
            });
            console.log(`✅ Revisión de jueves completada: ${result.count} registros actualizados.`);
        } catch (error) {
            console.error('❌ Error en revisión de jueves:', error);
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
                include: {
                    producto: true,
                    sucursal: true
                }
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
                    const sucursalNombre = lote.sucursal?.nombre || 'Sucursal desconocida';
                    await prisma.alerta.create({
                        data: {
                            tipo: 'expirado',
                            mensaje: `VENCIMIENTO PRÓXIMO: ${lote.producto.nombre} en ${sucursalNombre} (Lote: ${lote.numeroLote}) vence el ${lote.fechaVencimiento.toLocaleDateString()}`,
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

            // --- NUEVO: Stock Bajo por sucursal ---
            const lowStockInventories = await prisma.inventario.findMany({
                where: {
                    stockTotal: { lte: 10 } // Umbral de stock bajo
                },
                include: {
                    producto: true,
                    sucursal: true
                }
            });

            for (const inv of lowStockInventories) {
                // Verificar si ya existe una alerta de stock bajo reciente para este producto en esta sucursal
                const existingAlert = await prisma.alerta.findFirst({
                    where: {
                        idProducto: inv.idProducto,
                        tipo: 'stock_bajo',
                        mensaje: { contains: inv.sucursal.nombre }
                    }
                });

                if (!existingAlert) {
                    await prisma.alerta.create({
                        data: {
                            tipo: 'stock_bajo',
                            mensaje: `STOCK BAJO: ${inv.producto.nombre} en ${inv.sucursal.nombre} (Solo quedan ${inv.stockTotal} unidades)`,
                            fecha: new Date(),
                            idProducto: inv.idProducto,
                            idUsuario: 'u-1' // Se asigna al admin por defecto
                        }
                    });
                    console.log(`⚠️ Alerta de stock bajo generada para: ${inv.producto.nombre} en ${inv.sucursal.nombre}`);
                }
            }

            console.log(`🔔 Proceso de alertas finalizado. Lotes analizados: ${expiringLots.length}`);
        } catch (error) {
            console.error('❌ Error generando alertas:', error);
        }
    }
}
