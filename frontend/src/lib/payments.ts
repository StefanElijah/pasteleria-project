import api from './axios';

export interface StripeCheckoutSession {
    url: string;
    sessionId: string;
    pedidoId: string;
    numeroPedido: string;
}

export interface StripeSessionOrder {
    pedidoId: string;
    numeroPedido: string;
    total: number;
    estado: string;
    estadoPago: string;
    trackingToken?: string | null;
    emailDestinatario: string;
    envio: {
        metodoEnvio: string;
        fechaEstimadaEntrega: string;
        estadoEnvio: string;
    } | null;
    items: { nombre: string; cantidad: number; total: number }[];
    pago: {
        estado: string;
        proveedor: string;
        monto: number;
        moneda: string;
        metodoDetalle?: string | null;
    } | null;
}

export async function createStripeCheckoutSession(
    pedidoId: string,
    token?: string | null,
): Promise<StripeCheckoutSession> {
    const { data } = await api.post('/payments/stripe/checkout-session', {
        pedidoId,
        token: token || undefined,
    });
    return data;
}

export async function getStripeSession(
    sessionId: string,
    token?: string | null,
): Promise<StripeSessionOrder> {
    const { data } = await api.get(
        `/payments/stripe/session/${encodeURIComponent(sessionId)}`,
        { params: token ? { token } : undefined },
    );
    return data;
}
