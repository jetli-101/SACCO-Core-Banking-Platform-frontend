import { useState } from 'react';
import { LoanApplicationPayload, LoanType } from '@/store/slices/loans/loansSlice';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import Spinner from '@/components/ui/Spinner';

const loanTypeLabels: Record<LoanType, string> = {
    NORMAL: 'Normal',
    DEVELOPMENT: 'Development',
    EMERGENCY: 'Emergency',
    SCHOOL_FEES: 'School Fees',
};

const emptyForm: LoanApplicationPayload = { loanType: 'NORMAL', amountApplied: 0, repaymentPeriodMonths: 12, purpose: '' };

interface LoanApplicationFormProps {
    submitting: boolean;
    onSubmit: (payload: LoanApplicationPayload) => void;
    onCancel?: () => void;
    submitLabel?: string;
}

// The loan application fields, extracted from any one page so both the dedicated
// Apply page and (later, if needed) a quick-apply modal can share the same form.
const LoanApplicationForm = ({ submitting, onSubmit, onCancel, submitLabel = 'Submit Application' }: LoanApplicationFormProps) => {
    const [form, setForm] = useState<LoanApplicationPayload>(emptyForm);

    const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault();
        onSubmit(form);
    };

    return (
        <form onSubmit={handleSubmit} className="max-w-lg space-y-4">
            <div className="w-full">
                <label htmlFor="loanType" className="mb-1.5 block text-sm font-semibold">
                    Loan Type *
                </label>
                <select id="loanType" className="form-select" value={form.loanType} onChange={(e) => setForm((prev) => ({ ...prev, loanType: e.target.value as LoanType }))}>
                    {Object.entries(loanTypeLabels).map(([value, label]) => (
                        <option key={value} value={value}>
                            {label}
                        </option>
                    ))}
                </select>
            </div>

            <Input
                id="amountApplied"
                type="number"
                min={1}
                label="Amount Applied (KES) *"
                value={form.amountApplied || ''}
                onChange={(e) => setForm((prev) => ({ ...prev, amountApplied: Number(e.target.value) }))}
                required
            />

            <Input
                id="repaymentPeriodMonths"
                type="number"
                min={1}
                label="Repayment Period (months) *"
                value={form.repaymentPeriodMonths || ''}
                onChange={(e) => setForm((prev) => ({ ...prev, repaymentPeriodMonths: Number(e.target.value) }))}
                required
            />

            <Textarea
                id="purpose"
                label="Purpose"
                rows={4}
                value={form.purpose}
                onChange={(e) => setForm((prev) => ({ ...prev, purpose: e.target.value }))}
                placeholder="What is this loan for?"
            />

            <div className="flex items-center justify-end gap-2 pt-2">
                {onCancel && (
                    <Button type="button" variant="outline-primary" onClick={onCancel}>
                        Cancel
                    </Button>
                )}
                <Button type="submit" disabled={submitting}>
                    {submitting && <Spinner className="h-4 w-4 shrink-0 ltr:mr-2 rtl:ml-2" />}
                    {submitting ? 'Submitting…' : submitLabel}
                </Button>
            </div>
        </form>
    );
};

export default LoanApplicationForm;
