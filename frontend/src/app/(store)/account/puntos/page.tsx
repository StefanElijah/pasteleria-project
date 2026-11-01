'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/axios';
import { MovimientoPuntos, Promocion } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Coins, TrendingUp } from 'lucide-react';

interface PuntosData {
    saldo: number;
    deuda: number;
    nivel: { nombre: string; gasto: number; bono: number };
    movimientos: MovimientoPuntos[];
    promosActivas: Promocion[];
}

const TIPO_LABEL: Record<string, string> = {
    BONO_BIENVENIDA: 'Bono de bienvenida',
    COMPRA: 'Compra',
    CANJE: 'Canje',
    REVERSION: 'Reversión',
    EXPIRACION: 'Expiración',
    AJUSTE: 'Ajuste',
};

export default function PuntosPage() {
    const [data, setData] = useState<PuntosData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/users/puntos')
            .then(({ data }) => setData(data))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <p className="text-muted-foreground">Cargando...</p>;
    if (!data) return null;

    return (
        <div className="space-y-6">
            <h2 className="text-xl font-bold">Mis puntos</h2>

            <div className="grid sm:grid-cols-3 gap-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                            <Coins className="w-4 h-4" /> Saldo disponible
                        </div>
                        <p className="text-2xl font-bold text-rose-600">{data.saldo.toLocaleString()} pts</p>
                        <p className="text-xs text-gray-500 mt-1">Equivale a ${data.saldo.toLocaleString()}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                            <TrendingUp className="w-4 h-4" /> Nivel
                        </div>
                        <p className="text-2xl font-bold">{data.nivel?.nombre}</p>
                        <p className="text-xs text-gray-500 mt-1">Gasto últimos 12 meses: ${data.nivel?.gasto?.toLocaleString()}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-sm text-gray-500 mb-1">¿Cómo funciona?</div>
                        <p className="text-xs text-gray-500">
                            1 punto por cada $100. 1 punto = $1 al canjear. Mínimo 500 puntos y hasta 50% del pedido.
                        </p>
                    </CardContent>
                </Card>
            </div>

            {data.deuda < 0 && (
                <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-lg p-4 text-sm">
                    Tienes un saldo en compensación de <strong>{data.deuda.toLocaleString()} pts</strong> por una devolución.
                    Se descontará automáticamente de tus próximos puntos hasta saldar la deuda.
                </div>
            )}

            {data.promosActivas?.length > 0 && (
                <Card>
                    <CardHeader><CardTitle className="text-base">Promociones activas</CardTitle></CardHeader>
                    <CardContent className="space-y-2">
                        {data.promosActivas.map((p) => (
                            <div key={p.id} className="flex items-center justify-between text-sm border-b last:border-0 pb-2">
                                <span>{p.nombre}</span>
                                <span className="font-medium text-rose-600">+{p.bonoPorcentaje}% puntos</span>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            )}

            <Card>
                <CardHeader><CardTitle className="text-base">Historial</CardTitle></CardHeader>
                <CardContent>
                    {data.movimientos.length === 0 ? (
                        <p className="text-sm text-gray-500">Aún no tienes movimientos.</p>
                    ) : (
                        <div className="space-y-2">
                            {data.movimientos.map((m) => (
                                <div key={m.id} className="flex items-center justify-between text-sm border-b last:border-0 pb-2">
                                    <div>
                                        <p className="font-medium">{m.descripcion || TIPO_LABEL[m.tipo] || m.tipo}</p>
                                        <p className="text-xs text-gray-400">{new Date(m.createdAt).toLocaleDateString('es-CL')}</p>
                                    </div>
                                    <span className={`font-medium ${m.puntos >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                                        {m.puntos >= 0 ? '+' : ''}{m.puntos.toLocaleString()}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
