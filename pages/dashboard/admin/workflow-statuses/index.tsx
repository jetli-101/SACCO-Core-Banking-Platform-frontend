import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
    fetchWorkflowStatuses,
    createWorkflowStatus,
    updateWorkflowStatus,
    deleteWorkflowStatus,
    clearWorkflowStatusesError,
    WorkflowStatus,
    WorkflowStatusPayload,
} from '@/store/slices/workflows/workflowStatusesSlice';
import { showToast } from '@/store/slices/ui/toastSlice';
import DataGrid from '@/components/ui/DataGrid';
import StatCard from '@/components/ui/StatCard';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import ConfirmModal from '@/components/ui/ConfirmModal';
import Alert from '@/components/ui/Alert';
import RowActionsMenu from '@/components/ui/RowActionsMenu';
import Breadcrumb from '@/components/ui/Breadcrumb';
import IconPlus from '@/components/Icon/IconPlus';
import IconTag from '@/components/Icon/IconTag';

const emptyForm: WorkflowStatusPayload = { name: '', textId: '', description: '' };

// Slugifies "Pending Approval" -> "PENDING_APPROVAL" so the free-text Name field can
// double as the source for the machine-readable Text ID instead of asking for both.
const slugify = (value: string) =>
    value
        .trim()
        .toUpperCase()
        .replace(/[^A-Z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '');

const WorkflowStatusesPage = () => {
    const dispatch = useAppDispatch();
    const { statuses, loading, error, saving } = useAppSelector((state) => state.workflowStatuses);

    const [modalOpen, setModalOpen] = useState(false);
    const [editTarget, setEditTarget] = useState<WorkflowStatus | null>(null);
    const [form, setForm] = useState<WorkflowStatusPayload>(emptyForm);
    const [textIdTouched, setTextIdTouched] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<WorkflowStatus | null>(null);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        dispatch(fetchWorkflowStatuses());
    }, [dispatch]);

    const openCreate = () => {
        setEditTarget(null);
        setForm(emptyForm);
        setTextIdTouched(false);
        dispatch(clearWorkflowStatusesError());
        setModalOpen(true);
    };

    const openEdit = (status: WorkflowStatus) => {
        setEditTarget(status);
        setForm({ name: status.name, textId: status.textId, description: status.description || '' });
        setTextIdTouched(true);
        dispatch(clearWorkflowStatusesError());
        setModalOpen(true);
    };

    const submitForm = async (event: React.FormEvent) => {
        event.preventDefault();
        try {
            if (editTarget) {
                await dispatch(updateWorkflowStatus({ id: editTarget.id, payload: form })).unwrap();
                dispatch(showToast({ variant: 'success', message: `Status "${form.name}" updated successfully` }));
            } else {
                await dispatch(createWorkflowStatus(form)).unwrap();
                dispatch(showToast({ variant: 'success', message: `Status "${form.name}" created successfully` }));
            }
            setModalOpen(false);
        } catch (err) {
            dispatch(showToast({ variant: 'danger', message: (err as { message?: string })?.message || 'Unable to save status' }));
        }
    };

    const confirmDelete = async () => {
        if (!deleteTarget) return;
        setDeleting(true);
        try {
            await dispatch(deleteWorkflowStatus(deleteTarget.id)).unwrap();
            dispatch(showToast({ variant: 'success', message: `Status "${deleteTarget.name}" deleted successfully` }));
            setDeleteTarget(null);
        } catch (err) {
            dispatch(showToast({ variant: 'danger', message: (err as { message?: string })?.message || 'Unable to delete status' }));
        } finally {
            setDeleting(false);
        }
    };

    return (
        <div>
            <Breadcrumb />

            <div className="mt-3 flex flex-wrap items-start justify-between gap-2">
                <div>
                    <h1 className="text-xl font-bold">Workflow Statuses</h1>
                    <p className="text-white-dark">Manage the shared status catalog stages and transitions reference (Submitted, Reviewed, Approved, ...)</p>
                </div>
            </div>

            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                <StatCard label="Total Statuses" value={statuses.length} icon={<IconTag className="h-4 w-4" />} />
            </div>

            {error && (
                <div className="mt-3">
                    <Alert variant="danger" onClose={() => dispatch(clearWorkflowStatusesError())}>
                        {error}
                    </Alert>
                </div>
            )}

            <DataGrid
                className="mt-3"
                title="Statuses"
                count={statuses.length}
                columns={[
                    {
                        header: 'Actions',
                        accessor: (row: WorkflowStatus) => <RowActionsMenu onEdit={() => openEdit(row)} onDelete={() => setDeleteTarget(row)} label={`Actions for ${row.name}`} />,
                    },
                    { header: 'Name', accessor: 'name' },
                    { header: 'Text ID', accessor: (row: WorkflowStatus) => <code className="text-xs">{row.textId}</code> },
                    { header: 'Description', accessor: (row: WorkflowStatus) => row.description || '—' },
                ]}
                data={statuses}
                rowKey={(row) => row.id}
                searchKeys={['name', 'textId', 'description']}
                searchPlaceholder="Search statuses..."
                loading={loading}
                emptyMessage="No statuses yet"
                onRefresh={() => dispatch(fetchWorkflowStatuses())}
                toolbarActions={
                    <Button size="sm" onClick={openCreate}>
                        <IconPlus className="h-4.5 w-4.5 shrink-0 ltr:mr-2 rtl:ml-2" />
                        Add New Status
                    </Button>
                }
            />

            <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editTarget ? 'Edit Status' : 'New Status'}>
                <form onSubmit={submitForm} className="space-y-4">
                    <Input
                        id="name"
                        label="Name *"
                        value={form.name}
                        onChange={(e) => {
                            const name = e.target.value;
                            setForm((prev) => ({ ...prev, name, textId: textIdTouched ? prev.textId : slugify(name) }));
                        }}
                        placeholder="e.g. Approved"
                        required
                    />
                    <Input
                        id="textId"
                        label="Text ID *"
                        value={form.textId}
                        onChange={(e) => {
                            setTextIdTouched(true);
                            setForm((prev) => ({ ...prev, textId: e.target.value.toUpperCase() }));
                        }}
                        placeholder="e.g. APPROVED"
                        helperText="Machine-readable identifier used by stages/transitions"
                        required
                    />
                    <Input id="description" label="Description" value={form.description} onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))} />

                    <div className="flex items-center justify-end gap-2 pt-2">
                        <Button type="button" variant="outline-primary" onClick={() => setModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={saving}>
                            {saving ? 'Saving…' : editTarget ? 'Save Changes' : 'Create Status'}
                        </Button>
                    </div>
                </form>
            </Modal>

            <ConfirmModal
                isOpen={!!deleteTarget}
                title="Delete Status"
                message={`Delete status "${deleteTarget?.name}"? This fails if the status is still referenced by any stage or transition.`}
                loading={deleting}
                onConfirm={confirmDelete}
                onCancel={() => setDeleteTarget(null)}
            />
        </div>
    );
};

export default WorkflowStatusesPage;
