// Illustrative placeholder data only — no loans/savings/accounting backend exists yet.
// Every consumer of this module must render a <SampleDataBadge /> next to it so nobody
// mistakes these figures for real numbers. Replace this file (and its call sites) once
// real endpoints ship.

export const MOCK_DATA_DISCLAIMER = 'Sample data — preview only';

export const mockMembershipTrend = [
    { month: 'Jan', members: 412 },
    { month: 'Feb', members: 438 },
    { month: 'Mar', members: 455 },
    { month: 'Apr', members: 471 },
    { month: 'May', members: 502 },
    { month: 'Jun', members: 519 },
    { month: 'Jul', members: 548 },
];

export const mockLoanDisbursement = [
    { month: 'Jan', disbursed: 1_450_000 },
    { month: 'Feb', disbursed: 1_620_000 },
    { month: 'Mar', disbursed: 1_180_000 },
    { month: 'Apr', disbursed: 1_940_000 },
    { month: 'May', disbursed: 2_260_000 },
    { month: 'Jun', disbursed: 1_875_000 },
    { month: 'Jul', disbursed: 2_410_000 },
];

export const mockPortfolioSummary = {
    totalLoansOutstanding: 12_400_000,
    totalSavingsBalance: 18_900_000,
    loanRepaymentRate: 0.94,
};
