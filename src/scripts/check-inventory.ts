import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log("--- REPORTE DE INVENTARIO ACTUAL ---");
    const inventory = await prisma.inventario.findMany({
        include: {
            // Producto: true // No podemos hacer include directo si no está definido en el schema.prisma como relación
        }
    });

    const products = await prisma.producto.findMany();

    inventory.forEach(inv => {
        const prod = products.find(p => p.id === inv.idProducto);
        const name = prod?.nombre || inv.idProducto;
        console.log(`[STK] ID: ${inv.idProducto} | Name: ${name} | Quantity: ${inv.stockTotal}`);
    });
    console.log("------------------------------------");
}

main()
    .catch((e) => console.error(e))
    .finally(async () => await prisma.$disconnect());
