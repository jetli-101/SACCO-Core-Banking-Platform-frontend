// Reducing-balance loan math shared by the application wizard's EMI preview and the
// loan detail page's amortization schedule. Pure functions over real loan terms
// (principal/annual rate/months) — no backend dependency, since the numbers are fully
// derivable from the fields the Loan entity already has.

export interface AmortizationRow {
    installmentNo: number;
    dueDate: Date;
    openingBalance: number;
    principal: number;
    interest: number;
    installment: number;
    closingBalance: number;
}

// Monthly installment for a reducing-balance loan. annualRatePercent=0 falls back to a
// straight-line split (principal / months) so a 0%-interest loan doesn't divide by zero.
export const calculateEmi = (principal: number, annualRatePercent: number, months: number): number => {
    if (months <= 0) return 0;
    if (!annualRatePercent) return principal / months;
    const monthlyRate = annualRatePercent / 12 / 100;
    const factor = Math.pow(1 + monthlyRate, months);
    return (principal * monthlyRate * factor) / (factor - 1);
};

export const totalInterest = (principal: number, annualRatePercent: number, months: number): number => calculateEmi(principal, annualRatePercent, months) * months - principal;

// Builds the full month-by-month schedule. `startDate` defaults to today (used for a
// not-yet-disbursed application's projection); pass the loan's actual disbursedAt for a
// real loan so due dates line up with when repayments would actually be owed.
export const buildAmortizationSchedule = (principal: number, annualRatePercent: number, months: number, startDate: Date = new Date()): AmortizationRow[] => {
    if (principal <= 0 || months <= 0) return [];
    const emi = calculateEmi(principal, annualRatePercent, months);
    const monthlyRate = annualRatePercent / 12 / 100;

    let balance = principal;
    const rows: AmortizationRow[] = [];
    for (let i = 1; i <= months; i++) {
        const interest = balance * monthlyRate;
        const principalComponent = Math.min(emi - interest, balance);
        const closingBalance = Math.max(balance - principalComponent, 0);
        const dueDate = new Date(startDate);
        dueDate.setMonth(dueDate.getMonth() + i);

        rows.push({
            installmentNo: i,
            dueDate,
            openingBalance: balance,
            principal: principalComponent,
            interest,
            installment: principalComponent + interest,
            closingBalance,
        });
        balance = closingBalance;
    }
    return rows;
};
