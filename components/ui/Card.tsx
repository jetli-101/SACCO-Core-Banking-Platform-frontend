import { ReactNode } from 'react';

interface CardProps {
    title?: ReactNode;
    actions?: ReactNode;
    footer?: ReactNode;
    noPadding?: boolean;
    className?: string;
    children: ReactNode;
}

const Card = ({ title, actions, footer, noPadding = false, className = '', children }: CardProps) => {
    return (
        <div className={`panel ${noPadding ? 'p-0' : ''} ${className}`.trim()}>
            {(title || actions) && (
                <div className="mb-5 flex items-center justify-between dark:text-white-light">
                    {title && <h5 className="text-lg font-semibold">{title}</h5>}
                    {actions}
                </div>
            )}
            {children}
            {footer && <div className="mt-5 border-t border-white-light pt-5 dark:border-white/10">{footer}</div>}
        </div>
    );
};

export default Card;
