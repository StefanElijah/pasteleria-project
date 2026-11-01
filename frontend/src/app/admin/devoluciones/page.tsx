'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/axios';
import { Devolucion } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';

const ESTADO_STYLE: Record<string, string> = {
    SOLICITADA: 'bg-yellow-100 text-yellow-800',
    APROBADA: 'bg-blue-100 text-blue-800',
    RECHAZADA: 'bg-red-100 text-red-800',
    PROCESADA: 'bg-green-100 text-green-800',
};

export default function AdminDevolucionesPage() {
    const [devoluciones, setDevoluciones] = useState<Devolucion[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchAll = async () => {
        try {
            const { data } = await api.get('/devoluciones');
            setDevoluciones(data);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchAll(); }, []);

    const cambiarEstado = async (id: string, estado: 'APROBADA' | 'RECHAZADA') => {
        try {
            await api.patch(`/devoluciones/${id}/estado`, { estado });
            fetchAll();
        } catch (err: any) {
            toast.error(err?.response?.data?.message || 'No se pudo actualizar');
        }
    };

    const procesar = async (id: string) => {
        if (!confirm('¿Procesar la devolución? Se ajustarán puntos y cupón.')) return;
        try {
            const { data } = await api.post(`/devoluciones/${id}/procesar`);
            toast.success(`Procesada. Reembolso $${data.montoReembolsado?.toLocaleString()}`);
            fetchAll();
        } catch (err: any) {
            toast.error(err?.response?.data?.message || 'No se pudo procesar');
        }
    };

    const reponerStock = async (id: string) => {
        if (!confirm('¿Reponer el stock de los productos devueltos?')) return;
        try {
            await api.post(`/devoluciones/${id}/reponer-stock`);
            toast.success('Stock repuesto');
        } catch (err: any) {
            toast.error(err?.response?.data?.message || 'No se pudo reponer stock');
        }
    };

    return (
        <div>
            <h1 className="text-2xl font-bold mb-4">Devoluciones</h1>
            <Card>
                <CardContent className="pt-6">
                    {loading ? (
                        <p className="text-muted-foreground">Cargando...</p>
                    ) : devoluciones.length === 0 ? (
                        <p className="text-center py-8 text-muted-foreground">No hay devoluciones</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Pedido</TableHead>
                                        <TableHead>Cliente</TableHead>
                                        <TableHead>Ítems</TableHead>
                                        <TableHead>Monto</TableHead>
                                        <TableHead>Estado</TableHead>
                                        <TableHead>Acciones</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {devoluciones.map((d) => {
                                        const monto = d.items?.reduce((s, i) => s + i.subtotal, 0) || 0;
                                        return (
                                            <TableRow key={d.id}>
                                                <TableCell className="font-medium">{d.pedido?.numeroPedido || '—'}</TableCell>
                                                <TableCell className="text-sm">{d.pedido?.emailDestinatario || '—'}</TableCell>
                                                <TableCell className="text-sm">
                                                    {d.items?.map((i) => `${i.cantidad}× ${i.itemPedido?.nombre}`).join(', ')}
                                                </TableCell>
                                                <TableCell>${monto.toLocaleString()}</TableCell>
                                                <TableCell>
                                                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ESTADO_STYLE[d.estado]}`}>
                                                        {d.estado}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="space-x-1">
                                                    {d.estado === 'SOLICITADA' && (
                                                        <>
                                                            <Button size="sm" variant="outline" onClick={() => cambiarEstado(d.id, 'APROBADA')}>Aprobar</Button>
                                                            <Button size="sm" variant="outline" onClick={() => cambiarEstado(d.id, 'RECHAZADA')}>Rechazar</Button>
                                                        </>
                                                    )}
                                                    {(d.estado === 'APROBADA' || d.estado === 'SOLICITADA') && (
                                                        <Button size="sm" className="bg-rose-600 hover:bg-rose-700" onClick={() => procesar(d.id)}>Procesar</Button>
                                                    )}
                                                    {d.estado === 'PROCESADA' && (
                                                        <Button size="sm" variant="outline" onClick={() => reponerStock(d.id)}>Reponer stock</Button>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
