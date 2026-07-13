import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { openSavingsAccount } from '@/store/slices/savings/savingsAccountsSlice';
import { fetchSavingsProducts } from '@/store/slices/savings/savingsProductsSlice';
import { showToast } from '@/store/slices/ui/toastSlice';
import Breadcrumb from '@/components/ui/Breadcrumb';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Spinner from '@/components/ui/Spinner';
import SavingsProductCard from '@/components/savings/SavingsProductCard';
import IconArrowLeft from '@/components/Icon/IconArrowLeft';

// Opening a savings account is a much shorter flow than applying for a loan — no
// approval workflow, so it's a single form rather than a multi-step wizard: pick a
// product, optionally fund it, submit.
const OpenSavingsAccountPage = () => {
    const dispatch = useAppDispatch();
    const router = useRouter();
    const { opening } = useAppSelector((state) => state.savingsAccounts);
    const { products, loading: productsLoading } = useAppSelector((state) => state.savingsProducts);

    const [productId, setProductId] = useState<string | null>(null);
    const [openingDeposit, setOpeningDeposit] = useState<number>(0);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (products.length === 0) dispatch(fetchSavingsProducts());
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const activeProducts = useMemo(() => products.filter((p) => p.active), [products]);
    const selectedProduct = useMemo(() => products.find((p) => p.id === productId) || null, [products, productId]);

    const selectProduct = (id: string) => {
        const product = products.find((p) => p.id === id);
        if (!product) return;
        setProductId(id);
        setOpeningDeposit(product.minimumOpeningBalance);
    };

    const meetsMinimum = !selectedProduct || openingDeposit >= selectedProduct.minimumOpeningBalance;

    const handleSubmit = async () => {
        if (!selectedProduct) return;
        setSubmitting(true);
        try {
            const account = await dispatch(
                openSavingsAccount({ savingsProductId: selectedProduct.id, openingDeposit: openingDeposit || undefined })
            ).unwrap();
            dispatch(showToast({ variant: 'success', message: 'Savings account opened successfully' }));
            router.push(`/dashboard/savings/${account.id}`);
        } catch (err) {
            dispatch(showToast({ variant: 'danger', message: (err as { message?: string })?.message || 'Unable to open savings account' }));
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div>
            <Breadcrumb items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Savings', href: '/dashboard/savings' }, { label: 'Open Account' }]} />

            <div className="mt-3 flex flex-wrap items-start justify-between gap-2">
                <div>
                    <h1 className="text-xl font-bold">Open a Savings Account</h1>
                    <p className="text-white-dark">Choose a product — the account activates immediately, no approval needed</p>
                </div>
                <Button variant="outline-primary" href="/dashboard/savings">
                    <IconArrowLeft className="h-4 w-4 shrink-0 ltr:mr-2 rtl:ml-2" />
                    Back to My Savings
                </Button>
            </div>

            <div className="panel mt-4">
                <h5 className="mb-1 text-lg font-semibold">Choose a Savings Product</h5>
                <p className="mb-4 text-sm text-white-dark">Ordinary savings can be withdrawn on demand; share capital and fixed deposits typically can&apos;t.</p>

                {productsLoading ? (
                    <div className="flex justify-center py-10">
                        <Spinner className="h-6 w-6" />
                    </div>
                ) : activeProducts.length === 0 ? (
                    <p className="text-sm text-white-dark">No savings products are available right now — please contact your branch.</p>
                ) : (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        {activeProducts.map((product) => (
                            <SavingsProductCard key={product.id} product={product} selected={product.id === productId} onSelect={() => selectProduct(product.id)} />
                        ))}
                    </div>
                )}

                {selectedProduct && (
                    <div className="mx-auto mt-8 max-w-md border-t border-white-light pt-6 dark:border-white/10">
                        <Input
                            id="openingDeposit"
                            type="number"
                            min={0}
                            label="Opening Deposit (KES)"
                            value={openingDeposit || ''}
                            onChange={(e) => setOpeningDeposit(Number(e.target.value))}
                            helperText={
                                selectedProduct.minimumOpeningBalance > 0
                                    ? `Minimum opening balance for ${selectedProduct.name}: KES ${selectedProduct.minimumOpeningBalance.toLocaleString()}`
                                    : 'No minimum opening balance required for this product'
                            }
                        />
                        {!meetsMinimum && <p className="mt-1 text-xs text-danger">Opening deposit is below this product&apos;s minimum</p>}

                        <div className="mt-6 flex justify-end">
                            <Button onClick={handleSubmit} disabled={submitting || opening || !meetsMinimum}>
                                {(submitting || opening) && <Spinner className="h-4 w-4 shrink-0 ltr:mr-2 rtl:ml-2" />}
                                {submitting || opening ? 'Opening…' : 'Open Account'}
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default OpenSavingsAccountPage;
