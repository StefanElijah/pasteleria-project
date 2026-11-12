'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/axios';
import { Order } from '@/types';
import { OrderStatusBadge } from '@/components/admin/OrderStatusBadge';
import { PaymentStatusBadge } from '@/components/ui/PaymentStatusBadge';
import { Button } from '@/components/ui/button';

export default function AdminOrdersPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/orders').then(({ data }) => {
            setOrders(data);
            setLoading(false);
        });
    }, []);

    if (loading) return <div>Cargando...</div>;

    return (
        <div>
            <h1 className="text-2xl font-bold mb-4">Pedidos</h1>
            <div className="bg-white rounded shadow overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="p-3">Número</th>
                            <th className="p-3">Fecha</th>
                            <th className="p-3">Cliente</th>
                            <th className="p-3">Total</th>
                            <th className="p-3">Estado</th>
                            <th className="p-3">Pago</th>
                            <th className="p-3">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {orders.map((order) => (
                            <tr key={order.id} className="border-b hover:bg-gray-50">
                                <td className="p-3">{order.numeroPedido}</td>
                                <td className="p-3">{new Date(order.createdAt).toLocaleDateString()}</td>
                                <td className="p-3">{order.primerNombreDestinatario} {order.primerApellidoDestinatario}</td>
                                <td className="p-3">${order.total.toLocaleString()}</td>
                                <td className="p-3"><OrderStatusBadge status={order.estado} /></td>
                                <td className="p-3"><PaymentStatusBadge status={order.estadoPago} /></td>
                                <td className="p-3">
                                    <Link href={`/admin/orders/${order.id}`}>
                                        <Button variant="outline" size="sm">Ver detalle</Button>
                                    </Link>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}