import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CartService } from '@modules/sales/cart/cart.service';
import { StripeProvider } from './providers/stripe.provider';
import { CheckoutSessionInfo } from './providers/payment-provider.interface';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    @Inject('PrismaClient') private readonly prisma: any,
    private readonly config: ConfigService,
    private readonly stripe: StripeProvider,
    private readonly cartService: CartService,
  ) {}

  async createStripeCheckout(
    userId: string | null,
    pedidoId: string,
    token?: string,
  ) {
    const pedido = await this.prisma.pedido.findUnique({
      where: { id: pedidoId },
      include: { pagos: true },
    });

    if (!pedido) throw new NotFoundException('Pedido no encontrado');

    if (pedido.usuarioId) {
      if (!userId || pedido.usuarioId !== userId) {
        throw new ForbiddenException('No tienes permiso sobre este pedido');
      }
    } else if (!token || token !== pedido.trackingToken) {
      throw new ForbiddenException('Enlace de pedido inválido');
    }

    if (pedido.metodoPago !== 'TARJETA') {
      throw new BadRequestException(
        'Este pedido no fue creado para pago con tarjeta',
      );
    }
    if (pedido.estado === 'CANCELADO') {
      throw new BadRequestException('El pedido está cancelado');
    }
    if (pedido.estadoPago === 'PAGADO' || pedido.estadoPago === 'REEMBOLSADO') {
      throw new BadRequestException('Este pedido ya no admite un nuevo pago');
    }
    if (pedido.total <= 0) {
      throw new BadRequestException('El pedido no tiene monto a pagar');
    }

    // Invalidar sesiones anteriores para evitar doble cobro
    const sesionesPendientes = (pedido.pagos || []).filter(
      (pago: any) => pago.proveedor === 'STRIPE' && pago.estado === 'PENDIENTE',
    );
    for (const pago of sesionesPendientes) {
      await this.stripe.expireCheckoutSession(pago.proveedorRef);
      await this.prisma.pago.update({
        where: { id: pago.id },
        data: { estado: 'CANCELADO' },
      });
    }

    if (pedido.estadoPago !== 'PENDIENTE') {
      await this.prisma.pedido.update({
        where: { id: pedido.id },
        data: { estadoPago: 'PENDIENTE', pagadoEn: null },
      });
    }

    const baseUrl = this.getFrontendUrl();
    const tokenQuery = pedido.trackingToken
      ? `&token=${encodeURIComponent(pedido.trackingToken)}`
      : '';

    const successUrl = `${baseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}${tokenQuery}`;
    const cancelUrl = `${baseUrl}/checkout/cancel?pedido=${pedido.id}&numero=${encodeURIComponent(pedido.numeroPedido)}&total=${pedido.total}${tokenQuery}`;

    const session = await this.stripe.createCheckoutSession({
      pedidoId: pedido.id,
      numeroPedido: pedido.numeroPedido,
      total: pedido.total,
      currency: this.currency,
      email: pedido.emailDestinatario,
      successUrl,
      cancelUrl,
    });

    await this.prisma.pago.create({
      data: {
        pedidoId: pedido.id,
        proveedor: 'STRIPE',
        proveedorRef: session.providerRef,
        monto: pedido.total,
        moneda: this.currency.toUpperCase(),
        estado: 'PENDIENTE',
      },
    });

    return {
      url: session.url,
      sessionId: session.providerRef,
      pedidoId: pedido.id,
      numeroPedido: pedido.numeroPedido,
    };
  }

  async getStripeSession(sessionId: string, token?: string) {
    const info = await this.stripe.retrieveCheckoutSession(sessionId);

    const pago = await this.prisma.pago.findFirst({
      where: { proveedor: 'STRIPE', proveedorRef: sessionId },
    });
    if (!pago) throw new NotFoundException('Pago no encontrado');

    const pedido = await this.prisma.pedido.findUnique({
      where: { id: pago.pedidoId },
      include: { envio: true, items: true },
    });
    if (!pedido) throw new NotFoundException('Pedido no encontrado');

    if (!pedido.usuarioId && (!token || token !== pedido.trackingToken)) {
      throw new ForbiddenException('Enlace de pago inválido');
    }

    if (info.paymentStatus === 'paid') {
      await this.markPaid(pago, info);
    } else if (info.status === 'expired') {
      await this.markFailed(pago, 'CANCELADO');
    }

    const pedidoActualizado = await this.prisma.pedido.findUnique({
      where: { id: pedido.id },
      include: { envio: true, items: true, pagos: true },
    });
    const pagoActualizado = await this.prisma.pago.findUnique({
      where: { id: pago.id },
    });

    return {
      pedidoId: pedidoActualizado.id,
      numeroPedido: pedidoActualizado.numeroPedido,
      total: pedidoActualizado.total,
      estado: pedidoActualizado.estado,
      estadoPago: pedidoActualizado.estadoPago,
      trackingToken: pedidoActualizado.trackingToken,
      emailDestinatario: pedidoActualizado.emailDestinatario,
      envio: pedidoActualizado.envio
        ? {
            metodoEnvio: pedidoActualizado.envio.metodoEnvio,
            fechaEstimadaEntrega: pedidoActualizado.envio.fechaEstimadaEntrega,
            estadoEnvio: pedidoActualizado.envio.estadoEnvio,
          }
        : null,
      items: (pedidoActualizado.items || []).map((item: any) => ({
        nombre: item.nombre,
        cantidad: item.cantidad,
        total: item.total,
      })),
      pago: pagoActualizado
        ? {
            estado: pagoActualizado.estado,
            proveedor: pagoActualizado.proveedor,
            monto: pagoActualizado.monto,
            moneda: pagoActualizado.moneda,
            metodoDetalle: pagoActualizado.metodoDetalle,
          }
        : null,
    };
  }

    async handleStripeWebhook(rawBody: Buffer, signature: string) {
        if (!signature) throw new BadRequestException('Falta la firma de Stripe');

        let event;
        try {
            event = this.stripe.constructWebhookEvent(rawBody, signature);
        } catch {
            throw new BadRequestException('Firma de webhook inválida');
        }

        await this.recordWebhookEvent(event.id, event.type, event);

    switch (event.type) {
      case 'checkout.session.completed':
      case 'checkout.session.async_payment_succeeded': {
        const sessionId = event.data.object?.id;
        if (!sessionId) break;
        const info = await this.stripe.retrieveCheckoutSession(sessionId);
        if (info.paymentStatus === 'paid') {
          const pago = await this.findPagoBySession(sessionId);
          if (pago) await this.markPaid(pago, info);
        }
        break;
      }
      case 'checkout.session.async_payment_failed': {
        const sessionId = event.data.object?.id;
        if (!sessionId) break;
        const pago = await this.findPagoBySession(sessionId);
        if (pago) await this.markFailed(pago, 'FALLIDO');
        break;
      }
      case 'checkout.session.expired': {
        const sessionId = event.data.object?.id;
        if (!sessionId) break;
        const pago = await this.findPagoBySession(sessionId);
        if (pago) await this.markFailed(pago, 'CANCELADO');
        break;
      }
      case 'charge.refunded': {
        await this.handleChargeRefunded(event.data.object);
        break;
      }
      default:
        this.logger.log(`Evento de Stripe no manejado: ${event.type}`);
    }

    return { received: true };
  }

  private async findPagoBySession(sessionId: string) {
    return this.prisma.pago.findFirst({
      where: { proveedor: 'STRIPE', proveedorRef: sessionId },
      include: { pedido: true },
    });
  }

  private async markPaid(pago: any, info: CheckoutSessionInfo) {
    if (pago.estado === 'PAGADO') return;

    if (info.amountTotal !== null && info.amountTotal !== pago.monto) {
      this.logger.error(
        `Monto no coincide para el pago ${pago.id}: Stripe=${info.amountTotal}, pedido=${pago.monto}`,
      );
      return;
    }
    if (
      info.currency &&
      info.currency.toUpperCase() !== pago.moneda.toUpperCase()
    ) {
      this.logger.error(
        `Moneda no coincide para el pago ${pago.id}: Stripe=${info.currency}, pedido=${pago.moneda}`,
      );
      return;
    }

    const ahora = new Date();
    const actualizado = await this.prisma.$transaction(async (tx: any) => {
      const pagoActualizado = await tx.pago.update({
        where: { id: pago.id },
        data: {
          estado: 'PAGADO',
          proveedorPagoId: info.paymentIntentId,
          metodoDetalle: info.paymentMethodDetail,
          pagadoEn: ahora,
          payload: info.raw,
        },
      });

      const pedidoActualizado = await tx.pedido.update({
        where: { id: pago.pedidoId },
        data: {
          estadoPago: 'PAGADO',
          pagadoEn: ahora,
          transaccionId: info.paymentIntentId,
        },
      });

      return { pagoActualizado, pedidoActualizado };
    });

    this.logger.log(
      `Pago confirmado: ${actualizado.pedidoActualizado.numeroPedido} (${info.paymentIntentId})`,
    );

    if (actualizado.pedidoActualizado.cartId) {
      try {
        await this.cartService.clearCart(actualizado.pedidoActualizado.cartId);
      } catch (error) {
        this.logger.warn(`No se pudo vaciar el carrito: ${error}`);
      }
    }
  }

  private async markFailed(pago: any, estado: 'FALLIDO' | 'CANCELADO') {
    if (pago.estado === 'PAGADO') return;
    if (pago.estado === estado) return;

    await this.prisma.$transaction(async (tx: any) => {
      await tx.pago.update({ where: { id: pago.id }, data: { estado } });
      const pedido = await tx.pedido.findUnique({
        where: { id: pago.pedidoId },
      });
      if (pedido && pedido.estadoPago !== 'PAGADO') {
        await tx.pedido.update({
          where: { id: pago.pedidoId },
          data: { estadoPago: estado },
        });
      }
    });
  }

  private async handleChargeRefunded(charge: any) {
    if (!charge?.payment_intent) return;

    const pago = await this.prisma.pago.findFirst({
      where: { proveedor: 'STRIPE', proveedorPagoId: charge.payment_intent },
    });
    if (!pago) return;

    const reembolsoTotal =
      typeof charge.amount_refunded === 'number' &&
      typeof charge.amount === 'number' &&
      charge.amount_refunded >= charge.amount;

    if (!reembolsoTotal) {
      this.logger.log(`Reembolso parcial detectado para el pago ${pago.id}`);
      return;
    }

    await this.prisma.$transaction(async (tx: any) => {
      await tx.pago.update({
        where: { id: pago.id },
        data: { estado: 'REEMBOLSADO' },
      });
      await tx.pedido.update({
        where: { id: pago.pedidoId },
        data: { estadoPago: 'REEMBOLSADO' },
      });
    });
  }

  private async recordWebhookEvent(
    eventoId: string,
    tipo: string,
    payload: any,
  ) {
    try {
      await this.prisma.webhookEvento.create({
        data: {
          proveedor: 'STRIPE',
          eventoId,
          tipo,
          payload: this.toJsonSafe(payload),
        },
      });
    } catch (error: any) {
      // P2002 = evento ya registrado; el procesamiento sigue siendo idempotente
      if (error?.code !== 'P2002') throw error;
    }
  }

  private toJsonSafe(value: any): any {
    try {
      return JSON.parse(JSON.stringify(value));
    } catch {
      return null;
    }
  }

  private getFrontendUrl(): string {
    const raw =
      this.config.get<string>('FRONTEND_URL') || 'http://localhost:3000';
    return raw.split(',')[0].trim().replace(/\/$/, '');
  }

  private get currency(): string {
    return (this.config.get<string>('STRIPE_CURRENCY') || 'clp').toLowerCase();
  }
}
