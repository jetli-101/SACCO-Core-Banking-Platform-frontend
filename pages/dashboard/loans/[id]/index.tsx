import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchLoanById, LoanType } from '@/store/slices/loans/loansSlice';
import { fetchWorkflowInstanceHistory } from '@/store/slices/workflows/workflowInstanceHistorySlice';
import Breadcrumb from '@/components/ui/Breadcrumb';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Tabs from '@/components/ui/Tabs';
import Spinner from '@/components/ui/Spinner';
import IconArrowLeft from '@/components/Icon/IconArrowLeft';
import IconClock from '@/components/Icon/IconClock';
import IconFile from '@/components/Icon/IconFile';

type TabKey = 'overview' | 'timeline';

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

const LoanDetailPage = () => {
    const router = useRouter();
    const dispatch = useAppDispatch();
    const id = typeof router.query.id === 'string' ? router.query.id : '';

    const { selectedLoan: loan, selectedLoanLoading } = useAppSelector((state) => state.loans);
    const { entries: history, loading: historyLoading } = useAppSelector((state) => state.workflowInstanceHistory);

    const [tab, setTab] = useState<TabKey>('overview');

    useEffect(() => {
        if (id) dispatch(fetchLoanById(id));
    }, [dispatch, id]);

    useEffect(() => {
        if (loan?.workflowInstanceId) dispatch(fetchWorkflowInstanceHistory(loan.workflowInstanceId));
    }, [dispatch, loan?.workflowInstanceId]);

    const sortedHistory = useMemo(() => [...history].sort((a, b) => new Date(b.performedAt).getTime() - new Date(a.performedAt).getTime()), [history]);

    const tabItems = useMemo(
        () => [
            { key: 'overview', label: 'Overview' },
            { key: 'timeline', label: 'Timeline & Audit' },
        ],
        []
    );

    if (selectedLoanLoading || !loan) {
        return (
            <div className="flex min-h-[300px] items-center justify-center gap-2">
                <Spinner className="h-5 w-5 text-primary" />
                <span className="text-white-dark">Loading…</span>
            </div>
        );
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
                    </div>
                </div>
                <Button variant="outline-primary" href="/dashboard/loans">
                    <IconArrowLeft className="h-4 w-4 shrink-0 ltr:mr-2 rtl:ml-2" />
                    Back to My Loans
                </Button>
            </div>

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
                            <p className="text-xs font-semibold uppercase text-white-dark">Status & Dates</p>
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
                        </div>
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
        </div>
    );
};

export default LoanDetailPage;
