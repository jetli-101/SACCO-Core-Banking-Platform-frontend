import { useEffect, useMemo, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchWorkflows } from '@/store/slices/workflows/workflowsSlice';
import { fetchWorkflowStages } from '@/store/slices/workflows/workflowStagesSlice';
import { fetchWorkflowTransitions } from '@/store/slices/workflows/workflowTransitionsSlice';
import {
    fetchWorkflowStageActions,
    createWorkflowStageAction,
    updateWorkflowStageAction,
    deleteWorkflowStageAction,
    clearWorkflowStageActionsError,
    WorkflowStageAction,
    WorkflowStageActionPayload,
    WorkflowStageActionChecklistItem,
} from '@/store/slices/workflows/workflowStageActionsSlice';
import { showToast } from '@/store/slices/ui/toastSlice';
import Breadcrumb from '@/components/ui/Breadcrumb';
import StatCard from '@/components/ui/StatCard';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import ConfirmModal from '@/components/ui/ConfirmModal';
import Alert from '@/components/ui/Alert';
import Input from '@/components/ui/Input';
import Checkbox from '@/components/ui/Checkbox';
import Spinner from '@/components/ui/Spinner';
import Badge from '@/components/ui/Badge';
import IconPlus from '@/components/Icon/IconPlus';
import IconEdit from '@/components/Icon/IconEdit';
import IconTrash from '@/components/Icon/IconTrash';
import IconSquareCheck from '@/components/Icon/IconSquareCheck';
import IconX from '@/components/Icon/IconX';

const emptyForm = (stageId: string): WorkflowStageActionPayload => ({
    stageId,
    transitionId: '',
    name: '',
    requiresChecklistCompletion: true,
    requiresApprovalComment: false,
    active: true,
    checklistItems: [],
});

const emptyChecklistItem: WorkflowStageActionChecklistItem = { itemText: '', required: true, orderNo: 0 };

// Stage actions are the optional checklist/approval-comment gate a transition can carry
// (WorkFlowStageAction on the backend) — surfaced here as a standalone "Checklists" page
// since they're keyed off a single stage rather than living inside the Edit Workflow tabs.
const WorkflowChecklistsPage = () => {
    const dispatch = useAppDispatch();
    const { workflows } = useAppSelector((state) => state.workflows);
    const { stages } = useAppSelector((state) => state.workflowStages);
    const { transitions } = useAppSelector((state) => state.workflowTransitions);
    const { actions, loading, error, saving } = useAppSelector((state) => state.workflowStageActions);

    const [workflowId, setWorkflowId] = useState('');
    const [stageId, setStageId] = useState('');

    const [modalOpen, setModalOpen] = useState(false);
    const [editTarget, setEditTarget] = useState<WorkflowStageAction | null>(null);
    const [form, setForm] = useState<WorkflowStageActionPayload>(emptyForm(''));
    const [deleteTarget, setDeleteTarget] = useState<WorkflowStageAction | null>(null);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        dispatch(fetchWorkflows());
    }, [dispatch]);

    useEffect(() => {
        setStageId('');
        if (workflowId) {
            dispatch(fetchWorkflowStages(workflowId));
            dispatch(fetchWorkflowTransitions(workflowId));
        }
    }, [dispatch, workflowId]);

    useEffect(() => {
        if (stageId) dispatch(fetchWorkflowStageActions(stageId));
    }, [dispatch, stageId]);

    // Transitions that start from the selected stage — the only ones a stage action can gate.
    const eligibleTransitions = useMemo(() => transitions.filter((transition) => transition.fromStageId === stageId), [transitions, stageId]);

    // A transition can carry at most one stage action, so hide ones already gated (unless it's the one being edited).
    const availableTransitions = useMemo(
        () => eligibleTransitions.filter((transition) => transition.id === editTarget?.transitionId || !actions.some((action) => action.transitionId === transition.id)),
        [eligibleTransitions, actions, editTarget]
    );

    const openCreate = () => {
        setEditTarget(null);
        setForm(emptyForm(stageId));
        dispatch(clearWorkflowStageActionsError());
        setModalOpen(true);
    };

    const openEdit = (action: WorkflowStageAction) => {
        setEditTarget(action);
        setForm({
            stageId: action.stageId,
            transitionId: action.transitionId,
            name: action.name,
            requiresChecklistCompletion: action.requiresChecklistCompletion,
            requiresApprovalComment: action.requiresApprovalComment,
            active: action.active,
            checklistItems: action.checklistItems.map((item) => ({ ...item })),
        });
        dispatch(clearWorkflowStageActionsError());
        setModalOpen(true);
    };

    const addChecklistItem = () => {
        setForm((prev) => ({ ...prev, checklistItems: [...prev.checklistItems, { ...emptyChecklistItem, orderNo: prev.checklistItems.length }] }));
    };

    const updateChecklistItem = (index: number, patch: Partial<WorkflowStageActionChecklistItem>) => {
        setForm((prev) => ({ ...prev, checklistItems: prev.checklistItems.map((item, i) => (i === index ? { ...item, ...patch } : item)) }));
    };

    const removeChecklistItem = (index: number) => {
        setForm((prev) => ({ ...prev, checklistItems: prev.checklistItems.filter((_, i) => i !== index).map((item, i) => ({ ...item, orderNo: i })) }));
    };

    const submitForm = async (event: React.FormEvent) => {
        event.preventDefault();
        try {
            const payload = { ...form, checklistItems: form.checklistItems.filter((item) => item.itemText.trim().length > 0) };
            if (editTarget) {
                await dispatch(updateWorkflowStageAction({ id: editTarget.id, payload })).unwrap();
                dispatch(showToast({ variant: 'success', message: `Checklist "${form.name}" updated successfully` }));
            } else {
                await dispatch(createWorkflowStageAction(payload)).unwrap();
                dispatch(showToast({ variant: 'success', message: `Checklist "${form.name}" created successfully` }));
            }
            setModalOpen(false);
        } catch (err) {
            dispatch(showToast({ variant: 'danger', message: (err as { message?: string })?.message || 'Unable to save checklist' }));
        }
    };

    const confirmDelete = async () => {
        if (!deleteTarget) return;
        setDeleting(true);
        try {
            await dispatch(deleteWorkflowStageAction(deleteTarget.id)).unwrap();
            dispatch(showToast({ variant: 'success', message: `Checklist "${deleteTarget.name}" deleted successfully` }));
            setDeleteTarget(null);
        } catch (err) {
            dispatch(showToast({ variant: 'danger', message: (err as { message?: string })?.message || 'Unable to delete checklist' }));
        } finally {
            setDeleting(false);
        }
    };

    const totalChecklistItems = actions.reduce((sum, action) => sum + action.checklistItems.length, 0);

    return (
        <div>
            <Breadcrumb />

            <div className="mt-3 flex flex-wrap items-start justify-between gap-2">
                <div>
                    <h1 className="text-xl font-bold">Transition Checklists</h1>
                    <p className="text-white-dark">Gate a transition behind a checklist and/or a required approval comment before it can be taken</p>
                </div>
                <Button onClick={openCreate} disabled={!stageId} variant="primary">
                    <IconPlus className="h-4.5 w-4.5 shrink-0 ltr:mr-2 rtl:ml-2" />
                    Add Checklist
                </Button>
            </div>

            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                <StatCard label="Checklists on this Stage" value={actions.length} icon={<IconSquareCheck className="h-4 w-4" />} />
                <StatCard label="Total Checklist Items" value={totalChecklistItems} icon={<IconSquareCheck className="h-4 w-4" />} />
                <StatCard label="Requiring Approval Comment" value={actions.filter((a) => a.requiresApprovalComment).length} icon={<IconSquareCheck className="h-4 w-4" />} />
            </div>

            <div className="panel mt-3">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="w-full">
                        <label htmlFor="workflowId" className="mb-1.5 block text-sm font-semibold">
                            Workflow *
                        </label>
                        <select id="workflowId" className="form-select" value={workflowId} onChange={(e) => setWorkflowId(e.target.value)}>
                            <option value="">Select a workflow…</option>
                            {workflows.map((workflow) => (
                                <option key={workflow.id} value={workflow.id}>
                                    {workflow.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="w-full">
                        <label htmlFor="stageId" className="mb-1.5 block text-sm font-semibold">
                            Stage *
                        </label>
                        <select id="stageId" className="form-select" value={stageId} onChange={(e) => setStageId(e.target.value)} disabled={!workflowId}>
                            <option value="">Select a stage…</option>
                            {stages.map((stage) => (
                                <option key={stage.id} value={stage.id}>
                                    {stage.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {error && (
                    <div className="mt-3">
                        <Alert variant="danger" onClose={() => dispatch(clearWorkflowStageActionsError())}>
                            {error}
                        </Alert>
                    </div>
                )}

                <div className="mt-4 space-y-3">
                    {!stageId ? (
                        <p className="py-6 text-center text-white-dark">Select a workflow and stage to view its transition checklists.</p>
                    ) : loading ? (
                        <div className="flex min-h-[100px] items-center justify-center gap-2">
                            <Spinner className="h-5 w-5 text-primary" />
                            <span className="text-white-dark">Loading…</span>
                        </div>
                    ) : actions.length === 0 ? (
                        <p className="py-6 text-center text-white-dark">No checklists on this stage yet — add one to gate a transition.</p>
                    ) : (
                        actions.map((action) => (
                            <div key={action.id} className="rounded-lg border border-white-light p-3 dark:border-white/10">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <div className="flex flex-wrap items-center gap-2 text-sm">
                                        <span className="font-semibold">{action.name}</span>
                                        <span className="text-white-dark">gates transition</span>
                                        <Badge variant="info">{action.transitionName}</Badge>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Badge variant={action.active ? 'success' : 'secondary'}>{action.active ? 'Active' : 'Inactive'}</Badge>
                                        <button type="button" className="text-white-dark hover:text-primary" onClick={() => openEdit(action)} aria-label={`Edit ${action.name}`}>
                                            <IconEdit className="h-4.5 w-4.5" />
                                        </button>
                                        <button type="button" className="text-white-dark hover:text-danger" onClick={() => setDeleteTarget(action)} aria-label={`Delete ${action.name}`}>
                                            <IconTrash className="h-4.5 w-4.5" />
                                        </button>
                                    </div>
                                </div>

                                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                                    <Badge variant={action.requiresChecklistCompletion ? 'primary' : 'secondary'}>
                                        {action.requiresChecklistCompletion ? 'Checklist required' : 'Checklist optional'}
                                    </Badge>
                                    <Badge variant={action.requiresApprovalComment ? 'primary' : 'secondary'}>
                                        {action.requiresApprovalComment ? 'Approval comment required' : 'Comment optional'}
                                    </Badge>
                                </div>

                                {action.checklistItems.length > 0 && (
                                    <ul className="mt-3 space-y-1.5 rounded-md bg-[#f6f8fa] p-3 text-xs dark:bg-[#1b2e4b]">
                                        {[...action.checklistItems]
                                            .sort((a, b) => a.orderNo - b.orderNo)
                                            .map((item, index) => (
                                                <li key={index} className="flex items-center gap-2">
                                                    <IconSquareCheck className="h-3.5 w-3.5 shrink-0 text-primary" />
                                                    <span>{item.itemText}</span>
                                                    {!item.required && <span className="text-white-dark">(optional)</span>}
                                                </li>
                                            ))}
                                    </ul>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>

            <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editTarget ? 'Edit Checklist' : 'Add Checklist'} size="lg">
                <form onSubmit={submitForm} className="space-y-4">
                    <Input id="name" label="Checklist Name *" value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} placeholder="e.g. Manager sign-off" required />

                    <div className="w-full">
                        <label htmlFor="transitionId" className="mb-1.5 block text-sm font-semibold">
                            Transition *
                        </label>
                        <select
                            id="transitionId"
                            className="form-select"
                            value={form.transitionId}
                            onChange={(e) => setForm((prev) => ({ ...prev, transitionId: e.target.value }))}
                            required
                        >
                            <option value="">Select…</option>
                            {availableTransitions.map((transition) => (
                                <option key={transition.id} value={transition.id}>
                                    {transition.name} ({transition.fromStageName} → {transition.toStageName})
                                </option>
                            ))}
                        </select>
                        {availableTransitions.length === 0 && <p className="mt-1 text-xs text-warning">No transitions from this stage are available to gate.</p>}
                    </div>

                    <div className="flex flex-wrap gap-4">
                        <Checkbox
                            id="requiresChecklistCompletion"
                            label="Requires checklist completion"
                            checked={form.requiresChecklistCompletion}
                            onChange={(e) => setForm((prev) => ({ ...prev, requiresChecklistCompletion: e.target.checked }))}
                        />
                        <Checkbox
                            id="requiresApprovalComment"
                            label="Requires approval comment"
                            checked={form.requiresApprovalComment}
                            onChange={(e) => setForm((prev) => ({ ...prev, requiresApprovalComment: e.target.checked }))}
                        />
                        <Checkbox id="active" label="Active" checked={form.active} onChange={(e) => setForm((prev) => ({ ...prev, active: e.target.checked }))} />
                    </div>

                    <div className="w-full">
                        <div className="mb-1.5 flex items-center justify-between">
                            <span className="text-sm font-semibold">Checklist Items</span>
                            <Button type="button" size="sm" variant="outline-primary" onClick={addChecklistItem}>
                                <IconPlus className="h-4 w-4 shrink-0 ltr:mr-1 rtl:ml-1" />
                                Add Item
                            </Button>
                        </div>
                        {form.checklistItems.length === 0 ? (
                            <p className="text-xs text-white-dark">No items yet — add at least one if this checklist requires completion.</p>
                        ) : (
                            <div className="space-y-2">
                                {form.checklistItems.map((item, index) => (
                                    <div key={index} className="flex items-center gap-2">
                                        <span className="w-5 shrink-0 text-center text-xs text-white-dark">{index + 1}.</span>
                                        <input
                                            type="text"
                                            className="form-input flex-1"
                                            placeholder="Checklist item text"
                                            value={item.itemText}
                                            onChange={(e) => updateChecklistItem(index, { itemText: e.target.value })}
                                        />
                                        <Checkbox
                                            id={`item-required-${index}`}
                                            label="Required"
                                            checked={item.required}
                                            onChange={(e) => updateChecklistItem(index, { required: e.target.checked })}
                                        />
                                        <button type="button" className="text-white-dark hover:text-danger" onClick={() => removeChecklistItem(index)} aria-label={`Remove item ${index + 1}`}>
                                            <IconX className="h-4 w-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2">
                        <Button type="button" variant="outline-primary" onClick={() => setModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={saving}>
                            {saving ? 'Saving…' : editTarget ? 'Save Changes' : 'Add Checklist'}
                        </Button>
                    </div>
                </form>
            </Modal>

            <ConfirmModal
                isOpen={!!deleteTarget}
                title="Delete Checklist"
                message={`Delete checklist "${deleteTarget?.name}"? This cannot be undone.`}
                loading={deleting}
                onConfirm={confirmDelete}
                onCancel={() => setDeleteTarget(null)}
            />
        </div>
    );
};

export default WorkflowChecklistsPage;
