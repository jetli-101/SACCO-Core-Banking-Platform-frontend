import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { dismissToast } from '@/store/slices/ui/toastSlice';
import Toast from './Toast';

// Mounted once in App.tsx — dispatch showToast(...) from anywhere (thunks, pages,
// components) to surface a message here, top-right, above everything.
const ToastContainer = () => {
    const dispatch = useAppDispatch();
    const toasts = useAppSelector((state) => state.toast.toasts);

    if (toasts.length === 0) return null;

    return (
        <div className="pointer-events-none fixed right-3 top-3 z-[100] flex w-full max-w-[260px] flex-col gap-2">
            {toasts.map((toast) => (
                <Toast key={toast.id} variant={toast.variant} message={toast.message} onDismiss={() => dispatch(dismissToast(toast.id))} />
            ))}
        </div>
    );
};

export default ToastContainer;
