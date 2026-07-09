import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchLoans, clearLoansError, Loan, LoanType, LoanLifecycleStatus } from '@/store/slices/loans/loansSlice';
import Breadcrumb from '@/components/ui/Breadcrumb';
import DataGrid from '@/components/ui/DataGrid';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import Badge from '@/components/ui/Badge';
import RowActionsMenu from '@/components/ui/RowActionsMenu';
import PageLoader from '@/components/ui/PageLoader';
import LoanStatsCards from '@/components/loans/LoanStatsCards';
import IconSettings from '@/components/Icon/IconSettings';
import IconChartSquare from '@/components/Icon/IconChartSquare';

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

// Staff oversight — every loan application in the Sacco, regardless of who applied.
// Actually reviewing/approving one happens in the workflow In-Tray; disbursing and
// recording repayments happen from the loan detail page. This is the monitoring +
// navigation hub for all three. The backend restricts GET /loans to LOAN_OFFICER/
// BRANCH_MANAGER/SYSTEM_ADMINISTRATOR, so a non-staff visitor will just see the error below.
const AllLoanApplicationsPage = () => {
    const dispatch = useAppDispatch();
    const router = useRouter();
    const { loans, loading, error } = useAppSelector((state) => state.loans);
    const [statusFilter, setStatusFilter] = useState<'ALL' | LoanLifecycleStatus>('ALL');

    useEffect(() => {
        dispatch(fetchLoans());
    }, [dispatch]);

    const filteredLoans = useMemo(() => (statusFilter === 'ALL' ? loans : loans.filter((loan) => loan.loanStatus === statusFilter)), [loans, statusFilter]);

    if (loading && loans.length === 0) {
        return <PageLoader />;
    }

    return (
        <div>
            <Breadcrumb />

            <div className="mt-3 flex flex-wrap items-start justify-between gap-2">
                <div>
                    <h1 className="text-xl font-bold">All Loan Applications</h1>
                    <p className="text-white-dark">Every loan application in the Sacco — monitor status, then disburse or record repayments from a loan&apos;s detail page</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <Button variant="outline-primary" href="/dashboard/admin/loans/analytics">
                        <IconChartSquare className="h-4 w-4 shrink-0 ltr:mr-2 rtl:ml-2" />
                        Analytics
                    </Button>
                    <Button variant="outline-primary" href="/dashboard/admin/loans/products">
                        <IconSettings className="h-4 w-4 shrink-0 ltr:mr-2 rtl:ml-2" />
                        Manage Products
                    </Button>
                </div>
            </div>

            <div className="mt-3">
                <LoanStatsCards loans={loans} />
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
                title="Loan Applications"
                count={filteredLoans.length}
                exportable
                columns={[
                    {
                        header: 'Actions',
                        accessor: (row: Loan) => <RowActionsMenu onView={() => router.push(`/dashboard/loans/${row.id}`)} label={`Actions for ${row.memberName}'s loan`} />,
                    },
                    { header: 'Member', accessor: (row: Loan) => `${row.memberName}${row.memberNumber ? ` (${row.memberNumber})` : ''}` },
                    { header: 'Loan Type', accessor: (row: Loan) => loanTypeLabels[row.loanType] },
                    { header: 'Amount Applied', accessor: (row: Loan) => `KES ${row.amountApplied.toLocaleString()}` },
                    {
                        header: 'Outstanding Balance',
                        accessor: (row: Loan) => (row.outstandingBalance !== undefined ? `KES ${row.outstandingBalance.toLocaleString(undefined, { maximumFractionDigits: 0 })}` : '—'),
                    },
                    { header: 'Review Stage', accessor: (row: Loan) => row.currentStageName || '—' },
                    {
                        header: 'Loan Status',
                        accessor: (row: Loan) => (row.loanStatus ? <Badge variant={loanStatusVariant[row.loanStatus]}>{loanStatusLabels[row.loanStatus]}</Badge> : '—'),
                    },
                    { header: 'Applied', accessor: (row: Loan) => new Date(row.appliedAt).toLocaleDateString() },
                ]}
                data={filteredLoans}
                rowKey={(row) => row.id}
                searchKeys={['memberName', 'loanType']}
                loading={loading}
                emptyMessage="No loan applications in the system yet"
                onRefresh={() => dispatch(fetchLoans())}
            />
        </div>
    );
};

export default AllLoanApplicationsPage;
