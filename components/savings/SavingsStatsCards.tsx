import { SavingsAccount } from '@/store/slices/savings/savingsAccountsSlice';
import StatCard from '@/components/ui/StatCard';
import IconCashBanknotes from '@/components/Icon/IconCashBanknotes';
import IconCircleCheck from '@/components/Icon/IconCircleCheck';
import IconStar from '@/components/Icon/IconStar';
import IconChartSquare from '@/components/Icon/IconChartSquare';

interface SavingsStatsCardsProps {
    accounts: SavingsAccount[];
}

// KPI row shared by the member and admin savings dashboards — every figure here is real,
// computed from the accounts already loaded into state, not sample data.
const SavingsStatsCards = ({ accounts }: SavingsStatsCardsProps) => {
    const activeCount = accounts.filter((a) => a.status === 'ACTIVE').length;
    const shareCapitalBalance = accounts.filter((a) => a.savingsProductType === 'SHARE_CAPITAL').reduce((sum, a) => sum + a.balance, 0);
    const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0);

    return (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Total Accounts" value={accounts.length} icon={<IconCashBanknotes className="h-4 w-4" />} />
            <StatCard
                label="Active Accounts"
                value={activeCount}
                helperText="Open and in good standing"
                icon={<IconCircleCheck className="h-4 w-4" />}
                iconClassName="bg-success-light text-success"
            />
            <StatCard
                label="Share Capital"
                value={`KES ${shareCapitalBalance.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
                icon={<IconStar className="h-4 w-4" />}
                iconClassName="bg-warning-light text-warning"
            />
            <StatCard
                label="Total Savings Balance"
                value={`KES ${totalBalance.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
                icon={<IconChartSquare className="h-4 w-4" />}
                iconClassName="bg-info-light text-info"
            />
        </div>
    );
};

export default SavingsStatsCards;
