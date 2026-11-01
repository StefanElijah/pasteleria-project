'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import api from '@/lib/axios';
import { Order, Devolucion } from '@/types';
import { useRequireAuth } from '@/hooks/useAuth';
import { useOrderStatus } from '@/hooks/useOrderStatus';
import { OrderStatusBadge } from '@/components/admin/OrderStatusBadge';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

const ESTADO_DEVOLUCION_LABEL: Record<string, string> = {
    SOLICITADA: 'Solicitada',
    APROBADA: 'Aprobada',
    RECHAZADA: 'Rechazada',
    PROCESADA: 'Procesada',
};

export default function OrderDetailPage() {
    return (
        <ProtectedRoute>
            <OrderDetailContent />
        </ProtectedRoute>
    );
}

function OrderDetailContent() {
    const { id } = useParams();
    const { user } = useRequireAuth();
    const statusInfo = useOrderStatus();
    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);
    const [devoluciones, setDevoluciones] = useState<Devolucion[]>([]);
    const [showForm, setShowForm] = useState(false);
    const [motivo, setMotivo] = useState('');
    const [cantidades, setCantidades] = useState<Record<string, number>>({});
    const [sending, setSending] = useState(false);

    const fetchDevoluciones = () => {
        if (!id) return;
        api.get(`/devoluciones/pedido/${id}`)
            .then(({ data }) => setDevoluciones(data))
            .catch(() => { });
    };

    useEffect(() => {
        if (id && user) {
            api.get(`/orders/${id}`)
                .then(({ data }) => setOrder(data))
                .finally(() => setLoading(false));
            fetchDevoluciones();
        }
    }, [id, user]);

    const handleSolicitar = async () => {
        const items = Object.entries(cantidades)
            .filter(([, c]) => c > 0)
            .map(([itemPedidoId, cantidad]) => ({ itemPedidoId, cantidad }));
        if (items.length === 0) {
            toast.error('Selecciona al menos un producto a devolver');
            return;
        }
        setSending(true);
        try {
            await api.post('/devoluciones/solicitar', { pedidoId: id, motivo, items });
            toast.success('Solicitud de devolución enviada');
            setShowForm(false);
            setCantidades({});
            setMotivo('');
            fetchDevoluciones();
        } catch (err: any) {
            toast.error(err?.response?.data?.message || 'No se pudo enviar la solicitud');
        } finally {
            setSending(false);
        }
    };

    if (loading) return <div>Cargando...</div>;
    if (!order) return <div>Pedido no encontrado</div>;

    const puedeDevolver = order.estado === 'ENTREGADO';

    return (
        <div className="max-w-3xl mx-auto">
            <h1 className="text-2xl font-bold mb-4">Pedido #{order.numeroPedido}</h1>
            <div className="border rounded p-4 space-y-4">
                <div>
                    <strong>Estado:</strong> <OrderStatusBadge status={order.estado} statusInfo={statusInfo} />
                </div>
                <div>
                    <strong>Fecha:</strong> {new Date(order.createdAt).toLocaleDateString()}
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
                    <strong>Dirección:</strong> {order.direccion.calle} {order.direccion.numero}, {order.direccion.comuna.nombre}, {order.direccion.comuna.region.nombre}
                </div>
                <div>
                    <strong>Envío:</strong> {order.envio.metodoEnvio} - Estimado: {new Date(order.envio.fechaEstimadaEntrega).toLocaleDateString()}
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
                <div className="border-t pt-2 text-right font-bold">
                    Total: ${order.total.toLocaleString()}
                </div>
            </div>

            {devoluciones.length > 0 && (
                <div className="border rounded p-4 mt-4">
                    <h2 className="font-semibold mb-2">Devoluciones</h2>
                    <div className="space-y-2">
                        {devoluciones.map((d) => (
                            <div key={d.id} className="text-sm border-b last:border-0 pb-2">
                                <div className="flex justify-between">
                                    <span>Estado: <strong>{ESTADO_DEVOLUCION_LABEL[d.estado] || d.estado}</strong></span>
                                    <span>{new Date(d.createdAt).toLocaleDateString('es-CL')}</span>
                                </div>
                                {d.montoReembolsado > 0 && (
                                    <p className="text-gray-500">Monto reembolsado: ${d.montoReembolsado.toLocaleString()}</p>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {puedeDevolver && (
                <div className="mt-4">
                    {!showForm ? (
                        <Button variant="outline" onClick={() => setShowForm(true)}>Solicitar devolución</Button>
                    ) : (
                        <div className="border rounded p-4 space-y-4">
                            <h2 className="font-semibold">Solicitar devolución</h2>
                            <p className="text-sm text-gray-500">Indica la cantidad a devolver por producto.</p>
                            {order.items.map((item) => (
                                <div key={item.id} className="flex items-center justify-between gap-4">
                                    <span className="text-sm">{item.nombre} (comprados: {item.cantidad})</span>
                                    <Input
                                        type="number"
                                        min={0}
                                        max={item.cantidad}
                                        value={cantidades[item.id] ?? 0}
                                        onChange={(e) => {
                                            const v = Math.max(0, Math.min(item.cantidad, parseInt(e.target.value || '0', 10)));
                                            setCantidades((prev) => ({ ...prev, [item.id]: v }));
                                        }}
                                        className="w-24"
                                    />
                                </div>
                            ))}
                            <div>
                                <label className="block text-sm font-medium mb-1">Motivo (opcional)</label>
                                <Input value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Ej: producto en mal estado" />
                            </div>
                            <div className="flex justify-end gap-2">
                                <Button variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
                                <Button onClick={handleSolicitar} disabled={sending} className="bg-rose-600 hover:bg-rose-700">
                                    {sending ? 'Enviando...' : 'Enviar solicitud'}
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
