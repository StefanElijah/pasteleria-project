import { Injectable, Inject, NotFoundException } from '@nestjs/common';

@Injectable()
export class CiudadesService {
    constructor(@Inject('PrismaClient') private prisma: any) { }

    async findAll(regionId?: string) {
        const where: any = {};
        if (regionId) where.regionId = regionId;
        return this.prisma.ciudad.findMany({
            where,
            include: { region: true },
            orderBy: { nombre: 'asc' },
        });
    }

    async findOne(id: string) {
        const ciudad = await this.prisma.ciudad.findUnique({
            where: { id },
            include: { region: true },
        });
        if (!ciudad) throw new NotFoundException('Ciudad no encontrada');
        return ciudad;
    }

    async findComunasByCiudad(ciudadId: string) {
        return this.prisma.comuna.findMany({
            where: { ciudadId },
            orderBy: { nombre: 'asc' },
        });
    }
}
