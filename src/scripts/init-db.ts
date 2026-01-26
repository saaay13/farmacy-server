import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Initializing database schema and sequences...');

    try {
        await prisma.$executeRawUnsafe(`CREATE SCHEMA IF NOT EXISTS "farmacy";`);

        const sequences = [
            'sec_categoria',
            'sec_producto',
            'sec_lote',
            'sec_usuario',
            'sec_venta',
            'sec_detalle_venta',
            'sec_promocion',
            'sec_alerta',
            'sec_sucursal'
        ];

        for (const seq of sequences) {
            await prisma.$executeRawUnsafe(`CREATE SEQUENCE IF NOT EXISTS "farmacy"."${seq}" START 1 INCREMENT 1;`);
        }

        console.log('Sequences created successfully.');
    } catch (e) {
        console.error('Error initializing DB (Make sure .env is correct):', e);
    } finally {
        await prisma.$disconnect();
    }
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
