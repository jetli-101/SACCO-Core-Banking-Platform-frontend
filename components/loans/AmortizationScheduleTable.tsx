import { AmortizationRow } from '@/utils/loanCalculations';
import Badge from '@/components/ui/Badge';

interface AmortizationScheduleTableProps {
    rows: AmortizationRow[];
    totalRepaid: number;
}

type RowStatus = 'PAID' | 'OVERDUE' | 'UPCOMING';

const rowClass: Record<RowStatus, string> = {
    PAID: 'bg-success-light/40 dark:bg-success/10',
    OVERDUE: 'bg-danger-light/40 dark:bg-danger/10',
    UPCOMING: '',
};

// Color-coded projected amortization schedule — paid/upcoming/overdue is derived by
// comparing each installment's cumulative due amount against totalRepaid (the real sum of
// recorded repayments), same logic the backend uses to determine the loan's own status.
const AmortizationScheduleTable = ({ rows, totalRepaid }: AmortizationScheduleTableProps) => {
    const now = new Date();
    let cumulative = 0;

    return (
        <div className="table-responsive">
            <table>
                <thead>
                    <tr>
                        <th>#</th>
                        <th>Due Date</th>
                        <th>Principal</th>
                        <th>Interest</th>
                        <th>Installment</th>
                        <th>Closing Balance</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row) => {
                        cumulative += row.installment;
                        const status: RowStatus = cumulative <= totalRepaid ? 'PAID' : row.dueDate < now ? 'OVERDUE' : 'UPCOMING';
                        return (
                            <tr key={row.installmentNo} className={rowClass[status]}>
                                <td>{row.installmentNo}</td>
                                <td>{row.dueDate.toLocaleDateString()}</td>
                                <td>{row.principal.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                                <td>{row.interest.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                                <td className="font-semibold">{row.installment.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                                <td>{row.closingBalance.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                                <td>
                                    <Badge variant={status === 'PAID' ? 'success' : status === 'OVERDUE' ? 'danger' : 'secondary'} outline={status === 'UPCOMING'}>
                                        {status === 'PAID' ? 'Paid' : status === 'OVERDUE' ? 'Overdue' : 'Upcoming'}
                                    </Badge>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};

export default AmortizationScheduleTable;
