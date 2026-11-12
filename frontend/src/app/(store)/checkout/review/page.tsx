'use client';
import { useCheckoutStore } from '@/store/checkoutStore';
import { useCheckoutFlowStore } from '@/store/checkoutFlowStore';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, CheckCircle, MapPin, CreditCard, Package, Copy, Check } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import api from '@/lib/axios';
import { deleteDraft } from '@/lib/checkout';
import { detectPlataforma } from '@/lib/platform';
import { createStripeCheckoutSession } from '@/lib/payments';

export default function ReviewStep() {
    const {
        shippingInfo, paymentMethod, shippingMethod, setShippingCost, shippingCost,
        reset: resetCheckout, saveAddress, selectedAddressId, puntosUsados, setPuntosUsados,
        pendingOrderId, pendingOrderToken, pendingOrderTotal, setPendingOrder, clearPendingOrder,
    } = useCheckoutStore();
    const setOrderCompleted = useCheckoutFlowStore((s) => s.setOrderCompleted);
    const { items, total, subtotal, discount, clearCart } = useCartStore();
    const { user } = useAuthStore();
    const router = useRouter();

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [orderCreated, setOrderCreated] = useState<any>(null);
    const [calculatingShipping, setCalculatingShipping] = useState(true);
    const [fechaEstimada, setFechaEstimada] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const [puntosSaldo, setPuntosSaldo] = useState(0);

    const displaySubtotal = subtotal || total;
    const displayDiscount = discount?.amount || 0;
    const displayShipping = shippingCost || 0;
    const maxPuntos = Math.min(puntosSaldo, Math.floor(displaySubtotal * 0.5));
    const envioGratis = discount?.tipo === 'ENVIO_GRATIS';
    const displayTotal = total + (envioGratis ? 0 : displayShipping) - puntosUsados;

    useEffect(() => {
        if (!user) return;
        api.get('/users/puntos')
            .then(({ data }) => setPuntosSaldo(data.saldo || 0))
            .catch(() => { });
    }, [user]);

    useEffect(() => {
        if (shippingInfo.comunaId) {
            setCalculatingShipping(true);
            api.get('/orders/shipping', {
                params: { comunaId: shippingInfo.comunaId, metodo: shippingMethod },
            })
                .then((res) => {
                    setShippingCost(res.data.costo);
                    setFechaEstimada(res.data.fechaEstimada || null);
                })
                .catch(() => { })
                .finally(() => setCalculatingShipping(false));
        } else {
            setCalculatingShipping(false);
        }
    }, []);

    const handleConfirm = async () => {
        setIsSubmitting(true);
        setError('');
        try {
            const orderData = {
                items: items.map((item) => ({ productId: item.productId, quantity: item.quantity })),
                direccion: {
                    calle: shippingInfo.calle,
                    numero: shippingInfo.numero,
                    regionId: shippingInfo.regionId,
                    ciudadId: shippingInfo.ciudadId,
                    comunaId: shippingInfo.comunaId,
                    tipoVivienda: shippingInfo.tipoVivienda || 'CASA',
                },
                metodoPago: paymentMethod,
                metodoEnvio: shippingMethod,
                costoEnvio: envioGratis ? 0 : shippingCost,
                descuentoId: discount?.id,
                puntosUsados: puntosUsados || undefined,
                guardarDireccion: saveAddress || undefined,
                direccionGuardadaId: selectedAddressId || undefined,
                primerNombreDestinatario: shippingInfo.primerNombreDestinatario,
                primerApellidoDestinatario: shippingInfo.primerApellidoDestinatario,
                emailDestinatario: shippingInfo.emailDestinatario,
                telefonoDestinatario: shippingInfo.telefonoDestinatario,
                plataforma: detectPlataforma(),
            };

            if (paymentMethod === 'TARJETA') {
                const totalActual = Math.max(0, Math.round(displayTotal));
                const puedeReutilizar =
                    !!pendingOrderId &&
                    pendingOrderTotal !== null &&
                    Math.abs(pendingOrderTotal - totalActual) <= 1;

                let orderId = pendingOrderId;
                let orderToken = pendingOrderToken;

                if (!puedeReutilizar) {
                    if (pendingOrderId) clearPendingOrder();
                    const created = await api.post('/orders', orderData);
                    orderId = created.data.id;
                    orderToken = created.data.trackingToken;
                    setPendingOrder(created.data.id, created.data.trackingToken, created.data.total);
                }

                if (!orderId) {
                    throw new Error('No se pudo crear el pedido para el pago');
                }

                const session = await createStripeCheckoutSession(orderId, orderToken);
                window.location.href = session.url;
                return;
            }

            const response = await api.post('/orders', orderData);
            // Marcar completado ANTES de vaciar el carrito para que el layout
            // no redirija y la pantalla de confirmación permanezca visible.
            setOrderCompleted(true);
            setOrderCreated(response.data);
            await clearCart();
            // Solo los usuarios con sesión tienen borrador en el servidor.
            // Para invitados, /checkout/draft responde 401 y el interceptor
            // de axios redirige a /auth/login (rompía la confirmación).
            if (user) {
                await deleteDraft().catch(() => { });
            }
            resetCheckout();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Error al procesar el pedido. Intenta de nuevo.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCopyLink = () => {
        if (!orderCreated?.trackingToken) return;
        const url = `${window.location.origin}/orders/track/${orderCreated.trackingToken}`;
        navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (orderCreated) {
        const isGuest = !user;
        const guestEmail = orderCreated.emailDestinatario || shippingInfo.emailDestinatario;
        const trackingUrl = orderCreated.trackingToken
            ? `${typeof window !== 'undefined' ? window.location.origin : ''}/orders/track/${orderCreated.trackingToken}`
            : null;

        return (
            <div className="text-center py-8">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle className="w-10 h-10 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold mb-2">Pedido confirmado</h2>
                <p className="text-gray-500 mb-4">
                    Tu pedido <strong>{orderCreated.numeroPedido}</strong> ha sido registrado exitosamente.
                </p>

                {orderCreated.envio?.fechaEstimadaEntrega && (
                    <p className="text-sm text-gray-500 mb-6">
                        Fecha estimada de entrega:{' '}
                        {new Date(orderCreated.envio.fechaEstimadaEntrega).toLocaleDateString('es-CL', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                        })}
                    </p>
                )}

                {isGuest && trackingUrl && (
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
                                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                            </Button>
                        </div>
                        <p className="text-xs text-blue-700 mt-2">
                            También te lo enviaremos por email a {guestEmail}.
                        </p>
                    </div>
                )}

                {isGuest && (
                    <div className="bg-rose-50 border border-rose-200 rounded-lg p-5 mb-6 max-w-md mx-auto text-left">
                        <p className="font-semibold text-rose-900 mb-2">¡Crea tu cuenta y gana beneficios!</p>
                        <ul className="text-sm text-rose-800 space-y-1 mb-3 list-disc pl-4">
                            <li><strong>500 puntos de bienvenida</strong> (equivalen a $500)</li>
                            <li>Cupón de <strong>10% de descuento</strong> en tu próxima compra</li>
                            <li>Acumula puntos en cada compra y súbelos a descuentos</li>
                            <li>Sigue el historial de todos tus pedidos</li>
                        </ul>
                        <p className="text-xs text-rose-700 mb-3">
                            Regístrate con <strong>{guestEmail}</strong> y tus compras anteriores aparecerán en tu cuenta.
                        </p>
                        <div className="flex gap-2">
                            <Button
                                className="bg-rose-600 hover:bg-rose-700"
                                onClick={() => router.push(`/auth/register?email=${encodeURIComponent(guestEmail)}`)}
                            >
                                Registrarse
                            </Button>
                            <Button variant="outline" onClick={() => router.push('/auth/login')}>
                                Ya tengo cuenta
                            </Button>
                        </div>
                    </div>
                )}

                <div className="flex gap-4 justify-center flex-wrap">
                    <Button variant="outline" onClick={() => { setOrderCompleted(false); router.push('/'); }}>
                        Seguir comprando
                    </Button>
                    {!isGuest && (
                        <Button onClick={() => router.push('/account/orders')}>
                            Ver mis pedidos
                        </Button>
                    )}
                </div>
            </div>
        );
    }

    if (items.length === 0) {
        return (
            <div className="text-center py-12">
                <h2 className="text-xl font-bold mb-2">No hay un pedido para confirmar</h2>
                <p className="text-gray-500 mb-6">Tu carrito está vacío.</p>
                <Button onClick={() => router.push('/')}>Ir a comprar</Button>
            </div>
        );
    }

    return (
        <div>
            <h2 className="text-xl font-bold mb-6">Confirmar pedido</h2>

            <div className="space-y-6">
                <div className="border rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                        <MapPin className="w-5 h-5 text-gray-500" />
                        <h3 className="font-semibold">Dirección de envío</h3>
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                        <p className="font-medium text-gray-900">
                            {shippingInfo.primerNombreDestinatario} {shippingInfo.primerApellidoDestinatario}
                        </p>
                        <p>
                            {shippingInfo.calle} #{shippingInfo.numero},{' '}
                            {[shippingInfo.comunaNombre, shippingInfo.ciudadNombre, shippingInfo.regionNombre]
                                .filter(Boolean)
                                .join(', ')}
                        </p>
                        <p>
                            {shippingInfo.emailDestinatario} · {shippingInfo.telefonoDestinatario}
                        </p>
                    </div>
                </div>

                <div className="border rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                        <Package className="w-5 h-5 text-gray-500" />
                        <h3 className="font-semibold">Método de envío</h3>
                    </div>
                    <p className="text-sm">{shippingMethod}</p>
                    {calculatingShipping ? (
                        <p className="text-sm text-gray-400">Calculando costo...</p>
                    ) : (
                        <p className="text-sm font-medium">${displayShipping.toLocaleString()}</p>
                    )}
                    {!calculatingShipping && fechaEstimada && (
                        <p className="text-sm text-gray-500 mt-1">
                            Fecha estimada de entrega:{' '}
                            {new Date(fechaEstimada).toLocaleDateString('es-CL', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                            })}
                        </p>
                    )}
                </div>

                <div className="border rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                        <CreditCard className="w-5 h-5 text-gray-500" />
                        <h3 className="font-semibold">Método de pago</h3>
                    </div>
                    <p className="text-sm">
                        {paymentMethod === 'EFECTIVO'
                            ? 'Efectivo'
                            : paymentMethod === 'TARJETA'
                            ? 'Tarjeta (Stripe - modo prueba)'
                            : paymentMethod === 'TRANSFERENCIA'
                            ? 'Transferencia'
                            : 'Pago contra entrega'}
                    </p>
                </div>

                {user && puntosSaldo >= 500 && (
                    <div className="border rounded-lg p-4">
                        <h3 className="font-semibold mb-2">Usar mis puntos</h3>
                        <p className="text-sm text-gray-500 mb-2">
                            Saldo: {puntosSaldo.toLocaleString()} pts · máximo aplicable: {maxPuntos.toLocaleString()} pts (50% del subtotal)
                        </p>
                        <div className="flex items-center gap-2">
                            <Input
                                type="number"
                                min={0}
                                max={maxPuntos}
                                value={puntosUsados}
                                onChange={(e) => {
                                    const v = Math.max(0, Math.min(maxPuntos, parseInt(e.target.value || '0', 10)));
                                    setPuntosUsados(v);
                                }}
                                className="w-40"
                            />
                            <Button type="button" variant="outline" size="sm" onClick={() => setPuntosUsados(maxPuntos)}>
                                Usar máximo
                            </Button>
                            <Button type="button" variant="ghost" size="sm" onClick={() => setPuntosUsados(0)}>
                                Quitar
                            </Button>
                        </div>
                    </div>
                )}

                <div className="border-t pt-4 space-y-2">
                    <div className="flex justify-between text-gray-600">
                        <span>Subtotal</span>
                        <span>${displaySubtotal.toLocaleString()}</span>
                    </div>
                    {displayDiscount > 0 && (
                        <div className="flex justify-between text-green-600">
                            <span>Descuento ({discount?.codigo})</span>
                            <span>-${displayDiscount.toLocaleString()}</span>
                        </div>
                    )}
                    {puntosUsados > 0 && (
                        <div className="flex justify-between text-green-600">
                            <span>Puntos usados</span>
                            <span>-${puntosUsados.toLocaleString()}</span>
                        </div>
                    )}
                    <div className="flex justify-between text-gray-600">
                        <span>Envío</span>
                        <span>{calculatingShipping ? '...' : envioGratis ? 'Gratis' : `$${displayShipping.toLocaleString()}`}</span>
                    </div>
                    <div className="flex justify-between font-bold text-xl border-t pt-2">
                        <span>Total</span>
                        <span>{calculatingShipping ? '...' : `$${Math.max(0, displayTotal).toLocaleString()}`}</span>
                    </div>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                        {error}
                    </div>
                )}

                <div className="flex justify-between">
                    <Button variant="outline" onClick={() => router.push('/checkout/payment')}>
                        <ArrowLeft className="w-4 h-4 mr-2" /> Anterior
                    </Button>
                    <Button
                        onClick={handleConfirm}
                        disabled={isSubmitting || calculatingShipping}
                        className="bg-rose-600 hover:bg-rose-700"
                    >
                        {isSubmitting
                            ? paymentMethod === 'TARJETA'
                                ? 'Redirigiendo a Stripe...'
                                : 'Procesando...'
                            : paymentMethod === 'TARJETA'
                            ? 'Pagar con tarjeta'
                            : 'Confirmar pedido'}
                    </Button>
                </div>
            </div>
        </div>
    );
}
