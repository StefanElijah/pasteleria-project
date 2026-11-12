'use client';
import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { AlertCircle, Check, CheckCircle, Copy, Loader2, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getStripeSession, StripeSessionOrder } from '@/lib/payments';
import { useCartStore } from '@/store/cartStore';
import { useCheckoutStore } from '@/store/checkoutStore';
import { useCheckoutFlowStore } from '@/store/checkoutFlowStore';
import { useAuthStore } from '@/store/authStore';
import { deleteDraft } from '@/lib/checkout';

function getErrorMessage(err: unknown): string {
    if (typeof err === 'object' && err !== null && 'response' in err) {
        const response = (err as { response?: { data?: { message?: string } } }).response;
        if (response?.data?.message) return response.data.message;
    }
    return '';
}

export default function CheckoutSuccessPage() {
    return (
        <Suspense
            fallback={
                <div className="py-12 text-center flex items-center justify-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" /> Cargando...
                </div>
            }
        >
            <CheckoutSuccessContent />
        </Suspense>
    );
}

function CheckoutSuccessContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const sessionId = searchParams.get('session_id');
    const token = searchParams.get('token');

    const setOrderCompleted = useCheckoutFlowStore((s) => s.setOrderCompleted);
    const clearPendingOrder = useCheckoutStore((s) => s.clearPendingOrder);
    const clearLocal = useCartStore((s) => s.clearLocal);
    const clearCart = useCartStore((s) => s.clearCart);
    const user = useAuthStore((s) => s.user);

    const [order, setOrder] = useState<StripeSessionOrder | null>(null);
    const [loading, setLoading] = useState(!!sessionId);
    const [error, setError] = useState('');
    const [copied, setCopied] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);

    useEffect(() => {
        if (!sessionId) return;
        const sid = sessionId;

        let cancelled = false;
        let attempts = 0;
        let timer: ReturnType<typeof setTimeout> | undefined;

        async function run() {
            try {
                const data = await getStripeSession(sid, token);
                if (cancelled) return;

                setOrder(data);

                if (data.estadoPago === 'PAGADO') {
                    setOrderCompleted(true);
                    clearPendingOrder();
                    clearLocal();
                    clearCart().catch(() => { });
                    if (useAuthStore.getState().user) {
                        deleteDraft().catch(() => { });
                    }
                    setLoading(false);
                    return;
                }

                attempts++;
                if (attempts < 5) {
                    timer = setTimeout(run, 1500);
                    return;
                }

                setLoading(false);
            } catch (err: unknown) {
                if (cancelled) return;

                attempts++;
                if (attempts < 4) {
                    timer = setTimeout(run, 1500);
                    return;
                }

                setError(
                    getErrorMessage(err) ||
                    'No pudimos verificar el pago. Si el cobro se realizó, revisa tus pedidos.',
                );
                setLoading(false);
            }
        }

        run();

        return () => {
            cancelled = true;
            if (timer) clearTimeout(timer);
        };
    }, [
        sessionId,
        token,
        refreshKey,
        setOrderCompleted,
        clearPendingOrder,
        clearLocal,
        clearCart,
    ]);

    const trackingUrl =
        order?.trackingToken && typeof window !== 'undefined'
            ? `${window.location.origin}/orders/track/${order.trackingToken}`
            : null;

    const handleCopyLink = () => {
        if (!trackingUrl) return;
        navigator.clipboard.writeText(trackingUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleRefresh = () => {
        setLoading(true);
        setError('');
        setRefreshKey((value) => value + 1);
    };

    if (!sessionId) {
        return (
            <div className="text-center py-12">
                <AlertCircle className="w-16 h-16 mx-auto text-amber-500 mb-4" />
                <h1 className="text-2xl font-bold mb-2">No pudimos confirmar el pago</h1>
                <p className="text-gray-500 mb-6">No se recibió el identificador del pago.</p>
                <Button variant="outline" onClick={() => router.push('/')}>
                    Seguir comprando
                </Button>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="text-center py-16">
                <Loader2 className="w-10 h-10 mx-auto mb-4 animate-spin text-rose-600" />
                <h1 className="text-xl font-bold mb-2">Verificando tu pago</h1>
                <p className="text-gray-500">Esto toma solo un momento...</p>
            </div>
        );
    }

    if (error || !order) {
        return (
            <div className="text-center py-12">
                <AlertCircle className="w-16 h-16 mx-auto text-amber-500 mb-4" />
                <h1 className="text-2xl font-bold mb-2">No pudimos confirmar el pago</h1>
                <p className="text-gray-500 mb-6">{error || 'Intenta nuevamente desde tus pedidos.'}</p>
                <div className="flex gap-3 justify-center flex-wrap">
                    <Button variant="outline" onClick={() => router.push('/')}>
                        Seguir comprando
                    </Button>
                    {user && (
                        <Button onClick={() => router.push('/account/orders')}>
                            Ver mis pedidos
                        </Button>
                    )}
                </div>
            </div>
        );
    }

    if (order.estadoPago !== 'PAGADO') {
        return (
            <div className="text-center py-12">
                <Package className="w-16 h-16 mx-auto text-amber-500 mb-4" />
                <h1 className="text-2xl font-bold mb-2">Pago en proceso</h1>
                <p className="text-gray-500 mb-2">
                    Tu pedido <strong>{order.numeroPedido}</strong> está registrado, pero el pago
                    aún no aparece como confirmado.
                </p>
                <p className="text-sm text-gray-500 mb-6">
                    Si ya pagaste, espera unos segundos y actualiza el estado.
                </p>
                <div className="flex gap-3 justify-center flex-wrap">
                    <Button variant="outline" onClick={handleRefresh}>
                        Actualizar estado
                    </Button>
                    {trackingUrl && (
                        <Button onClick={() => router.push(`/orders/track/${order.trackingToken}`)}>
                            Ver seguimiento
                        </Button>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="text-center py-8">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Pago confirmado</h1>
            <p className="text-gray-500 mb-4">
                Tu pedido <strong>{order.numeroPedido}</strong> fue pagado exitosamente.
            </p>

            <div className="bg-gray-50 border rounded-lg p-4 max-w-md mx-auto text-left mb-6">
                <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600">Total pagado</span>
                    <span className="font-semibold">
                        ${order.total.toLocaleString('es-CL')}
                    </span>
                </div>
                {order.pago?.metodoDetalle && (
                    <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-600">Método</span>
                        <span className="font-medium">{order.pago.metodoDetalle}</span>
                    </div>
                )}
                {order.envio?.fechaEstimadaEntrega && (
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Entrega estimada</span>
                        <span className="font-medium">
                            {new Date(order.envio.fechaEstimadaEntrega).toLocaleDateString('es-CL', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                            })}
                        </span>
                    </div>
                )}
            </div>

            {!user && trackingUrl && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 max-w-md mx-auto text-left">
                    <p className="text-sm font-semibold text-blue-900 mb-2">
                        Guarda este enlace para ver tu pedido:
                    </p>
                    <div className="flex items-center gap-2">
                        <input
                            readOnly
                            value={trackingUrl}
                            className="flex-1 text-xs px-2 py-1.5 border rounded bg-white"
                        />
                        <Button size="sm" variant="outline" onClick={handleCopyLink}>
                            {copied ? (
                                <Check className="w-4 h-4" />
                            ) : (
                                <Copy className="w-4 h-4" />
                            )}
                        </Button>
                    </div>
                    <p className="text-xs text-blue-700 mt-2">
                        También puedes crear tu cuenta con {order.emailDestinatario} para verlo en tu historial.
                    </p>
                </div>
            )}

            <div className="flex gap-4 justify-center flex-wrap">
                <Button variant="outline" onClick={() => router.push('/')}>
                    Seguir comprando
                </Button>
                {user ? (
                    <Button onClick={() => router.push('/account/orders')}>Ver mis pedidos</Button>
                ) : trackingUrl ? (
                    <Button onClick={() => router.push(`/orders/track/${order.trackingToken}`)}>
                        Ver seguimiento
                    </Button>
                ) : null}
            </div>

            {!user && (
                <p className="text-sm text-gray-500 mt-6">
                    ¿Quieres guardar tus compras?{' '}
                    <Link
                        href={`/auth/register?email=${encodeURIComponent(order.emailDestinatario)}`}
                        className="text-rose-600 font-medium hover:underline"
                    >
                        Crea tu cuenta
                    </Link>
                </p>
            )}
        </div>
    );
}
