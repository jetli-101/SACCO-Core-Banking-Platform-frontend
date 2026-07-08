import type { WorkflowInterfacePayload } from '@/pages/pages/interfaceRegistry';
import DefaultStageActionPanel from '@/components/workflow/DefaultStageActionPanel';

// The Loans module's stage-action screen, registered under 'LOAN_REVIEW' in the interface
// registry — the first real (non-fallback) proof the registry works. Renders the loan's
// known fields nicely instead of a raw JSON dump, then delegates the actual action UI
// (transition buttons, checklist, comment, forward-to-person) to the same generic panel
// every other stage falls back to.
const LoanReviewPanel = (props: WorkflowInterfacePayload) => {
    const { data } = props;
    const loanType = typeof data.loanType === 'string' ? data.loanType : undefined;
    const amountApplied = Number(data.amountApplied) || 0;
    const repaymentPeriodMonths = data.repaymentPeriodMonths;
    const purpose = typeof data.purpose === 'string' ? data.purpose : undefined;
    const memberName = typeof data.memberName === 'string' ? data.memberName : undefined;
    const memberNumber = typeof data.memberNumber === 'string' ? data.memberNumber : undefined;

    return (
        <div className="space-y-3">
            <div className="rounded-md border border-white-light p-3 dark:border-white/10">
                <p className="text-xs font-semibold uppercase text-white-dark">Loan Summary</p>
                <div className="mt-2 grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
                    <div>
                        <div className="text-xs text-white-dark">Member</div>
                        <div className="font-semibold">
                            {memberName || '—'}
                            {memberNumber ? ` (${memberNumber})` : ''}
                        </div>
                    </div>
                    <div>
                        <div className="text-xs text-white-dark">Loan Type</div>
                        <div className="font-semibold">{loanType || '—'}</div>
                    </div>
                    <div>
                        <div className="text-xs text-white-dark">Amount Applied</div>
                        <div className="font-semibold">KES {amountApplied.toLocaleString()}</div>
                    </div>
                    <div>
                        <div className="text-xs text-white-dark">Repayment Period</div>
                        <div className="font-semibold">{repaymentPeriodMonths ? `${repaymentPeriodMonths} months` : '—'}</div>
                    </div>
                    {purpose && (
                        <div className="col-span-2 sm:col-span-3">
                            <div className="text-xs text-white-dark">Purpose</div>
                            <div className="font-semibold">{purpose}</div>
                        </div>
                    )}
                </div>
            </div>

            <DefaultStageActionPanel {...props} data={{}} />
        </div>
    );
};

export default LoanReviewPanel;
