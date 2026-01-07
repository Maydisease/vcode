import { ReactNode } from 'react';
import './EmptyState.css';

interface EmptyStateProps {
    icon?: ReactNode;
    title: string;
    description?: string;
    action?: ReactNode;
    size?: 'sm' | 'md' | 'lg';
}

export function EmptyState({
    icon,
    title,
    description,
    action,
    size = 'md'
}: EmptyStateProps) {
    return (
        <div className={`empty-state empty-state--${size}`}>
            {icon && (
                <div className="empty-state__icon">
                    {icon}
                </div>
            )}
            <h3 className="empty-state__title">{title}</h3>
            {description && (
                <p className="empty-state__description">{description}</p>
            )}
            {action && (
                <div className="empty-state__action">
                    {action}
                </div>
            )}
        </div>
    );
}
