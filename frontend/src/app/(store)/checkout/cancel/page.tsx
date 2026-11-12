'use client';
import { Suspense, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { AlertCircle, Loader2, RefreshCw, ShoppingBag, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createStripeCheckoutSession } from '@/lib/payments';
import { useCheckoutStore } from '@/store/checkoutStore';

export default function CheckoutCancelPage() {
    return (
        <Suspense
            fallback={
                <div className="py-12 text-center flex items-center justify-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" /> Cargando...
                </div>
            }
        >
            <CheckoutCancelContent />
        </Suspense>
    );
}

function CheckoutCancelContent() {
    const searchParams = useSearchParams();
    const router = useRouter();

    const pedidoQuery = searchParams.get('pedido');
    const tokenQuery = searchParams.get('token');
    const totalQuery = searchParams.get('total');
    const numeroQuery = searchParams.get('numero');

    const {
        pendingOrderId,
        pendingOrderToken,
        pendingOrderTotal,
        setPendingOrder,
    } = useCheckoutStore();

    const [retrying, setRetrying] = useState(false);
    const [error, setError] = useState('');

    const orderId = pedidoQuery || pendingOrderId;
    const token = tokenQuery || pendingOrderToken;
    const parsedTotal = totalQuery ? Number(totalQuery) : pendingOrderTotal;
    const total = typeof parsedTotal === 'number' && Number.isFinite(parsedTotal) ? parsedTotal : null;

    const handleRetry = async () => {
        if (!orderId) {
            router.push('/checkout/review');
            return;
        }

        setRetrying(true);
        setError('');
        try {
            if (pendingOrderId !== orderId) {
                setPendingOrder(orderId, token, total);
            }
            const session = await createStripeCheckoutSession(orderId, token);
            window.location.href = session.url;
        } catch (err: unknown) {
            let message = '';
            if (typeof err === 'object' && err !== null && 'response' in err) {
                const response = (err as { response?: { data?: { message?: string } } }).response;
                message = response?.data?.message || '';
            }
            setError(
                message ||
                'No se pudo reintentar el pago. Intenta nuevamente desde el checkout.',
            );
            setRetrying(false);
        }
    };

    return (
        <div className="text-center py-8">
            <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <XCircle className="w-10 h-10 text-amber-600" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Pago cancelado</h1>
            <p className="text-gray-500 mb-2">
                No se realizó ningún cobro. Tu pedido{numeroQuery ? ` ${numeroQuery}` : ''} quedó
                pendiente y puedes reintentar el pago.
            </p>
            {total !== null && (
                <p className="text-sm text-gray-500 mb-6">
                    Total a pagar: <strong>${total.toLocaleString('es-CL')}</strong>
                </p>
            )}

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm max-w-md mx-auto mb-6 flex items-start gap-2 text-left">
                    <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            <div className="flex gap-3 justify-center flex-wrap">
                {orderId ? (
                    <Button
                        onClick={handleRetry}
                        disabled={retrying}
                        className="bg-rose-600 hover:bg-rose-700"
                    >
                        {retrying ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Redirigiendo...
                            </>
                        ) : (
                            <>
                                <RefreshCw className="w-4 h-4 mr-2" /> Reintentar pago
                            </>
                        )}
                    </Button>
                ) : (
                    <Button onClick={() => router.push('/checkout/review')}>
                        Volver al checkout
                    </Button>
                )}
                <Button variant="outline" onClick={() => router.push('/cart')}>
                    <ShoppingBag className="w-4 h-4 mr-2" /> Volver al carrito
                </Button>
            </div>
        </div>
    );
}
