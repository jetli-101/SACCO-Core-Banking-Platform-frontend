import { SavingsProduct, SavingsProductType } from '@/store/slices/savings/savingsProductsSlice';
import IconCashBanknotes from '@/components/Icon/IconCashBanknotes';
import IconStar from '@/components/Icon/IconStar';
import IconClock from '@/components/Icon/IconClock';
import IconLock from '@/components/Icon/IconLock';
import IconCircleCheck from '@/components/Icon/IconCircleCheck';

const typeIcon: Record<SavingsProductType, typeof IconCashBanknotes> = {
    ORDINARY: IconCashBanknotes,
    SHARE_CAPITAL: IconStar,
    FIXED_DEPOSIT: IconClock,
    SPECIAL: IconLock,
};

const typeAccent: Record<SavingsProductType, string> = {
    ORDINARY: 'bg-primary-light text-primary',
    SHARE_CAPITAL: 'bg-warning-light text-warning',
    FIXED_DEPOSIT: 'bg-info-light text-info',
    SPECIAL: 'bg-success-light text-success',
};

interface SavingsProductCardProps {
    product: SavingsProduct;
    selected: boolean;
    onSelect: () => void;
}

// A single selectable card in the account-opening picker — mirrors LoanProductCard's
// selection UI so the two flows feel consistent.
const SavingsProductCard = ({ product, selected, onSelect }: SavingsProductCardProps) => {
    const Icon = typeIcon[product.savingsProductType];

    return (
        <button
            type="button"
            onClick={onSelect}
            className={`relative flex flex-col gap-3 rounded-xl border-2 p-4 text-left transition-all ${
                selected ? 'border-primary bg-primary-light/40 shadow-md dark:bg-primary/10' : 'border-white-light hover:border-primary/40 dark:border-white/10'
            }`}
        >
            {selected && (
                <span className="absolute right-3 top-3 text-primary">
                    <IconCircleCheck className="h-5 w-5" />
                </span>
            )}
            <span className={`grid h-11 w-11 place-content-center rounded-full ${typeAccent[product.savingsProductType]}`}>
                <Icon className="h-5 w-5" />
            </span>
            <div>
                <h5 className="font-semibold">{product.name}</h5>
                <p className="mt-0.5 text-xs text-white-dark">{product.description}</p>
            </div>
            <div className="mt-auto grid grid-cols-2 gap-2 border-t border-white-light pt-3 text-xs dark:border-white/10">
                <div>
                    <div className="text-white-dark">Interest Rate</div>
                    <div className="font-semibold">{product.interestRate}% p.a.</div>
                </div>
                <div>
                    <div className="text-white-dark">Withdrawals</div>
                    <div className="font-semibold">{product.withdrawable ? 'Allowed' : 'Locked'}</div>
                </div>
                <div className="col-span-2">
                    <div className="text-white-dark">Minimum Opening Balance</div>
                    <div className="font-semibold">KES {product.minimumOpeningBalance.toLocaleString()}</div>
                </div>
            </div>
        </button>
    );
};

export default SavingsProductCard;
