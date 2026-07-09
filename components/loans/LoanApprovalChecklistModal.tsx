import { useEffect, useState } from 'react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Checkbox from '@/components/ui/Checkbox';
import Spinner from '@/components/ui/Spinner';
import type { WorkflowAvailableTransition } from '@/pages/pages/interfaceRegistry';

interface LoanApprovalChecklistModalProps {
    isOpen: boolean;
    checklistItems: WorkflowAvailableTransition['checklistItems'];
    submitting: boolean;
    onCancel: () => void;
    onConfirm: (completedChecklistItemIds: string[]) => void;
}

// Approve requires every required checklist item ticked first — "Confirm Approval" stays
// disabled until they are, so a reviewer can't approve on autopilot. Driven entirely by
// whatever checklist the transition actually carries, not hardcoded to these four items.
const LoanApprovalChecklistModal = ({ isOpen, checklistItems, submitting, onCancel, onConfirm }: LoanApprovalChecklistModalProps) => {
    const [checked, setChecked] = useState<Record<string, boolean>>({});

    useEffect(() => {
        if (isOpen) setChecked({});
    }, [isOpen]);

    const requiredItems = checklistItems.filter((item) => item.required);
    const allRequiredChecked = requiredItems.every((item) => checked[item.id]);

    return (
        <Modal isOpen={isOpen} onClose={onCancel} title="Approve Loan Application" size="md">
            <p className="mb-4 text-sm text-white-dark">Confirm every item below before approving — this unlocks disbursement for the applicant.</p>
            <div className="space-y-3">
                {checklistItems.length === 0 ? (
                    <p className="text-sm text-white-dark">No checklist configured for this transition.</p>
                ) : (
                    checklistItems.map((item) => (
                        <Checkbox
                            key={item.id}
                            id={`approval-checklist-${item.id}`}
                            checked={!!checked[item.id]}
                            onChange={(e) => setChecked((prev) => ({ ...prev, [item.id]: e.target.checked }))}
                            label={`${item.itemText}${item.required ? '' : ' (optional)'}`}
                        />
                    ))
                )}
            </div>
            <div className="mt-6 flex justify-end gap-2">
                <Button variant="outline-primary" onClick={onCancel} disabled={submitting}>
                    Cancel
                </Button>
                <Button variant="success" onClick={() => onConfirm(Object.keys(checked).filter((id) => checked[id]))} disabled={submitting || !allRequiredChecked}>
                    {submitting && <Spinner className="h-4 w-4 shrink-0 ltr:mr-2 rtl:ml-2" />}
                    Confirm Approval
                </Button>
            </div>
        </Modal>
    );
};

export default LoanApprovalChecklistModal;
