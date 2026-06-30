import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchModuleTypes, createModuleType, updateModuleType, deleteModuleType, clearModulesError, ModuleType, ModuleTypePayload } from '@/store/slices/modules/modulesSlice';
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
import Spinner from '@/components/ui/Spinner';
import IconPlus from '@/components/Icon/IconPlus';
import IconMenuPages from '@/components/Icon/Menu/IconMenuPages';

const emptyForm: ModuleTypePayload = { name: '', textId: '', orderNo: 0, description: '' };

const ModuleTypesPage = () => {
    const dispatch = useAppDispatch();
    const { moduleTypes, moduleTypesLoading, moduleTypesError, saving, error } = useAppSelector((state) => state.modules);

    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState<ModuleType | null>(null);
    const [viewOnly, setViewOnly] = useState(false);
    const [form, setForm] = useState<ModuleTypePayload>(emptyForm);
    const [deleteTarget, setDeleteTarget] = useState<ModuleType | null>(null);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        dispatch(fetchModuleTypes());
    }, [dispatch]);

    const openCreate = () => {
        setEditing(null);
        setViewOnly(false);
        setForm(emptyForm);
        dispatch(clearModulesError());
        setModalOpen(true);
    };

    const openEdit = (type: ModuleType) => {
        setEditing(type);
        setViewOnly(false);
        setForm({ name: type.name, textId: type.textId, orderNo: type.orderNo, description: type.description || '' });
        dispatch(clearModulesError());
        setModalOpen(true);
    };

    const openView = (type: ModuleType) => {
        setEditing(type);
        setViewOnly(true);
        setForm({ name: type.name, textId: type.textId, orderNo: type.orderNo, description: type.description || '' });
        dispatch(clearModulesError());
        setModalOpen(true);
    };

    const submitForm = async (event: React.FormEvent) => {
        event.preventDefault();
        try {
            if (editing) {
                await dispatch(updateModuleType({ id: editing.id, payload: form })).unwrap();
                dispatch(showToast({ variant: 'success', message: `Module type "${form.name}" updated successfully` }));
            } else {
                await dispatch(createModuleType(form)).unwrap();
                dispatch(showToast({ variant: 'success', message: `Module type "${form.name}" created successfully` }));
            }
            setModalOpen(false);
        } catch (err) {
            dispatch(showToast({ variant: 'danger', message: (err as { message?: string })?.message || 'Unable to save module type' }));
        }
    };

    const confirmDelete = async () => {
        if (!deleteTarget) return;
        setDeleting(true);
        try {
            await dispatch(deleteModuleType(deleteTarget.id)).unwrap();
            dispatch(showToast({ variant: 'success', message: `Module type "${deleteTarget.name}" deleted successfully` }));
            setDeleteTarget(null);
        } catch (err) {
            dispatch(showToast({ variant: 'danger', message: (err as { message?: string })?.message || 'Unable to delete module type' }));
        } finally {
            setDeleting(false);
        }
    };

    return (
        <div>
            <Breadcrumb />

            <div className="mt-3 flex flex-wrap items-start justify-between gap-2">
                <div>
                    <h1 className="text-xl font-bold">Module Types</h1>
                    <p className="text-white-dark">Manage the top-level navigation groups that sidebar modules belong to</p>
                </div>
                <Button onClick={openCreate}>
                    <IconPlus className="h-4.5 w-4.5 shrink-0 ltr:mr-2 rtl:ml-2" />
                    New Module Type
                </Button>
            </div>

            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:max-w-sm">
                <StatCard label="Total Module Types" value={moduleTypes.length} icon={<IconMenuPages className="h-4 w-4" />} />
            </div>

            {(error || moduleTypesError) && (
                <div className="mt-3">
                    <Alert variant="danger" onClose={() => dispatch(clearModulesError())}>
                        {error || moduleTypesError}
                    </Alert>
                </div>
            )}

            <DataGrid
                className="mt-3"
                title="Module Type Records"
                count={moduleTypes.length}
                columns={[
                    {
                        header: 'Actions',
                        accessor: (row: ModuleType) => (
                            <RowActionsMenu onView={() => openView(row)} onEdit={() => openEdit(row)} onDelete={() => setDeleteTarget(row)} label={`Actions for ${row.name}`} />
                        ),
                    },
                    { header: 'Name', accessor: 'name' },
                    { header: 'Text ID', accessor: 'textId' },
                    { header: 'Order No', accessor: 'orderNo' },
                    { header: 'Description', accessor: (row: ModuleType) => row.description || '—' },
                ]}
                data={moduleTypes}
                rowKey={(row) => row.id}
                searchKeys={['name', 'textId', 'description']}
                searchPlaceholder="Search module types..."
                loading={moduleTypesLoading}
                emptyMessage="No module types yet"
                onRefresh={() => dispatch(fetchModuleTypes())}
            />

            <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={viewOnly ? 'View Module Type' : editing ? 'Edit Module Type' : 'New Module Type'}>
                <form onSubmit={submitForm} className="space-y-4">
                    <Input id="name" label="Name *" value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} required disabled={viewOnly} />
                    <Input
                        id="textId"
                        label="Text ID *"
                        value={form.textId}
                        onChange={(e) => setForm((prev) => ({ ...prev, textId: e.target.value }))}
                        placeholder="e.g. MEMBER_MGMT"
                        required
                        disabled={viewOnly}
                    />
                    <Input
                        id="orderNo"
                        label="Order No"
                        type="number"
                        value={form.orderNo}
                        onChange={(e) => setForm((prev) => ({ ...prev, orderNo: Number(e.target.value) }))}
                        disabled={viewOnly}
                    />
                    <Input
                        id="description"
                        label="Description"
                        value={form.description}
                        onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                        disabled={viewOnly}
                    />

                    <div className="flex items-center justify-end gap-2 pt-2">
                        {viewOnly ? (
                            <Button type="button" variant="outline-primary" onClick={() => setModalOpen(false)}>
                                Close
                            </Button>
                        ) : (
                            <>
                                <Button type="button" variant="outline-primary" onClick={() => setModalOpen(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={saving}>
                                    {saving && <Spinner className="h-4 w-4 shrink-0 ltr:mr-2 rtl:ml-2" />}
                                    {saving ? 'Saving…' : editing ? 'Save Changes' : 'Create'}
                                </Button>
                            </>
                        )}
                    </div>
                </form>
            </Modal>

            <ConfirmModal
                isOpen={!!deleteTarget}
                title="Delete Module Type"
                message={`Delete module type "${deleteTarget?.name}"? This cannot be undone.`}
                loading={deleting}
                onConfirm={confirmDelete}
                onCancel={() => setDeleteTarget(null)}
            />
        </div>
    );
};

export default ModuleTypesPage;
