'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/axios';
import { Product } from '@/types';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { formatPrice } from '@/lib/format';

export default function AdminProductsPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [updatingId, setUpdatingId] = useState<string | null>(null);

    const fetchProducts = async () => {
        try {
            const { data } = await api.get('/products?activo=all');
            setProducts(data);
        } catch (error) {
            console.error('Error cargando productos:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    const toggleActive = async (id: string, currentActive: boolean) => {
        setUpdatingId(id);
        try {
            await api.patch(`/products/${id}`, { activo: !currentActive });
            await fetchProducts();
        } catch (error) {
            alert('Error al cambiar el estado del producto');
        } finally {
            setUpdatingId(null);
        }
    };

    const deactivateProduct = async (id: string) => {
        if (confirm('¿Desactivar este producto?')) {
            try {
                await api.delete(`/products/${id}`);
                fetchProducts();
            } catch (err: any) {
                const msg = err?.response?.data?.message || 'Error al desactivar el producto';
                alert(msg);
            }
        }
    };

    if (loading) {
        return <div className="p-6 text-center text-gray-500">Cargando productos...</div>;
    }

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Productos</h1>
                <Link href="/admin/products/new">
                    <Button>Nuevo Producto</Button>
                </Link>
            </div>

            <div className="bg-white rounded-lg shadow overflow-x-auto border border-gray-200">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="p-3 text-sm font-semibold text-gray-700">Nombre</th>
                            <th className="p-3 text-sm font-semibold text-gray-700">Slug</th>
                            <th className="p-3 text-sm font-semibold text-gray-700">Precio</th>
                            <th className="p-3 text-sm font-semibold text-gray-700">Categoría</th>
                            <th className="p-3 text-sm font-semibold text-gray-700">Estado</th>
                            <th className="p-3 text-sm font-semibold text-gray-700">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {products.map((product) => (
                            <tr
                                key={product.id}
                                className={`hover:bg-gray-50 transition-colors ${!product.activo ? 'bg-gray-50 opacity-75' : ''}`}
                            >
                                <td className="p-3 text-sm font-medium text-gray-900">{product.nombre}</td>
                                <td className="p-3 text-sm text-gray-500">{product.slug}</td>
                                <td className="p-3 text-sm font-medium text-gray-900">
                                    ${formatPrice(product.precio)}
                                </td>
                                <td className="p-3 text-sm text-gray-600">{product.categoria?.nombre || '—'}</td>
                                <td className="p-3">
                                    <Switch
                                        checked={product.activo}
                                        onCheckedChange={() => toggleActive(product.id, product.activo)}
                                        disabled={updatingId === product.id}
                                    />
                                </td>
                                <td className="p-3 space-x-2">
                                    <Link href={`/admin/products/${product.id}`}>
                                        <Button variant="outline" size="sm">Ver</Button>
                                    </Link>
                                    <Link href={`/admin/products/${product.id}?edit=true`}>
                                        <Button variant="outline" size="sm">Editar</Button>
                                    </Link>
                                    <Button variant="destructive" size="sm" onClick={() => deactivateProduct(product.id)}>
                                        Desactivar
                                    </Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
