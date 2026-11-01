'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/axios';
import { Descuento } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Ticket } from 'lucide-react';

export default function CuponesPage() {
    const [cupones, setCupones] = useState<Descuento[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/users/cupones')
            .then(({ data }) => setCupones(data))
            .finally(() => setLoading(false));
    }, []);

    const descripcion = (c: Descuento) => {
        if (c.tipo === 'PORCENTAJE') return `${c.valor}% de descuento`;
        if (c.tipo === 'MONTO_FIJO') return `$${c.valor.toLocaleString()} de descuento`;
        return 'Envío gratis';
    };

    if (loading) return <p className="text-muted-foreground">Cargando...</p>;

    return (
        <div>
            <h2 className="text-xl font-bold mb-6">Mis cupones</h2>
            {cupones.length === 0 ? (
                <div className="text-center py-12">
                    <Ticket className="w-14 h-14 mx-auto text-gray-300 mb-3" />
                    <p className="text-gray-500">No tienes cupones disponibles.</p>
                </div>
            ) : (
                <div className="grid sm:grid-cols-2 gap-4">
                    {cupones.map((c) => (
                        <Card key={c.id} className="border-rose-200">
                            <CardContent className="pt-6">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="font-bold text-rose-600">{descripcion(c)}</span>
                                    {!c.usuarioId && (
                                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">Público</span>
                                    )}
                                </div>
                                <p className="text-sm text-gray-600 mb-1">{c.nombre}</p>
                                {c.codigo && (
                                    <p className="font-mono text-sm bg-gray-50 border rounded px-2 py-1 inline-block">{c.codigo}</p>
                                )}
                                <div className="text-xs text-gray-500 mt-2 space-y-0.5">
                                    {c.valorMinimoPedido ? <p>Pedido mínimo: ${c.valorMinimoPedido.toLocaleString()}</p> : null}
                                    {c.fechaFin ? <p>Válido hasta {new Date(c.fechaFin).toLocaleDateString('es-CL')}</p> : null}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
