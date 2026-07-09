import { useEffect, useState } from 'react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Textarea from '@/components/ui/Textarea';
import Spinner from '@/components/ui/Spinner';

interface LoanTransitionCommentModalProps {
    isOpen: boolean;
    title: string;
    label: string;
    required: boolean;
    confirmLabel: string;
    confirmVariant: 'danger' | 'dark';
    submitting: boolean;
    onCancel: () => void;
    onConfirm: (comment: string) => void;
}

// Shared shell for Reject (reason required) and Return (correction notes optional) — same
// modal, different copy/requiredness/color so each still reads as its own deliberate action.
const LoanTransitionCommentModal = ({ isOpen, title, label, required, confirmLabel, confirmVariant, submitting, onCancel, onConfirm }: LoanTransitionCommentModalProps) => {
    const [comment, setComment] = useState('');

    useEffect(() => {
        if (isOpen) setComment('');
    }, [isOpen]);

    const canConfirm = !required || comment.trim().length > 0;

    return (
        <Modal isOpen={isOpen} onClose={onCancel} title={title} size="md">
            <Textarea
                id="transition-comment"
                label={`${label}${required ? ' *' : ' (optional)'}`}
                rows={4}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Type your notes here…"
            />
            <div className="mt-6 flex justify-end gap-2">
                <Button variant="outline-primary" onClick={onCancel} disabled={submitting}>
                    Cancel
                </Button>
                <Button variant={confirmVariant} onClick={() => onConfirm(comment.trim())} disabled={submitting || !canConfirm}>
                    {submitting && <Spinner className="h-4 w-4 shrink-0 ltr:mr-2 rtl:ml-2" />}
                    {confirmLabel}
                </Button>
            </div>
        </Modal>
    );
};

export default LoanTransitionCommentModal;
