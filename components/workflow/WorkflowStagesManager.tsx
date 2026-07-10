import { useEffect, useMemo, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
    fetchWorkflowStages,
    createWorkflowStage,
    updateWorkflowStage,
    deleteWorkflowStage,
    clearWorkflowStagesError,
    WorkflowStage,
    WorkflowStagePayload,
    StageResponsibleType,
} from '@/store/slices/workflows/workflowStagesSlice';
import { fetchWorkflowStates } from '@/store/slices/workflows/workflowStatesSlice';
import { fetchWorkflowStatuses } from '@/store/slices/workflows/workflowStatusesSlice';
import { fetchUserGroups } from '@/store/slices/userGroups/userGroupsSlice';
import { fetchRoles } from '@/store/slices/roles/rolesSlice';
import { fetchUsers } from '@/store/slices/users/usersSlice';
import { showToast } from '@/store/slices/ui/toastSlice';
import { getWorkflowInterfaceOptions } from '@/pages/pages/interfaceRegistry';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import ConfirmModal from '@/components/ui/ConfirmModal';
import Alert from '@/components/ui/Alert';
import Input from '@/components/ui/Input';
import Checkbox from '@/components/ui/Checkbox';
import Spinner from '@/components/ui/Spinner';
import Badge from '@/components/ui/Badge';
import Dropdown from '@/components/Dropdown';
import IconPlus from '@/components/Icon/IconPlus';
import IconEdit from '@/components/Icon/IconEdit';
import IconTrash from '@/components/Icon/IconTrash';
import IconUsersGroup from '@/components/Icon/IconUsersGroup';
import IconUsers from '@/components/Icon/IconUsers';
import IconUser from '@/components/Icon/IconUser';
import IconGlobe from '@/components/Icon/IconGlobe';
import IconCaretDown from '@/components/Icon/IconCaretDown';

interface WorkflowStagesManagerProps {
    workFlowId: string;
}

const emptyForm = (nextOrder: number): WorkflowStagePayload => ({
    workFlowId: '',
    name: '',
    description: '',
    orderNo: nextOrder,
    responsibleType: 'ANY',
    responsibleGroupId: undefined,
    responsibleRoleId: undefined,
    responsibleUserIds: [],
    stateId: '',
    defaultStatusId: undefined,
    isInitial: false,
    isFinal: false,
    interfaceKey: undefined,
});

const responsibleIcon = (type: StageResponsibleType) => {
    switch (type) {
        case 'GROUP':
            return <IconUsersGroup className="h-3.5 w-3.5" />;
        case 'ROLE':
            return <IconUser className="h-3.5 w-3.5" />;
        case 'USERS':
            return <IconUsers className="h-3.5 w-3.5" />;
        default:
            return <IconGlobe className="h-3.5 w-3.5" />;
    }
};

const responsibleLabel = (stage: WorkflowStage) => {
    switch (stage.responsibleType) {
        case 'GROUP':
            return stage.responsibleGroupName || 'Unassigned group';
        case 'ROLE':
            return stage.responsibleRoleName || 'Unassigned role';
        case 'USERS':
            return `${stage.responsibleUserIds?.length || 0} user${stage.responsibleUserIds?.length === 1 ? '' : 's'}`;
        default:
            return 'Any user';
    }
};

// Powers the "Stage Structure" wizard step and (later) the Edit Workflow "Stages" tab —
// self-contained so it can be dropped into either without extra plumbing.
const WorkflowStagesManager = ({ workFlowId }: WorkflowStagesManagerProps) => {
    const dispatch = useAppDispatch();
    const { stages, loading, error, saving } = useAppSelector((state) => state.workflowStages);
    const { states } = useAppSelector((state) => state.workflowStates);
    const { statuses } = useAppSelector((state) => state.workflowStatuses);
    const { groups } = useAppSelector((state) => state.userGroups);
    const { roles } = useAppSelector((state) => state.roles);
    const { users } = useAppSelector((state) => state.users);

    const [modalOpen, setModalOpen] = useState(false);
    const [editTarget, setEditTarget] = useState<WorkflowStage | null>(null);
    const [form, setForm] = useState<WorkflowStagePayload>(emptyForm(1));
    const [deleteTarget, setDeleteTarget] = useState<WorkflowStage | null>(null);
    const [deleting, setDeleting] = useState(false);

    const interfaceOptions = useMemo(() => getWorkflowInterfaceOptions(), []);

    useEffect(() => {
        dispatch(fetchWorkflowStages(workFlowId));
        dispatch(fetchWorkflowStates());
        dispatch(fetchWorkflowStatuses());
        dispatch(fetchUserGroups());
        dispatch(fetchRoles());
        dispatch(fetchUsers());
    }, [dispatch, workFlowId]);

    const activeStateId = useMemo(() => states.find((state) => state.textId === 'ACTIVE')?.id, [states]);

    const openCreate = () => {
        setEditTarget(null);
        setForm({ ...emptyForm(stages.length + 1), workFlowId, stateId: activeStateId || states[0]?.id || '' });
        dispatch(clearWorkflowStagesError());
        setModalOpen(true);
    };

    const openEdit = (stage: WorkflowStage) => {
        setEditTarget(stage);
        setForm({
            workFlowId: stage.workFlowId,
            name: stage.name,
            description: stage.description || '',
            orderNo: stage.orderNo,
            responsibleType: stage.responsibleType,
            responsibleGroupId: stage.responsibleGroupId,
            responsibleRoleId: stage.responsibleRoleId,
            responsibleUserIds: stage.responsibleUserIds || [],
            stateId: stage.stateId,
            defaultStatusId: stage.defaultStatusId,
            isInitial: stage.isInitial,
            isFinal: stage.isFinal,
            interfaceKey: stage.interfaceKey,
        });
        dispatch(clearWorkflowStagesError());
        setModalOpen(true);
    };

    const toggleResponsibleUser = (userId: string) => {
        setForm((prev) => {
            const current = prev.responsibleUserIds || [];
            const next = current.includes(userId) ? current.filter((id) => id !== userId) : [...current, userId];
            return { ...prev, responsibleUserIds: next };
        });
    };

    const submitForm = async (event: React.FormEvent) => {
        event.preventDefault();
        try {
            if (editTarget) {
                await dispatch(updateWorkflowStage({ id: editTarget.id, payload: form })).unwrap();
                dispatch(showToast({ variant: 'success', message: `Stage "${form.name}" updated successfully` }));
            } else {
                await dispatch(createWorkflowStage(form)).unwrap();
                dispatch(showToast({ variant: 'success', message: `Stage "${form.name}" added successfully` }));
            }
            setModalOpen(false);
        } catch (err) {
            dispatch(showToast({ variant: 'danger', message: (err as { message?: string })?.message || 'Unable to save stage' }));
        }
    };

    const confirmDelete = async () => {
        if (!deleteTarget) return;
        setDeleting(true);
        try {
            await dispatch(deleteWorkflowStage(deleteTarget.id)).unwrap();
            dispatch(showToast({ variant: 'success', message: `Stage "${deleteTarget.name}" deleted successfully` }));
            setDeleteTarget(null);
        } catch (err) {
            dispatch(showToast({ variant: 'danger', message: (err as { message?: string })?.message || 'Unable to delete stage' }));
        } finally {
            setDeleting(false);
        }
    };

    // Quick status change straight from the list — resends the stage's existing fields
    // with only stateId swapped, since the backend takes the full stage payload on update.
    const quickChangeState = async (stage: WorkflowStage, stateId: string) => {
        if (stateId === stage.stateId) return;
        try {
            await dispatch(
                updateWorkflowStage({
                    id: stage.id,
                    payload: {
                        workFlowId: stage.workFlowId,
                        name: stage.name,
                        description: stage.description || '',
                        orderNo: stage.orderNo,
                        responsibleType: stage.responsibleType,
                        responsibleGroupId: stage.responsibleGroupId,
                        responsibleRoleId: stage.responsibleRoleId,
                        responsibleUserIds: stage.responsibleUserIds || [],
                        stateId,
                        defaultStatusId: stage.defaultStatusId,
                        isInitial: stage.isInitial,
                        isFinal: stage.isFinal,
                        interfaceKey: stage.interfaceKey,
                    },
                })
            ).unwrap();
            dispatch(showToast({ variant: 'success', message: `"${stage.name}" is now ${states.find((state) => state.id === stateId)?.name || ''}` }));
        } catch (err) {
            dispatch(showToast({ variant: 'danger', message: (err as { message?: string })?.message || 'Unable to update stage status' }));
        }
    };

    return (
        <div>
            <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                    <h5 className="text-lg font-semibold">Workflow Stages</h5>
                    <p className="text-sm text-white-dark">Manage the stages in this workflow</p>
                </div>
                <Button size="sm" onClick={openCreate}>
                    <IconPlus className="h-4.5 w-4.5 shrink-0 ltr:mr-2 rtl:ml-2" />
                    Add Stage
                </Button>
            </div>

            {error && (
                <div className="mt-3">
                    <Alert variant="danger" onClose={() => dispatch(clearWorkflowStagesError())}>
                        {error}
                    </Alert>
                </div>
            )}

            <div className="mt-4 space-y-2">
                {loading ? (
                    <div className="flex min-h-[100px] items-center justify-center gap-2">
                        <Spinner className="h-5 w-5 text-primary" />
                        <span className="text-white-dark">Loading…</span>
                    </div>
                ) : stages.length === 0 ? (
                    <p className="py-6 text-center text-white-dark">No stages yet — add the first one to get started.</p>
                ) : (
                    stages.map((stage) => (
                        <div key={stage.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-white-light p-3 dark:border-white/10">
                            <div className="flex items-center gap-3">
                                <span className="grid h-8 w-8 shrink-0 place-content-center rounded-full bg-success text-sm font-semibold text-white">{stage.orderNo}</span>
                                <div>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className="font-semibold">{stage.name}</span>
                                        {stage.isInitial && <Badge variant="info">Initial</Badge>}
                                        {stage.isFinal && <Badge variant="warning">Final</Badge>}
                                    </div>
                                    {stage.description && <p className="text-xs text-white-dark">{stage.description}</p>}
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="flex items-center gap-1 text-xs text-white-dark">
                                    {responsibleIcon(stage.responsibleType)}
                                    {responsibleLabel(stage)}
                                </span>
                                <Dropdown
                                    placement="bottom-end"
                                    btnClassName={`badge flex items-center gap-1 text-white ${stage.stateName === 'ACTIVE' ? 'bg-success' : 'bg-secondary'}`}
                                    button={
                                        <>
                                            {stage.stateName || '—'}
                                            <IconCaretDown className="h-3 w-3" />
                                        </>
                                    }
                                >
                                    <ul className="w-36 !py-1 text-dark dark:text-white-light">
                                        {states.map((state) => (
                                            <li key={state.id}>
                                                <button type="button" className={state.id === stage.stateId ? 'font-semibold text-primary' : ''} onClick={() => quickChangeState(stage, state.id)}>
                                                    {state.name}
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                </Dropdown>
                                <button type="button" className="text-white-dark hover:text-primary" onClick={() => openEdit(stage)} aria-label={`Edit ${stage.name}`}>
                                    <IconEdit className="h-4.5 w-4.5" />
                                </button>
                                <button type="button" className="text-white-dark hover:text-danger" onClick={() => setDeleteTarget(stage)} aria-label={`Delete ${stage.name}`}>
                                    <IconTrash className="h-4.5 w-4.5" />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editTarget ? 'Edit Stage' : 'Add Stage'} size="lg">
                <form onSubmit={submitForm} className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <Input id="name" label="Stage Name *" value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} placeholder="e.g. Submission stage" required />
                        <Input
                            id="orderNo"
                            type="number"
                            min={1}
                            label="Order No *"
                            value={form.orderNo}
                            onChange={(e) => setForm((prev) => ({ ...prev, orderNo: Number(e.target.value) }))}
                            required
                        />
                    </div>
                    <Input id="description" label="Description" value={form.description} onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))} />

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div className="w-full">
                            <label htmlFor="responsibleType" className="mb-1.5 block text-sm font-semibold">
                                Responsible *
                            </label>
                            <select
                                id="responsibleType"
                                className="form-select"
                                value={form.responsibleType}
                                onChange={(e) => setForm((prev) => ({ ...prev, responsibleType: e.target.value as StageResponsibleType }))}
                            >
                                <option value="ANY">Any authenticated user</option>
                                <option value="GROUP">A user group</option>
                                <option value="ROLE">A role</option>
                                <option value="USERS">Specific user(s)</option>
                            </select>
                        </div>

                        <div className="w-full">
                            <label htmlFor="stateId" className="mb-1.5 block text-sm font-semibold">
                                State *
                            </label>
                            <select id="stateId" className="form-select" value={form.stateId} onChange={(e) => setForm((prev) => ({ ...prev, stateId: e.target.value }))} required>
                                <option value="">Select…</option>
                                {states.map((state) => (
                                    <option key={state.id} value={state.id}>
                                        {state.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {form.responsibleType === 'GROUP' && (
                        <div className="w-full">
                            <label htmlFor="responsibleGroupId" className="mb-1.5 block text-sm font-semibold">
                                User Group *
                            </label>
                            <select
                                id="responsibleGroupId"
                                className="form-select"
                                value={form.responsibleGroupId || ''}
                                onChange={(e) => setForm((prev) => ({ ...prev, responsibleGroupId: e.target.value }))}
                                required
                            >
                                <option value="">Select…</option>
                                {groups.map((group) => (
                                    <option key={group.id} value={group.id}>
                                        {group.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {form.responsibleType === 'ROLE' && (
                        <div className="w-full">
                            <label htmlFor="responsibleRoleId" className="mb-1.5 block text-sm font-semibold">
                                Role *
                            </label>
                            <select
                                id="responsibleRoleId"
                                className="form-select"
                                value={form.responsibleRoleId || ''}
                                onChange={(e) => setForm((prev) => ({ ...prev, responsibleRoleId: e.target.value }))}
                                required
                            >
                                <option value="">Select…</option>
                                {roles.map((role) => (
                                    <option key={role.id} value={role.id}>
                                        {role.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {form.responsibleType === 'USERS' && (
                        <div className="w-full">
                            <span className="mb-1.5 block text-sm font-semibold">Users *</span>
                            <div className="max-h-40 space-y-1 overflow-y-auto rounded-md border border-white-light p-2 dark:border-white/10">
                                {users.map((user) => (
                                    <Checkbox
                                        key={user.id}
                                        checked={(form.responsibleUserIds || []).includes(user.id)}
                                        onChange={() => toggleResponsibleUser(user.id)}
                                        label={
                                            <>
                                                {user.username} <span className="font-normal text-white-dark">({user.email})</span>
                                            </>
                                        }
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="w-full">
                        <label htmlFor="defaultStatusId" className="mb-1.5 block text-sm font-semibold">
                            Default Status
                        </label>
                        <select
                            id="defaultStatusId"
                            className="form-select"
                            value={form.defaultStatusId || ''}
                            onChange={(e) => setForm((prev) => ({ ...prev, defaultStatusId: e.target.value || undefined }))}
                        >
                            <option value="">None</option>
                            {statuses.map((status) => (
                                <option key={status.id} value={status.id}>
                                    {status.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="w-full">
                        <label htmlFor="interfaceKey" className="mb-1.5 block text-sm font-semibold">
                            Interface
                        </label>
                        <select id="interfaceKey" className="form-select" value={form.interfaceKey || ''} onChange={(e) => setForm((prev) => ({ ...prev, interfaceKey: e.target.value || undefined }))}>
                            <option value="">None — use the generic action panel</option>
                            {interfaceOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                        <p className="mt-1 text-xs text-white-dark">
                            {form.interfaceKey
                                ? interfaceOptions.find((option) => option.value === form.interfaceKey)?.description
                                : 'Which action-panel screen renders in the In-Tray for instances sitting at this stage.'}
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-4">
                        <Checkbox id="isInitial" label="Initial stage" checked={form.isInitial} onChange={(e) => setForm((prev) => ({ ...prev, isInitial: e.target.checked }))} />
                        <Checkbox id="isFinal" label="Final stage" checked={form.isFinal} onChange={(e) => setForm((prev) => ({ ...prev, isFinal: e.target.checked }))} />
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2">
                        <Button type="button" variant="outline-primary" onClick={() => setModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={saving}>
                            {saving ? 'Saving…' : editTarget ? 'Save Changes' : 'Add Stage'}
                        </Button>
                    </div>
                </form>
            </Modal>

            <ConfirmModal
                isOpen={!!deleteTarget}
                title="Delete Stage"
                message={`Delete stage "${deleteTarget?.name}"? Any transitions referencing it must be removed first.`}
                loading={deleting}
                onConfirm={confirmDelete}
                onCancel={() => setDeleteTarget(null)}
            />
        </div>
    );
};

export default WorkflowStagesManager;
