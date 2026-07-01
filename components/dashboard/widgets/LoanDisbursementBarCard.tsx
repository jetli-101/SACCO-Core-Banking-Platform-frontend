import Card from '@/components/ui/Card';
import SampleDataBadge from '@/components/dashboard/SampleDataBadge';
import SimpleBarChart from '@/components/dashboard/charts/SimpleBarChart';
import { mockLoanDisbursement } from '@/utils/mockFinancialData';

const LoanDisbursementBarCard = () => (
    <Card title="Loan Disbursement" actions={<SampleDataBadge />}>
        <SimpleBarChart data={mockLoanDisbursement} xKey="month" dataKey="disbursed" height={220} />
    </Card>
);

export default LoanDisbursementBarCard;
