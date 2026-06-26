import { ButtonHTMLAttributes, ReactNode } from 'react';
import Link from 'next/link';

type Color = 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info' | 'dark';
type ButtonVariant = Color | `outline-${Color}`;

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

const Button = ({ variant = 'primary', size = 'md', fullWidth = false, href, className = '', children, ...rest }: ButtonProps) => {
    const classes = `btn btn-${variant} ${sizeClasses[size]} ${fullWidth ? 'w-full' : ''} ${className}`.trim();

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
