'use client';
import { useCartStore } from '@/store/cartStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Minus, Plus, Trash2, Tag, X, ArrowRight } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useCheckoutFlowStore } from '@/store/checkoutFlowStore';

export default function CartReviewStep() {
    const { items, updateQuantity, removeItem, applyDiscount, removeDiscount, discount } = useCartStore();
    const setOrderCompleted = useCheckoutFlowStore((s) => s.setOrderCompleted);

    // Nueva compra: permitir que el layout vuelva a validar el carrito
    useEffect(() => {
        if (items.length > 0) setOrderCompleted(false);
    }, [items.length, setOrderCompleted]);
    const [couponCode, setCouponCode] = useState('');
    const [couponError, setCouponError] = useState('');
    const [applying, setApplying] = useState(false);
    const router = useRouter();

    const handleApplyDiscount = async () => {
        if (!couponCode.trim()) return;
        setCouponError('');
        setApplying(true);
        try {
            await applyDiscount(couponCode.trim().toUpperCase());
            setCouponCode('');
        } catch (err: any) {
            setCouponError(err.response?.data?.message || 'Cupón no válido');
        } finally {
            setApplying(false);
        }
    };

    return (
        <div>
            <h2 className="text-xl font-bold mb-6">Revisa tu pedido</h2>
            <div className="space-y-4 mb-6">
                {items.map((item) => (
                    <div key={item.productId} className="flex gap-4 border-b pb-4">
                        <div className="relative w-20 h-20 bg-gray-100 rounded-md overflow-hidden shrink-0">
                            {item.image && <Image src={item.image} alt={item.name} fill className="object-cover" />}
                        </div>
                        <div className="flex-1">
                            <p className="font-semibold">{item.name}</p>
                            <p className="text-sm text-gray-600">${item.price.toLocaleString()}</p>
                            <div className="flex items-center gap-2 mt-2">
                                <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => updateQuantity(item.productId, item.quantity - 1)} disabled={item.quantity <= 1}>
                                    <Minus className="w-3 h-3" />
                                </Button>
                                <span className="text-sm w-6 text-center">{item.quantity}</span>
                                <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => updateQuantity(item.productId, item.quantity + 1)}>
                                    <Plus className="w-3 h-3" />
                                </Button>
                                <Button size="icon" variant="ghost" className="h-7 w-7 text-red-500 ml-2" onClick={() => removeItem(item.productId)}>
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                        <p className="font-bold text-lg">${(item.price * item.quantity).toLocaleString()}</p>
                    </div>
                ))}
            </div>

            <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <p className="text-sm font-medium mb-2">¿Tienes un cupón de descuento?</p>
                <div className="flex gap-2">
                    <div className="relative flex-1">
                        <Input
                            value={couponCode}
                            onChange={(e) => { setCouponCode(e.target.value); setCouponError(''); }}
                            placeholder="Ingresa tu código"
                            disabled={!!discount}
                        />
                        {couponCode && (
                            <button onClick={() => setCouponCode('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                    {discount ? (
                        <Button variant="outline" onClick={() => removeDiscount()} className="text-red-500">
                            Quitar
                        </Button>
                    ) : (
                        <Button variant="outline" onClick={handleApplyDiscount} disabled={applying || !couponCode.trim()}>
                            {applying ? '...' : 'Aplicar'}
                        </Button>
                    )}
                </div>
                {couponError && <p className="text-red-500 text-xs mt-1">{couponError}</p>}
                {discount && (
                    <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-md px-3 py-2 text-sm text-green-700 mt-2">
                        <Tag className="w-4 h-4" />
                        <span className="font-medium">{discount.codigo}</span>
                        <span>- {discount.tipo === 'PORCENTAJE' ? `${discount.valor}%` : `$${discount.valor.toLocaleString()}`}</span>
                    </div>
                )}
            </div>

            <div className="flex justify-end">
                <Button onClick={() => router.push('/checkout/shipping')} disabled={items.length === 0}>
                    Siguiente: Envío <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
            </div>
        </div>
    );
}
