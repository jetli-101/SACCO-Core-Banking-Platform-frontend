import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
    fetchModules,
    fetchModuleTypes,
    createModule,
    updateModule,
    deleteModule,
    clearModulesError,
    ModuleNode,
    ModuleRegisterPayload,
} from '@/store/slices/modules/modulesSlice';
import { showToast } from '@/store/slices/ui/toastSlice';
import DataGrid from '@/components/ui/DataGrid';
import StatCard from '@/components/ui/StatCard';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import IconPicker from '@/components/ui/IconPicker';
import Modal from '@/components/ui/Modal';
import Alert from '@/components/ui/Alert';
import RowActionsMenu from '@/components/ui/RowActionsMenu';
import IconPlus from '@/components/Icon/IconPlus';
import IconRefresh from '@/components/Icon/IconRefresh';
import IconMenuPages from '@/components/Icon/Menu/IconMenuPages';
import IconLayoutGrid from '@/components/Icon/IconLayoutGrid';
import IconBox from '@/components/Icon/IconBox';

const emptyForm: ModuleRegisterPayload = { name: '', textId: '', description: '', urlPath: '', icon: '', orderNo: 0, moduleTypeId: '', parentId: undefined };

const ModulesPage = () => {
    const dispatch = useAppDispatch();
    const { items, itemsLoading, itemsError, moduleTypes, saving, error } = useAppSelector((state) => state.modules);

    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState<ModuleNode | null>(null);
    const [viewOnly, setViewOnly] = useState(false);
    const [form, setForm] = useState<ModuleRegisterPayload>(emptyForm);

    useEffect(() => {
        dispatch(fetchModules());
        dispatch(fetchModuleTypes());
    }, [dispatch]);

    const moduleTypeName = (id: string) => moduleTypes.find((type) => type.id === id)?.name || '—';
    const moduleName = (id?: string) => (id ? items.find((item) => item.id === id)?.name || '—' : '—');

    // Orders modules parent-first-then-children (any depth) so both the table and the
    // "Parent Module" picker reflect the same nesting the sidebar renders.
    const hierarchy = useMemo(() => {
        const byParent = new Map<string, ModuleNode[]>();
        const topLevel: ModuleNode[] = [];
        items.forEach((item) => {
            if (item.parentId && items.some((other) => other.id === item.parentId)) {
                byParent.set(item.parentId, [...(byParent.get(item.parentId) || []), item]);
            } else {
                topLevel.push(item);
            }
        });

        const sortByOrder = (list: ModuleNode[]) => [...list].sort((a, b) => a.orderNo - b.orderNo);
        const result: { module: ModuleNode; depth: number }[] = [];
        const visited = new Set<string>();
        const walk = (list: ModuleNode[], depth: number) => {
            sortByOrder(list).forEach((module) => {
                if (visited.has(module.id)) return;
                visited.add(module.id);
                result.push({ module, depth });
                walk(byParent.get(module.id) || [], depth + 1);
            });
        };
        walk(topLevel, 0);
        return result;
    }, [items]);

    const depthById = useMemo(() => new Map(hierarchy.map((entry) => [entry.module.id, entry.depth])), [hierarchy]);
    const orderedModules = useMemo(() => hierarchy.map((entry) => entry.module), [hierarchy]);

    const stats = useMemo(
        () => ({
            total: items.length,
            topLevel: items.filter((item) => !item.parentId).length,
            typesUsed: new Set(items.map((item) => item.moduleTypeId)).size,
        }),
        [items]
    );

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

    const submitForm = async (event: React.FormEvent) => {
        event.preventDefault();
        const payload: ModuleRegisterPayload = { ...form, parentId: form.parentId || undefined };
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

    const handleDelete = async (module: ModuleNode) => {
        if (!window.confirm(`Delete module "${module.name}"? This cannot be undone.`)) return;
        try {
            await dispatch(deleteModule(module.id)).unwrap();
            dispatch(showToast({ variant: 'success', message: `Module "${module.name}" deleted successfully` }));
        } catch (err) {
            dispatch(showToast({ variant: 'danger', message: (err as { message?: string })?.message || 'Unable to delete module' }));
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
                    <span>Modules</span>
                </li>
            </ul>

            <div className="mt-4 flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-bold">Modules</h1>
                    <p className="text-white-dark">Manage the sidebar menu items members and staff see, grouped by module type</p>
                </div>
                <Button onClick={openCreate} disabled={moduleTypes.length === 0}>
                    <IconPlus className="h-4.5 w-4.5 shrink-0 ltr:mr-2 rtl:ml-2" />
                    New Module
                </Button>
            </div>

            {moduleTypes.length === 0 && !itemsLoading && (
                <div className="mt-4">
                    <Alert variant="warning">
                        No module types exist yet.{' '}
                        <Link href="/dashboard/module-types" className="font-semibold underline">
                            Create one first
                        </Link>{' '}
                        before adding modules.
                    </Alert>
                </div>
            )}

            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
                <StatCard label="Total Modules" value={stats.total} icon={<IconLayoutGrid className="h-4 w-4" />} />
                <StatCard label="Top-level Modules" value={stats.topLevel} helperText="No parent module" icon={<IconMenuPages className="h-4 w-4" />} />
                <StatCard label="Module Types Used" value={stats.typesUsed} icon={<IconBox className="h-4 w-4" />} />
            </div>

            {(error || itemsError) && (
                <div className="mt-5">
                    <Alert variant="danger" onClose={() => dispatch(clearModulesError())}>
                        {error || itemsError}
                    </Alert>
                </div>
            )}

            <div className="panel mt-5">
                <div className="mb-5">
                    <h5 className="text-lg font-semibold">Module Records</h5>
                    <p className="text-sm text-white-dark">View and manage all sidebar modules</p>
                </div>

                <DataGrid
                    columns={[
                        {
                            header: 'Actions',
                            accessor: (row: ModuleNode) => (
                                <RowActionsMenu onView={() => openView(row)} onEdit={() => openEdit(row)} onDelete={() => handleDelete(row)} label={`Actions for ${row.name}`} />
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
                    toolbarActions={
                        <Button
                            variant="outline-primary"
                            size="sm"
                            onClick={() => {
                                dispatch(fetchModules());
                                dispatch(fetchModuleTypes());
                            }}
                        >
                            <IconRefresh className="h-4 w-4 shrink-0 ltr:mr-2 rtl:ml-2" />
                            Refresh
                        </Button>
                    }
                />
            </div>

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
                            {hierarchy
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
                        value={form.urlPath}
                        onChange={(e) => setForm((prev) => ({ ...prev, urlPath: e.target.value }))}
                        placeholder="/dashboard/members/pending"
                        disabled={viewOnly}
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
                            <Button type="button" variant="outline-primary" onClick={() => setModalOpen(false)}>
                                Close
                            </Button>
                        ) : (
                            <>
                                <Button type="button" variant="outline-primary" onClick={() => setModalOpen(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={saving}>
                                    {saving ? 'Saving…' : editing ? 'Save Changes' : 'Create'}
                                </Button>
                            </>
                        )}
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default ModulesPage;
