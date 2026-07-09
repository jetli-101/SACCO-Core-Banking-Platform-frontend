import { Loan } from '@/store/slices/loans/loansSlice';
import StatCard from '@/components/ui/StatCard';
import IconCashBanknotes from '@/components/Icon/IconCashBanknotes';
import IconCircleCheck from '@/components/Icon/IconCircleCheck';
import IconInfoTriangle from '@/components/Icon/IconInfoTriangle';
import IconChartSquare from '@/components/Icon/IconChartSquare';

interface LoanStatsCardsProps {
    loans: Loan[];
}

// KPI row shared by the member and admin loan dashboards — every figure here (including
// Overdue/Outstanding Balance) is real, computed server-side from disbursement +
// repayments, not sample data.
const LoanStatsCards = ({ loans }: LoanStatsCardsProps) => {
    const activeCount = loans.filter((l) => l.loanStatus === 'ACTIVE').length;
    const overdueCount = loans.filter((l) => l.loanStatus === 'DEFAULTED').length;
    const outstandingBalance = loans.reduce((sum, l) => sum + (l.outstandingBalance || 0), 0);

    return (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Total Loans" value={loans.length} icon={<IconCashBanknotes className="h-4 w-4" />} />
            <StatCard
                label="Active Loans"
                value={activeCount}
                helperText="Disbursed, being repaid"
                icon={<IconCircleCheck className="h-4 w-4" />}
                iconClassName="bg-success-light text-success"
            />
            <StatCard
                label="Overdue Loans"
                value={overdueCount}
                helperText="More than 30 days behind"
                icon={<IconInfoTriangle className="h-4 w-4" />}
                iconClassName="bg-danger-light text-danger"
            />
            <StatCard
                label="Outstanding Balance"
                value={`KES ${outstandingBalance.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
                icon={<IconChartSquare className="h-4 w-4" />}
                iconClassName="bg-info-light text-info"
            />
        </div>
    );
};

export default LoanStatsCards;
