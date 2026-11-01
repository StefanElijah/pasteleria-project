'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { Menu, X, Search, User, LogOut, ShieldCheck, ChevronDown, ChevronLeft } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useCartStore } from '@/store/cartStore';
import { useSearch } from '@/hooks/useSearch';
import api from '@/lib/axios';
import CartSheet from '@/components/cart/CartSheet';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
    SheetClose,
} from '@/components/ui/sheet';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Category } from '@/types';

export default function Navbar() {
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [showMobileCategories, setShowMobileCategories] = useState(false);
    const [categories, setCategories] = useState<Category[]>([]);
    const [isLoadingCategories, setIsLoadingCategories] = useState(true);
    const pathname = usePathname();
    const router = useRouter();
    const { user, logout } = useAuthStore();
    const { searchTerm, setSearchTerm, suggestions, isSearching } = useSearch();
    const searchRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const { data } = await api.get('/categories?activo=true');
                setCategories(data);
            } catch (error) {
                console.error('Error cargando categorías:', error);
            } finally {
                setIsLoadingCategories(false);
            }
        };
        fetchCategories();
    }, [pathname]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchTerm.trim()) {
            router.push(`/buscar?q=${encodeURIComponent(searchTerm.trim())}`);
            setSearchTerm('');
            setShowSuggestions(false);
        }
    };

    const handleSuggestionClick = (slug: string) => {
        router.push(`/products/${slug}`);
        setSearchTerm('');
        setShowSuggestions(false);
    };

    const handleLogout = () => {
        logout();
        router.push('/');
    };

    const navLinks = [
        { href: '/', label: 'Inicio' },
        { href: '/products', label: 'Productos' },
        { href: '/nosotros', label: 'Nosotros' },
        { href: '/contacto', label: 'Contacto' },
    ];

    const UserMenu = () => (
        user ? (
            <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center gap-2">
                        <User className="w-5 h-5" />
                        <span className="text-sm sm:text-base hidden sm:inline">{user.primerNombre} {user.primerApellido?.charAt(0)}.</span>
                        {user.rol === 'ADMIN' && <ShieldCheck className="w-4 h-4 text-red-600" />}
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    {user.rol === 'ADMIN' ? (
                        <DropdownMenuItem asChild>
                            <Link href="/admin">Panel Administrador</Link>
                        </DropdownMenuItem>
                    ) : (
                        <>
                            <DropdownMenuItem asChild>
                                <Link href="/account/profile">Mi Perfil</Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                                <Link href="/account/orders">Mis Pedidos</Link>
                            </DropdownMenuItem>
                        </>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                        <LogOut className="w-4 h-4 mr-2" /> Cerrar sesión
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        ) : (
            <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                        <User className="w-5 h-5" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Mi cuenta</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                        <Link href="/auth/login">Iniciar sesión</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                        <Link href="/auth/register">Registrarse</Link>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        )
    );

    return (
        <nav className="bg-white sticky top-0 z-50">
            <div className="container mx-auto px-3 sm:px-6 md:px-12 lg:px-20 xl:px-24 2xl:px-28">
                <div className="flex items-center h-[4.5rem] gap-3 sm:gap-4">
                    {/* Logo */}
                    <Link href="/" className="flex items-center shrink-0">
                        <img src="https://res.cloudinary.com/dtkxwlj5g/image/upload/q_auto/f_auto/v1780357889/logo_pasteleria_sin_fondo_asbb6y.png" alt="Logo" className="h-12 sm:h-14 lg:h-16 w-auto" />
                    </Link>

                    {/* Desktop Navigation (md+) */}
                    <div className="hidden md:flex items-center space-x-1 sm:space-x-3 lg:space-x-5 ml-4">
                        {navLinks.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={`px-3 py-1.5 rounded-md text-sm sm:text-base hover:text-rose-600 transition ${pathname === link.href ? 'text-rose-600 font-semibold' : ''}`}
                            >
                                {link.label}
                            </Link>
                        ))}
                        <DropdownMenu modal={false}>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="hover:text-rose-600 flex items-center gap-1 text-sm sm:text-base px-3 font-normal">
                                    Categorías <ChevronDown className="w-4 h-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" className="w-56">
                                <DropdownMenuLabel>Todas las categorías</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                {isLoadingCategories ? (
                                    <DropdownMenuItem disabled>Cargando...</DropdownMenuItem>
                                ) : categories.length === 0 ? (
                                    <DropdownMenuItem disabled>No hay categorías</DropdownMenuItem>
                                ) : (
                                    categories.map((cat) => (
                                        <DropdownMenuItem key={cat.id} asChild>
                                            <Link href={`/categoria/${cat.slug}`} className="cursor-pointer">
                                                {cat.nombre}
                                            </Link>
                                        </DropdownMenuItem>
                                    ))
                                )}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>

                    {/* Spacer */}
                    <div className="flex-1" />

                    {/* Desktop Search (md+) */}
                    <div className="hidden md:flex relative" ref={searchRef}>
                        <form onSubmit={handleSearchSubmit} className="flex">
                            <Input
                                type="search"
                                placeholder="Buscar productos..."
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value);
                                    if (e.target.value.length > 1) setShowSuggestions(true);
                                    else setShowSuggestions(false);
                                }}
                                className="w-40 lg:w-80 xl:w-96 rounded-r-none"
                            />
                            <Button type="submit" variant="default" className="rounded-l-none">
                                <Search className="w-4 h-4" />
                            </Button>
                        </form>
                        {showSuggestions && (
                            <div className="absolute top-full left-0 right-0 bg-white shadow-lg border rounded-md mt-1 z-50 max-h-80 overflow-y-auto min-w-[200px]">
                                {isSearching ? (
                                    <div className="p-2 text-center text-gray-500">Buscando...</div>
                                ) : suggestions.length > 0 ? (
                                    <>
                                        {suggestions.map((product) => (
                                            <div
                                                key={product.id}
                                                className="p-2 hover:bg-gray-100 cursor-pointer flex items-center gap-3"
                                                onClick={() => handleSuggestionClick(product.slug)}
                                            >
                                                <div className="relative w-10 h-10 rounded-md overflow-hidden bg-gray-100 shrink-0">
                                                    {(() => {
                                                        const img = product.imagenPrincipal || product.imagenes?.[0];
                                                        return img ? (
                                                            <Image
                                                                src={img}
                                                                alt={product.nombre}
                                                                fill
                                                                className="object-cover"
                                                                sizes="40px"
                                                            />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-gray-300">
                                                                <Search className="w-4 h-4" />
                                                            </div>
                                                        );
                                                    })()}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-sm font-medium truncate">{product.nombre}</p>
                                                    <p className="text-xs text-gray-500">${product.precio.toLocaleString()}</p>
                                                </div>
                                            </div>
                                        ))}
                                        <div
                                            className="p-2 text-center text-rose-600 hover:bg-gray-100 cursor-pointer"
                                            onClick={() => router.push(`/buscar?q=${encodeURIComponent(searchTerm)}`)}
                                        >
                                            Ver todos los resultados
                                        </div>
                                    </>
                                ) : searchTerm.length > 1 ? (
                                    <div className="p-2 text-center text-gray-500">No se encontraron productos</div>
                                ) : null}
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-2 ml-4 md:ml-6">
                        <CartSheet />
                        <UserMenu />
                    </div>

                    {/* Mobile menu drawer (md-) */}
                    <Sheet onOpenChange={(open) => { if (!open) setShowMobileCategories(false); }}>
                        <SheetTrigger asChild>
                            <button className="md:hidden p-2 rounded-md hover:bg-gray-100">
                                <Menu className="w-6 h-6" />
                            </button>
                        </SheetTrigger>
                        <SheetContent side="left" className="w-4/5 max-w-sm">
                            {showMobileCategories ? (
                                <>
                                    <SheetHeader>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="ghost"
                                                size="icon-sm"
                                                onClick={() => setShowMobileCategories(false)}
                                            >
                                                <ChevronLeft className="w-5 h-5" />
                                            </Button>
                                            <SheetTitle>Categorías</SheetTitle>
                                        </div>
                                    </SheetHeader>
                                    <div className="px-6 py-4 space-y-1">
                                        {isLoadingCategories ? (
                                            <p className="text-gray-500 text-sm py-2">Cargando...</p>
                                        ) : categories.length === 0 ? (
                                            <p className="text-gray-500 text-sm py-2">No hay categorías</p>
                                        ) : (
                                            categories.map((cat) => (
                                                <SheetClose key={cat.id} asChild>
                                                    <Link
                                                        href={`/categoria/${cat.slug}`}
                                                        className="block py-2.5 px-2 rounded-md text-sm hover:bg-accent transition-colors"
                                                    >
                                                        {cat.nombre}
                                                    </Link>
                                                </SheetClose>
                                            ))
                                        )}
                                    </div>
                                </>
                            ) : (
                                <>
                                    <SheetHeader>
                                        <SheetTitle>Menú</SheetTitle>
                                    </SheetHeader>
                                    <div className="px-6 py-4 space-y-1">
                                        <form onSubmit={handleSearchSubmit} className="flex mb-3">
                                            <Input
                                                type="search"
                                                placeholder="Buscar productos..."
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                className="flex-1 rounded-r-none"
                                            />
                                            <SheetClose asChild>
                                                <Button type="submit" className="rounded-l-none">
                                                    <Search className="w-4 h-4" />
                                                </Button>
                                            </SheetClose>
                                        </form>

                                        <div className="border-t pt-2 mb-2" />

                                        {navLinks.map((link) => (
                                            <SheetClose key={link.href} asChild>
                                                <Link
                                                    href={link.href}
                                                    className={`block py-2.5 px-2 rounded-md text-sm transition-colors hover:bg-accent ${pathname === link.href ? 'text-rose-600 font-semibold bg-accent' : ''}`}
                                                >
                                                    {link.label}
                                                </Link>
                                            </SheetClose>
                                        ))}

                                        <button
                                            onClick={() => setShowMobileCategories(true)}
                                            className="flex items-center justify-between w-full py-2.5 px-2 rounded-md text-sm transition-colors hover:bg-accent"
                                        >
                                            Categorías
                                            <ChevronDown className="w-4 h-4 -rotate-90" />
                                        </button>

                                        <div className="border-t pt-2 mt-2" />

                                        {user ? (
                                            <>
                                                <p className="py-2 px-2 text-xs text-muted-foreground">Hola, {user.primerNombre}</p>
                                                {user.rol === 'ADMIN' ? (
                                                    <SheetClose asChild>
                                                        <Link href="/admin" className="block py-2.5 px-2 rounded-md text-sm hover:bg-accent transition-colors">
                                                            Panel Administrador
                                                        </Link>
                                                    </SheetClose>
                                                ) : (
                                                    <>
                                                        <SheetClose asChild>
                                                            <Link href="/account/profile" className="block py-2.5 px-2 rounded-md text-sm hover:bg-accent transition-colors">
                                                                Mi Perfil
                                                            </Link>
                                                        </SheetClose>
                                                        <SheetClose asChild>
                                                            <Link href="/account/orders" className="block py-2.5 px-2 rounded-md text-sm hover:bg-accent transition-colors">
                                                                Mis Pedidos
                                                            </Link>
                                                        </SheetClose>
                                                    </>
                                                )}
                                                <button onClick={handleLogout} className="block w-full text-left py-2.5 px-2 rounded-md text-sm text-red-600 hover:bg-accent transition-colors">
                                                    Cerrar sesión
                                                </button>
                                            </>
                                        ) : (
                                            <>
                                                <SheetClose asChild>
                                                    <Link href="/auth/login" className="block py-2.5 px-2 rounded-md text-sm hover:bg-accent transition-colors">
                                                        Iniciar sesión
                                                    </Link>
                                                </SheetClose>
                                                <SheetClose asChild>
                                                    <Link href="/auth/register" className="block py-2.5 px-2 rounded-md text-sm hover:bg-accent transition-colors">
                                                        Registrarse
                                                    </Link>
                                                </SheetClose>
                                            </>
                                        )}
                                    </div>
                                </>
                            )}
                        </SheetContent>
                    </Sheet>
                </div>
            </div>
        </nav>
    );
}
