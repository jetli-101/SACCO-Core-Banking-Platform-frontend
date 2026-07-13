import Card from '@/components/ui/Card';
import StatCard from '@/components/ui/StatCard';
import IconCashBanknotes from '@/components/Icon/IconCashBanknotes';
import IconStar from '@/components/Icon/IconStar';
import { SavingsAccount } from '@/store/slices/savings/savingsAccountsSlice';

interface SavingsBalanceCardProps {
    accounts: SavingsAccount[];
}

const formatKES = (amount: number) => `KES ${amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

// Real savings totals, summed from the accounts already loaded into state — replaces the
// "Savings Balance" figure that used to live in FinancialOverviewPlaceholder's mock data
// now that the Savings module tracks real balances.
const SavingsBalanceCard = ({ accounts }: SavingsBalanceCardProps) => {
    const totalBalance = accounts.reduce((sum, account) => sum + account.balance, 0);
    const shareCapitalBalance = accounts.filter((account) => account.savingsProductType === 'SHARE_CAPITAL').reduce((sum, account) => sum + account.balance, 0);

    return (
        <Card title="Savings Overview">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <StatCard label="Total Savings Balance" value={formatKES(totalBalance)} icon={<IconCashBanknotes className="h-4 w-4" />} iconClassName="bg-success-light text-success" />
                <StatCard label="Share Capital" value={formatKES(shareCapitalBalance)} icon={<IconStar className="h-4 w-4" />} iconClassName="bg-warning-light text-warning" />
            </div>
        </Card>
    );
};

export default SavingsBalanceCard;
