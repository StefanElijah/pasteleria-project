'use client';
import { useRequireAuth } from '@/hooks/useAuth';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Package, User as UserIcon, MapPin, Ticket, Coins } from 'lucide-react';

const NAV_ITEMS = [
    { label: 'Mis pedidos', href: '/account/orders', icon: Package },
    { label: 'Direcciones', href: '/account/addresses', icon: MapPin },
    { label: 'Mis cupones', href: '/account/cupones', icon: Ticket },
    { label: 'Mis puntos', href: '/account/puntos', icon: Coins },
    { label: 'Perfil', href: '/account/profile', icon: UserIcon },
];

export default function AccountLayout({ children }: { children: React.ReactNode }) {
    const { user, isLoading } = useRequireAuth();
    const pathname = usePathname();

    if (isLoading) {
        return <div className="min-h-screen flex items-center justify-center">Cargando...</div>;
    }

    if (!user) return null;

    return (
        <div className="max-w-6xl mx-auto px-4 sm:px-8 md:px-16 lg:px-24 xl:px-28 2xl:px-32 py-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                <aside className="md:col-span-1">
                    <nav className="space-y-1">
                        <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                            Mi cuenta
                        </p>
                        {NAV_ITEMS.map((item) => {
                            const Icon = item.icon;
                            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${isActive ? 'bg-rose-50 text-rose-600 font-medium' : 'text-gray-600 hover:bg-gray-100'}`}
                                >
                                    <Icon className="w-4 h-4" />
                                    {item.label}
                                </Link>
                            );
                        })}
                    </nav>
                </aside>
                <main className="md:col-span-3">{children}</main>
            </div>
        </div>
    );
}
