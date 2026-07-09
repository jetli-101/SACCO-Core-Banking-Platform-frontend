import Card from '@/components/ui/Card';
import SimpleBarChart from '@/components/dashboard/charts/SimpleBarChart';
import { Loan } from '@/store/slices/loans/loansSlice';

interface LoanDisbursementBarCardProps {
    loans: Loan[];
}

// Real disbursement totals for the last 6 months, grouped from each loan's own
// disbursedAt/disbursedAmount — no sample data, since the loan module now tracks both.
const LoanDisbursementBarCard = ({ loans }: LoanDisbursementBarCardProps) => {
    const now = new Date();
    const months = Array.from({ length: 6 }, (_, i) => {
        const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
        return { key: `${d.getFullYear()}-${d.getMonth()}`, label: d.toLocaleDateString(undefined, { month: 'short' }), disbursed: 0 };
    });

    loans.forEach((loan) => {
        if (!loan.disbursedAt || !loan.disbursedAmount) return;
        const d = new Date(loan.disbursedAt);
        const key = `${d.getFullYear()}-${d.getMonth()}`;
        const bucket = months.find((m) => m.key === key);
        if (bucket) bucket.disbursed += loan.disbursedAmount;
    });

    return (
        <Card title="Loan Disbursement">
            <SimpleBarChart data={months} xKey="label" dataKey="disbursed" height={220} />
        </Card>
    );
};

export default LoanDisbursementBarCard;
