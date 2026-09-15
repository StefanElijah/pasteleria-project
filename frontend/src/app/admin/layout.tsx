'use client';
import { useRequireAdmin } from '@/hooks/useAuth';
import { ReactNode, useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { IdleSessionMonitor } from '@/components/IdleSessionMonitor';
import { useAuthStore } from '@/store/authStore';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
    LayoutDashboard,
    Package,
    Tag,
    ShoppingCart,
    Truck,
    LogOut,
    ArrowLeft,
} from 'lucide-react';

function getInitials(user: any): string {
    const parts = [
        user?.primerNombre,
        user?.primerApellido,
    ].filter(Boolean);
    return parts.map((p: string) => p.charAt(0).toUpperCase()).join('') || '?';
}

function censorEmail(email: string): string {
    const [name, domain] = email.split('@');
    if (!domain) return email;
    const shortened = name.substring(0, 3) + '***';
    const domainParts = domain.split('.');
    const shortenedDomain = domainParts[0].substring(0, 1) + '***';
    return `${shortened}@${shortenedDomain}.${domainParts.slice(1).join('.')}`;
}

export default function AdminLayout({ children }: { children: ReactNode }) {
    const { isLoading } = useRequireAdmin();
    const pathname = usePathname();
    const user = useAuthStore((s) => s.user);
    const logout = useAuthStore((s) => s.logout);

    const navItems = useMemo(() => [
        { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
        { href: '/admin/products', label: 'Productos', icon: Package },
        { href: '/admin/categories', label: 'Categorías', icon: Tag },
        { href: '/admin/orders', label: 'Pedidos', icon: ShoppingCart },
        { href: '/admin/envios', label: 'Envíos', icon: Truck },
    ], []);

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="animate-spin h-8 w-8 border-4 border-rose-500 border-t-transparent rounded-full" />
            </div>
        );
    }

    const isActive = (href: string) => {
        if (href === '/admin') return pathname === '/admin';
        return pathname.startsWith(href);
    };

    const initials = getInitials(user);

    return (
        <IdleSessionMonitor>
            <div className="flex min-h-screen bg-background">
                <aside className="fixed top-0 left-0 z-40 h-screen w-64 border-r bg-card flex flex-col">
                    <div className="p-4 border-b">
                        <Link href="/admin" className="text-lg font-bold text-rose-600">
                            Mil Sabores
                        </Link>
                        <p className="text-xs text-muted-foreground mt-0.5">Panel de Administración</p>
                    </div>

                    <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
                        {navItems.map((item) => {
                            const active = isActive(item.href);
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${active
                                            ? 'bg-primary text-primary-foreground font-medium'
                                            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                                        }`}
                                >
                                    <item.icon className="h-4 w-4 shrink-0" />
                                    {item.label}
                                </Link>
                            );
                        })}
                    </nav>

                    {user && (
                        <div className="border-t p-3 space-y-3">
                            <div className="flex items-center gap-3">
                                <Avatar className="h-9 w-9">
                                    <AvatarFallback className="text-xs bg-rose-100 text-rose-700 font-medium">
                                        {initials}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-medium truncate">
                                        {user.primerNombre} {user.primerApellido}
                                    </p>
                                    <p className="text-xs text-muted-foreground truncate">
                                        {censorEmail(user.email)}
                                    </p>
                                    <span className="inline-block mt-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded bg-rose-100 text-rose-700">
                                        {user.rol === 'ADMIN' ? 'Administrador' : user.rol === 'MODERADOR' ? 'Moderador' : user.rol}
                                    </span>
                                </div>
                            </div>
                            <div className="flex flex-col gap-1">
                                <Link
                                    href="/"
                                    className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground px-1 py-1 rounded transition-colors"
                                >
                                    <ArrowLeft className="h-3.5 w-3.5" />
                                    Volver a la tienda
                                </Link>
                                <button
                                    onClick={logout}
                                    className="flex items-center gap-2 text-xs text-red-500 hover:text-red-600 px-1 py-1 rounded transition-colors"
                                >
                                    <LogOut className="h-3.5 w-3.5" />
                                    Cerrar sesión
                                </button>
                            </div>
                        </div>
                    )}
                </aside>

                <main className="flex-1 ml-64 p-6 min-h-screen">{children}</main>
            </div>
        </IdleSessionMonitor>
    );
}
