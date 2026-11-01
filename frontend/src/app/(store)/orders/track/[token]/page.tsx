'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import api from '@/lib/axios';
import { Order } from '@/types';
import { useOrderStatus } from '@/hooks/useOrderStatus';
import { OrderStatusBadge } from '@/components/admin/OrderStatusBadge';
import { Loader2, Package, X } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function TrackOrderPage() {
    const { token } = useParams();
    const statusInfo = useOrderStatus();
    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showInvite, setShowInvite] = useState(true);

    useEffect(() => {
        if (token && typeof token === 'string') {
            api.get(`/orders/track/${token}`)
                .then(({ data }) => setOrder(data))
                .catch((err) => {
                    if (err.response?.status === 404) {
                        setError('Pedido no encontrado. Verifica que el enlace sea correcto.');
                    } else {
                        setError('Error al cargar el pedido.');
                    }
                })
                .finally(() => setLoading(false));
        }
    }, [token]);

    if (loading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-rose-600" />
            </div>
        );
    }

    if (error || !order) {
        return (
            <div className="max-w-md mx-auto text-center py-12">
                <Package className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <h1 className="text-2xl font-bold mb-2">No encontramos tu pedido</h1>
                <p className="text-gray-500">{error || 'El enlace puede haber expirado o ser incorrecto.'}</p>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto">
            <div className="mb-6 flex items-center gap-3">
                <div>
                    <h1 className="text-2xl font-bold">Pedido {order.numeroPedido}</h1>
                    <div className="mt-1">
                        <OrderStatusBadge status={order.estado} statusInfo={statusInfo} />
                    </div>
                </div>
            </div>

            {showInvite && (
                <div className="relative bg-rose-50 border border-rose-200 rounded-lg p-4 mb-4">
                    <button
                        onClick={() => setShowInvite(false)}
                        className="absolute top-2 right-2 text-rose-400 hover:text-rose-600"
                        aria-label="Cerrar"
                    >
                        <X className="w-4 h-4" />
                    </button>
                    <p className="font-semibold text-rose-900 mb-1">Crea tu cuenta y gana beneficios</p>
                    <p className="text-sm text-rose-800 mb-2">
                        500 puntos de bienvenida, cupón de 10% y el historial de tus pedidos en un solo lugar.
                    </p>
                    <Link href={`/auth/register?email=${encodeURIComponent(order.emailDestinatario)}`}>
                        <Button size="sm" className="bg-rose-600 hover:bg-rose-700">Registrarse</Button>
                    </Link>
                </div>
            )}

            <div className="border rounded-lg p-4 space-y-4">
                <div>
                    <strong>Fecha:</strong>{' '}
                    {new Date(order.createdAt).toLocaleDateString('es-CL', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                    })}
                </div>
                <div>
                    <strong>Destinatario:</strong> {order.primerNombreDestinatario} {order.primerApellidoDestinatario}
                </div>
                <div>
                    <strong>Email:</strong> {order.emailDestinatario}
                </div>
                <div>
                    <strong>Teléfono:</strong> {order.telefonoDestinatario}
                </div>
                <div>
                    <strong>Dirección:</strong> {order.direccion.calle} {order.direccion.numero},{' '}
                    {order.direccion.comuna.nombre}, {order.direccion.comuna.region.nombre}
                </div>
                <div>
                    <strong>Envío:</strong> {order.envio.metodoEnvio} - Estimado:{' '}
                    {new Date(order.envio.fechaEstimadaEntrega).toLocaleDateString('es-CL')}
                    {order.envio.numeroTracking && <div>Tracking: {order.envio.numeroTracking}</div>}
                </div>
                <div>
                    <strong>Productos:</strong>
                    <ul className="list-disc pl-5 mt-2">
                        {order.items.map((item) => (
                            <li key={item.id}>
                                {item.cantidad} x {item.nombre} - ${item.total.toLocaleString()}
                            </li>
                        ))}
                    </ul>
                </div>
                <div className="border-t pt-2 text-right font-bold">Total: ${order.total.toLocaleString()}</div>
            </div>

            <p className="text-sm text-gray-500 text-center mt-6">
                Guarda este enlace para consultar el estado de tu pedido.
            </p>
        </div>
    );
}
