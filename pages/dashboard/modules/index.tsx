import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchModules, fetchModuleTypes, createModule, updateModule, deleteModule, clearModulesError, ModuleNode, ModuleRegisterPayload } from '@/store/slices/modules/modulesSlice';
import { showToast } from '@/store/slices/ui/toastSlice';
import { useModuleHierarchy } from '@/hooks/useModuleHierarchy';
import DataGrid from '@/components/ui/DataGrid';
import StatCard from '@/components/ui/StatCard';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import IconPicker from '@/components/ui/IconPicker';
import Modal from '@/components/ui/Modal';
import ConfirmModal from '@/components/ui/ConfirmModal';
import Alert from '@/components/ui/Alert';
import RowActionsMenu from '@/components/ui/RowActionsMenu';
import Breadcrumb from '@/components/ui/Breadcrumb';
import Spinner from '@/components/ui/Spinner';
import ModuleAccessModal from '@/components/modules/ModuleAccessModal';
import IconPlus from '@/components/Icon/IconPlus';
import IconMenuPages from '@/components/Icon/Menu/IconMenuPages';
import IconLayoutGrid from '@/components/Icon/IconLayoutGrid';
import IconBox from '@/components/Icon/IconBox';

const emptyForm: ModuleRegisterPayload = { name: '', textId: '', description: '', urlPath: '', icon: '', orderNo: 0, moduleTypeId: '', parentId: undefined };

const ModulesPage = () => {
    const dispatch = useAppDispatch();
    const { itemsLoading, itemsError, moduleTypes, saving, error } = useAppSelector((state) => state.modules);
    const { orderedModules, depthById, parentOptions, moduleTypeName, moduleName, moduleHasChildren, stats } = useModuleHierarchy();

    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState<ModuleNode | null>(null);
    const [viewOnly, setViewOnly] = useState(false);
    const [form, setForm] = useState<ModuleRegisterPayload>(emptyForm);
    const [deleteTarget, setDeleteTarget] = useState<ModuleNode | null>(null);
    const [deleting, setDeleting] = useState(false);
    const [accessTarget, setAccessTarget] = useState<{ id: string; name: string } | null>(null);

    useEffect(() => {
        dispatch(fetchModules());
        dispatch(fetchModuleTypes());
    }, [dispatch]);

    const openCreate = () => {
        setEditing(null);
        setViewOnly(false);
        setForm({ ...emptyForm, moduleTypeId: moduleTypes[0]?.id || '' });
        dispatch(clearModulesError());
        setModalOpen(true);
    };

    const openEdit = (module: ModuleNode) => {
        setEditing(module);
        setViewOnly(false);
        setForm({
            name: module.name,
            textId: module.textId,
            description: module.description || '',
            urlPath: module.urlPath || '',
            icon: module.icon || '',
            orderNo: module.orderNo,
            moduleTypeId: module.moduleTypeId,
            parentId: module.parentId,
        });
        dispatch(clearModulesError());
        setModalOpen(true);
    };

    const openView = (module: ModuleNode) => {
        setEditing(module);
        setViewOnly(true);
        setForm({
            name: module.name,
            textId: module.textId,
            description: module.description || '',
            urlPath: module.urlPath || '',
            icon: module.icon || '',
            orderNo: module.orderNo,
            moduleTypeId: module.moduleTypeId,
            parentId: module.parentId,
        });
        dispatch(clearModulesError());
        setModalOpen(true);
    };

    // Modules with children are just expandable groups in the sidebar (the parent button
    // toggles open/closed, see SidebarMenuItem) — they should never carry their own urlPath,
    // since clicking them isn't supposed to navigate anywhere.
    const editingHasChildren = !!editing && moduleHasChildren(editing.id);

    const submitForm = async (event: React.FormEvent) => {
        event.preventDefault();
        const payload: ModuleRegisterPayload = { ...form, parentId: form.parentId || undefined, urlPath: editingHasChildren ? '' : form.urlPath };
        try {
            if (editing) {
                await dispatch(updateModule({ id: editing.id, payload })).unwrap();
                dispatch(showToast({ variant: 'success', message: `Module "${form.name}" updated successfully` }));
            } else {
                await dispatch(createModule(payload)).unwrap();
                dispatch(showToast({ variant: 'success', message: `Module "${form.name}" created successfully` }));
            }
            setModalOpen(false);
        } catch (err) {
            dispatch(showToast({ variant: 'danger', message: (err as { message?: string })?.message || 'Unable to save module' }));
        }
    };

    const confirmDelete = async () => {
        if (!deleteTarget) return;
        setDeleting(true);
        try {
            await dispatch(deleteModule(deleteTarget.id)).unwrap();
            dispatch(showToast({ variant: 'success', message: `Module "${deleteTarget.name}" deleted successfully` }));
            setDeleteTarget(null);
        } catch (err) {
            dispatch(showToast({ variant: 'danger', message: (err as { message?: string })?.message || 'Unable to delete module' }));
        } finally {
            setDeleting(false);
        }
    };

    return (
        <div>
            <Breadcrumb />

            <div className="mt-3 flex flex-wrap items-start justify-between gap-2">
                <div>
                    <h1 className="text-xl font-bold">Modules</h1>
                    <p className="text-white-dark">Manage the sidebar menu items members and staff see, grouped by module type</p>
                </div>
                <Button onClick={openCreate} disabled={moduleTypes.length === 0}>
                    <IconPlus className="h-4.5 w-4.5 shrink-0 ltr:mr-2 rtl:ml-2" />
                    New Module
                </Button>
            </div>

            {moduleTypes.length === 0 && !itemsLoading && (
                <div className="mt-3">
                    <Alert variant="warning">
                        No module types exist yet.{' '}
                        <Link href="/dashboard/module-types" className="font-semibold underline">
                            Create one first
                        </Link>{' '}
                        before adding modules.
                    </Alert>
                </div>
            )}

            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                <StatCard label="Total Modules" value={stats.total} icon={<IconLayoutGrid className="h-4 w-4" />} />
                <StatCard label="Top-level Modules" value={stats.topLevel} helperText="No parent module" icon={<IconMenuPages className="h-4 w-4" />} />
                <StatCard label="Module Types Used" value={stats.typesUsed} icon={<IconBox className="h-4 w-4" />} />
            </div>

            {(error || itemsError) && (
                <div className="mt-3">
                    <Alert variant="danger" onClose={() => dispatch(clearModulesError())}>
                        {error || itemsError}
                    </Alert>
                </div>
            )}

            <DataGrid
                className="mt-3"
                title="Module Records"
                count={orderedModules.length}
                exportable
                columns={[
                    {
                        header: 'Actions',
                        accessor: (row: ModuleNode) => (
                            <RowActionsMenu onView={() => openView(row)} onEdit={() => openEdit(row)} onDelete={() => setDeleteTarget(row)} label={`Actions for ${row.name}`} />
                        ),
                    },
                    {
                        header: 'Name',
                        accessor: (row: ModuleNode) => (
                            <span style={{ paddingLeft: `${(depthById.get(row.id) || 0) * 20}px` }}>
                                {(depthById.get(row.id) || 0) > 0 && <span className="text-white-dark">↳ </span>}
                                {row.name}
                            </span>
                        ),
                    },
                    { header: 'Text ID', accessor: 'textId' },
                    { header: 'Module Type', accessor: (row: ModuleNode) => moduleTypeName(row.moduleTypeId) },
                    { header: 'Parent', accessor: (row: ModuleNode) => moduleName(row.parentId) },
                    { header: 'URL Path', accessor: (row: ModuleNode) => row.urlPath || '—' },
                    { header: 'Order No', accessor: 'orderNo' },
                ]}
                data={orderedModules}
                rowKey={(row) => row.id}
                searchKeys={['name', 'textId', 'urlPath']}
                searchPlaceholder="Search modules..."
                loading={itemsLoading}
                emptyMessage="No modules yet"
                onRefresh={() => Promise.all([dispatch(fetchModules()), dispatch(fetchModuleTypes())])}
            />

            <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={viewOnly ? 'View Module' : editing ? 'Edit Module' : 'New Module'} size="lg">
                <form onSubmit={submitForm} className="grid gap-4 sm:grid-cols-2">
                    <Input id="name" label="Module Name *" value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} required disabled={viewOnly} />
                    <Input
                        id="textId"
                        label="Text ID *"
                        value={form.textId}
                        onChange={(e) => setForm((prev) => ({ ...prev, textId: e.target.value }))}
                        placeholder="e.g. PENDING_APPROVALS"
                        required
                        disabled={viewOnly}
                    />

                    <div className="w-full">
                        <label htmlFor="moduleTypeId" className="mb-1.5 block text-sm font-semibold">
                            Module Type *
                        </label>
                        <select
                            id="moduleTypeId"
                            className="form-select"
                            value={form.moduleTypeId}
                            onChange={(e) => setForm((prev) => ({ ...prev, moduleTypeId: e.target.value }))}
                            required
                            disabled={viewOnly}
                        >
                            <option value="">Select…</option>
                            {moduleTypes.map((type) => (
                                <option key={type.id} value={type.id}>
                                    {type.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="w-full">
                        <label htmlFor="parentId" className="mb-1.5 block text-sm font-semibold">
                            Parent Module
                        </label>
                        <select
                            id="parentId"
                            className="form-select"
                            value={form.parentId || ''}
                            onChange={(e) => setForm((prev) => ({ ...prev, parentId: e.target.value || undefined }))}
                            disabled={viewOnly}
                        >
                            <option value="">None (top-level)</option>
                            {parentOptions
                                .filter((entry) => entry.module.id !== editing?.id)
                                .map((entry) => (
                                    <option key={entry.module.id} value={entry.module.id}>
                                        {'— '.repeat(entry.depth)}
                                        {entry.module.name}
                                    </option>
                                ))}
                        </select>
                    </div>

                    <Input
                        id="urlPath"
                        label="Module Url"
                        value={editingHasChildren ? '' : form.urlPath}
                        onChange={(e) => setForm((prev) => ({ ...prev, urlPath: e.target.value }))}
                        placeholder="/dashboard/members/pending"
                        disabled={viewOnly || editingHasChildren}
                        helperText={editingHasChildren ? "Parent modules don't link anywhere — only their children do" : undefined}
                    />
                    <IconPicker id="icon" label="Icon" value={form.icon || ''} onChange={(iconName) => setForm((prev) => ({ ...prev, icon: iconName }))} disabled={viewOnly} />
                    <Input
                        id="orderNo"
                        label="Order No"
                        type="number"
                        value={form.orderNo}
                        onChange={(e) => setForm((prev) => ({ ...prev, orderNo: Number(e.target.value) }))}
                        disabled={viewOnly}
                    />
                    <div className="sm:col-span-2">
                        <Input
                            id="description"
                            label="Description"
                            value={form.description}
                            onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                            disabled={viewOnly}
                        />
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2 sm:col-span-2">
                        {viewOnly ? (
                            <>
                                <Button type="button" variant="outline-primary" onClick={() => setAccessTarget({ id: editing!.id, name: editing!.name })}>
                                    Manage Access
                                </Button>
                                <Button type="button" variant="outline-primary" onClick={() => setModalOpen(false)}>
                                    Close
                                </Button>
                            </>
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
                title="Delete Module"
                message={`Delete module "${deleteTarget?.name}"? This cannot be undone.`}
                loading={deleting}
                onConfirm={confirmDelete}
                onCancel={() => setDeleteTarget(null)}
            />

            <ModuleAccessModal isOpen={!!accessTarget} moduleId={accessTarget?.id ?? null} moduleName={accessTarget?.name} onClose={() => setAccessTarget(null)} />
        </div>
    );
};

export default ModulesPage;
