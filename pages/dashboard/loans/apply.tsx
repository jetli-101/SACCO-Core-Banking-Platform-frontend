import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { resolveFileUrl } from '@/urlhelper';
import { applyForLoan, LoanType } from '@/store/slices/loans/loansSlice';
import { fetchLoanProducts } from '@/store/slices/loans/loanProductsSlice';
import { addGuarantor } from '@/store/slices/loans/guarantorsSlice';
import { fetchMyProfile } from '@/store/slices/profile/profileSlice';
import { fetchMembers } from '@/store/slices/members/membersSlice';
import { showToast } from '@/store/slices/ui/toastSlice';
import { calculateEmi } from '@/utils/loanCalculations';
import Breadcrumb from '@/components/ui/Breadcrumb';
import Button from '@/components/ui/Button';
import Textarea from '@/components/ui/Textarea';
import Avatar from '@/components/ui/Avatar';
import Spinner from '@/components/ui/Spinner';
import AmountSlider from '@/components/loans/AmountSlider';
import LoanProductCard from '@/components/loans/LoanProductCard';
import IconArrowLeft from '@/components/Icon/IconArrowLeft';
import IconArrowForward from '@/components/Icon/IconArrowForward';
import IconCircleCheck from '@/components/Icon/IconCircleCheck';
import IconSearch from '@/components/Icon/IconSearch';
import IconUserPlus from '@/components/Icon/IconUserPlus';
import IconTrash from '@/components/Icon/IconTrash';

const loanTypeLabels: Record<LoanType, string> = {
    NORMAL: 'Normal',
    DEVELOPMENT: 'Development',
    EMERGENCY: 'Emergency',
    SCHOOL_FEES: 'School Fees',
};

interface PendingGuarantor {
    memberId: string;
    name: string;
    memberNumber?: string;
    avatarUrl?: string;
}

const steps = [
    { n: 1, label: 'Product' },
    { n: 2, label: 'Amount & Term' },
    { n: 3, label: 'Guarantors' },
    { n: 4, label: 'Review & Submit' },
];

// Multi-step loan application wizard. Guarantors can't be attached to the backend
// until the loan itself exists (Guarantor rows are keyed by loanId), so step 3
// collects invitees as local state and step 4 fires applyForLoan followed by a
// sequential addGuarantor call per invitee once the new loan id is known.
const ApplyForLoanPage = () => {
    const dispatch = useAppDispatch();
    const router = useRouter();
    const { applying } = useAppSelector((state) => state.loans);
    const { products, loading: productsLoading } = useAppSelector((state) => state.loanProducts);
    const { profile } = useAppSelector((state) => state.profile);
    const { members } = useAppSelector((state) => state.members);

    const [step, setStep] = useState(1);
    const [productId, setProductId] = useState<string | null>(null);
    const [amount, setAmount] = useState(0);
    const [term, setTerm] = useState(0);
    const [purpose, setPurpose] = useState('');
    const [guarantorSearch, setGuarantorSearch] = useState('');
    const [pendingGuarantors, setPendingGuarantors] = useState<PendingGuarantor[]>([]);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (products.length === 0) dispatch(fetchLoanProducts());
        if (!profile) dispatch(fetchMyProfile());
        if (members.length === 0) dispatch(fetchMembers());
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const selectedProduct = useMemo(() => products.find((p) => p.id === productId) || null, [products, productId]);
    const emi = selectedProduct && amount > 0 && term > 0 ? calculateEmi(amount, selectedProduct.interestRate, term) : 0;

    const selectProduct = (id: string) => {
        const product = products.find((p) => p.id === id);
        if (!product) return;
        setProductId(id);
        setAmount(product.minAmount);
        setTerm(product.minTermMonths);
    };

    const searchTerm = guarantorSearch.trim().toLowerCase();
    const guarantorIds = new Set(pendingGuarantors.map((g) => g.memberId));
    const searchResults =
        searchTerm.length === 0
            ? []
            : members
                  .filter((m) => m.id !== profile?.id && !guarantorIds.has(m.id))
                  .filter((m) => `${m.firstName} ${m.lastName}`.toLowerCase().includes(searchTerm) || (m.memberNumber || '').toLowerCase().includes(searchTerm))
                  .slice(0, 6);

    const addLocalGuarantor = (memberId: string) => {
        const member = members.find((m) => m.id === memberId);
        if (!member) return;
        setPendingGuarantors((prev) => [...prev, { memberId, name: `${member.firstName} ${member.lastName}`, memberNumber: member.memberNumber, avatarUrl: member.passportPhotoUrl }]);
        setGuarantorSearch('');
    };

    const removeLocalGuarantor = (memberId: string) => setPendingGuarantors((prev) => prev.filter((g) => g.memberId !== memberId));

    const canProceed = step === 1 ? !!selectedProduct : step === 2 ? amount > 0 && term > 0 : true;

    const goNext = () => canProceed && setStep((s) => Math.min(s + 1, 4));
    const goBack = () => setStep((s) => Math.max(s - 1, 1));

    const handleSubmit = async () => {
        if (!selectedProduct) return;
        setSubmitting(true);
        try {
            const loan = await dispatch(
                applyForLoan({ loanType: selectedProduct.loanType, amountApplied: amount, repaymentPeriodMonths: term, purpose: purpose || undefined })
            ).unwrap();

            for (const guarantor of pendingGuarantors) {
                try {
                    await dispatch(addGuarantor({ loanId: loan.id, payload: { memberId: guarantor.memberId } })).unwrap();
                } catch {
                    dispatch(showToast({ variant: 'warning', message: `Loan submitted, but could not invite ${guarantor.name} as a guarantor` }));
                }
            }

            dispatch(showToast({ variant: 'success', message: 'Loan application submitted successfully' }));
            router.push(`/dashboard/loans/${loan.id}`);
        } catch (err) {
            dispatch(showToast({ variant: 'danger', message: (err as { message?: string })?.message || 'Unable to submit loan application' }));
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div>
            <Breadcrumb items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Loans', href: '/dashboard/loans' }, { label: 'Apply' }]} />

            <div className="mt-3 flex flex-wrap items-start justify-between gap-2">
                <div>
                    <h1 className="text-xl font-bold">Apply for a Loan</h1>
                    <p className="text-white-dark">Follow the steps below — your application enters review as soon as you submit it</p>
                </div>
                <Button variant="outline-primary" href="/dashboard/loans">
                    <IconArrowLeft className="h-4 w-4 shrink-0 ltr:mr-2 rtl:ml-2" />
                    Back to My Loans
                </Button>
            </div>

            {/* Step indicator */}
            <div className="panel mt-4">
                <div className="flex items-center">
                    {steps.map((s, idx) => (
                        <div key={s.n} className="flex flex-1 items-center last:flex-none">
                            <div className="flex flex-col items-center gap-1.5">
                                <div
                                    className={`grid h-9 w-9 shrink-0 place-content-center rounded-full text-sm font-semibold transition-colors ${
                                        step === s.n
                                            ? 'bg-primary text-white shadow-md shadow-primary/40'
                                            : step > s.n
                                              ? 'bg-success text-white'
                                              : 'bg-white-light text-white-dark dark:bg-[#1b2e4b]'
                                    }`}
                                >
                                    {step > s.n ? <IconCircleCheck className="h-4.5 w-4.5" /> : s.n}
                                </div>
                                <span className={`hidden text-xs font-medium sm:block ${step === s.n ? 'text-primary' : 'text-white-dark'}`}>{s.label}</span>
                            </div>
                            {idx < steps.length - 1 && <div className={`mx-2 h-0.5 flex-1 rounded-full ${step > s.n ? 'bg-success' : 'bg-white-light dark:bg-[#1b2e4b]'}`} />}
                        </div>
                    ))}
                </div>
            </div>

            <div className="panel mt-4 min-h-[360px]">
                {/* Step 1: Product Selection */}
                {step === 1 && (
                    <div>
                        <h5 className="mb-1 text-lg font-semibold">Choose a Loan Product</h5>
                        <p className="mb-4 text-sm text-white-dark">Pick the product that best matches what you need this loan for.</p>
                        {productsLoading ? (
                            <div className="flex justify-center py-10">
                                <Spinner className="h-6 w-6" />
                            </div>
                        ) : products.length === 0 ? (
                            <p className="text-sm text-white-dark">No loan products are available right now — please contact your branch.</p>
                        ) : (
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                                {products
                                    .filter((p) => p.active)
                                    .map((product) => (
                                        <LoanProductCard key={product.id} product={product} selected={product.id === productId} onSelect={() => selectProduct(product.id)} />
                                    ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Step 2: Amount & Term */}
                {step === 2 && selectedProduct && (
                    <div className="mx-auto max-w-xl">
                        <h5 className="mb-1 text-lg font-semibold">Amount & Repayment Term</h5>
                        <p className="mb-6 text-sm text-white-dark">
                            {selectedProduct.name} — {selectedProduct.interestRate}% p.a.
                        </p>

                        <div className="space-y-8">
                            <AmountSlider
                                label="Amount"
                                value={amount}
                                min={selectedProduct.minAmount}
                                max={selectedProduct.maxAmount}
                                step={Math.max(1, Math.round((selectedProduct.maxAmount - selectedProduct.minAmount) / 100))}
                                onChange={setAmount}
                                formatValue={(v) => `KES ${v.toLocaleString()}`}
                            />
                            <AmountSlider
                                label="Repayment Period"
                                value={term}
                                min={selectedProduct.minTermMonths}
                                max={selectedProduct.maxTermMonths}
                                onChange={setTerm}
                                formatValue={(v) => `${v} mo`}
                            />

                            <Textarea
                                id="purpose"
                                label="Purpose (optional)"
                                rows={3}
                                value={purpose}
                                onChange={(e) => setPurpose(e.target.value)}
                                placeholder="What is this loan for?"
                            />

                            <div className="rounded-lg bg-primary-light/40 p-4 dark:bg-primary/10">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium text-white-dark">Estimated Monthly Installment</span>
                                    <span className="text-2xl font-bold text-primary">KES {emi.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                                </div>
                                <p className="mt-1 text-xs text-white-dark">
                                    Total repayable: KES {(emi * term).toLocaleString(undefined, { maximumFractionDigits: 0 })} over {term} months
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Step 3: Guarantors */}
                {step === 3 && (
                    <div className="mx-auto max-w-xl">
                        <h5 className="mb-1 text-lg font-semibold">Guarantors</h5>
                        <p className="mb-4 text-sm text-white-dark">Optional — invite fellow members to guarantee this loan. They&apos;ll be notified once you submit.</p>

                        <div className="relative">
                            <input
                                type="text"
                                className="form-input pr-10"
                                placeholder="Search members by name or member number..."
                                value={guarantorSearch}
                                onChange={(e) => setGuarantorSearch(e.target.value)}
                            />
                            <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-white-dark">
                                <IconSearch className="h-4 w-4" />
                            </span>
                        </div>

                        {searchResults.length > 0 && (
                            <div className="mt-2 space-y-1 rounded-md border border-white-light p-2 dark:border-white/10">
                                {searchResults.map((member) => (
                                    <div key={member.id} className="flex items-center justify-between gap-2 rounded-md p-1.5 hover:bg-white-light/60 dark:hover:bg-white/5">
                                        <div className="flex items-center gap-2.5">
                                            <Avatar src={resolveFileUrl(member.passportPhotoUrl)} name={`${member.firstName} ${member.lastName}`} size="sm" />
                                            <div>
                                                <div className="text-sm font-semibold">
                                                    {member.firstName} {member.lastName}
                                                </div>
                                                <div className="text-xs text-white-dark">{member.memberNumber || '—'}</div>
                                            </div>
                                        </div>
                                        <Button type="button" size="sm" variant="outline-primary" onClick={() => addLocalGuarantor(member.id)}>
                                            <IconUserPlus className="h-3.5 w-3.5 shrink-0 ltr:mr-1 rtl:ml-1" />
                                            Invite
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="mt-4 space-y-2">
                            {pendingGuarantors.length === 0 ? (
                                <p className="text-sm text-white-dark">No guarantors invited yet — search above to invite one, or skip this step.</p>
                            ) : (
                                pendingGuarantors.map((guarantor) => (
                                    <div key={guarantor.memberId} className="flex items-center justify-between gap-2 rounded-md border border-white-light p-2.5 dark:border-white/10">
                                        <div className="flex items-center gap-2.5">
                                            <Avatar src={resolveFileUrl(guarantor.avatarUrl)} name={guarantor.name} size="sm" />
                                            <div>
                                                <div className="text-sm font-semibold">{guarantor.name}</div>
                                                <div className="text-xs text-white-dark">{guarantor.memberNumber || '—'}</div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="badge bg-warning-light text-warning">Will invite on submit</span>
                                            <Button type="button" className="text-white-dark hover:text-danger" onClick={() => removeLocalGuarantor(guarantor.memberId)} aria-label="Remove">
                                                <IconTrash className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}

                {/* Step 4: Review & Submit */}
                {step === 4 && selectedProduct && (
                    <div className="mx-auto max-w-xl">
                        <h5 className="mb-4 text-lg font-semibold">Review Your Application</h5>
                        <div className="divide-y divide-white-light rounded-lg border border-white-light dark:divide-white/10 dark:border-white/10">
                            <div className="flex items-center justify-between px-4 py-3">
                                <span className="text-sm text-white-dark">Loan Product</span>
                                <span className="text-sm font-semibold">{selectedProduct.name}</span>
                            </div>
                            <div className="flex items-center justify-between px-4 py-3">
                                <span className="text-sm text-white-dark">Loan Type</span>
                                <span className="text-sm font-semibold">{loanTypeLabels[selectedProduct.loanType]}</span>
                            </div>
                            <div className="flex items-center justify-between px-4 py-3">
                                <span className="text-sm text-white-dark">Amount Applied</span>
                                <span className="text-sm font-semibold">KES {amount.toLocaleString()}</span>
                            </div>
                            <div className="flex items-center justify-between px-4 py-3">
                                <span className="text-sm text-white-dark">Repayment Period</span>
                                <span className="text-sm font-semibold">{term} months</span>
                            </div>
                            <div className="flex items-center justify-between px-4 py-3">
                                <span className="text-sm text-white-dark">Interest Rate</span>
                                <span className="text-sm font-semibold">{selectedProduct.interestRate}% p.a.</span>
                            </div>
                            <div className="flex items-center justify-between px-4 py-3">
                                <span className="text-sm text-white-dark">Estimated Monthly Installment</span>
                                <span className="text-sm font-semibold text-primary">KES {emi.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                            </div>
                            {purpose && (
                                <div className="px-4 py-3">
                                    <span className="text-sm text-white-dark">Purpose</span>
                                    <p className="mt-1 text-sm">{purpose}</p>
                                </div>
                            )}
                            <div className="px-4 py-3">
                                <span className="text-sm text-white-dark">Guarantors</span>
                                {pendingGuarantors.length === 0 ? (
                                    <p className="mt-1 text-sm">None invited</p>
                                ) : (
                                    <div className="mt-2 flex flex-wrap gap-2">
                                        {pendingGuarantors.map((g) => (
                                            <span key={g.memberId} className="badge bg-white-light text-dark dark:bg-[#1b2e4b] dark:text-white-light">
                                                {g.name}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Navigation */}
                <div className="mt-8 flex items-center justify-between border-t border-white-light pt-4 dark:border-white/10">
                    <Button variant="outline-primary" onClick={goBack} disabled={step === 1}>
                        <IconArrowLeft className="h-4 w-4 shrink-0 ltr:mr-2 rtl:ml-2" />
                        Back
                    </Button>
                    {step < 4 ? (
                        <Button onClick={goNext} disabled={!canProceed}>
                            Next
                            <IconArrowForward className="h-4 w-4 shrink-0 ltr:ml-2 rtl:mr-2" />
                        </Button>
                    ) : (
                        <Button onClick={handleSubmit} disabled={submitting || applying}>
                            {(submitting || applying) && <Spinner className="h-4 w-4 shrink-0 ltr:mr-2 rtl:ml-2" />}
                            {submitting || applying ? 'Submitting…' : 'Submit Application'}
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ApplyForLoanPage;
