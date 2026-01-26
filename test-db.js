const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function main() {
    console.log('🔌 Conectando a la base de datos con Node.js...');
    try {
        // Consulta simple para verificar conexión
        await prisma.$connect();
        console.log('✅ ¡Conexión establecida correctamente!');

        // Intentar leer la hora del servidor
        const result = await prisma.$queryRaw`SELECT NOW() as now`;
        console.log('🕒 Hora de la Base de Datos:', result[0].now);

        // Contar usuarios (si existen)
        const usersCount = await prisma.usuario.count();
        console.log(`👤 Usuarios encontrados: ${usersCount}`);

        // VERIFICACIÓN SOLICITADA: Mostrar Categorías
        console.log('📦 Consultando tabla Categoría...');
        const categorias = await prisma.categoria.findMany();

        if (categorias.length > 0) {
            console.log('✅ Datos encontrados en Categoría:');
            console.table(categorias);
        } else {
            console.log('⚠️ La tabla Categoría está vacía.');
        }

    } catch (error) {
        console.error('❌ Error de conexión:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

main(); 