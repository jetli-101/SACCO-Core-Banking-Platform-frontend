import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchMySavingsAccounts, clearSavingsAccountsError, SavingsAccount } from '@/store/slices/savings/savingsAccountsSlice';
import Breadcrumb from '@/components/ui/Breadcrumb';
import DataGrid from '@/components/ui/DataGrid';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import Badge from '@/components/ui/Badge';
import RowActionsMenu from '@/components/ui/RowActionsMenu';
import SavingsStatsCards from '@/components/savings/SavingsStatsCards';
import IconPlus from '@/components/Icon/IconPlus';
import PageLoader from '@/components/ui/PageLoader';

const productTypeLabels: Record<string, string> = {
    ORDINARY: 'Ordinary Savings',
    SHARE_CAPITAL: 'Share Capital',
    FIXED_DEPOSIT: 'Fixed Deposit',
    SPECIAL: 'Special Savings',
};

const statusVariant: Record<string, 'success' | 'secondary' | 'warning'> = {
    ACTIVE: 'success',
    DORMANT: 'warning',
    CLOSED: 'secondary',
};

// Member self-service: my own savings accounts only. Opening one is its own page
// (/dashboard/savings/open) and reviewing every member's accounts + recording
// deposits/withdrawals is the staff-only /dashboard/admin/savings.
const MySavingsPage = () => {
    const dispatch = useAppDispatch();
    const router = useRouter();
    const { myAccounts, loading, error } = useAppSelector((state) => state.savingsAccounts);

    useEffect(() => {
        dispatch(fetchMySavingsAccounts());
    }, [dispatch]);

    if (loading && myAccounts.length === 0) {
        return <PageLoader />;
    }

    return (
        <div>
            <Breadcrumb />

            <div className="mt-3 flex flex-wrap items-start justify-between gap-2">
                <div>
                    <h1 className="text-xl font-bold">My Savings</h1>
                    <p className="text-white-dark">Your savings, share capital, and fixed deposit accounts</p>
                </div>
                <Button href="/dashboard/savings/open">
                    <IconPlus className="h-4.5 w-4.5 shrink-0 ltr:mr-2 rtl:ml-2" />
                    Open Account
                </Button>
            </div>

            <div className="mt-3">
                <SavingsStatsCards accounts={myAccounts} />
            </div>

            {error && (
                <div className="mt-3">
                    <Alert variant="danger" onClose={() => dispatch(clearSavingsAccountsError())}>
                        {error}
                    </Alert>
                </div>
            )}

            <DataGrid
                className="mt-4"
                title="My Savings Accounts"
                count={myAccounts.length}
                exportable
                columns={[
                    {
                        header: 'Actions',
                        accessor: (row: SavingsAccount) => <RowActionsMenu onView={() => router.push(`/dashboard/savings/${row.id}`)} label={`Actions for ${row.accountNumber}`} />,
                    },
                    { header: 'Account Number', accessor: (row: SavingsAccount) => row.accountNumber },
                    { header: 'Product', accessor: (row: SavingsAccount) => productTypeLabels[row.savingsProductType] || row.savingsProductName },
                    { header: 'Balance', accessor: (row: SavingsAccount) => `KES ${row.balance.toLocaleString(undefined, { maximumFractionDigits: 0 })}` },
                    { header: 'Status', accessor: (row: SavingsAccount) => <Badge variant={statusVariant[row.status]}>{row.status}</Badge> },
                    { header: 'Opened', accessor: (row: SavingsAccount) => new Date(row.openedAt).toLocaleDateString() },
                ]}
                data={myAccounts}
                rowKey={(row) => row.id}
                searchKeys={['accountNumber', 'savingsProductName']}
                loading={loading}
                emptyMessage="You don't have a savings account yet"
                onRefresh={() => dispatch(fetchMySavingsAccounts())}
            />
        </div>
    );
};

export default MySavingsPage;
