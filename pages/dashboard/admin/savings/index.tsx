import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchSavingsAccounts, clearSavingsAccountsError, SavingsAccount, SavingsAccountStatus } from '@/store/slices/savings/savingsAccountsSlice';
import Breadcrumb from '@/components/ui/Breadcrumb';
import DataGrid from '@/components/ui/DataGrid';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import Badge from '@/components/ui/Badge';
import RowActionsMenu from '@/components/ui/RowActionsMenu';
import PageLoader from '@/components/ui/PageLoader';
import SavingsStatsCards from '@/components/savings/SavingsStatsCards';
import IconSettings from '@/components/Icon/IconSettings';

const productTypeLabels: Record<string, string> = {
    ORDINARY: 'Ordinary Savings',
    SHARE_CAPITAL: 'Share Capital',
    FIXED_DEPOSIT: 'Fixed Deposit',
    SPECIAL: 'Special Savings',
};

const statusVariant: Record<SavingsAccountStatus, 'success' | 'secondary' | 'warning'> = {
    ACTIVE: 'success',
    DORMANT: 'warning',
    CLOSED: 'secondary',
};

const filterTabs: { key: 'ALL' | SavingsAccountStatus; label: string }[] = [
    { key: 'ALL', label: 'All' },
    { key: 'ACTIVE', label: 'Active' },
    { key: 'DORMANT', label: 'Dormant' },
    { key: 'CLOSED', label: 'Closed' },
];

// Staff oversight — every savings account in the Sacco, regardless of who opened it.
// Recording deposits/withdrawals and closing an account happen from the account's detail
// page. The backend restricts GET /savings to TELLER/LOAN_OFFICER/ACCOUNTANT/
// BRANCH_MANAGER/SYSTEM_ADMINISTRATOR, so a non-staff visitor will just see the error below.
const AllSavingsAccountsPage = () => {
    const dispatch = useAppDispatch();
    const router = useRouter();
    const { accounts, loading, error } = useAppSelector((state) => state.savingsAccounts);
    const [statusFilter, setStatusFilter] = useState<'ALL' | SavingsAccountStatus>('ALL');

    useEffect(() => {
        dispatch(fetchSavingsAccounts());
    }, [dispatch]);

    const filteredAccounts = useMemo(() => (statusFilter === 'ALL' ? accounts : accounts.filter((account) => account.status === statusFilter)), [accounts, statusFilter]);

    if (loading && accounts.length === 0) {
        return <PageLoader />;
    }

    return (
        <div>
            <Breadcrumb />

            <div className="mt-3 flex flex-wrap items-start justify-between gap-2">
                <div>
                    <h1 className="text-xl font-bold">All Savings Accounts</h1>
                    <p className="text-white-dark">Every savings account in the Sacco — record deposits, withdrawals, or close an account from its detail page</p>
                </div>
                <Button variant="outline-primary" href="/dashboard/admin/savings/products">
                    <IconSettings className="h-4 w-4 shrink-0 ltr:mr-2 rtl:ml-2" />
                    Manage Products
                </Button>
            </div>

            <div className="mt-3">
                <SavingsStatsCards accounts={accounts} />
            </div>

            {error && (
                <div className="mt-3">
                    <Alert variant="danger" onClose={() => dispatch(clearSavingsAccountsError())}>
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
                title="Savings Accounts"
                count={filteredAccounts.length}
                exportable
                columns={[
                    {
                        header: 'Actions',
                        accessor: (row: SavingsAccount) => <RowActionsMenu onView={() => router.push(`/dashboard/savings/${row.id}`)} label={`Actions for ${row.accountNumber}`} />,
                    },
                    { header: 'Account Number', accessor: (row: SavingsAccount) => row.accountNumber },
                    { header: 'Member', accessor: (row: SavingsAccount) => `${row.memberName}${row.memberNumber ? ` (${row.memberNumber})` : ''}` },
                    { header: 'Product', accessor: (row: SavingsAccount) => productTypeLabels[row.savingsProductType] || row.savingsProductName },
                    { header: 'Balance', accessor: (row: SavingsAccount) => `KES ${row.balance.toLocaleString(undefined, { maximumFractionDigits: 0 })}` },
                    { header: 'Status', accessor: (row: SavingsAccount) => <Badge variant={statusVariant[row.status]}>{row.status}</Badge> },
                    { header: 'Opened', accessor: (row: SavingsAccount) => new Date(row.openedAt).toLocaleDateString() },
                ]}
                data={filteredAccounts}
                rowKey={(row) => row.id}
                searchKeys={['accountNumber', 'memberName', 'memberNumber']}
                loading={loading}
                emptyMessage="No savings accounts in the system yet"
                onRefresh={() => dispatch(fetchSavingsAccounts())}
            />
        </div>
    );
};

export default AllSavingsAccountsPage;
