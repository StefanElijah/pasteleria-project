import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';
import { readFileSync } from 'fs';
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
    console.log('🌱 Iniciando seed de base de datos...');

    // 1. Regiones, ciudades y comunas (división político-administrativa de Chile)
    const territorio = JSON.parse(
        readFileSync(join(__dirname, 'data', 'territorio.json'), 'utf-8'),
    ) as {
        regiones: { id: string; nombre: string }[];
        ciudades: { id: string; nombre: string; regionId: string }[];
        comunas: { id: string; nombre: string; ciudadId: string; regionId: string }[];
    };

    for (const region of territorio.regiones) {
        await prisma.region.upsert({
            where: { id: region.id },
            update: { nombre: region.nombre },
            create: { id: region.id, nombre: region.nombre },
        });
    }

    for (const ciudad of territorio.ciudades) {
        await prisma.ciudad.upsert({
            where: { id: ciudad.id },
            update: { nombre: ciudad.nombre, regionId: ciudad.regionId },
            create: { id: ciudad.id, nombre: ciudad.nombre, regionId: ciudad.regionId },
        });
    }

    for (const comuna of territorio.comunas) {
        await prisma.comuna.upsert({
            where: { id: comuna.id },
            update: { nombre: comuna.nombre, ciudadId: comuna.ciudadId, regionId: comuna.regionId },
            create: { id: comuna.id, nombre: comuna.nombre, ciudadId: comuna.ciudadId, regionId: comuna.regionId },
        });
    }

    // 2. Catálogo real (categorías y productos)
    const catalogo = JSON.parse(
        readFileSync(join(__dirname, 'data', 'catalogo.json'), 'utf-8'),
    ) as {
        categorias: { nombre: string; slug: string; descripcion: string | null; activo: boolean; ordenVisual: number }[];
        productos: {
            nombre: string;
            slug: string;
            descripcion: string | null;
            precio: number;
            precioComparacion: number | null;
            imagenPrincipal: string | null;
            imagenes: string[];
            novedad: boolean;
            destacado: boolean;
            activo: boolean;
            categoriaSlug: string;
        }[];
    };

    const categoriaIdBySlug = new Map<string, string>();

    for (const categoria of catalogo.categorias) {
        const saved = await prisma.categoria.upsert({
            where: { slug: categoria.slug },
            // No pisar cambios hechos desde el admin: solo crear si no existe
            update: {},
            create: {
                nombre: categoria.nombre,
                slug: categoria.slug,
                descripcion: categoria.descripcion,
                activo: categoria.activo,
                ordenVisual: categoria.ordenVisual,
            },
        });
        categoriaIdBySlug.set(categoria.slug, saved.id);
    }

    for (const producto of catalogo.productos) {
        const categoriaId = categoriaIdBySlug.get(producto.categoriaSlug);
        if (!categoriaId) continue;

        await prisma.producto.upsert({
            where: { slug: producto.slug },
            // No pisar cambios hechos desde el admin: solo crear si no existe
            update: {},
            create: {
                nombre: producto.nombre,
                slug: producto.slug,
                descripcion: producto.descripcion,
                precio: producto.precio,
                precioComparacion: producto.precioComparacion,
                imagenPrincipal: producto.imagenPrincipal,
                imagenes: producto.imagenes,
                novedad: producto.novedad,
                destacado: producto.destacado,
                activo: producto.activo,
                categoriaId,
            },
        });
    }

    // 3. Usuario administrador
    const adminPassword = await bcrypt.hash('admin123', 10);
    const admin = await prisma.usuario.upsert({
        where: { email: 'admin@pasteleria.com' },
        update: {},
        create: {
            email: 'admin@pasteleria.com',
            password: adminPassword,
            telefono: '+56912345678',
            rol: 'ADMIN',
            estado: 'ACTIVO',
            primerNombre: 'Admin',
            primerApellido: 'Principal',
            perfilStaff: {
                create: {
                    rut: '12345678-9',
                    cargo: 'Gerente',
                },
            },
        },
    });

    // 4. Usuario cliente de ejemplo
    await prisma.usuario.upsert({
        where: { email: 'cliente@test.com' },
        update: {},
        create: {
            email: 'cliente@test.com',
            password: await bcrypt.hash('123456', 10),
            rol: 'CLIENTE',
            estado: 'ACTIVO',
            primerNombre: 'Cliente',
            primerApellido: 'Test',
            perfilCliente: {
                create: {},
            },
        },
    });

    // 5. Cupón de prueba
    await prisma.descuento.upsert({
        where: { codigo: 'CANJE10' },
        update: {},
        create: {
            nombre: '10% de descuento por canje',
            codigo: 'CANJE10',
            tipo: 'PORCENTAJE',
            valor: 10,
            objetivo: 'TODO',
            activo: true,
            limiteUsoPorUsuario: 1,
        },
    });

    console.log('✅ Seed completado exitosamente.');
    console.log(`👤 Usuario admin creado: ${admin.email} / contraseña: admin123`);
}

main()
    .catch((e) => { console.error(e); process.exit(1); })
    .finally(async () => { await prisma.$disconnect(); });