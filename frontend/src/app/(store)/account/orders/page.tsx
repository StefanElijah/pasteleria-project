'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/axios';
import { Order } from '@/types';
import { useRequireAuth } from '@/hooks/useAuth';
import { useOrderStatus } from '@/hooks/useOrderStatus';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { PaymentStatusBadge } from '@/components/ui/PaymentStatusBadge';
import { Package, ChevronRight } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';

const COLOR_CLASSES: Record<string, string> = {
    yellow: 'bg-yellow-100 text-yellow-800',
    blue: 'bg-blue-100 text-blue-800',
    purple: 'bg-purple-100 text-purple-800',
    indigo: 'bg-indigo-100 text-indigo-800',
    green: 'bg-green-100 text-green-800',
    red: 'bg-red-100 text-red-800',
    orange: 'bg-orange-100 text-orange-800',
    gray: 'bg-gray-100 text-gray-800',
};

export default function OrdersPage() {
    return (
        <ProtectedRoute>
            <OrdersContent />
        </ProtectedRoute>
    );
}

function OrdersContent() {
    const { user } = useRequireAuth();
    const fetchCart = useCartStore((s) => s.fetchCart);
    const statusInfo = useOrderStatus();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) {
            api.get('/orders')
                .then(({ data }) => setOrders(data))
                .finally(() => setLoading(false));
            fetchCart();
        }
    }, [user]);

    if (loading) {
        return <div className="animate-pulse space-y-4">
            {[1, 2, 3].map(i => <div key={i} className="h-24 bg-gray-100 rounded-lg" />)}
        </div>;
    }

    if (orders.length === 0) {
        return (
            <div className="text-center py-12">
                <Package className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <h2 className="text-xl font-bold mb-2">No tienes pedidos</h2>
                <p className="text-gray-500 mb-6">Aún no has realizado ninguna compra</p>
                <Link href="/">
                    <Button>Ir a comprar</Button>
                </Link>
            </div>
        );
    }

    return (
        <div>
            <h2 className="text-xl font-bold mb-6">Mis pedidos</h2>
            <div className="space-y-4">
                {orders.map((order) => (
                    <Link
                        key={order.id}
                        href={`/account/orders/${order.id}`}
                        className="block border rounded-lg p-4 hover:border-gray-400 transition-colors"
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="flex items-center gap-3 mb-2">
                                    <span className="font-semibold">{order.numeroPedido}</span>
                                    <span
                                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${COLOR_CLASSES[statusInfo.colors[order.estado as keyof typeof statusInfo.colors] || 'gray'] || 'bg-gray-100'}`}
                                    >
                                        {statusInfo.labels[order.estado as keyof typeof statusInfo.labels] || order.estado}
                                    </span>
                                    <PaymentStatusBadge status={order.estadoPago} />
                                </div>
                                <p className="text-sm text-gray-500">
                                    {new Date(order.createdAt).toLocaleDateString('es-CL', { year: 'numeric', month: 'long', day: 'numeric' })} · {order.items.length} producto{order.items.length !== 1 ? 's' : ''}
                                </p>
                            </div>
                            <div className="flex items-center gap-4">
                                <span className="font-bold">${order.total.toLocaleString()}</span>
                                <ChevronRight className="w-5 h-5 text-gray-400" />
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}
