import { useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchLoans, clearLoansError, Loan, LoanType } from '@/store/slices/loans/loansSlice';
import Breadcrumb from '@/components/ui/Breadcrumb';
import StatCard from '@/components/ui/StatCard';
import DataGrid from '@/components/ui/DataGrid';
import Alert from '@/components/ui/Alert';
import Badge from '@/components/ui/Badge';
import RowActionsMenu from '@/components/ui/RowActionsMenu';
import IconCashBanknotes from '@/components/Icon/IconCashBanknotes';
import IconClock from '@/components/Icon/IconClock';
import IconXCircle from '@/components/Icon/IconXCircle';

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

// Staff oversight — every loan application in the Sacco, regardless of who applied.
// Actually reviewing/approving one happens in the workflow In-Tray, not here; this is
// a monitoring view. The backend restricts GET /loans to LOAN_OFFICER/BRANCH_MANAGER/
// SYSTEM_ADMINISTRATOR, so a non-staff visitor will just see the error below.
const AllLoanApplicationsPage = () => {
    const dispatch = useAppDispatch();
    const router = useRouter();
    const { loans, loading, error } = useAppSelector((state) => state.loans);

    useEffect(() => {
        dispatch(fetchLoans());
    }, [dispatch]);

    const counts = useMemo(
        () => ({
            total: loans.length,
            pending: loans.filter((loan) => loan.status === 'INITIATED' || loan.status === 'IN_PROGRESS').length,
            rejected: loans.filter((loan) => loan.status === 'REJECTED').length,
        }),
        [loans]
    );

    return (
        <div>
            <Breadcrumb />

            <div className="mt-3">
                <h1 className="text-xl font-bold">All Loan Applications</h1>
                <p className="text-white-dark">Every loan application in the Sacco — monitoring only, review happens from the In-Tray</p>
            </div>

            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                <StatCard label="Total Applications" value={counts.total} icon={<IconCashBanknotes className="h-4 w-4" />} />
                <StatCard label="Pending" value={counts.pending} icon={<IconClock className="h-4 w-4" />} iconClassName="bg-warning-light text-warning" />
                <StatCard label="Rejected" value={counts.rejected} icon={<IconXCircle className="h-4 w-4" />} iconClassName="bg-danger-light text-danger" />
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
                title="Loan Applications"
                count={loans.length}
                exportable
                columns={[
                    {
                        header: 'Actions',
                        accessor: (row: Loan) => <RowActionsMenu onView={() => router.push(`/dashboard/loans/${row.id}`)} label={`Actions for ${row.memberName}'s loan`} />,
                    },
                    { header: 'Member', accessor: (row: Loan) => `${row.memberName}${row.memberNumber ? ` (${row.memberNumber})` : ''}` },
                    { header: 'Loan Type', accessor: (row: Loan) => loanTypeLabels[row.loanType] },
                    { header: 'Amount Applied', accessor: (row: Loan) => row.amountApplied.toLocaleString() },
                    { header: 'Current Stage', accessor: (row: Loan) => row.currentStageName || '—' },
                    {
                        header: 'Status',
                        accessor: (row: Loan) => (row.status ? <Badge variant={statusBadgeVariant[row.status]}>{row.status.replace('_', ' ')}</Badge> : '—'),
                    },
                    { header: 'Applied', accessor: (row: Loan) => new Date(row.appliedAt).toLocaleDateString() },
                ]}
                data={loans}
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
