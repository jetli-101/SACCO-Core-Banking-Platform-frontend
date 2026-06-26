import { ReactNode } from 'react';

type Color = 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info' | 'dark';

interface BadgeProps {
    variant?: Color;
    outline?: boolean;
    children: ReactNode;
    className?: string;
}

// Written out as full class names (not built with template strings) so Tailwind's
// content scanner can detect and generate them.
const solidColorClasses: Record<Color, string> = {
    primary: 'bg-primary',
    secondary: 'bg-secondary',
    success: 'bg-success',
    danger: 'bg-danger',
    warning: 'bg-warning',
    info: 'bg-info',
    dark: 'bg-dark',
};

const outlineColorClasses: Record<Color, string> = {
    primary: 'badge-outline-primary',
    secondary: 'badge-outline-secondary',
    success: 'badge-outline-success',
    danger: 'badge-outline-danger',
    warning: 'badge-outline-warning',
    info: 'badge-outline-info',
    dark: 'badge-outline-dark',
};

const Badge = ({ variant = 'primary', outline = false, children, className = '' }: BadgeProps) => {
    const colorClasses = outline ? outlineColorClasses[variant] : `${solidColorClasses[variant]} text-white shadow-md`;

    return <span className={`badge ${colorClasses} ${className}`.trim()}>{children}</span>;
};

export default Badge;
