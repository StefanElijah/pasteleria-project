import { Injectable, Inject } from '@nestjs/common';

@Injectable()
export class RegionesService {
    constructor(@Inject('PrismaClient') private prisma: any) { }

    async findAll() {
        return this.prisma.region.findMany({
            include: { ciudades: true, comunas: true },
            orderBy: { nombre: 'asc' },
        });
    }

    async findOne(id: string) {
        return this.prisma.region.findUnique({
            where: { id },
            include: { ciudades: true, comunas: true },
        });
    }

    async findComunasByRegion(regionId: string) {
        return this.prisma.comuna.findMany({
            where: { regionId },
            orderBy: { nombre: 'asc' },
        });
    }
}