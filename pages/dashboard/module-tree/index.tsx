import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchModules, fetchModuleTypes, createModule, updateModule, deleteModule, clearModulesError, ModuleNode, ModuleRegisterPayload } from '@/store/slices/modules/modulesSlice';
import { showToast } from '@/store/slices/ui/toastSlice';
import { useModuleHierarchy } from '@/hooks/useModuleHierarchy';
import Breadcrumb from '@/components/ui/Breadcrumb';
import StatCard from '@/components/ui/StatCard';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import IconPicker from '@/components/ui/IconPicker';
import Modal from '@/components/ui/Modal';
import ConfirmModal from '@/components/ui/ConfirmModal';
import Alert from '@/components/ui/Alert';
import Spinner from '@/components/ui/Spinner';
import PageLoader from '@/components/ui/PageLoader';
import IconSearch from '@/components/Icon/IconSearch';
import IconRefresh from '@/components/Icon/IconRefresh';
import IconPlus from '@/components/Icon/IconPlus';
import IconFolder from '@/components/Icon/IconFolder';
import IconFile from '@/components/Icon/IconFile';
import IconCaretDown from '@/components/Icon/IconCaretDown';
import IconGripVertical from '@/components/Icon/IconGripVertical';
import IconEye from '@/components/Icon/IconEye';
import IconEdit from '@/components/Icon/IconEdit';
import IconTrash from '@/components/Icon/IconTrash';
import IconLayoutGrid from '@/components/Icon/IconLayoutGrid';
import IconMenuPages from '@/components/Icon/Menu/IconMenuPages';
import IconBox from '@/components/Icon/IconBox';

const emptyForm: ModuleRegisterPayload = { name: '', textId: '', description: '', urlPath: '', icon: '', orderNo: 0, moduleTypeId: '', parentId: undefined };

const toPayload = (module: ModuleNode, overrides: Partial<ModuleRegisterPayload> = {}): ModuleRegisterPayload => ({
    name: module.name,
    textId: module.textId,
    description: module.description,
    urlPath: module.urlPath,
    icon: module.icon,
    orderNo: module.orderNo,
    moduleTypeId: module.moduleTypeId,
    parentId: module.parentId,
    ...overrides,
});

const ModuleTreePage = () => {
    const dispatch = useAppDispatch();
    const router = useRouter();
    const { itemsLoading, itemsError, moduleTypes, saving, error } = useAppSelector((state) => state.modules);
    const { flatItems, parentOptions, moduleTypeName, moduleHasChildren, stats } = useModuleHierarchy();

    const [search, setSearch] = useState('');
    const [expanded, setExpanded] = useState<Set<string>>(new Set());
    const [draggedId, setDraggedId] = useState<string | null>(null);
    const [reordering, setReordering] = useState(false);
    const [assignPromptName, setAssignPromptName] = useState<string | null>(null);

    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState<ModuleNode | null>(null);
    const [viewOnly, setViewOnly] = useState(false);
    const [form, setForm] = useState<ModuleRegisterPayload>(emptyForm);
    const [deleteTarget, setDeleteTarget] = useState<ModuleNode | null>(null);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        dispatch(fetchModules());
        dispatch(fetchModuleTypes());
    }, [dispatch]);

    const childrenByParent = useMemo(() => {
        const map = new Map<string, ModuleNode[]>();
        flatItems.forEach((item) => {
            if (item.parentId && flatItems.some((p) => p.id === item.parentId)) {
                map.set(item.parentId, [...(map.get(item.parentId) || []), item]);
            }
        });
        map.forEach((list, key) => map.set(key, [...list].sort((a, b) => a.orderNo - b.orderNo)));
        return map;
    }, [flatItems]);

    const rootModules = useMemo(
        () => flatItems.filter((item) => !item.parentId || !flatItems.some((p) => p.id === item.parentId)).sort((a, b) => a.orderNo - b.orderNo),
        [flatItems]
    );

    const siblingsOf = (module: ModuleNode): ModuleNode[] =>
        module.parentId && flatItems.some((p) => p.id === module.parentId) ? childrenByParent.get(module.parentId) || [] : rootModules.filter((m) => m.moduleTypeId === module.moduleTypeId);

    const isAncestor = (candidateId: string, moduleId: string): boolean => {
        let current = flatItems.find((m) => m.id === moduleId);
        while (current?.parentId) {
            if (current.parentId === candidateId) return true;
            current = flatItems.find((m) => m.id === current!.parentId);
        }
        return false;
    };

    const term = search.trim().toLowerCase();
    const branchMatches = (module: ModuleNode): boolean => {
        const self =
            module.name.toLowerCase().includes(term) ||
            module.textId.toLowerCase().includes(term) ||
            (module.description || '').toLowerCase().includes(term) ||
            module.id.toLowerCase().includes(term);
        return self || (childrenByParent.get(module.id) || []).some(branchMatches);
    };

    const visibleRoots = term ? rootModules.filter(branchMatches) : rootModules;

    const toggleExpand = (moduleId: string) => {
        setExpanded((prev) => {
            const next = new Set(prev);
            if (next.has(moduleId)) next.delete(moduleId);
            else next.add(moduleId);
            return next;
        });
    };

    const expandAll = () => setExpanded(new Set(flatItems.filter((m) => (childrenByParent.get(m.id) || []).length > 0).map((m) => m.id)));
    const collapseAll = () => setExpanded(new Set());

    const handleDrop = async (targetModule: ModuleNode) => {
        const draggedIdSnapshot = draggedId;
        setDraggedId(null);
        if (!draggedIdSnapshot || draggedIdSnapshot === targetModule.id) return;
        const dragged = flatItems.find((m) => m.id === draggedIdSnapshot);
        if (!dragged) return;

        if (dragged.moduleTypeId !== targetModule.moduleTypeId) {
            dispatch(showToast({ variant: 'danger', message: 'Modules can only be reordered or nested within the same module type' }));
            return;
        }
        if (isAncestor(dragged.id, targetModule.id)) {
            dispatch(showToast({ variant: 'danger', message: 'Cannot move a module into one of its own children' }));
            return;
        }

        const sameParent = (dragged.parentId || null) === (targetModule.parentId || null);

        if (!sameParent && targetModule.urlPath) {
            dispatch(showToast({ variant: 'danger', message: `"${targetModule.name}" has a URL path — clear it first before nesting modules under it` }));
            return;
        }

        setReordering(true);
        try {
            if (sameParent) {
                const siblings = siblingsOf(dragged);
                const without = siblings.filter((s) => s.id !== dragged.id);
                const targetIndex = without.findIndex((s) => s.id === targetModule.id);
                const reordered = [...without.slice(0, targetIndex), dragged, ...without.slice(targetIndex)];
                const changed = reordered.map((m, index) => ({ m, orderNo: index })).filter(({ m, orderNo }) => m.orderNo !== orderNo);

                for (const { m, orderNo } of changed) {
                    await dispatch(updateModule({ id: m.id, payload: toPayload(m, { orderNo }) })).unwrap();
                }
                dispatch(showToast({ variant: 'success', message: `Reordered "${dragged.name}"` }));
            } else {
                const newSiblings = childrenByParent.get(targetModule.id) || [];
                const orderNo = newSiblings.length ? Math.max(...newSiblings.map((s) => s.orderNo)) + 1 : 0;
                await dispatch(updateModule({ id: dragged.id, payload: toPayload(dragged, { orderNo, parentId: targetModule.id }) })).unwrap();
                setExpanded((prev) => new Set(prev).add(targetModule.id));
                dispatch(showToast({ variant: 'success', message: `Moved "${dragged.name}" under "${targetModule.name}"` }));
            }
            await dispatch(fetchModules());
        } catch (err) {
            dispatch(showToast({ variant: 'danger', message: (err as { message?: string })?.message || 'Unable to update module order' }));
        } finally {
            setReordering(false);
        }
    };

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
                setAssignPromptName(form.name);
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

    const typeBreakdown = moduleTypes.map((type) => ({ name: type.name, count: flatItems.filter((m) => m.moduleTypeId === type.id).length }));
    const navigableCount = flatItems.filter((m) => !!m.urlPath).length;
    const groupOnlyCount = flatItems.length - navigableCount;
    const parentModuleCount = flatItems.filter((m) => moduleHasChildren(m.id)).length;

    const renderRow = (module: ModuleNode, depth: number) => {
        const children = childrenByParent.get(module.id) || [];
        const hasChildren = children.length > 0;
        const isOpen = expanded.has(module.id) || !!term;
        const isDragging = draggedId === module.id;

        return (
            <div key={module.id}>
                <div
                    draggable={!term}
                    onDragStart={() => setDraggedId(module.id)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                        e.preventDefault();
                        handleDrop(module);
                    }}
                    onDragEnd={() => setDraggedId(null)}
                    className={`group flex items-center justify-between gap-2 border-b border-white-light py-2.5 pr-2 last:border-0 dark:border-white/10 ${isDragging ? 'opacity-40' : ''} ${
                        !term ? 'cursor-grab active:cursor-grabbing' : ''
                    }`}
                    style={{ paddingLeft: `${12 + depth * 24}px` }}
                >
                    <div className="flex min-w-0 items-center gap-2">
                        {!term && <IconGripVertical className="h-4 w-4 shrink-0 text-white-dark opacity-0 group-hover:opacity-100" />}
                        {hasChildren ? (
                            <button type="button" onClick={() => toggleExpand(module.id)} className="shrink-0 text-white-dark">
                                <IconCaretDown className={`h-3.5 w-3.5 transition-transform ${isOpen ? '' : '-rotate-90'}`} />
                            </button>
                        ) : (
                            <span className="inline-block w-3.5 shrink-0" />
                        )}
                        {hasChildren ? <IconFolder className="h-4 w-4 shrink-0 text-success" /> : <IconFile className="h-4 w-4 shrink-0 text-white-dark" />}
                        <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="font-semibold">{module.name}</span>
                                <span className="badge badge-outline-primary">#{module.orderNo}</span>
                                <span className="badge bg-success-light text-success">Active</span>
                            </div>
                            <div className="truncate text-xs text-white-dark">
                                {module.textId} • {moduleTypeName(module.moduleTypeId)}
                                {module.urlPath && <span className="ml-1.5 font-mono text-primary">{module.urlPath}</span>}
                            </div>
                        </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                        <button type="button" className="rounded p-1.5 text-white-dark hover:bg-primary-light hover:text-primary" onClick={() => openView(module)} title="View">
                            <IconEye className="h-4 w-4" />
                        </button>
                        <button type="button" className="rounded p-1.5 text-white-dark hover:bg-primary-light hover:text-primary" onClick={() => openEdit(module)} title="Edit">
                            <IconEdit className="h-4 w-4" />
                        </button>
                        <button type="button" className="rounded p-1.5 text-white-dark hover:bg-danger-light hover:text-danger" onClick={() => setDeleteTarget(module)} title="Delete">
                            <IconTrash className="h-4 w-4" />
                        </button>
                    </div>
                </div>
                {hasChildren && isOpen && children.map((child) => renderRow(child, depth + 1))}
            </div>
        );
    };

    if (itemsLoading && flatItems.length === 0) {
        return <PageLoader />;
    }

    return (
        <div>
            <Breadcrumb />

            <div className="mt-3">
                <h1 className="text-xl font-bold">Module Tree</h1>
                <p className="text-white-dark">Visualize and reorganize your module hierarchy with drag &amp; drop</p>
            </div>

            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard
                    label="Total Modules"
                    value={stats.total}
                    helperText={`${stats.topLevel} root, ${stats.total - stats.topLevel} child`}
                    icon={<IconLayoutGrid className="h-4 w-4" />}
                />
                <StatCard
                    label="Navigable Modules"
                    value={navigableCount}
                    helperText={`${groupOnlyCount} group headers`}
                    icon={<IconMenuPages className="h-4 w-4" />}
                    iconClassName="bg-success-light text-success"
                />
                <StatCard
                    label="Module Types"
                    value={stats.typesUsed}
                    helperText={typeBreakdown.map((t) => `${t.name}: ${t.count}`).join(', ') || undefined}
                    icon={<IconBox className="h-4 w-4" />}
                    iconClassName="bg-info-light text-info"
                />
                <StatCard
                    label="Parent Modules"
                    value={parentModuleCount}
                    helperText="Expand to reveal children"
                    icon={<IconFolder className="h-4 w-4" />}
                    iconClassName="bg-warning-light text-warning"
                />
            </div>

            {(error || itemsError) && (
                <div className="mt-3">
                    <Alert variant="danger" onClose={() => dispatch(clearModulesError())}>
                        {error || itemsError}
                    </Alert>
                </div>
            )}

            <div className="panel mt-3">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <h5 className="text-lg font-semibold">Module Hierarchy Tree (Drag &amp; Drop Enabled)</h5>
                    <div className="flex flex-wrap items-center gap-2">
                        <Button variant="outline-primary" size="sm" onClick={() => dispatch(fetchModules())}>
                            <IconRefresh className="h-4 w-4 shrink-0 ltr:mr-2 rtl:ml-2" />
                            Refresh
                        </Button>
                        <Button variant="outline-primary" size="sm" onClick={expandAll}>
                            Expand All
                        </Button>
                        <Button variant="outline-primary" size="sm" onClick={collapseAll}>
                            Collapse All
                        </Button>
                        <Button size="sm" onClick={openCreate} disabled={moduleTypes.length === 0}>
                            <IconPlus className="h-4.5 w-4.5 shrink-0 ltr:mr-2 rtl:ml-2" />
                            Add Module
                        </Button>
                    </div>
                </div>

                <div className="relative mb-4">
                    <input
                        type="text"
                        className="form-input pr-10"
                        placeholder="Search modules by name, description, or ID..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                    <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-white-dark">
                        <IconSearch className="h-4 w-4" />
                    </span>
                </div>

                <Alert variant="info" className="mb-4">
                    <span className="font-semibold">Drag &amp; Drop Instructions:</span> Drag any module to reorder it within its parent level, or drop it onto another module of the
                    same type to move it there as a child. Order numbers update automatically.
                </Alert>

                {moduleTypes.length === 0 && (
                    <Alert variant="warning" className="mb-4">
                        No module types exist yet.{' '}
                        <Link href="/dashboard/module-types" className="font-semibold underline">
                            Create one first
                        </Link>{' '}
                        before adding modules.
                    </Alert>
                )}

                {visibleRoots.length === 0 ? (
                    <p className="py-6 text-center text-sm text-white-dark">{term ? 'No modules match your search' : 'No modules yet'}</p>
                ) : (
                    <div className={reordering ? 'pointer-events-none opacity-60' : ''}>{visibleRoots.map((module) => renderRow(module, 0))}</div>
                )}
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
                title="Delete Module"
                message={`Delete module "${deleteTarget?.name}"? This cannot be undone.`}
                loading={deleting}
                onConfirm={confirmDelete}
                onCancel={() => setDeleteTarget(null)}
            />

            <ConfirmModal
                isOpen={!!assignPromptName}
                title="Assign Role Access"
                message={`"${assignPromptName}" won't appear in anyone's sidebar until it's granted to at least one role or user group. Go to Roles now to assign it?`}
                confirmLabel="Go to Roles"
                cancelLabel="Later"
                onConfirm={() => {
                    setAssignPromptName(null);
                    router.push('/dashboard/admin/roles');
                }}
                onCancel={() => setAssignPromptName(null)}
            />
        </div>
    );
};

export default ModuleTreePage;
