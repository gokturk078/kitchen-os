'use client';

import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import type { Allergens } from '@/types/database';
import { allergenMeta } from '@/types/database';
import {
    Wheat,
    Milk,
    Egg,
    Fish,
    Leaf,
    Circle,
    TreeDeciduous,
    Droplet,
    FlaskConical,
} from 'lucide-react';

// Icon mapping
const iconMap: Record<string, React.ElementType> = {
    Wheat: Wheat,
    Milk: Milk,
    Egg: Egg,
    Fish: Fish,
    Nut: Circle,
    Shell: Circle,
    Bean: Circle,
    TreeDeciduous: TreeDeciduous,
    Leaf: Leaf,
    Droplet: Droplet,
    Dot: Circle,
    FlaskConical: FlaskConical,
    Circle: Circle,
};

interface AllergenGridProps {
    value: Allergens;
    onChange: (allergens: Allergens) => void;
}

export function AllergenGrid({ value, onChange }: AllergenGridProps) {
    const handleToggle = (key: keyof Allergens) => {
        onChange({
            ...value,
            [key]: !value[key],
        });
    };

    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {(Object.keys(allergenMeta) as (keyof Allergens)[]).map((key) => {
                const meta = allergenMeta[key];
                const isActive = value[key];
                const Icon = iconMap[meta.icon] || Circle;

                return (
                    <button
                        key={key}
                        type="button"
                        onClick={() => handleToggle(key)}
                        className={cn(
                            'flex flex-col items-center justify-center gap-2 rounded-xl border-2 p-4 transition-all',
                            isActive
                                ? 'border-red-300 bg-red-50 text-red-700'
                                : 'border-neutral-200 bg-white text-neutral-500 hover:border-neutral-300 hover:bg-neutral-50'
                        )}
                    >
                        <Icon className={cn('h-6 w-6', isActive ? 'text-red-600' : 'text-neutral-400')} />
                        <span className={cn('text-xs font-semibold uppercase tracking-wide', isActive ? 'text-red-700' : 'text-neutral-500')}>
                            {meta.label}
                        </span>
                    </button>
                );
            })}
        </div>
    );
}
