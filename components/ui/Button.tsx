import { ButtonHTMLAttributes, ReactNode } from 'react';
import Link from 'next/link';

type Color = 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info' | 'dark';
export type ButtonVariant = Color | `outline-${Color}` | 'ghost';

interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
    variant?: ButtonVariant;
    size?: 'sm' | 'md' | 'lg';
    fullWidth?: boolean;
    href?: string;
    children: ReactNode;
}

const sizeClasses: Record<'sm' | 'md' | 'lg', string> = {
    sm: 'btn-sm',
    md: '',
    lg: 'btn-lg',
};

// "ghost" skips the .btn base (padding/border/shadow) for bare icon-only or inline
// triggers — e.g. a password show/hide toggle inside an input — that shouldn't look
// like a full button.
const Button = ({ variant = 'primary', size = 'md', fullWidth = false, href, className = '', children, ...rest }: ButtonProps) => {
    const classes = variant === 'ghost' ? `inline-flex items-center ${className}`.trim() : `btn btn-${variant} ${sizeClasses[size]} ${fullWidth ? 'w-full' : ''} ${className}`.trim();

    if (href) {
        return (
            <Link href={href} className={classes}>
                {children}
            </Link>
        );
    }

    return (
        <button type="button" className={classes} {...rest}>
            {children}
        </button>
    );
};

export default Button;
