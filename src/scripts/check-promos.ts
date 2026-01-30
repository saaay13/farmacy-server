import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    console.log("--- PRODUCT & PROMO DEBUG ---");
    const products = await prisma.producto.findMany({
        where: {
            nombre: { contains: 'Vitamina C', mode: 'insensitive' }
        },
        include: {
            promociones: true,
            lotes: true,
            inventarios: true
        }
    });

    const products2 = await prisma.producto.findMany({
        where: {
            nombre: { contains: 'Nodol', mode: 'insensitive' }
        },
        include: {
            promociones: true,
            lotes: true,
            inventarios: true
        }
    });

    const all = [...products, ...products2];

    all.forEach(p => {
        console.log(`Product: ${p.nombre}`);
        console.log(`State: ${p.estado}`);
        console.log(`Promotions: ${p.promociones.filter(pr => pr.activo).length} active`);
        p.promociones.forEach(pr => {
            console.log(`  - Promo: ${pr.porcentajeDescuento}%, Active: ${pr.activo}, Approved: ${pr.aprobada}`);
            console.log(`    Dates: ${pr.fechaInicio.toISOString()} to ${pr.fechaFin.toISOString()}`);
        });
        console.log(`Lots:`);
        p.lotes.forEach(l => {
            console.log(`  - Lote: ${l.numeroLote}, Qty: ${l.cantidad}, Expiry: ${l.fechaVencimiento.toISOString()}, Active: ${l.activo}`);
        });
        console.log('---');
    });
}

main()
    .catch((e) => console.error(e))
    .finally(async () => await prisma.$disconnect());
