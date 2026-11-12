export interface CreateCheckoutInput {
  pedidoId: string;
  numeroPedido: string;
  total: number;
  currency: string;
  email: string;
  successUrl: string;
  cancelUrl: string;
  metadata?: Record<string, string>;
}

export interface CheckoutSessionInfo {
  id: string;
  url: string | null;
  status: string | null;
  paymentStatus: string | null;
  amountTotal: number | null;
  currency: string | null;
  paymentIntentId: string | null;
  paymentMethodDetail: string | null;
  metadata: Record<string, string>;
  raw: Record<string, unknown>;
}

export interface WebhookEventInfo {
  id: string;
  type: string;
  data: { object: any };
}

export interface PaymentProvider {
  readonly name: string;
  createCheckoutSession(
    input: CreateCheckoutInput,
  ): Promise<{ url: string; providerRef: string }>;
  retrieveCheckoutSession(sessionId: string): Promise<CheckoutSessionInfo>;
  expireCheckoutSession(sessionId: string): Promise<void>;
  constructWebhookEvent(rawBody: Buffer, signature: string): WebhookEventInfo;
}
