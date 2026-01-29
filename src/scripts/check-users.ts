import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const users = await prisma.usuario.findMany();
    console.log('--- USUARIOS EN BASE DE DATOS ---');
    users.forEach(u => {
        console.log(`ID: ${u.id} | Email: ${u.email} | Rol: ${u.rol} | Nombre: ${u.nombre}`);
    });
    console.log('---------------------------------');
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
