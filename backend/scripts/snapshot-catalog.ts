import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { writeFileSync } from 'fs';
import { join } from 'path';

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
    const categorias = await prisma.categoria.findMany({
        orderBy: { nombre: 'asc' },
    });

    const productos = await prisma.producto.findMany({
        include: { categoria: true },
        orderBy: { nombre: 'asc' },
    });

    const catalogo = {
        categorias: categorias.map((c: any) => ({
            nombre: c.nombre,
            slug: c.slug,
            descripcion: c.descripcion,
            activo: c.activo,
            ordenVisual: c.ordenVisual,
        })),
        productos: productos.map((p: any) => ({
            nombre: p.nombre,
            slug: p.slug,
            descripcion: p.descripcion,
            precio: p.precio,
            precioComparacion: p.precioComparacion,
            imagenPrincipal: p.imagenPrincipal,
            imagenes: p.imagenes,
            novedad: p.novedad,
            destacado: p.destacado,
            activo: p.activo,
            categoriaSlug: p.categoria.slug,
        })),
    };

    const outPath = join(__dirname, '..', 'prisma', 'data', 'catalogo.json');
    writeFileSync(outPath, JSON.stringify(catalogo, null, 4) + '\n', 'utf-8');

    console.log(`\n✅ Snapshot generado: prisma/data/catalogo.json`);
    console.log(`   Categorías: ${catalogo.categorias.length}`);
    console.log(`   Productos:  ${catalogo.productos.length}\n`);

    await prisma.$disconnect();
}

main().catch(async (err) => {
    console.error('Error:', err);
    await prisma.$disconnect();
    process.exit(1);
});
