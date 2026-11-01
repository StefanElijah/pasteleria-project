import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { LoyaltyService } from '@modules/loyalty/loyalty.service';
import { splitPersonName, toTitleCase } from '@/lib/normalize-name';

@Injectable()
export class UsersService {
    constructor(
        @Inject('PrismaClient') private prisma: any,
        private loyalty: LoyaltyService,
    ) { }

    async updateProfile(userId: string, dto: UpdateProfileDto) {
        const user = await this.prisma.usuario.findUnique({ where: { id: userId } });
        if (!user) throw new NotFoundException('Usuario no encontrado');

        const data: any = {};

        const aplicarNombre = (
            campoPrimero: string,
            campoSegundo: string,
            valorPrimero?: string,
            valorSegundo?: string,
        ) => {
            if (valorPrimero !== undefined) {
                // Si el segundo viene vacío, se intenta dividir el primero
                const { first, second } = splitPersonName(valorPrimero, valorSegundo);
                data[campoPrimero] = first;
                data[campoSegundo] = second;
            } else if (valorSegundo !== undefined) {
                const limpio = valorSegundo.trim();
                data[campoSegundo] = limpio === '' ? null : toTitleCase(limpio);
            }
        };

        aplicarNombre('primerNombre', 'segundoNombre', dto.primerNombre, dto.segundoNombre);
        aplicarNombre('primerApellido', 'segundoApellido', dto.primerApellido, dto.segundoApellido);

        if (dto.telefono !== undefined) {
            const limpio = dto.telefono.trim();
            data.telefono = limpio === '' ? null : limpio;
        }

        const updated = await this.prisma.usuario.update({ where: { id: userId }, data });
        const { password: _, ...result } = updated;
        return result;
    }

    async getCupones(userId: string) {
        const ahora = new Date();
        return this.prisma.descuento.findMany({
            where: {
                activo: true,
                OR: [{ usuarioId: userId }, { usuarioId: null }],
                AND: [
                    { OR: [{ fechaFin: null }, { fechaFin: { gte: ahora } }] },
                ],
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    async getPuntos(userId: string) {
        const [saldo, nivel, movimientos, promosActivas] = await Promise.all([
            this.loyalty.getSaldo(userId),
            this.loyalty.getNivel(userId),
            this.loyalty.getMovimientos(userId),
            this.loyalty.getPromosVigentes(),
        ]);
        return { ...saldo, nivel, movimientos, promosActivas };
    }

    // Vinculación de pedidos de invitado por email (registro/login)
    async vincularPedidosPorEmail(userId: string, email: string) {
        const result = await this.prisma.pedido.updateMany({
            where: {
                emailDestinatario: { equals: email, mode: 'insensitive' },
                usuarioId: null,
            },
            data: { usuarioId: userId },
        });
        return result.count;
    }
}
