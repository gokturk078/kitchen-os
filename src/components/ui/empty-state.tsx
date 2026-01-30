import { Button } from '@/components/ui/button';
import { LucideIcon, Plus } from 'lucide-react';

interface EmptyStateProps {
    icon?: LucideIcon;
    title: string;
    description: string;
    actionLabel?: string;
    onAction?: () => void;
    actionHref?: string;
    children?: React.ReactNode;
}

export function EmptyState({
    icon: Icon,
    title,
    description,
    actionLabel,
    onAction,
    actionHref,
    children,
}: EmptyStateProps) {
    const ActionButton = () => (
        <Button
            onClick={onAction}
            className="mt-4 bg-blue-600 hover:bg-blue-700 text-white"
        >
            <Plus className="mr-2 h-4 w-4" />
            {actionLabel}
        </Button>
    );

    return (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-neutral-200 bg-neutral-50/50 py-16 px-6 text-center">
            {Icon && (
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-neutral-100">
                    <Icon className="h-7 w-7 text-neutral-400" />
                </div>
            )}
            <h3 className="text-lg font-semibold text-neutral-900">{title}</h3>
            <p className="mt-1 max-w-sm text-sm text-neutral-500">{description}</p>
            {children ? (
                <div className="mt-4">{children}</div>
            ) : actionLabel && (
                actionHref ? (
                    <a href={actionHref}>
                        <ActionButton />
                    </a>
                ) : (
                    <ActionButton />
                )
            )}
        </div>
    );
}
