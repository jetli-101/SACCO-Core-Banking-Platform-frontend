import { useRouter } from 'next/router';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { applyForLoan, LoanApplicationPayload } from '@/store/slices/loans/loansSlice';
import { showToast } from '@/store/slices/ui/toastSlice';
import Breadcrumb from '@/components/ui/Breadcrumb';
import Button from '@/components/ui/Button';
import LoanApplicationForm from '@/components/loans/LoanApplicationForm';
import IconArrowLeft from '@/components/Icon/IconArrowLeft';

const ApplyForLoanPage = () => {
    const dispatch = useAppDispatch();
    const router = useRouter();
    const { applying } = useAppSelector((state) => state.loans);

    const submit = async (payload: LoanApplicationPayload) => {
        try {
            const loan = await dispatch(applyForLoan(payload)).unwrap();
            dispatch(showToast({ variant: 'success', message: 'Loan application submitted successfully' }));
            router.push(`/dashboard/loans/${loan.id}`);
        } catch (err) {
            dispatch(showToast({ variant: 'danger', message: (err as { message?: string })?.message || 'Unable to submit loan application' }));
        }
    };

    return (
        <div>
            <Breadcrumb items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Loans', href: '/dashboard/loans' }, { label: 'Apply' }]} />

            <div className="mt-3 flex flex-wrap items-start justify-between gap-2">
                <div>
                    <h1 className="text-xl font-bold">Apply for a Loan</h1>
                    <p className="text-white-dark">Submit your application — it enters review as soon as you submit it</p>
                </div>
                <Button variant="outline-primary" href="/dashboard/loans">
                    <IconArrowLeft className="h-4 w-4 shrink-0 ltr:mr-2 rtl:ml-2" />
                    Back to My Loans
                </Button>
            </div>

            <div className="panel mt-4">
                <LoanApplicationForm submitting={applying} onSubmit={submit} onCancel={() => router.push('/dashboard/loans')} />
            </div>
        </div>
    );
};

export default ApplyForLoanPage;
