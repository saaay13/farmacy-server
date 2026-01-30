import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const nodol = await prisma.producto.findFirst({
        where: { nombre: { contains: 'Nodol', mode: 'insensitive' } },
        include: { promociones: true, lotes: true }
    });

    if (nodol) {
        console.log(`PRODUCT_ID: ${nodol.id}`);
        console.log(`ESTADO: ${nodol.estado}`);
        nodol.promociones.forEach(p => {
            console.log(`PROMO_ID: ${p.id} | ACTIVO: ${p.activo} | APROBADA: ${p.aprobada} | START: ${p.fechaInicio.toISOString()} | END: ${p.fechaFin.toISOString()} | DISC: ${p.porcentajeDescuento}%`);
        });
        nodol.lotes.forEach(l => {
            console.log(`LOTE_ID: ${l.id} | QTY: ${l.cantidad} | EXPIRY: ${l.fechaVencimiento.toISOString()} | ACTIVO: ${l.activo}`);
        });
    } else {
        console.log("Nodol not found");
    }

    console.log(`NOW_DATE: ${new Date().toISOString()}`);
}

main()
    .catch((e) => console.error(e))
    .finally(async () => await prisma.$disconnect());
