import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { disburseLoan, fetchLoanById, LoanType } from '@/store/slices/loans/loansSlice';
import { fetchWorkflowInstanceHistory } from '@/store/slices/workflows/workflowInstanceHistorySlice';
import { addGuarantor, fetchGuarantors, removeGuarantor, resetGuarantors, respondToGuarantorInvite } from '@/store/slices/loans/guarantorsSlice';
import { fetchRepayments, recordRepayment, RepaymentPayload } from '@/store/slices/loans/repaymentsSlice';
import { fetchMyProfile } from '@/store/slices/profile/profileSlice';
import { showToast } from '@/store/slices/ui/toastSlice';
import { buildAmortizationSchedule } from '@/utils/loanCalculations';
import Breadcrumb from '@/components/ui/Breadcrumb';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Tabs from '@/components/ui/Tabs';
import Spinner from '@/components/ui/Spinner';
import PageLoader from '@/components/ui/PageLoader';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Avatar from '@/components/ui/Avatar';
import GuarantorSearch from '@/components/loans/GuarantorSearch';
import AmortizationScheduleTable from '@/components/loans/AmortizationScheduleTable';
import { resolveFileUrl } from '@/urlhelper';
import IconArrowLeft from '@/components/Icon/IconArrowLeft';
import IconClock from '@/components/Icon/IconClock';
import IconFile from '@/components/Icon/IconFile';
import IconSend from '@/components/Icon/IconSend';
import IconCreditCard from '@/components/Icon/IconCreditCard';

type TabKey = 'overview' | 'schedule' | 'guarantors' | 'timeline';

const loanTypeLabels: Record<LoanType, string> = {
    NORMAL: 'Normal',
    DEVELOPMENT: 'Development',
    EMERGENCY: 'Emergency',
    SCHOOL_FEES: 'School Fees',
};

const statusBadgeVariant: Record<string, 'info' | 'warning' | 'success' | 'danger'> = {
    INITIATED: 'info',
    IN_PROGRESS: 'warning',
    COMPLETED: 'success',
    REJECTED: 'danger',
};

const priorityBadgeVariant: Record<string, 'info' | 'warning' | 'danger'> = {
    LOW: 'info',
    MEDIUM: 'warning',
    HIGH: 'danger',
};

const loanStatusVariant: Record<string, 'info' | 'warning' | 'success' | 'danger' | 'secondary'> = {
    PENDING: 'warning',
    ACTIVE: 'success',
    DEFAULTED: 'danger',
    CLOSED: 'secondary',
    REJECTED: 'danger',
};

const guarantorStatusVariant: Record<string, 'success' | 'warning' | 'danger'> = {
    ACCEPTED: 'success',
    PENDING: 'warning',
    DECLINED: 'danger',
};

const STAFF_ROLES = ['ROLE_LOAN_OFFICER', 'ROLE_BRANCH_MANAGER', 'ROLE_SYSTEM_ADMINISTRATOR'];

const repaymentMethods = ['CASH', 'MPESA', 'BANK_TRANSFER', 'CHEQUE'];

const LoanDetailPage = () => {
    const router = useRouter();
    const dispatch = useAppDispatch();
    const id = typeof router.query.id === 'string' ? router.query.id : '';

    const { selectedLoan: loan, selectedLoanLoading, disbursing } = useAppSelector((state) => state.loans);
    const { entries: history, loading: historyLoading } = useAppSelector((state) => state.workflowInstanceHistory);
    const { guarantors, saving: guarantorSaving } = useAppSelector((state) => state.guarantors);
    const { repayments, saving: repaymentSaving } = useAppSelector((state) => state.repayments);
    const { profile } = useAppSelector((state) => state.profile);
    const authUser = useAppSelector((state) => state.auth.user);

    const [tab, setTab] = useState<TabKey>('overview');
    const [disburseModalOpen, setDisburseModalOpen] = useState(false);
    const [disburseAmount, setDisburseAmount] = useState(0);
    const [repayModalOpen, setRepayModalOpen] = useState(false);
    const [repayForm, setRepayForm] = useState<RepaymentPayload>({ amount: 0, method: 'CASH' });

    const isStaff = !!authUser?.roles?.some((role) => STAFF_ROLES.includes(role));
    const isOwner = !!profile && !!loan && profile.id === loan.memberId;

    useEffect(() => {
        if (id) {
            dispatch(fetchLoanById(id));
            dispatch(fetchGuarantors(id));
            dispatch(fetchRepayments(id));
        }
        return () => {
            dispatch(resetGuarantors());
        };
    }, [dispatch, id]);

    useEffect(() => {
        if (!profile) dispatch(fetchMyProfile());
    }, [dispatch, profile]);

    useEffect(() => {
        if (loan?.workflowInstanceId) dispatch(fetchWorkflowInstanceHistory(loan.workflowInstanceId));
    }, [dispatch, loan?.workflowInstanceId]);

    useEffect(() => {
        if (loan) setDisburseAmount(loan.amountApproved || loan.amountApplied);
    }, [loan]);

    const sortedHistory = useMemo(() => [...history].sort((a, b) => new Date(b.performedAt).getTime() - new Date(a.performedAt).getTime()), [history]);

    const scheduleRows = useMemo(() => {
        if (!loan) return [];
        const principal = loan.disbursedAmount || loan.amountApproved || loan.amountApplied;
        const rate = loan.interestRate || 0;
        const startDate = loan.disbursedAt ? new Date(loan.disbursedAt) : new Date();
        return buildAmortizationSchedule(principal, rate, loan.repaymentPeriodMonths, startDate);
    }, [loan]);

    const tabItems = useMemo(
        () => [
            { key: 'overview', label: 'Overview' },
            { key: 'schedule', label: 'Amortization & Repayments' },
            { key: 'guarantors', label: 'Guarantors' },
            { key: 'timeline', label: 'Timeline & Audit' },
        ],
        []
    );

    const canDisburse = isStaff && loan?.status === 'COMPLETED' && !loan?.disbursedAt;
    const canRecordRepayment = isStaff && !!loan?.disbursedAt && loan?.loanStatus !== 'CLOSED';
    const myPendingInvites = guarantors.filter((g) => g.memberId === profile?.id && g.status === 'PENDING');

    const submitDisbursement = async () => {
        if (!id) return;
        try {
            await dispatch(disburseLoan({ id, payload: { disbursedAmount: disburseAmount } })).unwrap();
            dispatch(showToast({ variant: 'success', message: 'Loan disbursed successfully' }));
            setDisburseModalOpen(false);
        } catch (err) {
            dispatch(showToast({ variant: 'danger', message: (err as { message?: string })?.message || 'Unable to disburse loan' }));
        }
    };

    const submitRepayment = async () => {
        if (!id) return;
        try {
            await dispatch(recordRepayment({ loanId: id, payload: repayForm })).unwrap();
            dispatch(fetchLoanById(id));
            dispatch(showToast({ variant: 'success', message: 'Repayment recorded successfully' }));
            setRepayModalOpen(false);
            setRepayForm({ amount: 0, method: 'CASH' });
        } catch (err) {
            dispatch(showToast({ variant: 'danger', message: (err as { message?: string })?.message || 'Unable to record repayment' }));
        }
    };

    const respondToInvite = async (guarantorId: string, decision: 'ACCEPTED' | 'DECLINED') => {
        if (!id) return;
        try {
            await dispatch(respondToGuarantorInvite({ loanId: id, guarantorId, decision })).unwrap();
            dispatch(showToast({ variant: 'success', message: `Guarantor invite ${decision.toLowerCase()}` }));
        } catch (err) {
            dispatch(showToast({ variant: 'danger', message: (err as { message?: string })?.message || 'Unable to respond to invite' }));
        }
    };

    if (selectedLoanLoading || !loan) {
        return <PageLoader />;
    }

    return (
        <div>
            <Breadcrumb
                items={[
                    { label: 'Dashboard', href: '/dashboard' },
                    { label: 'Loans', href: '/dashboard/loans' },
                    { label: `${loanTypeLabels[loan.loanType]} Loan` },
                ]}
            />

            <div className="mt-3 flex flex-wrap items-start justify-between gap-2">
                <div>
                    <h1 className="text-xl font-bold">{loanTypeLabels[loan.loanType]} Loan Application</h1>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-white-dark">
                        <span>Applicant: {loan.memberName}</span>
                        {loan.status && <Badge variant={statusBadgeVariant[loan.status]}>{loan.status.replace('_', ' ')}</Badge>}
                        {loan.priority && <Badge variant={priorityBadgeVariant[loan.priority]}>{loan.priority} Priority</Badge>}
                        {loan.loanStatus && <Badge variant={loanStatusVariant[loan.loanStatus]}>{loan.loanStatus}</Badge>}
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    {canDisburse && (
                        <Button variant="success" onClick={() => setDisburseModalOpen(true)}>
                            <IconSend className="h-4 w-4 shrink-0 ltr:mr-2 rtl:ml-2" />
                            Disburse Loan
                        </Button>
                    )}
                    {canRecordRepayment && (
                        <Button variant="primary" onClick={() => setRepayModalOpen(true)}>
                            <IconCreditCard className="h-4 w-4 shrink-0 ltr:mr-2 rtl:ml-2" />
                            Record Repayment
                        </Button>
                    )}
                    <Button variant="outline-primary" href="/dashboard/loans">
                        <IconArrowLeft className="h-4 w-4 shrink-0 ltr:mr-2 rtl:ml-2" />
                        Back to My Loans
                    </Button>
                </div>
            </div>

            {myPendingInvites.length > 0 && (
                <div className="panel mt-3 border-l-4 border-warning bg-warning-light/30 dark:bg-warning/10">
                    <p className="font-semibold">You&apos;ve been invited to guarantee this loan</p>
                    {myPendingInvites.map((invite) => (
                        <div key={invite.id} className="mt-2 flex items-center gap-2">
                            <Button size="sm" variant="success" onClick={() => respondToInvite(invite.id, 'ACCEPTED')} disabled={guarantorSaving}>
                                Accept
                            </Button>
                            <Button size="sm" variant="outline-danger" onClick={() => respondToInvite(invite.id, 'DECLINED')} disabled={guarantorSaving}>
                                Decline
                            </Button>
                        </div>
                    ))}
                </div>
            )}

            <div className="panel mt-3">
                <Tabs items={tabItems} active={tab} onChange={(key) => setTab(key as TabKey)} />

                {tab === 'overview' && (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                            <p className="text-xs font-semibold uppercase text-white-dark">Loan Details</p>
                            <p className="mt-1 text-sm">
                                <span className="text-white-dark">Loan Type:</span> {loanTypeLabels[loan.loanType]}
                            </p>
                            <p className="text-sm">
                                <span className="text-white-dark">Amount Applied:</span> KES {loan.amountApplied.toLocaleString()}
                            </p>
                            {loan.amountApproved !== undefined && loan.amountApproved !== null && (
                                <p className="text-sm">
                                    <span className="text-white-dark">Amount Approved:</span> KES {loan.amountApproved.toLocaleString()}
                                </p>
                            )}
                            {loan.interestRate !== undefined && loan.interestRate !== null && (
                                <p className="text-sm">
                                    <span className="text-white-dark">Interest Rate:</span> {loan.interestRate}%
                                </p>
                            )}
                            <p className="text-sm">
                                <span className="text-white-dark">Repayment Period:</span> {loan.repaymentPeriodMonths} months
                            </p>
                            <p className="text-sm">
                                <span className="text-white-dark">Purpose:</span> {loan.purpose || '—'}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs font-semibold uppercase text-white-dark">Status, Dates & Balance</p>
                            <p className="mt-1 text-sm">
                                <span className="text-white-dark">Current Stage:</span> {loan.currentStageName || '—'}
                            </p>
                            <p className="text-sm">
                                <span className="text-white-dark">Applied At:</span> {new Date(loan.appliedAt).toLocaleString()}
                            </p>
                            {loan.disbursedAt && (
                                <p className="text-sm">
                                    <span className="text-white-dark">Disbursed At:</span> {new Date(loan.disbursedAt).toLocaleString()}
                                </p>
                            )}
                            {loan.disbursedAmount !== undefined && loan.disbursedAmount !== null && (
                                <p className="text-sm">
                                    <span className="text-white-dark">Disbursed Amount:</span> KES {loan.disbursedAmount.toLocaleString()}
                                </p>
                            )}
                            {loan.totalRepaid !== undefined && (
                                <p className="text-sm">
                                    <span className="text-white-dark">Total Repaid:</span> KES {loan.totalRepaid.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                </p>
                            )}
                            {loan.outstandingBalance !== undefined && (
                                <p className="text-sm">
                                    <span className="text-white-dark">Outstanding Balance:</span>{' '}
                                    <span className="font-semibold">KES {loan.outstandingBalance.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                                </p>
                            )}
                            {loan.nextDueDate && (
                                <p className="text-sm">
                                    <span className="text-white-dark">Next Due Date:</span> {new Date(loan.nextDueDate).toLocaleDateString()}
                                </p>
                            )}
                        </div>
                    </div>
                )}

                {tab === 'schedule' && (
                    <div>
                        {!loan.disbursedAt && <p className="mb-4 text-sm text-white-dark">Projected schedule — dates will be based on the actual disbursement date once disbursed.</p>}
                        {scheduleRows.length === 0 ? (
                            <p className="py-6 text-center text-white-dark">Schedule not available yet</p>
                        ) : (
                            <AmortizationScheduleTable rows={scheduleRows} totalRepaid={loan.totalRepaid || 0} />
                        )}

                        <h6 className="mb-3 mt-6 font-semibold">Repayment History</h6>
                        {repayments.length === 0 ? (
                            <p className="text-sm text-white-dark">No repayments recorded yet</p>
                        ) : (
                            <div className="table-responsive">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Date</th>
                                            <th>Amount</th>
                                            <th>Method</th>
                                            <th>Recorded By</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {repayments.map((repayment) => (
                                            <tr key={repayment.id}>
                                                <td>{new Date(repayment.paidAt).toLocaleString()}</td>
                                                <td className="font-semibold">KES {repayment.amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                                                <td>{repayment.method || '—'}</td>
                                                <td>{repayment.recordedByName || '—'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {tab === 'guarantors' && (
                    <div className="mx-auto max-w-xl">
                        {isOwner ? (
                            <GuarantorSearch
                                currentMemberId={profile?.id}
                                guarantors={guarantors}
                                onAdd={(memberId) => dispatch(addGuarantor({ loanId: id, payload: { memberId } }))}
                                onRemove={(guarantorId) => dispatch(removeGuarantor({ loanId: id, guarantorId }))}
                                disabled={guarantorSaving}
                            />
                        ) : guarantors.length === 0 ? (
                            <p className="text-sm text-white-dark">No guarantors have been invited on this loan</p>
                        ) : (
                            <div className="space-y-2">
                                {guarantors.map((guarantor) => (
                                    <div key={guarantor.id} className="flex items-center justify-between gap-2 rounded-md border border-white-light p-2.5 dark:border-white/10">
                                        <div className="flex items-center gap-2.5">
                                            <Avatar src={resolveFileUrl(guarantor.memberAvatarUrl)} name={guarantor.memberName} size="sm" />
                                            <div>
                                                <div className="text-sm font-semibold">{guarantor.memberName}</div>
                                                <div className="text-xs text-white-dark">{guarantor.memberNumber || '—'}</div>
                                            </div>
                                        </div>
                                        <Badge variant={guarantorStatusVariant[guarantor.status]}>{guarantor.status}</Badge>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {tab === 'timeline' && (
                    <div>
                        <p className="mb-4 text-sm text-white-dark">History of actions taken on this application</p>
                        {historyLoading ? (
                            <div className="flex min-h-[100px] items-center justify-center gap-2">
                                <Spinner className="h-5 w-5 text-primary" />
                                <span className="text-white-dark">Loading…</span>
                            </div>
                        ) : sortedHistory.length === 0 ? (
                            <p className="py-6 text-center text-white-dark">No history yet</p>
                        ) : (
                            <div className="space-y-4">
                                {sortedHistory.map((entry) => (
                                    <div key={entry.id} className="flex items-start justify-between gap-3">
                                        <div className="flex items-start gap-3">
                                            <span className="mt-0.5 grid h-8 w-8 shrink-0 place-content-center rounded-full bg-info-light text-info">
                                                {entry.fromStageId ? <IconClock className="h-4 w-4" /> : <IconFile className="h-4 w-4" />}
                                            </span>
                                            <div>
                                                <p className="font-semibold">{entry.fromStageId ? 'Stage Transition' : 'Application Submitted'}</p>
                                                <p className="text-sm text-white-dark">
                                                    {entry.fromStageId ? `From ${entry.fromStageName} to ${entry.toStageName}` : entry.comment || 'Application started'}
                                                </p>
                                                {entry.fromStageId && (entry.transitionName || entry.comment) && (
                                                    <p className="text-xs text-white-dark">
                                                        {entry.transitionName}
                                                        {entry.comment ? ` — ${entry.comment}` : ''}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        <span className="shrink-0 text-xs text-white-dark">{new Date(entry.performedAt).toLocaleString()}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            <Modal
                isOpen={disburseModalOpen}
                onClose={() => setDisburseModalOpen(false)}
                title="Disburse Loan"
                footer={
                    <>
                        <Button variant="outline-primary" onClick={() => setDisburseModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button variant="success" onClick={submitDisbursement} disabled={disbursing || disburseAmount <= 0}>
                            {disbursing && <Spinner className="h-4 w-4 shrink-0 ltr:mr-2 rtl:ml-2" />}
                            {disbursing ? 'Disbursing…' : 'Confirm Disbursement'}
                        </Button>
                    </>
                }
            >
                <Input
                    id="disburseAmount"
                    type="number"
                    min={1}
                    label="Disbursed Amount (KES) *"
                    value={disburseAmount || ''}
                    onChange={(e) => setDisburseAmount(Number(e.target.value))}
                    helperText={`Approved amount: KES ${(loan.amountApproved || loan.amountApplied).toLocaleString()}`}
                />
            </Modal>

            <Modal
                isOpen={repayModalOpen}
                onClose={() => setRepayModalOpen(false)}
                title="Record Repayment"
                footer={
                    <>
                        <Button variant="outline-primary" onClick={() => setRepayModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={submitRepayment} disabled={repaymentSaving || repayForm.amount <= 0}>
                            {repaymentSaving && <Spinner className="h-4 w-4 shrink-0 ltr:mr-2 rtl:ml-2" />}
                            {repaymentSaving ? 'Recording…' : 'Record Repayment'}
                        </Button>
                    </>
                }
            >
                <div className="space-y-4">
                    <Input
                        id="repayAmount"
                        type="number"
                        min={1}
                        label="Amount (KES) *"
                        value={repayForm.amount || ''}
                        onChange={(e) => setRepayForm((prev) => ({ ...prev, amount: Number(e.target.value) }))}
                    />
                    <div>
                        <label htmlFor="repayMethod" className="mb-1.5 block text-sm font-semibold">
                            Payment Method
                        </label>
                        <select
                            id="repayMethod"
                            className="form-select"
                            value={repayForm.method}
                            onChange={(e) => setRepayForm((prev) => ({ ...prev, method: e.target.value }))}
                        >
                            {repaymentMethods.map((method) => (
                                <option key={method} value={method}>
                                    {method.replace('_', ' ')}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default LoanDetailPage;
