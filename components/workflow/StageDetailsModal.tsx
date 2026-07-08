import type { ReactNode } from 'react';
import type { WorkflowInstance } from '@/store/slices/workflows/workflowInstancesSlice';
import type { WorkflowStage } from '@/store/slices/workflows/workflowStagesSlice';
import { assignedGroupLabel, dueLabel, enumLabel, isOverdue, nextStageFor, timeInTray } from '@/utils/workflowStage';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import WorkflowStageProgress from '@/components/workflow/WorkflowStageProgress';
import IconSend from '@/components/Icon/IconSend';

interface StageDetailsModalProps {
    isOpen: boolean;
    instance: WorkflowInstance | null;
    stages: WorkflowStage[];
    onClose: () => void;
    onForward: () => void;
}

const Row = ({ label, value, valueClassName = '' }: { label: string; value: ReactNode; valueClassName?: string }) => (
    <div className="flex items-center justify-between gap-2">
        <span className="text-white-dark">{label}:</span>
        <span className={`font-medium ${valueClassName}`.trim()}>{value}</span>
    </div>
);

// Quick-action preview shown before the row-level "Forward" action opens the full Forward
// Process form — read-only context (where this instance is, where it's headed next) so a
// reviewer isn't acting blind.
const StageDetailsModal = ({ isOpen, instance, stages, onClose, onForward }: StageDetailsModalProps) => {
    if (!instance) return null;

    const currentStage = stages.find((stage) => stage.id === instance.currentStageId);
    const nextStage = nextStageFor(stages, currentStage);

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            size="lg"
            title={
                <div>
                    <div>Stage Details</div>
                    <div className="text-xs font-normal text-white-dark">
                        {instance.workFlowName} - #{instance.processCode}
                    </div>
                </div>
            }
        >
            <div className="space-y-4">
                <WorkflowStageProgress workFlowName={instance.workFlowName} currentStageId={instance.currentStageId} currentStageName={instance.currentStageName} stages={stages} />

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5 rounded-md border border-white-light p-3 text-sm dark:border-white/10">
                        <div className="mb-1 text-xs font-semibold uppercase text-white-dark">Current Stage</div>
                        <Row label="Stage Name" value={instance.currentStageName} />
                        <Row label="Assigned Date" value={new Date(instance.updatedAt).toLocaleDateString()} />
                        <Row label="Time in Tray" value={timeInTray(instance.initiatedAt)} />
                        <Row label="Due Date" value={dueLabel(instance.dueDate)} valueClassName={isOverdue(instance.dueDate) ? 'text-danger' : ''} />
                        <Row label="Module" value={enumLabel(instance.processTypeKey)} />
                        <Row label="Assigned Group" value={assignedGroupLabel(currentStage)} />
                    </div>

                    <div className="space-y-1.5 rounded-md border border-white-light p-3 text-sm dark:border-white/10">
                        <div className="mb-1 text-xs font-semibold uppercase text-white-dark">Next Stage</div>
                        {nextStage ? (
                            <>
                                <Row label="Next Stage Name" value={nextStage.name} />
                                <Row label="Sequence" value={nextStage.orderNo} />
                                <Row label="Assigned Group" value={assignedGroupLabel(nextStage)} />
                            </>
                        ) : (
                            <p className="text-white-dark">This is the final stage — no further stage to forward to.</p>
                        )}
                    </div>
                </div>

                <div className="flex justify-end gap-2 pt-1">
                    <Button type="button" variant="outline-primary" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button type="button" onClick={onForward}>
                        <IconSend className="h-4 w-4 shrink-0 ltr:mr-2 rtl:ml-2" />
                        Forward
                    </Button>
                </div>
            </div>
        </Modal>
    );
};

export default StageDetailsModal;
