import { useEffect, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchLoans, LoanType } from '@/store/slices/loans/loansSlice';
import { buildAmortizationSchedule } from '@/utils/loanCalculations';
import Breadcrumb from '@/components/ui/Breadcrumb';
import Card from '@/components/ui/Card';
import StatCard from '@/components/ui/StatCard';
import PageLoader from '@/components/ui/PageLoader';
import AreaTrendChart from '@/components/dashboard/charts/AreaTrendChart';
import DonutChart from '@/components/dashboard/charts/DonutChart';
import SimpleBarChart from '@/components/dashboard/charts/SimpleBarChart';
import { CHART_COLORS } from '@/components/dashboard/charts/chartColors';
import IconCashBanknotes from '@/components/Icon/IconCashBanknotes';
import IconCreditCard from '@/components/Icon/IconCreditCard';
import IconChartSquare from '@/components/Icon/IconChartSquare';
import IconInfoTriangle from '@/components/Icon/IconInfoTriangle';

const loanTypeLabels: Record<LoanType, string> = {
    NORMAL: 'Normal',
    DEVELOPMENT: 'Development',
    EMERGENCY: 'Emergency',
    SCHOOL_FEES: 'School Fees',
};

// Fixed categorical order/color per loan type — matches the accent colors used on the
// product cards and wizard elsewhere, so "Development" is always the same hue everywhere.
const typeChartColor: Record<LoanType, string> = {
    NORMAL: CHART_COLORS.primary,
    DEVELOPMENT: CHART_COLORS.info,
    EMERGENCY: CHART_COLORS.danger,
    SCHOOL_FEES: CHART_COLORS.success,
};

const MONTHS_BACK = 6;
const DAY_MS = 24 * 60 * 60 * 1000;

// Every figure on this page is derived from real Loan fields (disbursedAmount,
// disbursedAt, totalRepaid, outstandingBalance, interestRate) already returned by
// LoanResponse — collection efficiency and aging are computed client-side by rebuilding
// each disbursed loan's amortization schedule and comparing it against its real
// totalRepaid, the same PAID/OVERDUE logic used by AmortizationScheduleTable.
const LoanAnalyticsPage = () => {
    const dispatch = useAppDispatch();
    const { loans, loading } = useAppSelector((state) => state.loans);

    useEffect(() => {
        dispatch(fetchLoans());
    }, [dispatch]);

    const totals = useMemo(
        () => ({
            disbursed: loans.reduce((sum, l) => sum + (l.disbursedAmount || 0), 0),
            collected: loans.reduce((sum, l) => sum + (l.totalRepaid || 0), 0),
            outstanding: loans.reduce((sum, l) => sum + (l.outstandingBalance || 0), 0),
        }),
        [loans]
    );

    const portfolioByType = useMemo(() => {
        const byType: Record<LoanType, number> = { NORMAL: 0, DEVELOPMENT: 0, EMERGENCY: 0, SCHOOL_FEES: 0 };
        loans.forEach((loan) => {
            byType[loan.loanType] += loan.outstandingBalance || 0;
        });
        return (Object.entries(byType) as [LoanType, number][]).filter(([, value]) => value > 0).map(([type, value]) => ({ label: loanTypeLabels[type], value, color: typeChartColor[type] }));
    }, [loans]);

    const { disbursementTrend, collectionEfficiency, agingBuckets, totalOverdue } = useMemo(() => {
        const now = new Date();
        const months = Array.from({ length: MONTHS_BACK }, (_, i) => {
            const d = new Date(now.getFullYear(), now.getMonth() - (MONTHS_BACK - 1 - i), 1);
            return { key: `${d.getFullYear()}-${d.getMonth()}`, label: d.toLocaleDateString(undefined, { month: 'short' }) };
        });
        const disbursedByMonth = new Map(months.map((m) => [m.key, 0]));
        const dueByMonth = new Map(months.map((m) => [m.key, 0]));
        const collectedByMonth = new Map(months.map((m) => [m.key, 0]));
        const buckets = [
            { label: '0-30 days', min: 0, max: 30, amount: 0 },
            { label: '31-60 days', min: 31, max: 60, amount: 0 },
            { label: '61-90 days', min: 61, max: 90, amount: 0 },
            { label: '90+ days', min: 91, max: Infinity, amount: 0 },
        ];
        let overdue = 0;

        loans.forEach((loan) => {
            if (!loan.disbursedAt || !loan.disbursedAmount) return;

            const disbursedDate = new Date(loan.disbursedAt);
            const disbursedKey = `${disbursedDate.getFullYear()}-${disbursedDate.getMonth()}`;
            if (disbursedByMonth.has(disbursedKey)) disbursedByMonth.set(disbursedKey, disbursedByMonth.get(disbursedKey)! + loan.disbursedAmount);

            const schedule = buildAmortizationSchedule(loan.disbursedAmount, loan.interestRate || 0, loan.repaymentPeriodMonths, disbursedDate);
            const totalRepaid = loan.totalRepaid || 0;
            let cumulative = 0;

            schedule.forEach((row) => {
                cumulative += row.installment;
                const isPaid = cumulative <= totalRepaid;
                const dueKey = `${row.dueDate.getFullYear()}-${row.dueDate.getMonth()}`;

                if (dueByMonth.has(dueKey)) {
                    dueByMonth.set(dueKey, dueByMonth.get(dueKey)! + row.installment);
                    if (isPaid) collectedByMonth.set(dueKey, collectedByMonth.get(dueKey)! + row.installment);
                }

                if (!isPaid && row.dueDate < now) {
                    const daysOverdue = Math.floor((now.getTime() - row.dueDate.getTime()) / DAY_MS);
                    overdue += row.installment;
                    const bucket = buckets.find((b) => daysOverdue >= b.min && daysOverdue <= b.max) || buckets[buckets.length - 1];
                    bucket.amount += row.installment;
                }
            });
        });

        return {
            disbursementTrend: months.map((m) => ({ label: m.label, disbursed: disbursedByMonth.get(m.key) || 0 })),
            collectionEfficiency: months.map((m) => {
                const due = dueByMonth.get(m.key) || 0;
                const collected = collectedByMonth.get(m.key) || 0;
                return { label: m.label, rate: due > 0 ? Math.round((collected / due) * 100) : 0 };
            }),
            agingBuckets: buckets.map((b) => ({ label: b.label, amount: Math.round(b.amount) })),
            totalOverdue: overdue,
        };
    }, [loans]);

    const portfolioAtRisk = totals.outstanding > 0 ? (totalOverdue / totals.outstanding) * 100 : 0;

    if (loading && loans.length === 0) {
        return <PageLoader />;
    }

    return (
        <div>
            <Breadcrumb items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Loans', href: '/dashboard/admin/loans' }, { label: 'Analytics' }]} />

            <div className="mt-3">
                <h1 className="text-xl font-bold">Loan Portfolio Analytics</h1>
                <p className="text-white-dark">Disbursement trends, portfolio composition, collections, and overdue exposure across the whole loan book</p>
            </div>

            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard label="Total Disbursed" value={`KES ${totals.disbursed.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} icon={<IconCashBanknotes className="h-4 w-4" />} />
                <StatCard
                    label="Total Collected"
                    value={`KES ${totals.collected.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
                    icon={<IconCreditCard className="h-4 w-4" />}
                    iconClassName="bg-success-light text-success"
                />
                <StatCard
                    label="Outstanding Balance"
                    value={`KES ${totals.outstanding.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
                    icon={<IconChartSquare className="h-4 w-4" />}
                    iconClassName="bg-info-light text-info"
                />
                <StatCard
                    label="Portfolio at Risk"
                    value={`${portfolioAtRisk.toFixed(1)}%`}
                    helperText="Overdue balance / outstanding balance"
                    icon={<IconInfoTriangle className="h-4 w-4" />}
                    iconClassName="bg-danger-light text-danger"
                />
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
                <Card title="Disbursement Trend">
                    {disbursementTrend.every((m) => m.disbursed === 0) ? (
                        <p className="py-10 text-center text-sm text-white-dark">No disbursements recorded in the last {MONTHS_BACK} months</p>
                    ) : (
                        <AreaTrendChart data={disbursementTrend} xKey="label" dataKey="disbursed" color={CHART_COLORS.info} height={240} />
                    )}
                </Card>

                <Card title="Portfolio Distribution by Loan Type">
                    {portfolioByType.length === 0 ? <p className="py-10 text-center text-sm text-white-dark">No outstanding balances yet</p> : <DonutChart data={portfolioByType} height={240} />}
                </Card>

                <Card title="Collection Efficiency">
                    <p className="mb-2 text-xs text-white-dark">Share of each month&apos;s due installments actually collected</p>
                    <SimpleBarChart data={collectionEfficiency} xKey="label" dataKey="rate" color={CHART_COLORS.success} height={220} />
                </Card>

                <Card title="Aging Analysis — Overdue Amounts">
                    {agingBuckets.every((b) => b.amount === 0) ? (
                        <p className="py-10 text-center text-sm text-white-dark">No overdue installments — portfolio is current</p>
                    ) : (
                        <SimpleBarChart data={agingBuckets} xKey="label" dataKey="amount" color={CHART_COLORS.danger} height={220} />
                    )}
                </Card>
            </div>
        </div>
    );
};

export default LoanAnalyticsPage;
