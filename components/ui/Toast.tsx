import { useEffect, useState } from 'react';
import IconCircleCheck from '@/components/Icon/IconCircleCheck';
import IconXCircle from '@/components/Icon/IconXCircle';
import IconInfoTriangle from '@/components/Icon/IconInfoTriangle';
import IconInfoCircle from '@/components/Icon/IconInfoCircle';
import IconX from '@/components/Icon/IconX';
import { ToastVariant } from '@/store/slices/ui/toastSlice';

interface ToastProps {
    variant: ToastVariant;
    message: string;
    duration?: number;
    onDismiss: () => void;
}

const VARIANT_ICON: Record<ToastVariant, typeof IconCircleCheck> = {
    success: IconCircleCheck,
    danger: IconXCircle,
    warning: IconInfoTriangle,
    info: IconInfoCircle,
};

const VARIANT_ICON_CLASSES: Record<ToastVariant, string> = {
    success: 'bg-success-light text-success dark:bg-success dark:text-success-light',
    danger: 'bg-danger-light text-danger dark:bg-danger dark:text-danger-light',
    warning: 'bg-warning-light text-warning dark:bg-warning dark:text-warning-light',
    info: 'bg-info-light text-info dark:bg-info dark:text-info-light',
};

const VARIANT_LABEL: Record<ToastVariant, string> = {
    success: 'Success',
    danger: 'Error',
    warning: 'Warning',
    info: 'Info',
};

const VARIANT_BAR_CLASSES: Record<ToastVariant, string> = {
    success: 'bg-success',
    danger: 'bg-danger',
    warning: 'bg-warning',
    info: 'bg-info',
};

const Toast = ({ variant, message, duration = 4000, onDismiss }: ToastProps) => {
    const Icon = VARIANT_ICON[variant];
    const [shrink, setShrink] = useState(false);

    useEffect(() => {
        const startBar = requestAnimationFrame(() => setShrink(true));
        const dismissTimer = setTimeout(onDismiss, duration);
        return () => {
            cancelAnimationFrame(startBar);
            clearTimeout(dismissTimer);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div className="pointer-events-auto w-full overflow-hidden rounded-lg bg-white shadow-[0_5px_20px_rgba(0,0,0,0.1)] dark:bg-[#1b2e4b]">
            <div className="flex items-center gap-3 px-4 py-3">
                <span className={`grid h-8 w-8 shrink-0 place-content-center rounded-full ${VARIANT_ICON_CLASSES[variant]}`}>
                    <Icon className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                    <p className="font-semibold">{VARIANT_LABEL[variant]}</p>
                    <p className="truncate text-sm text-white-dark">{message}</p>
                </div>
                <button type="button" className="shrink-0 text-white-dark hover:text-dark dark:hover:text-white-light" onClick={onDismiss} aria-label="Dismiss">
                    <IconX className="h-4 w-4" />
                </button>
            </div>
            <div className="h-1 w-full bg-white-light/40 dark:bg-white/10">
                <div
                    className={`h-full ${VARIANT_BAR_CLASSES[variant]} transition-[width] ease-linear`}
                    style={{ width: shrink ? '0%' : '100%', transitionDuration: `${duration}ms` }}
                />
            </div>
        </div>
    );
};

export default Toast;
