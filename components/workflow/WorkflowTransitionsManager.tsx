import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
    fetchWorkflowTransitions,
    createWorkflowTransition,
    updateWorkflowTransition,
    deleteWorkflowTransition,
    clearWorkflowTransitionsError,
    WorkflowTransition,
    WorkflowTransitionPayload,
    TransitionActionType,
} from '@/store/slices/workflows/workflowTransitionsSlice';
import { fetchWorkflowStages } from '@/store/slices/workflows/workflowStagesSlice';
import { fetchWorkflowStatuses } from '@/store/slices/workflows/workflowStatusesSlice';
import { showToast } from '@/store/slices/ui/toastSlice';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import ConfirmModal from '@/components/ui/ConfirmModal';
import Alert from '@/components/ui/Alert';
import Input from '@/components/ui/Input';
import Checkbox from '@/components/ui/Checkbox';
import Spinner from '@/components/ui/Spinner';
import Badge from '@/components/ui/Badge';
import RowActionsMenu from '@/components/ui/RowActionsMenu';
import IconPlus from '@/components/Icon/IconPlus';
import IconArrowForward from '@/components/Icon/IconArrowForward';

interface WorkflowTransitionsManagerProps {
    workFlowId: string;
}

const actionTypeLabels: Record<TransitionActionType, string> = {
    NORMAL_SUBMISSION: 'Normal Submission',
    APPROVAL: 'Approval',
    REJECTION: 'Rejection',
    RETURN: 'Return',
};

const emptyForm = (workFlowId: string): WorkflowTransitionPayload => ({
    workFlowId,
    fromStageId: '',
    toStageId: '',
    name: '',
    actionType: 'NORMAL_SUBMISSION',
    resultingStatusId: undefined,
    description: '',
    active: true,
});

// Powers the "Connect Components" wizard step and (later) the Edit Workflow
// "Transitions" tab — self-contained so it can be dropped into either.
const WorkflowTransitionsManager = ({ workFlowId }: WorkflowTransitionsManagerProps) => {
    const dispatch = useAppDispatch();
    const { transitions, loading, error, saving } = useAppSelector((state) => state.workflowTransitions);
    const { stages } = useAppSelector((state) => state.workflowStages);
    const { statuses } = useAppSelector((state) => state.workflowStatuses);

    const [modalOpen, setModalOpen] = useState(false);
    const [editTarget, setEditTarget] = useState<WorkflowTransition | null>(null);
    const [form, setForm] = useState<WorkflowTransitionPayload>(emptyForm(workFlowId));
    const [deleteTarget, setDeleteTarget] = useState<WorkflowTransition | null>(null);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        dispatch(fetchWorkflowTransitions(workFlowId));
        dispatch(fetchWorkflowStages(workFlowId));
        dispatch(fetchWorkflowStatuses());
    }, [dispatch, workFlowId]);

    const openCreate = () => {
        setEditTarget(null);
        setForm(emptyForm(workFlowId));
        dispatch(clearWorkflowTransitionsError());
        setModalOpen(true);
    };

    const openEdit = (transition: WorkflowTransition) => {
        setEditTarget(transition);
        setForm({
            workFlowId: transition.workFlowId,
            fromStageId: transition.fromStageId,
            toStageId: transition.toStageId,
            name: transition.name,
            actionType: transition.actionType,
            resultingStatusId: transition.resultingStatusId,
            description: transition.description || '',
            active: transition.active,
        });
        dispatch(clearWorkflowTransitionsError());
        setModalOpen(true);
    };

    const submitForm = async (event: React.FormEvent) => {
        event.preventDefault();
        try {
            if (editTarget) {
                await dispatch(updateWorkflowTransition({ id: editTarget.id, payload: form })).unwrap();
                dispatch(showToast({ variant: 'success', message: `Transition "${form.name}" updated successfully` }));
            } else {
                await dispatch(createWorkflowTransition(form)).unwrap();
                dispatch(showToast({ variant: 'success', message: `Transition "${form.name}" added successfully` }));
            }
            setModalOpen(false);
        } catch (err) {
            dispatch(showToast({ variant: 'danger', message: (err as { message?: string })?.message || 'Unable to save transition' }));
        }
    };

    const confirmDelete = async () => {
        if (!deleteTarget) return;
        setDeleting(true);
        try {
            await dispatch(deleteWorkflowTransition(deleteTarget.id)).unwrap();
            dispatch(showToast({ variant: 'success', message: `Transition "${deleteTarget.name}" deleted successfully` }));
            setDeleteTarget(null);
        } catch (err) {
            dispatch(showToast({ variant: 'danger', message: (err as { message?: string })?.message || 'Unable to delete transition' }));
        } finally {
            setDeleting(false);
        }
    };

    return (
        <div>
            <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                    <h5 className="text-lg font-semibold">Workflow Transitions</h5>
                    <p className="text-sm text-white-dark">Manage the transitions between stages and their actions</p>
                </div>
                <Button size="sm" onClick={openCreate} disabled={stages.length < 2}>
                    <IconPlus className="h-4.5 w-4.5 shrink-0 ltr:mr-2 rtl:ml-2" />
                    Add Transition
                </Button>
            </div>

            {stages.length < 2 && <p className="mt-2 text-xs text-warning">Add at least two stages before creating a transition.</p>}

            {error && (
                <div className="mt-3">
                    <Alert variant="danger" onClose={() => dispatch(clearWorkflowTransitionsError())}>
                        {error}
                    </Alert>
                </div>
            )}

            <div className="mt-4 space-y-3">
                {loading ? (
                    <div className="flex min-h-[100px] items-center justify-center gap-2">
                        <Spinner className="h-5 w-5 text-primary" />
                        <span className="text-white-dark">Loading…</span>
                    </div>
                ) : transitions.length === 0 ? (
                    <p className="py-6 text-center text-white-dark">No transitions yet — connect your stages to define how a process moves forward.</p>
                ) : (
                    transitions.map((transition) => {
                        const fromOrder = stages.find((stage) => stage.id === transition.fromStageId)?.orderNo;
                        const toOrder = stages.find((stage) => stage.id === transition.toStageId)?.orderNo;
                        return (
                            <div key={transition.id} className="rounded-lg border border-white-light p-3 dark:border-white/10">
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                    <div className="flex flex-1 items-center gap-3 text-sm">
                                        <div className="flex shrink-0 items-center gap-2">
                                            <span className="grid h-8 w-8 shrink-0 place-content-center rounded-full bg-primary text-xs font-bold text-white">{fromOrder ?? '?'}</span>
                                            <span className="font-semibold">{transition.fromStageName}</span>
                                        </div>
                                        <div className="flex min-w-[80px] flex-1 flex-col items-center px-1">
                                            <span className="text-xs font-medium text-white-dark">{transition.name}</span>
                                            <div className="relative mt-1 h-px w-full bg-white-light dark:bg-white/10">
                                                <IconArrowForward className="absolute -right-1.5 -top-[7px] h-4 w-4 text-white-dark" />
                                            </div>
                                        </div>
                                        <div className="flex shrink-0 items-center gap-2">
                                            <span className="grid h-8 w-8 shrink-0 place-content-center rounded-full bg-success text-xs font-bold text-white">{toOrder ?? '?'}</span>
                                            <span className="font-semibold">{transition.toStageName}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Badge variant={transition.active ? 'success' : 'secondary'}>{transition.active ? 'Active' : 'Inactive'}</Badge>
                                        <RowActionsMenu onEdit={() => openEdit(transition)} onDelete={() => setDeleteTarget(transition)} label={`Actions for ${transition.name}`} />
                                    </div>
                                </div>
                                <div className="mt-3 grid grid-cols-2 gap-3 rounded-md bg-[#f6f8fa] p-3 text-xs dark:bg-[#1b2e4b] sm:grid-cols-4">
                                    <div>
                                        <div className="text-white-dark">Action Type</div>
                                        <div className="font-semibold">{actionTypeLabels[transition.actionType]}</div>
                                    </div>
                                    <div>
                                        <div className="text-white-dark">Name</div>
                                        <div className="font-semibold">{transition.name}</div>
                                    </div>
                                    <div>
                                        <div className="text-white-dark">Status</div>
                                        <div className="font-semibold">{transition.resultingStatusName || '—'}</div>
                                    </div>
                                    <div>
                                        <div className="text-white-dark">Description</div>
                                        <div className="font-semibold">{transition.description || '—'}</div>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editTarget ? 'Edit Transition' : 'Add Transition'} size="lg">
                <form onSubmit={submitForm} className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div className="w-full">
                            <label htmlFor="fromStageId" className="mb-1.5 block text-sm font-semibold">
                                From Stage *
                            </label>
                            <select id="fromStageId" className="form-select" value={form.fromStageId} onChange={(e) => setForm((prev) => ({ ...prev, fromStageId: e.target.value }))} required>
                                <option value="">Select…</option>
                                {stages.map((stage) => (
                                    <option key={stage.id} value={stage.id}>
                                        {stage.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="w-full">
                            <label htmlFor="toStageId" className="mb-1.5 block text-sm font-semibold">
                                To Stage *
                            </label>
                            <select id="toStageId" className="form-select" value={form.toStageId} onChange={(e) => setForm((prev) => ({ ...prev, toStageId: e.target.value }))} required>
                                <option value="">Select…</option>
                                {stages.map((stage) => (
                                    <option key={stage.id} value={stage.id}>
                                        {stage.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <Input
                        id="name"
                        label="Transition Name *"
                        value={form.name}
                        onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                        placeholder="e.g. Submit to review"
                        required
                    />

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div className="w-full">
                            <label htmlFor="actionType" className="mb-1.5 block text-sm font-semibold">
                                Action Type *
                            </label>
                            <select
                                id="actionType"
                                className="form-select"
                                value={form.actionType}
                                onChange={(e) => setForm((prev) => ({ ...prev, actionType: e.target.value as TransitionActionType }))}
                            >
                                {Object.entries(actionTypeLabels).map(([value, label]) => (
                                    <option key={value} value={value}>
                                        {label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="w-full">
                            <label htmlFor="resultingStatusId" className="mb-1.5 block text-sm font-semibold">
                                Resulting Status
                            </label>
                            <select
                                id="resultingStatusId"
                                className="form-select"
                                value={form.resultingStatusId || ''}
                                onChange={(e) => setForm((prev) => ({ ...prev, resultingStatusId: e.target.value || undefined }))}
                            >
                                <option value="">None</option>
                                {statuses.map((status) => (
                                    <option key={status.id} value={status.id}>
                                        {status.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <Input id="description" label="Description" value={form.description} onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))} />

                    <Checkbox id="active" label="Active" checked={form.active} onChange={(e) => setForm((prev) => ({ ...prev, active: e.target.checked }))} />

                    <div className="flex items-center justify-end gap-2 pt-2">
                        <Button type="button" variant="outline-primary" onClick={() => setModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={saving}>
                            {saving ? 'Saving…' : editTarget ? 'Save Changes' : 'Add Transition'}
                        </Button>
                    </div>
                </form>
            </Modal>

            <ConfirmModal
                isOpen={!!deleteTarget}
                title="Delete Transition"
                message={`Delete transition "${deleteTarget?.name}"? This cannot be undone.`}
                loading={deleting}
                onConfirm={confirmDelete}
                onCancel={() => setDeleteTarget(null)}
            />
        </div>
    );
};

export default WorkflowTransitionsManager;
