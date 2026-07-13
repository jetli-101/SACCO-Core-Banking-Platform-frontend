import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { closeSavingsAccount, fetchSavingsAccountById } from '@/store/slices/savings/savingsAccountsSlice';
import { depositToSavingsAccount, fetchSavingsTransactions, withdrawFromSavingsAccount, SavingsTransactionPayload } from '@/store/slices/savings/savingsTransactionsSlice';
import { showToast } from '@/store/slices/ui/toastSlice';
import Breadcrumb from '@/components/ui/Breadcrumb';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Tabs from '@/components/ui/Tabs';
import Spinner from '@/components/ui/Spinner';
import PageLoader from '@/components/ui/PageLoader';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import ConfirmModal from '@/components/ui/ConfirmModal';
import IconArrowLeft from '@/components/Icon/IconArrowLeft';
import IconPlus from '@/components/Icon/IconPlus';
import IconMinus from '@/components/Icon/IconMinus';
import IconLock from '@/components/Icon/IconLock';

type TabKey = 'overview' | 'transactions';

const productTypeLabels: Record<string, string> = {
    ORDINARY: 'Ordinary Savings',
    SHARE_CAPITAL: 'Share Capital',
    FIXED_DEPOSIT: 'Fixed Deposit',
    SPECIAL: 'Special Savings',
};

const statusVariant: Record<string, 'success' | 'secondary' | 'warning'> = {
    ACTIVE: 'success',
    DORMANT: 'warning',
    CLOSED: 'secondary',
};

const transactionTypeVariant: Record<string, 'success' | 'danger'> = {
    DEPOSIT: 'success',
    WITHDRAWAL: 'danger',
};

const transactionMethods = ['CASH', 'MPESA', 'BANK_TRANSFER', 'CHEQUE'];

const STAFF_TRANSACTION_ROLES = ['ROLE_TELLER', 'ROLE_BRANCH_MANAGER', 'ROLE_SYSTEM_ADMINISTRATOR'];

const emptyTransactionForm: SavingsTransactionPayload = { amount: 0, method: 'CASH' };

const SavingsAccountDetailPage = () => {
    const router = useRouter();
    const dispatch = useAppDispatch();
    const id = typeof router.query.id === 'string' ? router.query.id : '';

    const { selectedAccount: account, selectedAccountLoading, closing } = useAppSelector((state) => state.savingsAccounts);
    const { transactions, saving: transactionSaving } = useAppSelector((state) => state.savingsTransactions);
    const authUser = useAppSelector((state) => state.auth.user);

    const [tab, setTab] = useState<TabKey>('overview');
    const [depositModalOpen, setDepositModalOpen] = useState(false);
    const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);
    const [closeConfirmOpen, setCloseConfirmOpen] = useState(false);
    const [transactionForm, setTransactionForm] = useState<SavingsTransactionPayload>(emptyTransactionForm);

    const isStaff = !!authUser?.roles?.some((role) => STAFF_TRANSACTION_ROLES.includes(role));

    useEffect(() => {
        if (id) {
            dispatch(fetchSavingsAccountById(id));
            dispatch(fetchSavingsTransactions(id));
        }
    }, [dispatch, id]);

    const tabItems = [
        { key: 'overview', label: 'Overview' },
        { key: 'transactions', label: 'Transactions' },
    ];

    // Both buttons share the same basic eligibility check; the backend is the source of
    // truth for the finer-grained rule (a non-withdrawable product like SHARE_CAPITAL
    // rejects a withdraw call with a clear error, surfaced via the toast below).
    const canTransact = isStaff && account?.status === 'ACTIVE';

    const submitDeposit = async () => {
        if (!id) return;
        try {
            await dispatch(depositToSavingsAccount({ accountId: id, payload: transactionForm })).unwrap();
            dispatch(fetchSavingsAccountById(id));
            dispatch(showToast({ variant: 'success', message: 'Deposit recorded successfully' }));
            setDepositModalOpen(false);
            setTransactionForm(emptyTransactionForm);
        } catch (err) {
            dispatch(showToast({ variant: 'danger', message: (err as { message?: string })?.message || 'Unable to record deposit' }));
        }
    };

    const submitWithdrawal = async () => {
        if (!id) return;
        try {
            await dispatch(withdrawFromSavingsAccount({ accountId: id, payload: transactionForm })).unwrap();
            dispatch(fetchSavingsAccountById(id));
            dispatch(showToast({ variant: 'success', message: 'Withdrawal recorded successfully' }));
            setWithdrawModalOpen(false);
            setTransactionForm(emptyTransactionForm);
        } catch (err) {
            dispatch(showToast({ variant: 'danger', message: (err as { message?: string })?.message || 'Unable to record withdrawal' }));
        }
    };

    const confirmClose = async () => {
        if (!id) return;
        try {
            await dispatch(closeSavingsAccount(id)).unwrap();
            dispatch(showToast({ variant: 'success', message: 'Savings account closed successfully' }));
            setCloseConfirmOpen(false);
        } catch (err) {
            dispatch(showToast({ variant: 'danger', message: (err as { message?: string })?.message || 'Unable to close account — balance must be zero' }));
        }
    };

    if (selectedAccountLoading || !account) {
        return <PageLoader />;
    }

    return (
        <div>
            <Breadcrumb items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Savings', href: '/dashboard/savings' }, { label: account.accountNumber }]} />

            <div className="mt-3 flex flex-wrap items-start justify-between gap-2">
                <div>
                    <h1 className="text-xl font-bold">{productTypeLabels[account.savingsProductType] || account.savingsProductName}</h1>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-white-dark">
                        <span>Account: {account.accountNumber}</span>
                        <span>Holder: {account.memberName}</span>
                        <Badge variant={statusVariant[account.status]}>{account.status}</Badge>
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    {canTransact && (
                        <Button variant="success" onClick={() => setDepositModalOpen(true)}>
                            <IconPlus className="h-4 w-4 shrink-0 ltr:mr-2 rtl:ml-2" />
                            Deposit
                        </Button>
                    )}
                    {canTransact && (
                        <Button variant="danger" onClick={() => setWithdrawModalOpen(true)}>
                            <IconMinus className="h-4 w-4 shrink-0 ltr:mr-2 rtl:ml-2" />
                            Withdraw
                        </Button>
                    )}
                    {isStaff && account.status !== 'CLOSED' && (
                        <Button variant="outline-danger" onClick={() => setCloseConfirmOpen(true)}>
                            <IconLock className="h-4 w-4 shrink-0 ltr:mr-2 rtl:ml-2" />
                            Close Account
                        </Button>
                    )}
                    <Button variant="outline-primary" href="/dashboard/savings">
                        <IconArrowLeft className="h-4 w-4 shrink-0 ltr:mr-2 rtl:ml-2" />
                        Back
                    </Button>
                </div>
            </div>

            <div className="panel mt-3">
                <Tabs items={tabItems} active={tab} onChange={(key) => setTab(key as TabKey)} />

                {tab === 'overview' && (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                            <p className="text-xs font-semibold uppercase text-white-dark">Account Details</p>
                            <p className="mt-1 text-sm">
                                <span className="text-white-dark">Product:</span> {account.savingsProductName}
                            </p>
                            <p className="text-sm">
                                <span className="text-white-dark">Account Number:</span> {account.accountNumber}
                            </p>
                            <p className="text-sm">
                                <span className="text-white-dark">Opened:</span> {new Date(account.openedAt).toLocaleString()}
                            </p>
                            {account.closedAt && (
                                <p className="text-sm">
                                    <span className="text-white-dark">Closed:</span> {new Date(account.closedAt).toLocaleString()}
                                </p>
                            )}
                        </div>
                        <div>
                            <p className="text-xs font-semibold uppercase text-white-dark">Balance</p>
                            <p className="mt-1 text-2xl font-bold text-primary">KES {account.balance.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                        </div>
                    </div>
                )}

                {tab === 'transactions' && (
                    <div>
                        {transactions.length === 0 ? (
                            <p className="py-6 text-center text-white-dark">No transactions recorded yet</p>
                        ) : (
                            <div className="table-responsive">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Date</th>
                                            <th>Type</th>
                                            <th>Amount</th>
                                            <th>Balance After</th>
                                            <th>Method</th>
                                            <th>Recorded By</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {transactions.map((transaction) => (
                                            <tr key={transaction.id}>
                                                <td>{new Date(transaction.transactedAt).toLocaleString()}</td>
                                                <td>
                                                    <Badge variant={transactionTypeVariant[transaction.type]}>{transaction.type}</Badge>
                                                </td>
                                                <td className="font-semibold">KES {transaction.amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                                                <td>KES {transaction.balanceAfter.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                                                <td>{transaction.method || '—'}</td>
                                                <td>{transaction.recordedByName || '—'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <Modal
                isOpen={depositModalOpen}
                onClose={() => setDepositModalOpen(false)}
                title="Record Deposit"
                footer={
                    <>
                        <Button variant="outline-primary" onClick={() => setDepositModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button variant="success" onClick={submitDeposit} disabled={transactionSaving || transactionForm.amount <= 0}>
                            {transactionSaving && <Spinner className="h-4 w-4 shrink-0 ltr:mr-2 rtl:ml-2" />}
                            {transactionSaving ? 'Recording…' : 'Record Deposit'}
                        </Button>
                    </>
                }
            >
                <TransactionFormFields form={transactionForm} setForm={setTransactionForm} />
            </Modal>

            <Modal
                isOpen={withdrawModalOpen}
                onClose={() => setWithdrawModalOpen(false)}
                title="Record Withdrawal"
                footer={
                    <>
                        <Button variant="outline-primary" onClick={() => setWithdrawModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button variant="danger" onClick={submitWithdrawal} disabled={transactionSaving || transactionForm.amount <= 0}>
                            {transactionSaving && <Spinner className="h-4 w-4 shrink-0 ltr:mr-2 rtl:ml-2" />}
                            {transactionSaving ? 'Recording…' : 'Record Withdrawal'}
                        </Button>
                    </>
                }
            >
                <TransactionFormFields form={transactionForm} setForm={setTransactionForm} />
            </Modal>

            <ConfirmModal
                isOpen={closeConfirmOpen}
                title="Close Savings Account"
                message="This account can only be closed once its balance is zero. This cannot be undone."
                variant="danger"
                loading={closing}
                onConfirm={confirmClose}
                onCancel={() => setCloseConfirmOpen(false)}
            />
        </div>
    );
};

interface TransactionFormFieldsProps {
    form: SavingsTransactionPayload;
    setForm: (updater: (prev: SavingsTransactionPayload) => SavingsTransactionPayload) => void;
}

const TransactionFormFields = ({ form, setForm }: TransactionFormFieldsProps) => (
    <div className="space-y-4">
        <Input id="transactionAmount" type="number" min={1} label="Amount (KES) *" value={form.amount || ''} onChange={(e) => setForm((prev) => ({ ...prev, amount: Number(e.target.value) }))} />
        <div>
            <label htmlFor="transactionMethod" className="mb-1.5 block text-sm font-semibold">
                Method
            </label>
            <select id="transactionMethod" className="form-select" value={form.method} onChange={(e) => setForm((prev) => ({ ...prev, method: e.target.value }))}>
                {transactionMethods.map((method) => (
                    <option key={method} value={method}>
                        {method.replace('_', ' ')}
                    </option>
                ))}
            </select>
        </div>
        <Input
            id="transactionNarrative"
            label="Narrative (optional)"
            value={form.narrative || ''}
            onChange={(e) => setForm((prev) => ({ ...prev, narrative: e.target.value }))}
        />
    </div>
);

export default SavingsAccountDetailPage;
