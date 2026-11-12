import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import {
  CheckoutSessionInfo,
  CreateCheckoutInput,
  PaymentProvider,
  WebhookEventInfo,
} from './payment-provider.interface';

@Injectable()
export class StripeProvider implements PaymentProvider {
  readonly name = 'STRIPE';

  private readonly logger = new Logger(StripeProvider.name);
  private readonly stripe: Stripe;
  private readonly webhookSecret: string;

  constructor(private readonly config: ConfigService) {
    const secretKey = this.config.get<string>('STRIPE_SECRET_KEY');
    if (!secretKey) {
      throw new Error('STRIPE_SECRET_KEY no está configurada');
    }

    this.stripe = new Stripe(secretKey);
    this.webhookSecret = this.config.get<string>('STRIPE_WEBHOOK_SECRET') || '';
  }

  async createCheckoutSession(
    input: CreateCheckoutInput,
  ): Promise<{ url: string; providerRef: string }> {
    const currency = (input.currency || 'clp').toLowerCase();

    const session = await this.stripe.checkout.sessions.create({
      mode: 'payment',
      currency,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency,
            unit_amount: input.total,
            product_data: {
              name: `Pedido ${input.numeroPedido}`,
              description: 'Pastelería Mil Sabores',
            },
          },
        },
      ],
      customer_email: input.email,
      client_reference_id: input.pedidoId,
      metadata: {
        pedidoId: input.pedidoId,
        numeroPedido: input.numeroPedido,
        ...input.metadata,
      },
      payment_intent_data: {
        metadata: {
          pedidoId: input.pedidoId,
          numeroPedido: input.numeroPedido,
        },
      },
      success_url: input.successUrl,
      cancel_url: input.cancelUrl,
      locale: 'es',
      expires_at: Math.floor(Date.now() / 1000) + 60 * 60,
      allowed_payment_method_types: ['card'],
      allow_promotion_codes: false,
    });

    if (!session.url) {
      throw new Error('Stripe no devolvió una URL de checkout');
    }

    return { url: session.url, providerRef: session.id };
  }

  async retrieveCheckoutSession(
    sessionId: string,
  ): Promise<CheckoutSessionInfo> {
    const session = await this.stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['payment_intent', 'payment_intent.payment_method'],
    });

    let paymentIntent: Stripe.PaymentIntent | null = null;
    if (session.payment_intent && typeof session.payment_intent !== 'string') {
      paymentIntent = session.payment_intent;
    } else if (typeof session.payment_intent === 'string') {
      paymentIntent = await this.stripe.paymentIntents.retrieve(
        session.payment_intent,
        {
          expand: ['payment_method'],
        },
      );
    }

    let paymentMethodDetail: string | null = null;
    const paymentMethod = paymentIntent?.payment_method;
    if (
      paymentMethod &&
      typeof paymentMethod !== 'string' &&
      paymentMethod.card
    ) {
      const brand = paymentMethod.card.brand;
      const last4 = paymentMethod.card.last4;
      paymentMethodDetail = `${brand} •••• ${last4}`;
    }

    return {
      id: session.id,
      url: session.url,
      status: session.status,
      paymentStatus: session.payment_status,
      amountTotal: session.amount_total,
      currency: session.currency,
      paymentIntentId: paymentIntent?.id || null,
      paymentMethodDetail,
      metadata: session.metadata || {},
      raw: {
        id: session.id,
        status: session.status,
        payment_status: session.payment_status,
        amount_total: session.amount_total,
        currency: session.currency,
        customer_email: session.customer_email,
        client_reference_id: session.client_reference_id,
        metadata: session.metadata,
        payment_intent: paymentIntent?.id || null,
      },
    };
  }

  async expireCheckoutSession(sessionId: string): Promise<void> {
    try {
      const session = await this.stripe.checkout.sessions.retrieve(sessionId);
      if (session.status === 'open') {
        await this.stripe.checkout.sessions.expire(sessionId);
      }
    } catch (error) {
      this.logger.warn(`No se pudo expirar la sesión ${sessionId}: ${error}`);
    }
  }

  constructWebhookEvent(rawBody: Buffer, signature: string): WebhookEventInfo {
    if (!this.webhookSecret) {
      throw new Error('STRIPE_WEBHOOK_SECRET no está configurada');
    }

    const event = this.stripe.webhooks.constructEvent(
      rawBody,
      signature,
      this.webhookSecret,
    );
    return {
      id: event.id,
      type: event.type,
      data: event.data,
    };
  }
}
