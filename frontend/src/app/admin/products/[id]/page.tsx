'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import api from '@/lib/axios';
import { ProductForm } from '@/components/admin/ProductForm';
import { Product, Category } from '@/types';
import { Button } from '@/components/ui/button';
import { formatPrice } from '@/lib/format';

export default function ProductDetailPage() {
    const { id } = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();
    const editParam = searchParams.get('edit');

    const [product, setProduct] = useState<Product | null>(null);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(false);
    const [editMode, setEditMode] = useState(editParam === 'true');

    useEffect(() => {
        Promise.all([
            api.get(`/products/${id}`),
            api.get('/categories'),
        ]).then(([prodRes, catRes]) => {
            const productData = prodRes.data;
            productData.imagenes = productData.imagenes || [];
            productData.imagenPrincipal = productData.imagenPrincipal || '';
            setProduct(productData);
            setCategories(catRes.data);
        });
    }, [id]);

    useEffect(() => {
        setEditMode(editParam === 'true');
    }, [editParam]);

    const onSubmit = async (data: any) => {
        setLoading(true);
        try {
            const res = await api.patch(`/products/${id}`, data);
            const updated = res.data;
            updated.imagenes = updated.imagenes || [];
            updated.imagenPrincipal = updated.imagenPrincipal || '';
            setProduct(updated);
            setEditMode(false);
            router.replace(`/admin/products/${id}`);
        } catch {
            alert('Error al actualizar producto');
        } finally {
            setLoading(false);
        }
    };

    if (!product) return <div className="p-6 text-center">Cargando...</div>;

    const mainImage = product.imagenPrincipal || product.imagenes?.[0];
    const allImages = [
        ...(product.imagenPrincipal ? [product.imagenPrincipal] : []),
        ...(product.imagenes || []),
    ];

    if (editMode) {
        return (
            <div>
                <h1 className="text-2xl font-bold mb-4">Editar Producto</h1>
                <ProductForm
                    initialData={product}
                    categories={categories}
                    onSubmit={onSubmit}
                    isLoading={loading}
                    onCancel={() => {
                        setEditMode(false);
                        router.replace(`/admin/products/${id}`);
                    }}
                />
            </div>
        );
    }

    return (
        <div className="max-w-4xl">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">{product.nombre}</h1>
                <div className="space-x-2">
                    <Button onClick={() => {
                        setEditMode(true);
                        router.replace(`/admin/products/${id}?edit=true`);
                    }}>
                        Editar
                    </Button>
                    <Link href="/admin/products">
                        <Button variant="outline">Volver</Button>
                    </Link>
                </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
                <div>
                    {mainImage ? (
                        <div className="relative h-80 bg-gray-100 rounded-lg overflow-hidden">
                            <Image
                                src={mainImage}
                                alt={product.nombre}
                                fill
                                className="object-contain"
                                sizes="(max-width: 768px) 100vw, 50vw"
                            />
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-80 bg-gray-100 rounded-lg text-gray-400">
                            Sin imagen
                        </div>
                    )}
                    {allImages.length > 1 && (
                        <div className="flex gap-2 mt-3 overflow-x-auto">
                            {allImages.map((url, idx) => (
                                <div key={idx} className="relative w-20 h-20 bg-gray-100 rounded-md flex-shrink-0">
                                    <Image
                                        src={url}
                                        alt={`${product.nombre} ${idx + 1}`}
                                        fill
                                        className="object-cover rounded-md"
                                        sizes="80px"
                                    />
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="space-y-4">
                    <div>
                        <span className="text-sm text-gray-500">Nombre</span>
                        <p className="text-lg font-medium">{product.nombre}</p>
                    </div>
                    <div>
                        <span className="text-sm text-gray-500">Slug</span>
                        <p className="text-lg font-medium">{product.slug}</p>
                    </div>
                    <div>
                        <span className="text-sm text-gray-500">Precio</span>
                        <p className="text-xl font-bold text-rose-600">${formatPrice(product.precio)}</p>
                        {product.precioComparacion && (
                            <p className="text-gray-400 line-through">${formatPrice(product.precioComparacion)}</p>
                        )}
                    </div>
                    <div>
                        <span className="text-sm text-gray-500">Categoría</span>
                        <p className="text-lg font-medium">{product.categoria?.nombre || '—'}</p>
                    </div>
                    {product.descripcion && (
                        <div>
                            <span className="text-sm text-gray-500">Descripción</span>
                            <p className="text-gray-700">{product.descripcion}</p>
                        </div>
                    )}
                    <div className="flex gap-2 flex-wrap">
                        {product.novedad && (
                            <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-0.5 rounded">Novedad</span>
                        )}
                        {product.destacado && (
                            <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2 py-0.5 rounded">Destacado</span>
                        )}
                        {product.activo ? (
                            <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-0.5 rounded">Activo</span>
                        ) : (
                            <span className="bg-red-100 text-red-800 text-xs font-medium px-2 py-0.5 rounded">Inactivo</span>
                        )}
                    </div>
                    <div>
                        <span className="text-sm text-gray-500">Creado</span>
                        <p className="text-sm text-gray-700">{new Date(product.createdAt).toLocaleDateString('es-CL', { dateStyle: 'long' })}</p>
                    </div>
                    <div>
                        <span className="text-sm text-gray-500">Actualizado</span>
                        <p className="text-sm text-gray-700">{new Date(product.updatedAt).toLocaleDateString('es-CL', { dateStyle: 'long' })}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
