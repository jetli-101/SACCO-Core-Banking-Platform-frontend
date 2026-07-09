import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchMyLoans, clearLoansError, Loan, LoanType, LoanLifecycleStatus } from '@/store/slices/loans/loansSlice';
import Breadcrumb from '@/components/ui/Breadcrumb';
import DataGrid from '@/components/ui/DataGrid';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import Badge from '@/components/ui/Badge';
import RowActionsMenu from '@/components/ui/RowActionsMenu';
import LoanStatsCards from '@/components/loans/LoanStatsCards';
import IconPlus from '@/components/Icon/IconPlus';
import PageLoader from '@/components/ui/PageLoader';

const loanTypeLabels: Record<LoanType, string> = {
    NORMAL: 'Normal',
    DEVELOPMENT: 'Development',
    EMERGENCY: 'Emergency',
    SCHOOL_FEES: 'School Fees',
};

const loanStatusVariant: Record<LoanLifecycleStatus, 'info' | 'warning' | 'success' | 'danger' | 'secondary'> = {
    PENDING: 'warning',
    ACTIVE: 'success',
    DEFAULTED: 'danger',
    CLOSED: 'secondary',
    REJECTED: 'danger',
};

const loanStatusLabels: Record<LoanLifecycleStatus, string> = {
    PENDING: 'Pending',
    ACTIVE: 'Active',
    DEFAULTED: 'Defaulted',
    CLOSED: 'Closed',
    REJECTED: 'Rejected',
};

const filterTabs: { key: 'ALL' | LoanLifecycleStatus; label: string }[] = [
    { key: 'ALL', label: 'All' },
    { key: 'PENDING', label: 'Pending' },
    { key: 'ACTIVE', label: 'Active' },
    { key: 'DEFAULTED', label: 'Defaulted' },
    { key: 'CLOSED', label: 'Closed' },
    { key: 'REJECTED', label: 'Rejected' },
];

// Member self-service: my own loan applications only. Applying is its own page
// (/dashboard/loans/apply) and reviewing all applications is the staff-only
// /dashboard/admin/loans — kept separate so each screen has one job.
const MyLoansPage = () => {
    const dispatch = useAppDispatch();
    const router = useRouter();
    const { myLoans, loading, error } = useAppSelector((state) => state.loans);
    const [statusFilter, setStatusFilter] = useState<'ALL' | LoanLifecycleStatus>('ALL');

    useEffect(() => {
        dispatch(fetchMyLoans());
    }, [dispatch]);

    const filteredLoans = useMemo(() => (statusFilter === 'ALL' ? myLoans : myLoans.filter((loan) => loan.loanStatus === statusFilter)), [myLoans, statusFilter]);

    if (loading && myLoans.length === 0) {
        return <PageLoader />;
    }

    return (
        <div>
            <Breadcrumb />

            <div className="mt-3 flex flex-wrap items-start justify-between gap-2">
                <div>
                    <h1 className="text-xl font-bold">My Loans</h1>
                    <p className="text-white-dark">Apply for a loan and track its progress through review, disbursement, and repayment</p>
                </div>
                <Button href="/dashboard/loans/apply">
                    <IconPlus className="h-4.5 w-4.5 shrink-0 ltr:mr-2 rtl:ml-2" />
                    Apply for Loan
                </Button>
            </div>

            <div className="mt-3">
                <LoanStatsCards loans={myLoans} />
            </div>

            {error && (
                <div className="mt-3">
                    <Alert variant="danger" onClose={() => dispatch(clearLoansError())}>
                        {error}
                    </Alert>
                </div>
            )}

            <div className="mt-4 flex flex-wrap gap-2">
                {filterTabs.map((tab) => (
                    <button
                        key={tab.key}
                        type="button"
                        onClick={() => setStatusFilter(tab.key)}
                        className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
                            statusFilter === tab.key ? 'bg-primary text-white shadow-md shadow-primary/30' : 'bg-white-light text-white-dark hover:bg-white-light/70 dark:bg-[#1b2e4b]'
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            <DataGrid
                className="mt-3"
                title="My Loan Applications"
                count={filteredLoans.length}
                exportable
                columns={[
                    {
                        header: 'Actions',
                        accessor: (row: Loan) => <RowActionsMenu onView={() => router.push(`/dashboard/loans/${row.id}`)} label={`Actions for ${row.loanType} loan`} />,
                    },
                    { header: 'Loan Type', accessor: (row: Loan) => loanTypeLabels[row.loanType] },
                    { header: 'Amount Applied', accessor: (row: Loan) => `KES ${row.amountApplied.toLocaleString()}` },
                    {
                        header: 'Outstanding Balance',
                        accessor: (row: Loan) => (row.outstandingBalance !== undefined ? `KES ${row.outstandingBalance.toLocaleString(undefined, { maximumFractionDigits: 0 })}` : '—'),
                    },
                    { header: 'Repayment Period', accessor: (row: Loan) => `${row.repaymentPeriodMonths} months` },
                    { header: 'Review Stage', accessor: (row: Loan) => row.currentStageName || '—' },
                    {
                        header: 'Loan Status',
                        accessor: (row: Loan) => (row.loanStatus ? <Badge variant={loanStatusVariant[row.loanStatus]}>{loanStatusLabels[row.loanStatus]}</Badge> : '—'),
                    },
                    { header: 'Applied', accessor: (row: Loan) => new Date(row.appliedAt).toLocaleDateString() },
                ]}
                data={filteredLoans}
                rowKey={(row) => row.id}
                searchKeys={['loanType', 'purpose']}
                loading={loading}
                emptyMessage="You haven't applied for a loan yet"
                onRefresh={() => dispatch(fetchMyLoans())}
            />
        </div>
    );
};

export default MyLoansPage;
