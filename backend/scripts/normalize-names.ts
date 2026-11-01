import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { splitPersonName, toTitleCase } from '../src/lib/normalize-name';

const pool = new Pool({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    const force = process.argv.includes('--force');
    let totalCambios = 0;

    // Usuarios
    const usuarios: any[] = await prisma.usuario.findMany();
    for (const u of usuarios) {
        const data: any = {};
        const nombre = splitPersonName(u.primerNombre, u.segundoNombre);
        const apellido = splitPersonName(u.primerApellido, u.segundoApellido);

        if (nombre.first !== u.primerNombre) data.primerNombre = nombre.first;
        if (nombre.second !== u.segundoNombre) data.segundoNombre = nombre.second;
        if (apellido.first !== u.primerApellido) data.primerApellido = apellido.first;
        if (apellido.second !== u.segundoApellido) data.segundoApellido = apellido.second;

        if (Object.keys(data).length > 0) {
            totalCambios++;
            console.log(`Usuario ${u.email}:`, data);
            if (force) await prisma.usuario.update({ where: { id: u.id }, data });
        }
    }

    // Pedidos (snapshot del destinatario)
    const pedidos: any[] = await prisma.pedido.findMany();
    for (const p of pedidos) {
        const data: any = {};
        for (const campo of ['primerNombreDestinatario', 'primerApellidoDestinatario']) {
            const actual = p[campo];
            const normalizado = actual ? toTitleCase(actual) : actual;
            if (normalizado !== actual) data[campo] = normalizado;
        }
        if (Object.keys(data).length > 0) {
            totalCambios++;
            console.log(`Pedido ${p.numeroPedido}:`, data);
            if (force) await prisma.pedido.update({ where: { id: p.id }, data });
        }
    }

    // Direcciones (calle)
    const direcciones: any[] = await prisma.direccion.findMany();
    for (const d of direcciones) {
        const normalizado = d.calle ? toTitleCase(d.calle) : d.calle;
        if (normalizado !== d.calle) {
            totalCambios++;
            console.log(`Dirección ${d.id}:`, { calle: normalizado });
            if (force) await prisma.direccion.update({ where: { id: d.id }, data: { calle: normalizado } });
        }
    }

    if (totalCambios === 0) {
        console.log('\n✅ No hay registros por normalizar.');
    } else if (force) {
        console.log(`\n✅ Normalización aplicada: ${totalCambios} registros actualizados.`);
    } else {
        console.log(`\n💡 Modo DRY-RUN: ${totalCambios} registros se normalizarían.`);
        console.log('   Ejecuta: pnpm tsx scripts/normalize-names.ts --force\n');
    }

    await prisma.$disconnect();
}

main().catch(async (err) => {
    console.error('Error:', err);
    await prisma.$disconnect();
    process.exit(1);
});
