import { Injectable, Inject, NotFoundException } from '@nestjs/common';

@Injectable()
export class ShippingService {
    constructor(@Inject('PrismaClient') private prisma: any) { }

    async calculateShipping(comunaId: string, metodoEnvio: string) {
        const comuna = await this.prisma.comuna.findUnique({
            where: { id: comunaId },
            include: { region: true },
        });
        if (!comuna) throw new NotFoundException('Comuna no encontrada');

        let costo = 0;
        let dias = 3;
        if (comuna.region.id === '13' || comuna.region.nombre.includes('Metropolitana')) {
            if (metodoEnvio === 'Chilexpress') costo = 3000;
            if (metodoEnvio === 'Starken') costo = 2500;
            dias = 1;
        } else {
            if (metodoEnvio === 'Chilexpress') costo = 5000;
            if (metodoEnvio === 'Starken') costo = 4500;
            dias = 3;
        }

        const fechaEstimada = new Date();
        fechaEstimada.setDate(fechaEstimada.getDate() + dias);
        return { costo, fechaEstimada, metodoEnvio, comuna: comuna.nombre, region: comuna.region.nombre };
    }
}