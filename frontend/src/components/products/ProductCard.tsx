'use client';
import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Product } from '@/types';
import { useCartStore } from '@/store/cartStore';
import { Button } from '@/components/ui/button';
import { formatPrice } from '@/lib/format';

export default function ProductCard({ product }: { product: Product }) {
    const addItem = useCartStore((state) => state.addItem);
    const [isLoading, setIsLoading] = useState(false);

    const handleAddToCart = async () => {
        setIsLoading(true);
        try {
            await addItem(product.id, 1);
        } finally {
            setIsLoading(false);
        }
    };

    if (!product.activo) return null;

    return (
        <div className="group flex flex-col rounded-2xl overflow-hidden border shadow-sm hover:shadow-md transition-shadow bg-card h-full">
            <Link href={`/products/${product.slug}`} className="block overflow-hidden">
                <div className="relative h-48 sm:h-52 md:h-56 lg:h-56 xl:h-64 2xl:h-72 bg-muted overflow-hidden">
                    {(() => {
                        const imgSrc = product.imagenPrincipal || product.imagenes?.[0];
                        return imgSrc ? (
                            <Image
                                src={imgSrc}
                                alt={product.nombre}
                                fill
                                className="object-cover transition-transform duration-500 group-hover:scale-105"
                                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                                loading="eager"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-muted-foreground" />
                        );
                    })()}
                </div>
            </Link>
            <div className="flex flex-col flex-1 px-3 sm:px-4 py-3">
                <Link href={`/products/${product.slug}`}>
                    <h2 className="text-sm sm:text-base font-medium leading-snug hover:text-rose-600 transition-colors line-clamp-2 min-h-[2.5rem] sm:min-h-[3rem]">
                        {product.nombre}
                    </h2>
                </Link>
                <div className="mt-auto pt-2">
                    <p className="text-lg sm:text-xl font-bold text-rose-600">
                        ${formatPrice(product.precio)}
                    </p>
                    <Button
                        onClick={handleAddToCart}
                        disabled={isLoading}
                        variant="outline"
                        className="w-full mt-2"
                    >
                        {isLoading ? 'Agregando...' : 'Agregar al Carrito'}
                    </Button>
                </div>
            </div>
        </div>
    );
}
