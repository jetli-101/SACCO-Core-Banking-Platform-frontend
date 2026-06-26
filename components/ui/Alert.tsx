import { ReactNode } from 'react';
import IconX from '@/components/Icon/IconX';
import IconInfoCircle from '@/components/Icon/IconInfoCircle';
import IconCircleCheck from '@/components/Icon/IconCircleCheck';
import IconInfoTriangle from '@/components/Icon/IconInfoTriangle';
import IconXCircle from '@/components/Icon/IconXCircle';

type Variant = 'info' | 'success' | 'warning' | 'danger';

interface AlertProps {
    variant?: Variant;
    title?: ReactNode;
    children: ReactNode;
    onClose?: () => void;
    className?: string;
}

// Written out as full class names (not built with template strings) so Tailwind's
// content scanner can detect and generate them.
const variantClasses: Record<Variant, string> = {
    info: 'bg-info-light text-info dark:bg-info dark:text-info-light',
    success: 'bg-success-light text-success dark:bg-success dark:text-success-light',
    warning: 'bg-warning-light text-warning dark:bg-warning dark:text-warning-light',
    danger: 'bg-danger-light text-danger dark:bg-danger dark:text-danger-light',
};

const variantIcons: Record<Variant, typeof IconInfoCircle> = {
    info: IconInfoCircle,
    success: IconCircleCheck,
    warning: IconInfoTriangle,
    danger: IconXCircle,
};

const Alert = ({ variant = 'info', title, children, onClose, className = '' }: AlertProps) => {
    const Icon = variantIcons[variant];

    return (
        <div className={`relative flex items-start rounded-md p-3.5 ${variantClasses[variant]} ${className}`.trim()}>
            <Icon className="mt-0.5 h-5 w-5 shrink-0 ltr:mr-2 rtl:ml-2" />
            <div className="flex-1">
                {title && <span className="block font-semibold">{title}</span>}
                <div className="text-sm">{children}</div>
            </div>
            {onClose && (
                <button type="button" className="ltr:ml-2 rtl:mr-2" onClick={onClose}>
                    <IconX className="h-5 w-5" />
                </button>
            )}
        </div>
    );
};

export default Alert;
