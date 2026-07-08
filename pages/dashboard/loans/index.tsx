import { useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchMyLoans, clearLoansError, Loan, LoanType } from '@/store/slices/loans/loansSlice';
import Breadcrumb from '@/components/ui/Breadcrumb';
import StatCard from '@/components/ui/StatCard';
import DataGrid from '@/components/ui/DataGrid';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import Badge from '@/components/ui/Badge';
import RowActionsMenu from '@/components/ui/RowActionsMenu';
import IconPlus from '@/components/Icon/IconPlus';
import IconCashBanknotes from '@/components/Icon/IconCashBanknotes';
import IconClock from '@/components/Icon/IconClock';
import IconCircleCheck from '@/components/Icon/IconCircleCheck';

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

// Member self-service: my own loan applications only. Applying is its own page
// (/dashboard/loans/apply) and reviewing all applications is the staff-only
// /dashboard/admin/loans — kept separate so each screen has one job.
const MyLoansPage = () => {
    const dispatch = useAppDispatch();
    const router = useRouter();
    const { myLoans, loading, error } = useAppSelector((state) => state.loans);

    useEffect(() => {
        dispatch(fetchMyLoans());
    }, [dispatch]);

    const counts = useMemo(
        () => ({
            total: myLoans.length,
            pending: myLoans.filter((loan) => loan.status === 'INITIATED' || loan.status === 'IN_PROGRESS').length,
            disbursed: myLoans.filter((loan) => loan.status === 'COMPLETED').length,
        }),
        [myLoans]
    );

    return (
        <div>
            <Breadcrumb />

            <div className="mt-3 flex flex-wrap items-start justify-between gap-2">
                <div>
                    <h1 className="text-xl font-bold">My Loans</h1>
                    <p className="text-white-dark">Apply for a loan and track its progress through review and approval</p>
                </div>
                <Button href="/dashboard/loans/apply">
                    <IconPlus className="h-4.5 w-4.5 shrink-0 ltr:mr-2 rtl:ml-2" />
                    Apply for Loan
                </Button>
            </div>

            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                <StatCard label="My Applications" value={counts.total} icon={<IconCashBanknotes className="h-4 w-4" />} />
                <StatCard label="Pending" value={counts.pending} icon={<IconClock className="h-4 w-4" />} iconClassName="bg-warning-light text-warning" />
                <StatCard label="Disbursed" value={counts.disbursed} icon={<IconCircleCheck className="h-4 w-4" />} iconClassName="bg-success-light text-success" />
            </div>

            {error && (
                <div className="mt-3">
                    <Alert variant="danger" onClose={() => dispatch(clearLoansError())}>
                        {error}
                    </Alert>
                </div>
            )}

            <DataGrid
                className="mt-3"
                title="My Loan Applications"
                count={myLoans.length}
                columns={[
                    {
                        header: 'Actions',
                        accessor: (row: Loan) => <RowActionsMenu onView={() => router.push(`/dashboard/loans/${row.id}`)} label={`Actions for ${row.loanType} loan`} />,
                    },
                    { header: 'Loan Type', accessor: (row: Loan) => loanTypeLabels[row.loanType] },
                    { header: 'Amount Applied', accessor: (row: Loan) => row.amountApplied.toLocaleString() },
                    { header: 'Repayment Period', accessor: (row: Loan) => `${row.repaymentPeriodMonths} months` },
                    { header: 'Current Stage', accessor: (row: Loan) => row.currentStageName || '—' },
                    {
                        header: 'Status',
                        accessor: (row: Loan) => (row.status ? <Badge variant={statusBadgeVariant[row.status]}>{row.status.replace('_', ' ')}</Badge> : '—'),
                    },
                    { header: 'Applied', accessor: (row: Loan) => new Date(row.appliedAt).toLocaleDateString() },
                ]}
                data={myLoans}
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
