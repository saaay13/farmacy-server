import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('⏳ Probando conexión a la base de datos...');
    try {
        // Intentamos una consulta simple
        const databaseTime = await prisma.$queryRaw`SELECT NOW()`;
        console.log('✅ ¡Conexión Exitosa!');
        console.log('🕒 Hora del servidor de BD:', databaseTime);

        // Intentamos contar usuarios (si la tabla existe)
        try {
            const count = await prisma.usuario.count();
            console.log(`✅ Tabla "usuario" accesible. Registros encontrados: ${count}`);
        } catch (err) {
            console.warn('⚠️ Se conectó a la BD pero no se pudo leer la tabla "usuario". Verifica el esquema.', err);
        }

    } catch (error) {
        console.error('❌ Error al conectar a la base de datos:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
