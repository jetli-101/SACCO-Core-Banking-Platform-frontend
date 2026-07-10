import { useEffect, useMemo, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
    fetchWorkflowMappings,
    createWorkflowMapping,
    updateWorkflowMapping,
    deleteWorkflowMapping,
    clearWorkflowMappingsError,
    WorkflowMapping,
    WorkflowMappingPayload,
} from '@/store/slices/workflows/workflowMappingsSlice';
import { fetchModules, flattenModules } from '@/store/slices/modules/modulesSlice';
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
import IconLink from '@/components/Icon/IconLink';

interface WorkflowMappingsManagerProps {
    workFlowId: string;
}

const emptyForm = (workFlowId: string): WorkflowMappingPayload => ({ processTypeKey: '', workFlowId, active: true });

// A module attaches to this workflow by registering its processTypeKey here (e.g. "LOAN",
// "CLAIM") — WorkFlowEngineService.startProcess looks this mapping up by key. Without one,
// calling the module's "apply"/"submit" action fails with "No workflow is mapped to
// process type '<KEY>'". Scoped to this workflow by filtering the shared mappings list
// client-side, since the endpoint itself lists every mapping in the system.
const WorkflowMappingsManager = ({ workFlowId }: WorkflowMappingsManagerProps) => {
    const dispatch = useAppDispatch();
    const { mappings, loading, saving, error } = useAppSelector((state) => state.workflowMappings);
    const { items: moduleItems } = useAppSelector((state) => state.modules);

    const [modalOpen, setModalOpen] = useState(false);
    const [editTarget, setEditTarget] = useState<WorkflowMapping | null>(null);
    const [form, setForm] = useState<WorkflowMappingPayload>(emptyForm(workFlowId));
    const [deleteTarget, setDeleteTarget] = useState<WorkflowMapping | null>(null);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        dispatch(fetchWorkflowMappings());
        dispatch(fetchModules());
    }, [dispatch]);

    const workflowMappings = useMemo(() => mappings.filter((mapping) => mapping.workFlowId === workFlowId), [mappings, workFlowId]);
    // The module registry's textId is the closest thing this app has to a "module id" —
    // picking from it beats typing a process type key blind, since the value has to match
    // whatever the calling module's service hardcodes (e.g. LoanService.PROCESS_TYPE_KEY).
    const modules = useMemo(() => Array.from(flattenModules(moduleItems).values()).sort((a, b) => a.name.localeCompare(b.name)), [moduleItems]);

    const openCreate = () => {
        setEditTarget(null);
        setForm(emptyForm(workFlowId));
        dispatch(clearWorkflowMappingsError());
        setModalOpen(true);
    };

    const openEdit = (mapping: WorkflowMapping) => {
        setEditTarget(mapping);
        setForm({ processTypeKey: mapping.processTypeKey, workFlowId: mapping.workFlowId, active: mapping.active });
        dispatch(clearWorkflowMappingsError());
        setModalOpen(true);
    };

    const submitForm = async (event: React.FormEvent) => {
        event.preventDefault();
        try {
            if (editTarget) {
                await dispatch(updateWorkflowMapping({ id: editTarget.id, payload: form })).unwrap();
                dispatch(showToast({ variant: 'success', message: `Mapping "${form.processTypeKey}" updated successfully` }));
            } else {
                await dispatch(createWorkflowMapping(form)).unwrap();
                dispatch(showToast({ variant: 'success', message: `Mapping "${form.processTypeKey}" created successfully` }));
            }
            setModalOpen(false);
        } catch (err) {
            dispatch(showToast({ variant: 'danger', message: (err as { message?: string })?.message || 'Unable to save mapping' }));
        }
    };

    const confirmDelete = async () => {
        if (!deleteTarget) return;
        setDeleting(true);
        try {
            await dispatch(deleteWorkflowMapping(deleteTarget.id)).unwrap();
            dispatch(showToast({ variant: 'success', message: `Mapping "${deleteTarget.processTypeKey}" deleted successfully` }));
            setDeleteTarget(null);
        } catch (err) {
            dispatch(showToast({ variant: 'danger', message: (err as { message?: string })?.message || 'Unable to delete mapping' }));
        } finally {
            setDeleting(false);
        }
    };

    return (
        <div>
            <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                    <h5 className="text-lg font-semibold">Module Mappings</h5>
                    <p className="text-sm text-white-dark">Which module process types resolve to this workflow — required before that module can start a process</p>
                </div>
                <Button size="sm" onClick={openCreate}>
                    <IconPlus className="h-4.5 w-4.5 shrink-0 ltr:mr-2 rtl:ml-2" />
                    Add Module Mapping
                </Button>
            </div>

            {error && (
                <div className="mt-3">
                    <Alert variant="danger" onClose={() => dispatch(clearWorkflowMappingsError())}>
                        {error}
                    </Alert>
                </div>
            )}

            <div className="mt-4 space-y-2">
                {loading ? (
                    <div className="flex min-h-[80px] items-center justify-center gap-2">
                        <Spinner className="h-5 w-5 text-primary" />
                        <span className="text-white-dark">Loading…</span>
                    </div>
                ) : workflowMappings.length === 0 ? (
                    <p className="py-6 text-center text-white-dark">
                        Not mapped to any module yet — a module calling <code>startProcess</code> with an unmapped process type will fail until you add one here.
                    </p>
                ) : (
                    workflowMappings.map((mapping) => (
                        <div key={mapping.id} className="flex items-center justify-between gap-3 rounded-lg border border-white-light p-3 dark:border-white/10">
                            <div className="flex items-center gap-2.5">
                                <span className="grid h-8 w-8 shrink-0 place-content-center rounded-full bg-primary-light text-primary">
                                    <IconLink className="h-4 w-4" />
                                </span>
                                <span className="font-mono text-sm font-semibold">{mapping.processTypeKey}</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <Badge variant={mapping.active ? 'success' : 'secondary'}>{mapping.active ? 'Active' : 'Inactive'}</Badge>
                                <RowActionsMenu onEdit={() => openEdit(mapping)} onDelete={() => setDeleteTarget(mapping)} label={`Actions for ${mapping.processTypeKey} mapping`} />
                            </div>
                        </div>
                    ))
                )}
            </div>

            <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editTarget ? 'Edit Module Mapping' : 'Add Module Mapping'} size="sm">
                <form onSubmit={submitForm} className="space-y-4">
                    <div className="w-full">
                        <Input
                            id="processTypeKey"
                            label="Process Type Key *"
                            list="processTypeKeyOptions"
                            value={form.processTypeKey}
                            onChange={(e) => setForm((prev) => ({ ...prev, processTypeKey: e.target.value.toUpperCase() }))}
                            placeholder="e.g. LOAN"
                            helperText="Must exactly match the key the module's service hardcodes (e.g. LoanService.PROCESS_TYPE_KEY = LOAN) — it does not have to match a Module's id."
                            required
                        />
                        <datalist id="processTypeKeyOptions">
                            {modules.map((module) => (
                                <option key={module.id} value={module.textId}>
                                    {module.name}
                                </option>
                            ))}
                        </datalist>
                    </div>
                    <Checkbox id="mappingActive" label="Active" checked={form.active} onChange={(e) => setForm((prev) => ({ ...prev, active: e.target.checked }))} />
                    <div className="flex items-center justify-end gap-2 pt-2">
                        <Button type="button" variant="outline-primary" onClick={() => setModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={saving}>
                            {saving && <Spinner className="h-4 w-4 shrink-0 ltr:mr-2 rtl:ml-2" />}
                            {saving ? 'Saving…' : editTarget ? 'Save Changes' : 'Add Mapping'}
                        </Button>
                    </div>
                </form>
            </Modal>

            <ConfirmModal
                isOpen={!!deleteTarget}
                title="Delete Module Mapping"
                message={`Delete the mapping for "${deleteTarget?.processTypeKey}"? That module will no longer be able to start new processes until re-mapped.`}
                variant="danger"
                loading={deleting}
                onConfirm={confirmDelete}
                onCancel={() => setDeleteTarget(null)}
            />
        </div>
    );
};

export default WorkflowMappingsManager;
