// app/products/[slug]/page.tsx
'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import api from '@/lib/axios';
import { Product } from '@/types';
import Image from 'next/image';
import { useCartStore } from '@/store/cartStore';
import { useBreadcrumbStore } from '@/store/breadcrumbStore';
import { BreadcrumbNav } from '@/components/ui/breadcrumb-nav';
import { Button } from '@/components/ui/button';
import { formatPrice } from '@/lib/format';

export default function ProductDetailPage() {
    const { slug } = useParams();
    const [product, setProduct] = useState<Product | null>(null);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [quantity, setQuantity] = useState(1);
    const [loading, setLoading] = useState(true);
    const addItem = useCartStore((state) => state.addItem);
    const [isAdding, setIsAdding] = useState(false);
    const { setLastLabel, setMiddle, clearAll } = useBreadcrumbStore();

    useEffect(() => {
        if (slug) {
            api.get(`/products/slug/${slug}`)
                .then(({ data }) => {
                    setProduct(data);
                    setSelectedImage(data.imagenPrincipal || data.imagenes?.[0] || null);
                    setLastLabel(data.nombre);
                    if (data.categoria) {
                        setMiddle(data.categoria.nombre, `/categoria/${data.categoria.slug}`);
                    }
                })
                .finally(() => setLoading(false));
        }
        return () => clearAll();
    }, [slug, setLastLabel, setMiddle, clearAll]);

    const handleAddToCart = async () => {
        if (!product) return;
        setIsAdding(true);
        try {
            await addItem(product.id, quantity);
        } finally {
            setIsAdding(false);
        }
    };

    const mainImage = selectedImage || product?.imagenPrincipal || product?.imagenes?.[0];
    const allImages = [
        ...(product?.imagenPrincipal ? [product.imagenPrincipal] : []),
        ...(product?.imagenes || []),
    ];

    if (loading) return <div className="text-center py-10">Cargando...</div>;
    if (!product) return <div className="text-center py-10">Producto no encontrado</div>;

    return (
        <div className="container mx-auto px-4 sm:px-8 md:px-16 lg:px-24 xl:px-28 2xl:px-32 py-8">
            <BreadcrumbNav />
            <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
                {mainImage ? (
                    <>
                        <div className="relative h-96 bg-gray-100 rounded-lg">
                            <Image
                                src={mainImage}
                                alt={product.nombre}
                                fill
                                className="object-contain"
                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            />
                        </div>
                        {allImages.length > 1 && (
                            <div className="flex gap-2 overflow-x-auto">
                                {allImages.map((url, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setSelectedImage(url)}
                                        className={`relative w-24 h-24 bg-gray-100 rounded-md border-2 flex-shrink-0 transition-colors ${
                                            url === mainImage
                                                ? 'border-rose-500'
                                                : 'border-transparent hover:border-rose-300'
                                        }`}
                                    >
                                        <Image
                                            src={url}
                                            alt={`${product.nombre} ${idx + 1}`}
                                            fill
                                            className="object-cover rounded-md"
                                            sizes="96px"
                                        />
                                    </button>
                                ))}
                            </div>
                        )}
                    </>
                ) : (
                    <div className="flex items-center justify-center h-96 bg-gray-100 rounded-lg">
                        Sin imagen
                    </div>
                )}
            </div>

            <div>
                <div className="flex items-center gap-3 mb-4">
                    <h1 className="text-3xl font-bold">{product.nombre}</h1>
                </div>
                <p className="text-2xl text-rose-600 mt-2">${formatPrice(product.precio)}</p>
                {product.precioComparacion && (
                    <p className="text-gray-400 line-through">
                        ${formatPrice(product.precioComparacion)}
                    </p>
                )}
                <p className="text-gray-600 mt-4">{product.descripcion}</p>
                <div className="mt-6 flex items-center gap-4">
                    <div className="flex items-center border rounded">
                        <button
                            onClick={() => setQuantity(Math.max(1, quantity - 1))}
                            className="px-3 py-1 border-r"
                        >
                            -
                        </button>
                        <span className="px-4 py-1">{quantity}</span>
                        <button
                            onClick={() => setQuantity(quantity + 1)}
                            className="px-3 py-1 border-l"
                        >
                            +
                        </button>
                    </div>
                    <Button onClick={handleAddToCart} disabled={isAdding}>
                        {isAdding ? 'Agregando...' : 'Agregar al Carrito'}
                    </Button>
                </div>
            </div>
        </div>
        </div>
    );
}
