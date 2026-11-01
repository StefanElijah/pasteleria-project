'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/axios';
import { Envio } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EstadoEnvioBadge } from '@/components/ui/EstadoEnvioBadge';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { estadoPedidoOpciones, estadoPedidoTexto } from '@/lib/estados';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

export default function DetalleEnvioPage() {
    const { id } = useParams();
    const router = useRouter();
    const [envio, setEnvio] = useState<Envio | null>(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [nuevoEstado, setNuevoEstado] = useState('');

    const cargar = async () => {
        try {
            const { data } = await api.get(`/envios/${id}`);
            setEnvio(data);
            setNuevoEstado(data.estadoEnvio);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        cargar();
    }, [id]);

    const handleActualizarEstado = async () => {
        if (!envio || nuevoEstado === envio.estadoEnvio) return;
        setUpdating(true);
        try {
            await api.patch(`/envios/${envio.id}/estado`, { estadoEnvio: nuevoEstado });
            await cargar();
            toast.success('Estado actualizado', {
                description: `El envío pasó a "${estadoPedidoTexto[nuevoEstado as keyof typeof estadoPedidoTexto] || nuevoEstado}".`,
            });
        } catch (error: any) {
            const msg = error?.response?.data?.message || 'Error al actualizar el estado';
            toast.error('Error al actualizar', { description: msg });
        } finally {
            setUpdating(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin h-8 w-8 border-4 border-rose-500 border-t-transparent rounded-full" />
            </div>
        );
    }

    if (!envio) return <div className="p-6 text-muted-foreground">Envío no encontrado.</div>;

    return (
        <div className="space-y-6 pb-8">
            <Button variant="ghost" className="mb-2 -ml-2"
                onClick={() => router.push('/admin/envios')}>
                ← Volver a envíos
            </Button>

            <h1 className="text-2xl font-bold">Detalle del Envío</h1>

            <div className="grid md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Información del envío</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                        <p><span className="font-medium">Tracking:</span> {envio.numeroTracking || '—'}</p>
                        <p><span className="font-medium">Pedido:</span> {envio.pedido?.numeroPedido || '—'}</p>
                        <p><span className="font-medium">Método de envío:</span> {envio.metodoEnvio}</p>
                        <p><span className="font-medium">Empresa logística:</span> {envio.empresaLogistica || '—'}</p>
                        <p><span className="font-medium">Fecha estimada:</span> {new Date(envio.fechaEstimadaEntrega).toLocaleDateString('es-CL')}</p>
                        <p><span className="font-medium">Fecha creación:</span> {new Date(envio.createdAt).toLocaleString('es-CL')}</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Actualizar estado</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <p className="text-sm text-muted-foreground mb-1.5">Estado actual:</p>
                            <EstadoEnvioBadge estado={envio.estadoEnvio} />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground mb-1.5">Cambiar a:</p>
                            <Select value={nuevoEstado} onValueChange={(v: string | null) => setNuevoEstado(v ?? '')}>
                                <SelectTrigger className="w-52">
                                    <SelectValue>
                                        {nuevoEstado
                                            ? estadoPedidoTexto[nuevoEstado as keyof typeof estadoPedidoTexto] || nuevoEstado
                                            : 'Seleccionar'}
                                    </SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                    {estadoPedidoOpciones.map((opt) => (
                                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <Button onClick={handleActualizarEstado}
                            disabled={updating || nuevoEstado === envio.estadoEnvio}>
                            {updating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {updating ? 'Actualizando…' : 'Actualizar estado'}
                        </Button>
                    </CardContent>
                </Card>
            </div>

            {envio.pedido?.direccion && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Dirección de entrega</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                        <p>
                            <span className="font-medium">Destinatario:</span>{' '}
                            {envio.pedido.primerNombreDestinatario} {envio.pedido.primerApellidoDestinatario}
                        </p>
                        <p><span className="font-medium">Email:</span> {envio.pedido.emailDestinatario}</p>
                        <p><span className="font-medium">Teléfono:</span> {envio.pedido.telefonoDestinatario}</p>
                        <p>
                            <span className="font-medium">Dirección:</span>{' '}
                            {envio.pedido.direccion.calle} {envio.pedido.direccion.numero}
                        </p>
                        <p>
                            <span className="font-medium">Comuna:</span> {envio.pedido.direccion.comuna.nombre}
                            {envio.pedido.direccion.ciudad?.nombre && `, ${envio.pedido.direccion.ciudad.nombre}`}
                            {envio.pedido.direccion.comuna.region && `, ${envio.pedido.direccion.comuna.region.nombre}`}
                        </p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
