import { Injectable, Inject, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { SolicitarDevolucionDto } from './dto/solicitar-devolucion.dto';
import { LoyaltyService } from '@modules/loyalty/loyalty.service';

@Injectable()
export class DevolucionesService {
    constructor(
        @Inject('PrismaClient') private prisma: any,
        private loyalty: LoyaltyService,
    ) { }

    async solicitar(userId: string, dto: SolicitarDevolucionDto) {
        const pedido = await this.prisma.pedido.findUnique({
            where: { id: dto.pedidoId },
            include: { items: true },
        });
        if (!pedido) throw new NotFoundException('Pedido no encontrado');
        if (pedido.usuarioId !== userId) throw new ForbiddenException('El pedido no te pertenece');
        if (['CANCELADO'].includes(pedido.estado)) {
            throw new BadRequestException('No se puede devolver un pedido cancelado');
        }

        const devolucion = await this.prisma.devolucion.create({
            data: {
                pedidoId: pedido.id,
                motivo: dto.motivo || null,
                estado: 'SOLICITADA',
                items: {
                    create: dto.items.map((it) => {
                        const item = pedido.items.find((p: any) => p.id === it.itemPedidoId);
                        if (!item) throw new BadRequestException('Ítem no pertenece al pedido');
                        if (it.cantidad > item.cantidad) {
                            throw new BadRequestException(`Cantidad inválida para ${item.nombre}`);
                        }
                        return {
                            itemPedidoId: item.id,
                            cantidad: it.cantidad,
                            subtotal: item.precio * it.cantidad,
                        };
                    }),
                },
            },
            include: { items: true, pedido: { select: { numeroPedido: true } } },
        });

        return devolucion;
    }

    async getMias(userId: string) {
        return this.prisma.devolucion.findMany({
            where: { pedido: { usuarioId: userId } },
            include: { items: { include: { itemPedido: true } }, pedido: { select: { numeroPedido: true, total: true } } },
            orderBy: { createdAt: 'desc' },
        });
    }

    async getByPedido(pedidoId: string, userId: string, rol?: string) {
        const pedido = await this.prisma.pedido.findUnique({ where: { id: pedidoId } });
        if (!pedido) throw new NotFoundException('Pedido no encontrado');
        if (rol !== 'ADMIN' && rol !== 'MODERADOR' && pedido.usuarioId !== userId) {
            throw new ForbiddenException('No tienes permiso');
        }
        return this.prisma.devolucion.findMany({
            where: { pedidoId },
            include: { items: { include: { itemPedido: true } } },
            orderBy: { createdAt: 'desc' },
        });
    }

    async findAll() {
        return this.prisma.devolucion.findMany({
            include: {
                items: { include: { itemPedido: true } },
                pedido: { select: { numeroPedido: true, total: true, emailDestinatario: true, estado: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    async findOne(id: string) {
        const dev = await this.prisma.devolucion.findUnique({
            where: { id },
            include: {
                items: { include: { itemPedido: true } },
                pedido: { include: { items: true } },
            },
        });
        if (!dev) throw new NotFoundException('Devolución no encontrada');
        return dev;
    }

    async updateEstado(id: string, estado: 'APROBADA' | 'RECHAZADA') {
        const dev = await this.findOne(id);
        if (dev.estado !== 'SOLICITADA') {
            throw new BadRequestException('Solo se pueden aprobar/rechazar devoluciones solicitadas');
        }
        return this.prisma.devolucion.update({ where: { id }, data: { estado } });
    }

    async procesar(id: string) {
        const dev = await this.prisma.devolucion.findUnique({
            where: { id },
            include: { items: true, pedido: true },
        });
        if (!dev) throw new NotFoundException('Devolución no encontrada');
        if (dev.estado === 'PROCESADA') throw new BadRequestException('La devolución ya fue procesada');

        const monto = dev.items.reduce((s: number, i: any) => s + i.subtotal, 0);
        const pedido = dev.pedido;

        let puntosRevertidos = 0;
        let puntosReintegrados = 0;

        // Revertir puntos ganados (proporcional) si el pedido fue entregado
        if (pedido.usuarioId && pedido.puntosOtorgados > 0 && pedido.subtotal > 0) {
            puntosRevertidos = await this.loyalty.revertirPuntos(pedido.id, monto, pedido.subtotal);
        }

        // Reintegrar puntos usados en la compra (proporcional)
        if (pedido.usuarioId && pedido.puntosUsados > 0 && pedido.subtotal > 0) {
            puntosReintegrados = Math.floor(pedido.puntosUsados * (monto / pedido.subtotal));
            await this.loyalty.reintegrarPuntos(
                pedido.usuarioId,
                puntosReintegrados,
                `Reintegro de puntos usados por devolución del pedido ${pedido.numeroPedido}`,
                pedido.id,
            );
        }

        // Reintegrar cupón (borrar uso y decrementar contador)
        if (pedido.descuentoId && pedido.usuarioId) {
            const uso = await this.prisma.descuentoUso.findFirst({
                where: { descuentoId: pedido.descuentoId, usuarioId: pedido.usuarioId, pedidoId: pedido.id },
            });
            if (uso) {
                await this.prisma.descuentoUso.delete({ where: { id: uso.id } });
                await this.prisma.descuento.update({
                    where: { id: pedido.descuentoId },
                    data: { contadorUso: { decrement: 1 } },
                });
            }
        }

        await this.prisma.devolucion.update({
            where: { id },
            data: { estado: 'PROCESADA', montoReembolsado: monto, puntosRevertidos, puntosReintegrados },
        });

        return {
            message: 'Devolución procesada',
            montoReembolsado: monto,
            puntosRevertidos,
            puntosReintegrados,
        };
    }

    async reponerStock(id: string) {
        const dev = await this.prisma.devolucion.findUnique({
            where: { id },
            include: { items: { include: { itemPedido: true } } },
        });
        if (!dev) throw new NotFoundException('Devolución no encontrada');

        for (const item of dev.items) {
            await this.prisma.producto.update({
                where: { id: item.itemPedido.productoId },
                data: { stock: { increment: item.cantidad } },
            });
        }
        return { message: 'Stock repuesto', items: dev.items.length };
    }
}
