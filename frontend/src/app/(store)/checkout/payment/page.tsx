'use client';
import { useCheckoutStore } from '@/store/checkoutStore';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, CreditCard, Banknote, QrCode, Truck } from 'lucide-react';
import { useRouter } from 'next/navigation';

const PAYMENT_METHODS = [
    { value: 'EFECTIVO', label: 'Efectivo', description: 'Paga al recibir tu pedido', icon: Banknote },
    { value: 'TARJETA', label: 'Tarjeta', description: 'Débito o crédito', icon: CreditCard },
    { value: 'TRANSFERENCIA', label: 'Transferencia', description: 'Transferencia bancaria', icon: QrCode },
    { value: 'PAGO_ENTREGA', label: 'Pago contra entrega', description: 'Pagas cuando recibas', icon: Truck },
];

export default function PaymentStep() {
    const { paymentMethod, setPaymentMethod } = useCheckoutStore();
    const router = useRouter();

    return (
        <div>
            <h2 className="text-xl font-bold mb-6">Método de pago</h2>

            <div className="space-y-3">
                {PAYMENT_METHODS.map((method) => {
                    const Icon = method.icon;
                    return (
                        <button
                            key={method.value}
                            type="button"
                            onClick={() => setPaymentMethod(method.value)}
                            className={`w-full flex items-center gap-4 border rounded-lg p-4 transition-colors text-left ${paymentMethod === method.value ? 'border-rose-600 bg-rose-50' : 'border-gray-200 hover:border-gray-300'}`}
                        >
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${paymentMethod === method.value ? 'bg-rose-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
                                <Icon className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="font-semibold">{method.label}</p>
                                <p className="text-sm text-gray-500">{method.description}</p>
                            </div>
                            <div className="ml-auto">
                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${paymentMethod === method.value ? 'border-rose-600' : 'border-gray-300'}`}>
                                    {paymentMethod === method.value && <div className="w-2.5 h-2.5 rounded-full bg-rose-600" />}
                                </div>
                            </div>
                        </button>
                    );
                })}
            </div>

            {paymentMethod === 'TARJETA' && (
                <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-900">
                    <p className="font-semibold mb-1">Pago seguro con Stripe (modo prueba)</p>
                    <p>
                        Serás redirigido a la página de Stripe para ingresar los datos de tu tarjeta.
                        Usa la tarjeta de prueba <strong>4242 4242 4242 4242</strong>, cualquier fecha
                        futura y cualquier CVC. No se realizará ningún cobro real.
                    </p>
                </div>
            )}

            <div className="flex justify-between mt-8">
                <Button variant="outline" onClick={() => router.push('/checkout/shipping')}>
                    <ArrowLeft className="w-4 h-4 mr-2" /> Anterior
                </Button>
                <Button onClick={() => router.push('/checkout/review')}>
                    Siguiente: Confirmar <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
            </div>
        </div>
    );
}
