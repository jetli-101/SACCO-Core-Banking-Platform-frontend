import { ReactNode, useEffect, useMemo, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import type { WorkflowInterfacePayload } from '@/pages/pages/interfaceRegistry';
import { fetchLoanById } from '@/store/slices/loans/loansSlice';
import { fetchLoanProducts } from '@/store/slices/loans/loanProductsSlice';
import { fetchGuarantors, resetGuarantors } from '@/store/slices/loans/guarantorsSlice';
import { resolveFileUrl } from '@/urlhelper';
import WorkflowStageProgress from '@/components/workflow/WorkflowStageProgress';
import LoanApprovalChecklistModal from './LoanApprovalChecklistModal';
import LoanTransitionCommentModal from './LoanTransitionCommentModal';
import ConfirmModal from '@/components/ui/ConfirmModal';
import Avatar from '@/components/ui/Avatar';
import Badge from '@/components/ui/Badge';
import Button, { type ButtonVariant } from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';
import IconSend from '@/components/Icon/IconSend';
import IconCircleCheck from '@/components/Icon/IconCircleCheck';
import IconXCircle from '@/components/Icon/IconXCircle';
import IconArrowBackward from '@/components/Icon/IconArrowBackward';

type ActionKind = 'forward' | 'approve' | 'reject' | 'return';

const actionMeta: Record<string, { kind: ActionKind; variant: ButtonVariant; icon: typeof IconSend; order: number }> = {
    NORMAL_SUBMISSION: { kind: 'forward', variant: 'primary', icon: IconSend, order: 0 },
    APPROVAL: { kind: 'approve', variant: 'success', icon: IconCircleCheck, order: 0 },
    REJECTION: { kind: 'reject', variant: 'danger', icon: IconXCircle, order: 1 },
    RETURN: { kind: 'return', variant: 'outline-dark', icon: IconArrowBackward, order: 2 },
};

const guarantorStatusVariant: Record<string, 'success' | 'warning' | 'danger'> = {
    ACCEPTED: 'success',
    PENDING: 'warning',
    DECLINED: 'danger',
};

const SummaryItem = ({ label, value, helper }: { label: string; value: ReactNode; helper?: ReactNode }) => (
    <div>
        <div className="text-xs font-semibold uppercase tracking-wide text-white-dark">{label}</div>
        <div className="mt-0.5 text-base font-semibold">{value}</div>
        {helper && <div className="mt-0.5 text-xs">{helper}</div>}
    </div>
);

// The Loans module's stage-action screen, registered under both 'LOAN_OFFICER_REVIEW' and
// 'LOAN_MANAGER_APPROVAL' in the interface registry (see interfaceRegistry.ts) — which
// actions appear (Forward/Approve/Reject/Return) is entirely data-driven from
// availableTransitions, not hardcoded per stage, so the same component naturally renders
// the right buttons for whichever stage the instance currently sits at. All loan/guarantor/
// product figures shown here are fetched fresh (not the static snapshot the workflow
// instance was created with), so a reviewer always sees current, real data.
const LoanReviewPanel = ({ referenceId, currentStageId, currentStageName, processName, availableTransitions, stages, onTransition, onActed, onCancel }: WorkflowInterfacePayload) => {
    const dispatch = useAppDispatch();
    const { selectedLoan: loan, selectedLoanLoading } = useAppSelector((state) => state.loans);
    const { products } = useAppSelector((state) => state.loanProducts);
    const { guarantors } = useAppSelector((state) => state.guarantors);

    const [activeTransitionId, setActiveTransitionId] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (referenceId) {
            dispatch(fetchLoanById(referenceId));
            dispatch(fetchGuarantors(referenceId));
        }
        return () => {
            dispatch(resetGuarantors());
        };
    }, [dispatch, referenceId]);

    useEffect(() => {
        if (products.length === 0) dispatch(fetchLoanProducts());
    }, [dispatch, products.length]);

    const loanReady = !!loan && loan.id === referenceId;
    const product = useMemo(() => (loanReady ? products.find((p) => p.loanType === loan!.loanType) : undefined), [products, loan, loanReady]);

    const sortedTransitions = useMemo(
        () => [...availableTransitions].sort((a, b) => (actionMeta[a.actionType]?.order ?? 9) - (actionMeta[b.actionType]?.order ?? 9)),
        [availableTransitions]
    );

    const activeTransition = sortedTransitions.find((t) => t.transitionId === activeTransitionId);
    const activeKind = activeTransition ? actionMeta[activeTransition.actionType]?.kind : undefined;

    const closeModal = () => {
        setActiveTransitionId(null);
        setSubmitting(false);
    };

    const confirmAction = async (opts?: { comment?: string; completedChecklistItemIds?: string[] }) => {
        if (!activeTransition) return;
        setSubmitting(true);
        try {
            await onTransition(activeTransition.transitionId, opts);
            closeModal();
            onActed();
        } catch {
            setSubmitting(false);
        }
    };

    if (!loanReady || selectedLoanLoading) {
        return (
            <div className="flex min-h-[220px] items-center justify-center gap-2">
                <Spinner className="h-5 w-5 text-primary" />
                <span className="text-white-dark">Loading loan details…</span>
            </div>
        );
    }

    const interestRate = loan.interestRate ?? product?.interestRate;
    const withinRange = product ? loan.amountApplied >= product.minAmount && loan.amountApplied <= product.maxAmount : undefined;

    return (
        <div className="space-y-5">
            <WorkflowStageProgress workFlowName={processName} currentStageId={currentStageId} currentStageName={currentStageName} stages={stages} />

            <div className="rounded-xl border border-white-light p-5 shadow-sm dark:border-white/10">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <Avatar name={loan.memberName} size="lg" />
                        <div>
                            <div className="text-lg font-bold">{loan.memberName}</div>
                            <div className="text-sm text-white-dark">{loan.memberNumber || '—'}</div>
                        </div>
                    </div>
                    <Badge variant="info" outline>
                        {currentStageName}
                    </Badge>
                </div>

                <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                    <SummaryItem label="Loan Product" value={product?.name || loan.loanType} />
                    <SummaryItem
                        label="Amount Requested"
                        value={`KES ${loan.amountApplied.toLocaleString()}`}
                        helper={
                            product && (
                                <span className={withinRange ? 'text-success' : 'text-danger'}>
                                    {withinRange ? 'Within product range' : `Outside range (KES ${product.minAmount.toLocaleString()}–${product.maxAmount.toLocaleString()})`}
                                </span>
                            )
                        }
                    />
                    <SummaryItem label="Repayment Term" value={`${loan.repaymentPeriodMonths} months`} />
                    <SummaryItem label="Interest Rate" value={interestRate !== undefined ? `${interestRate}% p.a.` : '—'} />
                </div>

                {loan.purpose && (
                    <div className="mt-5">
                        <div className="text-xs font-semibold uppercase tracking-wide text-white-dark">Purpose</div>
                        <p className="mt-1 text-sm">{loan.purpose}</p>
                    </div>
                )}

                <div className="mt-5">
                    <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-white-dark">Guarantors</div>
                    {guarantors.length === 0 ? (
                        <p className="text-sm text-white-dark">No guarantors invited on this application</p>
                    ) : (
                        <div className="flex flex-wrap gap-2">
                            {guarantors.map((guarantor) => (
                                <div key={guarantor.id} className="flex items-center gap-2 rounded-full border border-white-light py-1 pl-1 pr-3 dark:border-white/10">
                                    <Avatar src={resolveFileUrl(guarantor.memberAvatarUrl)} name={guarantor.memberName} size="sm" />
                                    <span className="text-sm font-medium">{guarantor.memberName}</span>
                                    <Badge variant={guarantorStatusVariant[guarantor.status]}>{guarantor.status}</Badge>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2 border-t border-white-light pt-4 dark:border-white/10">
                {onCancel && (
                    <Button variant="outline-primary" onClick={onCancel} disabled={submitting}>
                        Cancel
                    </Button>
                )}
                {sortedTransitions.map((transition) => {
                    const meta = actionMeta[transition.actionType] || { variant: 'outline-primary' as ButtonVariant, icon: IconSend };
                    const Icon = meta.icon;
                    return (
                        <Button key={transition.transitionId} variant={meta.variant} onClick={() => setActiveTransitionId(transition.transitionId)} disabled={submitting}>
                            <Icon className="h-4 w-4 shrink-0 ltr:mr-2 rtl:ml-2" />
                            {transition.name}
                        </Button>
                    );
                })}
            </div>

            <ConfirmModal
                isOpen={!!activeTransition && activeKind === 'forward'}
                title={activeTransition?.name}
                message={`Forward this loan application to "${activeTransition?.toStageName}"? The Branch Manager will be notified for review.`}
                confirmLabel="Confirm & Forward"
                variant="primary"
                loading={submitting}
                onConfirm={() => confirmAction()}
                onCancel={closeModal}
            />

            <LoanApprovalChecklistModal
                isOpen={!!activeTransition && activeKind === 'approve'}
                checklistItems={activeTransition?.checklistItems || []}
                submitting={submitting}
                onCancel={closeModal}
                onConfirm={(completedChecklistItemIds) => confirmAction({ completedChecklistItemIds })}
            />

            <LoanTransitionCommentModal
                isOpen={!!activeTransition && activeKind === 'reject'}
                title="Reject Loan Application"
                label="Reason for rejection"
                required
                confirmLabel="Confirm Rejection"
                confirmVariant="danger"
                submitting={submitting}
                onCancel={closeModal}
                onConfirm={(comment) => confirmAction({ comment })}
            />

            <LoanTransitionCommentModal
                isOpen={!!activeTransition && activeKind === 'return'}
                title="Return to Loan Officer"
                label="Correction notes"
                required={!!activeTransition?.requiresApprovalComment}
                confirmLabel="Confirm Return"
                confirmVariant="dark"
                submitting={submitting}
                onCancel={closeModal}
                onConfirm={(comment) => confirmAction({ comment })}
            />
        </div>
    );
};

export default LoanReviewPanel;
