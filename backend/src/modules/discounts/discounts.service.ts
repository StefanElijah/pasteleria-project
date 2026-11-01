import { Injectable, Inject, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { CreateDiscountDto } from './dto/create-discount.dto';
import { UpdateDiscountDto } from './dto/update-discount.dto';

@Injectable()
export class DiscountsService {
    constructor(@Inject('PrismaClient') private prisma: any) { }

    private buildData(dto: CreateDiscountDto | UpdateDiscountDto) {
        const { productoIds, categoriaIds, fechaInicio, fechaFin, ...rest } = dto as any;
        const data: any = { ...rest };
        if (fechaInicio !== undefined) data.fechaInicio = fechaInicio ? new Date(fechaInicio) : undefined;
        if (fechaFin !== undefined) data.fechaFin = fechaFin ? new Date(fechaFin) : null;
        if (productoIds) data.productos = { set: productoIds.map((id: string) => ({ id })) };
        if (categoriaIds) data.categorias = { set: categoriaIds.map((id: string) => ({ id })) };
        return data;
    }

    async create(dto: CreateDiscountDto) {
        if (dto.codigo) {
            const dup = await this.prisma.descuento.findUnique({ where: { codigo: dto.codigo } });
            if (dup) throw new ConflictException('Ya existe un cupón con ese código');
        }
        const data = this.buildData(dto);
        return this.prisma.descuento.create({
            data,
            include: { productos: true, categorias: true },
        });
    }

    async findAll() {
        return this.prisma.descuento.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                productos: { select: { id: true, nombre: true } },
                categorias: { select: { id: true, nombre: true } },
                usuario: { select: { id: true, email: true } },
            },
        });
    }

    async findOne(id: string) {
        const found = await this.prisma.descuento.findUnique({
            where: { id },
            include: { productos: { select: { id: true, nombre: true } }, categorias: { select: { id: true, nombre: true } } },
        });
        if (!found) throw new NotFoundException('Cupón no encontrado');
        return found;
    }

    async update(id: string, dto: UpdateDiscountDto) {
        await this.findOne(id);
        if (dto.codigo) {
            const dup = await this.prisma.descuento.findFirst({ where: { codigo: dto.codigo, id: { not: id } } });
            if (dup) throw new ConflictException('Ya existe un cupón con ese código');
        }
        const data = this.buildData(dto);
        return this.prisma.descuento.update({
            where: { id },
            data,
            include: { productos: true, categorias: true },
        });
    }

    async remove(id: string) {
        await this.findOne(id);
        // Desactivar (soft) para no romper pedidos/usos históricos
        return this.prisma.descuento.update({ where: { id }, data: { activo: false } });
    }

    // Validación pública de cupón para el cliente (sin aplicar)
    async validar(codigo: string, userId?: string) {
        const descuento = await this.prisma.descuento.findUnique({
            where: { codigo, activo: true },
            include: { productos: true, categorias: true },
        });
        if (!descuento) throw new NotFoundException('Cupón no válido o expirado');
        if (descuento.usuarioId && descuento.usuarioId !== userId) {
            throw new BadRequestException('Este cupón no está disponible para tu cuenta');
        }
        return descuento;
    }
}
