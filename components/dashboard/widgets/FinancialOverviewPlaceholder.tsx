import Card from '@/components/ui/Card';
import StatCard from '@/components/ui/StatCard';
import SampleDataBadge from '@/components/dashboard/SampleDataBadge';
import IconCashBanknotes from '@/components/Icon/IconCashBanknotes';
import IconTrendingUp from '@/components/Icon/IconTrendingUp';
import { mockPortfolioSummary } from '@/utils/mockFinancialData';

const formatKES = (amount: number) => `KES ${amount.toLocaleString('en-US')}`;

const FinancialOverviewPlaceholder = () => (
    <Card title="Financial Overview" actions={<SampleDataBadge />}>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <StatCard label="Loans Outstanding" value={formatKES(mockPortfolioSummary.totalLoansOutstanding)} icon={<IconCashBanknotes className="h-4 w-4" />} />
            <StatCard
                label="Loan Repayment Rate"
                value={`${Math.round(mockPortfolioSummary.loanRepaymentRate * 100)}%`}
                icon={<IconTrendingUp className="h-4 w-4" />}
                iconClassName="bg-info-light text-info"
            />
        </div>
    </Card>
);

export default FinancialOverviewPlaceholder;
