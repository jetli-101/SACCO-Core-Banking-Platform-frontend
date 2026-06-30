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

const VARIANT_LABEL: Record<ToastVariant, string> = {
    success: 'Success',
    danger: 'Error',
    warning: 'Warning',
    info: 'Info',
};

// All variants share the app's primary orange theme color instead of per-variant
// red/green/yellow — only the icon glyph and label text differ to convey meaning.
const Toast = ({ variant, message, duration = 2200, onDismiss }: ToastProps) => {
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
        <div className="pointer-events-auto w-full overflow-hidden rounded-md border-l-[3px] border-primary bg-white shadow-[0_5px_20px_rgba(0,0,0,0.1)] dark:bg-[#1b2e4b]">
            <div className="flex items-center gap-2.5 px-3 py-3">
                <span className="grid h-7 w-7 shrink-0 place-content-center rounded-full bg-primary-light text-primary dark:bg-primary dark:text-primary-light">
                    <Icon className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">{VARIANT_LABEL[variant]}</p>
                    <p className="truncate text-xs text-white-dark">{message}</p>
                </div>
                <button type="button" className="shrink-0 text-white-dark hover:text-dark dark:hover:text-white-light" onClick={onDismiss} aria-label="Dismiss">
                    <IconX className="h-4 w-4" />
                </button>
            </div>
            <div className="h-0.5 w-full bg-white-light/40 dark:bg-white/10">
                <div className="h-full bg-primary transition-[width] ease-linear" style={{ width: shrink ? '0%' : '100%', transitionDuration: `${duration}ms` }} />
            </div>
        </div>
    );
};

export default Toast;
