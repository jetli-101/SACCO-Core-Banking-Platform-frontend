import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
    fetchChecklists,
    createChecklist,
    updateChecklist,
    deleteChecklist,
    addChecklistItem,
    updateChecklistItem,
    deleteChecklistItem,
    clearChecklistsError,
    Checklist,
    ChecklistItem,
    ChecklistPayload,
    ChecklistItemPayload,
} from '@/store/slices/workflows/checklistsSlice';
import { showToast } from '@/store/slices/ui/toastSlice';
import Breadcrumb from '@/components/ui/Breadcrumb';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import ConfirmModal from '@/components/ui/ConfirmModal';
import Alert from '@/components/ui/Alert';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import Checkbox from '@/components/ui/Checkbox';
import Spinner from '@/components/ui/Spinner';
import IconPlus from '@/components/Icon/IconPlus';
import IconEdit from '@/components/Icon/IconEdit';
import IconTrash from '@/components/Icon/IconTrash';
import IconSquareCheck from '@/components/Icon/IconSquareCheck';
import IconListCheck from '@/components/Icon/IconListCheck';
import IconRefresh from '@/components/Icon/IconRefresh';
import IconPrinter from '@/components/Icon/IconPrinter';
import IconLink from '@/components/Icon/IconLink';

const emptyChecklistForm = (): ChecklistPayload => ({ name: '', description: '', active: true });
const emptyItemForm = (orderNo: number): ChecklistItemPayload => ({ itemText: '', required: true, orderNo });

const ORG_NAME = 'SmoothSurf Sacco';

// Branded print of every checklist (letterhead matches components/ui/DataGrid.tsx) — a
// standalone routine rather than reuse of DataGrid's print since checklists render as
// nested lists, not a flat table.
const printAllChecklists = (checklists: Checklist[]) => {
    document.getElementById('checklist-print-content')?.remove();
    document.getElementById('checklist-print-style')?.remove();

    const container = document.createElement('div');
    container.id = 'checklist-print-content';
    container.innerHTML = `
        <div class="cl-print-header">
            <div class="cl-print-org">${ORG_NAME}</div>
            <div class="cl-print-title">Checklist Management</div>
        </div>
        <div class="cl-print-meta">
            <span>Total Checklists: ${checklists.length}</span>
            <span>Generated: ${new Date().toLocaleString()}</span>
        </div>
        ${checklists
            .map(
                (checklist) => `
            <div class="cl-print-checklist">
                <div class="cl-print-checklist-name">${checklist.name}${checklist.description ? ` — ${checklist.description}` : ''}</div>
                <table class="cl-print-table">
                    <thead><tr><th>#</th><th>Item</th><th>Mandatory</th></tr></thead>
                    <tbody>
                        ${[...checklist.items]
                            .sort((a, b) => a.orderNo - b.orderNo)
                            .map((item, index) => `<tr><td>${index + 1}</td><td>${item.itemText}</td><td>${item.required ? 'Yes' : 'No'}</td></tr>`)
                            .join('')}
                    </tbody>
                </table>
            </div>`
            )
            .join('')}
    `;

    const style = document.createElement('style');
    style.id = 'checklist-print-style';
    style.textContent = `
        @media print {
            body * { visibility: hidden; }
            #checklist-print-content, #checklist-print-content * { visibility: visible; }
            #checklist-print-content { position: absolute; inset: 0; padding: 20px; font-family: Arial, Helvetica, sans-serif; }
            @page { size: A4; margin: 1.2cm; }
            .cl-print-header { border-bottom: 2px solid #1e3a8a; padding-bottom: 10px; margin-bottom: 10px; }
            .cl-print-org { font-size: 14px; font-weight: 700; color: #1e3a8a; }
            .cl-print-title { font-size: 18px; font-weight: 700; text-transform: uppercase; }
            .cl-print-meta { display: flex; justify-content: space-between; font-size: 9pt; color: #4b5563; margin-bottom: 16px; }
            .cl-print-checklist { margin-bottom: 18px; }
            .cl-print-checklist-name { font-size: 12px; font-weight: 700; margin-bottom: 6px; }
            .cl-print-table { width: 100%; border-collapse: collapse; font-size: 9pt; }
            .cl-print-table th, .cl-print-table td { border: 1px solid #e5e7eb; padding: 5px 8px; text-align: left; }
            .cl-print-table th { background: #1e3a8a; color: white; }
        }
    `;

    document.body.appendChild(container);
    document.head.appendChild(style);
    window.print();

    const cleanup = () => {
        container.remove();
        style.remove();
        window.removeEventListener('afterprint', cleanup);
    };
    window.addEventListener('afterprint', cleanup);
    setTimeout(cleanup, 10000);
};

const WorkflowChecklistsPage = () => {
    const dispatch = useAppDispatch();
    const { checklists, loading, error, saving } = useAppSelector((state) => state.checklists);

    const [selectedId, setSelectedId] = useState<string>('');

    const [checklistModalOpen, setChecklistModalOpen] = useState(false);
    const [editingChecklist, setEditingChecklist] = useState<Checklist | null>(null);
    const [checklistForm, setChecklistForm] = useState<ChecklistPayload>(emptyChecklistForm());
    const [deleteChecklistTarget, setDeleteChecklistTarget] = useState<Checklist | null>(null);
    const [deletingChecklist, setDeletingChecklist] = useState(false);

    const [itemModalOpen, setItemModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<ChecklistItem | null>(null);
    const [itemForm, setItemForm] = useState<ChecklistItemPayload>(emptyItemForm(0));
    const [deleteItemTarget, setDeleteItemTarget] = useState<ChecklistItem | null>(null);
    const [deletingItem, setDeletingItem] = useState(false);

    useEffect(() => {
        dispatch(fetchChecklists());
    }, [dispatch]);

    useEffect(() => {
        if (!selectedId && checklists.length > 0) setSelectedId(checklists[0].id);
    }, [checklists, selectedId]);

    const selectedChecklist = useMemo(() => checklists.find((checklist) => checklist.id === selectedId) || null, [checklists, selectedId]);

    const openCreateChecklist = () => {
        setEditingChecklist(null);
        setChecklistForm(emptyChecklistForm());
        dispatch(clearChecklistsError());
        setChecklistModalOpen(true);
    };

    const openEditChecklist = (checklist: Checklist) => {
        setEditingChecklist(checklist);
        setChecklistForm({ name: checklist.name, description: checklist.description || '', active: checklist.active });
        dispatch(clearChecklistsError());
        setChecklistModalOpen(true);
    };

    const submitChecklist = async (event: React.FormEvent) => {
        event.preventDefault();
        try {
            if (editingChecklist) {
                await dispatch(updateChecklist({ id: editingChecklist.id, payload: checklistForm })).unwrap();
                dispatch(showToast({ variant: 'success', message: `Checklist "${checklistForm.name}" updated successfully` }));
            } else {
                const created = await dispatch(createChecklist(checklistForm)).unwrap();
                dispatch(showToast({ variant: 'success', message: `Checklist "${checklistForm.name}" created successfully` }));
                setSelectedId(created.id);
            }
            setChecklistModalOpen(false);
        } catch (err) {
            dispatch(showToast({ variant: 'danger', message: (err as { message?: string })?.message || 'Unable to save checklist' }));
        }
    };

    const confirmDeleteChecklist = async () => {
        if (!deleteChecklistTarget) return;
        setDeletingChecklist(true);
        try {
            await dispatch(deleteChecklist(deleteChecklistTarget.id)).unwrap();
            dispatch(showToast({ variant: 'success', message: `Checklist "${deleteChecklistTarget.name}" deleted successfully` }));
            if (selectedId === deleteChecklistTarget.id) setSelectedId('');
            setDeleteChecklistTarget(null);
        } catch (err) {
            dispatch(showToast({ variant: 'danger', message: (err as { message?: string })?.message || 'Unable to delete checklist' }));
        } finally {
            setDeletingChecklist(false);
        }
    };

    const openAddItem = () => {
        if (!selectedChecklist) return;
        setEditingItem(null);
        setItemForm(emptyItemForm(selectedChecklist.items.length));
        dispatch(clearChecklistsError());
        setItemModalOpen(true);
    };

    const openEditItem = (item: ChecklistItem) => {
        setEditingItem(item);
        setItemForm({ itemText: item.itemText, required: item.required, orderNo: item.orderNo });
        dispatch(clearChecklistsError());
        setItemModalOpen(true);
    };

    const submitItem = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!selectedChecklist) return;
        try {
            if (editingItem) {
                await dispatch(updateChecklistItem({ checklistId: selectedChecklist.id, itemId: editingItem.id, payload: itemForm })).unwrap();
                dispatch(showToast({ variant: 'success', message: 'Checklist item updated successfully' }));
            } else {
                await dispatch(addChecklistItem({ checklistId: selectedChecklist.id, payload: itemForm })).unwrap();
                dispatch(showToast({ variant: 'success', message: 'Checklist item added successfully' }));
            }
            setItemModalOpen(false);
        } catch (err) {
            dispatch(showToast({ variant: 'danger', message: (err as { message?: string })?.message || 'Unable to save checklist item' }));
        }
    };

    const confirmDeleteItem = async () => {
        if (!selectedChecklist || !deleteItemTarget) return;
        setDeletingItem(true);
        try {
            await dispatch(deleteChecklistItem({ checklistId: selectedChecklist.id, itemId: deleteItemTarget.id })).unwrap();
            dispatch(showToast({ variant: 'success', message: 'Checklist item deleted successfully' }));
            setDeleteItemTarget(null);
        } catch (err) {
            dispatch(showToast({ variant: 'danger', message: (err as { message?: string })?.message || 'Unable to delete checklist item' }));
        } finally {
            setDeletingItem(false);
        }
    };

    return (
        <div>
            <Breadcrumb />

            <div className="mt-3 flex flex-wrap items-start justify-between gap-2">
                <div>
                    <h1 className="text-xl font-bold">Checklist Management</h1>
                    <p className="text-white-dark">Create reusable checklists and link them to whichever workflow stages need them</p>
                    <p className="mt-1 text-xs text-white-dark">
                        Looking to gate a specific transition behind a checklist/approval comment instead?{' '}
                        <Link href="/dashboard/admin/workflows/transition-gates" className="text-primary hover:underline">
                            Manage Transition Approval Gates
                        </Link>
                        .
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <Button onClick={openCreateChecklist}>
                        <IconPlus className="h-4.5 w-4.5 shrink-0 ltr:mr-2 rtl:ml-2" />
                        New Checklist
                    </Button>
                    <Button variant="outline-primary" onClick={openAddItem} disabled={!selectedChecklist}>
                        <IconPlus className="h-4.5 w-4.5 shrink-0 ltr:mr-2 rtl:ml-2" />
                        Add Item
                    </Button>
                    <Button variant="outline-primary" onClick={() => printAllChecklists(checklists)} disabled={checklists.length === 0}>
                        <IconPrinter className="h-4.5 w-4.5 shrink-0 ltr:mr-2 rtl:ml-2" />
                        Print All
                    </Button>
                    <Button variant="outline-primary" href="/dashboard/admin/workflows/checklists/linking">
                        <IconLink className="h-4.5 w-4.5 shrink-0 ltr:mr-2 rtl:ml-2" />
                        Link Checklists to Workflows
                    </Button>
                </div>
            </div>

            {error && (
                <div className="mt-3">
                    <Alert variant="danger" onClose={() => dispatch(clearChecklistsError())}>
                        {error}
                    </Alert>
                </div>
            )}

            <div className="panel mt-3 !p-0">
                <div className="grid grid-cols-1 lg:grid-cols-3">
                    <div className="border-b border-white-light p-4 dark:border-white/10 lg:border-b-0 lg:border-r">
                        <div className="flex items-center gap-1.5 font-semibold">
                            <IconListCheck className="h-4.5 w-4.5" />
                            Checklists
                        </div>

                        {loading ? (
                            <div className="flex min-h-[100px] items-center justify-center gap-2">
                                <Spinner className="h-5 w-5 text-primary" />
                            </div>
                        ) : checklists.length === 0 ? (
                            <p className="mt-3 text-sm text-white-dark">No checklists yet — create one to get started.</p>
                        ) : (
                            <ul className="mt-3 max-h-[500px] space-y-1 overflow-y-auto">
                                {checklists.map((checklist) => (
                                    <li key={checklist.id}>
                                        <button
                                            type="button"
                                            onClick={() => setSelectedId(checklist.id)}
                                            className={`flex w-full flex-col rounded-md px-3 py-2 text-left text-sm transition-colors ${
                                                selectedChecklist?.id === checklist.id
                                                    ? 'bg-primary font-semibold text-white'
                                                    : 'text-dark hover:bg-primary-light hover:text-primary dark:text-white-light dark:hover:bg-primary/20'
                                            }`}
                                        >
                                            <span className="truncate">{checklist.name}</span>
                                            <span className={`text-xs ${selectedChecklist?.id === checklist.id ? 'text-white/80' : 'text-white-dark'}`}>
                                                {checklist.totalItems} item{checklist.totalItems === 1 ? '' : 's'}
                                            </span>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    <div className="p-5 lg:col-span-2">
                        {!selectedChecklist ? (
                            <p className="py-10 text-center text-white-dark">Select a checklist on the left, or create a new one.</p>
                        ) : (
                            <>
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <div>
                                        <h5 className="text-lg font-semibold">{selectedChecklist.name}</h5>
                                        {selectedChecklist.description && <p className="text-sm text-white-dark">{selectedChecklist.description}</p>}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button size="sm" variant="outline-primary" onClick={() => dispatch(fetchChecklists())}>
                                            <IconRefresh className="h-4 w-4 shrink-0 ltr:mr-1.5 rtl:ml-1.5" />
                                            Refresh
                                        </Button>
                                        <Button size="sm" variant="outline-primary" onClick={openAddItem}>
                                            <IconPlus className="h-4 w-4 shrink-0 ltr:mr-1.5 rtl:ml-1.5" />
                                            Add Item
                                        </Button>
                                        <Button size="sm" onClick={() => openEditChecklist(selectedChecklist)}>
                                            <IconEdit className="h-4 w-4 shrink-0 ltr:mr-1.5 rtl:ml-1.5" />
                                            Edit Checklist
                                        </Button>
                                    </div>
                                </div>

                                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                                    <div className="rounded-md bg-[#f6f8fa] p-3 dark:bg-[#1b2e4b]">
                                        <div className="text-xs font-semibold uppercase text-white-dark">Total Items</div>
                                        <div className="mt-1 text-xl font-bold">{selectedChecklist.totalItems}</div>
                                    </div>
                                    <div className="rounded-md bg-[#f6f8fa] p-3 dark:bg-[#1b2e4b]">
                                        <div className="text-xs font-semibold uppercase text-white-dark">Mandatory Items</div>
                                        <div className="mt-1 text-xl font-bold">{selectedChecklist.mandatoryItems}</div>
                                    </div>
                                    <div className="rounded-md bg-[#f6f8fa] p-3 dark:bg-[#1b2e4b]">
                                        <div className="text-xs font-semibold uppercase text-white-dark">Used in Stages</div>
                                        <div className="mt-1 text-xl font-bold">{selectedChecklist.usedInStagesCount}</div>
                                    </div>
                                </div>

                                <div className="mt-5">
                                    <div className="text-sm font-semibold">Checklist Items</div>
                                    {selectedChecklist.items.length === 0 ? (
                                        <p className="mt-2 text-sm text-white-dark">No items yet — add one above.</p>
                                    ) : (
                                        <ul className="mt-2 divide-y divide-white-light dark:divide-white/10">
                                            {[...selectedChecklist.items]
                                                .sort((a, b) => a.orderNo - b.orderNo)
                                                .map((item) => (
                                                    <li key={item.id} className="flex items-center justify-between gap-2 py-2.5">
                                                        <div className="flex items-start gap-2">
                                                            <IconSquareCheck className="mt-0.5 h-4.5 w-4.5 shrink-0 text-primary" />
                                                            <div>
                                                                <div className="text-sm">{item.itemText}</div>
                                                                <div className="text-xs text-white-dark">
                                                                    {item.required ? 'Mandatory' : 'Optional'} • Order: {item.orderNo + 1}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="flex shrink-0 items-center gap-3">
                                                            <button type="button" className="text-white-dark hover:text-primary" onClick={() => openEditItem(item)} aria-label={`Edit ${item.itemText}`}>
                                                                <IconEdit className="h-4.5 w-4.5" />
                                                            </button>
                                                            <button
                                                                type="button"
                                                                className="text-white-dark hover:text-danger"
                                                                onClick={() => setDeleteItemTarget(item)}
                                                                aria-label={`Delete ${item.itemText}`}
                                                            >
                                                                <IconTrash className="h-4.5 w-4.5" />
                                                            </button>
                                                        </div>
                                                    </li>
                                                ))}
                                        </ul>
                                    )}
                                </div>

                                <div className="mt-5 flex justify-end">
                                    <button type="button" className="text-xs text-danger hover:underline" onClick={() => setDeleteChecklistTarget(selectedChecklist)}>
                                        Delete this checklist
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            <Modal isOpen={checklistModalOpen} onClose={() => setChecklistModalOpen(false)} title={editingChecklist ? 'Edit Checklist' : 'New Checklist'}>
                <form onSubmit={submitChecklist} className="space-y-4">
                    <Input
                        id="checklist-name"
                        label="Checklist Name *"
                        value={checklistForm.name}
                        onChange={(e) => setChecklistForm((prev) => ({ ...prev, name: e.target.value }))}
                        placeholder="e.g. Claims checklist"
                        required
                    />
                    <Textarea
                        id="checklist-description"
                        label="Description"
                        rows={3}
                        value={checklistForm.description}
                        onChange={(e) => setChecklistForm((prev) => ({ ...prev, description: e.target.value }))}
                    />
                    <Checkbox
                        id="checklist-active"
                        label="Active"
                        checked={checklistForm.active}
                        onChange={(e) => setChecklistForm((prev) => ({ ...prev, active: e.target.checked }))}
                    />
                    <div className="flex items-center justify-end gap-2 pt-2">
                        <Button type="button" variant="outline-primary" onClick={() => setChecklistModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={saving}>
                            {saving && <Spinner className="h-4 w-4 shrink-0 ltr:mr-2 rtl:ml-2" />}
                            {editingChecklist ? 'Save Changes' : 'Create Checklist'}
                        </Button>
                    </div>
                </form>
            </Modal>

            <Modal isOpen={itemModalOpen} onClose={() => setItemModalOpen(false)} title={editingItem ? 'Edit Checklist Item' : 'Add Checklist Item'}>
                <form onSubmit={submitItem} className="space-y-4">
                    <Input
                        id="item-text"
                        label="Item Text *"
                        value={itemForm.itemText}
                        onChange={(e) => setItemForm((prev) => ({ ...prev, itemText: e.target.value }))}
                        placeholder="e.g. Verify all documents added"
                        required
                    />
                    <Input
                        id="item-order"
                        type="number"
                        min={0}
                        label="Order"
                        value={itemForm.orderNo}
                        onChange={(e) => setItemForm((prev) => ({ ...prev, orderNo: Number(e.target.value) }))}
                    />
                    <Checkbox id="item-required" label="Mandatory" checked={itemForm.required} onChange={(e) => setItemForm((prev) => ({ ...prev, required: e.target.checked }))} />
                    <div className="flex items-center justify-end gap-2 pt-2">
                        <Button type="button" variant="outline-primary" onClick={() => setItemModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={saving}>
                            {saving && <Spinner className="h-4 w-4 shrink-0 ltr:mr-2 rtl:ml-2" />}
                            {editingItem ? 'Save Changes' : 'Add Item'}
                        </Button>
                    </div>
                </form>
            </Modal>

            <ConfirmModal
                isOpen={!!deleteChecklistTarget}
                title="Delete Checklist"
                message={`Delete checklist "${deleteChecklistTarget?.name}"? This removes it from every stage it's linked to and cannot be undone.`}
                loading={deletingChecklist}
                onConfirm={confirmDeleteChecklist}
                onCancel={() => setDeleteChecklistTarget(null)}
            />

            <ConfirmModal
                isOpen={!!deleteItemTarget}
                title="Delete Checklist Item"
                message={`Delete item "${deleteItemTarget?.itemText}"? This cannot be undone.`}
                loading={deletingItem}
                onConfirm={confirmDeleteItem}
                onCancel={() => setDeleteItemTarget(null)}
            />
        </div>
    );
};

export default WorkflowChecklistsPage;
