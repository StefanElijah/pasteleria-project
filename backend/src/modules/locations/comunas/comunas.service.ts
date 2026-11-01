import { Injectable, Inject, NotFoundException } from '@nestjs/common';

@Injectable()
export class ComunasService {
    constructor(@Inject('PrismaClient') private prisma: any) { }

    async findAll(regionId?: string, ciudadId?: string) {
        const where: any = {};
        if (regionId) where.regionId = regionId;
        if (ciudadId) where.ciudadId = ciudadId;
        return this.prisma.comuna.findMany({
            where,
            include: { region: true, ciudad: true },
            orderBy: { nombre: 'asc' },
        });
    }

    async findOne(id: string) {
        const comuna = await this.prisma.comuna.findUnique({
            where: { id },
            include: { region: true, ciudad: true },
        });
        if (!comuna) throw new NotFoundException('Comuna no encontrada');
        return comuna;
    }
}