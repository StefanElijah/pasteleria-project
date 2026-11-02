'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/axios';
import { DashboardStats, Envio } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { OrderStatusBadge } from '@/components/admin/OrderStatusBadge';
import {
    Package, ShoppingCart, Truck,
    TrendingUp, ClipboardList, Tags,
} from 'lucide-react';
import DistribucionEnviosChart from '@/components/admin/DistribucionEnviosChart';
import DistribucionPedidosChart from '@/components/admin/DistribucionPedidosChart';
import TopReservadosChart from '@/components/admin/TopReservadosChart';
import ComparacionAnualChart from '@/components/admin/ComparacionAnualChart';
import VentasPorCategoriaChart from '@/components/admin/VentasPorCategoriaChart';
import VentasPorPlataformaChart from '@/components/admin/VentasPorPlataformaChart';
import VentasPorMetodoPagoChart from '@/components/admin/VentasPorMetodoPagoChart';

export default function AdminDashboard() {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [envios, setEnvios] = useState<Envio[]>([]);

    const cargarDatos = () => {
        setLoading(true);
        setError(null);
        Promise.all([
            api.get('/stats/dashboard'),
            api.get('/envios'),
        ])
            .then(([statsRes, enviosRes]) => {
                setStats(statsRes.data);
                setEnvios(Array.isArray(enviosRes.data) ? enviosRes.data : enviosRes.data.content || []);
            })
            .catch((err) => {
                console.error('Error al cargar datos del dashboard:', err);
                setError('No se pudieron cargar los datos. Verifica tu conexión e intenta nuevamente.');
            })
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        cargarDatos();
    }, []);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin h-8 w-8 border-4 border-rose-500 border-t-transparent rounded-full" />
            </div>
        );
    }

    if (error || !stats) {
        return (
            <div className="text-center py-12">
                <p className="text-red-500 mb-4">{error || 'Error desconocido'}</p>
                <Button onClick={cargarDatos} variant="outline">Reintentar</Button>
            </div>
        );
    }

    const { kpis } = stats;

    return (
        <div className="space-y-8 pb-8">
            <h1 className="text-2xl font-bold">Dashboard</h1>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard
                    title="Productos"
                    value={kpis.totalProducts}
                    subtitle="Activos en catálogo"
                    icon={<Package className="h-4 w-4 text-muted-foreground" />}
                />
                <MetricCard
                    title="Ingresos"
                    value={`$${kpis.totalRevenue.toLocaleString('es-CL')}`}
                    subtitle="Total facturado"
                    icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />}
                />
                <MetricCard
                    title="Pedidos"
                    value={kpis.totalOrders}
                    subtitle={`${kpis.pendingOrders} pendientes`}
                    icon={<ClipboardList className="h-4 w-4 text-muted-foreground" />}
                />
                <MetricCard
                    title="Envíos"
                    value={kpis.totalEnvios}
                    subtitle={`${kpis.totalCategories} categorías`}
                    icon={<Truck className="h-4 w-4 text-muted-foreground" />}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <DistribucionEnviosChart envios={envios} />
                <DistribucionPedidosChart pedidos={stats.ordersByStatus.map(o => ({ ...o, createdAt: '' }))} />
            </div>

            <VentasPorPlataformaChart revenueByPlatform={stats.revenueByPlatform} />

            <VentasPorMetodoPagoChart revenueByPaymentMethod={stats.revenueByPaymentMethod} />

            <ComparacionAnualChart monthlyComparison={stats.monthlyComparison} />

            <VentasPorCategoriaChart revenueByCategory={stats.revenueByCategory} />

            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Productos más reservados</CardTitle>
                </CardHeader>
                <CardContent>
                    <TopReservadosChart products={stats.topReservedProducts} />
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-base">Últimos pedidos</CardTitle>
                    <Link href="/admin/orders">
                        <Button variant="outline" size="sm">Ver todos</Button>
                    </Link>
                </CardHeader>
                <CardContent>
                    {stats.recentOrders.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No hay pedidos registrados.</p>
                    ) : (
                        <div className="divide-y">
                            {stats.recentOrders.map((order) => (
                                <div
                                    key={order.id}
                                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-3"
                                >
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium truncate">{order.numeroPedido}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {new Date(order.createdAt).toLocaleDateString('es-CL')}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-3 shrink-0">
                                        <OrderStatusBadge status={order.estado} />
                                        <span className="text-sm font-semibold tabular-nums">
                                            ${order.total.toLocaleString('es-CL')}
                                        </span>
                                        <Link href={`/admin/orders/${order.id}`}>
                                            <Button variant="ghost" size="sm">Ver</Button>
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

function MetricCard({
    title,
    value,
    subtitle,
    icon,
}: {
    title: string;
    value: string | number;
    subtitle: string;
    icon: React.ReactNode;
}) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
                {icon}
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold tabular-nums">{value}</div>
                <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
            </CardContent>
        </Card>
    );
}
