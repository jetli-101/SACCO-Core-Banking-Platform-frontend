import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
    createSavingsProduct,
    deleteSavingsProduct,
    fetchSavingsProducts,
    SavingsProduct,
    SavingsProductPayload,
    SavingsProductType,
    toggleSavingsProductActive,
    updateSavingsProduct,
} from '@/store/slices/savings/savingsProductsSlice';
import { showToast } from '@/store/slices/ui/toastSlice';
import Breadcrumb from '@/components/ui/Breadcrumb';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import Modal from '@/components/ui/Modal';
import ConfirmModal from '@/components/ui/ConfirmModal';
import Spinner from '@/components/ui/Spinner';
import PageLoader from '@/components/ui/PageLoader';
import IconPlus from '@/components/Icon/IconPlus';
import IconPencil from '@/components/Icon/IconPencil';
import IconTrash from '@/components/Icon/IconTrash';
import IconCashBanknotes from '@/components/Icon/IconCashBanknotes';
import IconStar from '@/components/Icon/IconStar';
import IconClock from '@/components/Icon/IconClock';
import IconLock from '@/components/Icon/IconLock';

const productTypeLabels: Record<SavingsProductType, string> = {
    ORDINARY: 'Ordinary Savings',
    SHARE_CAPITAL: 'Share Capital',
    FIXED_DEPOSIT: 'Fixed Deposit',
    SPECIAL: 'Special Savings',
};

const typeIcon: Record<SavingsProductType, typeof IconCashBanknotes> = {
    ORDINARY: IconCashBanknotes,
    SHARE_CAPITAL: IconStar,
    FIXED_DEPOSIT: IconClock,
    SPECIAL: IconLock,
};

const typeAccent: Record<SavingsProductType, string> = {
    ORDINARY: 'bg-primary-light text-primary',
    SHARE_CAPITAL: 'bg-warning-light text-warning',
    FIXED_DEPOSIT: 'bg-info-light text-info',
    SPECIAL: 'bg-success-light text-success',
};

const emptyForm: SavingsProductPayload = {
    savingsProductType: 'ORDINARY',
    name: '',
    description: '',
    interestRate: 5,
    minimumOpeningBalance: 0,
    minimumBalance: 0,
    withdrawable: true,
    active: true,
};

// A toggle-switch styled button — same inline pattern as the loan products page, specific
// to this page's product-status cards.
const ToggleSwitch = ({ checked, onChange, disabled }: { checked: boolean; onChange: () => void; disabled?: boolean }) => (
    <button
        type="button"
        onClick={onChange}
        disabled={disabled}
        aria-pressed={checked}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${checked ? 'bg-success' : 'bg-white-light dark:bg-[#1b2e4b]'} ${disabled ? 'opacity-60' : ''}`}
    >
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-md transition-transform ${checked ? 'translate-x-5' : 'translate-x-0.5'}`} />
    </button>
);

// Admin management of savings products (the templates members choose from when opening an
// account) — same grid-of-toggleable-cards layout as the loan products page.
const SavingsProductsPage = () => {
    const dispatch = useAppDispatch();
    const { products, loading, saving } = useAppSelector((state) => state.savingsProducts);

    const [modalOpen, setModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState<SavingsProductPayload>(emptyForm);
    const [deleteTarget, setDeleteTarget] = useState<SavingsProduct | null>(null);
    const [deleting, setDeleting] = useState(false);
    const [togglingId, setTogglingId] = useState<string | null>(null);

    useEffect(() => {
        dispatch(fetchSavingsProducts());
    }, [dispatch]);

    const openCreate = () => {
        setEditingId(null);
        setForm(emptyForm);
        setModalOpen(true);
    };

    const openEdit = (product: SavingsProduct) => {
        setEditingId(product.id);
        setForm({
            savingsProductType: product.savingsProductType,
            name: product.name,
            description: product.description || '',
            interestRate: product.interestRate,
            minimumOpeningBalance: product.minimumOpeningBalance,
            minimumBalance: product.minimumBalance,
            withdrawable: product.withdrawable,
            active: product.active,
        });
        setModalOpen(true);
    };

    const submit = async () => {
        try {
            if (editingId) {
                await dispatch(updateSavingsProduct({ id: editingId, payload: form })).unwrap();
                dispatch(showToast({ variant: 'success', message: 'Savings product updated' }));
            } else {
                await dispatch(createSavingsProduct(form)).unwrap();
                dispatch(showToast({ variant: 'success', message: 'Savings product created' }));
            }
            setModalOpen(false);
        } catch (err) {
            dispatch(showToast({ variant: 'danger', message: (err as { message?: string })?.message || 'Unable to save savings product' }));
        }
    };

    const handleToggle = async (product: SavingsProduct) => {
        setTogglingId(product.id);
        try {
            await dispatch(toggleSavingsProductActive(product.id)).unwrap();
        } catch (err) {
            dispatch(showToast({ variant: 'danger', message: (err as { message?: string })?.message || 'Unable to update status' }));
        } finally {
            setTogglingId(null);
        }
    };

    const confirmDelete = async () => {
        if (!deleteTarget) return;
        setDeleting(true);
        try {
            await dispatch(deleteSavingsProduct(deleteTarget.id)).unwrap();
            dispatch(showToast({ variant: 'success', message: 'Savings product deleted' }));
            setDeleteTarget(null);
        } catch (err) {
            dispatch(showToast({ variant: 'danger', message: (err as { message?: string })?.message || 'Unable to delete savings product' }));
        } finally {
            setDeleting(false);
        }
    };

    if (loading && products.length === 0) {
        return <PageLoader />;
    }

    return (
        <div>
            <Breadcrumb items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Savings', href: '/dashboard/admin/savings' }, { label: 'Products' }]} />

            <div className="mt-3 flex flex-wrap items-start justify-between gap-2">
                <div>
                    <h1 className="text-xl font-bold">Savings Products</h1>
                    <p className="text-white-dark">The templates members choose from when opening an account — toggle a product off to hide it from new accounts</p>
                </div>
                <Button onClick={openCreate}>
                    <IconPlus className="h-4.5 w-4.5 shrink-0 ltr:mr-2 rtl:ml-2" />
                    Add Product
                </Button>
            </div>

            {products.length === 0 ? (
                <div className="panel mt-4 py-10 text-center text-white-dark">No savings products yet — add one to get started.</div>
            ) : (
                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {products.map((product) => {
                        const Icon = typeIcon[product.savingsProductType];
                        return (
                            <div key={product.id} className={`panel flex flex-col gap-3 ${!product.active ? 'opacity-60' : ''}`}>
                                <div className="flex items-start justify-between">
                                    <span className={`grid h-11 w-11 place-content-center rounded-full ${typeAccent[product.savingsProductType]}`}>
                                        <Icon className="h-5 w-5" />
                                    </span>
                                    <ToggleSwitch checked={product.active} onChange={() => handleToggle(product)} disabled={togglingId === product.id} />
                                </div>
                                <div>
                                    <h5 className="font-semibold">{product.name}</h5>
                                    <p className="text-xs text-white-dark">{productTypeLabels[product.savingsProductType]}</p>
                                    {product.description && <p className="mt-1 text-xs text-white-dark">{product.description}</p>}
                                </div>
                                <div className="grid grid-cols-2 gap-2 border-t border-white-light pt-3 text-xs dark:border-white/10">
                                    <div>
                                        <div className="text-white-dark">Interest Rate</div>
                                        <div className="font-semibold">{product.interestRate}% p.a.</div>
                                    </div>
                                    <div>
                                        <div className="text-white-dark">Withdrawals</div>
                                        <div className="font-semibold">{product.withdrawable ? 'Allowed' : 'Locked'}</div>
                                    </div>
                                    <div>
                                        <div className="text-white-dark">Min. Opening</div>
                                        <div className="font-semibold">KES {product.minimumOpeningBalance.toLocaleString()}</div>
                                    </div>
                                    <div>
                                        <div className="text-white-dark">Min. Balance</div>
                                        <div className="font-semibold">KES {product.minimumBalance.toLocaleString()}</div>
                                    </div>
                                </div>
                                <div className="flex items-center justify-end gap-2 border-t border-white-light pt-3 dark:border-white/10">
                                    <Button size="sm" variant="outline-primary" onClick={() => openEdit(product)}>
                                        <IconPencil className="h-3.5 w-3.5 shrink-0 ltr:mr-1 rtl:ml-1" />
                                        Edit
                                    </Button>
                                    <Button size="sm" variant="outline-danger" onClick={() => setDeleteTarget(product)}>
                                        <IconTrash className="h-3.5 w-3.5 shrink-0 ltr:mr-1 rtl:ml-1" />
                                        Delete
                                    </Button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            <Modal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                title={editingId ? 'Edit Savings Product' : 'Add Savings Product'}
                footer={
                    <>
                        <Button variant="outline-primary" onClick={() => setModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={submit} disabled={saving || !form.name}>
                            {saving && <Spinner className="h-4 w-4 shrink-0 ltr:mr-2 rtl:ml-2" />}
                            {saving ? 'Saving…' : editingId ? 'Save Changes' : 'Create Product'}
                        </Button>
                    </>
                }
            >
                <div className="space-y-4">
                    <div className="w-full">
                        <label htmlFor="savingsProductType" className="mb-1.5 block text-sm font-semibold">
                            Savings Product Type *
                        </label>
                        <select
                            id="savingsProductType"
                            className="form-select"
                            value={form.savingsProductType}
                            onChange={(e) => setForm((prev) => ({ ...prev, savingsProductType: e.target.value as SavingsProductType }))}
                        >
                            {Object.entries(productTypeLabels).map(([value, label]) => (
                                <option key={value} value={value}>
                                    {label}
                                </option>
                            ))}
                        </select>
                    </div>
                    <Input id="name" label="Name *" value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} required />
                    <Textarea
                        id="description"
                        label="Description"
                        rows={2}
                        value={form.description}
                        onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                    />
                    <Input
                        id="interestRate"
                        type="number"
                        min={0}
                        step="0.1"
                        label="Interest Rate (% p.a.) *"
                        value={form.interestRate}
                        onChange={(e) => setForm((prev) => ({ ...prev, interestRate: Number(e.target.value) }))}
                    />
                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            id="minimumOpeningBalance"
                            type="number"
                            min={0}
                            label="Min. Opening Balance (KES) *"
                            value={form.minimumOpeningBalance}
                            onChange={(e) => setForm((prev) => ({ ...prev, minimumOpeningBalance: Number(e.target.value) }))}
                        />
                        <Input
                            id="minimumBalance"
                            type="number"
                            min={0}
                            label="Min. Balance (KES) *"
                            value={form.minimumBalance}
                            onChange={(e) => setForm((prev) => ({ ...prev, minimumBalance: Number(e.target.value) }))}
                        />
                    </div>
                    <label className="flex items-center gap-2 text-sm font-semibold">
                        <input
                            type="checkbox"
                            className="form-checkbox"
                            checked={form.withdrawable}
                            onChange={(e) => setForm((prev) => ({ ...prev, withdrawable: e.target.checked }))}
                        />
                        Withdrawable (members can withdraw on demand)
                    </label>
                    <label className="flex items-center gap-2 text-sm font-semibold">
                        <input type="checkbox" className="form-checkbox" checked={form.active} onChange={(e) => setForm((prev) => ({ ...prev, active: e.target.checked }))} />
                        Active (available when opening new accounts)
                    </label>
                </div>
            </Modal>

            <ConfirmModal
                isOpen={!!deleteTarget}
                title="Delete Savings Product"
                message={`Are you sure you want to delete "${deleteTarget?.name}"? This cannot be undone.`}
                variant="danger"
                loading={deleting}
                onConfirm={confirmDelete}
                onCancel={() => setDeleteTarget(null)}
            />
        </div>
    );
};

export default SavingsProductsPage;
