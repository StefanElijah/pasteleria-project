import { Injectable, Inject, NotFoundException, ConflictException } from '@nestjs/common';
import { CreatePromocionDto } from './dto/create-promocion.dto';
import { UpdatePromocionDto } from './dto/update-promocion.dto';

type Rango = { inicio: Date; fin: Date | null };

@Injectable()
export class PromocionesService {
    constructor(@Inject('PrismaClient') private prisma: any) { }

    private buildData(dto: CreatePromocionDto | UpdatePromocionDto) {
        const { productoIds, categoriaIds, fechaInicio, fechaFin, ...rest } = dto as any;
        const data: any = { ...rest };
        if (fechaInicio !== undefined) data.fechaInicio = new Date(fechaInicio);
        if (fechaFin !== undefined) data.fechaFin = fechaFin ? new Date(fechaFin) : null;
        if (productoIds) data.productos = { set: productoIds.map((id: string) => ({ id })) };
        if (categoriaIds) data.categorias = { set: categoriaIds.map((id: string) => ({ id })) };
        return data;
    }

    private seSolapanFechas(a: Rango, b: Rango) {
        const aFin = a.fin ? a.fin.getTime() : Infinity;
        const bFin = b.fin ? b.fin.getTime() : Infinity;
        return a.inicio.getTime() <= bFin && b.inicio.getTime() <= aFin;
    }

    private mismoAlcance(a: any, b: any) {
        if (a.objetivo !== b.objetivo) return false;
        if (a.objetivo === 'TODO') return true;
        const key = a.objetivo === 'PRODUCTOS' ? 'productos' : 'categorias';
        const aIds = new Set((a[key] || []).map((x: any) => x.id));
        const bIds = new Set((b[key] || []).map((x: any) => x.id));
        if (aIds.size !== bIds.size) return false;
        for (const id of aIds) if (!bIds.has(id)) return false;
        return true;
    }

    private seCruzanAlcance(a: any, b: any) {
        if (a.objetivo === 'TODO' || b.objetivo === 'TODO') return true;
        if (a.objetivo !== b.objetivo) return false;
        const key = a.objetivo === 'PRODUCTOS' ? 'productos' : 'categorias';
        const aIds = new Set((a[key] || []).map((x: any) => x.id));
        return (b[key] || []).some((x: any) => aIds.has(x.id));
    }

    async validarSolapamiento(dto: CreatePromocionDto | UpdatePromocionDto, excludeId?: string) {
        const existentes = await this.prisma.promocionPuntos.findMany({
            where: excludeId ? { id: { not: excludeId } } : {},
            include: { productos: { select: { id: true } }, categorias: { select: { id: true } } },
        });

        const candidata = {
            objetivo: (dto as any).objetivo || 'TODO',
            productos: ((dto as any).productoIds || []).map((id: string) => ({ id })),
            categorias: ((dto as any).categoriaIds || []).map((id: string) => ({ id })),
        };
        const rango: Rango = {
            inicio: (dto as any).fechaInicio ? new Date((dto as any).fechaInicio) : new Date(),
            fin: (dto as any).fechaFin ? new Date((dto as any).fechaFin) : null,
        };

        const exactos: any[] = [];
        const parciales: any[] = [];
        for (const promo of existentes) {
            const promoRango: Rango = { inicio: promo.fechaInicio, fin: promo.fechaFin };
            if (!this.seSolapanFechas(rango, promoRango)) continue;
            if (this.mismoAlcance(candidata, promo)) exactos.push(promo);
            else if (this.seCruzanAlcance(candidata, promo)) parciales.push(promo);
        }
        return { exactos, parciales };
    }

    async create(dto: CreatePromocionDto) {
        const { exactos } = await this.validarSolapamiento(dto);
        if (exactos.length > 0) {
            throw new ConflictException(
                `Ya existe una promoción con el mismo alcance y fechas: "${exactos[0].nombre}". Ajusta el alcance o las fechas.`,
            );
        }
        return this.prisma.promocionPuntos.create({
            data: this.buildData(dto),
            include: { productos: true, categorias: true },
        });
    }

    async findAll() {
        return this.prisma.promocionPuntos.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                productos: { select: { id: true, nombre: true } },
                categorias: { select: { id: true, nombre: true } },
            },
        });
    }

    async findOne(id: string) {
        const found = await this.prisma.promocionPuntos.findUnique({
            where: { id },
            include: { productos: { select: { id: true, nombre: true } }, categorias: { select: { id: true, nombre: true } } },
        });
        if (!found) throw new NotFoundException('Promoción no encontrada');
        return found;
    }

    async update(id: string, dto: UpdatePromocionDto) {
        const actual = await this.findOne(id);
        const { exactos } = await this.validarSolapamiento(
            { ...actual, ...dto },
            id,
        );
        if (exactos.length > 0) {
            throw new ConflictException(
                `Ya existe una promoción con el mismo alcance y fechas: "${exactos[0].nombre}".`,
            );
        }
        return this.prisma.promocionPuntos.update({
            where: { id },
            data: this.buildData(dto),
            include: { productos: true, categorias: true },
        });
    }

    async remove(id: string) {
        await this.findOne(id);
        return this.prisma.promocionPuntos.update({ where: { id }, data: { activo: false } });
    }
}
