'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
    LayoutDashboard,
    Store,
    ChefHat,
    Package,
    Settings,
    UtensilsCrossed,
} from 'lucide-react';

const navigation = [
    { name: 'Kontrol Paneli', href: '/', icon: LayoutDashboard },
    { name: 'Restoranlar', href: '/outlets', icon: Store },
    { name: 'Malzemeler', href: '/ingredients', icon: Package },
    { name: 'Tarifler', href: '/recipes', icon: ChefHat },
    { name: 'Ayarlar', href: '/settings', icon: Settings },
];

export function Sidebar() {
    const pathname = usePathname();

    return (
        <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-neutral-200 bg-white">
            <div className="flex h-full flex-col">
                {/* Logo */}
                <div className="flex h-16 items-center gap-2 border-b border-neutral-200 px-6">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600">
                        <UtensilsCrossed className="h-5 w-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-lg font-semibold text-neutral-900">Kitchen OS</h1>
                        <p className="text-xs text-neutral-500">Maliyet Kontrolü</p>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 space-y-1 px-3 py-4">
                    {navigation.map((item) => {
                        const isActive =
                            pathname === item.href ||
                            (item.href !== '/' && pathname.startsWith(item.href));
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={cn(
                                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                                    isActive
                                        ? 'bg-blue-50 text-blue-700'
                                        : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
                                )}
                            >
                                <item.icon className={cn('h-5 w-5', isActive ? 'text-blue-600' : 'text-neutral-400')} />
                                {item.name}
                            </Link>
                        );
                    })}
                </nav>

                {/* User Profile */}
                <div className="border-t border-neutral-200 p-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-200">
                            <span className="text-sm font-medium text-neutral-600">KC</span>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="truncate text-sm font-medium text-neutral-900">Şef</p>
                            <p className="truncate text-xs text-neutral-500">Yönetici</p>
                        </div>
                    </div>
                </div>
            </div>
        </aside>
    );
}
