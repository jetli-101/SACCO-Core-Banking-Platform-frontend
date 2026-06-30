import { ReactNode } from 'react';
import Modal from './Modal';
import Button from './Button';
import Spinner from './Spinner';

interface ConfirmModalProps {
    isOpen: boolean;
    title?: string;
    message: ReactNode;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: 'danger' | 'primary';
    loading?: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}

// Generic delete/confirm dialog used app-wide instead of the browser's native
// window.confirm, so destructive actions match the rest of the UI.
const ConfirmModal = ({ isOpen, title = 'Are you sure?', message, confirmLabel = 'Delete', cancelLabel = 'Cancel', variant = 'primary', loading = false, onConfirm, onCancel }: ConfirmModalProps) => {
    return (
        <Modal isOpen={isOpen} onClose={onCancel} title={title} size="sm">
            <div className="text-sm text-white-dark">{message}</div>
            <div className="mt-5 flex items-center justify-end gap-2">
                <Button type="button" variant="outline-dark" onClick={onCancel} disabled={loading}>
                    {cancelLabel}
                </Button>
                <Button type="button" variant={variant} onClick={onConfirm} disabled={loading}>
                    {loading && <Spinner className="h-4 w-4 shrink-0 ltr:mr-2 rtl:ml-2" />}
                    {loading ? 'Deleting…' : confirmLabel}
                </Button>
            </div>
        </Modal>
    );
};

export default ConfirmModal;
