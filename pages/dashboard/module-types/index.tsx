import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchModuleTypes, createModuleType, updateModuleType, deleteModuleType, clearModulesError, ModuleType, ModuleTypePayload } from '@/store/slices/modules/modulesSlice';
import { showToast } from '@/store/slices/ui/toastSlice';
import DataGrid from '@/components/ui/DataGrid';
import StatCard from '@/components/ui/StatCard';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import Alert from '@/components/ui/Alert';
import IconPlus from '@/components/Icon/IconPlus';
import IconRefresh from '@/components/Icon/IconRefresh';
import IconEdit from '@/components/Icon/IconEdit';
import IconTrash from '@/components/Icon/IconTrash';
import IconMenuPages from '@/components/Icon/Menu/IconMenuPages';

const emptyForm: ModuleTypePayload = { name: '', textId: '', orderNo: 0, description: '' };

const ModuleTypesPage = () => {
    const dispatch = useAppDispatch();
    const { moduleTypes, moduleTypesLoading, moduleTypesError, saving, error } = useAppSelector((state) => state.modules);

    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState<ModuleType | null>(null);
    const [form, setForm] = useState<ModuleTypePayload>(emptyForm);

    useEffect(() => {
        dispatch(fetchModuleTypes());
    }, [dispatch]);

    const openCreate = () => {
        setEditing(null);
        setForm(emptyForm);
        dispatch(clearModulesError());
        setModalOpen(true);
    };

    const openEdit = (type: ModuleType) => {
        setEditing(type);
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

    const handleDelete = async (type: ModuleType) => {
        if (!window.confirm(`Delete module type "${type.name}"? This cannot be undone.`)) return;
        try {
            await dispatch(deleteModuleType(type.id)).unwrap();
            dispatch(showToast({ variant: 'success', message: `Module type "${type.name}" deleted successfully` }));
        } catch (err) {
            dispatch(showToast({ variant: 'danger', message: (err as { message?: string })?.message || 'Unable to delete module type' }));
        }
    };

    return (
        <div>
            <ul className="flex space-x-2 rtl:space-x-reverse">
                <li>
                    <Link href="/dashboard" className="text-primary hover:underline">
                        Dashboard
                    </Link>
                </li>
                <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2">
                    <span>Module Types</span>
                </li>
            </ul>

            <div className="mt-4 flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-bold">Module Types</h1>
                    <p className="text-white-dark">Manage the top-level navigation groups that sidebar modules belong to</p>
                </div>
                <Button onClick={openCreate}>
                    <IconPlus className="h-4.5 w-4.5 shrink-0 ltr:mr-2 rtl:ml-2" />
                    New Module Type
                </Button>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:max-w-sm">
                <StatCard label="Total Module Types" value={moduleTypes.length} icon={<IconMenuPages className="h-4 w-4" />} />
            </div>

            {(error || moduleTypesError) && (
                <div className="mt-5">
                    <Alert variant="danger" onClose={() => dispatch(clearModulesError())}>
                        {error || moduleTypesError}
                    </Alert>
                </div>
            )}

            <div className="panel mt-5">
                <div className="mb-5">
                    <h5 className="text-lg font-semibold">Module Type Records</h5>
                    <p className="text-sm text-white-dark">View and manage all module type groups</p>
                </div>

                <DataGrid
                    columns={[
                        {
                            header: 'Actions',
                            accessor: (row: ModuleType) => (
                                <div className="flex items-center gap-2">
                                    <button type="button" className="hover:text-primary" onClick={() => openEdit(row)} aria-label={`Edit ${row.name}`}>
                                        <IconEdit className="h-4.5 w-4.5" />
                                    </button>
                                    <button type="button" className="hover:text-danger" onClick={() => handleDelete(row)} aria-label={`Delete ${row.name}`}>
                                        <IconTrash className="h-4.5 w-4.5" />
                                    </button>
                                </div>
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
                    toolbarActions={
                        <Button variant="outline-primary" size="sm" onClick={() => dispatch(fetchModuleTypes())}>
                            <IconRefresh className="h-4 w-4 shrink-0 ltr:mr-2 rtl:ml-2" />
                            Refresh
                        </Button>
                    }
                />
            </div>

            <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Module Type' : 'New Module Type'}>
                <form onSubmit={submitForm} className="space-y-4">
                    <Input id="name" label="Name *" value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} required />
                    <Input id="textId" label="Text ID *" value={form.textId} onChange={(e) => setForm((prev) => ({ ...prev, textId: e.target.value }))} placeholder="e.g. MEMBER_MGMT" required />
                    <Input
                        id="orderNo"
                        label="Order No"
                        type="number"
                        value={form.orderNo}
                        onChange={(e) => setForm((prev) => ({ ...prev, orderNo: Number(e.target.value) }))}
                    />
                    <Input id="description" label="Description" value={form.description} onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))} />

                    <div className="flex items-center justify-end gap-2 pt-2">
                        <Button type="button" variant="outline-primary" onClick={() => setModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={saving}>
                            {saving ? 'Saving…' : editing ? 'Save Changes' : 'Create'}
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default ModuleTypesPage;
