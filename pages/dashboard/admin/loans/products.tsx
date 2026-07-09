import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { createLoanProduct, deleteLoanProduct, fetchLoanProducts, LoanProduct, LoanProductPayload, toggleLoanProductActive, updateLoanProduct } from '@/store/slices/loans/loanProductsSlice';
import { LoanType } from '@/store/slices/loans/loansSlice';
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
import IconHome from '@/components/Icon/IconHome';
import IconInfoTriangle from '@/components/Icon/IconInfoTriangle';
import IconOpenBook from '@/components/Icon/IconOpenBook';

const loanTypeLabels: Record<LoanType, string> = {
    NORMAL: 'Normal',
    DEVELOPMENT: 'Development',
    EMERGENCY: 'Emergency',
    SCHOOL_FEES: 'School Fees',
};

const typeIcon: Record<LoanType, typeof IconCashBanknotes> = {
    NORMAL: IconCashBanknotes,
    DEVELOPMENT: IconHome,
    EMERGENCY: IconInfoTriangle,
    SCHOOL_FEES: IconOpenBook,
};

const typeAccent: Record<LoanType, string> = {
    NORMAL: 'bg-primary-light text-primary',
    DEVELOPMENT: 'bg-info-light text-info',
    EMERGENCY: 'bg-danger-light text-danger',
    SCHOOL_FEES: 'bg-success-light text-success',
};

const emptyForm: LoanProductPayload = {
    loanType: 'NORMAL',
    name: '',
    description: '',
    interestRate: 12,
    minAmount: 1000,
    maxAmount: 100000,
    minTermMonths: 1,
    maxTermMonths: 12,
    active: true,
};

// A toggle-switch styled button — used inline here since it's specific to this page's
// product-status cards, not shared elsewhere in the app.
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

// Admin management of loan products (the templates members choose from in the
// application wizard) — grid of toggleable status cards rather than a table, since
// there are only ever a handful of products and each needs its active switch visible
// at a glance.
const LoanProductsPage = () => {
    const dispatch = useAppDispatch();
    const { products, loading, saving } = useAppSelector((state) => state.loanProducts);

    const [modalOpen, setModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState<LoanProductPayload>(emptyForm);
    const [deleteTarget, setDeleteTarget] = useState<LoanProduct | null>(null);
    const [deleting, setDeleting] = useState(false);
    const [togglingId, setTogglingId] = useState<string | null>(null);

    useEffect(() => {
        dispatch(fetchLoanProducts());
    }, [dispatch]);

    const openCreate = () => {
        setEditingId(null);
        setForm(emptyForm);
        setModalOpen(true);
    };

    const openEdit = (product: LoanProduct) => {
        setEditingId(product.id);
        setForm({
            loanType: product.loanType,
            name: product.name,
            description: product.description || '',
            interestRate: product.interestRate,
            minAmount: product.minAmount,
            maxAmount: product.maxAmount,
            minTermMonths: product.minTermMonths,
            maxTermMonths: product.maxTermMonths,
            active: product.active,
        });
        setModalOpen(true);
    };

    const submit = async () => {
        try {
            if (editingId) {
                await dispatch(updateLoanProduct({ id: editingId, payload: form })).unwrap();
                dispatch(showToast({ variant: 'success', message: 'Loan product updated' }));
            } else {
                await dispatch(createLoanProduct(form)).unwrap();
                dispatch(showToast({ variant: 'success', message: 'Loan product created' }));
            }
            setModalOpen(false);
        } catch (err) {
            dispatch(showToast({ variant: 'danger', message: (err as { message?: string })?.message || 'Unable to save loan product' }));
        }
    };

    const handleToggle = async (product: LoanProduct) => {
        setTogglingId(product.id);
        try {
            await dispatch(toggleLoanProductActive(product.id)).unwrap();
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
            await dispatch(deleteLoanProduct(deleteTarget.id)).unwrap();
            dispatch(showToast({ variant: 'success', message: 'Loan product deleted' }));
            setDeleteTarget(null);
        } catch (err) {
            dispatch(showToast({ variant: 'danger', message: (err as { message?: string })?.message || 'Unable to delete loan product' }));
        } finally {
            setDeleting(false);
        }
    };

    if (loading && products.length === 0) {
        return <PageLoader />;
    }

    return (
        <div>
            <Breadcrumb items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Loans', href: '/dashboard/admin/loans' }, { label: 'Products' }]} />

            <div className="mt-3 flex flex-wrap items-start justify-between gap-2">
                <div>
                    <h1 className="text-xl font-bold">Loan Products</h1>
                    <p className="text-white-dark">The templates members choose from when applying — toggle a product off to hide it from new applications</p>
                </div>
                <Button onClick={openCreate}>
                    <IconPlus className="h-4.5 w-4.5 shrink-0 ltr:mr-2 rtl:ml-2" />
                    Add Product
                </Button>
            </div>

            {products.length === 0 ? (
                <div className="panel mt-4 py-10 text-center text-white-dark">No loan products yet — add one to get started.</div>
            ) : (
                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {products.map((product) => {
                        const Icon = typeIcon[product.loanType];
                        return (
                            <div key={product.id} className={`panel flex flex-col gap-3 ${!product.active ? 'opacity-60' : ''}`}>
                                <div className="flex items-start justify-between">
                                    <span className={`grid h-11 w-11 place-content-center rounded-full ${typeAccent[product.loanType]}`}>
                                        <Icon className="h-5 w-5" />
                                    </span>
                                    <ToggleSwitch checked={product.active} onChange={() => handleToggle(product)} disabled={togglingId === product.id} />
                                </div>
                                <div>
                                    <h5 className="font-semibold">{product.name}</h5>
                                    <p className="text-xs text-white-dark">{loanTypeLabels[product.loanType]}</p>
                                    {product.description && <p className="mt-1 text-xs text-white-dark">{product.description}</p>}
                                </div>
                                <div className="grid grid-cols-2 gap-2 border-t border-white-light pt-3 text-xs dark:border-white/10">
                                    <div>
                                        <div className="text-white-dark">Interest Rate</div>
                                        <div className="font-semibold">{product.interestRate}% p.a.</div>
                                    </div>
                                    <div>
                                        <div className="text-white-dark">Term</div>
                                        <div className="font-semibold">
                                            {product.minTermMonths}–{product.maxTermMonths} mo
                                        </div>
                                    </div>
                                    <div className="col-span-2">
                                        <div className="text-white-dark">Amount Range</div>
                                        <div className="font-semibold">
                                            KES {product.minAmount.toLocaleString()} – {product.maxAmount.toLocaleString()}
                                        </div>
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
                title={editingId ? 'Edit Loan Product' : 'Add Loan Product'}
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
                        <label htmlFor="loanType" className="mb-1.5 block text-sm font-semibold">
                            Loan Type *
                        </label>
                        <select id="loanType" className="form-select" value={form.loanType} onChange={(e) => setForm((prev) => ({ ...prev, loanType: e.target.value as LoanType }))}>
                            {Object.entries(loanTypeLabels).map(([value, label]) => (
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
                            id="minAmount"
                            type="number"
                            min={0}
                            label="Min Amount (KES) *"
                            value={form.minAmount}
                            onChange={(e) => setForm((prev) => ({ ...prev, minAmount: Number(e.target.value) }))}
                        />
                        <Input
                            id="maxAmount"
                            type="number"
                            min={0}
                            label="Max Amount (KES) *"
                            value={form.maxAmount}
                            onChange={(e) => setForm((prev) => ({ ...prev, maxAmount: Number(e.target.value) }))}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            id="minTermMonths"
                            type="number"
                            min={1}
                            label="Min Term (months) *"
                            value={form.minTermMonths}
                            onChange={(e) => setForm((prev) => ({ ...prev, minTermMonths: Number(e.target.value) }))}
                        />
                        <Input
                            id="maxTermMonths"
                            type="number"
                            min={1}
                            label="Max Term (months) *"
                            value={form.maxTermMonths}
                            onChange={(e) => setForm((prev) => ({ ...prev, maxTermMonths: Number(e.target.value) }))}
                        />
                    </div>
                    <label className="flex items-center gap-2 text-sm font-semibold">
                        <input type="checkbox" className="form-checkbox" checked={form.active} onChange={(e) => setForm((prev) => ({ ...prev, active: e.target.checked }))} />
                        Active (available to members)
                    </label>
                </div>
            </Modal>

            <ConfirmModal
                isOpen={!!deleteTarget}
                title="Delete Loan Product"
                message={`Are you sure you want to delete "${deleteTarget?.name}"? This cannot be undone.`}
                variant="danger"
                loading={deleting}
                onConfirm={confirmDelete}
                onCancel={() => setDeleteTarget(null)}
            />
        </div>
    );
};

export default LoanProductsPage;
