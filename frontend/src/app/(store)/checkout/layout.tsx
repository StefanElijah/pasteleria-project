'use client';
import { useAuthStore } from '@/store/authStore';
import { useCartStore } from '@/store/cartStore';
import { useCheckoutStore } from '@/store/checkoutStore';
import { useCheckoutFlowStore } from '@/store/checkoutFlowStore';
import { useCheckoutDraft } from '@/hooks/useCheckoutDraft';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { ShoppingCart, MapPin, CreditCard, ClipboardCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';

const STEPS = [
    { label: 'Revisar pedido', icon: ShoppingCart, path: '/checkout' },
    { label: 'Envío', icon: MapPin, path: '/checkout/shipping' },
    { label: 'Pago', icon: CreditCard, path: '/checkout/payment' },
    { label: 'Confirmar', icon: ClipboardCheck, path: '/checkout/review' },
];

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
    const { isLoading } = useAuthStore();
    const { items, total, subtotal, discount, isHydrated } = useCartStore();
    const { shippingCost, shippingInfo } = useCheckoutStore();
    const orderCompleted = useCheckoutFlowStore((s) => s.orderCompleted);
    const pathname = usePathname();
    const router = useRouter();
    const isResultPage =
        pathname.startsWith('/checkout/success') || pathname.startsWith('/checkout/cancel');

    useCheckoutDraft();

    useEffect(() => {
        if (!isHydrated) return;
        // No redirigir mientras se muestra la confirmación del pedido
        if (orderCompleted || isResultPage) return;
        if (items.length === 0 && pathname !== '/checkout') {
            router.replace('/checkout');
            return;
        }
        if (pathname.startsWith('/checkout/payment') || pathname.startsWith('/checkout/review')) {
            if (!shippingInfo.primerNombreDestinatario || !shippingInfo.calle) {
                router.replace('/checkout/shipping');
            }
        }
    }, [pathname, items.length, shippingInfo, isHydrated, router, orderCompleted, isResultPage]);

    const currentStepIndex = STEPS.findIndex((s) => pathname === s.path || pathname.startsWith(s.path + '?'));
    const activeStep = currentStepIndex >= 0 ? currentStepIndex : 0;

    const displaySubtotal = subtotal || total;
    const displayDiscount = discount?.amount || 0;
    const displayShipping = shippingCost || 0;
    const displayTotal = total + displayShipping;

    if (isLoading || !isHydrated) {
        return <div className="min-h-screen flex items-center justify-center">Cargando...</div>;
    }

    if (isResultPage) {
        return (
            <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
                {children}
            </div>
        );
    }

    if (items.length === 0 && activeStep < 3 && !orderCompleted) {
        return (
            <div className="max-w-4xl mx-auto px-4 py-12 text-center">
                <ShoppingCart className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <h1 className="text-2xl font-bold mb-2">Tu carrito está vacío</h1>
                <p className="text-gray-500 mb-6">Agrega productos antes de continuar</p>
                <Link href="/">
                    <Button>Ir a comprar</Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto px-4 sm:px-8 md:px-16 lg:px-24 xl:px-28 2xl:px-32 py-8">
            <div className="mb-8">
                <div className="flex items-center justify-center gap-0">
                    {STEPS.map((step, index) => {
                        const Icon = step.icon;
                        const isActive = index === activeStep;
                        const isCompleted = index < activeStep;
                        const isLast = index === STEPS.length - 1;

                        return (
                            <div key={step.path} className="flex items-center">
                                <div className="flex flex-col items-center">
                                    <div
                                        className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${isActive ? 'bg-rose-600 text-white' : isCompleted ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'}`}
                                    >
                                        {isCompleted ? (
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                        ) : (
                                            <Icon className="w-5 h-5" />
                                        )}
                                    </div>
                                    <span className={`text-xs mt-1 font-medium ${isActive ? 'text-rose-600' : 'text-gray-500'}`}>
                                        {step.label}
                                    </span>
                                </div>
                                {!isLast && (
                                    <div className={`w-12 sm:w-20 h-0.5 mx-1 mt-[-16px] ${index < activeStep ? 'bg-green-500' : 'bg-gray-200'}`} />
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">{children}</div>
                <div className="lg:col-span-1">
                    <div className="bg-gray-50 rounded-xl p-6 sticky top-24">
                        <h3 className="font-bold text-lg mb-4">Resumen del pedido</h3>
                        <div className="space-y-3 max-h-60 overflow-y-auto mb-4">
                            {items.map((item) => (
                                <div key={item.productId} className="flex gap-3 items-center">
                                    <div className="relative w-10 h-10 bg-gray-200 rounded overflow-hidden shrink-0">
                                        {item.image && <Image src={item.image} alt={item.name} fill className="object-cover" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate">{item.name}</p>
                                        <p className="text-xs text-gray-500">x{item.quantity}</p>
                                    </div>
                                    <p className="text-sm font-medium">${(item.price * item.quantity).toLocaleString()}</p>
                                </div>
                            ))}
                        </div>
                        <div className="border-t pt-3 space-y-2 text-sm">
                            <div className="flex justify-between text-gray-600">
                                <span>Subtotal</span>
                                <span>${displaySubtotal.toLocaleString()}</span>
                            </div>
                            {displayDiscount > 0 && (
                                <div className="flex justify-between text-green-600">
                                    <span>Descuento</span>
                                    <span>-${displayDiscount.toLocaleString()}</span>
                                </div>
                            )}
                            <div className="flex justify-between text-gray-600">
                                <span>Envío</span>
                                <span>{shippingCost !== null ? `$${displayShipping.toLocaleString()}` : 'Por calcular'}</span>
                            </div>
                            <div className="flex justify-between font-bold text-lg border-t pt-2 mt-2">
                                <span>Total</span>
                                <span>${shippingCost !== null ? displayTotal.toLocaleString() : total.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
