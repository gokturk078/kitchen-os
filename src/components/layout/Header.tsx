'use client';

import { Bell, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface HeaderProps {
    title: string;
    description?: string;
    breadcrumbs?: { label: string; href?: string }[];
    actions?: React.ReactNode;
}

export function Header({ title, description, breadcrumbs, actions }: HeaderProps) {
    return (
        <header className="sticky top-0 z-30 border-b border-neutral-200 bg-white">
            <div className="flex h-16 items-center justify-between px-6">
                {/* Left side - Breadcrumbs and Title */}
                <div className="flex items-center gap-4">
                    {breadcrumbs && breadcrumbs.length > 0 && (
                        <nav className="flex items-center gap-1 text-sm text-neutral-500">
                            {breadcrumbs.map((crumb, index) => (
                                <span key={index} className="flex items-center gap-1">
                                    {index > 0 && <span className="mx-1">/</span>}
                                    {crumb.href ? (
                                        <a href={crumb.href} className="hover:text-neutral-900 transition-colors">
                                            {crumb.label}
                                        </a>
                                    ) : (
                                        <span className="text-neutral-900 font-medium">{crumb.label}</span>
                                    )}
                                </span>
                            ))}
                        </nav>
                    )}
                </div>

                {/* Right side - Search and Actions */}
                <div className="flex items-center gap-4">
                    <div className="relative hidden md:block">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                        <Input
                            type="search"
                            placeholder="Ara..."
                            className="w-64 pl-10 bg-neutral-50 border-neutral-200 focus:bg-white"
                        />
                    </div>
                    <Button variant="ghost" size="icon" className="relative">
                        <Bell className="h-5 w-5 text-neutral-500" />
                        <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500" />
                    </Button>
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-600">
                        <span className="text-sm font-medium text-white">KC</span>
                    </div>
                </div>
            </div>

            {/* Page Title Section */}
            <div className="border-t border-neutral-100 bg-neutral-50/50 px-6 py-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold text-neutral-900">{title}</h1>
                        {description && (
                            <p className="mt-1 text-sm text-neutral-500">{description}</p>
                        )}
                    </div>
                    {actions && <div className="flex items-center gap-3">{actions}</div>}
                </div>
            </div>
        </header>
    );
}
